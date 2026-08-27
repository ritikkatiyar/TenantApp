# Livic Frontend — Master Plan (Final, Status-Verified)

Every item below was checked against the live codebase just now, not assumed from commit messages. This replaces all prior versions of this plan — treat this as the single source of truth going forward.

**Still pre-production** — breaking changes remain cheap. **Mobile is still the priority surface**; every open item must be verified on native mobile, not just desktop.

---

## ✅ CONFIRMED DONE — do not redo these

- `GlassCard` dark-mode fix (`theme.Colors.glassFill`)
- Login screen dark-mode literals — 0 remaining
- Sidebar dark-mode hardcoded literals (`rgba(0.5)`, `#f59e0b`) — removed
- Duplicate dark-mode toggle — removed from `DesktopNavBar`, lives only in `SidebarNavigation`/`MobileMoreSheet`
- PR-review agent's stale folder-path bug — fixed; agent now actually reviews frontend files
- `frontend-engineering/SKILL.md` guardrails — landed on `main`
- Portfolio's fake stat cards (`'LIVE'`/`'READY'`/`'00'`) — replaced with real data
- Typography `PascalCase`/`camelCase` mixing in `SidebarNavigation` — resolved to one convention
- ~~Web mobile-nav flash on F5/hard-refresh~~ — **DOWNGRADED, see 🔴 open table below.** The `window.innerWidth` guard only helps post-hydration; it does not fix the actual production bug.
- **Global property-selection architecture** — a real `PropertySelectionContext` now exists, wired at `_layout.tsx`. `DesktopNavBar` renders the one selector; `reports.tsx`, `RentRollScreen`, `CommandCenterScreen`, `AnalyticsDashboardScreen`, and inventory/leases hooks all consume it via `useGlobalPropertySelection`. This is a cleaner fix than the original plan called for (one selector driving shared state, vs. one component re-rendered per screen) — no further visual-consistency work needed here, see the new gap below instead.
- Backend: `LazyInitializationException` on `BillingWorksheetRepository` fixed (`JOIN FETCH`), some Java import-style cleanup done per PR #44.

---

## 🆕 NEW FINDING — mobile has no property selector at all

`MobileHeader.tsx` has zero integration with `PropertySelectionContext` — no UI anywhere on mobile to actually set `selectedPropertyId`. Since `reports.tsx` and other screens now depend entirely on this context (their own selector UI was removed, not just hidden), **mobile users currently have no way to scope these screens to a specific property** — they likely always see `selectedPropertyId` as `null`/`undefined`, silently showing an unscoped/"all properties" state with no way to change it.

```
Add a mobile-appropriate property selector to MobileHeader.tsx (or a 
dedicated mobile-only component), wired to the same PropertySelectionContext 
via useGlobalPropertySelection — a compact trigger (property name + chevron) 
opening a searchable list/sheet, consistent with the mobile design language 
elsewhere. This is not optional polish — screens are currently broken 
without it on mobile, not just inconsistent.
```

**This is now the highest-priority open item** — higher than the items below, since it's a functional gap on the primary platform, not a consistency issue.

---

## 🔴 STILL OPEN — verified unchanged since last check, needs actual execution

| Item | Status |
|---|---|
| **Mobile-nav wrong-device flash on Vercel (web) — regressed from "done" to open, root cause found** | Confirmed live on production (`tenant-app-smoky.vercel.app`) via screenshot: desktop-width browser shows the mobile floating nav, page stuck mid-hydration. Root cause: `output: "static"` pre-renders HTML at Vercel build time, where there is no `window` object — the `window.innerWidth >= 900` guard (PR #45) necessarily evaluates false during static generation, baking the mobile nav into the static HTML every device receives on first paint, before any JS runs to correct it. The guard only fixes the *post-hydration* case; it cannot fix the *pre-hydration* static HTML, which is what the screenshot shows. **Real fix**: replace the JS-computed check with a CSS-media-query-based approach for web (e.g. a `BottomNavigation.web.tsx` variant applying `display` via `@media (min-width: 900px)`, which the browser applies during initial paint/layout with zero JS dependency) — see chat for the full spec. Also worth checking why the page content itself was stuck on a spinner in the same screenshot — may be a separate hanging-fetch issue, not purely nav-visibility. |
| **Triple-sidebar bug** (`EditPropertyScreen.tsx` + `CreatePropertyScreen.tsx` hand-roll their own second sidebar) | Confirmed still present in both files. Flagged as top priority twice now, still untouched. |
| `rgba()`/`hsla()` color-literal sweep | 210 instances remain (flat, no progress since last check) |
| `fontWeight` standalone-literal sweep | 740 instances remain (flat/slightly worse) |
| `PageShell` adoption | Stalled at 23 screens — no new adopters since last check |
| Screen decomposition (<500 lines) | Stalled — same oversized files as before: `TenantDetailsCard` (728), `IssueDetailModal` (673), `AnalyticsDashboardScreen` (629, grew since first flagged), `TenantDetailsSidebar` (611), `FloatingAIAssistant` (594), `FloorLayoutViewerModal` (544), `settings.sections.tsx` (513), `AddItemModal`/`BillingScreen` (492 each) |
| Pagination rollout | Partial — `PaginatedContainer`/`Pagination` genuinely used in ~4 screens (`escalations`, `RentRollInvoiceList`, `OwnerLeasesScreen`, `AnalyticsDashboardScreen`), not yet on properties list, tenant/lease lists broadly, ledger, inventory, announcements |
| Shared package extraction (`packages/ui`) | Not started — `Theme.ts`, `GlassCard`, etc. still duplicated files between the two apps |
| SQL migration guardrails file | Never landed on `main` |

---

## Execution order from here

1. **Mobile-nav pre-hydration flash (CSS media-query fix)** — this is now the top item. It's live in production, confirmed via screenshot, and the previous fix attempt (PR #45) only addressed half the problem. Also investigate the stuck-spinner/hanging-content symptom seen in the same screenshot before assuming it's purely the nav issue.
2. **Mobile property selector (new finding)** — functional gap, fix next.
3. **Triple-sidebar bug** — a real, visible bug (not consistency polish), and it's been deferred through two full merges now despite being flagged as priority both times.
4. **`rgba()` + `fontWeight` sweeps** — do these together, same file-by-file pattern proven to work on the earlier hex sweep. These are the two remaining causes of "screens still feel inconsistent" that haven't been touched at all.
5. **Resume `PageShell` adoption + screen decomposition** — these were making real progress (6→23) before stalling; pick back up rather than starting a new approach.
6. **Finish pagination rollout** to the remaining list-bearing screens.
7. **Shared package extraction** — do this once the above stabilizes, since it'll touch every file being worked on above; doing it mid-sweep would create merge conflicts with itself.

---

## PART 12 — Scalability & Infrastructure (new, beyond UI consistency)

These matter for "highly scalable" specifically — not fixing a visible bug, but preventing the *next* 6 months of growth from recreating the same problems this whole plan has been cleaning up.

### 12.1 — Shared types package (`@livic/types`)
Frontend TypeScript interfaces matching backend DTOs are currently hand-written per feature, with no enforced link back to the actual backend contract. This is a drift risk that gets worse, not better, as the API surface grows. Generate from the backend's OpenAPI spec if one exists; otherwise centralize hand-maintained types into one shared package consumed by both apps, so a backend field rename has one place to update on the frontend, not N places found only when something breaks.

### 12.2 — Import-boundary enforcement between features
Nothing currently stops `src/features/finance` from reaching directly into `src/features/properties`' internals instead of a clean public surface. Add an ESLint rule restricting cross-feature imports to each feature's own `index.ts` export surface — mirrors the backend's already-enforced facade pattern (ArchUnit blocking cross-module repository injection). Without this, feature boundaries erode silently as more screens get added.

### 12.3 — Error tracking (Sentry or equivalent)
There's a dev-gated `logger` but nothing capturing real user-facing crashes/errors once this is live. For a product handling rent/billing data, silently-failing screens in production are the worst class of bug to discover late — add this before real users are on the app, not after the first incident.

### 12.4 — Living component catalog
Once shared primitives move into `packages/ui` (Part 0), add a Storybook instance (or a simple in-app dev/catalog screen if Storybook is overkill for team size) documenting `GlassCard`, `PageShell`, the property selector, `Pagination`, etc. Text guardrail files catch violations after the fact; a visual catalog is what stops the next screen from reinventing something that already exists — which is the root cause nearly everything in this whole plan has been cleaning up.

### 12.5 — CI test-gating, not just PR review
Confirm `npm run quality` (lint/typecheck/test/build) actually blocks merge on failure in CI, not just runs informationally alongside the review agent. The review agent catches style/guardrail violations; it doesn't replace an actual red-build gate.

---

## What NOT to re-litigate

Everything in the "✅ CONFIRMED DONE" section is genuinely done — verified against code just now, not commit-message trust. Don't re-scope or re-request fixes for those. Focus effort on the 🆕 finding and the 🔴 open table — that's the actual remaining surface area.
