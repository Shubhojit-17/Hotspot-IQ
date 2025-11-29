# 🎨 Hotspot IQ — Design Specification Document

> **Version:** 1.0  
> **Last Updated:** November 29, 2025  
> **Status:** Source of Truth for Frontend Development

---

## Table of Contents

1. [Visual Identity & Philosophy](#1-visual-identity--philosophy)
2. [The Color System](#2-the-color-system)
3. [Component Architecture](#3-component-architecture)
4. [Data Visualization Guidelines](#4-data-visualization-guidelines)
5. [Typography & Motion](#5-typography--motion)
6. [Spacing & Grid System](#6-spacing--grid-system)
7. [Responsive Behavior](#7-responsive-behavior)
8. [Accessibility Guidelines](#8-accessibility-guidelines)

---

## 1. Visual Identity & Philosophy

### 1.1 The Aesthetic: "Cyber-Enterprise"

Hotspot IQ embodies a **"Cyber-Enterprise"** aesthetic—the sophisticated credibility of enterprise SaaS fused with the electric energy of cyberpunk interfaces. Think: *What if Mapbox Studio was redesigned by the UI team from Cyberpunk 2077?*

**Visual Anchors:**
| Inspiration | What We Take From It |
|-------------|---------------------|
| **Mapbox Studio** | Map-first layouts, floating control panels, dark canvas |
| **Vercel Dashboard** | Clean typography, subtle gradients, professional spacing |
| **Cyberpunk 2077** | Neon accents, scan-line effects, data-dense HUDs |
| **Bloomberg Terminal** | Information density, real-time updates, serious tone |

### 1.2 The Three Design Pillars

#### 🌑 Pillar 1: "Dark Mode as Default"

The interface is **permanently dark**. There is no light mode toggle—darkness is the product identity.

**Rationale:**
- Maps are the hero. Dark backgrounds make colorful map data pop.
- Reduces eye strain during extended analysis sessions.
- Conveys technical sophistication and premium positioning.
- Neon data points create instant visual hierarchy.

**Implementation:**
- The deepest background (`Canvas`) should feel like looking into space.
- All panels float above this void, creating depth through layering.
- Light elements (text, icons, data points) feel like they're *emitting* light, not reflecting it.

---

#### 🪟 Pillar 2: "Glassmorphism — The Map Never Hides"

All UI panels use **glassmorphism**—translucent surfaces with backdrop blur that allow the map to remain visible at all times.

**Rationale:**
- The map IS the product. Covering it with opaque panels defeats the purpose.
- Users maintain spatial context while reading data.
- Creates a sense of floating, futuristic HUD overlays.
- Reinforces the "intelligence layer on top of geography" metaphor.

**Implementation Rules:**
```
┌─────────────────────────────────────────────────────────────┐
│  GLASSMORPHISM RECIPE                                       │
├─────────────────────────────────────────────────────────────┤
│  Background:    rgba(15, 23, 42, 0.80)  /* Slate-900 @ 80% */
│  Backdrop Blur: blur(12px)                                  │
│  Border:        1px solid rgba(255, 255, 255, 0.08)         │
│  Border Radius: 16px (panels) / 12px (cards) / 8px (inputs)│
│  Shadow:        0 8px 32px rgba(0, 0, 0, 0.4)              │
└─────────────────────────────────────────────────────────────┘
```

**The Opacity Hierarchy:**
| Layer | Opacity | Use Case |
|-------|---------|----------|
| **Primary Panels** | 80% | Sidebar, Main Dashboard |
| **Secondary Cards** | 70% | Score cards, Stat blocks |
| **Tertiary Overlays** | 60% | Tooltips, Dropdowns |
| **Ghost Elements** | 40% | Disabled states, Placeholders |

---

#### ⚡ Pillar 3: "Reactive — The Interface Breathes"

The UI is **reactive**—it responds instantly to user input without waiting for explicit submissions.

**Rationale:**
- Location intelligence is exploratory. Users want to "play" with the map.
- Immediate feedback creates a sense of power and control.
- Reduces friction between thought and action.
- Makes the product feel alive and intelligent.

**Implementation Rules:**

| Interaction | Expected Behavior |
|-------------|-------------------|
| **Typing in Search** | Autocomplete appears after 2 characters, updates on every keystroke (debounced 300ms) |
| **Selecting Location** | Map flies to location, marker appears, analysis begins automatically |
| **Changing Filters** | Dashboard recalculates immediately, cards animate to new values |
| **Hovering Map Pins** | Tooltip fades in (150ms), pin scales up (1.2x) |
| **Adjusting Isochrone** | Polygon redraws in real-time as slider moves |

**The "No Submit Button" Rule:**
Wherever possible, eliminate explicit "Submit" or "Go" buttons. The interface should:
1. Detect user intent from input
2. Begin processing immediately
3. Show loading state inline
4. Resolve with animated result

*Exception: The main "Analyze Location" action retains a button for deliberate, high-stakes actions.*

---

## 2. The Color System

### 2.1 Philosophy: Semantic, Not Decorative

Colors in Hotspot IQ are **functional signals**, not aesthetic choices. Every color communicates meaning.

```
┌─────────────────────────────────────────────────────────────┐
│  "If a color doesn't mean something, it shouldn't exist."  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 The Semantic Palette

#### 🌌 CANVAS — The Void (Background Layer)

| Token | Hex | Tailwind | RGB |
|-------|-----|----------|-----|
| `--canvas-deep` | `#020617` | `slate-950` | `rgb(2, 6, 23)` |
| `--canvas-base` | `#0f172a` | `slate-900` | `rgb(15, 23, 42)` |

**When to Use:**
- `canvas-deep`: The absolute background. The map container. The void behind everything.
- `canvas-base`: Secondary backgrounds, input fields, code blocks.

**Never Use For:** Text, icons, or anything that needs to be "seen."

---

#### 🪟 SURFACE — The Glass Layers

| Token | Hex + Opacity | Tailwind | Usage |
|-------|---------------|----------|-------|
| `--surface-primary` | `#0f172a` @ 80% | `slate-900/80` | Main panels (Sidebar, Dashboard) |
| `--surface-secondary` | `#1e293b` @ 70% | `slate-800/70` | Cards within panels |
| `--surface-elevated` | `#334155` @ 60% | `slate-700/60` | Hover states, Active items |
| `--surface-border` | `#ffffff` @ 8% | `white/8` | All panel/card borders |

**When to Use:**
- Wrap all floating UI in `surface-primary`.
- Nest cards inside panels using `surface-secondary`.
- Use `surface-elevated` for interactive hover/focus states.

**The Golden Rule:** Surfaces are always semi-transparent. If you're reaching for an opaque color, you're doing it wrong.

---

#### 💚 PRIMARY — The Neon Emerald (Action & Success)

| Token | Hex | Tailwind | RGB |
|-------|-----|----------|-----|
| `--primary-glow` | `#10b981` | `emerald-500` | `rgb(16, 185, 129)` |
| `--primary-bright` | `#34d399` | `emerald-400` | `rgb(52, 211, 153)` |
| `--primary-soft` | `#10b981` @ 20% | `emerald-500/20` | Backgrounds, Fills |
| `--primary-pulse` | `#10b981` @ 50% | `emerald-500/50` | Glows, Shadows |

**When to Use:**
- **Primary CTA buttons:** "Analyze Location", "Get Insights"
- **Positive scores:** Opportunity Score ≥ 70
- **Success states:** "Location Added", "Analysis Complete"
- **Active navigation:** Selected menu items
- **Data highlights:** Important numbers, charts ascending

**Glow Effect Recipe:**
```css
.primary-glow {
  box-shadow: 
    0 0 20px rgba(16, 185, 129, 0.4),
    0 0 40px rgba(16, 185, 129, 0.2),
    0 0 60px rgba(16, 185, 129, 0.1);
}
```

---

#### 💛 WARNING — The Amber Signal (Caution)

| Token | Hex | Tailwind | RGB |
|-------|-----|----------|-----|
| `--warning-glow` | `#f59e0b` | `amber-500` | `rgb(245, 158, 11)` |
| `--warning-soft` | `#f59e0b` @ 20% | `amber-500/20` | Backgrounds |

**When to Use:**
- **Medium scores:** Opportunity Score 40-69
- **Caution alerts:** "Moderate competition detected"
- **Pending states:** "Calculating...", "Loading data"
- **Attention flags:** Items that need review

---

#### ❤️ DESTRUCTIVE — The Neon Rose (Danger & Errors)

| Token | Hex | Tailwind | RGB |
|-------|-----|----------|-----|
| `--destructive-glow` | `#f43f5e` | `rose-500` | `rgb(244, 63, 94)` |
| `--destructive-bright` | `#fb7185` | `rose-400` | `rgb(251, 113, 133)` |
| `--destructive-soft` | `#f43f5e` @ 20% | `rose-500/20` | Backgrounds |

**When to Use:**
- **Low scores:** Opportunity Score < 40
- **Saturation warnings:** "High competitor density!"
- **Error states:** API failures, Invalid inputs
- **Negative trends:** Charts descending, Bad metrics
- **Destructive actions:** "Remove location", "Clear all"

---

#### ⚪ TEXT — The Light Spectrum

| Token | Hex | Tailwind | Opacity | Usage |
|-------|-----|----------|---------|-------|
| `--text-primary` | `#f8fafc` | `slate-50` | 100% | Headlines, Key data, CTAs |
| `--text-secondary` | `#cbd5e1` | `slate-300` | 85% | Body text, Descriptions |
| `--text-tertiary` | `#64748b` | `slate-500` | 60% | Metadata, Timestamps, Labels |
| `--text-disabled` | `#475569` | `slate-600` | 40% | Disabled inputs, Placeholders |

**Hierarchy Rules:**
1. Only ONE piece of information per screen should use `text-primary` (usually the score or key metric).
2. Supporting information uses `text-secondary`.
3. Metadata (dates, IDs, labels) uses `text-tertiary`.
4. Never use pure white (`#ffffff`)—it's too harsh on dark backgrounds.

---

#### 🔵 ACCENT — The Cyan Highlight (Information)

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| `--accent-cyan` | `#06b6d4` | `cyan-500` | Links, Info icons, Neutral highlights |
| `--accent-violet` | `#8b5cf6` | `violet-500` | AI/Chat features, Special badges |

**When to Use:**
- `accent-cyan`: Hyperlinks, informational tooltips, neutral data points.
- `accent-violet`: AI-generated content, "Ask Hotspot" chat, premium features.

---

### 2.3 Color Application Matrix

| Element | Background | Border | Text | Icon |
|---------|------------|--------|------|------|
| **Panel** | `surface-primary` | `surface-border` | — | — |
| **Card** | `surface-secondary` | `surface-border` | — | — |
| **Primary Button** | `primary-glow` | `primary-bright` | `canvas-deep` | `canvas-deep` |
| **Ghost Button** | `transparent` | `surface-border` | `text-secondary` | `text-tertiary` |
| **Input Field** | `canvas-base` | `surface-border` | `text-primary` | `text-tertiary` |
| **Input Focused** | `canvas-base` | `primary-glow` | `text-primary` | `primary-glow` |
| **Score High** | `primary-soft` | `primary-glow` | `primary-bright` | — |
| **Score Medium** | `warning-soft` | `warning-glow` | `warning-glow` | — |
| **Score Low** | `destructive-soft` | `destructive-glow` | `destructive-bright` | — |

---

## 3. Component Architecture

### 3.1 The Layered Interface Model

Hotspot IQ uses a **Z-axis layered architecture**. Think of the interface as stacked transparent sheets of glass:

```
┌─────────────────────────────────────────────────────────────┐
│  Z-INDEX STACK (Bottom to Top)                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  z-50  ┌─────────┐  MODAL LAYER (Dialogs, Alerts)          │
│        └─────────┘                                          │
│                                                             │
│  z-40  ┌─────────┐  CHAT WIDGET (Floating FAB)             │
│        └─────────┘                                          │
│                                                             │
│  z-30  ┌─────────────────────────────────┐                 │
│        │      DATA HUD (Score Cards)      │                 │
│        └─────────────────────────────────┘                 │
│                                                             │
│  z-20  ┌───────┐                                           │
│        │CONTROL│  CONTROL DECK (Sidebar)                   │
│        │ DECK  │                                           │
│        └───────┘                                           │
│                                                             │
│  z-10  ┌─────────────────────────────────────────────────┐ │
│        │              MAP OVERLAYS                        │ │
│        │    (Markers, Isochrones, Heatmaps)              │ │
│        └─────────────────────────────────────────────────┘ │
│                                                             │
│  z-0   ╔═════════════════════════════════════════════════╗ │
│        ║                                                 ║ │
│        ║              THE MAP CANVAS                     ║ │
│        ║           (100% width × 100% height)            ║ │
│        ║                                                 ║ │
│        ╚═════════════════════════════════════════════════╝ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 3.2 The Map Canvas (`z-0`)

**Role:** The foundational layer. The reason users come to Hotspot IQ.

**Specifications:**
| Property | Value | Rationale |
|----------|-------|-----------|
| **Position** | `fixed`, `inset-0` | Covers entire viewport |
| **Dimensions** | `100vw × 100vh` | Edge to edge |
| **Tile Style** | Dark/Monochrome | Reduces visual noise |
| **Default Center** | `12.9716, 77.5946` (Bangalore) | Indian market focus |
| **Default Zoom** | `13` | Neighborhood level |
| **Interaction** | Pan, Zoom, Click-to-select | Always interactive |

**Map Style Guidelines:**
- Use a **dark basemap** (Mapbox Dark, CartoDB Dark Matter, or custom).
- Desaturate colors so data overlays pop.
- Road labels should be `text-tertiary` color.
- Water bodies should be `canvas-deep` (near black).
- Parks/green spaces should be a muted dark teal.

**The Map is Never Blocked:**
- No panel should exceed 400px width.
- No panel should exceed 70% viewport height.
- Users must always be able to see at least 50% of the map.

---

### 3.3 The Control Deck (`z-20`) — Left Sidebar

**Role:** The command center. Where users input their intent.

**Position:** Fixed left, vertically centered.

```
┌────────────────────────────────────────┐
│  CONTROL DECK ANATOMY                  │
├────────────────────────────────────────┤
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  🎯 HOTSPOT IQ                   │  │  ← Logo/Brand
│  │     Location Intelligence        │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  STEP 1: What are you opening?  │  │  ← Section Label
│  │  ┌────────────────────────────┐  │  │
│  │  │ ☕ Cafe / Coffee Shop    ▼ │  │  │  ← Business Type Dropdown
│  │  └────────────────────────────┘  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  STEP 2: What do you need nearby?│  │  ← Section Label
│  │  ┌──────┐ ┌───────┐ ┌────────┐  │  │
│  │  │🚇 Metro│ │🏫 School│ │🎓 College│  │  │  ← Filter Chips
│  │  └──────┘ └───────┘ └────────┘  │  │    (Multi-select)
│  │  ┌──────┐ ┌───────┐ ┌────────┐  │  │
│  │  │🏥 Hosp│ │🏬 Mall │ │🏢 Office│  │  │
│  │  └──────┘ └───────┘ └────────┘  │  │
│  │  ┌──────┐ ┌───────┐ ┌────────┐  │  │
│  │  │🏦 ATM │ │🍺 Bar  │ │🛕 Temple│  │  │
│  │  └──────┘ └───────┘ └────────┘  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  STEP 3: Where do you want to open?│ │  ← Section Label
│  │  🔍 Search Location...           │  │  ← Autocomplete Input
│  │  ┌────────────────────────────┐  │  │
│  │  │ Indiranagar, Bangalore     │  │  │  ← Suggestion Item
│  │  │ Indira Nagar Metro Station │  │  │
│  │  │ Indirapuram, Ghaziabad     │  │  │
│  │  └────────────────────────────┘  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  ⬢ ANALYZE LOCATION              │  │  ← Primary CTA (Glowing)
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  📍 Digipin: J7Q4-M2X9          │  │  ← Location ID (Copyable)
│  └──────────────────────────────────┘  │
│                                        │
└────────────────────────────────────────┘
```

**Specifications:**
| Property | Value |
|----------|-------|
| **Width** | `360px` (desktop), `100%` (mobile drawer) |
| **Height** | Auto, max `calc(100vh - 48px)` |
| **Position** | `fixed`, `left: 24px`, `top: 50%`, `transform: translateY(-50%)` |
| **Background** | `surface-primary` (glassmorphism) |
| **Border Radius** | `16px` |
| **Padding** | `24px` |
| **Gap** | `16px` between sections |

**Interaction States:**
- Panel can be collapsed to icon-only mode (hamburger toggle).
- On mobile, becomes a bottom drawer (swipe up to expand).

---

### 3.3.1 User Input Components (Control Deck Details)

The Control Deck follows a **strict sequential flow**. Users must complete each step before proceeding.

#### Component A: Business Type Selector

**Purpose:** Determines what category of business the user is opening. This selection defines which POIs are treated as **competitors**.

```
┌─────────────────────────────────────────────────────────────┐
│  BUSINESS TYPE DROPDOWN                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CLOSED STATE:                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🏪 What are you opening?                           │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │  ☕ Cafe / Coffee Shop                   ▼  │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  OPEN STATE (Dropdown Expanded):                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  │  ☕ Cafe / Coffee Shop              ✓  │ ← Selected │
│  │  │  🍽️ Restaurant / Fast Food             │           │
│  │  │  🛒 Retail Store                       │           │
│  │  │  💪 Gym / Fitness Center               │           │
│  │  │  💊 Pharmacy / Medical                 │           │
│  │  │  💇 Salon / Spa                        │           │
│  │  │  📱 Electronics Store                  │           │
│  │  │  👕 Clothing / Fashion                 │           │
│  │  │  📚 Bookstore / Stationery             │           │
│  │  │  🏢 Other (Custom)...                  │           │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Specifications:**
| Property | Value |
|----------|-------|
| **Height** | `48px` (closed), auto (open) |
| **Background** | `canvas-base` |
| **Border** | `1px solid surface-border` |
| **Border (Focus)** | `1px solid primary-glow` + glow shadow |
| **Border Radius** | `8px` |
| **Icon Size** | `20px` (emoji/icon) |
| **Font** | `text-body`, `text-primary` |
| **Dropdown Shadow** | `0 8px 24px rgba(0,0,0,0.4)` |

**States:**
| State | Visual Treatment |
|-------|------------------|
| **Empty/Placeholder** | "Select business type..." in `text-tertiary` |
| **Hover** | Background lightens to `surface-secondary` |
| **Open** | Border glows `primary-glow`, dropdown appears |
| **Selected** | Shows icon + business name, checkmark in dropdown |
| **Error** | Red border, "Please select a business type" below |

**Competitor Mapping (Data Logic):**
```
Business Type          → Competitor POI Categories
─────────────────────────────────────────────────────
☕ Cafe / Coffee Shop  → cafe, coffee_shop, bakery, tea_house
🍽️ Restaurant         → restaurant, fast_food, food_court, dhaba
🛒 Retail Store        → supermarket, convenience_store, grocery
💪 Gym / Fitness       → gym, fitness_center, yoga_studio, sports_club
💊 Pharmacy            → pharmacy, medical_store, clinic
💇 Salon / Spa         → salon, spa, beauty_parlor, barbershop
📱 Electronics         → electronics_store, mobile_shop, computer_store
👕 Clothing            → clothing_store, boutique, fashion_store
📚 Bookstore           → bookstore, stationery_shop, library
🏢 Other               → User enters custom POI category
```

---

#### Component B: Proximity Preference Filters

**Purpose:** User selects what landmarks/amenities they want **nearby**. These add bonus points to the Opportunity Score and filter the map display.

```
┌─────────────────────────────────────────────────────────────┐
│  PROXIMITY FILTER CHIPS                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Section Label: "What do you want nearby?" (text-secondary) │
│                                                             │
│  CHIP GRID (3 columns, wrapping):                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │ 🚇 Metro    │ │ 🏫 School   │ │ 🎓 College  │   │   │
│  │  │   [Active]  │ │  [Inactive] │ │  [Active]   │   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  │                                                     │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │ 🏥 Hospital │ │ 🏬 Mall     │ │ 🏢 Office   │   │   │
│  │  │  [Inactive] │ │  [Inactive] │ │  [Active]   │   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  │                                                     │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │ 🏠 Resident │ │ 🛕 Temple   │ │ 🌳 Park     │   │   │
│  │  │  [Inactive] │ │  [Inactive] │ │  [Inactive] │   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  │                                                     │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │ 🏦 ATM/Bank │ │ 🍺 Bar/Pub  │ │ 🚌 Bus Stop │   │   │
│  │  │  [Inactive] │ │  [Inactive] │ │  [Inactive] │   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  │                                                     │   │
│  │  ┌────────────────────┐ ┌────────────────────┐     │   │
│  │  │ ✨ Select Popular  │ │ ✕ Clear All       │     │   │
│  │  └────────────────────┘ └────────────────────┘     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Available Filter Options:**
| Filter | Icon | POI Category | Score Bonus |
|--------|------|--------------|-------------|
| Metro Station | 🚇 | `metro_station` | +15 |
| Bus Stop | 🚌 | `bus_stop` | +5 |
| School | 🏫 | `school` | +10 |
| College/University | 🎓 | `college`, `university` | +12 |
| Hospital | 🏥 | `hospital`, `clinic` | +8 |
| Mall/Shopping | 🏬 | `mall`, `shopping_center` | +15 |
| Office/IT Park | 🏢 | `office`, `it_park`, `business_center` | +12 |
| Residential Area | 🏠 | `residential`, `apartment_complex` | +8 |
| Temple/Religious | 🛕 | `temple`, `mosque`, `church`, `gurudwara` | +6 |
| Park/Recreation | 🌳 | `park`, `playground`, `garden` | +5 |
| ATM/Bank | 🏦 | `atm`, `bank` | +4 |
| Bar/Pub | 🍺 | `bar`, `pub`, `nightclub` | +7 |

**Chip Specifications:**
| Property | Inactive State | Active State |
|----------|----------------|--------------|
| **Background** | `transparent` | `primary-soft` |
| **Border** | `1px solid surface-border` | `1px solid primary-glow` |
| **Text Color** | `text-tertiary` | `text-primary` |
| **Icon Opacity** | 60% | 100% |
| **Shadow** | None | `0 0 12px primary-pulse` |
| **Padding** | `8px 12px` | `8px 12px` |
| **Border Radius** | `20px` (pill shape) | `20px` |
| **Transition** | `all 200ms ease-out` | — |

**Interaction:**
- Click to toggle (multi-select allowed)
- Active chips glow with neon green
- "Select Popular" pre-selects: Metro, College, Office, Mall
- "Clear All" deselects all chips

---

#### Component C: Location Search (Autocomplete)

Appears **after** Business Type and Filters. See main Search specification above.

---

#### Input Flow Validation

The Control Deck enforces a **progressive disclosure** pattern:

```
┌─────────────────────────────────────────────────────────────┐
│  VALIDATION STATES                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  STATE 1: Initial (Nothing Selected)                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Step 1: Business Type    [ Select... ▼ ]  ⚠️       │   │
│  │  Step 2: Nearby Filters   [  Disabled/Dimmed  ]     │   │
│  │  Step 3: Search Location  [  Disabled/Dimmed  ]     │   │
│  │  [ ANALYZE LOCATION ]     [  Disabled/Grey   ]      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  STATE 2: Business Type Selected                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Step 1: Business Type    [ ☕ Cafe    ▼ ]  ✅       │   │
│  │  Step 2: Nearby Filters   [  Now Active!    ]  ✨   │   │
│  │  Step 3: Search Location  [  Disabled/Dimmed  ]     │   │
│  │  [ ANALYZE LOCATION ]     [  Disabled/Grey   ]      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  STATE 3: Filters Selected (Optional)                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Step 1: Business Type    [ ☕ Cafe    ▼ ]  ✅       │   │
│  │  Step 2: Nearby Filters   [ 🚇 🎓 🏢 selected ] ✅  │   │
│  │  Step 3: Search Location  [  Now Active!    ]  ✨   │   │
│  │  [ ANALYZE LOCATION ]     [  Disabled/Grey   ]      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  STATE 4: Location Selected (Ready!)                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Step 1: Business Type    [ ☕ Cafe    ▼ ]  ✅       │   │
│  │  Step 2: Nearby Filters   [ 🚇 🎓 🏢 selected ] ✅  │   │
│  │  Step 3: Search Location  [ Indiranagar... ] ✅     │   │
│  │  [ ⬢ ANALYZE LOCATION ]   [  GLOWING GREEN  ]  🚀  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Note:** Step 2 (Filters) is technically **optional** — users can skip to Step 3. However, the UI encourages selection by highlighting the section.

---

### 3.4 The Data HUD (`z-30`) — Dashboard Cards

**Role:** Display analysis results. The "payoff" after searching.

**Position:** Fixed right side, stacked vertically or in a grid.

```
┌─────────────────────────────────────────────────────────────┐
│  DATA HUD LAYOUT                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                              ┌─────────────────────────────┐│
│                              │  OPPORTUNITY SCORE          ││
│                              │         ┌─────┐             ││
│                              │         │ 78  │             ││
│                              │         └─────┘             ││
│                              │     🟢 Prime Location       ││
│                              └─────────────────────────────┘│
│                                                             │
│                              ┌──────────┐ ┌──────────┐     │
│                              │COMPETITORS│ │LANDMARKS │     │
│                              │    12     │ │    8     │     │
│                              │  nearby   │ │  nearby  │     │
│                              └──────────┘ └──────────┘     │
│                                                             │
│                              ┌─────────────────────────────┐│
│                              │  FOOTFALL ANALYSIS          ││
│                              │  ████████████░░░░  HIGH     ││
│                              │  Peak: 6-9 PM weekdays      ││
│                              └─────────────────────────────┘│
│                                                             │
│                              ┌─────────────────────────────┐│
│                              │  🔮 GROWTH RADAR            ││
│                              │  "New Metro line by 2026"   ││
│                              │  Impact: +15% footfall      ││
│                              └─────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Specifications:**
| Property | Value |
|----------|-------|
| **Width** | `320px` per card |
| **Position** | `fixed`, `right: 24px`, `top: 24px` |
| **Layout** | Vertical stack with `12px` gap |
| **Background** | `surface-secondary` (glassmorphism) |
| **Border Radius** | `12px` |
| **Padding** | `20px` |
| **Max Height** | Each card max `300px`, scrollable if overflow |

**Card States:**
| State | Visual Treatment |
|-------|------------------|
| **Loading** | Skeleton pulse animation, no content |
| **Empty** | Ghost icon + "Select a location" message |
| **Populated** | Full data display |
| **Error** | Red border, error icon, retry button |

**Animation on Appear:**
- Cards slide in from right (`translateX: 100px → 0`).
- Staggered delay: Card 1 at `0ms`, Card 2 at `100ms`, Card 3 at `200ms`.
- Duration: `400ms`, Easing: `ease-out`.

---

### 3.5 The Chat Widget (`z-40`) — AI Assistant

**Role:** Natural language interface to Hotspot IQ's intelligence.

**Position:** Floating Action Button (FAB) in bottom-right corner.

```
┌─────────────────────────────────────────────────────────────┐
│  CHAT WIDGET STATES                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  STATE 1: COLLAPSED (FAB Only)                             │
│                                                             │
│                                          ┌───────┐         │
│                                          │  💬   │         │
│                                          │ Ask   │         │
│                                          └───────┘         │
│                                                             │
│  STATE 2: EXPANDED (Chat Panel)                            │
│                                                             │
│                              ┌─────────────────────────────┐│
│                              │ 💬 Ask Hotspot         ✕   ││
│                              ├─────────────────────────────┤│
│                              │                             ││
│                              │ 🤖 Hi! I'm your location   ││
│                              │    intelligence assistant.  ││
│                              │                             ││
│                              │ 👤 Is this good for a gym? ││
│                              │                             ││
│                              │ 🤖 Based on the data, this ││
│                              │    location shows strong    ││
│                              │    potential. There are 3   ││
│                              │    offices within 1km...    ││
│                              │                             ││
│                              ├─────────────────────────────┤│
│                              │ Type a question...     ➤   ││
│                              └─────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**FAB Specifications:**
| Property | Value |
|----------|-------|
| **Size** | `56px × 56px` |
| **Position** | `fixed`, `right: 24px`, `bottom: 24px` |
| **Background** | `accent-violet` (AI = Purple) |
| **Border Radius** | `50%` (circular) |
| **Shadow** | Violet glow effect |
| **Icon** | Chat bubble or sparkle ✨ |

**Expanded Panel Specifications:**
| Property | Value |
|----------|-------|
| **Width** | `380px` |
| **Height** | `500px` max |
| **Position** | `fixed`, `right: 24px`, `bottom: 96px` |
| **Background** | `surface-primary` |
| **Border Radius** | `16px` |

**Message Bubbles:**
| Sender | Background | Alignment | Border Radius |
|--------|------------|-----------|---------------|
| **User** | `primary-soft` | Right | `12px 12px 4px 12px` |
| **AI** | `surface-elevated` | Left | `12px 12px 12px 4px` |

**Suggested Questions (Chips):**
Display above input when chat is empty:
- "Is this good for a [business_type]?"
- "What's the competition like here?"
- "Show me the best spots nearby"

---

## 4. Data Visualization Guidelines

### 4.1 The Opportunity Score Ring

**Purpose:** The hero metric. The single number users remember.

```
┌─────────────────────────────────────────────────────────────┐
│  SCORE RING ANATOMY                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    ┌─────────────────┐                     │
│                    │    ╭───────╮    │                     │
│                    │   ╱ ╲     ╱ ╲   │  ← Progress Arc     │
│                    │  │   ╲   ╱   │  │    (Colored by      │
│                    │  │    ╲ ╱    │  │     score range)    │
│                    │  │     78    │  │  ← Score Number     │
│                    │  │   /100    │  │    (Large, Bold)    │
│                    │   ╲ ╱     ╲ ╱   │                     │
│                    │    ╰───────╯    │  ← Background Track │
│                    │                 │    (surface-border) │
│                    │  🟢 PRIME       │  ← Status Label     │
│                    │   LOCATION      │                     │
│                    └─────────────────┘                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Visual Specifications:**
| Property | Value |
|----------|-------|
| **Diameter** | `160px` |
| **Stroke Width** | `12px` |
| **Track Color** | `surface-border` |
| **Progress Color** | Dynamic (see below) |
| **Score Font Size** | `48px` |
| **Score Font Weight** | `700` (Bold) |
| **Label Font Size** | `14px` |
| **Label Font Weight** | `600` (Semi-bold) |

**Color by Score Range:**
| Score | Arc Color | Label | Glow |
|-------|-----------|-------|------|
| **70-100** | `primary-glow` | "PRIME LOCATION" | Green glow |
| **40-69** | `warning-glow` | "MODERATE POTENTIAL" | Amber glow |
| **0-39** | `destructive-glow` | "HIGH RISK" | Red glow |

**Animation:**
- On load: Arc animates from 0% to final value.
- Duration: `1200ms`
- Easing: `ease-out`
- Number counts up from 0 to final score.

---

### 4.2 Isochrone Rendering

**Purpose:** Show "What can I reach in X minutes?" as a polygon overlay.

```
┌─────────────────────────────────────────────────────────────┐
│  ISOCHRONE VISUAL STYLE                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    ╭──────────────────╮                    │
│                 ╭──╯                  ╰──╮                 │
│              ╭──╯    ┌─────┐            ╰──╮              │
│            ╭─╯       │  📍 │               ╰─╮            │
│           ╱          │ YOU │                  ╲           │
│          ╱           └─────┘                   ╲          │
│         │      (15-min bike radius)             │         │
│          ╲                                     ╱          │
│           ╲                                   ╱           │
│            ╰─╮                             ╭─╯            │
│              ╰──╮                       ╭──╯              │
│                 ╰──╮               ╭──╯                  │
│                    ╰───────────────╯                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Polygon Specifications:**
| Property | Value |
|----------|-------|
| **Fill Color** | `primary-glow` @ 15% opacity |
| **Stroke Color** | `primary-glow` @ 80% opacity |
| **Stroke Width** | `2px` |
| **Stroke Style** | Solid (not dashed) |

**Multiple Isochrones (Time Comparison):**
When showing multiple time ranges (5, 10, 15 mins):

| Time | Fill Opacity | Stroke Opacity |
|------|--------------|----------------|
| **5 min** | 25% | 100% |
| **10 min** | 15% | 70% |
| **15 min** | 10% | 50% |

**Animation:**
- On draw: Polygon fades in (`opacity: 0 → 1`).
- Duration: `600ms`
- When changing time: Morphs smoothly to new shape (if library supports).

---

### 4.3 Map Markers & Pins

**Purpose:** Represent locations, competitors, landmarks on the map.

**Marker Types:**

| Type | Shape | Size | Color | Icon |
|------|-------|------|-------|------|
| **Selected Location** | Circle with pulse | `24px` | `primary-glow` | None (solid dot) |
| **Competitor** | Circle | `16px` | `destructive-glow` | Business icon |
| **Landmark (Positive)** | Circle | `14px` | `primary-soft` | Category icon |
| **Landmark (Neutral)** | Circle | `12px` | `text-tertiary` | Category icon |
| **Warehouse** | Square | `20px` | `accent-cyan` | 📦 |

**Selected Location Marker:**
```
┌─────────────────────────────────────────────────────────────┐
│  PULSE ANIMATION                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│              ╭─────────╮                                   │
│            ╱             ╲    ← Outer pulse ring           │
│           │   ╭─────╮     │     (expanding, fading)        │
│           │   │  ●  │     │   ← Inner solid dot            │
│           │   ╰─────╯     │                                │
│            ╲             ╱                                  │
│              ╰─────────╯                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- Inner dot: `12px`, solid `primary-glow`.
- Outer ring: Expands from `12px` to `36px`, fades from 50% to 0% opacity.
- Animation: Infinite loop, `2s` duration.

---

### 4.4 Heatmap Overlay

**Purpose:** Show opportunity density across an area.

**Color Gradient:**
```
Low Opportunity                              High Opportunity
     ├────────────────────────────────────────────┤
     🔴 ──── 🟠 ──── 🟡 ──── 🟢 ──── 💚
     
     destructive → warning → amber → primary → primary-bright
```

**Specifications:**
| Property | Value |
|----------|-------|
| **Opacity** | 40-60% (must see map beneath) |
| **Blur** | Soft edges, no hard boundaries |
| **Radius** | Based on data density |
| **Update** | Real-time as user pans |

---

### 4.5 Charts (Recharts)

**Bar Chart (Competitor Breakdown):**
| Property | Value |
|----------|-------|
| **Bar Color** | `destructive-glow` (competitors are threats) |
| **Background** | `transparent` |
| **Grid Lines** | `surface-border` @ 50% |
| **Axis Labels** | `text-tertiary` |
| **Bar Radius** | `4px` top corners |

**Radar Chart (Landmark Categories):**
| Property | Value |
|----------|-------|
| **Fill** | `primary-soft` |
| **Stroke** | `primary-glow` |
| **Grid** | `surface-border` |
| **Dots** | `primary-bright`, `6px` |

**Line Chart (Trends):**
| Property | Value |
|----------|-------|
| **Line Color** | `primary-glow` |
| **Line Width** | `2px` |
| **Area Fill** | Gradient from `primary-soft` to `transparent` |
| **Dots** | Show only on hover |

---

## 5. Typography & Motion

### 5.1 Font Stack

**Primary Font: Inter**
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Monospace Font: JetBrains Mono** (for data, codes, Digipin)
```css
font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
```

### 5.2 Type Scale

| Token | Size | Weight | Line Height | Use Case |
|-------|------|--------|-------------|----------|
| `--text-hero` | `48px` | 700 | 1.1 | Opportunity Score number |
| `--text-h1` | `28px` | 700 | 1.2 | Panel titles |
| `--text-h2` | `20px` | 600 | 1.3 | Card headers |
| `--text-h3` | `16px` | 600 | 1.4 | Section labels |
| `--text-body` | `14px` | 400 | 1.5 | Default body text |
| `--text-small` | `12px` | 400 | 1.5 | Metadata, captions |
| `--text-micro` | `10px` | 500 | 1.4 | Badges, tags |

### 5.3 Font Weights

| Weight | Value | Usage |
|--------|-------|-------|
| **Regular** | 400 | Body text, descriptions |
| **Medium** | 500 | Labels, interactive elements |
| **Semi-bold** | 600 | Subheadings, emphasis |
| **Bold** | 700 | Headlines, scores, CTAs |

### 5.4 Motion System

**The Motion Philosophy:**
> "Movement should feel like data flowing through a system—swift, precise, purposeful."

**Timing Functions:**
| Token | Value | Use Case |
|-------|-------|----------|
| `--ease-out` | `cubic-bezier(0.0, 0.0, 0.2, 1)` | Elements entering (cards appearing) |
| `--ease-in` | `cubic-bezier(0.4, 0.0, 1, 1)` | Elements exiting (modals closing) |
| `--ease-in-out` | `cubic-bezier(0.4, 0.0, 0.2, 1)` | Elements transforming (toggles, sliders) |
| `--spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful interactions (FAB press) |

**Duration Scale:**
| Token | Value | Use Case |
|-------|-------|----------|
| `--duration-instant` | `100ms` | Hover states, focus rings |
| `--duration-fast` | `200ms` | Button clicks, toggles |
| `--duration-normal` | `300ms` | Card transitions, dropdowns |
| `--duration-slow` | `500ms` | Page transitions, large panels |
| `--duration-glacial` | `1000ms` | Score animations, charts drawing |

### 5.5 Micro-Interactions Catalog

| Interaction | Animation |
|-------------|-----------|
| **Button Hover** | Background lightens 10%, subtle glow appears (`200ms`) |
| **Button Press** | Scale down to `0.97`, shadow reduces (`100ms`) |
| **Card Appear** | Slide from right (`translateX: 20px → 0`) + fade in (`400ms`) |
| **Card Hover** | Border color brightens, subtle lift (`translateY: -2px`) |
| **Input Focus** | Border color → `primary-glow`, glow shadow appears (`200ms`) |
| **Dropdown Open** | Scale from `0.95` to `1`, fade in (`200ms`) |
| **Score Count-Up** | Number counts from 0 to value (`1200ms`, ease-out) |
| **Progress Arc** | Draws from 0% to value (`1200ms`, ease-out) |
| **Marker Pulse** | Infinite expanding ring (`2s` loop) |
| **Chat Message** | Slide up from bottom + fade in (`300ms`) |
| **Toast Notification** | Slide in from right, auto-dismiss after `4s` |
| **Loading Skeleton** | Shimmer effect (gradient moving left to right, `1.5s` loop) |

---

## 6. Spacing & Grid System

### 6.1 Spacing Scale

Based on `4px` base unit:

| Token | Value | Use Case |
|-------|-------|----------|
| `--space-1` | `4px` | Tight gaps (icon + text) |
| `--space-2` | `8px` | Inline spacing |
| `--space-3` | `12px` | Card gaps, small padding |
| `--space-4` | `16px` | Default padding, section gaps |
| `--space-5` | `20px` | Card padding |
| `--space-6` | `24px` | Panel padding, large gaps |
| `--space-8` | `32px` | Section separation |
| `--space-10` | `40px` | Major section breaks |
| `--space-12` | `48px` | Page margins |

### 6.2 Component Spacing

| Component | Padding | Gap (between children) | Margin (from viewport) |
|-----------|---------|------------------------|------------------------|
| **Sidebar Panel** | `24px` | `16px` | `24px` from edges |
| **Dashboard Card** | `20px` | `12px` | — |
| **Input Field** | `12px 16px` | — | — |
| **Button** | `12px 24px` | `8px` (icon + text) | — |
| **Chip/Tag** | `6px 12px` | — | `8px` between chips |
| **Modal** | `32px` | `24px` | Centered |

---

## 7. Responsive Behavior

### 7.1 Breakpoints

| Token | Value | Description |
|-------|-------|-------------|
| `--breakpoint-sm` | `640px` | Mobile landscape |
| `--breakpoint-md` | `768px` | Tablets |
| `--breakpoint-lg` | `1024px` | Small laptops |
| `--breakpoint-xl` | `1280px` | Desktops |
| `--breakpoint-2xl` | `1536px` | Large monitors |

### 7.2 Layout Adaptation

| Viewport | Sidebar | Dashboard | Chat |
|----------|---------|-----------|------|
| **Desktop (≥1024px)** | Fixed left, always visible | Fixed right, always visible | FAB bottom-right |
| **Tablet (768-1023px)** | Collapsible, hamburger toggle | Below map, scrollable | FAB bottom-right |
| **Mobile (<768px)** | Bottom drawer (swipe up) | Full-screen modal on demand | FAB bottom-right |

### 7.3 Mobile Considerations

- **Touch targets:** Minimum `44px × 44px` for all interactive elements.
- **Swipe gestures:** Sidebar opens with swipe-right, closes with swipe-left.
- **Map remains hero:** On mobile, map takes 60% of screen, panels overlay from bottom.
- **Simplified HUD:** On mobile, show only Score + 2 key metrics (not full dashboard).

---

## 8. Accessibility Guidelines

### 8.1 Color Contrast

All text must meet WCAG 2.1 AA standards:
- **Normal text:** Minimum `4.5:1` contrast ratio.
- **Large text (18px+):** Minimum `3:1` contrast ratio.

| Combination | Contrast Ratio | Pass? |
|-------------|----------------|-------|
| `text-primary` on `canvas-deep` | `17.4:1` | ✅ AAA |
| `text-secondary` on `canvas-deep` | `9.7:1` | ✅ AAA |
| `text-tertiary` on `canvas-deep` | `5.1:1` | ✅ AA |
| `primary-glow` on `canvas-deep` | `6.2:1` | ✅ AA |

### 8.2 Focus States

All interactive elements must have visible focus indicators:
```css
:focus-visible {
  outline: 2px solid var(--primary-glow);
  outline-offset: 2px;
}
```

### 8.3 Screen Reader Support

- All images have descriptive `alt` text.
- Icon-only buttons have `aria-label`.
- Score changes announced with `aria-live="polite"`.
- Map markers have accessible names.

### 8.4 Reduced Motion

Respect user preference:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 📎 Appendix: Quick Reference

### Color Tokens (Copy-Paste)
```css
:root {
  /* Canvas */
  --canvas-deep: #020617;
  --canvas-base: #0f172a;
  
  /* Surface */
  --surface-primary: rgba(15, 23, 42, 0.8);
  --surface-secondary: rgba(30, 41, 59, 0.7);
  --surface-elevated: rgba(51, 65, 85, 0.6);
  --surface-border: rgba(255, 255, 255, 0.08);
  
  /* Primary */
  --primary-glow: #10b981;
  --primary-bright: #34d399;
  --primary-soft: rgba(16, 185, 129, 0.2);
  
  /* Warning */
  --warning-glow: #f59e0b;
  --warning-soft: rgba(245, 158, 11, 0.2);
  
  /* Destructive */
  --destructive-glow: #f43f5e;
  --destructive-soft: rgba(244, 63, 94, 0.2);
  
  /* Text */
  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-tertiary: #64748b;
  --text-disabled: #475569;
  
  /* Accent */
  --accent-cyan: #06b6d4;
  --accent-violet: #8b5cf6;
}
```

### Tailwind Mapping
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        canvas: {
          deep: '#020617',
          base: '#0f172a',
        },
        surface: {
          primary: 'rgba(15, 23, 42, 0.8)',
          secondary: 'rgba(30, 41, 59, 0.7)',
        },
        // ... etc
      }
    }
  }
}
```

---

<div align="center">

**🎨 Design with purpose. Build with precision. Ship with confidence.**

*Hotspot IQ Design System v1.0*

</div>
