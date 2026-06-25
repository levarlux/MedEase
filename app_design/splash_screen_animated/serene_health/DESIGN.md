---
name: Serene Health
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
  on-surface-variant: '#3f4946'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#6f7976'
  outline-variant: '#bec9c5'
  surface-tint: '#146a5c'
  primary: '#146a5c'
  on-primary: '#ffffff'
  primary-container: '#86d2c1'
  on-primary-container: '#005c4f'
  inverse-primary: '#89d5c4'
  secondary: '#33628b'
  on-secondary: '#ffffff'
  secondary-container: '#a4d0ff'
  on-secondary-container: '#295982'
  tertiary: '#685f25'
  on-tertiary: '#ffffff'
  tertiary-container: '#d2c580'
  on-tertiary-container: '#5a5118'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a4f1df'
  primary-fixed-dim: '#89d5c4'
  on-primary-fixed: '#00201b'
  on-primary-fixed-variant: '#005045'
  secondary-fixed: '#cfe5ff'
  secondary-fixed-dim: '#9ecbf9'
  on-secondary-fixed: '#001d33'
  on-secondary-fixed-variant: '#154a72'
  tertiary-fixed: '#f1e39c'
  tertiary-fixed-dim: '#d4c782'
  on-tertiary-fixed: '#201c00'
  on-tertiary-fixed-variant: '#50470f'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 34px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-lg:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  headline-lg-mobile:
    fontFamily: Manrope
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
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: 64px
---

## Brand & Style

The design system is centered on a "friendly clinical" aesthetic, specifically tailored for healthcare and medication management. It aims to reduce the cognitive load and anxiety often associated with medical adherence by using a calming, modern, and highly organized visual language.

The style leverages **Corporate Modernism** blended with **Soft Minimalism**. It prioritizes clarity through generous whitespace, high-quality typography, and a tactile card-based layout. The interface should feel approachable yet authoritative—like a clean, well-designed modern clinic that prioritizes patient comfort. Every interaction is designed to feel supportive and gentle, using soft transitions and rounded forms to evoke a sense of safety and wellness.

## Colors

This design system utilizes a soft pastel palette to differentiate between categories of health data while maintaining a cohesive, calming atmosphere.

- **Primary (Mint Green):** Used for positive actions, completion states, and "Active" medication status. It signals health and growth.
- **Secondary (Soft Blue):** Used for informative UI elements, scheduling, and nighttime medication reminders.
- **Tertiary (Warm Yellow):** Reserved for warnings, morning medication, or highlighting items that require immediate attention without inducing panic.
- **Neutral/Surface:** A range of very light greys and off-whites are used to create "tonal layering," ensuring the cards sit softly against the background.

Avoid high-saturation reds or harsh blacks. All "Danger" or "Alert" states should be handled with a muted coral rather than a standard bright red to maintain the calming narrative.

## Typography

**Manrope** is the foundation of this design system. It was chosen for its modern, geometric construction and high legibility, which balances the clinical nature of the app with a friendly, humanistic touch.

- **Headlines:** Use Bold (700) weights to create a clear information hierarchy.
- **Body:** Stick to Regular (400) for long-form instructions or descriptions to maximize readability.
- **Labels:** Use SemiBold (600) for navigation elements and button labels to ensure they are distinct from body text.
- **Spacing:** Tighten letter-spacing slightly on larger display sizes to maintain a compact, premium feel.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a specific focus on vertical rhythm and "Safe Air." 

- **Grid:** On mobile, use a 4-column grid with 16px gutters. On desktop, use a 12-column grid with 24px gutters.
- **Margins:** High-density content is avoided. Mobile screens should maintain a minimum of 20px side margins to prevent the UI from feeling cramped.
- **Vertical Spacing:** Use an 8px base unit. Groups of related items (like a medication name and its dosage) should be 4-8px apart, while unrelated sections should be 32px+ apart.
- **The "Bento" Rule:** Use cards of varying widths (half-span or full-span) to create a modular, dashboard-like feel that organizes complex health data into digestible chunks.

## Elevation & Depth

Visual hierarchy is achieved through **Tonal Layers** and **Ambient Shadows** rather than stark borders.

- **Base Layer:** The main background is a crisp white or very faint grey (#F8F9FA).
- **Surface Layer:** Cards use pure white (#FFFFFF).
- **Shadows:** Use a "Clinical Glow"—extremely soft, diffused shadows with a large blur radius (e.g., `box-shadow: 0 10px 30px rgba(0,0,0,0.04)`). The shadows should feel like a natural light source is hitting the elements, creating a subtle lift without adding visual "noise."
- **Interactive Depth:** When a card is pressed or active, it may transition to a slightly deeper shadow or a very thin 1px border in the primary color to indicate focus.

## Shapes

The shape language is defined by extreme softness. This design system avoids sharp corners entirely to maintain a friendly and safe atmosphere.

- **Cards:** Use a 24px corner radius as the standard for all primary containers.
- **Buttons & Chips:** Use a pill-shaped (fully rounded) or a minimum 16px radius.
- **Inputs:** A slightly tighter 12px radius helps differentiate interactive fields from informational cards.
- **Consistency:** All nested elements (like an image inside a card) must follow the "Inner Radius = Outer Radius - Padding" rule to maintain visual harmony.

## Components

### Buttons
Primary buttons should use the Mint Green palette with white text. They are large, pill-shaped, and use a 16px vertical padding to ensure a comfortable touch target. Secondary buttons should use a ghost style (transparent background with a subtle border or tinted background).

### Cards
Cards are the primary vehicle for information. Every card should have a 24px radius and an ambient shadow. Medication cards should include a colored "indicator" (a small dot or side bar) using the primary/secondary/tertiary colors to denote time of day or urgency.

### Chips & Tags
Used for dosage forms (e.g., "Pill", "Liquid", "Injection") or frequency. They should be low-contrast, using a light tint of the primary color with a slightly darker text color.

### Input Fields
Fields should be "filled" style with a very light neutral background and no border until focused. When focused, the background remains light, but a 2px primary color border appears.

### Progress Indicators
Use soft, thick-stroke rings or rounded progress bars. Use the primary Mint Green to show completion of daily doses.

### Navigation Bar
A floating or bottom-docked navigation bar with a heavy blur (glassmorphism) or solid white background. Icons should be "Duotone" or "Rounded Outline" style to match the soft typography.