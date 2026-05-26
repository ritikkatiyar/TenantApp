---
name: Luminous Control
colors:
  surface: '#f4faff'
  surface-dim: '#d2dbe1'
  surface-bright: '#f4faff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#ecf5fb'
  surface-container: '#e6eff5'
  surface-container-high: '#e0e9ef'
  surface-container-highest: '#dbe4ea'
  on-surface: '#141d21'
  on-surface-variant: '#3b494c'
  inverse-surface: '#293236'
  inverse-on-surface: '#e9f2f8'
  outline: '#6b7a7d'
  outline-variant: '#bac9cd'
  surface-tint: '#006877'
  primary: '#006877'
  on-primary: '#ffffff'
  primary-container: '#00e0ff'
  on-primary-container: '#005f6d'
  inverse-primary: '#00daf8'
  secondary: '#0059bb'
  on-secondary: '#ffffff'
  secondary-container: '#0070ea'
  on-secondary-container: '#fefcff'
  tertiary: '#46636c'
  on-tertiary: '#ffffff'
  tertiary-container: '#b3d1db'
  on-tertiary-container: '#3e5a63'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a5eeff'
  primary-fixed-dim: '#00daf8'
  on-primary-fixed: '#001f25'
  on-primary-fixed-variant: '#004e5a'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc7ff'
  on-secondary-fixed: '#001a41'
  on-secondary-fixed-variant: '#004493'
  tertiary-fixed: '#c9e8f2'
  tertiary-fixed-dim: '#adcbd6'
  on-tertiary-fixed: '#001f27'
  on-tertiary-fixed-variant: '#2e4b53'
  background: '#f4faff'
  on-background: '#141d21'
  surface-variant: '#dbe4ea'
typography:
  headline-xl:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.1em
  button-text:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-padding: 24px
  element-gap: 16px
  section-margin: 40px
  max-width-content: 1200px
---

## Brand & Style
The design system embodies a high-tech, futuristic aesthetic that blends the clarity of **Corporate Modern** with the ethereal depth of **Glassmorphism**. It is designed for command centers and real estate management platforms that require an authoritative yet innovative feel. 

The personality is precise, luminous, and orderly. The UI evokes a sense of "digital air"—lightweight, breathable, and highly legible. It achieves this through the use of expansive white space, translucent frosted-glass containers, and high-energy focal points using vibrant cyan gradients. The emotional response should be one of calm control and technological sophistication.

## Colors
The palette is rooted in a "luminous cool" spectrum. 

- **Primary Cyan (#00E0FF):** Used for primary action buttons, active states, and critical highlights. It is often paired with a gradient toward the **Secondary Blue (#007BFF)** to create a sense of movement and energy.
- **Deep Slate/Navy (#0D2C34):** Reserved for primary text, iconography in its default state, and heavy-weight headers to provide a grounded contrast to the light environment.
- **Glassmorphism Neutrals:** The background is not a flat color but a soft, multi-stop radial gradient of pale cyan and lavender. Surfaces use a semi-transparent white with high background blur (20px-40px) to simulate frosted glass.
- **Functional Colors:** Error states use a soft coral-red, while inactive backgrounds utilize a very pale, desaturated version of the primary cyan.

## Typography
The typography strategy balances modern approachability with technical precision. 

- **Headlines:** Use **Manrope** with tight letter-spacing and heavy weights (700-800) to create a strong visual anchor against the soft glass backgrounds.
- **Body Text:** **Inter** provides maximum legibility for data-heavy sections, maintaining a neutral and functional tone.
- **Labels:** Technical metadata and small UI labels use **JetBrains Mono** in all-caps. This monospaced touch reinforces the "Command Center" and technical nature of the design system.
- **Hierarchy:** High contrast in weight is preferred over high contrast in size. Use bold weights for interactivity and medium/regular weights for descriptive content.

## Layout & Spacing
The system utilizes a **Fixed Grid** approach for centered dashboards and a **Fluid Grid** for internal property management views.

- **Grid:** A 12-column grid system with 24px gutters.
- **Margins:** Desktop views should maintain a minimum of 48px side margins. On mobile, this reduces to 16px.
- **Density:** The spacing is generous (Relaxed). Grouped elements (like input sets) should use 16px gaps, while major sections or cards should be separated by 40px to maintain the "airy" feel.
- **Responsive Behavior:** Cards reflow from horizontal 3-column layouts on desktop to single-column stacks on mobile. The bottom navigation bar is fixed on mobile, whereas it occupies a sidebar or top-level header on desktop.

## Elevation & Depth
Depth is created through **Backdrop Blurs** and **Ambient Shadows** rather than traditional stacking.

- **Surfaces:** Use "Glass Tiers." The base layer is the soft background gradient. Level 1 containers (Cards) use a semi-transparent white (60% opacity) with a `backdrop-filter: blur(20px)`. 
- **Shadows:** Shadows are extremely subtle, using a tinted "cyan-grey" (#0D2C34 at 5% opacity) with a large spread (30px+) to simulate a soft glow rather than a hard drop.
- **Outlines:** Every glass container must have a 1px solid border at 80% white opacity to define the edge against the blurred background.

## Shapes
The shape language is consistently **Rounded**, leaning towards a friendly but professional "squircle" aesthetic.

- **Main Containers:** Use a 24px (1.5rem) corner radius to soften the technical feel.
- **Interactive Elements:** Buttons and Input fields use a 12px-16px radius.
- **Icons:** Icons should be housed in soft-rounded squares or circles with a subtle background tint to indicate their click-zone.

## Components
- **Buttons:** Primary buttons use a horizontal gradient (Primary Cyan to Secondary Blue). Text is white, all-caps, and bold. They feature a soft outer glow in the primary color when hovered.
- **Input Fields:** Pure white backgrounds with a subtle 1px border. Focus states should transition the border to Primary Cyan and add a soft inner shadow.
- **Cards:** Large, glassmorphic containers. Headers within cards should be separated by a very faint horizontal line (1px white at 20%).
- **Chips/Status:** Use a "Glow" style—semi-transparent background of the status color (e.g., 10% red for alerts) with high-contrast bold text.
- **Bottom Navigation:** A frosted glass bar with a high blur factor. The active state is indicated by a Primary Cyan icon and a small glowing dot or background pill.
- **List Items:** Simple, clean rows with 16px vertical padding, separated by a thin 5% slate divider.