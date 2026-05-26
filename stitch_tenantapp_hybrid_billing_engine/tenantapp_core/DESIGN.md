---
name: TenantApp Core
colors:
  surface: '#051424'
  surface-dim: '#051424'
  surface-bright: '#2c3a4c'
  surface-container-lowest: '#010f1f'
  surface-container-low: '#0d1c2d'
  surface-container: '#122131'
  surface-container-high: '#1c2b3c'
  surface-container-highest: '#273647'
  on-surface: '#d4e4fa'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#ddb7ff'
  on-secondary: '#490080'
  secondary-container: '#6f00be'
  on-secondary-container: '#d6a9ff'
  tertiary: '#bec6e0'
  on-tertiary: '#283044'
  tertiary-container: '#8990a8'
  on-tertiary-container: '#22293d'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#f0dbff'
  secondary-fixed-dim: '#ddb7ff'
  on-secondary-fixed: '#2c0051'
  on-secondary-fixed-variant: '#6900b3'
  tertiary-fixed: '#dae2fd'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3f465c'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
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
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1440px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
---

## Brand & Style
The design system is engineered for a premium SaaS billing environment, prioritizing a sense of security, high-tech sophistication, and effortless clarity. The aesthetic leans heavily into **Glassmorphism** and **Minimalism**, utilizing depth and translucency to organize complex financial data without overwhelming the user.

The interface should evoke an emotional response of "controlled power"—where the software feels both innovative and impeccably stable. Expect heavy use of background blurs, subtle border highlights to define interactive surfaces, and a dark-mode-first approach that reduces eye strain during long-form financial analysis.

## Colors
This design system utilizes a "Deep Space" palette. The foundation is **Deep Slate (#0F172A)**, providing a high-end, cinematic backdrop. Brand presence is established through **Vibrant Indigo** and **Violet** accents, used purposefully for primary actions and data visualizations.

Glass surfaces are created using semi-transparent overlays of the background color with a high-saturation background blur (20px-40px). Borders on glass elements should use a linear gradient (top-left to bottom-right) of white at 15% opacity to white at 5% opacity to simulate light catching the edge of a physical pane.

## Typography
The typography system relies on **Inter** for its neutral, highly legible character, ensuring that dense billing tables and invoices remain readable. For headers, high contrast is achieved through bold weights and tighter letter-spacing.

To reinforce the high-tech, SaaS-centric nature of the product, **JetBrains Mono** is introduced for small labels, status badges, and numerical data. This monospaced secondary font provides a "developer-grade" precision to financial figures.

## Layout & Spacing
The layout follows a **Fluid Grid** model with a fixed maximum width for content containers. We utilize a strict 8px linear scale to ensure consistent rhythm.

- **Desktop:** 12-column grid with 24px gutters. Use generous 64px side margins to create an "airy" premium feel.
- **Tablet:** 8-column grid with 20px gutters.
- **Mobile:** 4-column grid. Margins compress to 20px.

Data-heavy screens should prioritize "Vertical Rhythms," using 48px or 64px gaps between major sections to prevent the interface from feeling cramped.

## Elevation & Depth
Depth is not communicated through traditional drop shadows, but through **Tonal Layers** and **Backdrop Blurs**. 

- **Level 0 (Base):** Deep Slate (#0F172A).
- **Level 1 (Cards):** Translucent slate with a 30px background blur and a 1px soft white border.
- **Level 2 (Modals/Popovers):** Higher transparency, slightly lighter fill, and a more pronounced 60px blur to pull the element forward.

Interactions use "Inner Glows" (box-shadow: inset) rather than outer shadows to maintain the crisp, glass-like appearance.

## Shapes
The design system employs a **Rounded** shape language. This softens the "industrial" feel of the dark theme, making the billing platform feel more approachable and modern. 

Standard components (inputs, buttons) use a 0.5rem radius, while large layout containers and "frosted" cards use 1rem or 1.5rem to emphasize their structural importance.

## Components
- **Buttons:** Primary buttons use a solid Indigo-to-Violet gradient with a subtle white inner-stroke on the top edge. Hover states should trigger a "glow" effect using a soft outer shadow of the primary color.
- **Glass Cards:** The signature component. Background: `rgba(30, 41, 59, 0.7)` with a `backdrop-filter: blur(20px)`.
- **Input Fields:** Dark, recessed backgrounds with a 1px border that illuminates into the primary indigo color upon focus.
- **Chips/Badges:** Use the monospaced label font. Success states use a low-opacity green emerald background with a bright emerald text; avoid heavy solid colors.
- **Lists & Tables:** Rows should be separated by high-transparency lines (`rgba(255,255,255,0.05)`). Hovering over a row should apply a subtle highlight using a slight increase in surface opacity.
- **Data Visualizations:** Charts should use neon-inspired line weights with "area" fills that utilize the same glassmorphic transparency as the cards.