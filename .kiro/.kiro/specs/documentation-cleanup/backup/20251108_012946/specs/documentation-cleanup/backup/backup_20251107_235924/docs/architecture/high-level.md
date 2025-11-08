# What it is

A Canadian, multi-brand **diaper planner** that quietly keeps families stocked, predicts size changes, and routes orders through **my** hidden affiliate links. Three-icon bottom nav + one floating action button (FAB). Math stays hidden; power users can open **Advanced** in Settings.

# Navigation model

* Bottom nav: **⌂ Home** • **🗓 Planner** • **⚙︎ Settings**
* Center **FAB (⊕)** adapts by context: **Log** → **Reorder** → **Add child**

# First-run sequence (5–7 min)

1. Splash (brand + “Made in Canada”, PIPEDA) → 2) Value + Consent (affiliate disclosure; optional analytics) → 3) Sign in / Create → 4) Add Child wizard (Name/DOB → Size → Daily usage → On-hand) → 5) Notifications ask → 6) First recommendation (“X days left; reorder by {date}”).

# Everyday loop

Open app → see **Days of cover** and the **single next best action** → tap FAB to log or reorder → low-stock/size-window alerts → use **Planner** (time-lapse timeline) for upcoming actions; math only appears in **Advanced**.

# Key flows (end-to-end)

* **Log**: FAB → time chips (Now/1h/2h/Custom) + type (Wet/Soiled/Both) → Save → Days of cover updates.
* **Reorder**: Home card → brand list (normalized **\$/100ct**, ETA) → CTA “Get it at {Retailer}” → **server tokenization** → affiliate redirect (URL never exposed) → purchase.
* **Premium**: Triggered after visible win (saved \$, avoided stockout). Free = 1 child. Premium (\~\$7.99 CAD/mo, validate) = multi-child, caregiver seats, bulk optimizer, advanced forecasts, data export.
* **Caregiver**: Premium → share code → roles: Viewer / Logger / Purchaser.
* **Donation nudge**: When size switch is imminent and excess remains, offer partner drop-off.

# Defaults & formulas (kept invisible)

* **Age → diapers/day** (defaults):
  0–1 mo: 10 • 1–3 mo: 8 • 3–6 mo: 7–8 • 6–12 mo: 6–7
* **Days of Cover (DoC)** (integer): `DoC = floor(OnHand / DailyUse)`
* **Reorder point**: trigger when `DoC ≤ LeadTimeDays + SafetyBufferDays`
  Defaults: LeadTimeDays=2; SafetyBufferDays=2 (new parents) / 1 (experienced)
* **Safety stock** (internal only): `DailyUse × SafetyBufferDays`
* **Size-change forecast** (brand-aware): age + parent weight band + fit signals (leaks/red marks) + **brand size chart**. If weight in top \~20% of current band **or** ≥2 fit issues in 7 days → “size window” in \~2–3 weeks with staged plan (small box now → mix → full switch).
* **Multi-brand pricing**: normalize to **\$/100ct**; apply retailer promos / subscribe-and-save; store retailer SLA for ETA.
* **Full box chip**: pulled from brand/size catalog (e.g., Rascal+Friends Size 1 = 168 ct). Catalog drives counts everywhere.

# Tiers (simple)

* **Free**: 1 child, 3 brand comparisons, basic alerts, **Planner** timeline.
* **Premium**: Multi-child + caregiver seats; bulk optimizer; advanced size forecast; data export; priority support.

# Privacy & affiliate

* Consent upfront (purpose-based); Export/Delete in Settings.
* Affiliate disclosed at signup and in Settings; user never sees raw URLs. Checkout button is neutral (“Get it at Walmart/Amazon”).

---

## ASCII frameworks (core screens)

### Splash

```
┌─────────────────────────────────────────────┐
│                 NestSync                    │
│           Never run out again.              │
│      Made in Canada • PIPEDA-ready          │
│                [██████░ 80%]                │
└─────────────────────────────────────────────┘
```

### Value + Consent (with affiliate disclosure)

```
┌─────────────────────────────────────────────┐
│ Keep diapers coming, stress going down.     │
│ We use your inputs only to plan inventory.  │
│ [✓] Required: child + usage data            │
│ [ ] Optional: anonymous analytics           │
│ Note: Retail buttons may use affiliate links│
│       (no extra cost to you).               │
│ [Accept & Continue]                         │
└─────────────────────────────────────────────┘
```

### Sign in / Create

```
┌─────────────────────────────────────────────┐
│ Email  [________________________]           │
│ Pass   [••••••••]    (Apple / Google)       │
│ [Create account]            [Sign in]       │
└─────────────────────────────────────────────┘
```

### Add Child — Name & DOB

```
┌─────────────────────────────────────────────┐
│ Child name   [ Emma      ]                  │
│ Birth date   [ 2024-08-15 ]                 │
│ [Continue → Size]                           │
└─────────────────────────────────────────────┘
```

### Add Child — Size (brand-agnostic)

```
┌─────────────────────────────────────────────┐
│ What size right now?  [1] [2] [3] [4] [5]   │
│ Hint: most 8-month olds wear Size 4         │
│ Fit tips: no red marks; leg cuffs sealed.   │
│ [Continue → Usage]                          │
└─────────────────────────────────────────────┘
```

### Add Child — Daily usage

```
┌─────────────────────────────────────────────┐
│ Avg diapers/day?  [6] [8] [10] [12] (slider)│
│ Tip: newborn ~10/day; 6–12 mo ~6–7/day.     │
│ [Continue → On-hand]                        │
└─────────────────────────────────────────────┘
```

### Add Child — On-hand

```
┌─────────────────────────────────────────────┐
│ How many of current size at home?           │
│ Chips: [0] [10] [20] [Full box]             │
│ (Full box pulled from brand catalog)        │
│ Preview: ~2.9 days left • reorder by Fri    │
│ [Finish]                                    │
└─────────────────────────────────────────────┘
```

### ⌂ Home (status-first + FAB)

```
┌─────────────────────────────────────────────┐
│ Emma (8 mo) ▼                               │
│ ─────────────────────────────────────────   │
│  Days of cover:  3  (big number)            │
│  Next: Reorder by Fri  • Best: $21.40/100   │
│  Size tip: Size 5 likely in ~3 weeks        │
│                                             │
│                          ⊕ (floating +)     │
│                                             │
│ ⌂ Home                   🗓 Planner   ⚙︎ Settings │
└─────────────────────────────────────────────┘
```

### 🗓 Planner (vertical time-lapse timeline)

```
┌─────────────────────────────────────────────┐
│ Emma (8 mo) ▾     [All] [Emma] [Alex]       │
│ ─────────────────────────────────────────   │
│ FUTURE ↑                                     │
│ Fri 10:00   ⤴ Reorder reminder               │
│            Qty: 1 box (144) • ETA: Sun       │
│            Best: Walmart S&S • $21.40/100    │
│                                              │
│ +3 wks      ⇄ Size 5 transition window       │
│            Plan: Small box now → mix next    │
│            Donate if Size 4 excess > 40      │
│                                              │
│ +27 d       ★ Black Friday stock-up          │
│            3-month plan • est. save $67      │
│                                              │
│ ─── TODAY •────────────────────────────────── │
│ Today 08:15 ✔ Logged 1 change (auto-calc)    │
│ Today 07:00 ⚠ Low stock: 3 days cover        │
│            Action set for Fri (lead: 2d)     │
│                                              │
│ PAST ↓                                       │
│ Wed 18:40 ✔ Delivery received (84 pcs)       │
│ Tue 21:10 ✔ Night leak flag (2/7)            │
│                                              │
│ ⌂ Home                   🗓 Planner   ⚙︎ Settings │
└─────────────────────────────────────────────┘
```

**Card types & actions**

* **⤴ Reorder** — *Buy now* (tokenized) • *Snooze* • *Edit qty/retailer*
* **⇄ Size window** — *Start plan* • *Remind later* • *Mark not ready*
* **★ Seasonal stock-up** — *Preview basket* • *Mute season*
* **⚠ Low stock / 🆘 Emergency** — *Same-day* • *Nearby stores*
* **✔ Logged / Delivery** — read-only history (+ *Edit*)
* **🤝 Donation** — appears if size switch + excess

**Gestures**: Tap = bottom sheet; Swipe→done / Swipe←snooze; Long-press = quick edit.

### FAB → Quick Log

```
┌─────────────────────────────────────────────┐
│ Log change for Emma                         │
│ When: [Now] [1h] [2h] [Custom]              │
│ Type: [Wet] [Soiled] [Both] [Dry check]     │
│ [Save]                                      │
└─────────────────────────────────────────────┘
```

### Order (multi-brand, affiliate-safe)

```
┌─────────────────────────────────────────────┐
│ Choose brand & box                          │
│ ┌─────────────────────────────────────────┐ │
│ │ Pampers • Size 4 • 144 ct • $29.96 → $/100│
│ │ Walmart • ETA 2d • Subscribe −10%        │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ Rascal+Friends • Size 4 • 168 ct • $…   │
│ │ Walmart • ETA 2d                        │
│ └─────────────────────────────────────────┘ │
│ Qty: [Half] [Full] [Custom]                │
│ [Get it at Walmart]                        │  ← tokenized (URL hidden)
└─────────────────────────────────────────────┘
```

### Caregiver / Partner (premium)

```
┌─────────────────────────────────────────────┐
│ Add a caregiver to Emma                     │
│ Share code: 8K2-HM5                         │
│ Role: ( ) Viewer  (•) Logger  ( ) Purchaser │
│ [Send invite]                                │
└─────────────────────────────────────────────┘
```

### Settings (simple)

```
┌─────────────────────────────────────────────┐
│ Account • Children • Alerts • Brands/Retail │
│ Privacy (Export / Delete) • Subscription    │
│ Advanced (lead time, buffers, formulas)     │
└─────────────────────────────────────────────┘
```

### Emergency alert

```
┌─────────────────────────────────────────────┐
│ Emergency: ~6 hours left                    │
│ [Same-day delivery] [Nearby stores] [Adjust alerts] │
└─────────────────────────────────────────────┘
```

---

## Brand & catalog notes (implementation)

Maintain Canada-first catalog (Pampers, Huggies, Rascal+Friends, Hello Bello, Kirkland, Seventh Generation, store brands). For each brand/size: size band (kg/lb), typical box counts, variants, price sources, retailer SLA. Normalize comparisons to **\$/100ct** and always show **ETA** and **effective price after discounts**.

## Pricing hypothesis & upgrade cues

Premium at **\~\$7.99 CAD/mo** (validate with market tests). Upsell only after a win (saved \$, prevented stockout, right-time size switch).

## Copy principles

Calm, declarative, surface-simple. Round numbers (days, \$/100ct). Always present one **next best action**.

---

# Appendix — Advanced math & knobs (one page, for Settings ▸ Advanced)

**Toggles**

* “Show advanced cards in Planner” (off by default)
* “Use dynamic safety buffer” (on) • “New parent profile” (on)
* “Enable seasonal stock-up suggestions” (on) • “Donation nudges” (on)

**Inputs**

* **DailyUse** (int) • **OnHand** (int) • **LeadTimeDays** (default 2)
* **SafetyBufferDays** (default 2 new / 1 experienced)
* **TargetCoverDays** (default 14; Premium: per-child)
* **MinOrderMultiple** (brand box size; from catalog)

**Core formulas**

* `DoC = floor(OnHand / DailyUse)`
* `SafetyStock = DailyUse × SafetyBufferDays`
* **Reorder trigger**: `DoC ≤ LeadTimeDays + SafetyBufferDays`
* **Recommended qty (pcs)**:
  `Need = max(0, (TargetCoverDays × DailyUse) − OnHandAtETA)`
  `Recommended = ceil(Need / BoxCount) × BoxCount`
  where `OnHandAtETA = OnHand − (DailyUse × LeadTimeDays)`
* **Effective price**: `$/100 = round( (FinalPrice / Count) × 100, 2 )`
  `FinalPrice = BasePrice × (1 − Promo%) × (1 − S&S%) + Shipping − Coupon`

**Size window score** *(0–1)*
`Score = w1*AgeZ + w2*WeightBand + w3*FitIssues + w4*UsageTrend`
Default: `w1=.2, w2=.35, w3=.3, w4=.15`; trigger at `Score ≥ .70` for 3 consecutive days.
Planner plan: **Small box now → Mix next order → Full switch**, with **Donation nudge** if remaining old size > threshold (default 40 pcs).

**Seasonal optimizer (Premium)**

* Shows events inside horizon (e.g., Black Friday/Boxing Day).
* Checks storage guardrail (user-set volume or “Small/Med/Large” space).
* Suggests **multi-child bulk** if deliveries align within 3 days.

**Affiliate (server-side)**

* Button → `/out/{retailer}/{sku}?ctx={childId,brand,size}`
* Server attaches `?tag=YOURID&subId={userId}` etc., logs click-ID, then 302 to retailer.
* If tokenization fails: fallback open retailer domain (no tag) + toast.
