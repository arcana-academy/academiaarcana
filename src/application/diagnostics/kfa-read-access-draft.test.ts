import { describe, expect, it, vi } from "vitest";

import {
  checkKfaDiagnosticsReadAccess,
  KFA_DIAGNOSTICS_READ_PERMISSION,
  type KfaDiagnosticsGrant,
  type KfaDiagnosticsGrantVerifier,
} from "./kfa-read-access-draft";

const nowMs = Date.parse("2026-11-14T12:00:00.000Z");
const subjectId = "synthetic-subject-001";
const validGrant: KfaDiagnosticsGrant = {
  subjectId,
  permission: KFA_DIAGNOSTICS_READ_PERMISSION,
  grantedAt: "2026-11-13T12:00:00.000Z",
  expiresAt: "2026-11-15T12:00:00.000Z",
  revokedAt: null,
};

function verifierFor(grant: KfaDiagnosticsGrant | null): KfaDiagnosticsGrantVerifier {
  return { readCurrentGrant: vi.fn(async () => grant) };
}

describe("KFA diagnostics read access — synthetic contract only", () => {
  it("denies missing identity without consulting any grant", async () => {
    const grantVerifier = verifierFor(validGrant);
    expect(await checkKfaDiagnosticsReadAccess({ subjectId: null, grantVerifier, nowMs }))
      .toEqual({ allowed: false, reason: "unauthenticated" });
    expect(grantVerifier.readCurrentGrant).not.toHaveBeenCalled();
  });

  it("denies blank or malformed identity", async () => {
    for (const id of ["", " ", " synthetic-subject-001 "]) {
      expect(await checkKfaDiagnosticsReadAccess({ subjectId: id, nowMs }))
        .toEqual({ allowed: false, reason: "unauthenticated" });
    }
  });

  it("denies when no trusted verifier is configured", async () => {
    expect(await checkKfaDiagnosticsReadAccess({ subjectId, nowMs }))
      .toEqual({ allowed: false, reason: "missing-permission" });
  });

  it("denies when the permission was never granted", async () => {
    expect(await checkKfaDiagnosticsReadAccess({
      subjectId, grantVerifier: verifierFor(null), nowMs,
    })).toEqual({ allowed: false, reason: "missing-permission" });
  });

  it("denies a grant belonging to someone else", async () => {
    expect(await checkKfaDiagnosticsReadAccess({
      subjectId,
      grantVerifier: verifierFor({ ...validGrant, subjectId: "other-synthetic-subject" }),
      nowMs,
    })).toEqual({ allowed: false, reason: "invalid-grant" });
  });

  it("denies any permission other than the exact read capability", async () => {
    expect(await checkKfaDiagnosticsReadAccess({
      subjectId,
      grantVerifier: verifierFor({ ...validGrant, permission: "diagnostics.kfa.write" }),
      nowMs,
    })).toEqual({ allowed: false, reason: "invalid-grant" });
  });

  it("denies a revoked grant even if its expiry is in the future", async () => {
    expect(await checkKfaDiagnosticsReadAccess({
      subjectId,
      grantVerifier: verifierFor({ ...validGrant, revokedAt: "2026-11-14T11:00:00.000Z" }),
      nowMs,
    })).toEqual({ allowed: false, reason: "invalid-grant" });
  });

  it("denies an expired grant at the exact expiry instant", async () => {
    expect(await checkKfaDiagnosticsReadAccess({
      subjectId,
      grantVerifier: verifierFor({ ...validGrant, expiresAt: "2026-11-14T12:00:00.000Z" }),
      nowMs,
    })).toEqual({ allowed: false, reason: "invalid-grant" });
  });

  it("denies a grant that is not yet effective", async () => {
    expect(await checkKfaDiagnosticsReadAccess({
      subjectId,
      grantVerifier: verifierFor({ ...validGrant, grantedAt: "2026-11-15T12:00:00.000Z" }),
      nowMs,
    })).toEqual({ allowed: false, reason: "invalid-grant" });
  });

  it("denies malformed grant timestamps", async () => {
    expect(await checkKfaDiagnosticsReadAccess({
      subjectId,
      grantVerifier: verifierFor({ ...validGrant, expiresAt: "tomorrow" }),
      nowMs,
    })).toEqual({ allowed: false, reason: "invalid-grant" });
  });

  it("denies when grant verification is unavailable", async () => {
    const grantVerifier: KfaDiagnosticsGrantVerifier = {
      readCurrentGrant: async () => { throw new Error("synthetic verifier outage"); },
    };
    expect(await checkKfaDiagnosticsReadAccess({ subjectId, grantVerifier, nowMs }))
      .toEqual({ allowed: false, reason: "unavailable" });
  });

  it("denies an invalid evaluation clock", async () => {
    const grantVerifier = verifierFor(validGrant);
    expect(await checkKfaDiagnosticsReadAccess({ subjectId, grantVerifier, nowMs: NaN }))
      .toEqual({ allowed: false, reason: "unavailable" });
    expect(grantVerifier.readCurrentGrant).not.toHaveBeenCalled();
  });

  it("allows exactly one current grant returned by a trusted verifier", async () => {
    const grantVerifier = verifierFor(validGrant);
    expect(await checkKfaDiagnosticsReadAccess({ subjectId, grantVerifier, nowMs }))
      .toEqual({ allowed: true, permission: KFA_DIAGNOSTICS_READ_PERMISSION });
    expect(grantVerifier.readCurrentGrant).toHaveBeenCalledWith(
      subjectId,
      KFA_DIAGNOSTICS_READ_PERMISSION,
    );
  });

  it("accepts an explicitly non-expiring current grant", async () => {
    expect(await checkKfaDiagnosticsReadAccess({
      subjectId,
      grantVerifier: verifierFor({ ...validGrant, expiresAt: null }),
      nowMs,
    })).toEqual({ allowed: true, permission: KFA_DIAGNOSTICS_READ_PERMISSION });
  });
});
