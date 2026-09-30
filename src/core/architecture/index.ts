export { CORE_DOMAINS, type CoreDomain } from "./domains";
export {
  ARCHITECTURE_LAYERS,
  DOMAIN_DEPENDENCY_DIRECTION,
  DOMAIN_POLICIES,
  type ArchitectureLayer,
  type DomainPolicy,
} from "./domain-policy";
export {
  DOMAIN_COMMUNICATION_KINDS,
  DOMAIN_COMMUNICATION_POLICY,
  validateDomainCommunication,
  validateDomainCommunicationPolicy,
  type DirectDomainCommunication,
  type DomainCommunication,
  type DomainCommunicationKind,
  type DomainCommunicationPolicy,
  type DomainEventCommunication,
} from "./domain-communication";
