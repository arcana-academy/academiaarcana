# Academia Arcana Foundation & Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the Academia Arcana production application and implement the first working architectural slice: domain boundaries, theme tokens, accessible visual primitives, application shell, and Flonts-ready experience infrastructure.

**Architecture:** Start as a modular Next.js App Router application with TypeScript. Keep domain/application/infrastructure boundaries explicit and use semantic design tokens so all approved themes share the same component contracts. Supabase integration is prepared behind infrastructure adapters; authorization and RLS become mandatory before protected domain data is introduced.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Lucide React, Supabase (`@supabase/ssr` when authentication is introduced), ESLint, automated component/unit tests, accessibility checks.

**Spec:** `docs/superpowers/specs/2026-08-31-academia-arcana-architecture-design.md`

## Global Constraints

- Start as a modular monolith / modular monorepo; do not introduce microservices in this phase.
- Use semantic design tokens; components must not hard-code theme-specific colors.
- Support all approved theme presets through token configuration rather than duplicated component implementations.
- Dark Fantasy Arcane is the dominant visual identity; Arcane Academic is complementary.
- Pure white (#FFFFFF) must not be the dominant interface color.
- Accessibility is structural: keyboard navigation, visible focus, scalable typography, contrast, reduced motion and predictable interaction are required.
- Flonts is a presentation/runtime layer and must not receive universal data access.
- The AI is not implemented as a superuser or unrestricted database client.
- Do not add future product features merely to populate the shell; build only the foundation required by this plan.

---

### Task 1: Bootstrap the Next.js application shell

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `eslint.config.mjs`
- Create: `postcss.config.mjs`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Create: `src/lib/utils.ts`
- Create: `.env.example`
- Create: `README.md` (replace placeholder README)
- Test: `src/app/page.test.tsx`

**Interfaces:**
- Produces a bootable Next.js App Router application with `@/*` path aliases and a single root layout.
- `cn(...inputs: ClassValue[]): string` is the shared class-name utility used by UI primitives.

- [ ] **Step 1: Write the failing smoke test**

Create a test that renders the home page and asserts the accessible main landmark and the `Academia Arcana` brand heading are present.

```tsx
import { render, screen } from '@testing-library/react';
import Page from './page';

test('renders the Academia Arcana home shell', () => {
  render(<Page />);
  expect(screen.getByRole('main')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /academia arcana/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test and verify it fails because the project is not scaffolded**

Run: `pnpm test -- src/app/page.test.tsx`
Expected: FAIL because the test runner/project files do not yet exist.

- [ ] **Step 3: Scaffold the Next.js App Router project**

Use the current Next.js App Router setup and pnpm package manager. Configure TypeScript, ESLint, Tailwind/PostCSS, `src/` layout, and `@/*` alias. Current Next.js documentation recommends App Router for new applications and current Tailwind documentation uses the PostCSS plugin path for framework integration. citeturn0search5turn0search6turn0search1

Install the runtime dependencies required by the approved stack: `next`, `react`, `react-dom`, `lucide-react`, `clsx`, and `tailwind-merge`. Install development dependencies for TypeScript, ESLint, Tailwind/PostCSS, Vitest/Testing Library, and jsdom.

- [ ] **Step 4: Implement the root layout and accessible placeholder page**

`src/app/layout.tsx` must set `lang="pt-BR"`, import global CSS, expose the app metadata, and render the application children. `src/app/page.tsx` must render an accessible main landmark with the brand heading and a short foundation message; no production dashboard features belong here yet.

- [ ] **Step 5: Add the shared `cn` utility**

Implement:

```ts
export function cn(...inputs: ClassValue[]): string
```

using `clsx` and `tailwind-merge` so conditional utility classes remain predictable.

- [ ] **Step 6: Add environment documentation**

`.env.example` must document only variable names required by the foundation and use no real secrets. Supabase values are placeholders until the Supabase integration task.

- [ ] **Step 7: Run the smoke test**

Run: `pnpm test -- src/app/page.test.tsx`
Expected: PASS.

- [ ] **Step 8: Run static checks**

Run: `pnpm lint` and `pnpm typecheck`.
Expected: PASS with zero errors.

- [ ] **Step 9: Commit**

```bash
git add package.json pnpm-lock.yaml tsconfig.json next.config.ts eslint.config.mjs postcss.config.mjs src .env.example README.md
git commit -m "chore: bootstrap Academia Arcana application"
```

---

### Task 2: Implement semantic design tokens and theme infrastructure

**Files:**
- Create: `src/design-system/tokens/types.ts`
- Create: `src/design-system/tokens/base.ts`
- Create: `src/design-system/themes/presets.ts`
- Create: `src/design-system/themes/apply-theme.ts`
- Create: `src/design-system/themes/theme-context.tsx`
- Create: `src/design-system/themes/index.ts`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Test: `src/design-system/themes/theme-context.test.tsx`
- Test: `src/design-system/themes/presets.test.ts`

**Interfaces:**
- `ThemeId` is a string union containing the approved presets: `mago-classico`, `escuro`, `estudioso`, `natural`, `cinematic`, `delicado`, `gamer`, `cozy-cafe`, `noturno`, and `romantico`.
- `ThemeTokens` exposes semantic values for surfaces, text, borders, accents, status colors, focus, radii, spacing, typography, shadows, and motion intensity.
- `ThemeProvider` accepts `initialTheme?: ThemeId` and provides `theme`, `setTheme(theme: ThemeId)`, and `tokens`.

- [ ] **Step 1: Write tests for token completeness**

For every `ThemeId`, assert that all required semantic token keys exist and that no preset uses `#FFFFFF` as its dominant surface or body text token.

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm test -- src/design-system/themes/presets.test.ts`
Expected: FAIL because token modules do not yet exist.

- [ ] **Step 3: Define semantic token types**

Define token interfaces without coupling components to individual theme names. Include at minimum:

```ts
type SurfaceTokens = {
  canvas: string;
  panel: string;
  elevated: string;
  inset: string;
};

type TextTokens = {
  primary: string;
  secondary: string;
  muted: string;
  inverse: string;
};
```

Add equivalent semantic groups for border, accent, status, focus, radius, shadow, typography, and motion.

- [ ] **Step 4: Define the base Dark Fantasy Arcane + Arcane Academic palette**

Create a deep, non-white foundation with muted arcane accents and academic surfaces. Use semantic tokens rather than raw color names. Keep text light-but-not-pure-white and ensure contrast is testable.

- [ ] **Step 5: Define all approved theme presets**

Implement all ten presets as token overrides. Each preset must preserve component semantics, focus behavior, state meaning, and readability. Themes may change atmosphere, accent, surface, decorative intensity and typography pairing, but must not redefine component contracts.

- [ ] **Step 6: Implement theme application through CSS custom properties**

Map semantic tokens to CSS variables on the document root. Components should consume variables through Tailwind/CSS utility conventions instead of theme-specific conditionals.

- [ ] **Step 7: Implement `ThemeProvider`**

Provide theme state without coupling it to authentication. Persisting the choice is allowed only through a client preference layer in a later task; the provider must accept an initial value so server rendering remains deterministic.

- [ ] **Step 8: Run tests and checks**

Run: `pnpm test -- src/design-system/themes/presets.test.ts src/design-system/themes/theme-context.test.tsx`
Expected: PASS.

Run: `pnpm lint && pnpm typecheck`.
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/design-system src/app/layout.tsx src/app/globals.css
git commit -m "feat: add Academia Arcana semantic theme system"
```

---

### Task 3: Build accessible visual primitives

**Files:**
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/badge.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/progress.tsx`
- Create: `src/components/ui/icon-button.tsx`
- Create: `src/components/ui/visually-hidden.tsx`
- Create: `src/components/ui/index.ts`
- Test: `src/components/ui/button.test.tsx`
- Test: `src/components/ui/input.test.tsx`
- Test: `src/components/ui/card.test.tsx`

**Interfaces:**
- `Button` supports semantic variants `primary | secondary | ghost | danger`, `size`, disabled/loading states, and native button semantics.
- `Card` supports `variant` and an optional semantic `as` wrapper without embedding page-specific content.
- `IconButton` requires an accessible `aria-label`.
- `Input` forwards standard input attributes and supports `label`, `description`, and `error` relationships.

- [ ] **Step 1: Write accessibility-first tests**

Test button roles/names, disabled behavior, keyboard focusability, icon-button accessible name, input label association, error association, and card rendering.

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm test -- src/components/ui`
Expected: FAIL because primitives do not exist.

- [ ] **Step 3: Implement minimal primitives using semantic tokens**

Do not use theme-specific hex values inside components. Use CSS variables/classes generated from semantic tokens. Focus styles must be visibly distinct and work without color alone.

- [ ] **Step 4: Add state styling**

Implement hover, active, focus-visible, disabled, loading and error states. Avoid animations that remain active when reduced motion is requested.

- [ ] **Step 5: Run tests**

Run: `pnpm test -- src/components/ui`
Expected: PASS.

- [ ] **Step 6: Run lint/typecheck**

Run: `pnpm lint && pnpm typecheck`.
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui
git commit -m "feat: add accessible Academia Arcana UI primitives"
```

---

### Task 4: Implement application shell and navigation boundaries

**Files:**
- Create: `src/components/layout/AppShell.tsx`
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/PageHeader.tsx`
- Create: `src/components/layout/MobileNavigation.tsx`
- Create: `src/components/layout/index.ts`
- Create: `src/config/navigation.ts`
- Modify: `src/app/page.tsx`
- Test: `src/components/layout/Sidebar.test.tsx`
- Test: `src/components/layout/AppShell.test.tsx`

**Interfaces:**
- `NavigationItem` contains `id`, `label`, `href`, `icon`, optional `children`, and optional `requiredCapability`.
- `AppShell` accepts `children` and optional `navigationItems`.
- Sidebar navigation must expose the same information architecture on desktop and mobile without duplicating navigation definitions.

- [ ] **Step 1: Write failing navigation tests**

Test landmark navigation, accessible labels, active route indication, nested menu semantics, mobile menu button labeling, and keyboard navigation.

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm test -- src/components/layout`
Expected: FAIL because the shell does not exist.

- [ ] **Step 3: Define the central navigation configuration**

Create a single typed navigation model for the approved route families: Santuário, Academia, Grimórios, Missões, Cronograma, Foco, Streak, Estatísticas, Conquistas, Amigos, Perfil, Personalizar and Configurações. Mark future-only features separately instead of pretending they are implemented.

- [ ] **Step 4: Implement responsive AppShell**

Use semantic landmarks: `aside` for desktop navigation, `header` for page controls, `main` for content, and a mobile navigation mechanism. Preserve predictable focus behavior when opening/closing the mobile navigation.

- [ ] **Step 5: Implement PageHeader**

Support title, description, optional breadcrumbs, actions and contextual Flonts slot without coupling PageHeader to any specific domain.

- [ ] **Step 6: Run tests and accessibility checks**

Run: `pnpm test -- src/components/layout`.
Expected: PASS.

Run the configured accessibility test command and verify no missing accessible names or landmark violations.

- [ ] **Step 7: Commit**

```bash
git add src/components/layout src/config/navigation.ts src/app/page.tsx
git commit -m "feat: add accessible Academia Arcana application shell"
```

---

### Task 5: Add Flonts presentation runtime boundary

**Files:**
- Create: `src/domains/flonts/types.ts`
- Create: `src/domains/flonts/FlontsProvider.tsx`
- Create: `src/domains/flonts/FlontsPresence.tsx`
- Create: `src/domains/flonts/index.ts`
- Test: `src/domains/flonts/FlontsPresence.test.tsx`

**Interfaces:**
- `FlontsContext` exposes only presentation state: `mode`, `visibility`, `motionPreference`, and `message`.
- `FlontsPresence` accepts contextual presentation props and never accepts a database client, authorization object, or arbitrary user-data bag.

- [ ] **Step 1: Write failing tests**

Test default presence, reduced-motion behavior, hidden state, accessible labeling when interactive, and rejection of undefined arbitrary data props through TypeScript interfaces.

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm test -- src/domains/flonts/FlontsPresence.test.tsx`
Expected: FAIL because the runtime does not exist.

- [ ] **Step 3: Implement presentation-only provider and component**

Implement Flonts as a reusable visual/context layer. The component must receive already-authorized contextual information from its parent instead of performing data access.

- [ ] **Step 4: Respect reduced motion**

Disable nonessential animation when the user's reduced-motion preference is active. Keep important status information available without animation.

- [ ] **Step 5: Run tests and typecheck**

Run: `pnpm test -- src/domains/flonts/FlontsPresence.test.tsx && pnpm typecheck`.
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domains/flonts
 git commit -m "feat: add Flonts presentation runtime boundary"
```

---

### Task 6: Establish domain and application boundaries

**Files:**
- Create: `src/core/authorization/types.ts`
- Create: `src/core/context/types.ts`
- Create: `src/core/events/types.ts`
- Create: `src/domains/identity/index.ts`
- Create: `src/domains/learning/index.ts`
- Create: `src/domains/planning/index.ts`
- Create: `src/domains/gamification/index.ts`
- Create: `src/domains/education/index.ts`
- Create: `src/domains/social/index.ts`
- Create: `src/domains/adaptive/index.ts`
- Create: `src/domains/intelligence/index.ts`
- Create: `src/domains/safety/index.ts`
- Create: `src/domains/governance/index.ts`
- Create: `src/domains/data-platform/index.ts`
- Test: `src/core/architecture-boundaries.test.ts`

**Interfaces:**
- `ActorContext` contains `userId`, `roleIds`, and `contextIds` only.
- `AuthorizationRequest` contains `actor`, `contextId`, `resource`, `action`, and `purpose`.
- `AuthorizationDecision` is `{ allowed: boolean; reason: string; requiresConfirmation?: boolean }`.
- Domain public APIs are exposed through each domain's `index.ts`; internal modules must not be imported across domains directly.

- [ ] **Step 1: Write architecture boundary tests**

Test that public domain modules can be imported through their index and that domain contracts do not expose infrastructure clients. Add a static dependency check that flags imports from `src/infrastructure` inside presentation components and flags direct domain-internal imports across sibling domains.

- [ ] **Step 2: Run the boundary tests and verify failure**

Run: `pnpm test -- src/core/architecture-boundaries.test.ts`
Expected: FAIL until the boundary modules and checks exist.

- [ ] **Step 3: Implement shared context and authorization contracts**

Create type-only contracts first. Do not implement permissive authorization logic here; this phase establishes interfaces that later Supabase/RLS work will implement.

- [ ] **Step 4: Create domain public entrypoints**

Each domain gets a public `index.ts`. Keep it empty or type-only where functionality has not been implemented. Do not create fake business logic.

- [ ] **Step 5: Implement the dependency-boundary check**

The check must scan TypeScript source paths and fail if UI files import infrastructure directly or if one domain imports another domain's internal path instead of its public entrypoint.

- [ ] **Step 6: Run architecture tests, lint and typecheck**

Run: `pnpm test -- src/core/architecture-boundaries.test.ts && pnpm lint && pnpm typecheck`.
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/core src/domains
 git commit -m "feat: establish Academia Arcana domain boundaries"
```

---

### Task 7: Integrate the foundation and create a visual regression page

**Files:**
- Create: `src/app/design-system/page.tsx`
- Create: `src/components/design-system/ThemeShowcase.tsx`
- Create: `src/components/design-system/ComponentShowcase.tsx`
- Test: `src/app/design-system/page.test.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- `ThemeShowcase` renders every approved theme using the same component primitives.
- `ComponentShowcase` renders buttons, cards, inputs, badges, progress and navigation states without domain data.

- [ ] **Step 1: Write the visual smoke test**

Assert that the showcase renders all ten theme names and the core component roles.

- [ ] **Step 2: Run test and verify failure**

Run: `pnpm test -- src/app/design-system/page.test.tsx`
Expected: FAIL because the showcase does not exist.

- [ ] **Step 3: Implement the showcase page**

Build a developer-facing route that allows deterministic review of all themes and component states. It must not become a user-facing product page.

- [ ] **Step 4: Add reduced-motion and high-contrast review states**

The showcase must include a clear way to inspect focus, disabled, error, loading and reduced-motion behavior.

- [ ] **Step 5: Run the full foundation test suite**

Run: `pnpm test`, `pnpm lint`, and `pnpm typecheck`.
Expected: all PASS.

- [ ] **Step 6: Run the production build**

Run: `pnpm build`.
Expected: successful production build with no TypeScript, route, CSS, or static-generation errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/design-system src/components/design-system src/app/layout.tsx
 git commit -m "test: add Academia Arcana design system showcase"
```

---

## Plan self-review

### Spec coverage
- Modular monolith/evolvable boundaries: Tasks 1 and 6.
- Semantic tokens and all approved themes: Task 2.
- Accessible visual primitives: Task 3.
- Application shell/navigation: Task 4.
- Flonts boundary: Task 5.
- Domain contracts: Task 6.
- Visual verification and production build: Task 7.
- Supabase is intentionally deferred to the next implementation plan so authentication/RLS can be designed against the real domain schema rather than scaffolded prematurely.

### Placeholder scan
No implementation step relies on TBD/TODO/unspecified behavior. Future domains are represented only as typed public entrypoints in this foundation phase; they are not presented as implemented features.

### Type consistency
`ThemeId`, `ThemeTokens`, `ThemeProvider`, `NavigationItem`, `ActorContext`, `AuthorizationRequest`, and `AuthorizationDecision` are defined before downstream tasks consume them. Flonts receives presentation state only and never infrastructure clients.
