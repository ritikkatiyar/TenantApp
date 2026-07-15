---
name: Proprietary Core
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3f484b'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6f797c'
  outline-variant: '#bec8cb'
  surface-tint: '#056879'
  primary: '#004c5a'
  on-primary: '#ffffff'
  primary-container: '#006677'
  on-primary-container: '#96e1f5'
  inverse-primary: '#87d2e5'
  secondary: '#4f6073'
  on-secondary: '#ffffff'
  secondary-container: '#d2e4fb'
  on-secondary-container: '#556679'
  tertiary: '#3e4648'
  on-tertiary: '#ffffff'
  tertiary-container: '#555e5f'
  on-tertiary-container: '#ced7d8'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#aaedff'
  primary-fixed-dim: '#87d2e5'
  on-primary-fixed: '#001f26'
  on-primary-fixed-variant: '#004e5c'
  secondary-fixed: '#d2e4fb'
  secondary-fixed-dim: '#b7c8de'
  on-secondary-fixed: '#0b1d2d'
  on-secondary-fixed-variant: '#38485a'
  tertiary-fixed: '#dbe4e5'
  tertiary-fixed-dim: '#bfc8c9'
  on-tertiary-fixed: '#151d1e'
  on-tertiary-fixed-variant: '#404849'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Manrope
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 24px
  margin-page: 40px
  margin-mobile: 16px
  container-max: 1440px
---

## Brand & Style

The brand personality of the design system is rooted in **trust, clarity, and administrative excellence**. Designed for a tenant management portal, it balances the warmth of a home with the precision of professional asset management. 

The visual style is **Corporate / Modern**, prioritizing high-performance utility through a clean, systematic interface. We utilize a refined "Soft UI" approach—relying on generous whitespace and subtle depth to guide the user's eye without visual fatigue. The aesthetic is intentionally "quiet" to allow critical financial and property data to take center stage, fostering a sense of security and reliability for both property managers and tenants.

## Colors

The palette is derived from professional nautical and architectural tones. 

- **Primary (Teal):** Used for primary actions, success states, and brand-identifying elements. It suggests growth and stability.
- **Secondary (Navy):** Used for high-level navigation, headings, and foundational structural elements. This provides the "weight" necessary for a professional portal.
- **Tertiary (Ice Teal):** A very light tint used for container backgrounds, hover states, and subtle grouping.
- **Neutral (Slate):** A range of cool grays used for body text, borders, and secondary metadata to ensure a balanced, low-glare reading environment.

The default mode is **Light**, utilizing a crisp white base to maximize the "clean" feel requested, with Navy providing deep contrast for readability.

## Typography

This design system uses a dual-font strategy to balance character with utility. 

**Manrope** is used for headlines. Its modern, geometric construction feels architectural and progressive, providing a strong sense of place for "My Home" and "Overview" sections. 

**Inter** is the workhorse for body copy and data. Its high legibility and neutral character make it ideal for the dense information typical of management portals (ledger entries, unit details, and legal notices). 

We employ a strict hierarchy where uppercase labels (Label-MD) are used for categorization, while Navy (Secondary) is the primary color for all high-level headings to maintain authority.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid** model. The sidebar remains at a fixed width (280px) to provide a constant anchor for navigation, while the main content area utilizes a fluid 12-column grid that caps at a maximum width of 1440px to ensure line lengths remain readable.

- **Spacing Rhythm:** We use a strict 8px base unit. 
- **White Space:** We apply "generous padding" (32px - 48px) between major sections to prevent the UI from feeling cluttered, even when data-heavy.
- **Responsive Reflow:** On mobile, the sidebar collapses into a bottom navigation or "hamburger" menu. Grid columns transition from 12 to 4, and page margins reduce to 16px to maximize screen real estate for unit lists and payment buttons.

## Elevation & Depth

We use a **Tonal Layering** system complemented by **Ambient Shadows** to create a sophisticated sense of depth.

1.  **Level 0 (Background):** Pure White (#FFFFFF) or very light Tertiary tint (#F0F9FA).
2.  **Level 1 (Cards/Modules):** White surfaces with a soft, highly diffused shadow (0px 4px 20px rgba(0, 102, 119, 0.08)). The shadow uses a Primary-Teal tint rather than pure black to keep the UI feeling "fresh" and airy.
3.  **Level 2 (Modals/Popovers):** Higher elevation with a more pronounced shadow (0px 12px 32px rgba(26, 43, 60, 0.12)), signaling immediate priority.

Interactive elements (buttons) use a subtle hover lift to provide tactile feedback without breaking the clean aesthetic.

## Shapes

The design system adopts a **Rounded** shape language to soften the corporate nature of the portal and make it feel more approachable for residents.

- **Standard Elements (Buttons, Inputs):** 0.5rem (8px) radius. This provides a modern, friendly feel while maintaining professional structure.
- **Large Containers (Cards, Modals):** 1rem (16px) radius. This distinguishes major structural blocks from smaller interactive components.
- **Status Pills:** Fully rounded (pill-shaped) to clearly differentiate them from clickable buttons.

## Components

### Buttons
- **Primary:** Solid Teal with white text. High-contrast, 8px rounded corners.
- **Secondary:** Navy outline with navy text. Used for less critical actions like "Download PDF."
- **Ghost:** No background/border, Teal text. Used for navigation within cards.

### Input Fields
Inputs should use a 1px border in Neutral-Light, with an 8px radius. On focus, the border transitions to Primary-Teal with a subtle 2px outer glow. Labels always sit above the field in Label-SM style.

### Cards
Cards are the primary organizational unit. They should have a White background, 16px radius, and the Level 1 Ambient Shadow. Internal padding should be a consistent 24px.

### Chips/Badges
Used for statuses (Active, Overdue, Pending).
- **Active:** Light Teal background with Deep Teal text.
- **Overdue:** Light Red background with Deep Red text.
Use pill-shaped rounding (999px) for all chips.

### Navigation Sidebar
The sidebar should use the Secondary (Navy) color as its background or a very light gray with Navy text to emphasize hierarchy. Active states are indicated by a Primary-Teal vertical bar on the left edge and a bolded text weight.