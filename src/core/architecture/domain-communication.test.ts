import { describe, expect, it } from "vitest";
import { CORE_DOMAINS } from "./domains";
import { DOMAIN_DEPENDENCY_MATRIX } from "./domain-policy";
import {
  DOMAIN_COMMUNICATION_KINDS,
  DOMAIN_COMMUNICATION_POLICY,
  validateDomainCommunication,
  validateDomainCommunicationPolicy,
} from "./domain-communication";

describe("domain communication contracts", () => {
  it("keeps communication targets aligned with the canonical dependency matrix", () => {
    for (const domain of CORE_DOMAINS) {
      expect(DOMAIN_COMMUNICATION_POLICY[domain].allowedTargets).toEqual(
        DOMAIN_DEPENDENCY_MATRIX[domain],
      );
      expect(DOMAIN_COMMUNICATION_POLICY[domain].directKinds).toEqual([
        "query",
        "command",
      ]);
      expect(DOMAIN_COMMUNICATION_KINDS).toEqual([
        "query",
        "command",
        "event",
      ]);
    }

    expect(validateDomainCommunicationPolicy()).toEqual([]);
  });

  it("allows direct query and command contracts only across declared dependencies", () => {
    expect(
      validateDomainCommunication({
        source: "sanctuary",
        target: "learning",
        kind: "query",
        contractName: "get-learning-progress",
      }),
    ).toEqual([]);

    expect(
      validateDomainCommunication({
        source: "planning",
        target: "gamification",
        kind: "command",
        contractName: "award-progress",
      }),
    ).toEqual([
      "unauthorized domain communication: planning -> gamification",
    ]);
  });

  it("rejects self and undeclared direct communication", () => {
    expect(
      validateDomainCommunication({
        source: "identity",
        target: "identity",
        kind: "query",
        contractName: "resolve-identity",
      }),
    ).toEqual(["self communication: identity"]);

    expect(
      validateDomainCommunication({
        source: "social",
        target: "planning",
        kind: "command",
        contractName: "schedule-task",
      }),
    ).toEqual([
      "unauthorized domain communication: social -> planning",
    ]);
  });

  it("treats events as immutable facts declared by their producing domain", () => {
    expect(
      validateDomainCommunication({
        source: "planning",
        kind: "event",
        eventName: "task completed",
      }),
    ).toEqual([]);

    expect(
      validateDomainCommunication({
        source: "planning",
        kind: "event",
        eventName: "award-progress",
      }),
    ).toEqual([
      "undeclared domain event: planning -> award-progress",
    ]);
  });

  it("requires contract names for direct communication and event names for events", () => {
    expect(
      validateDomainCommunication({
        source: "sanctuary",
        target: "learning",
        kind: "query",
        contractName: " ",
      }),
    ).toEqual(["direct communication requires a contract name"]);

    expect(
      validateDomainCommunication({
        source: "planning",
        kind: "event",
        eventName: " ",
      }),
    ).toEqual(["event communication requires an event name"]);
  });
});
