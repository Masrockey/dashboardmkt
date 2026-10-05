---
name: Apex Telemetry & Race Operations
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#5c403c'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#916f6b'
  outline-variant: '#e6bdb8'
  surface-tint: '#bf0715'
  primary: '#b70011'
  on-primary: '#ffffff'
  primary-container: '#dc2626'
  on-primary-container: '#fff6f5'
  inverse-primary: '#ffb4ab'
  secondary: '#555f6f'
  on-secondary: '#ffffff'
  secondary-container: '#d6e0f3'
  on-secondary-container: '#596373'
  tertiary: '#005e8d'
  on-tertiary: '#ffffff'
  tertiary-container: '#0078b2'
  on-tertiary-container: '#f3f8ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad6'
  primary-fixed-dim: '#ffb4ab'
  on-primary-fixed: '#410002'
  on-primary-fixed-variant: '#93000b'
  secondary-fixed: '#d9e3f6'
  secondary-fixed-dim: '#bdc7d9'
  on-secondary-fixed: '#121c2a'
  on-secondary-fixed-variant: '#3d4756'
  tertiary-fixed: '#cbe6ff'
  tertiary-fixed-dim: '#90cdff'
  on-tertiary-fixed: '#001e30'
  on-tertiary-fixed-variant: '#004b71'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 52px
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.06em
  telemetry-metric:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-md: 1.5rem
  gutter-lg: 2rem
  margin: 1rem
  margin-md: 2rem
  margin-lg: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system expresses the high-precision world of competitive automotive racing through an ultra-clean, telemetry-inspired aesthetic. Drawing from motorsport timing displays, paddock command screens, and high-performance automotive cockpits, the interface balances immediate readability with aggressive speed accents.

The personality is exact, technical, and poised. The visual tone eliminates superfluous decoration, relying instead on razor-sharp information architecture, crisp linear dividers, and purposeful bursts of race-tuned red. The target audience comprises trackside engineers, racing drivers, event coordinators, and motorsport enthusiasts who require instant data parsing under intense conditions. The resulting UI evokes absolute control, calibrated engineering, and high-velocity clarity.

## Colors

The palette establishes an ultra-high-contrast, light-mode operating environment.

- **Primary (`#DC2626`)**: Astra Racing Red acts as an operative beacon. It signals active track status, fastest lap sectors, primary actions, critical alerts, and brand signature moments. It must be deployed with discipline—retaining high urgency and purpose without diluting key data displays.
- **Secondary (`#1F2937`)**: Dark Charcoal serves as the primary structural anchor. Used for high-emphasis headlines, active metric readouts, and solid secondary controls. Paired with deep charcoal (`#111827`) for body typography and high-density telemetry values.
- **Neutral (`#F8F9FA`)**: Clean racetrack asphalt neutrals. The base canvas operates on pure `#FFFFFF`, tiered against `#F8F9FA` for structural canvas zones and `#F1F3F5` for input backdrops and telemetry slot containers.
- **Borders & Dividers (`#E5E7EB`)**: Structural hairpins and timing dividers maintain crisp sector boundaries without adding visual clutter.

## Typography

The type system uses **Inter** across all functional tiers to guarantee uncompromised legibility, uniform vertical metrics, and optical neutrality. 

- **Display & Headlines**: Tightly tracked, heavy weights (700 and 800) create assertive timing boards and section titles.
- **Labels & Telemetry Tags**: Rendered with uppercase styling, slight letter spacing (up to `0.06em`), and bold weights to evoke cockpit indicator panels.
- **Tabular Numerals**: In production, timing figures, delta splits, and positional ranking tables must activate `font-feature-settings: "tnum" 1` to prevent layout shift during high-frequency live data updates.

## Layout & Spacing

The layout model uses a responsive 12-column fluid grid system engineered for modular dashboards, race control consoles, and responsive event directories.

- **Breakpoints**:
  - **Mobile (< 768px)**: 4-column structure with `1rem` margins and `1rem` gutters. Telemetry blocks collapse vertically into sequential timing cards.
  - **Tablet (768px – 1024px)**: 8-column structure with `2rem` margins and `1.5rem` gutters. Splits screens into primary lap boards and secondary run charts.
  - **Desktop (> 1024px)**: 12-column fixed-max layout (up to `1440px`) with `3rem` margins and `2rem` gutters. Accommodates multi-stream telemetry, telemetry heatmaps, and telemetry data tables.

Rhythmic padding employs strict multiples of 4px. Compact component layouts prioritize information density without crowding, using `space-xs` and `space-sm` for dense data pairing and `space-md` through `space-xl` for sectional segmentation.

## Elevation & Depth

Visual hierarchy relies on structural, low-contrast boundaries and light tonal layering rather than heavy drop shadows.

- **Borders over Shadows**: Spatial separation is primarily enforced by 1px solid hairline borders (`#E5E7EB`).
- **Surface Layering**:
  - Base: `#FFFFFF` for primary cards, telemetry containers, and active tables.
  - Recessed: `#F8F9FA` for track background environments and deactivated panels.
  - Nested: `#F1F3F5` for metric pills, badge wells, and input fields.
- **Ambient Focus Elevation**: For modal overlays, floating lap comparison sheets, and dropdown timing menus, use a soft, technical ambient shadow: `box-shadow: 0 4px 16px -2px rgba(17, 24, 39, 0.06), 0 1px 3px 0 rgba(17, 24, 39, 0.04)`.
- **Active State Accents**: Critical indicators utilize high-contrast 2px left-edge borders in primary `#DC2626` to signal active vehicle focus or sector flags.

## Shapes

The shape system adopts a soft, engineered profile (`roundedness: 1`). Radii stay tight and disciplined to maintain an instrument-grade aesthetic:

- **Base Radius (`0.25rem` / `4px`)**: Buttons, input controls, metric cells, chips, and table line highlights.
- **Card & Container Radius (`0.5rem` / `8px`)**: Primary timing cards, modal windows, and modular telemetry modules.
- **Surface Trim (`0.75rem` / `12px`)**: Outer dashboard viewports and hero event headers.

Pill-shaped containers are strictly reserved for live status indicators (e.g., "LIVE TIMING", "P1", "PIT ACTIVE") to differentiate state badges from interactive actionable elements.

## Components

### Buttons
- **Primary**: Solid Astra Racing Red (`#DC2626`) fill, text `#FFFFFF`, 4px border radius. Hover: `#B91C1C`. Active: `#991B1B`. Height: 40px (Desktop), 36px (Compact/Telemetry).
- **Secondary**: Surface `#FFFFFF`, border 1px solid `#E5E7EB`, text `#1F2937`. Hover: `#F8F9FA` with border `#D1D5DB`.
- **Destructive / Flag**: Transparent background, 1px solid `#DC2626`, text `#DC2626`.
- **Button Groups**: Segmented switches joined by 1px borders for toggling telemetry channels (e.g., "Sector 1", "Sector 2", "Sector 3").

### Chips & Badges
- **Status Badges**: Pill-shaped (`border-radius: 9999px`), 11px uppercase label with bold tracking.
  - Active/Live: Fill `#FEE2E2`, text `#DC2626`, dot indicator in `#DC2626`.
  - Neutral: Fill `#F1F3F5`, text `#1F2937`.
- **Telemetry Chips**: 4px radius, `#F8F9FA` fill, 1px border `#E5E7EB`. Contains key-value metrics (e.g., `GAP: +0.244s`).

### Cards & Telemetry Containers
- **Container Structure**: `#FFFFFF` background, 1px solid `#E5E7EB` border, 8px border radius, zero ambient shadow in resting state.
- **Section Headers**: Integrated header row bounded by bottom border `#E5E7EB`, housing metadata labels and quick-switch actions.
- **Selected Card**: 1px solid `#DC2626` outline with a 2px left border accent in `#DC2626`.

### Lists & Data Tables
- **Timing Row**: Alternate striping with `#FFFFFF` and `#F8F9FA`. Row height: 44px for high density.
- **Dividers**: 1px horizontal borders `#E5E7EB`. Column dividers remain invisible, separated by consistent horizontal grid gutters.
- **Delta Indicator**: Positive delta values in `#DC2626`, neutral/equal times in `#1F2937`, record lap times highlighted with red badge containers.

### Form Inputs & Controls
- **Text Inputs**: Height 40px, surface `#FFFFFF`, border 1px solid `#E5E7EB`, text `#111827`. Focus: border `#DC2626`, box-shadow `0 0 0 1px #DC2626`.
- **Checkboxes & Radios**: 4px radius (checkbox) / circular (radio). Unchecked: 1px border `#D1D5DB`. Checked: Solid `#DC2626` with crisp white checkmark or inner dot.

### Specialized Race Components
- **Sector Delta Bar**: A linear segmented progression bar representing S1, S2, S3 with dynamic state fills (Personal Best, Session Best in red, Slower).
- **Pit Lane Indicator**: Minimalist mono-spaced countdown timers with high-contrast `#111827` font on `#F1F3F5` recessed background panels.