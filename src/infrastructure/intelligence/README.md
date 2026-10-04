# Intelligence Infrastructure

This directory contains infrastructure-side integration for the Intelligence domain.

Current responsibilities include:

- authorized context composition and adapters;
- provider/runtime integration used by the Mestre Arcano;
- persistence adapters for Intelligence-owned infrastructure resources;
- server-side boundaries that prevent the AI runtime from accessing persistence directly.

The canonical operational architecture is documented in `docs/architecture/AA-ARCHITECTURE-1.0.md`.

Infrastructure implementations must remain behind domain/application contracts. Secrets and provider credentials remain server-side, and authentication/ownership checks must fail closed.
