# Livic Frontend — Master Production-Readiness Plan (Definitive, One-Shot)

**Status: pre-production.** No backward-compatibility constraints exist yet — breaking changes are cheap now and expensive later. This plan is written to take full advantage of that while it's true.

**Priority: mobile app is the primary product; web is secondary but must remain fully resolution-adaptive, not lower quality.** Every fix below must be verified on native mobile, web-mobile-width, tablet, and desktop — not just desktop, since desktop is not the first impression this product makes.

This supersedes and consolidates every prior partial plan from this conversation. Execute in the order given — later parts assume earlier parts exist.

---

## PART 0 — Maintain Copied/Duplicated UI Components (Do NOT Extract)

We will skip extracting shared packages to keep the structure simple. Any changes to shared elements (e.g. `Theme.ts`, `ThemeContext.tsx`, common components in `src/components/common/**`, custom hooks in `src/hooks/`, or network client files in `src/api/client.ts`) will be maintained and duplicated directly in both `livic-landlord-fe` and `livic-resident-fe` to avoid monorepo/bundler overhead and keep deployment pipelines clean.

Verify both apps build and run, light/dark, before proceeding.

---

From here on, "fix X" means fix it in both apps where the component lives, unless the issue is screen-specific (most of Parts D onward are screen-specific and still need touching in both apps).

---

## PART 1 — Immediate High-Leverage Fixes (small effort, large visible impact — do these before the big structural work)

### 1.1 — `GlassCard` dark-mode bug (the root cause of most "dark mode looks muddy" reports)
`GlassCard.tsx` hardcodes `backgroundColor: 'rgba(255, 255, 255, 0.4)'` regardless of theme mode, even though `Theme.ts` already defines the correct token (`glassFill`) for both light and dark, and `GlassCard` already correctly uses the sibling token `glassStroke` for its border. One-line fix:
```
backgroundColor: 'rgba(255, 255, 255, 0.4)'  →  backgroundColor: theme.Colors.glassFill
```
This alone should visibly fix a large share of the dark-mode complaints across every screen that uses `GlassCard` (most of them).

### 1.2 — Login screen dark mode (separate bug — does NOT use `GlassCard`)
`SuperAdminLoginScreen.tsx` hand-rolls its own card using a `BlurView` with multiple hardcoded `rgba(255, 255, 255, X)` literals (0.2, 0.8, 1.0 at various points) that never adapt to dark mode — this is why the login screen looks like a flat grey card in dark mode instead of a proper dark glass surface. Replace every hardcoded `rgba(255,255,255,X)` in this file with the appropriate `theme.Colors.glassFill`/`glassStroke` (or a new dedicated token if the exact opacity doesn't match an existing one — add it to `Theme.ts` rather than leaving a literal).

### 1.3 — Sidebar dark-mode contrast
`SidebarNavigation.tsx` has its own hardcoded literals independent of the above: `rgba(255, 255, 255, 0.5)` (brand logo background) and the `"#f59e0b"` amber sun-icon color (also flagged in 1.5 below). Fix both to theme tokens.

### 1.4 — Duplicate dark-mode toggle (two visible on desktop at once)
`SidebarNavigation` (persistent, rendered once from `app/_layout.tsx`) and `DesktopNavBar` (rendered per-screen, alongside the sidebar) both independently implement their own theme-toggle button — so desktop shows two live toggles simultaneously. Decision: the toggle is a persistent app-level setting, so it belongs only in the persistent shell.
```
Remove the theme toggle from DesktopNavBar.tsx entirely. Keep it only in 
SidebarNavigation.tsx (desktop) and MobileMoreSheet.tsx (mobile, already 
the sole instance there since mobile has no competing persistent sidebar).
```

### 1.5 — Broaden the hex-color guardrail (it has three known blind spots)
The earlier "hardcoded hex color" sweep only checked `color: '#...'` inside `StyleSheet.create()` blocks. Three categories slipped through, confirmed present:
- `rgba(...)`/`hsla(...)` literals (302+ instances of `rgba(255,...)`, 45+ of `rgba(0,0,0,...)`)
- Inline JSX color props (`color={isDark ? "#f59e0b" : ...}`) — not caught by the `color:` object-key pattern
- These exist in `GlassCard`, login, sidebar, and likely more files not yet audited

Re-run a proper sweep (Part 3 below) using a pattern that catches all three forms, not just the original one.

### 1.6 — Real data on the Portfolio stat cards (still not fixed — confirmed still showing placeholders in the current build)
`CommandCenterScreen.tsx` ("Portfolio" screen — see Part 6 naming note) still shows `OCCUPANCY: 'LIVE'`, `REVENUE: 'READY'`, `ALERTS: '00'` as literal placeholder strings, confirmed in the latest screenshot. Real data already exists: `src/features/analytics/api/analytics.api.ts` (`getAnalyticsSummary`, `getPortfolioOccupancy`) is already used elsewhere in the app (`AnalyticsDashboardScreen.tsx`) — wire it into the Portfolio stat cards via a shared React Query hook. See Part 6 for the full spec.

---

## PART 2 — The Triple-Navigation Bug ("two side panels appear when I click Manage")

Confirmed root cause: there are not two but **three independent navigation implementations** in this codebase:
1. `SidebarNavigation.tsx` — persistent, global, rendered once from `_layout.tsx`.
2. `DesktopNavBar.tsx` — per-screen top chrome.
3. **`EditPropertyScreen.tsx` and `CreatePropertyScreen.tsx` hand-roll their own third sidebar** (`renderSidebarLink('Command Center' / 'Finance & Billing' / 'AI Concierge' / 'System Profiles')`) — a bespoke "property editor" navigation panel that renders as a full second sidebar next to the app's real sidebar. This is exactly the "two side panels" bug when clicking "Manage" — it's not a rendering glitch, it's two real, independently-built sidebar components stacked next to each other.

```
1. Remove the hand-rolled inline sidebar from EditPropertyScreen.tsx and 
   CreatePropertyScreen.tsx entirely.
2. Design how property-editor sub-navigation (Command Center / Finance & 
   Billing / AI Concierge / System Profiles) should actually work: either 
   (a) these become tabs/segments within the single existing 
   SidebarNavigation, contextually shown only while inside a property's 
   edit flow, or (b) they become a secondary in-content tab bar BELOW the 
   DesktopNavBar (not a second full-height sidebar) — pick (b) unless there 
   is a strong reason for (a), since a second full sidebar competing with 
   the primary one is the exact bug being fixed, and a secondary tab bar 
   reads more clearly as "you are inside a sub-section" without duplicating 
   primary navigation chrome.
3. Verify "Manage" now shows exactly one sidebar (the persistent app one) 
   plus, if option (b) was chosen, one in-content tab bar for the 
   property-editor sub-sections — not two full sidebars.
4. Apply the equivalent fix to livic-resident-fe if the same pattern exists 
   there.
```

---

## PART 3 — Typography: Fix the Token System Itself, Then Sweep Usage

Found while auditing: `theme.Typography` has **inconsistent key naming within the same file** — `SidebarNavigation.tsx` alone uses `theme.Typography.HeadlineSmall` (PascalCase), `theme.Typography.headlineMd` (camelCase), and `theme.Typography.BodySmall`/`BodyMedium` (PascalCase) in the same component. This strongly suggests two overlapping typography systems were merged into one object at some point, rather than a single clean set of tokens.

```
1. Open src/theme/Theme.ts and list every key currently defined on the 
   Typography object. Identify duplicates/near-duplicates (e.g. a PascalCase 
   set and a camelCase set covering overlapping semantic sizes) and 
   determine which is the intended canonical set.
2. Canonicalize to ONE naming convention (recommend camelCase to match the 
   rest of Theme.ts's Spacing/Colors token naming) and remove the 
   duplicate/legacy set — do not keep both "for compatibility," since that's 
   exactly what caused this mess. Update every call site referencing the 
   removed set to the canonical one.
3. Separately, sweep every hardcoded fontWeight value outside Theme.ts 
   (91 files currently mix theme.Typography usage with standalone 
   fontWeight literals — 318 uses of '800', 203 of '700', 128 of '600', 53 
   of '900', plus stray '500'/'bold'/'normal'/'400') and replace with the 
   correct canonical Typography variant, which should bundle fontSize + 
   fontWeight + fontFamily together rather than setting fontWeight standalone.
4. Where a raw value doesn't match any canonical variant's weight, flag it 
   for review rather than silently coercing — it may indicate a genuinely 
   missing token.

Process file-by-file, verify no unintended visual change beyond the 
consolidation itself.
```

---

## PART 4 — Spacing Token Sweep

Same pattern as color/typography: `Theme.ts` already defines a `Spacing` scale (8px-multiple system), already documented in `ui-consistency.md` Section 1.C, but 30+ distinct raw pixel values are hardcoded across screen style files instead of the tokens.

```
Sweep every *.styles.ts and inline StyleSheet.create block, replacing 
hardcoded paddingHorizontal/paddingVertical/paddingTop/paddingBottom/
margin*/gap numeric values with the matching Spacing token. Flag values 
that don't cleanly match any token rather than force-rounding them. 
Process largest-violation-count files first.
```

---

## PART 5 — `PageShell` Adoption (all ~30 top-level screens per app)

Only 6 of ~30 top-level screens currently use the shared `PageShell` layout component; everything else hand-builds its own safe-area handling, background, and scroll container — this is the root structural cause of "every screen feels like it's doing its own thing."

```
Migrate every top-level screen (full list: app/admin.tsx, app/ai.tsx, 
app/analytics.tsx, app/announcements.tsx, app/billing.tsx, 
app/command-center.tsx, app/create-expense.tsx, app/escalations.tsx, 
app/expenses/*.tsx, app/inventory.tsx, app/leases.tsx, app/login.tsx, 
app/mode-selection.tsx, app/onboarding.tsx, app/properties/create.tsx, 
app/signup.tsx, and every src/features/**/screens/*.tsx not already listed 
as a current PageShell adopter) to wrap its root in <PageShell>, removing 
its own SafeAreaView/background/outer-scroll implementation. Verify each 
screen's behavior (scrollable vs list-owns-scroll, keyboard-avoiding or 
not) individually rather than assuming one config fits all. If PageShell 
lacks a needed capability (e.g. a fixed header above a scrolling body), add 
the capability to PageShell rather than working around its absence per 
screen — flag any such gap found during migration.

While touching PageShell.tsx: fix its untyped `theme: any` parameter to use 
the app's real Theme type, since every screen will now depend on this file.
```

---

## PART 6 — Per-Screen Fixes and Redesigns

Apply Parts 1-5 as the foundation, then address these screen-specific issues. Cover every screen in this list — this is the explicit full scope: **Overview, Portfolio, Reports, AI Desk, Leases, Inventory, Escalations, Announcements, Finance & Billing, Settings, Upgrade Plan/Subscription.**

### 6.1 — Naming clarification (resolve before starting — confirm in code, don't assume)
The sidebar has both an "Overview" nav item and a separate "Portfolio" nav item. The "My Properties" screen with property cards and stat cards (currently `CommandCenterScreen.tsx`, reached via `app/command-center.tsx`) appears to be bound to "Portfolio," based on its stat-card content matching what was described as the Portfolio screen. Confirm in the actual router/nav config which screen file each of "Overview" and "Portfolio" actually renders — do not assume they're the same screen. If "Overview" currently has no distinct implementation or renders something minimal, that's Part 6.2's target.

### 6.2 — Overview screen: needs a real statistical-overview design
Whatever screen is genuinely bound to "Overview" (confirm per 6.1) needs a purpose-built dashboard feel — key portfolio metrics, trends, at-a-glance status — not a bare list or a copy of the Portfolio screen's property grid. Use `PageShell` + `GlassCard` + real data (same analytics API already used elsewhere) + charts/visual summaries where they add clarity (recharts is already available per the artifact tooling in this environment, but for the actual RN app, check what charting library — if any — is already a dependency before adding a new one).

### 6.3 — Portfolio screen (`CommandCenterScreen.tsx`)
- **Real stat card data** (see Part 1.6) — highest priority, currently still showing placeholders.
- **Property card layout overflow bug**: the isometric building illustration and the "Vacant/Partial/Occupied" legend badge visibly extend outside the card's boundaries in the current build (confirmed in screenshot — the diagonal red-striped graphic and legend chip both spill past the card edge). Fix `PropertyCard.tsx`: add `overflow: 'hidden'` to the card container and/or reposition the illustration/legend so they're fully contained within the card bounds at every viewport width, not just the width it happened to be designed at.
- **Search bar placement**: currently lives inside `DesktopNavBar` for this screen specifically ("Search portfolio..." in the top bar) while Reports puts its search inline in page content. Decide and apply consistently across the app (see Part 7.3).
- Apply `PropertySelector`, notification badge, mobile filter wiring, search-empty-state per the earlier scoped work.

### 6.4 — Reports screen
This is the current best reference for visual polish (uses `PageShell`, `GlassCard`, `StatusPill`, `EmptyState`, `DesktopNavBar` properly) — use it as the pattern other screens should match, not as a screen needing its own fixes, aside from whatever Parts 1-5 touch automatically (typography/spacing token sweep, GlassCard dark-mode fix).

### 6.5 — Floor Overview screen (`FloorListOverviewScreen.tsx`)
Currently renders as a single-column vertical stack of full-width floor cards (Floor 5, Floor 4, Floor 3... each on its own row) regardless of viewport width. Needs a responsive grid: multiple floor cards per row on wide viewports (desktop/tablet), collapsing to a single column only at mobile width — using `useResponsive()`, not a fixed single-column list at every size.

### 6.6 — Subscription / Upgrade Plan
Two entry points exist: the sidebar's "UPGRADE PLAN" button and Settings' "Subscription & Plan" card. **Confirm first** whether both route to the same `BillingScreen`/plan-selection screen (fine — multiple entry points to one screen is normal) or whether there are genuinely two different implementations (not fine — consolidate to one). Separately, confirmed bug regardless: `BillingScreen`'s plan grid uses `isDesktop` to decide between a multi-column grid and a single-tile layout, but currently renders single-tile even at real desktop widths — this is very likely the pre-Part-3(earlier)/breakpoint-standardization bug reasserting itself here specifically. Re-verify this screen explicitly once `useResponsive()`'s tightened `isDesktop`/`isTablet`/`isMobile` thresholds are in place (per the earlier-scoped Phase 1.2 work) — confirm the grid renders correctly at real desktop widths, don't just assume the global hook fix resolved every call site.

### 6.7 — AI Desk, Leases, Inventory, Escalations, Announcements, Finance & Billing, Settings
Apply Parts 1-5 (PageShell, PropertySelector where property-scoped, typography/spacing tokens, header consolidation per Part 7) to each. `AnnouncementComposer.tsx`'s direct `GlassDropdown` usage for property targeting specifically needs to become `<PropertySelector>` (already scoped earlier). No additional screen-specific redesign called out for these beyond the systemic fixes, unless further per-screen issues surface during migration — flag rather than silently skip if something screen-specific is found.

---

## PART 7 — Navbar Consolidation (the "scattered, no consistency, unfinished product" feeling)

Confirmed concretely from screenshots, not just impression:
- Reports' top bar shows only theme-toggle + avatar. Portfolio's top bar shows a search box + notification bell + theme-toggle + avatar. Different screens render different subsets of controls in the same chrome region.
- Search lives in the navbar on Portfolio, but inline in page content on Reports.
- The triple-sidebar bug (Part 2) is itself a navbar consistency failure.

### 7.1 — `DesktopNavBar` must render a consistent baseline control set on every screen
```
Define DesktopNavBar's standard right-side control set once: notification 
bell (global, always present, unread-count badge sourced from the same 
alert-count data as the Portfolio stat card), avatar/profile menu. These 
render on EVERY screen using DesktopNavBar, unconditionally — not opted in 
per screen. (Theme toggle is explicitly excluded per Part 1.4's decision — 
it lives only in SidebarNavigation/MobileMoreSheet.)
```

### 7.2 — Mobile header consistency
```
Audit every screen's mobile header against the shared MobileHeader 
component (src/components/common/navigation/MobileHeader.tsx). Migrate any 
screen hand-rolling its own header markup instead of importing the shared 
component. Genuine per-screen variation (an extra action icon, a different 
title) becomes a prop on the shared component, not a forked implementation.
```

### 7.3 — Search placement — one explicit rule, not "put it everywhere the same way"
Global/cross-cutting search (searching across the whole portfolio) belongs in `DesktopNavBar`'s global search slot. Contextual/page-scoped search (searching tenants within this month's statements, filtering a specific list already on screen) belongs inline in that page's content, near what it filters. This is a deliberate distinction, not an inconsistency — document it as an explicit rule in `ui-consistency.md` so it's a decision, not a drift:
```
Add to ui-consistency.md: "Search inputs: portfolio-wide/cross-screen 
search belongs in DesktopNavBar's global search slot. Search that filters 
only the current screen's already-visible list belongs inline in that 
screen's content, adjacent to the list it filters. A screen must not 
implement its own global-style search bar inside its content area, and the 
navbar's global search must not be repurposed as a page-local filter."
```

---

## PART 8 — Mobile Floating Navigation Bar Redesign

The current mobile floating bar (bottom nav / AI assistant orb) needs a genuinely polished redesign — not just the color/glow fix already scoped earlier (Part 2.1 of the prior plan), but the actual construction quality. Design toward this standard (describing the pattern, not reproducing any specific app's exact proprietary design):

```
Redesign the mobile floating bottom bar (BottomNavigation.tsx + 
FloatingAIAssistant.tsx) to the following spec:
1. A compact, fully rounded pill container, floating above the safe-area 
   bottom inset with consistent margin on all sides — never touching or 
   overlapping page content, and never overlapped BY page content 
   (check z-index/elevation ordering; the current build shows the bar 
   overlapping nearby text, which must not happen).
2. 3-5 primary destinations shown as icon (+ optional short label) touch 
   targets, minimum 48x48dp hit area, with a clear active-state indicator 
   (filled icon, color change, or a small indicator dot/pill background — 
   pick one, apply consistently).
3. Subtle elevation (soft shadow, not a heavy hard-edged drop shadow) so it 
   reads as floating above content, consistent with the app's existing 
   glassmorphic language (use theme.Colors.glassFill/glassStroke, not new 
   hardcoded values).
4. If a central "hero" action (e.g. AI assistant) is included, it can be 
   slightly raised/emphasized versus the other icons, but per the earlier 
   guardrail: no multi-hue rainbow gradient, no glow halo, no playful 
   iconography (sparkles/stars) — restrained, at most a 2-color gradient 
   from the existing brand palette.
5. Smooth show/hide or scale transition on scroll (already exists in some 
   form — verify the transition range is restrained per the earlier fix, 
   not the original bouncy 1→0.74 range).
6. Verify: the bar never sits on top of unrelated text/content (fix 
   whatever positioning/z-index issue is causing the current overlap seen 
   in the build), works correctly across small and large phone screens, 
   and looks identical in construction (not necessarily nav destinations) 
   between livic-landlord-fe and livic-resident-fe once this lives in the 
   shared package.
```

---

## PART 9 — Pagination Consistency

No shared pagination component currently exists — list screens (properties, ledger entries, tenants, announcements, escalations, inventory items, rent-roll rows, etc.) either fetch everything unpaginated or implement ad-hoc "load more" logic per screen.

```
1. Create a shared <Pagination> component (packages/ui once Part 0 is done) 
   — a consistent control (page numbers or prev/next, your call on visual 
   style, but ONE style used everywhere) plus a shared usePaginatedQuery 
   hook wrapping React Query with a fixed default page size of 20 records.
2. Apply it to every screen rendering a list of records that could exceed 
   20 items: properties list, tenant/lease lists, ledger/rent-roll entries, 
   announcements, escalations, inventory items, billing worksheet rows.
3. Page size (20) must be a single shared constant, not redefined per 
   screen.
```

---

## PART 10 — Systemic Responsive Verification (not just fixing the hook, verifying the screens)

Some screens currently show mobile and desktop layouts merged/broken together (elements from both layouts rendering simultaneously) — this is a symptom of the pre-Part-0-shared, pre-standardized breakpoint chaos already partially addressed, but the hook fix alone doesn't guarantee every screen's layout logic was actually built correctly against it.

```
After Parts 0-9 land, do an explicit responsive QA pass — not a code 
change, a verification pass — on every screen in the Part 6 list, at four 
concrete widths: mobile (~375px), tablet (~768px), small desktop (~1024px), 
large desktop (~1440px). For each screen at each width, confirm: no 
mobile-only and desktop-only elements rendering simultaneously, no 
horizontal overflow/clipping, no element extending outside its container 
(per the PropertyCard bug pattern — check for other instances of this same 
class of bug elsewhere), text remains legible and not truncated 
unexpectedly. Log findings as a tracked list per screen rather than 
silently patching — this pass is what determines actual production 
readiness, not a subjective "looks fine" pass.
```

---

## PART 11 — Guardrail File Updates (so none of this regresses again)

**Outstanding dependency, unchanged:** `fix/pr-agent-guideline-accuracy` branch (path bug fix in `auto-review-pr.js`, `frontend-engineering/SKILL.md`, `sql-migration-standards.md`) is still unmerged. Land it — otherwise everything in this plan ships unreviewed, exactly like the last large merge did.

Add to `.agents/rules/ui-consistency.md` Section 6 (continuing numbering from whatever already exists there):

```
- PageShell Is Mandatory for every top-level screen — no hand-rolled 
  SafeAreaView/background/outer-scroll.
- Spacing Token Enforcement — no raw numeric padding/margin/gap outside 
  Theme.ts.
- Single Property Selector Component — no bespoke property-selection UI.
- Shared Header Components Only — DesktopNavBar (desktop) / MobileHeader 
  (mobile) mandatory, no hand-rolled headers, no secondary hand-rolled 
  sidebars (the Part 2 bug class).
- Typography Token Enforcement — no standalone hardcoded fontWeight; use 
  canonical theme.Typography variants only (post Part 3 cleanup — one 
  naming convention, not two).
- Color Literal Enforcement, broadened — no #hex, no rgba()/hsla(), no 
  inline JSX color-prop literals, anywhere outside Theme.ts.
- No Duplicated Cross-App Code — shared-intent code lives in packages/ui, 
  never copy-pasted into both apps.
- Consistent Navbar Controls — DesktopNavBar's control set (search-if-
  applicable, notification bell, avatar) must be uniform across every 
  screen using it, not opted in/out per screen. Theme toggle lives only in 
  SidebarNavigation/MobileMoreSheet, never in DesktopNavBar.
- Search Placement Rule — global search in DesktopNavBar's slot only; 
  page-scoped filtering search stays inline in that page's content.
- Pagination Consistency — any list that could exceed 20 records must use 
  the shared <Pagination>/usePaginatedQuery pattern at a fixed 20-record 
  page size, not a bespoke per-screen implementation.
```

---

## Execution Order (final)

1. Merge the outstanding `fix/pr-agent-guideline-accuracy` branch (completed in active working tree).
2. Part 1 — immediate high-leverage fixes (GlassCard, login, sidebar contrast, duplicate toggle, real stat data) (completed in active working tree).
3. Part 2 — triple-navigation bug fix (completed in active working tree).
4. Part 11 (guardrail rules) — so everything after this point is actually reviewed (completed in active working tree).
5. Parts 3-4 (typography, spacing) — foundation sweeps (completed in active working tree).
6. Part 5 — PageShell adoption (to be worked on next).
7. Part 6 — per-screen fixes, using the foundation from 3-5 (to be worked on next).
8. Part 7 — navbar consolidation (depends on PageShell/header work from Part 5/6).
9. Part 8 — mobile floating nav redesign.
10. Part 9 — pagination.
11. Part 10 — systemic responsive verification pass, last, as the actual production-readiness gate.

Do not trust commit messages or "done" claims at any step — re-verify against the code and against real screenshots at multiple viewport widths, the same way every finding in this plan was confirmed, before considering any part complete.
