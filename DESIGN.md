---
name: Academia WARA GPS
description: Portal de capacitación técnica para profesionales de flotas y GPS.
colors:
  tactical-dark: "#0d0f14"
  surface-panel: "#161a22"
  surface-elevated: "#1e2330"
  edge-subtle: "#2a3040"
  ink-bright: "#e8eaf0"
  ink-muted: "#8a90a0"
  ink-dim: "#555e72"
  signal-blue: "#3b82f6"
  signal-blue-deep: "#2563eb"
  on-signal: "#ffffff"
  state-success: "#22c55e"
  state-warning: "#f59e0b"
  state-danger: "#ef4444"
typography:
  headline:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.4
  micro:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "10px"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.signal-blue}"
    textColor: "{colors.on-signal}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.signal-blue-deep}"
    textColor: "{colors.on-signal}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-danger:
    backgroundColor: "{colors.state-danger}"
    textColor: "{colors.on-signal}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  input-default:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.ink-bright}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
---

# Design System: Academia WARA GPS

## 1. Overview

**Creative North Star: "La Documentación de Campo"**

Academia WARA GPS is built like field documentation for professionals: every element earns its place by making information faster to reach or easier to read. The interface is not a product to admire — it is equipment to use. A GPS technician lands, finds the video they need, consumes it, and leaves. The system's role is to eliminate friction on that path.

The visual language borrows from the precision tools the user already trusts: developer tools, operations dashboards, technical documentation (Linear, Vercel). Deep near-black surfaces (Tactical Dark), a restrained Signal Blue for active states only, tonal layering over shadows, and a single system font at tight scale. Motion is minimal — state changes only, under 200ms. No choreography; no waiting.

This system explicitly rejects the LMS aesthetic: progress bars, gamification badges, saturated color blocks, icon-heavy card grids. It also rejects enterprise "heaviness": bloated sidebars, over-navigated shells, motion that makes you wait. Udemy, Coursera, heavy corporate training platforms — none of that. The model is the manual you reach for in the field: structured, precise, fast.

**Key Characteristics:**
- Tonal depth over shadows: three surface levels (base → panel → elevated) communicate hierarchy without elevation.
- Signal Blue as operational indicator: used only for active states, primary actions, and focused inputs. Never decoration.
- One sans family: system-ui across all roles, differentiated by weight and size only.
- Four theme variants sharing a single token vocabulary: design decisions live in the tokens, not in hard-coded values.
- Admin as tool, student as reader: density for the operator, clarity for the learner.

## 2. Colors: The Tactical Palette

A 3-layer dark neutral base with a single operational accent and a full semantic state vocabulary.

### Primary
- **Signal Blue** (`#3b82f6`): The single active-state color. Used for primary buttons, selected nav items, focused inputs, and active states. Its rarity makes it a reliable indicator of "this is the action / this is where you are." Used on ≤15% of any screen.
- **Signal Blue Deep** (`#2563eb`): Hover state for primary buttons only. Never used independently.

### Neutral
- **Tactical Dark** (`#0d0f14`): Page canvas. Near-black, slightly blue-shifted. Sets the professional, low-ambient-light tone.
- **Panel Surface** (`#161a22`): Sticky nav bars, page-level containers, sidebar panels. One step lighter than base.
- **Elevated Surface** (`#1e2330`): Input backgrounds, card interiors, dropdowns, highlighted rows. The highest tonal layer.
- **Edge Subtle** (`#2a3040`): All borders and dividers. Visible but not aggressive.
- **Ink Bright** (`#e8eaf0`): Primary text. All headings, labels, button text, critical content.
- **Ink Muted** (`#8a90a0`): Secondary text, nav labels, form labels, supporting information.
- **Ink Dim** (`#555e72`): Timestamps, placeholder text, tertiary metadata, disabled states.

### State Colors
- **Success** (`#22c55e`): Approved status, positive confirmations.
- **Warning** (`#f59e0b`): Pending status, attention states. Drives the pending-user alert on the admin panel.
- **Danger** (`#ef4444`): Rejected status, error messages, destructive action buttons.

### Named Rules
**The Signal Rule.** Signal Blue is used for one thing: "this is active, selected, or the next action." It is never used for decoration, hover tints on neutral content, or heading accents. If an element needs to stand out without being actionable, reach for weight or size — not blue.

**The Theme Contract.** All four visual themes share identical CSS token names (`--accent`, `--bg-surface`, etc.). New design decisions are made at the token level only. A component that hardcodes `#3b82f6` instead of `var(--accent)` is a design bug.

## 3. Typography

**Body / UI Font:** system-ui, -apple-system, sans-serif  
**No secondary font family.**

**Character:** The system font is the deliberate choice. It renders at native quality on every OS, loads instantly, and looks like the operating system's own UI — which is the point. Academia WARA GPS should feel like a native tool, not a web page. Display fonts, editorial pairings, and custom web fonts are out of scope for this surface.

### Hierarchy
- **Headline** (700, 24px / 1.2): Page headings and section titles. One per view maximum.
- **Title** (700, 20px / 1.3): Card headings, admin panel sub-sections, product names in the student view.
- **Body** (400, 14px / 1.5): All prose, form labels in context, content descriptions. Cap at 65ch.
- **Label** (500, 12px / 1.4): Nav items, status chips, button text, form field labels, table headers.
- **Micro** (500, 10px / 1.4): Mobile bottom-nav labels, admin role badges. Never below 10px.

### Named Rules
**The One Weight Rule.** Hierarchy is expressed through size and weight contrast (400 body / 500 label / 700 heading). Never through letter-spacing, uppercase, or color alone. The scale ratio is tight (~1.2); don't introduce additional sizes outside the scale to add visual interest.

## 4. Elevation

This system uses tonal layering — not shadows — to convey depth. Elevation is expressed through background color: darker means further back, lighter means closer to the user.

**Three levels:**
1. **Base** (`#0d0f14`): Page canvas. Nothing sits directly here.
2. **Panel** (`#161a22`): Nav bars, page-level cards, list containers.
3. **Elevated** (`#1e2330`): Input fields, card interiors, dropdowns.

Borders (`#2a3040`) reinforce layer boundaries where tonal contrast alone isn't enough (border between nav and content, between card and page).

**Single exception:** The AuthCard uses `shadow-lg`. It is the one externally-facing surface — reached without authentication — and the shadow grounds the card against the auth layout's full-bleed background.

### Named Rules
**The Flat-By-Default Rule.** Interactive elements (buttons, inputs, nav items) are flat at rest. No shadows on hover — background color shifts handle all state. Shadows exist only on the AuthCard. Any new shadow addition requires explicit justification.

## 5. Components

### Buttons
Three variants, one shape, one scale. Padding adjustments via className override when needed.

- **Shape:** Gently rounded (8px). Not pill, not sharp. Understated.
- **Primary:** Signal Blue (`#3b82f6`) background, white text, `px-4 py-2.5 text-sm font-medium`. Hover: Signal Blue Deep (`#2563eb`). Focus: 2px Signal Blue outline at 2px offset. Disabled: 50% opacity.
- **Ghost:** Transparent background, Ink Muted text. Hover: Ink Bright text + Elevated Surface background. For secondary actions next to a primary.
- **Danger:** Danger red background (`#ef4444`), white text, `hover:opacity-90`. Destructive actions only (reject, revoke, delete).
- **Loading state:** Animated spinner SVG prepended, button disabled.

### Inputs / Fields
- **Style:** Stroke field. Elevated Surface background, Edge Subtle border, 8px radius, `px-3.5 py-2.5 text-sm`.
- **Focus:** 2px Signal Blue outline, zero offset. No border color change on focus.
- **Error:** Border and outline shift to Danger red. Error message in `text-xs text-danger` below the field.
- **Label:** Above the field, `text-sm font-medium ink-muted`.
- **Placeholder:** Ink Dim (`#555e72`). Passes WCAG AA against Elevated Surface.

### Navigation
Two structural patterns sharing the same visual grammar:

- **Top bar (desktop):** `h-14`, sticky, Panel Surface background, Edge Subtle bottom border. Logo mark (7×7 Signal Blue square with "W") + text links + Salir/logout. Active link: Elevated Surface background + Ink Bright + `font-medium`. Inactive: Ink Muted, hover Ink Bright.
- **Mobile bottom nav:** Fixed, 4 items (admin) or 2 items (student). Icon + 10px label. Active: Signal Blue text. Inactive: Ink Dim.

### Status Chips / Badges
- **Shape:** Pill (`border-radius: 9999px`), `px-2 py-0.5 text-xs font-medium`.
- **Pending:** `bg-warning/15` + Warning text. Soft amber — attention without alarm.
- **Approved:** `bg-success/15` + Success text.
- **Rejected:** `bg-danger/15` + Danger text.
- **Admin role:** `bg-accent/15` + Signal Blue text.

### Cards / Containers
- **Content / List cards:** `rounded-xl` (12px), Edge Subtle border, Panel or Elevated Surface background, `p-4` internal padding.
- **Admin stat cards:** Same shape. Urgent variant (pending users): Warning border + `bg-warning/5`.
- **Auth card:** `rounded-2xl` (16px), Edge Subtle border, Panel Surface background, `p-8`, `shadow-lg`. The only component with a shadow.

### Theme Selector (Signature Component)
Four circular swatches — split-circle showing background + accent. Active swatch: 2px Signal Blue ring at 2px offset. Selection applies immediately: `document.documentElement.setAttribute('data-theme', id)` + localStorage + DB sync via Server Action. No page reload. Covered by `ThemeSync` on session load for cross-device consistency.

## 6. Do's and Don'ts

### Do:
- **Do** use Signal Blue (`#3b82f6`) only for active states, primary actions, and focus rings. Its scarcity is what makes it meaningful.
- **Do** express depth through background color steps (base → panel → elevated), not shadows.
- **Do** reference colors via `var(--token-name)` everywhere. Every component must work correctly across all four themes.
- **Do** keep motion under 200ms, limited to `transition-colors` or `transition-opacity`. State changes only.
- **Do** use `rounded-lg` (8px) for interactive components and `rounded-xl` / `rounded-2xl` for containers.
- **Do** include all interactive states: default, hover, focus-visible, disabled, loading. Missing focus-visible is an accessibility failure.
- **Do** document destructive actions with the `danger` button variant and require confirmation before executing.
- **Do** use skeleton loaders (`animate-pulse`) for async content. Spinners floating in content areas are disorienting.

### Don't:
- **Don't** use Signal Blue as a decorative color, hover tint, or heading accent. It's an operational indicator, not a brand color.
- **Don't** add shadows to any component other than the AuthCard. Tonal layering handles all depth.
- **Don't** introduce a second font family. system-ui is the deliberate, considered choice.
- **Don't** build the LMS aesthetic: progress bars, completion badges, star ratings, certificate graphics, gamification of any kind. This is field documentation, not a course marketplace.
- **Don't** use gradient text (`background-clip: text`). Emphasis through weight and size only.
- **Don't** use `border-left` as a colored accent stripe greater than 1px. Full-border cards or background tints instead.
- **Don't** hardcode a hex value from one theme. A component that breaks on `data-theme="4"` (light) is a design bug.
- **Don't** reach for modal as a first response. Prefer inline states, toast notifications, or page-level redirects. Modals for confirmations only.
- **Don't** add section eyebrows (small uppercase tracked kickers above every heading). One heading level is enough.
- **Don't** replicate Udemy, Coursera, or heavy enterprise LMS patterns: colored hero banners, icon-first card grids, overloaded sidebars, animated progress rings.
