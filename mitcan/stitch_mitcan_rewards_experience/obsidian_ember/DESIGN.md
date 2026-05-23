---
name: Obsidian & Ember
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1b1b1b'
  surface-container: '#1f1f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#ddc1ae'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#303030'
  outline: '#a48c7a'
  outline-variant: '#564334'
  surface-tint: '#ffb77d'
  primary: '#ffb77d'
  on-primary: '#4d2600'
  primary-container: '#ff8c00'
  on-primary-container: '#623200'
  inverse-primary: '#904d00'
  secondary: '#c8c6c5'
  on-secondary: '#313030'
  secondary-container: '#474746'
  on-secondary-container: '#b7b5b4'
  tertiary: '#c8c6c8'
  on-tertiary: '#303032'
  tertiary-container: '#aba9ab'
  on-tertiary-container: '#3e3e40'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdcc3'
  primary-fixed-dim: '#ffb77d'
  on-primary-fixed: '#2f1500'
  on-primary-fixed-variant: '#6e3900'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#e4e2e4'
  tertiary-fixed-dim: '#c8c6c8'
  on-tertiary-fixed: '#1b1b1d'
  on-tertiary-fixed-variant: '#474649'
  background: '#131313'
  on-background: '#e2e2e2'
  surface-variant: '#353535'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  margin-main: 20px
  gutter: 12px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
---

## Brand & Style

The design system is built on a foundation of "Cinematic Noir." It targets a discerning audience that values speed, status, and premium culinary experiences. The brand personality is authoritative yet welcoming, using deep blacks and warm orange glows to simulate the atmosphere of a high-end steakhouse or exclusive club.

The visual style is a sophisticated blend of **Minimalism** and **Glassmorphism**. It utilizes:
*   **Deep Tonal Depth:** Layered "Dark Coffee" surfaces over pure black backgrounds.
*   **Luminous Accents:** Premium orange is used sparingly for high-impact calls to action and status indicators.
*   **Apple-inspired Polish:** Smooth corner radii and refined micro-interactions that communicate precision and quality.

## Colors

The palette is strictly dark to maintain a premium, high-contrast aesthetic. 

*   **Foundation:** `#000000` (Pure Black) serves as the primary canvas to ensure perfect OLED blacks and maximum contrast.
*   **Surfaces:** `#1A1A1A` (Dark Coffee) is the secondary color used for cards, sheets, and elevated containers.
*   **Accents:** `#FF8C00` (Premium Orange) is the sole "hero" color, used for primary actions, progress bars, and high-status elements.
*   **Feedback:** Success states should utilize a desaturated gold rather than a standard green to maintain the warm, luxury feel.

## Typography

The typography system relies on **Inter** to provide a technical, clean, and highly legible interface. 

*   **Hierarchy:** Use bold weights for currency, point totals, and status titles to create a sense of importance.
*   **Clarity:** Body text uses a slightly increased line height (1.5x) to ensure readability against dark backgrounds.
*   **Labels:** Small labels and captions should utilize uppercase styling with generous letter spacing to evoke a "luxury tag" aesthetic.

## Layout & Spacing

This design system uses a **Fluid Grid** model optimized for mobile-first interactions. 

*   **Margins:** A standard 20px side margin ensures content does not feel cramped on edge-to-edge displays.
*   **Density:** Spacing is tight but purposeful, favoring vertical stacks over complex horizontal grids to facilitate one-handed thumb navigation.
*   **Rhythm:** An 8px linear scale (with 4px increments for micro-spacing) governs all component margins and padding, creating a consistent visual beat across the app.

## Elevation & Depth

Visual hierarchy is established through **Tonal Layering** and **Glassmorphism**:

1.  **Level 0 (Base):** Pure black `#000000`.
2.  **Level 1 (Cards):** `#1A1A1A` with a subtle 1px border of `rgba(255, 255, 255, 0.05)`.
3.  **Level 2 (Overlays):** Semi-transparent glass with a `20px` backdrop blur and a soft, orange-tinted ambient shadow for active states.

Shadows should never be pure black; they should use a deep umber tint to complement the orange accents and maintain the "warm" dark-mode feel.

## Shapes

The shape language is **Rounded**, echoing the sophisticated curves of modern smartphone hardware and premium credit cards.

*   **Primary Containers:** Use `rounded-lg` (16px) for cards and main UI blocks.
*   **Interactive Elements:** Buttons and input fields use `rounded-lg` to maintain a consistent silhouette.
*   **Status Badges:** Use "Pill" shapes (full radius) to differentiate them from actionable buttons.

## Components

### Buttons
*   **Primary:** Solid `#FF8C00` with white or black text. Apply a subtle inner glow to simulate a physical light source.
*   **Secondary:** Ghost style with a 1px border of `#FF8C00` or a glass background.

### Cards & Chips
*   **Rewards Card:** Utilize a gradient background (Dark Coffee to a subtle Deep Orange) with a high-gloss overlay to mimic a physical membership card.
*   **Category Chips:** Subtle grey backgrounds that turn primary orange upon selection.

### Inputs
*   **Search/Text Fields:** Darker than the card background with a 1px border that glows orange when focused.

### Progress & Status
*   **Rewards Tracker:** Thick, rounded bars using the primary orange. Use a "pulse" animation for active progress.
*   **QR Code:** Should be centered on a high-contrast white container for maximum scannability at point-of-sale, styled with the brand's signature rounded corners.