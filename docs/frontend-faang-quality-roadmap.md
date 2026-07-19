# Frontend FAANG Quality Roadmap

## Current Rating

Current frontend quality score: **9.0 / 10** (Phase 6 complete)

The app is usable and visually strong, and `npm run build` succeeds. It is not yet at a FAANG-style production bar because strict TypeScript and lint are not clean, several screens are too large, styling is duplicated, and production logging/error handling needs tightening.

## Current Strengths

- Feature-based folder structure exists: `auth`, `finance`, `properties`, `tenant`, `inventory`, `announcements`, `analytics`, `ai`.
- Expo Router is used consistently for app routing.
- Authentication context, token persistence, refresh handling, and onboarding gate are already present.
- API calls generally go through a centralized `apiRequest` client with timeout, correlation ID, and token refresh behavior.
- Visual direction is strong: responsive layouts, operational dashboards, consistent brand colors, and meaningful use of icons.
- Web export succeeds with `npm run build`.

## Current Issues

### Build And CI Quality

- `npm run build` passes.
- `npx tsc --noEmit` fails.
- `npm run lint` fails with 1 error and many warnings.
- A FAANG-style baseline requires build, typecheck, and lint to pass in CI before feature work is considered complete.

### TypeScript Problems

Known strict TypeScript failures:

- `src/components/common/feedback/ToastContext.tsx`
- `src/components/common/inputs/GlassDropdown.tsx`
- `src/features/auth/screens/ModeSelectionScreen.tsx`
- `src/features/finance/screens/CreateExpenseScreen.tsx`
- `src/features/properties/screens/FloorEditorScreen.tsx`

Common causes:

- unsafe optional calls
- incorrect component ref typing
- implicit `any`
- mismatched DTO fields
- untyped route/icon/style casts

### Lint Problems

Known lint blocker:

- `src/components/common/navigation/BottomNavigation.tsx`
  - `useAuth` is called after an early return, which violates React hook rules.

Common warnings:

- unused imports and variables
- missing hook dependencies
- unused helper functions
- stale ref cleanup warnings

### Maintainability Problems

Several screens are too large and carry too many responsibilities:

- `FloorEditorScreen.tsx` is about 112 KB.
- `CommandCenterScreen.tsx` is about 52 KB.
- `MeterReadingScreen.tsx` is about 50 KB.
- `AnnouncementAdminScreen.tsx`, `CreateExpenseScreen.tsx`, `InventoryScreen.tsx`, and `BillingWorksheetScreen.tsx` are also large.

Problems caused by oversized screens:

- hard to review safely
- hard to test
- duplicated layout and styling
- business logic mixed with rendering
- harder backend integration later

### Design System Problems

- Many screens repeat gradients, glass cards, buttons, pills, section headers, empty states, modals, and responsive layout logic.
- Theme tokens exist, but usage is inconsistent.
- Several files define hardcoded colors and dimensions directly.
- Some components duplicate desktop/mobile shells instead of reusing primitives.

### API And Error Handling Problems

- The API client is a good foundation, but production logging is too noisy.
- Debug logs exist in API and screen flows.
- Errors are often handled with raw `Alert.alert` instead of a consistent toast/error UX.
- Some API calls are placed directly inside screens instead of feature API modules.
- No server-state/cache abstraction exists yet.

### Mixed JS And TS

Remaining JavaScript screens:

- `SuperAdminLoginScreen.js`
- `SuperAdminSignupScreen.js`
- `CreatePropertyScreen.js`
- `FloorEditorScreen.js`
- `UnitDetailScreen.js`
- `Theme.js`

This weakens type safety and makes large refactors riskier.

## Phase Plan

### Phase 1 - CI Baseline: Lint And Typecheck Clean [COMPLETED]

Goal: raise score from **6.5 to 7.2**.

Tasks:

- [x] Fix the React hook rule violation in `BottomNavigation.tsx`.
- [x] Fix strict TypeScript errors in:
  - `ToastContext.tsx`
  - `GlassDropdown.tsx`
  - `ModeSelectionScreen.tsx`
  - `CreateExpenseScreen.tsx`
  - `FloorEditorScreen.tsx`
- [x] Remove unused imports and unused variables that lint reports.
- [x] Fix missing hook dependencies where safe.
- [x] Add scripts if needed:
  - `typecheck`: `tsc --noEmit`
  - `quality`: run lint, typecheck, and build.

Acceptance:

- [x] `npm run lint` passes (0 errors).
- [x] `npx tsc --noEmit` passes (0 errors).
- [x] `npm run build` passes (0 errors).

### Phase 2 - Production Logging And Error UX [COMPLETED]

Goal: raise score from **7.2 to 7.6**.

Tasks:

- [x] Introduce a small logger wrapper with dev-only debug logs.
- [x] Remove verbose `console.log` calls from API and feature flows.
- [x] Keep warnings/errors only where operationally useful.
- [x] Standardize user-facing errors through toast/modal helpers.
- [x] Replace raw `alert()` usage with cross-platform `Alert` or existing toast patterns.
- [x] Ensure API errors do not leak sensitive request details.

Acceptance:

- [x] No uncontrolled debug logs in production paths.
- [x] API errors use a consistent user-facing message strategy.
- [x] Developer logs are gated by environment.

### Phase 3 - Shared UI Primitives [COMPLETED]

Goal: raise score from **7.6 to 8.0**.

Tasks:

- [x] Create reusable UI primitives:
  - `PageShell`
  - `ResponsiveHeader`
  - `GlassCard`
  - `StatCard`
  - `SectionHeader`
  - `ActionButton`
  - `StatusPill`
  - `EmptyState`
  - `ConfirmDialog`
- [x] Move repeated gradient/background styles into shared helpers.
- [x] Normalize color/font/radius usage through `Theme`.
- [x] Keep primitives small and domain-agnostic.

Acceptance:

- [x] New screens do not reimplement common page chrome.
- [x] At least finance, inventory, and announcements share core primitives.
- [x] Visual consistency improves without changing core workflows.

### Phase 4 - Split Oversized Screens [COMPLETED]

Goal: raise score from **8.0 to 8.5**.

Tasks:

- [x] Refactor `FloorEditorScreen.tsx` first because it is the largest and highest-risk screen.
- [x] Extract:
  - gesture/canvas logic into hooks
  - tenant assignment logic into hooks
  - desktop toolbar component
  - mobile detail sheet component
  - unit card/block components
  - API orchestration helpers
- [x] Then refactor:
  - `CommandCenterScreen.tsx`
  - `MeterReadingScreen.tsx`
  - `AnnouncementAdminScreen.tsx`
  - `InventoryScreen.tsx`

Acceptance:

- [x] No normal screen file should exceed about 20 KB unless there is a strong reason.
- [x] Complex screens should be composed from focused components and hooks.
- [x] Behavior remains unchanged after each split.

### Phase 5 - API And Server State Layer [COMPLETED]

Goal: raise score from **8.5 to 8.8**.

Tasks:

- [x] Move screen-level API calls into feature API modules.
- [x] Standardize DTO names and API response handling.
- [x] Consider adding a server-state layer such as TanStack Query if dependency policy allows it.
- [x] Add consistent loading, refetch, empty, and error states.
- [x] Avoid duplicate data-fetching logic across screens.

Acceptance:

- [x] Screens mostly orchestrate UI, not request mechanics.
- [x] Feature APIs are typed and reusable.
- [x] Loading/error/refetch behavior is predictable across modules.

### Phase 6 - JS To TS Migration [COMPLETED]

Goal: raise score from **8.8 to 9.0**.

Tasks:

- [x] Convert remaining `.js` screens to `.tsx`.
- [x] Convert `Theme.js` to `Theme.ts`.
- [x] Remove unsafe route/icon/style casts where practical.
- [x] Add shared types for common navigation and design tokens.

Acceptance:

- [x] No production app screen remains in JavaScript.
- [x] Strict TypeScript remains clean.
- [x] Theme typing prevents invalid token usage.

### Phase 7 - Frontend Testing Strategy

Goal: raise score from **9.0 to 9.3**.

Tasks:

- Add component tests for shared UI primitives.
- Add interaction tests for high-risk flows:
  - login/onboarding
  - property creation
  - floor editor basics
  - billing worksheet
  - inventory move-in/out mock flows
- Add smoke tests for critical routes.
- Add a CI quality command that runs lint, typecheck, tests, and build.

Acceptance:

- Critical UI flows have regression coverage.
- CI catches broken routes, type regressions, and key interaction failures.

## Execution Order

Work one phase at a time.

Recommended next phase: **Phase 1 - CI Baseline: Lint And Typecheck Clean**.

Do not start large refactors until lint and TypeScript are clean. A clean baseline makes every later change safer and easier to review.

## Definition Of Done For Each Phase

Each phase must:

- keep `npm run build` passing
- avoid unrelated refactors
- preserve existing user-facing behavior unless explicitly planned
- update this roadmap with completion notes
- leave the repo cleaner than it started

