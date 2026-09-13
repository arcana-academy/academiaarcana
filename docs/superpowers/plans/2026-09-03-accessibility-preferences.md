# Accessibility Preferences v1 — Implementation Plan

## Goal

Implement Accessibility Preferences v1 according to the approved specification:

`docs/superpowers/specs/2026-09-03-accessibility-preferences-v1.md`

The implementation must preserve the existing Academia Arcana architecture
and must not introduce speculative infrastructure, migrations, tables,
authentication flows, or unrelated UI changes.

---

# Architectural Rule

Dependency direction:

CORE
↓
APPLICATION
↓
LIB / ADAPTERS
↓
UI

Core must remain independent from:

- React
- Next.js
- browser APIs
- localStorage
- Supabase
- session objects
- UI
- database clients
- authorization objects

---

# TDD Protocol

Every implementation block follows:

RED
↓
run the targeted test
↓
confirm failure
↓
GREEN
↓
minimal implementation
↓
run targeted test
↓
REFACTOR
↓
run targeted test again

No production implementation should be created before its corresponding test.

---

# Block 01 — Core Contracts

## Objective

Create the pure contracts required by Accessibility Preferences.

## Files

Create:

```text
src/core/accessibility-preferences/
├── contracts.ts
└── contracts.test.ts