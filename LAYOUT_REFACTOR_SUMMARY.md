# Analytics Layout Refactor - Large Charts, Zero Overlap, Perfect Symmetry

## Overview
Comprehensive refactor of the analytics UI layout system to enforce large, space-filling charts with strict symmetry, centering, and alignment. Charts never shrink, containers expand to accommodate them, and all elements are grid-locked with perfect alignment.

## ✅ Core Principles Enforced

### 1. Chart Size Contracts
- **Simple charts**: Minimum 320px height (Equity Curve, Win/Loss)
- **Complex charts**: Minimum 360-420px height (Heatmaps, Box Plots, Distributions)
- Charts may grow larger but **never render below minimum height**
- All charts define preferred aspect ratios where applicable

### 2. Elastic Containers
- **Containers expand**, charts never shrink
- All fixed-height containers replaced with elastic containers
- Containers expand vertically to fully contain:
  - Chart canvas
  - Axes
  - Labels
  - Legends
- **No clipping** - removed all `overflow: hidden` that caused clipping
- Charts never overlap labels, axes, legends, or tooltips

### 3. Universal Chart Card Structure
Every chart card follows this **exact mandatory structure**:

```
┌─────────────────────────────┐
│ Header (fixed 80px)         │
│ - Title                     │
│ - Subtitle                  │
├─────────────────────────────┤
│ Body (elastic, min 320-420px)│
│ - Chart canvas (centered)   │
│ - Axes & labels (pre-allocated)│
│ - Legends (docked)          │
├─────────────────────────────┤
│ Footer (optional, fixed 60px)│
│ - Summary metrics           │
└─────────────────────────────┘
```

**No chart may deviate from this structure.**

### 4. Grid-Locked Page Layout
- **Single consistent CSS Grid system** across all analytics pages
- Charts in the same row:
  - Share the height of the tallest chart in that row
  - Align titles, plot start positions, and footers vertically
  - Smaller charts center vertically within the row
- Consistent row and column gaps (24px) applied globally
- Responsive: stacks vertically on mobile, preserves minimum heights

### 5. Axis, Label, and Legend Containment
- **Pre-allocate space** for x-axis and y-axis labels inside chart body
- Prevent all label overlap with plotted data
- Reduce tick density, rotate labels, or abbreviate text instead of shrinking charts
- Legends docked consistently (top or bottom) and never overlay plot area

### 6. Centering and Symmetry
- All chart canvases **visually centered** within their containers
- Titles, plot areas, and footers **align across cards** in the same row
- Eliminated asymmetrical padding, margins, or floating elements
- No chart appears higher, lower, or offset relative to neighbors

### 7. Responsive Behavior
- On smaller screens: **stack charts vertically** instead of shrinking
- Preserve minimum chart heights at all breakpoints
- Maintain consistent spacing, centering, and alignment on mobile/tablet

---

## 📁 New Components Created

### 1. `ChartCard.tsx` - Universal Chart Card
**Purpose**: Enforces mandatory header/body/footer structure

**Props**:
- `title`: Chart title
- `subtitle`: Optional subtitle
- `children`: Chart component
- `footer`: Optional footer content
- `minHeight`: Minimum chart height (320-420px)

**Features**:
- Fixed header height (80px)
- Elastic body with minimum height
- Optional fixed footer (60px)
- Consistent padding and spacing
- Theme-aware styling

### 2. `ChartContainer.tsx` - Elastic Container
**Purpose**: Ensures charts never shrink below minimum height

**Props**:
- `children`: Chart content
- `minHeight`: Minimum height in pixels
- `aspectRatio`: Optional aspect ratio (width/height)
- `className`: Additional CSS classes

**Features**:
- Enforces minimum height
- Centers content horizontally and vertically
- Expands to accommodate chart content
- Prevents clipping

### 3. `AnalyticsGrid.tsx` - Grid Layout System
**Purpose**: Grid-locked layout with consistent alignment

**Components**:
- `AnalyticsGrid`: Basic grid with configurable columns
- `ResponsiveAnalyticsGrid`: Responsive grid that stacks on mobile

**Props**:
- `children`: Chart cards
- `columns`: Number of columns (1-4)
- `gap`: Gap between cards (default 24px)
- `className`: Additional CSS classes

**Features**:
- CSS Grid with `align-items: stretch` (ensures equal row heights)
- Consistent gaps
- Responsive stacking on mobile
- Preserves minimum heights

---

## 🔄 Chart Components Updated

All chart components now:
1. Use `ChartContainer` for proper sizing
2. Set minimum heights (320px for simple, 360-420px for complex)
3. Pre-allocate space for axes/labels/legends
4. Use proper padding instead of fixed positions
5. Center content within containers

### Updated Charts:
- ✅ `EmotionOutcomeHeatmap` - 400px min height
- ✅ `HourlyPerformanceHeatmap` - 400px min height
- ✅ `DayOfWeekBoxPlot` - 420px min height
- ✅ `RMultipleDistribution` - 420px min height
- ✅ `RMultipleBuckets` - 400px min height

---

## 📄 Pages Updated

### 1. `Analysis.tsx`
- Replaced all `Card` components with `ChartCard`
- Wrapped charts in `ResponsiveAnalyticsGrid`
- All charts use proper minimum heights
- Consistent spacing and alignment

### 2. `Dashboard.tsx`
- Replaced chart cards with `ChartCard`
- Wrapped charts in `ResponsiveAnalyticsGrid`
- Equity Curve and Win/Loss use 360px minimum height

---

## 🎯 Key Improvements

### Before:
- ❌ Fixed heights (320px) caused clipping
- ❌ Charts overlapped labels and legends
- ❌ Inconsistent card structures
- ❌ Charts appeared off-center
- ❌ No grid alignment
- ❌ Charts shrunk on smaller screens

### After:
- ✅ Elastic containers that expand
- ✅ Pre-allocated space for all elements
- ✅ Universal card structure
- ✅ Perfect centering
- ✅ Grid-locked alignment
- ✅ Charts stack but never shrink

---

## 📊 Minimum Height Standards

| Chart Type | Minimum Height | Rationale |
|------------|---------------|-----------|
| Equity Curve | 360px | Simple line chart, needs space for rotated labels |
| Win/Loss Analysis | 360px | Simple bar chart, needs space for legend |
| Emotion Heatmap | 400px | Matrix layout, needs space for labels on both axes |
| Hourly Heatmap | 400px | 24 cells, needs space for hour labels |
| Box Plot | 420px | Complex visualization, needs space for whiskers and labels |
| R-Multiple Distribution | 420px | Multiple series, needs space for reference lines and legend |
| R-Multiple Buckets | 400px | Horizontal bars, needs space for percentage labels |

---

## 🔧 Technical Implementation

### Chart Card Structure
```tsx
<ChartCard
  title="Chart Title"
  subtitle="Chart description"
  minHeight={360}
  footer={<SummaryMetrics />}
>
  <ChartContainer minHeight={360}>
    <ResponsiveContainer width="100%" height="100%" minHeight={360}>
      {/* Chart content */}
    </ResponsiveContainer>
  </ChartContainer>
</ChartCard>
```

### Grid Layout
```tsx
<ResponsiveAnalyticsGrid columns={2} gap={24}>
  <ChartCard ... />
  <ChartCard ... />
  <ChartCard ... />
  <ChartCard ... />
</ResponsiveAnalyticsGrid>
```

### Padding System
All charts use consistent padding:
- **Top**: 40-60px (for title/legend space)
- **Right**: 20-40px (for tooltip safety)
- **Bottom**: 60-80px (for x-axis labels)
- **Left**: 80-100px (for y-axis labels)

---

## ✨ Result

The analytics UI now presents:
- ✅ **Large, readable charts** that fill available space
- ✅ **Perfect symmetry** - all charts aligned and centered
- ✅ **Zero overlap** - labels, axes, legends never collide
- ✅ **Grid-locked layout** - professional, deliberate appearance
- ✅ **Responsive behavior** - stacks on mobile, preserves sizes
- ✅ **Consistent structure** - all charts follow same pattern

The entire analytics section reads as **one cohesive, symmetrical system** with no visual imbalance, no off-center charts, and no overlapping elements.

---

**Layout refactor completed successfully!** All charts are now large, space-filling, and perfectly aligned.
