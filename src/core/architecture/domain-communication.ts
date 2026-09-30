import { CORE_DOMAINS, type CoreDomain } from "./domains";
import {
  DOMAIN_DEPENDENCY_MATRIX,
  DOMAIN_POLICIES,
} from "./domain-policy";

export const DOMAIN_COMMUNICATION_KINDS = [
  "query",
  "command",
  "event",
] as const;

export type DomainCommunicationKind = (typeof DOMAIN_COMMUNICATION_KINDS)[number];

export type DirectDomainCommunication = {
  readonly source: CoreDomain;
  readonly target: CoreDomain;
  readonly kind: "query" | "command";
  readonly contractName: string;
};

export type DomainEventCommunication = {
  readonly source: CoreDomain;
  readonly kind: "event";
  readonly eventName: string;
};

export type DomainCommunication =
  | DirectDomainCommunication
  | DomainEventCommunication;

export type DomainCommunicationPolicy = Readonly<{
  readonly directKinds: readonly ["query", "command"];
  readonly allowedTargets: readonly CoreDomain[];
  readonly events: readonly string[];
}>;

const communicationPolicy = {} as Record<
  CoreDomain,
  DomainCommunicationPolicy
>;

for (const domain of CORE_DOMAINS) {
  communicationPolicy[domain] = Object.freeze({
    directKinds: ["query", "command"],
    allowedTargets: DOMAIN_DEPENDENCY_MATRIX[domain],
    events: DOMAIN_POLICIES[domain].events,
  });
}

export const DOMAIN_COMMUNICATION_POLICY: Readonly<
  Record<CoreDomain, DomainCommunicationPolicy>
> = Object.freeze(communicationPolicy);

export function validateDomainCommunication(
  communication: DomainCommunication,
): readonly string[] {
  const issues: string[] = [];

  if (communication.kind === "event") {
    if (!communication.eventName.trim()) {
      issues.push("event communication requires an event name");
      return issues;
    }

    if (!CORE_DOMAINS.includes(communication.source)) {
      issues.push(`unknown event source: ${communication.source}`);
      return issues;
    }

    if (
      !DOMAIN_COMMUNICATION_POLICY[communication.source].events.includes(
        communication.eventName,
      )
    ) {
      issues.push(
        `undeclared domain event: ${communication.source} -> ${communication.eventName}`,
      );
    }

    return issues;
  }

  if (!communication.contractName.trim()) {
    issues.push("direct communication requires a contract name");
  }

  if (!CORE_DOMAINS.includes(communication.source)) {
    issues.push(`unknown communication source: ${communication.source}`);
    return issues;
  }

  if (!CORE_DOMAINS.includes(communication.target)) {
    issues.push(
      `unknown communication target: ${communication.target}`,
    );
    return issues;
  }

  if (communication.source === communication.target) {
    issues.push(`self communication: ${communication.source}`);
  }

  if (
    !DOMAIN_COMMUNICATION_POLICY[communication.source].allowedTargets.includes(
      communication.target,
    )
  ) {
    issues.push(
      `unauthorized domain communication: ${communication.source} -> ${communication.target}`,
    );
  }

  if (!DOMAIN_COMMUNICATION_KINDS.includes(communication.kind)) {
    issues.push(
      `unknown communication kind: ${String(communication.kind)}`,
    );
  }

  return issues;
}

export function validateDomainCommunicationPolicy(): readonly string[] {
  const issues: string[] = [];

  for (const domain of CORE_DOMAINS) {
    const policy = DOMAIN_COMMUNICATION_POLICY[domain];

    if (policy.directKinds.join(",") !== "query,command") {
      issues.push(`invalid direct communication kinds: ${domain}`);
    }

    for (const target of policy.allowedTargets) {
      if (!CORE_DOMAINS.includes(target)) {
        issues.push(`unknown communication target: ${domain} -> ${target}`);
      }
      if (target === domain) {
        issues.push(`self communication policy: ${domain}`);
      }
    }

    if (new Set(policy.allowedTargets).size !== policy.allowedTargets.length) {
      issues.push(`duplicate communication target: ${domain}`);
    }
  }

  return issues;
}
