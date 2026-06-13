# Frontend Discovery and Design Audit

Audit date: 2026-06-13

Scope: actual code under `TenantAppFE`, excluding generated `node_modules` and `dist`. No behavior is credited unless a route, component, API call, or implementation exists in code.

## Executive Summary

**Current Design Language:** responsive glassmorphism dashboard with Material-style color roles, cyan/teal identity, blue gradients, large rounded cards, uppercase labels, and desktop/mobile navigation variants.

**Frontend Completion: 58%**

The application has a substantial working shell for authentication, property administration, floor/unit configuration, tenant announcements, AI commands, charge configuration, meter entry, and SaaS billing. Finance coverage is narrow: there is no UI or API client for rent cycles, rent collection, payment history, shared expenses, expense splitting, deposits, or settlements.

Strongest implemented areas:

- Authentication and persisted sessions.
- Property CRUD and portfolio browsing.
- Floor/unit layout management and lease assignment.
- Announcement composition/history and tenant notice board.
- Charge configuration and meter-reading worksheets.
- AI assistant and SaaS billing screens.

Largest design and implementation gaps:

- Navigation labels do not match destinations: “Settings” opens charge configuration.
- Finance is split across ambiguous `/billing`, `/expenses`, and property meter routes.
- Most visual primitives are copied inside screens instead of reusable components.
- Analytics is entirely mock data.
- Tenant finance is a placeholder.
- Two theme systems exist; most screens still hard-code colors and spacing.
- Desktop sidebar/topbar implementations are duplicated within large screens.
- Lint fails and there are no frontend tests.

## Part 1: Frontend Architecture Summary

| Area | Actual implementation |
|---|---|
| Framework | Expo 54, React Native 0.81, React 19, React Native Web |
| Routing | Expo Router 6 file-based routing with a root `Stack` |
| Platforms | Android, iOS, and static web export |
| Architecture | Feature-oriented folders under `src/features`, route wrappers under `app`, shared API client and limited common components |
| Navigation | Responsive desktop sidebar at width >= 900; floating bottom navigation below 900; stack routes for detail/edit flows |
| State management | React Context for auth; local `useState`/hooks for all feature state; no Redux/Zustand/query cache |
| Theme | Custom `src/theme/Theme.js`, React Navigation light/dark provider, plus unused Expo template theme in `constants/theme.ts` |
| API layer | Typed feature API modules over one `fetch` wrapper; bearer token, timeout, correlation ID, API envelope parsing, automatic refresh/retry |
| Auth | Access/refresh token bundle; SecureStore on native, `localStorage` on web; auth context and per-route redirects |
| Responsiveness | Single desktop breakpoint at 900px, with several screens adding their own 1200/1500px breakpoints |
| Testing | No frontend test files found |

References:

- Framework/dependencies: `TenantAppFE/package.json`
- Root architecture: `TenantAppFE/app/_layout.tsx:14-52`
- API client: `TenantAppFE/src/api/client.ts:46-118`
- Auth context: `TenantAppFE/src/features/auth/context/AuthProvider.tsx:24-117`
- Storage: `TenantAppFE/src/features/auth/utils/tokenStorage.ts:8-46`
- Responsive hook: `TenantAppFE/hooks/useResponsive.ts:3-6`

### Auth Flow

1. `/` waits for stored auth state.
2. Unauthenticated users redirect to `/login`.
3. Login calls `/api/v1/auth/login`, persists the token bundle, then calls `/api/v1/user/me/context`.
4. Users with an active lease go to `/tenant-home`; other users go to `/command-center`.
5. The API client retries one 401 after calling the registered refresh handler.
6. Logout clears local tokens before attempting server token revocation.

Status: **Implemented**, with two caveats:

- Protected routing is repeated in route wrappers rather than centralized in route groups/layouts.
- Web tokens are stored in `localStorage`, exposing them to successful XSS.

## Part 2: Navigation Audit

### Navigation Types

| Navigation structure | Status | Evidence |
|---|---|---|
| File-based stack navigation | Implemented | Root Expo Router `Stack` |
| Bottom navigation | Implemented | Five items on widths below 900 |
| Desktop sidebar | Implemented | Six main links, billing CTA, logout |
| Nested property routes | Implemented | Property, floors, floor editor, meter readings |
| Protected routes | Partially Implemented | Redirect logic exists on most routes, but not all |
| Role-based navigation | Not Implemented | Navigation does not adapt to global/property roles |
| Drawer navigation | Not Implemented | No drawer |
| Tab navigator package usage | Not Implemented | Bottom tabs package is installed, but custom navigation is used |

### Navigation Tree

```text
/
├─ /login
├─ /signup
└─ authenticated redirect
   ├─ /tenant-home                  active lease detected
   └─ /command-center               otherwise

Primary navigation
├─ /analytics                       Insights / Overview
├─ /command-center                  Portfolio / Properties
├─ /ai                              AI Desk
├─ /escalations                     Placeholder
├─ /announcements                   Desktop sidebar only
├─ /expenses                        Charge Configuration, labeled Settings
└─ /billing                         SaaS plans and AI wallet

Property stack
├─ /properties/create
├─ /properties/[id]
│  ├─ /properties/[id]/floors
│  │  └─ /properties/[id]/floors/[floorNumber]
│  └─ /properties/[id]/meter-readings
└─ /create-expense?propertyId=...   Charge create/edit form

Unlinked/placeholder
└─ /admin
```

### Navigation Problems

- Mobile has no Announcements item.
- “Settings” routes to charge configuration, not settings.
- “Expenses” is the route name for charge definitions, not actual expenses.
- `/billing` means TenantApp SaaS billing, not rent billing.
- Tenant users receive the same global bottom/sidebar shell unless individual screens override it.
- `/analytics`, `/admin`, and `/escalations` have no route-level auth redirect.
- The root `Stack` explicitly registers some routes but omits floor list/editor routes, relying on automatic discovery.
- Large property screens contain unused duplicate sidebar/topbar render functions after the global sidebar was introduced.

## Part 3: Screen Inventory

| Screen | Route | Status |
|---|---|---|
| Root resolver/loading | `/` | Implemented |
| Login | `/login` | Implemented |
| Signup | `/signup` | Implemented |
| Portfolio command center | `/command-center` | Implemented |
| Tenant home | `/tenant-home` | Partial |
| Insights dashboard | `/analytics` | Mock/Partial |
| AI assistant | `/ai` | Implemented |
| Announcement administration | `/announcements` | Implemented |
| SaaS billing and AI wallet | `/billing` | Implemented against mock gateway backend |
| Charge configuration list | `/expenses?propertyId=...` | Implemented, badly named |
| Create/update charge | `/create-expense?propertyId=...&chargeId=...` | Implemented, badly named |
| Admin panel | `/admin` | Placeholder |
| Escalations | `/escalations` | Placeholder |
| Create property | `/properties/create` | Implemented |
| Edit property | `/properties/[id]` | Implemented |
| Floor overview | `/properties/[id]/floors` | Implemented |
| Floor editor/unit assignment | `/properties/[id]/floors/[floorNumber]` | Implemented but oversized |
| Meter-reading worksheet | `/properties/[id]/meter-readings` | Implemented |
| Unit detail | No route/import found | Dead placeholder code |
| Legacy JS floor editor | No route; shadowed by `.tsx` version | Dead duplicate code |

Dead/template components also remain under root `components`: `HelloWave`, `ExternalLink`, `HapticTab`, `ParallaxScrollView`, `Collapsible`, and themed template components are not used by product screens.

## Part 4: Finance Module Mapping

The codebase places SaaS billing and property charges in `src/features/finance`, but these are different product domains. The table distinguishes them.

| Finance capability/screen | UI Exists | Backend Connected | APIs consumed | Missing features |
|---|---:|---:|---|---|
| Lease list | No | No | None | Search, filters, owner/tenant views |
| Lease details | Partial | Partial | Lease details appear only inside floor layout responses | Dedicated details, lifecycle, history |
| Lease creation | Yes | Yes | `POST /api/v1/finance/leases` | Dedicated flow, validation summary, renewal |
| Lease termination | Partial | Yes | `DELETE /api/v1/finance/leases/{id}` called from floor editor | Confirmation/history-safe semantics |
| Rent cycle list | No | No | None | Entire screen |
| Rent cycle details | No | No | None | Entire screen and charge breakdown |
| Rent cycle generation | No | No | None | Manual/automatic generation UI |
| Mark rent paid | No | No | None | Payment recording UI |
| Rent payment history | No | No | None | Entire flow |
| Partial payments | No | No | None | Amount allocation and balance UI |
| Charge configuration list | Yes | Yes | `GET /finance/charge-configs/property/{propertyId}` | Better naming, permissions, pagination |
| Charge create/edit | Yes | Yes | POST/GET/PUT charge config | Category selection is visually fixed and payload always uses `CUSTOM` |
| Charge deactivate | Yes | Yes | `DELETE /finance/charge-configs/{id}` | Restore/inactive view |
| Meter worksheet | Yes | Yes | GET worksheet, POST batch-save | Billed lock feedback, calculation-to-cycle integration |
| Shared expense list | No | No | None | Entire screen |
| Shared expense creation | No | No | None | Existing “create expense” screen actually creates a charge config |
| Expense groups | No | No | None | Entire flow |
| Expense split generation | No | No | None | Participant and strategy UI |
| My dues | No | No | None | Tenant dues screen |
| Roommate settlement | No | No | None | Settlement and history |
| Security deposit | Partial display/input | Partial | Deposit collected only during lease creation payload | Collection/refund/deduction UI |
| Finance analytics | Yes visually | No | None | All metrics are hard-coded |
| SaaS plan billing | Yes | Yes | `/api/v1/billing/status`, `/subscribe`, `/topup` | Real gateway redirect/status handling |

### Current Finance Coverage

**Finance frontend completion: 27%**

Implemented frontend finance is concentrated in:

- Lease assignment inside the floor editor.
- Property charge definitions.
- Meter reading entry.
- SaaS subscription/AI-wallet billing.

The core tenant-to-landlord finance workflow is absent.

## Part 5: API Mapping

### Auth and User

| Screen/flow | API endpoint | Status |
|---|---|---|
| Login | `POST /api/v1/auth/login` | Fully Connected |
| Signup | `POST /api/v1/auth/signup` | Fully Connected |
| API interceptor | `POST /api/v1/auth/refresh` | Fully Connected |
| Logout | `POST /api/v1/auth/logout` | Fully Connected |
| Auth validation | `POST /api/v1/auth/validate` | API client exists, unused |
| Current auth user | `GET /api/v1/auth/me` | API client exists, unused |
| Root/login/tenant home | `GET /api/v1/user/me/context` | Fully Connected |
| Floor editor tenant search | `GET /api/v1/user/search?phone=...` | Fully Connected |
| Floor editor quick tenant creation | `POST /api/v1/user/create-tenant` | Fully Connected |

### Property and Lease

| Screen | API endpoint | Status |
|---|---|---|
| Portfolio | `GET /api/v1/property/roles/users/{userId}/properties` | Fully Connected |
| Create property | `POST /api/v1/property/properties?ownerId=...` | Fully Connected |
| Edit property | `GET /api/v1/property/properties/{id}` | Fully Connected |
| Edit property | `PUT /api/v1/property/properties/{id}` | Fully Connected |
| Portfolio delete | `DELETE /api/v1/property/properties/{id}` | Fully Connected |
| Floor overview | `GET /api/v1/property/properties/{id}/floors` | Fully Connected |
| Floor editor | `GET /api/v1/property/properties/{id}/floors/{floor}/layout` | Fully Connected |
| Building view | `GET /api/v1/property/properties/{id}/floors/layouts` | Fully Connected |
| Floor editor save | `PUT /api/v1/property/properties/{id}/floors/{floor}/layout` | Fully Connected through direct `apiRequest` |
| Floor editor assign tenant | `POST /api/v1/finance/leases` | Fully Connected |
| Floor editor remove tenant | `DELETE /api/v1/finance/leases/{leaseId}` | Fully Connected |

### Finance and Billing

| Screen | API endpoint | Status |
|---|---|---|
| Charge list | `GET /api/v1/finance/charge-configs/property/{propertyId}` | Fully Connected |
| Charge form | `POST /api/v1/finance/charge-configs` | Fully Connected |
| Charge form | `GET /api/v1/finance/charge-configs/{id}` | Fully Connected |
| Charge form | `PUT /api/v1/finance/charge-configs/{id}` | Fully Connected |
| Charge list | `DELETE /api/v1/finance/charge-configs/{id}` | Fully Connected |
| Meter worksheet | `GET /api/v1/finance/meter-readings/worksheet` | Fully Connected |
| Meter worksheet | `POST /api/v1/finance/meter-readings/batch-save` | Fully Connected |
| SaaS billing | `GET /api/v1/billing/status` | Fully Connected |
| SaaS billing | `POST /api/v1/billing/subscribe` | Connected to backend mock gateway |
| SaaS wallet | `POST /api/v1/billing/topup` | Connected to backend mock fulfillment |
| Rent cycles | `/api/v1/finance/rent-cycles/*` | Unused |
| Shared expenses | `/api/v1/finance/expenses/*` | Unused |
| Expense groups | `/api/v1/finance/groups/*` | Unused |
| Expense splits | `/api/v1/finance/splits/*` | Unused |

### Announcements and AI

| Screen | API endpoint | Status |
|---|---|---|
| Announcement admin/tenant home | `GET /api/v1/announcements` | Fully Connected |
| Tenant home | `POST /api/v1/announcements/{id}/read` | Fully Connected |
| Announcement admin/command center | `POST /api/v1/announcements` | Fully Connected |
| AI assistant | `POST /api/v1/ai/commands` | Fully Connected |
| AI assistant polling | `GET /api/v1/ai/commands/jobs/{jobId}` | Fully Connected |

No mock API client layer exists. Mock behavior is embedded in screens or supplied by the backend.

## Part 6: Design System Audit

### Current Tokens

| Role | Current value/evidence |
|---|---|
| Primary | `#006875` teal |
| Primary accent | `#00e5ff`, commonly `#00d4ff` |
| Secondary | `#4648d4` / `#6063ee` indigo |
| Gradient accent | `#00d4ff` to `#0072ff` |
| Success | Usually `#2e7d32`; not defined in the main theme |
| Error | `#ba1a1a`; some screens use `#e53935`, `#ef4444`, `#c62828` |
| Warning | Commonly `#e28743`; theme tertiary is gold `#765a00` |
| Text | `#151d1e` |
| Muted text | `#6b7a7d` |
| Main background | `#f3fbfc` |
| Common page gradient | `#d4f5f9`, `#e8f8fb`, `#e2e0fb` |
| Surface/card | White alpha glass fills with blur |

### Typography

The declared theme specifies:

- Manrope for headlines/buttons.
- Inter for body text.
- JetBrains Mono for uppercase labels.

No font-loading code or font package was found. Most screens provide only size/weight, so actual rendering generally uses platform system fonts.

### Spacing and Shape

- Declared spacing follows an 8px unit with 8/16/20/32 common values.
- Actual screens contain extensive one-off values.
- Card radii are commonly 16 or 24.
- Navigation and chips often use fully rounded/pill shapes.

### UI Element Audit

| Element | Current state |
|---|---|
| Buttons | Visually similar cyan-blue gradients, but individually implemented per screen |
| Cards | Consistent glass appearance, but no shared Card component |
| Forms | Multiple local patterns: icon fields, glass fields, segmented controls, radio rows |
| Tables | No reusable table; meter worksheet uses responsive cards/rows |
| Badges | Many local badge styles; no shared Badge |
| Icons | MaterialIcons, Ionicons, Feather, and MaterialCommunityIcons |
| Charts | No chart library; Insights uses progress bars and static metric cards |
| Loaders | `ActivityIndicator` repeated in 16 files |
| Modals | Local React Native `Modal` implementations in two major screens |

### Design System Verdict

**A visual language exists, but a component design system does not.**

`src/theme/Theme.js` is the correct foundation to preserve. `constants/theme.ts` and root Expo template components should be removed or deliberately integrated. Semantic tokens for success, warning, info, disabled, focus, and finance statuses are missing.

## Part 7: Theme Analysis

The current visual style is:

- **Modern:** yes.
- **Material influenced:** yes, especially color naming, icons, cards, and controls.
- **Minimal:** partially; pages are airy, but large screens are visually and structurally dense.
- **Corporate:** yes, particularly portfolio, analytics, and billing.
- **Dashboard:** strongly yes.
- **Consumer app:** tenant home and floating mobile navigation have consumer-app qualities.

The closest description is **“luminous glassmorphism property-management dashboard with Material semantics.”**

Strengths to preserve:

- Teal identity and cyan-blue accent.
- Soft blue gradient backgrounds.
- Large rounded cards.
- Strong metric hierarchy.
- Responsive desktop/sidebar and mobile/bottom-nav concept.
- Floor/building visualization as a product differentiator.

Risks:

- Glass and blur are used almost everywhere, reducing hierarchy.
- Cyan accent can have weak contrast on white.
- Desktop screens reproduce navigation chrome internally and globally.
- Automatic dark mode provider is enabled, but product styles are hard-coded for light mode.

## Part 8: Component Inventory

Usage count below means files referencing the component, including its definition file.

| Component | Reusable | Usage count | Assessment |
|---|---:|---:|---|
| `ScreenWrapper` | Yes | 2 | Used only by root layout |
| `BottomNavigation` | Yes | 2 | Active shared component |
| `SidebarNavigation` | Yes | 2 | Active shared component |
| `Building3DView` | Yes | 3 | Active product component |
| `ThemedView` | Yes technically | 3 | Expo template, not product UI |
| `ThemedText` | Yes technically | 2 | Expo template, not product UI |
| `IconSymbol` | Yes technically | 3 | Template dependency only |
| `Collapsible` | Yes technically | 1 | Dead |
| `ParallaxScrollView` | Yes technically | 1 | Dead |
| `HapticTab` | Yes technically | 1 | Dead |
| `ExternalLink` | Yes technically | 1 | Dead |
| `HelloWave` | Yes technically | 1 | Dead |
| Button | No shared component | 17 files use `TouchableOpacity` | High duplication |
| Card | No shared component | 15 files use `BlurView` | High duplication |
| Input | No shared component | 11 files use `TextInput` | High duplication |
| Loader | No shared component | 16 files use `ActivityIndicator` | High duplication |
| Modal/Bottom sheet | No shared component | 2 files use `Modal` | Different local implementations |
| Badge | No shared component | Many local styles | High duplication |
| Table | No | 0 | Meter entry uses custom rows |
| Avatar | No | 0 | Not implemented |

## Part 9: UX Consistency Audit

### Findings

1. **Navigation duplication:** global sidebar plus unused screen-local sidebar/topbar code.
2. **Naming mismatch:** charge configuration is called Settings, Expenses, and Create Expense.
3. **Button duplication:** gradients, padding, disabled states, and text casing vary by screen.
4. **Form duplication:** auth, property, charge, announcement, and tenant assignment forms use separate field patterns.
5. **Card duplication:** glass cards are copied with different alpha, border, radius, and shadow values.
6. **Spacing inconsistency:** token spacing coexists with many hard-coded values.
7. **Status inconsistency:** success/error/warning colors vary and lack semantic components.
8. **Responsive inconsistency:** one shared 900px breakpoint plus screen-specific breakpoints and desktop layouts.
9. **Dark-theme mismatch:** navigation theme can switch to dark while screens remain light.
10. **Feedback inconsistency:** most mutations use native `Alert`, while inline errors and empty states vary.
11. **Currency encoding defects:** rupee symbols render as `â‚¹` in source-visible UI strings.
12. **Data-state inconsistency:** some screens distinguish loading/empty/error; others silently log errors.

### Recommendations

- Introduce shared `PageHeader`, `Button`, `IconButton`, `GlassCard`, `TextField`, `Select/SegmentedControl`, `Badge`, `EmptyState`, `ErrorState`, `Loader`, `Dialog`, and responsive `DataList`.
- Rename routes and labels around product meaning: `charge-configs`, `saas-billing`, `finance`, `settings`.
- Centralize route protection and role-aware navigation in Expo Router groups/layouts.
- Define semantic tokens and eliminate hard-coded palette variations.
- Choose explicit light-only support now or implement complete dark tokens.
- Add a shared responsive grid/container system.
- Replace native alerts with consistent in-app feedback for web/mobile.

## Part 10: Finance Gap Analysis

### Already Available

- Lease creation/removal within floor unit management.
- Charge configuration CRUD.
- Metered charge worksheet.
- Security deposit amount during lease assignment.
- Static finance insights screen.
- SaaS subscription and AI wallet management.

### Backend Exists But UI Missing

- Rent-cycle generation, listing, filtering, charge breakdown, and mark-paid.
- Expense-group create/get.
- Shared expense create/list.
- Expense split generation.
- Authenticated “my dues.”
- Split settlement.
- Lease get endpoint as a dedicated experience.

### UI Exists But Backend Capability Is Missing or Stubbed

- Insights shows revenue, collection, occupancy, trends, and portfolio totals using hard-coded data.
- Billing UI presents Stripe checkout success as activated, matching a mock backend rather than a production gateway lifecycle.
- Meter UI estimates cost from readings, while backend metered calculation still uses mocked consumption and does not create rent-cycle charges.
- Charge UI describes future-cycle automation that is not connected to rent-cycle generation.
- Tenant home states that rent cycles and payment history are “coming next.”

### Completely Missing

- Rent-cycle details and invoice presentation.
- Rent payment/partial payment/refund UI.
- Cash, UPI, and bank transfer workflows.
- Deposit collection/refund/deduction.
- Lease update, termination, renewal, and rent revision.
- Shared-living balances and settlement history.
- Finance reports backed by real aggregations.

## Part 11: Product Maturity Assessment

Percentages are implementation maturity estimates based on routed screens, live API usage, complete user flows, placeholders, and code quality. They are not schedule estimates.

| Module | Completion | Basis |
|---|---:|---|
| Auth | 85% | Login/signup/session refresh/logout and routing work; centralized guards, role routing, reset/recovery, and security hardening remain |
| Property | 78% | CRUD, portfolio, floors, layouts, units, tenant assignment are connected; code is oversized and some detail/settings flows are absent |
| Finance | 27% | Charges, meters, embedded lease assignment, and SaaS billing exist; core rent/payment/shared-expense UI is absent |
| Notifications/Announcements | 65% | Announcement create/list/read and tenant display work; notification center, preferences, channels, and escalation UI are absent |
| AI | 70% | Command submission and polling work; history, context controls, structured results, and recovery are limited |
| Analytics | 15% | Polished static UI only; all data is mocked |
| Overall frontend | **58%** | Weighted toward working auth/property/application shell |

## Part 12: Future Design Readiness

| Future module | Supported without redesign? | Actual assessment |
|---|---|---|
| Community | Partially | Route/features structure can support it, but primary navigation needs scalable grouping |
| Announcements | Yes | Already implemented and can be evolved |
| Chat | Partially | New feature folder/routes fit; real-time state, unread counts, and conversation navigation are absent |
| Society management | Partially | Property hierarchy is reusable; navigation and permission models need expansion |
| Marketplace | No | Requires a distinct discovery/commerce navigation and reusable catalog components |
| AI Assistant | Yes | Existing route/API polling foundation can evolve |

The feature-folder/API architecture can grow. The current five-item bottom navigation and flat desktop sidebar cannot absorb all proposed modules cleanly. Information architecture must evolve before adding Community, Chat, Society, and Marketplace together.

Recommended future navigation:

```text
Overview
Properties
Finance
Community
Operations
├─ Announcements
├─ Escalations
└─ Maintenance
AI Assistant
More
├─ Marketplace
├─ Billing & Plan
├─ Settings
└─ Help
```

## UI Technical Debt

### Critical

- Finance route naming misrepresents functionality.
- No tenant rent/payment UI despite backend rent-cycle APIs.
- Analytics presents fake values without a mock-data label.
- Protected routing is missing on several direct routes.

### High

- `FloorEditorScreen.tsx` is approximately 2,700 lines and combines canvas, persistence, tenant search/create, lease operations, mobile sheets, and desktop panels.
- No shared product component library.
- No frontend tests.
- Lint reports 4 errors and 59 warnings.
- Hooks have missing dependencies in multiple screens.
- Hard-coded light styling conflicts with automatic theme selection.

### Medium

- Dead JS screen duplicates and Expo starter components.
- Hundreds of hard-coded color values despite theme tokens.
- Console logging includes API and announcement payload details.
- Native alerts dominate mutation feedback.
- API state is refetched independently with no caching/deduplication layer.

## Screens To Preserve

Preserve functionality and recognizable interaction models, not current code structure:

- Login and signup flows.
- Portfolio/command center.
- Property create/edit.
- Floor overview.
- Floor editor and 3D building visualization.
- Announcement composer/history.
- Tenant notice board.
- AI assistant conversation flow.
- Charge configuration and meter worksheet.
- SaaS billing/wallet as a separate “Plan & Billing” area.

## Screens To Redesign

- Global navigation and information architecture.
- Insights dashboard, replacing mock metrics with real states.
- Tenant home, centered on rent due, payments, notices, and requests.
- Charge configuration routes and labels.
- Floor editor internal layout and component architecture.
- SaaS billing visual hierarchy and payment status handling.
- Placeholder Admin and Escalations screens.
- All missing rent-cycle, payment, shared-expense, and settlement screens.

## Recommended Improvements

### Foundation

1. Establish semantic design tokens and a shared component library.
2. Create role-aware route groups and centralized protected layouts.
3. Separate Finance, Charge Configuration, Settings, and SaaS Billing in navigation.
4. Split oversized screens into feature components and domain hooks.
5. Add query caching for server state and standardized loading/error/empty states.
6. Remove dead template/duplicate files and resolve lint errors.
7. Add component, API-hook, and critical-flow tests.

### Product

1. Design the real landlord Finance hub: receivables, cycles, payments, overdue balances.
2. Design tenant rent due/details/payment history.
3. Add shared expense groups, split creation, dues, and settlement.
4. Connect analytics only after finance data contracts exist.
5. Build notification center and escalations before adding more primary navigation destinations.

## Frontend Design Context For Stitch

### Product

TenantApp is a responsive property-management product for landlords/property staff and tenants. It runs as an Expo application on mobile and static web. Landlords manage properties, floors, units, tenant assignments, charges, meter readings, announcements, AI assistance, and their TenantApp subscription. Tenants currently see their active home and announcements.

### Users

- Property owners and administrators managing a portfolio.
- Property staff configuring buildings and occupants.
- Tenants viewing their home and notices.

### Existing Functional Screens

- Authentication: login and owner/admin signup.
- Portfolio: property cards, creation, editing, and deletion.
- Building management: floor overview, visual floor editor, unit configuration, tenant search/create, lease assignment.
- Tenant home: active property/unit/rent summary and notice board.
- Announcements: compose targeted property/floor/unit broadcasts and view history.
- AI assistant: prompt conversation with asynchronous job polling.
- Charge configuration: fixed or metered property charge definitions.
- Meter readings: monthly unit worksheet grouped by floor.
- Plan and billing: SaaS subscription tiers and AI credit wallet.

### Missing Product Screens

- Landlord Finance overview.
- Rent-cycle/invoice list and detail.
- Payment recording, allocations, partial payment, and history.
- Tenant rent due and payment history.
- Expense groups, shared expenses, split setup, dues, and settlements.
- Security deposit lifecycle.
- Real analytics.
- Escalations, administration, profile, and actual settings.

### Existing Visual DNA To Preserve

- Brand primary: deep teal `#006875`.
- Bright accent: cyan around `#00d4ff`/`#00e5ff`.
- Secondary accent: blue `#0072ff` and indigo.
- Backgrounds: soft cyan-to-lavender gradients.
- Surfaces: translucent white cards with subtle borders and blur.
- Shapes: 16–24px rounded cards and pill controls.
- Typography character: bold large headings, compact uppercase labels, calm body text.
- Icons: Material-style outlined icons.
- Responsive concept: desktop sidebar and mobile bottom navigation.
- Signature interaction: spatial floor/unit visualization.

### Design Evolution Direction

Evolve from a collection of luminous glass screens into a coherent, production dashboard:

- Retain teal/cyan identity but improve contrast and reduce decorative blur.
- Use solid/elevated surfaces for data-dense finance and operations views.
- Create consistent page headers, filters, cards, tables/lists, forms, badges, dialogs, and empty states.
- Make navigation role-aware and organize future modules into grouped destinations.
- Clearly separate landlord rent finance from TenantApp subscription billing.
- Prioritize mobile tenant journeys and responsive desktop landlord workflows.
- Support loading, empty, error, offline, permission-denied, overdue, paid, partial, and processing states in every design.

### Suggested Stitch Screen Set

1. Responsive application shell and navigation.
2. Landlord overview.
3. Property portfolio.
4. Property detail and floor overview.
5. Floor/unit editor.
6. Landlord Finance hub.
7. Rent-cycle list.
8. Rent-cycle/invoice detail.
9. Record payment dialog/page.
10. Charge and meter configuration.
11. Shared expenses and settlement.
12. Tenant home.
13. Tenant rent detail/history.
14. Announcements and notification center.
15. AI assistant.
16. Operations/escalations.
17. Plan and billing.
18. Profile and settings.

## Verification

Commands run:

```text
cmd /c npm run lint
cmd /c npm run build
```

Results:

- Lint: failed with **4 errors and 59 warnings**. The errors are unescaped quote characters in `FloorEditorScreen.tsx`.
- Build: Expo web export did not complete because Windows returned `EPERM` while attempting to remove the existing `TenantAppFE/dist` directory.
- Tests: no frontend test files were found.
