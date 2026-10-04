# Intelligence Application

This directory contains application-level orchestration for the Intelligence domain.

Current implemented behavior includes the Mestre Arcano execution use case. The application layer coordinates the operation without exposing persistence or provider-specific details to domain contracts.

The canonical operational architecture is documented in `docs/architecture/AA-ARCHITECTURE-1.0.md`.

Future Intelligence capabilities should be added as explicit use cases and contracts rather than as direct database or provider access from presentation code.
