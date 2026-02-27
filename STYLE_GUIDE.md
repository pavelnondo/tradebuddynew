# TradeBuddy - App Style & Chart Design Guide

## 🎨 Overall App Style

### Design Philosophy
TradeBuddy follows a **modern, professional trading journal aesthetic** with:
- **Dark-first design** with light mode support
- **Neon/glow effects** for emphasis and visual appeal
- **Glass morphism** elements for depth
- **Smooth animations** using Framer Motion
- **High contrast** for readability
- **Responsive design** for all screen sizes

### Color System

#### Dark Theme (Default)
- **Background**: `#0f1219` (Very dark blue-gray)
- **Foreground**: `#ffffff` (Pure white)
- **Cards**: `rgba(30,35,45,0.8)` (Semi-transparent dark gray)
- **Borders**: `rgba(255,255,255,0.15)` (Subtle white borders)
- **Primary/Accent**: `#3b82f6` (Bright blue)
- **Secondary**: `#6366f1` (Indigo
- **Success**: `#10b981` (Green)
- **Destructive**: `#ef4444` (Red)
- **Warning**: `#f59e0b` (Amber)
- **Muted Text**: `#f3f4f6` (Very light gray)

#### Light Theme
- **Background**: `#ffffff` (Pure white)
- **Foreground**: `#0f1219` (Very dark blue-gray)
- **Cards**: `rgba(249,250,251,0.8)` (Semi-transparent light gray)
- **Borders**: `rgba(0,0,0,0.15)` (Subtle dark borders)
- **Primary/Accent**: `#2563eb` (Darker blue)
- **Secondary**: `#4f46e5` (Darker indigo)
- **Success**: `#059669` (Darker green)
- **Destructive**: `#dc2626` (Darker red)
- **Warning**: `#d97706` (Darker amber)
- **Muted Text**: `#1f2937` (Very dark gray)

### Typography
- **Font Family**: System fonts (SF Pro, Segoe UI, Roboto, etc.)
- **Font Sizes**: 12px (xs) to 48px (5xl) scale
- **Font Weights**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)
- **Line Heights**: 1.25 (tight), 1.5 (normal), 1.75 (relaxed)

### Spacing System
- **Base Unit**: 4px
- **Scale**: 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px, 80px, 96px
- **Consistent padding/margins** throughout the app

### Border Radius
- **Small**: 4px
- **Medium**: 6px
- **Large**: 8px
- **XL**: 12px
- **2XL**: 16px
- **Full**: 9999px (for pills/badges)

### Shadows & Effects
- **Glow Effect**: Configurable intensity (0-1) with theme-based colors
- **Drop Shadows**: Subtle shadows for depth
- **Neon Effects**: Glowing borders and highlights on interactive elements
- **Glass Morphism**: Backdrop blur effects on cards and modals

---

## 📊 Chart Styles

### Chart Color Palette

#### Dark Theme Chart Colors
- **Line Charts**: `#3b82f6` (Bright blue)
- **Bar Charts**: `#6366f1` (Indigo)
- **Area Charts**: `rgba(59,130,246,0.2)` (20% opacity blue)
- **Chart Text**: `#ffffff` (White)
- **Chart Grid**: `rgba(255,255,255,0.1)` (10% opacity white)
- **Chart Background**: Transparent (inherits card background)

#### Light Theme Chart Colors
- **Line Charts**: `#2563eb` (Darker blue)
- **Bar Charts**: `#4f46e5` (Darker indigo)
- **Area Charts**: `rgba(37,99,235,0.1)` (10% opacity blue)
- **Chart Text**: `#0f1219` (Dark text)
- **Chart Grid**: `rgba(0,0,0,0.1)` (10% opacity black)
- **Chart Background**: Transparent (inherits card background)

### Chart Types & Styling

#### 1. **Line Charts** (Equity Curves, Trends)
- **Stroke Width**: 2-3px (adjustable based on view size)
- **Line Type**: Monotone (smooth curves)
- **Dots**: Optional, 4-6px radius
- **Active Dots**: Highlighted on hover, 6-8px radius
- **Glow Effect**: Drop shadow with configurable intensity
- **Animation**: 1000ms smooth fade-in
- **Grid**: Dashed lines (3px dash, 3px gap)

#### 2. **Bar Charts** (P&L Distribution, Counts)
- **Fill Color**: Theme-based (indigo for dark, darker indigo for light)
- **Border Radius**: 8px top corners (rounded tops)
- **Spacing**: Automatic spacing between bars
- **Glow Effect**: Drop shadow on bars
- **Animation**: 1000ms smooth grow-up
- **Grid**: Dashed lines (3px dash, 3px gap)

#### 3. **Area Charts** (Cumulative P&L, Trends)
- **Fill Opacity**: 20% (dark) / 10% (light)
- **Stroke Width**: 2-3px
- **Gradient**: Optional gradient fills
- **Glow Effect**: Drop shadow on stroke
- **Animation**: 1000ms smooth fade-in
- **Grid**: Dashed lines (3px dash, 3px gap)

#### 4. **Pie Charts** (Distribution, Percentages)
- **Colors**: Custom color array or theme-based
- **Stroke**: 2px border matching background
- **Labels**: Outside with connecting lines
- **Animation**: 1000ms smooth reveal
- **Legend**: Positioned below chart

#### 5. **Radar Charts** (Multi-metric Analysis)
- **Fill Opacity**: 60%
- **Stroke Width**: 2-3px
- **Grid**: Polar grid with dashed lines
- **Glow Effect**: Drop shadow on data lines
- **Animation**: 1000ms smooth reveal

### Chart Components

#### **NeonChart** (Primary Chart Component)
- **Features**:
  - Expandable fullscreen mode
  - Configurable glow intensity
  - Multiple data series support
  - Custom tooltips with theme styling
  - Responsive container
  - Loading and error states
  - Animation controls

- **Styling**:
  - Neon glow effects on lines/bars
  - Theme-aware colors
  - Smooth animations
  - Custom tooltip with motion effects
  - Legend with theme colors

#### **ProfessionalChart** (SVG-based)
- **Features**:
  - Custom SVG rendering
  - Precise control over scaling
  - Better handling of edge cases
  - No external dependencies

#### **CleanChart** (Minimalist)
- **Features**:
  - Clean, minimal design
  - Custom colors support
  - Theme integration
  - Simple, focused presentation

#### **EmotionChart** (Specialized)
- **Features**:
  - Emotion-specific color mapping:
    - **Confident**: `#10b981` (Green)
    - **Calm**: `#3b82f6` (Blue)
    - **Excited**: `#f59e0b` (Amber)
    - **Nervous**: `#ef4444` (Red)
    - **Frustrated**: `#dc2626` (Dark Red)
    - **Greedy**: `#7c3aed` (Purple)
    - **Fearful**: `#6b7280` (Gray)
    - **FOMO**: `#ec4899` (Pink)
    - **Satisfied**: `#059669` (Dark Green)
    - **Disappointed**: `#f97316` (Orange)

### Chart Axes & Grid

#### X-Axis
- **Font Size**: 10-14px (responsive)
- **Color**: Theme chartText color
- **Stroke**: Theme border color
- **Tick Format**: Automatic (numbers with decimals when needed)
- **Label**: Optional, positioned below

#### Y-Axis
- **Font Size**: 10-14px (responsive)
- **Color**: Theme chartText color
- **Stroke**: Theme border color
- **Label**: Optional, rotated -90°, positioned inside left
- **Tick Format**: Automatic number formatting

#### Grid Lines
- **Style**: Dashed (3px dash, 3px gap)
- **Color**: Theme chartGrid color
- **Opacity**: 30%
- **Glow**: Optional drop shadow effect
- **Stroke Width**: 1px

### Chart Tooltips

#### Styling
- **Background**: Theme popover color
- **Border**: Theme border color, 2px solid
- **Border Radius**: 8px
- **Padding**: 12px
- **Text Color**: Theme foreground
- **Font Size**: 12-14px
- **Animation**: Fade in/out with motion

#### Content
- **Label**: Bold, primary color
- **Values**: Regular weight, data color
- **Percentage**: Small text, muted color
- **Formatting**: Automatic number/currency formatting

### Chart Legends

#### Positioning
- **Default**: Below chart
- **Padding**: 10px top margin
- **Color**: Theme chartText color

#### Styling
- **Font Size**: 12px
- **Icon Size**: 12px squares
- **Spacing**: Automatic between items

### Chart Animations

#### Entry Animations
- **Duration**: 1000ms
- **Type**: Smooth fade-in with grow effect
- **Easing**: Default cubic-bezier
- **Stagger**: Optional for multiple series

#### Interactive Animations
- **Hover**: Scale up (1.05x) with glow increase
- **Click**: Scale down (0.95x) feedback
- **Transition**: 200ms smooth

### Chart Responsive Behavior

#### Breakpoints
- **Mobile**: < 640px - Simplified legends, smaller fonts
- **Tablet**: 640px - 1024px - Standard sizing
- **Desktop**: > 1024px - Full features, larger fonts

#### Adaptive Features
- **Font Sizes**: Scale with container size
- **Margins**: Adjust based on screen size
- **Legend**: Stack on mobile, horizontal on desktop
- **Tooltips**: Reposition to stay in viewport

### Special Chart Features

#### P&L Color Coding
- **Positive**: Green (`#10b981` dark / `#059669` light)
- **Negative**: Red (`#ef4444` dark / `#dc2626` light)
- **Neutral**: Theme foreground color

#### Heatmap Styling (Calendar)
- **Intensity**: Based on P&L magnitude
- **Colors**: Green gradient (positive) / Red gradient (negative)
- **Opacity**: 0.3 - 1.0 based on value
- **Hover**: Increased opacity + border highlight

#### Win/Loss Indicators
- **Win**: Green circle/badge
- **Loss**: Red circle/badge
- **Size**: 8-12px depending on context

---

## 🎯 Design Principles

1. **Consistency**: All charts follow the same color scheme and styling rules
2. **Accessibility**: High contrast ratios, readable fonts, clear labels
3. **Performance**: Optimized animations, efficient rendering
4. **Responsiveness**: Adapts to all screen sizes
5. **Theme Awareness**: Automatically adjusts to light/dark mode
6. **Professional**: Clean, modern, suitable for financial data
7. **Interactive**: Smooth hover effects, clear tooltips, expandable views

---

## 📱 Component Styling

### Cards
- **Background**: Theme card color (semi-transparent)
- **Border**: Theme border color, 1px solid
- **Border Radius**: 12px (xl)
- **Padding**: 24px (6)
- **Shadow**: Theme shadow with glow effect
- **Hover**: Increased shadow, subtle scale (1.02x)

### Buttons
- **Primary**: Theme primary color with white text
- **Secondary**: Theme secondary color
- **Destructive**: Theme destructive color
- **Ghost**: Transparent with hover background
- **Border Radius**: 8px (lg)
- **Padding**: 8px 16px
- **Hover**: Scale (1.05x) with glow effect
- **Active**: Scale (0.95x)

### Inputs
- **Background**: Theme input color
- **Border**: Theme border color, 1px solid
- **Border Radius**: 8px (lg)
- **Padding**: 8px 12px
- **Focus**: Ring with theme primary color, 2px
- **Hover**: Border color intensifies

---

This style guide ensures consistency across all charts and UI components in TradeBuddy, creating a cohesive, professional trading journal experience.
