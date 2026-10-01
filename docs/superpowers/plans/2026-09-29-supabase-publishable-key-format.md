# Supabase Publishable Key Format Implementation Plan

> **For agentic workers:** Execute this plan task-by-task and verify each task before proceeding.

**Goal:** Update the Academia Arcana public Supabase runtime validation to accept the current publishable-key checksum length used by Supabase, then validate the change through CI before Netlify deployment.

**Architecture:** Keep the existing server/client configuration boundary unchanged. Only the validation contract and its regression tests change; no runtime, database, authentication, or deployment architecture changes are required.

**Tech Stack:** Node.js 24.x, TypeScript/JavaScript tests with Vitest, GitHub Actions Quality Gate, Next.js 16.

**Spec:** Current Netlify production build log for deploy `6abc4bdac5157c192abab83c`, which fails in `scripts/verify-public-runtime-config.mjs` while validating `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## Global Constraints

- Preserve `NEXT_PUBLIC_SUPABASE_URL` validation exactly as currently implemented.
- Accept publishable keys in the form `sb_publishable_<22-char-random>_<8-char-checksum>`.
- Do not use or accept `service_role`, `sb_secret_`, or legacy JWT keys for this variable.
- Do not change Render, Supabase project settings, domain configuration, or application architecture.
- Validate through the repository's Quality Gate before merging to `main`.

## Review Focus

- Current 8-character checksum keys must be accepted.
- 7-character checksum keys must remain rejected.
- Malformed prefixes and malformed lengths must remain rejected.
- Existing Supabase URL validation must remain unchanged.
- The Netlify build must reach `next build --webpack` after the prebuild validation passes.

---

### Task 1: Update publishable-key validation

**Files:**
- Modify: `scripts/verify-public-runtime-config.mjs`
- Modify: `scripts/verify-public-runtime-config.test.mjs`

**Interfaces:**
- Produces: `validateSupabaseProductionConfiguration(supabaseUrl, publishableKey)` accepts current 8-character checksum keys and rejects malformed keys.

- [ ] **Step 1: Update the regression test to use an 8-character checksum and add explicit rejection for the old 7-character shape.**
- [ ] **Step 2: Run the targeted test and confirm the updated test fails against the current production validator because it still requires 7 characters.**
- [ ] **Step 3: Change only the publishable-key regular expression in `scripts/verify-public-runtime-config.mjs` from a 7-character checksum to an 8-character checksum.**
- [ ] **Step 4: Run the targeted test, then the full test suite, typecheck, and production build.
- [ ] **Step 5: Open a pull request against `main` and wait for the complete Quality Gate to pass.**
- [ ] **Step 6: Merge the PR only after all required checks are green.**
- [ ] **Step 7: After merge, Render will deploy the updated `main`; do not use legacy deployment providers.**
