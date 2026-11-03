# SevaKhata (सेवाखाता)

> **"Dono ka record, ek hi hisaab."**  
> *Jo dono maane, wahi hisaab.*

SevaKhata is a bilingual (Hindi + English) shared digital ledger designed for domestic employment relationships (employers and domestic helpers). It establishes a single, mutually acknowledged source of truth for daily attendance, cash advances (*pesgi*), payments, and month-end settlement (*hisaab*).

---

## 1. Project Charter & Problem Statement

### Background
Domestic work in most Indian households is managed informally. Attendance, half-days, leaves, advances, payments, and monthly dues are tracked using paper notebooks, WhatsApp messages, wall calendars, or memory. Neither party has equal access to a synchronized, transparent record.

### Problem Definition
The root cause of friction is **one-sided record keeping**:
- The employer maintains a private log while the helper relies on memory or verbal agreements.
- At month-end, this asymmetry creates disputes regarding days worked, cash advances given, and the final due amount.
- Domestic helpers typically have no structured medium to confirm, query, or dispute entries as they occur.

### Relevance & Impact
SevaKhata replaces one-sided tracking with a **bilateral consensus model**:
1. An employer logs an entry (attendance, payment, advance).
2. The entry is created in a **Pending** state and quarantined (holding ₹0 financial weight).
3. The helper reviews the entry and selects **Confirm (`सही है`)** or **Dispute (`गलत है`)**.
4. **Only Confirmed entries update the official balance (*Hisaab*).** This makes the domestic helper an active participant rather than a passive subject.

---

## 2. Project Objectives & Core Workflow

### Primary Objectives
- **Bilingual Interface:** Hindi and English support tailored for users with varying digital literacy.
- **Attendance & Payments:** Record full days, half days, absences, salaries, cash advances (*pesgi*), bonuses, and deductions.
- **3-State Ledger Engine:** Distinct visual indicators and mathematical rules for **Pending**, **Confirmed**, and **Disputed** entries.
- **Helper Verification Loop:** Helpers directly review entries to confirm or dispute them.
- **Strict Balance Rule:** Official Hisaab calculated strictly from confirmed earnings minus confirmed deductions:
  $$\text{Confirmed Hisaab} = \sum \text{Confirmed Earnings} - \sum \text{Confirmed Advances/Payments}$$

### Proposed Website Workflow (10 Steps)
1. **Landing & Overview:** Users visit the landing page to understand the bilateral ledger concept.
2. **Role Experience:** User selects the Employer or Helper view.
3. **Record Entry:** Employer logs work attendance, advance, or payment event.
4. **Quarantine State:** Entry is initialized as `Pending` with zero effect on the balance.
5. **Notification & Review:** Helper accesses the shared ledger to inspect the pending entry.
6. **Bilateral Decision:** Helper selects `Confirm` or `Dispute`.
7. **Confirmed Record:** Confirmed entries update the official shared balance immediately.
8. **Disputed Record:** Disputed entries remain visible and quarantined until reconciled.
9. **Visual Distinction:** Color-coded badges (Green = Confirmed, Amber = Pending, Red = Disputed).
10. **Settlement:** Net month-end payable balance is finalized without discrepancies.

---

## 3. Current Implementation (Evaluation 2 Scope)

The project currently runs as a multi-page web application featuring:
- **6 Linked Pages:**
  - `index.html`: Landing page, problem overview, interactive verification demo.
  - `ledger.html`: Shared ledger with role switcher, filters, summary cards, and add-entry form.
  - `directory.html`: Verified worker directory with category filters and trust scores.
  - `register-worker.html`: Helper onboarding with real-time field validation.
  - `hire-household.html`: Employer booking requests and category browsing.
  - `contact-feedback.html`: Support tickets, dispute reporting, and feedback submissions.
- **Client & Server Validation:** Pure Vanilla JS validation (`js/validation.js`) running in browser and on the Node.js server.
- **Persistence Layer:** Node.js Express server (`server.js`) persisting submissions to `data/*.json`, with a seamless `localStorage` + `Export JSON` fallback if run statically.
- **Design & Figma:** 100% vector SVG artboards in `design/figma-svgs/` matching all pages and components.

---

## 4. How to Run the Project

### Option A: With Local Node.js Server (Recommended)
```bash
npm install
npm start          # Runs server.js on http://localhost:3000
```
- Open `http://localhost:3000`. Form submissions are saved directly to `data/*.json`.

### Option B: Offline / Static File
- Open `index.html` directly in any web browser.
- Submissions are saved to `localStorage`, and updated datasets can be downloaded using the **Export JSON** button on any page.

### Running Tests
```bash
npm test           # Runs scripts/smoke-test.js (validation, ledger math, API checks)
```

---

## 5. Main Project Files

```
sevakhata/
├── index.html                 # Landing page & consensus demonstration
├── ledger.html                # Shared digital khata & balance settlement
├── directory.html             # Verified domestic helper directory
├── register-worker.html       # Helper registration & format validation
├── hire-household.html        # Household hiring request form
├── contact-feedback.html      # Helpdesk, feedback & dispute tickets
│
├── style.css                  # Core design tokens, layout & typography
├── pages.css                  # Multi-page components & form styles
├── main.js                    # Landing page interactive ledger demo
│
├── js/
│   ├── validation.js          # Shared form validation rules (browser & server)
│   ├── records.js             # Ledger state machine & balance calculations
│   ├── store.js               # API client, localStorage fallback & JSON export
│   ├── ui.js                  # Modals, toasts, mobile navigation & form binder
│   ├── i18n.js                # Bilingual dictionary (English / Hindi toggle)
│   └── pages/                 # Page-specific frontend controllers
│
├── data/                      # Local JSON data stores
│   ├── ledger.json            # Attendance & payment transaction entries
│   ├── workers.json           # Helper profiles & trust scores
│   ├── bookings.json          # Household hiring requests
│   └── feedback.json          # Support tickets & feedback messages
│
├── server.js                  # Node.js + Express REST API saving to data/*.json
├── design/figma-svgs/         # Standalone editable Figma SVG artboards
└── scripts/smoke-test.js      # Zero-dependency test suite
```

---

## 6. Future Scope & Roadmap (Subsequent Evaluations)

Based on the project charter methodology, future phases include:

| Phase | Milestone | Scope & Deliverables |
| :--- | :--- | :--- |
| **Phase V** | **Backend & Database Migration** | • Replace flat JSON storage with MongoDB & Mongoose schemas (`Household`, `User`, `LedgerFolio`, `LedgerRecord`).<br>• Implement server-side rendering using Handlebars templates.<br>• Secure RESTful API endpoints with centralized error handling. |
| **Phase V** | **Authentication & Roles** | • Implement Mobile OTP authentication (SMS/WhatsApp).<br>• True role-based access control (RBAC) separating Employer and Helper sessions so neither can impersonate the other. |
| **Phase VI** | **Real-Time Notification Engine** | • Automated SMS / WhatsApp notifications sent to the helper when an entry is logged.<br>• Single-click verification links for helpers without smartphone app friction. |
| **Phase VI** | **Dispute Resolution & In-App Chat** | • Structured in-app communication thread on `Disputed` entries allowing employers to modify and resubmit values. |
| **Phase VI** | **Digital Payouts & Invoicing** | • Generate sealed, bilingual month-end PDF receipts.<br>• Direct UPI integration (GPay, PhonePe, Paytm) pre-filled with the exact confirmed balance. |

---

*SevaKhata — Designed for mutual trust and dignity in Indian households.*
