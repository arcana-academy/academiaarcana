import * as fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  createSubjectBoundOAuthState,
  verifySubjectBoundOAuthState,
} from "./oauth-transaction-state";

/**
 * Property-based (fuzz) coverage for the OAuth transaction-state parser.
 *
 * `verifySubjectBoundOAuthState` consumes a fully attacker-controlled string
 * (the `state` value returned by an identity provider redirect), so it is a
 * natural fuzz target: for arbitrary generated input it must always answer
 * with a boolean, never throw, and only accept states that were actually
 * issued for the same subject and server secret. These properties run on
 * every Vitest invocation (including the Quality Gate workflow), which is
 * the fuzzing integration detected by OpenSSF Scorecard's Fuzzing check
 * (fast-check property-based testing for TypeScript).
 */

const nonBlankString = fc
  .string({ minLength: 1, maxLength: 64 })
  .filter((value) => value.trim().length > 0);

const CANONICAL_NONCE = /^[A-Za-z0-9_-]{43}$/;

function flipFirstCharacter(value: string): string {
  const replacement = value.startsWith("A") ? "B" : "A";
  return replacement + value.slice(1);
}

describe("OAuth transaction state (property-based)", () => {
  it("accepts every state it issues for the same subject and secret", () => {
    fc.assert(
      fc.property(nonBlankString, nonBlankString, (subjectId, secret) => {
        const state = createSubjectBoundOAuthState(subjectId, secret);
        expect(verifySubjectBoundOAuthState(state, subjectId, secret)).toBe(
          true,
        );
      }),
      { numRuns: 100 },
    );
  });

  it("never throws and always answers a boolean for arbitrary input", () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 512 }),
        fc.string({ maxLength: 64 }),
        fc.string({ maxLength: 64 }),
        (state, subjectId, secret) => {
          const result = verifySubjectBoundOAuthState(
            state,
            subjectId,
            secret,
          );
          expect(typeof result).toBe("boolean");
        },
      ),
      { numRuns: 500 },
    );
  });

  it("rejects states whose nonce segment is not canonical base64url", () => {
    fc.assert(
      fc.property(
        fc
          .string({ maxLength: 128 })
          .filter((nonce) => !CANONICAL_NONCE.test(nonce)),
        fc.string({ maxLength: 128 }),
        (nonce, signature) => {
          expect(
            verifySubjectBoundOAuthState(
              `v1.${nonce}.${signature}`,
              "user-a",
              "server-secret",
            ),
          ).toBe(false);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("rejects a state with a tampered nonce or signature segment", () => {
    fc.assert(
      fc.property(nonBlankString, nonBlankString, (subjectId, secret) => {
        const state = createSubjectBoundOAuthState(subjectId, secret);
        const [version, nonce, signature] = state.split(".");

        expect(
          verifySubjectBoundOAuthState(
            `${version}.${flipFirstCharacter(nonce!)}.${signature}`,
            subjectId,
            secret,
          ),
        ).toBe(false);
        expect(
          verifySubjectBoundOAuthState(
            `${version}.${nonce}.${flipFirstCharacter(signature!)}`,
            subjectId,
            secret,
          ),
        ).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it("rejects a state presented for a different subject or with extra segments", () => {
    fc.assert(
      fc.property(nonBlankString, nonBlankString, (subjectId, secret) => {
        const state = createSubjectBoundOAuthState(subjectId, secret);

        expect(
          verifySubjectBoundOAuthState(state, `${subjectId}-other`, secret),
        ).toBe(false);
        expect(
          verifySubjectBoundOAuthState(`${state}.extra`, subjectId, secret),
        ).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});
