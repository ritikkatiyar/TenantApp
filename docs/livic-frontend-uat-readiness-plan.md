# Livic Frontend — UAT Readiness & Optimization Plan
Scope: `livic-landlord-fe` (primary, larger surface) + `livic-resident-fe` (same defects, smaller scale). Both ship natively via Play Store and as a web app via Vercel — every phase below accounts for both surfaces.

Sequencing logic: Phase 0 fixes the *guardrails* (so nothing regresses while we work). Phase 1 builds *shared infra* once so Phase 2–3 don't touch the same files twice. Phase 2 is the visible maturity/consistency pass. Phase 3 is the heavy lift (decomposition + data layer). Phase 4 is platform-specific polish. Phase 5 is tests + final sign-off sweep. Do not skip ahead — each phase assumes the previous one's primitives exist.

---

## Phase 0 — Foundation & Guardrails

**Goal:** stop the bleeding before any refactor starts. Fix the PR-review agent's blind spots so Phase 1–5 work can't silently regress.

### Prompt 0.1 — Dead weight cleanup
```
In livic-landlord-fe:
1. Delete the unused root-level `components/`, `hooks/`, `constants/` directories 
   (Expo template scaffolding — confirmed zero imports reference them anywhere 
   in app/ or src/).
2. Delete `create_property.html` at the repo root — it's a static Tailwind-CDN 
   mockup, not part of the app build, not referenced by any route or asset 
   pipeline.
Verify `npm run build` still succeeds after removal.
```

### Prompt 0.2 — Error boundaries (both apps)
```
Add a root-level ErrorBoundary component to both livic-landlord-fe and 
livic-resident-fe:
1. Create src/components/common/feedback/ErrorBoundary.tsx (class component, 
   componentDidCatch, renders a themed fallback screen with a "Reload" action — 
   use existing theme tokens, not hardcoded styles).
2. Wrap the root layout content in app/_layout.tsx with this boundary in both 
   apps, so an uncaught render error in any screen shows the fallback instead of 
   a blank/white screen.
3. Log the caught error via the existing `logger.error()` utility, not raw 
   console.
```

### Prompt 0.3 — Fix and correct the PR-review agent's guideline files
```
Fix the following in this repo:

1. In .agents/rules/ui-consistency.md, section "F. Filter Rows & Header Layouts" 
   is corrupted with encoding artifacts (null bytes / mojibake). Re-save the 
   entire file as clean UTF-8 and reconstruct that section's intent from context 
   (filter rows above card grids should render transparently: flexDirection row, 
   alignItems flex-end, gap 24, marginBottom 32, no background/border) so it 
   reads as valid markdown.

2. Correct .agents/skills/frontend-quality/SKILL.md — it currently claims 
   9.3/10 with all 7 phases COMPLETE. This is inaccurate against the current 
   codebase. Update it to reflect actual state:
   - Remove the false "Phase 4 Split Oversized Screens - COMPLETED" claim. 
     Regenerate the oversized-screens list by running a line-count check across 
     app/ and src/features/**/screens/ in BOTH livic-landlord-fe and 
     livic-resident-fe, and list anything over 500 lines.
   - Remove the "Mixed JS And TS" section listing .js files — verify via 
     `find app src -name "*.js"` in both apps; if none exist, delete that 
     section entirely rather than leaving stale claims.
   - Correct the react-query status to NOT STARTED (it is not yet integrated 
     in either app).
   - Add a "Known regressions" note: self-reported phase completion in this 
     file must be verified against the live codebase (line-count checks, grep 
     for the pattern being claimed as fixed) before being marked COMPLETE — this 
     file was previously inaccurate and caused the PR review agent to review 
     against a false baseline.

3. Add these new enforceable rules to ui-consistency.md:
   - No screen or component file may hardcode a hex color or numeric fontSize. 
     All colors/typography must reference theme.Colors / theme.Typography 
     tokens from useAppTheme(). Flag any `color: '#...'`, `fontSize: <number>`, 
     or hex-literal backgroundColor outside src/theme/Theme.ts.
   - Every text/background color used in a screen must work in BOTH LightColors 
     and DarkColors from Theme.ts — flag any hardcoded value that would fail 
     contrast in one mode.
   - All desktop/mobile/tablet breakpoint checks must use the shared 
     useResponsive() hook. Flag any inline `width >= <number>` breakpoint check 
     outside that hook.
   - Any component fetching shared/global data (properties list, tenant list, 
     etc.) must consume it via the shared react-query hook, not a local 
     useState+useEffect+fetch reimplementation. Flag new local re-fetching of 
     data already available via an existing query hook.
   - Primary navigation chrome (bottom nav, FABs) may use at most a 2-color 
     brand gradient from the existing teal/primary palette. Multi-hue rainbow 
     gradients (3+ unrelated hues), glow/halo shadow effects, and playful 
     iconography (sparkles/stars/bursts) are prohibited on primary navigation — 
     reserve expressive visuals for onboarding/empty-state illustrations only.
   - Loading states for any data fetch must use the shared <Skeleton> primitive 
     (once added in Phase 1), not a bare ActivityIndicator, on any screen with 
     more than a single data point to load.

4. Update SKILL.md's guidelines section to explicitly reference these new 
   ui-consistency.md rules so auto-review-pr.js picks them up (it concatenates 
   frontend-quality/SKILL.md + ui-consistency.md as the guidelines passed to 
   Gemini).

Apply the same corrected ui-consistency.md and SKILL.md logic to 
livic-resident-fe's equivalent .agents files if they exist separately; if 
resident-fe shares the same .agents/ directory at repo root, confirm that and 
skip duplication.
```

### Prompt 0.4 — Lint enforcement
```
In both livic-landlord-fe and livic-resident-fe eslint.config.js, add a rule 
(no-restricted-syntax or a custom rule) that errors on:
- JSXAttribute style objects containing a hex color literal (e.g. /^#[0-9a-fA-F]{3,8}$/) 
  outside src/theme/Theme.ts
- JSXAttribute style objects containing `fontSize: <NumericLiteral>` outside 
  src/theme/Theme.ts
Confirm `npm run lint` still passes on unmodified theme files and only flags 
violations elsewhere (there will be many — that's expected; this rule creates 
the backlog Phase 2 will clear, and prevents new violations from landing while 
Phase 2 is in progress).
```

---

## Phase 1 — Shared Infrastructure (both apps)

**Goal:** build the primitives once, so Phase 2 and Phase 3 touch each screen file exactly one time instead of three.

### Prompt 1.1 — react-query integration
```
In both livic-landlord-fe and livic-resident-fe:
1. Install @tanstack/react-query.
2. Add a QueryClientProvider wrapping the app in app/_layout.tsx, with a 
   sensible default staleTime (5 min) and retry config aligned with the 
   existing apiRequest timeout/error conventions.
3. Create a canonical properties-list query hook (landlord-fe: replace 
   src/hooks/useProperties.ts's local-state implementation with a 
   useQuery(['properties', search], ...) wrapping the existing 
   getMyProperties API call; resident-fe: create the equivalent for whatever 
   list is currently independently fetched per-screen).
4. Wire mutations (togglePropertyActive, deleteProperty, and resident-fe 
   equivalents) to call queryClient.invalidateQueries(['properties']) on 
   success, so every screen consuming the query hook updates automatically.
5. Do NOT touch individual screen files yet — only replace the hook's internals. 
   Existing call sites (`useProperties()`) keep the same external API (same 
   returned shape: properties, isLoading, error, refreshProperties, 
   deleteProperty, togglePropertyActive) so this phase is a drop-in replacement 
   with zero screen-file changes required yet.
6. Verify all 13 landlord-fe screens currently calling useProperties() still 
   work with a single shared query cache — confirm via manual test that 
   updating a property in one screen reflects immediately in another without a 
   manual refresh.
```

### Prompt 1.2 — Responsive primitive upgrade
```
In both apps, upgrade hooks/useResponsive.ts from a binary isDesktop boolean to:

export function useResponsive() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;
  return { isMobile, isTablet, isDesktop, width };
}

Move the breakpoint constants (768, 1024) into src/theme/Theme.ts as named 
exports (Breakpoints.tablet, Breakpoints.desktop) so they're defined once and 
imported by the hook, not hardcoded inline.

Do not migrate call sites yet — that happens screen-by-screen in Phase 3. This 
phase only builds the primitive and keeps isDesktop backward-compatible so 
nothing breaks immediately.
```

### Prompt 1.3 — Shared hover/pressable + skeleton primitives
```
In both apps' src/components/common/:

1. Create inputs/Pressable.tsx — a thin wrapper around React Native's 
   Pressable/TouchableOpacity that automatically applies `cursor: 'pointer'` 
   style when Platform.OS === 'web', so future code never needs the inline 
   `Platform.OS === 'web' ? { cursor: 'pointer' } : {}` check again. Also apply 
   a visible focus ring on web (outline or boxShadow using theme.Colors.primary) 
   for keyboard navigation — currently absent anywhere in the codebase.

2. Create feedback/Skeleton.tsx — a themed shimmer/pulse placeholder component 
   (rectangle with configurable width/height/borderRadius, animated opacity 
   pulse using theme tokens, respects light/dark mode). Export a few common 
   presets (SkeletonCard, SkeletonRow, SkeletonText) for reuse.

Do not migrate the 31 existing inline cursor-pointer checks or existing 
ActivityIndicator usages yet — that happens in Phase 3 alongside screen 
decomposition.
```

---

## Phase 2 — Maturity Pass: Nav Chrome + Design-Token Compliance

**Goal:** the highest-visibility fixes — what a reviewer or UAT tester notices in the first 30 seconds.

### Prompt 2.1 — Bottom nav + AI assistant redesign (both apps)
```
Redesign BottomNavigation.tsx and FloatingAIAssistant.tsx in BOTH 
livic-landlord-fe and livic-resident-fe for a mature, professional B2B SaaS 
look, per the updated ui-consistency.md rules:

1. Replace any rainbow/multi-hue gradient (e.g. #00F2FE → #4FACFE → #7F00FF) 
   with a 2-stop gradient using the existing brand palette 
   (theme.Colors.primary / theme.Colors.inversePrimary or 
   accentGradientStart/End from Theme.ts).
2. Remove glow/halo shadow effects on primary action buttons (e.g. 
   heroCameraGlow-style elements).
3. Replace playful iconography ("sparkles", stars, bursts) with neutral 
   MaterialIcons/Ionicons appropriate to the action (assistant/chat icon at 
   normal saturation, not celebratory).
4. Keep the pill shape and blur/glassmorphic background — that's consistent 
   with the rest of the design language; the issue is the accent treatment, 
   not the shape.
5. Reduce scroll-triggered scale/bounce animation ranges to more restrained 
   values (e.g. scale 1 → 0.95 instead of 1 → 0.74/0.88) for a calmer feel.
6. Ensure BOTH apps end up visually consistent with each other — same gradient 
   stops, same icon treatment, same animation feel — since a landlord and a 
   resident switching between apps (or a reviewer comparing them) should see 
   one coherent product family, not two different design eras.
7. Verify in both light and dark mode, and at both resting and scrolled states.

Do not change navigation behavior or routing — visual treatment only.
```

### Prompt 2.2 — Hardcoded style sweep, landlord-fe (highest volume first)
```
In livic-landlord-fe, sweep all hardcoded hex colors (619 instances) and 
numeric fontSize values (835 instances) outside src/theme/Theme.ts, replacing 
them with the matching theme.Colors / theme.Typography token via useAppTheme().

Process file-by-file, largest violation count first. For each file:
1. Import useAppTheme() if not already present.
2. Map each hardcoded hex to its nearest semantic token (e.g. a text color of 
   #171c1e maps to theme.Colors.onSurface, not a new token — if no existing 
   token fits, flag it rather than inventing one, so we can decide whether 
   Theme.ts needs a new token or the usage should be reconsidered).
3. Map each hardcoded fontSize + fontWeight combination to the closest 
   Typography token (displayMetrics/headlineXl/headlineLg/bodyLg/bodyMd/
   labelCaps/buttonText/labelMuted per ui-consistency.md's table).
4. After each file, verify the screen renders correctly in BOTH light and dark 
   mode — this sweep is also the dark-mode contrast bug fix, since tokens 
   resolve per-mode and hardcoded hex values don't.
5. Run `npm run lint` after each batch to confirm the Phase 0.4 rule no longer 
   flags that file.

Do this in batches of 5-8 files, verifying build + visual correctness between 
batches rather than one giant commit.
```

### Prompt 2.3 — Hardcoded style sweep, resident-fe
```
Repeat Prompt 2.2's process for livic-resident-fe (277 fontSize instances, 154 
hex color instances) — same file-by-file, largest-first, verify-both-modes 
approach.
```

---

## Phase 3 — Screen Decomposition + React-Query Wiring (combined pass)

**Goal:** one touch per oversized file — react-query migration, responsive-hook migration, and component extraction happen together, since re-opening the same file three separate times wastes effort and risks regressions.

**Order (money-critical first, landlord-fe before resident-fe):**
1. Finance/billing screens (landlord-fe): `BillingScreen`, `BillingWorksheetScreen`, `RentRollScreen`, `CreateExpenseScreen`, `ExpenseConfigurationScreen`, `MeterReadingScreen`, `LedgerScreen`
2. Properties/floor screens (landlord-fe): `FloorLayoutViewerModal` (1867 lines — largest, highest risk), `CommandCenterScreen`, `CreatePropertyScreen`, `EditPropertyScreen`, `FloorEditorScreen`, `FloorListOverviewScreen`
3. Remaining landlord-fe: `settings.tsx`, `OwnerLeasesScreen`, `AnnouncementAdminScreen`, `InventoryScreen`, `MembershipManagementScreen`
4. resident-fe: `AIAssistantScreen`, `FloatingAIAssistant` (already touched in Phase 2, verify size after), `TenantPaymentsScreen`, `TenantMaintenanceScreen`, `SuperAdminSignupScreen`

### Prompt 3.1 — Per-screen decomposition template (repeat per file above)
```
Refactor <SCREEN_FILE> in <APP>:

1. Extract all data-fetching (any local useState+useEffect+apiRequest/fetch 
   pattern) into a dedicated hook in the feature's hooks/ directory, using 
   react-query's useQuery/useMutation, following the pattern established in 
   Phase 1.1's useProperties migration. Type the query response properly — 
   this should eliminate most `any`/`as any` usages currently in this file.
2. Replace any inline `width >= 900` (or similar) breakpoint check with the 
   upgraded useResponsive() hook from Phase 1.2 (isMobile/isTablet/isDesktop).
3. Replace bare ActivityIndicator loading states with the <Skeleton> primitive 
   from Phase 1.3, sized appropriately for the content being loaded.
4. Replace any inline `Platform.OS === 'web' ? cursor stuff` with the 
   <Pressable> primitive from Phase 1.3.
5. Extract logically distinct sections into their own components under the 
   feature's components/ directory — target: no single screen file over 
   ~400-500 lines after this pass. Extract by responsibility (e.g. a form 
   section, a summary card, a modal, a list section), not arbitrarily by line 
   count.
6. Preserve exact existing behavior — this is a structural refactor, not a 
   feature change. Run existing tests (if any cover this screen) and manually 
   verify the screen against its pre-refactor behavior before moving to the 
   next file.
7. Verify TypeScript strict mode is clean for this file with zero `any` 
   remaining unless truly unavoidable (document why, inline, if so).

Apply this template to each file in the Phase 3 order above, one file per 
commit, verifying `npm run quality` passes after each.
```

---

## Phase 4 — Platform-Specific Polish (native ≠ web, both need distinct passes)

### Prompt 4.1 — Native (Play Store) polish, both apps
```
In both livic-landlord-fe and livic-resident-fe:
1. Audit every screen for SafeAreaView/useSafeAreaInsets usage — landlord-fe 
   currently covers 28 files, resident-fe only 14. Identify screens missing 
   safe-area handling (particularly full-screen modals and any screen with 
   content near the top/bottom edge) and add it, respecting notch/gesture-bar 
   areas consistently.
2. Add expo-haptics feedback (already a dependency) to primary actions that 
   currently lack it — successful form submissions, destructive confirmations, 
   toggle switches — for tactile native-feel consistency across both apps.
3. Verify splash screen and adaptive icon assets render correctly on a real 
   Android build (not just the web preview) — confirm android-icon-foreground/
   background/monochrome images are all present and correctly composited per 
   app.json config.
4. Confirm no web-only interaction assumptions (hover-dependent affordances, 
   cursor-pointer-only cues) are the SOLE way to discover an action on native — 
   every interactive element must be obviously tappable without a hover state.
```

### Prompt 4.2 — Web (Vercel) polish, both apps
```
In both apps:
1. Add resource hints to the Expo web export: preconnect to the production API 
   domain (from EXPO_PUBLIC_API_URL) and the AI API domain, via a custom 
   web/index.html or Expo config plugin injecting <link rel="preconnect"> tags.
2. Verify keyboard-focus visibility across all interactive elements on web — 
   confirm the Phase 1.3 <Pressable> primitive's focus ring is actually applied 
   app-wide, not just newly-touched screens; add it to any remaining raw 
   TouchableOpacity usages that survived Phase 3.
3. Verify favicon, page title, and basic meta tags reflect the actual product 
   (Livic Landlord / Livic Resident) rather than Expo scaffold defaults — check 
   app.json's web.name/title config and the generated dist/index.html.
4. Spot-check the 56px-tall mobile-optimized pill buttons (per ui-consistency.md's 
   button sizing spec) on a wide desktop viewport (1440px+) — confirm the 
   desktop button-height variant (46px per existing spec) is actually applied 
   via useResponsive(), not defaulting to mobile sizing on web.
```

### Prompt 4.3 — Remaining performance items (both apps)
```
1. Set `lazy: true` on the root Stack/Tabs navigator config in app/_layout.tsx 
   for both apps, so inactive routes don't mount and fetch on cold start.
2. Swap FlatList → FlashList (@shopify/flash-list) in landlord-fe's 
   LedgerScreen, MembershipManagementScreen, and CommandCenterScreen list 
   views, and any equivalent long-list screens in resident-fe.
3. Add expo-image Image.prefetch() calls for property/unit images on list 
   screens, triggered when the user is likely about to navigate to a detail 
   screen (e.g. prefetch on properties-list scroll-into-view, not on mount of 
   the whole list).
```

---

## Phase 5 — Tests + Final QA Sweep

### Prompt 5.1 — Critical-path test coverage
```
Add test coverage for the finance/billing flows in livic-landlord-fe first 
(money-correctness is the highest UAT scrutiny area): BillingWorksheetScreen 
(exists, verify still passing post-refactor), RentRollScreen, LedgerScreen, 
CreateExpenseScreen, MeterReadingScreen. Use the existing @testing-library/
react-native + jest-expo setup. Focus tests on: correct rendering of fetched 
data, correct behavior on mutation (create/edit/delete expense), and error 
states rendering the expected UI.

Then extend coverage to resident-fe's TenantPaymentsScreen and 
TenantMaintenanceScreen equivalents.

Tests should now be straightforward given Phase 3's decomposition — each 
extracted component/hook can be tested in isolation rather than mocking an 
entire 1000+ line screen.
```

### Prompt 5.2 — Final manual QA sweep (pre-UAT gate)
```
Manual QA checklist to run across BOTH apps before UAT sign-off, for EVERY 
screen:
[ ] Light mode — text legible, no low-contrast text-on-background
[ ] Dark mode — same check
[ ] Mobile viewport (< 768px)
[ ] Tablet viewport (768-1024px)
[ ] Desktop viewport (1024px+)
[ ] Loading state shows Skeleton, not blank flash or bare spinner
[ ] Error state shows a user-facing message, not a silent failure or crash
[ ] `npm run quality` (lint + typecheck + test + build) passes clean in both 
    apps

Log any remaining violations found during this sweep as issues, not silent 
fixes — this sweep is the gate that determines UAT readiness, so its output 
should be a tracked list, not just ad-hoc patches.
```
