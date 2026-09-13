# Accessibility Preferences v1

## Status

Approved.

This specification formalizes the approved architecture and behavior
for Accessibility Preferences in Academia Arcana.

No functionality outside this specification may be introduced during
implementation without a new architectural decision.

---

## 1. Responsibility

Accessibility Preferences is responsible for user-controlled accessibility
preferences required by the learning experience.

The capability must remain independent from generic application configuration.

It must not store medical, diagnostic, clinical, or justification data.

---

## 2. Architectural Boundaries

The architecture follows:

CORE
  ↓
APPLICATION
  ↓
LIB / ADAPTERS
  ↓
UI

### Core

The core contains:

- contracts
- pure rules
- MotionPreferenceResolver
- PreferencesMerge
- persistence interfaces
- MotionEnvironment interface
- structured error/result contracts

The core must not depend on:

- React
- Next.js
- browser APIs
- localStorage
- Supabase
- session objects
- UI components
- database clients
- authorization objects

### Application

The application layer contains:

- AccessibilityPreferencesProvider
- state
- orchestration
- lifecycle
- synchronization

The application layer must not implement infrastructure adapters or duplicate
pure business rules.

### Lib / Adapters

Concrete infrastructure implementations live under:

`src/lib/accessibility-preferences/`

Adapters translate technical failures into the structured error contract.

### UI

UI consumes public application hooks and must not access persistence adapters
directly.

---

## 3. Physical Structure

The intended structure is:

```text
src/core/accessibility-preferences/
├── contracts
├── MotionPreferenceResolver
├── PreferencesMerge
├── LocalAccessibilityPreferencesRepository
├── AuthenticatedPreferencesRepository
└── MotionEnvironment

src/application/accessibility-preferences/
└── AccessibilityPreferencesProvider

src/lib/accessibility-preferences/
├── MotionEnvironment
├── LocalAccessibilityPreferences
└── AuthenticatedPreferencesRepository