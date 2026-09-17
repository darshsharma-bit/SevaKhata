# SEVAKHATA — Figma Design System & Handoff Guide
**The Consensus Engine: Anatomy of a Mutual Record**  
*Source of Truth: Production Website Implementation (August 2026)*

---

## 01. Overview & File Architecture

This design suite reconstructs the implemented SevaKhata landing page into a **100% editable, vector-accurate, component-structured Figma design suite**. Every text node (English, Hindi Devanagari, Tabular Numerals), button, card, and background reticle is preserved as an editable native object.

### File Structure (`design/`)

| File Name | Canvas Dimensions | Purpose & Contents |
| :--- | :--- | :--- |
| **`00_cover_figma.svg`** | 1920 × 1080 | Official Document Cover, brand lockup, thesis axiom, and release metadata. |
| **`01_desktop_1440_figma.svg`** | 1440 × 5200 | Master Primary Desktop Canvas. All 5 movements with clean 4-column slab, balanced consensus lockup, and official hisaab resolution. |
| **`02_tablet_1024_figma.svg`** | 1024 × 5400 | Tablet Responsive Canvas. 880px adaptive slab, stacked memory objects, and adaptive layout. |
| **`03_mobile_390_figma.svg`** | 390 × 4800 | Mobile Responsive Canvas. Recomposed 2-row card slab, ≥48px touch targets, vertical typographic lockup, and stacked balance. |
| **`04_components_figma.svg`** | 1600 × 2600 | Master Component Library & Variants (Nav, Brand Mark, Ledger Rows, Confirmation Controls, Semantic Pills, Math Blocks). |
| **`05_design_system_tokens_figma.svg`** | 1600 × 1800 | Design System, Color Variables, Typography Scale, Spacing Ladder, Radii, and Elevation Shadows. |
| **`06_motion_scroll_states_figma.svg`** | 1600 × 3400 | Motion Architecture & Prototype States (Hero → Slab Settle, Direct Manipulation State Machine, Hisaab Live Update). |
| **`sevakhata-landing-figma.svg`** | 1440 × 5200 | Master Synced Desktop Vector Canvas. |

---

## 02. Figma Import & Setup Instructions

### How to Import into Figma
1. Open a new or existing Figma file.
2. Create dedicated Figma pages matching the document architecture:
   - `00 — Cover`
   - `01 — Landing / Desktop (1440px)`
   - `02 — Landing / Tablet (1024px)`
   - `03 — Landing / Mobile (390px)`
   - `04 — Components & Variants`
   - `05 — Design System & Tokens`
   - `06 — Motion / Scroll States`
3. Drag and drop each `.svg` file onto its corresponding page in Figma.
4. **Figma Parsing Result**:
   - Figma automatically converts all `<text>` nodes into **native editable Figma text layers**.
   - Semantic `id` attributes are translated directly into **named Figma frames and groups** (e.g. `Landing / Hero Stage`, `Slab / Row 01 Confirmed`, `Component / Confirmation Control / Variant=Default`).
   - Radial gradients and drop-shadow filters are mapped to native Figma paint styles and drop-shadow effects.

### Required Fonts
Ensure the following free Google Fonts are available in your Figma environment:
- **Bebas Neue**: Monumental display titles, section kickers, and colossal climax numerals (`₹3,000`).
- **Inter**: System navigation, editorial copy, button labels, and tabular numerals.
- **Noto Sans Devanagari**: First-class authentic Hindi typography (`सेवाखाता`, `सही है`, `गलत है`, `पेसगी`, `साझा हिसाब`).

---

## 03. Design Tokens & Figma Variables

### Color Palette

| Token Name | Figma Variable Name | Hex / RGBA | Usage |
| :--- | :--- | :--- | :--- |
| `--bg-deep` | `color/background/deep` | `#08080A` | Deepest ambient canvas background |
| `--bg-canvas` | `color/background/canvas` | `#0C0C0E` | Main page canvas fill |
| `--bg-surface-base` | `color/surface/base` | `#111115` | Living slab, cards, and equation tiles |
| `--bg-surface-elevated` | `color/surface/elevated` | `#16161C` | Active row highlight, navigation pill |
| `--khata-crimson-spine` | `color/khata/spine` | `#E11D48` | Authentic red bahi-khata left border spine |
| `--khata-crimson-seal` | `color/khata/seal` | `#C8202B` | Monumental radial background seal disk |
| `--emerald-core` | `color/state/confirmed` | `#059669` | Sahi Hai button, confirmed states, seals |
| `--emerald-bright` | `color/text/confirmed` | `#34D399` | Confirmed text, glowing climax balance |
| `--amber-core` | `color/state/pending` | `#F59E0B` | Quarantine state, pending review, date dot |
| `--amber-bright` | `color/text/pending` | `#FBBF24` | Pending tag text, today highlight |
| `--rose-core` | `color/state/disputed` | `#EF4444` | Advance deductions (−₹1,000), Galat Hai |
| `--rose-bright` | `color/text/disputed` | `#F87171` | Disputed pill text, deduction amounts |
| `--rule-hairline` | `color/border/subtle` | `rgba(255,255,255,0.08)` | Internal card dividers and table lines |
| `--rule-hairline-bright`| `color/border/bright` | `rgba(255,255,255,0.16)` | Navigation pill and active card borders |

### Spacing Ladder & Geometry

| Step | Value | Application |
| :--- | :--- | :--- |
| **`space-1`** | `4px` | Crimson spine width, indicator dot size |
| **`space-2`** | `8px` | Button padding, tag border radius |
| **`space-3`** | `12px` | Card corner radius, equation block gaps |
| **`space-4`** | `16px` | Slab outer radius, row padding |
| **`space-6`** | `24px` | Section margins, masthead padding |
| **`space-8`** | `32px` | Living slab internal margin, large buttons |
| **`space-12`**| `48px` | Mobile touch target minimum height |
| **`space-16`**| `64px` | Section margins, grid gutter |
| **`space-24`**| `96px` | Movement vertical offsets |

---

## 04. Typography Hierarchy & Text Styles

| Semantic Style | Font Family | Size / Line Height | Weight / Tracking | Case |
| :--- | :--- | :--- | :--- | :--- |
| **Display / Monumental XL** | Bebas Neue | 185px / 1.0 | Regular / -0.025em | Uppercase |
| **Numeric / Climax Hero** | Bebas Neue | 160px / 1.0 | Regular / Tabular | Numeric |
| **Heading / L** | Inter | 40px / 1.2 | 800 (Extrabold) / -0.02em | Normal |
| **Heading / M** | Inter | 24px / 1.3 | 700 (Bold) / -0.01em | Normal |
| **Hindi / Authentic Display** | Noto Sans Devanagari | 44px / 1.25 | 700 (Bold) | Normal |
| **Body / M** | Inter | 15px / 1.55 | 400 (Regular) | Normal |
| **Body / S** | Inter | 12px / 1.5 | 400 (Regular) | Normal |
| **Label / Metadata XS** | Inter | 10px / 1.0 | 800 (Extrabold) / +0.14em | Uppercase |
| **Devanagari Subtitle** | Noto Sans Devanagari | 16px / 1.4 | 700 (Bold) | Normal |

---

## 05. Auto Layout Recommendations

For designers wishing to enable Figma native Auto Layout on imported frames:

### 1. Navigation (`Landing / Navigation`)
- **Direction**: Horizontal (`row`)
- **Alignment**: Center
- **Padding**: Left 24px, Right 24px, Top 12px, Bottom 12px
- **Distribution**: Space between (`Auto`)
- **Children**: Brand Lockup (`Hug`), Center Telemetry (`Hug`), Controls (`Hug`)

### 2. Historical Ledger Rows (`Slab / Row 01 Confirmed`)
- **Direction**: Horizontal (`row`)
- **Alignment**: Baseline
- **Padding**: Left 32px, Right 32px, Top 16px, Bottom 16px
- **Distribution**: Fixed 4-column layout:
  - Date: Width 110px (`Fixed`)
  - Description: Width `Fill Container`
  - Amount: Width 130px, Text-align Right (`Fixed`)
  - Status: Width 100px, Text-align Right (`Fixed`)

### 3. Active Record Action Bar (`Slab / Review Bar`)
- **Desktop**: Horizontal (`row`), Left Prompt (`Fill Container`), Action Buttons (`Hug`)
- **Mobile**: Vertical (`column`), Spacing 14px, Action Buttons (`Fill Container`, Min Height 48px, Grid 1fr 1fr)

### 4. Hisaab Equation Strip (`Hisaab / Equation Strip`)
- **Desktop**: Horizontal (`row`), Spacing 24px, 3 Blocks (`Fixed 280px` or `Fill Container`), Operators centered.
- **Mobile**: Vertical (`column`), Spacing 12px, 3 Blocks (`Fill Container`).

---

## 06. Component Variants & States

### Component: `Confirmation Control`
- **Variant `Default`**:
  - `✓ Sahi Hai · सही है`: Fill `#059669`, Text `#FFFFFF`, Height 48px, Radius 8px.
  - `✕ Galat Hai · गलत है`: Fill `Transparent`, Border `1px rgba(255,255,255,0.2)`, Text `rgba(255,255,255,0.8)`.
- **Variant `Confirmed`**:
  - Container Fill `rgba(5, 150, 105, 0.15)`, Border `1px #059669`.
  - Icon `✓` in `#059669`, Text: "Confirmed: ₹500 added to shared balance".
- **Variant `Disputed`**:
  - Container Fill `rgba(239, 68, 68, 0.12)`, Border `1px #EF4444`.
  - Icon `✕` in `#EF4444`, Text: "Flagged for review · Kept off balance".

### Component: `Ledger Row`
- **Property `State`**: `Pending` | `Confirmed` | `Disputed`
- **Property `Type`**: `Work` | `Advance` | `Payment` | `Bonus`

---

## 07. Prototype Links & Interaction Cues

To wire the interactive prototype in Figma:
1. **Sahi Hai Tap**:
   - Source: `Button / Sahi Hai` in `Consensus-01-Review`
   - Interaction: `On Click` → `Navigate To` → `Consensus-02-Confirmed`
   - Animation: `Smart Animate`, `Ease Out`, `260ms`
   - Outcome: `#quarantinePill` turns from Amber to Emerald, balance text springs from `₹3,000` to `₹3,500`.
2. **Galat Hai Tap**:
   - Source: `Button / Galat Hai` in `Consensus-01-Review`
   - Interaction: `On Click` → `Navigate To` → `Consensus-03-Disputed`
   - Animation: `Smart Animate`, `Ease Out`, `260ms`
   - Outcome: Status flips to Rose `DISPUTED`, balance remains invariant at `₹3,000`.
3. **Scroll Progression**:
   - Source: `Hero / Scroll Cue` (`THE SHARED RECORD ↓`)
   - Interaction: `On Click` → `Scroll To` → `Hero / Living Slab`

---

## 08. Editability QA Verification

| Test Question | Verification Result | Location in Figma Files |
| :--- | :--- | :--- |
| **Can I edit the colossal "SEVAKHATA"?** | **YES** — Pure `<text>` layer, Bebas Neue. | `01_desktop_1440_figma.svg:L99` |
| **Can I edit Hindi copy directly?** | **YES** — Authentic Unicode text, Noto Sans Devanagari. | All artboards |
| **Can I edit "₹3,000" and "₹500"?** | **YES** — Isolated tabular text nodes. | Living Slab, Equation, Climax |
| **Can I switch PENDING → CONFIRMED?** | **YES** — Component variants in `04_components`. | `04_components_figma.svg` |
| **Can I edit the brand logo?** | **YES** — Structured vector paths, no rasters. | `Nav / Brand` in all files |
| **Are touch targets ≥ 48px on mobile?** | **YES** — Exact 48px height on all action buttons. | `03_mobile_390_figma.svg` |
| **Are layers semantically named?** | **YES** — Zero "Group 123" slop; full semantic IDs. | All files |

---
*Created by Antigravity IDE for SevaKhata Production Handoff.*
