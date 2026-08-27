# Livic Landlord Frontend — Codebase Architecture & Structure Guide

This document provides a comprehensive structural guide to the **Livic Landlord Frontend** codebase (`livic-landlord-fe`). It details **how**, **why**, **where**, and **what** lives across the application to serve as the definitive reference for developers and coding agents.

---

## 📌 Executive Architectural Summary

`livic-landlord-fe` is built using **Expo Router (v3)**, **React Native Web**, and **TypeScript**. The application is architected around a **Modular Monolith (Package-by-Feature)** paradigm designed to deliver a FAANG-grade, high-performance cross-platform experience across Desktop Web, Tablets, and Mobile Devices.

### Key Architectural Pillars
1. **Thin Routing Wrappers (`app/`)**: The `app/` directory strictly serves as Expo Router's filesystem route registry. Route files are thin 5-line wrappers that delegate immediately to feature screens in `src/features/`.
2. **Feature Isolation (`src/features/`)**: Each domain (Properties, Finance, Inventory, Analytics, Escalations, Announcements, Settings, Onboarding) is completely self-contained with its own screens, components, API integrations, hooks, and styles.
3. **Glassmorphic Design System (`src/theme/`)**: Dark and Light theme palettes backed by semantic color tokens (`theme.Colors.glassFill`, `theme.Colors.glassStroke`, `theme.Colors.primaryContainer`) and a **Single Source of Truth Breakpoint** system (`Breakpoints.desktop = 900`).
4. **StyleSheet & File Decomposition (<500 Line Rule)**: Zero inline layout styles. All component and screen styles are encapsulated into dedicated `[Name].styles.ts` modules to maintain file readability under 500 lines.

---

## 📂 Master Directory Map ("Where What Lives")

```
livic-landlord-fe/
├── app/                        # Expo Router Filesystem Navigation Registry (Thin Wrappers ONLY)
│   ├── _layout.tsx             # Root Application Shell, Providers & Responsive Layout Switcher
│   ├── +html.tsx               # Web Pre-Hydration Document & CSS Reset
│   ├── index.tsx               # Root Route Guard / Redirect Entrypoint
│   ├── command-center.tsx      # Portfolio Main Screen Route Wrapper
│   ├── onboarding.tsx          # Onboarding Flow Route Wrapper
│   ├── settings.tsx            # System Settings Route Wrapper
│   ├── reports.tsx             # Financial & Audit Reports Route Wrapper
│   ├── escalations.tsx         # Escalations & Support Tickets Route Wrapper
│   ├── announcements.tsx       # Landlord Announcements Route Wrapper
│   ├── analytics.tsx           # Analytics Dashboard Route Wrapper
│   ├── billing.tsx             # SaaS Subscription & Upgrades Route Wrapper
│   ├── create-expense.tsx      # Charge/Expense Creation Route Wrapper
│   ├── expenses/               # Finance Dashboard Route Wrappers
│   ├── leases.tsx              # Lease Management Route Wrapper
│   ├── inventory.tsx           # Inventory & Registry Route Wrapper
│   └── properties/             # Property Details & Floor Editor Route Wrappers
│
└── src/                        # Core Source Code Directory
    ├── components/             # Reusable UI Primitives, Shells & Navigation Chrome
    │   ├── common/
    │   │   ├── display/        # GlassCard, StatCard, PropertySelector, Badge
    │   │   ├── feedback/       # Skeleton, ToastContext, ErrorBoundary
    │   │   ├── inputs/         # ActionButton, SegmentedControl, CustomInput
    │   │   ├── layout/         # PageShell, ScreenWrapper, OnboardingGate
    │   │   └── navigation/     # SidebarNavigation, DesktopNavBar, BottomNavigation, MobileHeader
    │
    ├── context/                # Global Application State Contexts
    │   └── PropertySelectionContext.tsx  # Active Property Filter State across top navbar & screens
    │
    ├── features/               # Domain-Driven Feature Modules (Package-by-Feature)
    │   ├── analytics/          # Business Intelligence & Occupancy Metrics
    │   ├── announcements/      # Notice Board & Notification Broadcasting
    │   ├── auth/               # Auth Provider, JWT Context, Mode Selection Screen
    │   ├── escalations/        # Ticket Management & Resolution Workflows
    │   ├── finance/            # Expenses, Billing Worksheets, Meter Readings, General Ledger
    │   ├── inventory/          # Property Assets & Progressive Item Registry
    │   ├── issues/             # Ticket Detail Modals & Issue Resolution Components
    │   ├── onboarding/         # Landlord Setup Wizard & Module Selection
    │   ├── properties/         # 3D Building Preview, Floor Editor, Tenant Cards, CommandCenter
    │   ├── reports/            # Exportable Financial, Tax & Occupancy Reports
    │   ├── settings/           # RBAC Roles, Join Codes, Automation & Preference Rules
    │   └── user/               # User Preferences API & Profile Services
    │
    ├── hooks/                  # Global Reusable Hooks
    │   ├── useResponsive.ts    # Screen Breakpoints (isDesktop, isTablet, isMobile)
    │   ├── useProperties.ts    # SWR/Query Hook for Property List
    │   └── useScroll.ts        # Scroll Position & Header Collapse State
    │
    ├── theme/                  # Design Tokens, Palettes & Theme Provider
    │   ├── Theme.ts            # LightColors, DarkColors, Breakpoints, Typography, Spacing
    │   └── ThemeContext.tsx    # Theme Provider (isDark, toggleTheme, theme)
    │
    ├── types/                  # TypeScript DTO Contracts & Models
    │   ├── property.ts         # PropertyResponse, Floor, Unit models
    │   └── finance.ts          # Invoice, Ledger, Expense models
    │
    └── utils/                  # Utility Services & HTTP Client
        ├── apiRequest.ts       # Centralized Fetch Client with Auth Headers & Envelopes
        └── logger.ts           # Environment-aware Logging Utility
```

---

## ⚙️ Detailed Domain Breakdown ("What Lives in Each Feature")

### 1. `src/features/properties/` — Property & Building Management
- **CommandCenterScreen**: The main "My Properties" portfolio dashboard displaying top stat cards and building cards.
- **Building3DView**: Isometric 3D floor plate stack viewer featuring unit occupancy color coding (Vacant/Partial/Occupied) and interactive 3D rotation.
- **FloorListOverviewScreen & FloorLayoutViewerModal**: 2D Grid floor visualizer and tenant assignment canvas.
- **TenantDetailsSidebar & TenantDetailsCard**: Drawer for inspecting tenant leases, contact details, and payment histories per unit.

### 2. `src/features/finance/` — Billing, Expenses & General Ledger
- **BillingWorksheetScreen**: Monthly utility and rent billing worksheet table with batch invoice generation.
- **RentRollScreen**: Tenant rent roll, dues, and payment status overview.
- **MeterReadingScreen**: Bulk electric/water meter reading capture per floor/unit.
- **LedgerScreen**: General Ledger with date range filtering, debits/credits tracking, and export capabilities.
- **ExpenseConfigurationScreen & CreateExpenseScreen**: Custom charge rule engine (fixed, per-sqft, sub-metered) creation form.
- **BillingScreen**: SaaS Subscription tier calculator, balance top-up, and plan manager.

### 3. `src/features/inventory/` — Asset & Unit Inventory
- **InventoryRegistryView**: Asset tracking table utilizing `PaginatedContainer` for progressive item rendering across desktop and mobile.

### 4. `src/features/analytics/` — Business Intelligence
- **AnalyticsDashboardScreen**: Revenue trends, occupancy velocity, and financial forecasting charts.

### 5. `src/features/settings/` — RBAC & Automation Rules
- **SettingsScreen, SettingsSections, SettingsModals**: Role & permission management (Property Owner, Manager, Caretaker), tenant join code generation, and automated invoice trigger rules.

---

## 🎨 Navigation & Responsive Architecture ("How Layout Works")

### Responsive Breakpoints
All screen resolution logic is derived from `Breakpoints` in `src/theme/Theme.ts`:
- **Desktop**: `width >= 900px` (`Breakpoints.desktop`)
- **Tablet**: `600px <= width < 900px` (`Breakpoints.tablet`)
- **Mobile**: `width < 600px`

### Desktop Layout Chrome (`showDesktop = true`)
1. **Pinned Left Sidebar (`SidebarNavigation.tsx`)**: Glassmorphic vertical sidebar with primary brand navigation links.
2. **Top Navigation Bar (`DesktopNavBar.tsx`)**: Contains global search, property selection dropdown, dark mode toggle, and profile menu.
3. **Page Container (`PageShell.tsx`)**: Scrollable inner shell with standardized padding and headers.

### Mobile Layout Chrome (`showDesktop = false`)
1. **Top Header (`MobileHeader.tsx`)**: Contains property switcher trigger pill and active page title.
2. **Bottom Navigation (`BottomNavigation.tsx`)**: Fixed bottom tab bar for quick touch navigation.
3. **Floating AI Assistant (`FloatingAIAssistant.tsx`)**: Quick access action button for AI support.

---

## 🛡️ Coding & Development Standards ("Why Things Are Built This Way")

1. **Thin Route Wrappers**: Never place screen logic inside `app/`. `app/settings.tsx` must only import `<SettingsScreen />` from `src/features/settings/screens/SettingsScreen.tsx`.
2. **Single Breakpoint Source**: Never write `window.innerWidth >= 900` or hardcoded `900px` string literals in code. Always import `Breakpoints` from `@/src/theme/Theme` or use `useResponsive()`.
3. **No Suppressed Lints**: `// @ts-ignore` and `// eslint-disable` are strictly prohibited. Types must be properly cast or typed.
4. **Theme Tokens Only**: Never use hardcoded hex or `rgba()` strings for colors. Use `theme.Colors` (`theme.Colors.glassFill`, `theme.Colors.primary`, `theme.Colors.onSurface`).
5. **StyleSheet Encapsulation**: All styles must be defined in `StyleSheet.create({...})` and extracted into separate `.styles.ts` files when screen components approach 500 lines.

---

## 🧪 Verification & Health Commands

To verify the codebase status at any time, run:

```bash
# Typecheck landlord frontend
cd d:\TenantApp\livic-landlord-fe
npx tsc --noEmit
```

*This document is maintained as part of the official TenantApp developer documentation.*
