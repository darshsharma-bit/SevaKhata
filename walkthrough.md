# Walkthrough: SevaKhata — Final Art-Directed Landing Page
## The Consensus Engine / Floating Interactive Record

---

## 1. Executive Summary

The SevaKhata landing page has been elevated from a prototype into a high-end, art-directed interactive product experience. 

Built around the core product thesis **"THE CONSENSUS ENGINE: Anatomy of a Mutual Record"** (*"Dono ka record, ek hi hisaab"* / *"Jo dono maane, wahi hisaab"*), this implementation resolves every visual defect identified in the screen recording analysis while strictly respecting the architectural, typographic, and motion disciplines of **Apple Design** and **Emil Kowalski Design Engineering**.

```
===================================================================================
                               SYSTEM NAVIGATION
 [Mark] SEVAKHATA   LIVE FOLIO 08 / SHARMA x SUNITA / AUG 2026 AUDIT   Open Ledger →
===================================================================================
 01 · ORIGIN        02 · QUARANTINE      III MUTUAL CONSENSUS   03 · REVIEW   04 · HISAAB
-----------------------------------------------------------------------------------

                              S E V A K H A T A
                         DONO KA RECORD • एक ही हिसाब
              The shared digital work-and-payment ledger. What both
                     acknowledge becomes the official truth.

                            THE LIVING LEDGER FOLIO ↓

                 +---------------------------------------------+
                 |  MUTUAL REGISTER NO. 42            AUG 2026 |
                 |  Sharma Household × Sunita Sharma   LIVE    |
                 |  दो फोन · एक साझा हिसाब · अगस्त 2026        |
                 |---------------------------------------------|
                 |  #   ENTRY DETAILS                AMOUNT   STATE  |
                 |  01  8 Full Days Housework        +₹4,000  LOCKED |
                 |  02  Emergency School Advance     -₹1,000  DEDUCT |
                 |---------------------------------------------|
                 |  03  TODAY · 13 AUGUST 2026                 |
                 |      Full Day Housework & Cooking +₹500    WEIGHT |
                 |      [ ✓ Sahi Hai · सही है ] [ ✕ Galat Hai ]|  ₹0  |
                 |---------------------------------------------|
                 |  OFFICIAL RUNNING BALANCE: ₹3,000  ✓ SEALED |
                 +---------------------------------------------+

 "Jo dono maane, wahi hisaab"       (Rotating Stamp)         Explore the Core Problem ↓
===================================================================================
```

---

## 2. Key Visual Defects Resolved

| Defect Identified | Previous Prototype Issue | Final Art-Directed Resolution |
| :--- | :--- | :--- |
| **01. Hero Occlusion** | `SEVAKHATA` wordmark was accidentally clipped by the top border of the slab via a negative margin. | **Staged Reveal Architecture**: State 0 allows monumental `SEVAKHATA` typography, circular crimson seal disk, and supporting thesis to breathe with full negative space. The slab sits in its resting position below the title, with `THE LIVING LEDGER FOLIO ↓` guiding the eye. On scroll, typography recedes into the architectural layer. |
| **02. Slab Grid Alignment** | Amounts, status tags, and headings floated inconsistently inside different div structures. | **Strict 4-Column Internal Grid**: Both `.folio-entry-row` and `.active-row-grid` enforce an identical `36px 1fr 120px 110px` column distribution, guaranteeing mathematical vertical alignment across dates, descriptions, amounts, and status tags. |
| **03. Typographic Lockup** | `RECORDED` was huge, `BY EMPLOYER` was tiny metadata, and `REVIEWED BY HELPER` had mismatched visual weight. | **Balanced Typographic Composition**: Rebuilt as two optically balanced columns with identical `Bebas Neue` sizing (`clamp(3rem, 6.5vw, 5.5rem)`), paired with matching uppercase subtitles (`BY EMPLOYER` / `BY HELPER`) and Devanagari subtitles. |
| **04. Two-Sided Memory** | Two static cards placed side-by-side with weak spatial tension. | **Dynamic Spatial Convergence**: Left (Employer Kitchen Calendar) and Right (Helper Doorway Advance) cards subtly shift toward the central tension wire and `VS` beacon as the user scrolls into Movement 02, illustrating two perspectives converging into the invariant. On mobile, cards stack sequentially. |
| **05. State Machine Morph** | Stepper cards felt like disconnected content swapping. | **Shared-Element Continuous Morph**: The single record object smoothly transitions its spine color, badge status, title, narrative, Hindi quote, amount, and weight across all 3 lifecycle stages (Logged $\rightarrow$ Review Prompt $\rightarrow$ Sealed Hisaab). |
| **06. Confirmation Chain** | Clicking "Sahi Hai" updated text instantaneously without causal sequencing. | **Causal Motion Sequence**: 1. Tactile button compression (`scale(0.96)`); 2. Active row shifts to emerald boundary; 3. Quarantine pill turns to `✓ CONFIRMED & SEALED`; 4. Weight badge updates to `WEIGHT: +₹500`; 5. Spring counter animates running balance from **₹3,000 $\rightarrow$ ₹3,500** across both the slab and the climax section. |

---

## 3. Files Implemented & Verified

| File | Path | Status & Highlights |
| :--- | :--- | :--- |
| **HTML Entry** | [index.html](./index.html) | Semantic 5-movement structure, staged hero containers (`hero-art-stage` + `hero-slab-stage`), 4-column gridded folio rows, dynamic memory spatial field, and balanced editorial lockup. |
| **Stylesheet** | [style.css](./style.css) | Complete design tokens, hairline coordinate grids, optical tracking adjustments (`letter-spacing: -0.03em` for display, `+0.14em` for telemetry), tablet/mobile responsive breakpoints, and `@media (prefers-reduced-motion)`. |
| **Motion Engine** | [main.js](./main.js) | Staged scroll choreography, causal direct-manipulation confirmation/dispute engine, dynamic two-sided parallax convergence, and continuous stepper morphing. |
| **Figma Master** | [design/sevakhata-landing-figma.svg](./design/sevakhata-landing-figma.svg) | Fully unlocked vector artboard updated with the balanced typographic lockup, gridded slab, and semantic layer groups. |
| **Brand Assets** | [assets/brand/sevakhata-mark.svg](./assets/brand/sevakhata-mark.svg)<br>[assets/brand/sevakhata-seal-stamp.svg](./assets/brand/sevakhata-seal-stamp.svg) | Pure SVG brand mark with red ledger spine & revolving mutual agreement seal stamp. |

---

## 4. Visual QA & Verification Evidence

All states and viewports were rendered and verified using headless Chrome:

1. **Desktop Master (1440×900 / 1440×6000)**:
   - Verified State 0: `SEVAKHATA` wordmark has zero visual obstruction; the crimson mutual seal disk and thesis statement breathe freely.
   - Verified Slab: strict alignment between column headers and data cells; amount column (`+₹4,000`, `−₹1,000`, `+₹500`) shares a single vertical right axis.
   - Verified `✓ Sahi Hai` interaction: clicking the button transitions the active row to confirmed state, updates the quarantine status to `✓ CONFIRMED & SEALED`, updates the weight badge to `WEIGHT: +₹500`, and triggers the spring counter animation from **₹3,000 $\rightarrow$ ₹3,500** across both the slab and the climax hisaab section.
   - Verified `✕ Galat Hai` interaction: contest action updates the quarantine badge to `⚠️ DISPUTED / QUARANTINED` and safely preserves the official hisaab at **₹3,000**.
   - Verified Two-Sided Memory: employer's kitchen wall calendar and helper's doorway advance cards sit on either side of the vertical tension line with the central `VS` beacon.
   - Verified Lockup: `RECORDED BY EMPLOYER` and `REVIEWED BY HELPER` display with identical scale and optical weight.
   - Verified Climax Hisaab: equation strip (`+₹4,000 − ₹1,000 = ₹3,000`) leads into the monumental numeral **₹3,000** with dual authenticated timestamps.
   - Verified Covenant & Footer: monumental Devanagari proverb (*"अगली पेसगी, रसीद के साथ। अगला महीना, बिना संकोच।"*), pill CTA button, and editorial brand footer.

2. **Mobile Master (390×844 / 390×7500)**:
   - Zero horizontal overflow (`overflow-x: hidden`).
   - Compact navigation pill displaying `SEVAKHATA` and `Open Ledger →`.
   - Responsive slab layout with minimum 48px touch targets for `✓ Sahi Hai` and `✕ Galat Hai`.
   - Two-sided memory transforms into a clean vertical stack.
   - Typographic lockup stacks with equal hierarchy and centered alignment.
   - Climax equation and monumental numerals scale smoothly with `clamp()`.

---

## 5. Compliance Verification

- [x] **No Generic SaaS Patterns**: No 3-card feature grids, no gradient blob backgrounds, no fake testimonials, no AI badges.
- [x] **Native Scrolling Preserved**: Zero scroll-jacking; 100% native smooth browser scrolling.
- [x] **Bilingual Parity**: Hindi (*Devanagari*) treated with identical design dignity and typography weight alongside English.
- [x] **Accessibility**: Meets WCAG 2.1 AA standards for color contrast, semantic landmark roles, screen reader labels, and `@media (prefers-reduced-motion)`.
