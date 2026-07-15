---
name: PropMetric
colors:
  surface: '#f7fafc'
  surface-dim: '#d7dadc'
  surface-bright: '#f7fafc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f4f6'
  surface-container: '#ebeef0'
  surface-container-high: '#e5e9eb'
  surface-container-highest: '#e0e3e5'
  on-surface: '#181c1e'
  on-surface-variant: '#3e4949'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eef1f3'
  outline: '#6e7979'
  outline-variant: '#bdc9c8'
  surface-tint: '#006a6a'
  primary: '#006565'
  on-primary: '#ffffff'
  primary-container: '#008080'
  on-primary-container: '#e3fffe'
  inverse-primary: '#76d6d5'
  secondary: '#476083'
  on-secondary: '#ffffff'
  secondary-container: '#bdd6ff'
  on-secondary-container: '#445d80'
  tertiary: '#515c5d'
  on-tertiary: '#ffffff'
  tertiary-container: '#697575'
  on-tertiary-container: '#f0fcfc'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#93f2f2'
  primary-fixed-dim: '#76d6d5'
  on-primary-fixed: '#002020'
  on-primary-fixed-variant: '#004f4f'
  secondary-fixed: '#d4e3ff'
  secondary-fixed-dim: '#afc8f0'
  on-secondary-fixed: '#001c3a'
  on-secondary-fixed-variant: '#2f486a'
  tertiary-fixed: '#d9e5e5'
  tertiary-fixed-dim: '#bdc9c9'
  on-tertiary-fixed: '#131d1e'
  on-tertiary-fixed-variant: '#3e4949'
  background: '#f7fafc'
  on-background: '#181c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  financial-data:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 32px
  xl: 48px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style
The design system for this platform prioritizes functional precision and institutional trust. Targeting property managers, landlords, and tenants, the aesthetic balances **Modern Corporate** reliability with a touch of **Minimalism** to reduce the cognitive load inherent in financial settlements.

The UI evokes a sense of fairness and transparency. It utilizes a structured, high-clarity interface that emphasizes data integrity and procedural clarity. Surfaces are clean, with ample whitespace to ensure that complex checklists and financial ledgers remain legible and non-intimidating.

## Colors
The palette is anchored by a professional **Navy (#001F3F)** for typography and navigation, paired with a dependable **Teal (#008080)** for primary actions. 

Semantic colors are strictly regulated for inventory and settlement workflows:
- **Condition States:** High-saturation greens and teals denote "Brand New" and "Good," shifting to amber for "Fair" and a sharp red for "Damaged."
- **Approval States:** Clear, distinct tones are used for settlement statuses: Green for Approved, Blue for Pending, and Orange for Disputed. 
- **Surface Neutrals:** A cool-toned gray-blue is used for background layers to maintain a clean, clinical environment for data entry.

## Typography
The typographic system utilizes **Manrope** for structural headings to provide a modern, balanced feel. **Inter** is employed for all body copy and form inputs to ensure maximum legibility across dense data sets.

For financial summaries, settlement ledgers, and inventory codes, **JetBrains Mono** is used. This monospaced choice ensures that numerical figures align perfectly in columns, facilitating quick visual audits of deposit deductions. Use `label-caps` for metadata tags and inventory condition headers.

## Layout & Spacing
This design system uses a **Fixed Grid** on desktop (1200px max-width) and a **Fluid Grid** on mobile devices. A strict 8px spatial rhythm governs all padding and margins.

- **Checklist Layouts:** Utilize a single-column focused view on mobile, expanding to a split-pane layout on desktop (Inventory Item on the left, Evidence/Deduction details on the right).
- **Financial Summaries:** These should be anchored to the bottom of the viewport on mobile as a sticky summary bar, or appearing as a right-hand sidebar on desktop to keep the "Total Refund" constantly visible during the settlement process.

## Elevation & Depth
Depth is communicated through **Tonal Layers** rather than heavy shadows. 

- **Level 0 (Background):** The base neutral color.
- **Level 1 (Cards/Checklist Items):** Pure white background with a 1px border in a soft neutral-200. No shadow.
- **Level 2 (Active/Hover):** A subtle, highly-diffused ambient shadow (4px blur, 5% opacity Navy) to indicate interactivity.
- **Level 3 (Modals/Overlays):** Elevated with a 16px blur shadow and a semi-transparent Navy backdrop blur (Glassmorphism) to keep the user focused on the settlement approval task.

## Shapes
The design system adopts a **Rounded** aesthetic (0.5rem base radius). This softens the corporate nature of the application, making the settlement process feel less litigious and more collaborative. 

Checkboxes and radio buttons should maintain this 4px-8px radius—avoiding fully sharp corners or perfect circles—to remain consistent with the container language. Financial summary boxes should use `rounded-lg` (1rem) to distinguish them as high-level summary components.

## Components
- **Checklist Interfaces:** Each item must include a "Before/After" photo toggle, a condition status chip, and a nested "Deduction Toggle." When a deduction is active, the row background shifts to a very faint tint of the secondary color.
- **Financial Summaries:** Use a "Receipt Style" component. It should feature a dashed separator line above the "Net Refund" amount and use monospaced typography for all currency values to ensure decimal alignment.
- **Status Chips:** Small, pill-shaped indicators with low-opacity background tints and high-contrast text. For "Damaged" status, include a small warning icon.
- **Action Buttons:** Primary buttons (Teal) use bold white text. Secondary buttons (Settlement Disputed) use a ghost-style border with Navy text.
- **Input Fields:** Use "floating labels" to save vertical space in dense checklist forms. The active state is indicated by a 2px Teal bottom-border.