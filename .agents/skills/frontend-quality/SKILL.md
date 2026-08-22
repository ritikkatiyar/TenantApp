---
name: frontend-quality
description: "FAANG-grade quality roadmap, lint rules, React hooks safety, TypeScript rules, shared UI layout primitives, split screen hooks patterns, offline Expo execution, and testing standards."
---

# Frontend FAANG Quality Roadmap

## Current Rating

Current frontend quality score: **8.0 / 10** (Phase 3 complete)

> [!WARNING]
> **Known Regressions & Baseline Verification**: Self-reported phase completion in this file must be verified against the live codebase (via line-count checks, grep checks, etc.) before being marked COMPLETE. This file was previously inaccurate (claiming completion of Phase 4 and Phase 5 before they were implemented), causing the PR review agent to review against a false baseline.

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
- `npm run lint` fails with errors and warnings.
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

Several screens are too large (exceeding 500 lines) and carry too many responsibilities:

**livic-landlord-fe:**
- `app/settings.tsx` (1403 lines)
- `src/features/leases/screens/OwnerLeasesScreen.tsx` (1305 lines)
- `src/features/properties/screens/CommandCenterScreen.tsx` (1302 lines)
- `src/features/finance/screens/RentRollScreen.tsx` (1144 lines)
- `src/features/finance/screens/CreateExpenseScreen.tsx` (1118 lines)
- `src/features/finance/screens/BillingScreen.tsx` (1063 lines)
- `src/features/properties/screens/CreatePropertyScreen.tsx` (1051 lines)
- `src/features/finance/screens/MeterReadingScreen.tsx` (947 lines)
- `src/features/properties/screens/EditPropertyScreen.tsx` (946 lines)
- `src/features/finance/screens/BillingWorksheetScreen.tsx` (935 lines)
- `src/features/properties/screens/FloorEditorScreen.tsx` (912 lines)
- `src/features/finance/screens/ExpenseConfigurationScreen.tsx` (893 lines)
- `src/features/properties/screens/FloorListOverviewScreen.tsx` (859 lines)
- `app/reports.tsx` (852 lines)
- `src/features/announcements/screens/AnnouncementAdminScreen.tsx` (799 lines)
- `src/features/finance/screens/LedgerScreen.tsx` (677 lines)
- `src/features/finance/screens/SettingsMenuScreen.tsx` (652 lines)
- `src/features/ai/screens/AIAssistantScreen.tsx` (636 lines)
- `app/escalations.tsx` (629 lines)

**livic-resident-fe:**
- `src/features/ai/screens/AIAssistantScreen.tsx` (639 lines)

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

### Phase 4 - Split Oversized Screens [NOT STARTED]

Goal: raise score from **8.0 to 8.5**.

Tasks:
- [ ] Refactor the largest and highest-risk screens: `FloorEditorScreen.tsx`, `CommandCenterScreen.tsx`, `MeterReadingScreen.tsx`, etc.
- [ ] Extract:
  - gesture/canvas logic into hooks
  - tenant assignment logic into hooks
  - desktop toolbar component
  - mobile detail sheet component
  - unit card/block components
  - API orchestration helpers

Acceptance:
- [ ] No normal screen file should exceed about 500 lines.
- [ ] Complex screens should be composed from focused components and hooks.
- [ ] Behavior remains unchanged after each split.

### Phase 5 - API And Server State Layer [NOT STARTED]

Goal: raise score from **8.5 to 8.8**.

Tasks:
- [ ] Integrate `@tanstack/react-query` and create server state query hooks.
- [ ] Move screen-level API calls into feature API modules.
- [ ] Standardize DTO names and API response handling.
- [ ] Add consistent loading, refetch, empty, and error states.
- [ ] Avoid duplicate data-fetching logic across screens.

Acceptance:
- [ ] Screens mostly orchestrate UI, not request mechanics.
- [ ] Feature APIs are typed and reusable.
- [ ] Loading/error/refetch behavior is predictable across modules.

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

### Phase 7 - Frontend Testing Strategy [NOT STARTED]

Goal: raise score from **9.0 to 9.3**.

Tasks:
- [ ] Add component tests for shared UI primitives.
- [ ] Add interaction tests for high-risk flows:
  - login/onboarding
  - property creation
  - floor editor basics
  - billing worksheet
  - inventory move-in/out mock flows
- [ ] Add smoke tests for critical routes.
- [ ] Add a CI quality command that runs lint, typecheck, tests, and build.

Acceptance:
- [ ] Critical UI flows have regression coverage.
- [ ] CI catches broken routes, type regressions, and key interaction failures.

## Execution Order

Work one phase at a time.

Recommended next phase: **Phase 1 - Shared Infrastructure (react-query integration, responsive primitive upgrade, shared pressable & skeleton primitives)**.

## Definition Of Done For Each Phase

Each phase must:
- keep `npm run build` passing
- avoid unrelated refactors
- preserve existing user-facing behavior unless explicitly planned
- update this roadmap with completion notes
- leave the repo cleaner than it started

## Design & UI Consistency Rules (Aura Alignment)

All screens and UI controls must strictly match the light-themed glassmorphism style of the application:
- **Modal Styling**:
  - Never use dark `tint="dark"` in `<BlurView>` overlays for dialogs/modals unless explicitly specified. Always use `tint="light"`.
  - Modal background overlays (`modalOverlay`) should use a soft translucent slate backdrop (e.g., `rgba(15, 23, 42, 0.3)`) instead of heavy black blocks.
  - Modal card containers (`modalContent`) must have soft borders (`borderWidth: 1`, `borderColor: 'rgba(255, 255, 255, 0.8)'`) and translucent backgrounds (`backgroundColor: 'rgba(255, 255, 255, 0.9)'`) to align with the rest of the application's glassmorphism style.
- **Design Token & Styling Constraints (UAT Compliance)**:
  - All style specifications must strictly follow the rules defined in `.agents/rules/ui-consistency.md` (specifically referencing the constraints in Section 6).
  - No hardcoded hex color literals or numeric font sizes are allowed in component style definitions.
  - The shared `useResponsive()` hook must be used for layout responsiveness checks instead of inline media checks.
  - Shared global data must be retrieved via `react-query` hooks instead of local `useEffect` re-fetches.
