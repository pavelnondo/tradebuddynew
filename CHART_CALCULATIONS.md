# 📊 Chart Calculations & Data Points

## 🔍 **Data Sources**
All charts use data from the `trades` array with the following key fields:
- `trade.date` - Trade execution date
- `trade.profitLoss` - Profit/Loss amount
- `trade.asset` - Trading asset (NQ, ES, etc.)
- `trade.setupType` or `trade.setup` - Trading setup name
- `trade.emotion` - Trading emotion
- `trade.entryPrice` - Entry price
- `trade.exitPrice` - Exit price
- `trade.positionSize` - Position size
- `trade.duration` - Trade duration

---

## 📈 **1. WATERFALL CHART**

### **Data Points Used:**
- `trade.date` → Converted to date string
- `trade.profitLoss` → Daily P&L aggregation

### **Calculations:**
```javascript
// 1. Group trades by date
const dailyPnL = new Map();
filteredTrades.forEach(trade => {
  const date = new Date(trade.date).toLocaleDateString();
  dailyPnL.set(date, (dailyPnL.get(date) || 0) + trade.profitLoss);
});

// 2. Create waterfall sequence
result = [
  { name: 'Starting Balance', value: 10000, type: 'start' },
  ...sortedDates.map(date => ({
    name: date,
    value: dailyPnL.get(date),
    type: dailyPnL.get(date) >= 0 ? 'positive' : 'negative'
  })),
  { name: 'Final Balance', value: 10000 + totalPnL, type: 'end' }
];
```

### **Key Metrics:**
- **Starting Balance**: Fixed at $10,000
- **Daily P&L**: Sum of all trades per day
- **Final Balance**: Starting + Total P&L
- **Cumulative Tracking**: Running total of P&L changes

---

## 🔥 **2. HEATMAP CHART**

### **Data Points Used:**
- `trade.date` → Day of week + hour
- `trade.profitLoss` → Activity value (absolute value)
- Trade count per time slot

### **Calculations:**
```javascript
// 1. Extract day and hour from date
const date = new Date(trade.date);
const day = date.toLocaleDateString('en-US', { weekday: 'short' });
const hour = date.getHours();

// 2. Aggregate activity by time slot
activityMap.set(`${day}-${hour}`, {
  value: current.value + Math.abs(trade.profitLoss),
  trades: current.trades + 1
});

// 3. Color intensity calculation
const intensity = (value - minValue) / (maxValue - minValue);
// Returns color class based on intensity
```

### **Key Metrics:**
- **Activity Value**: Sum of absolute P&L per time slot
- **Trade Count**: Number of trades per time slot
- **Peak Hour**: Time slot with highest activity
- **Total Activity**: Sum of all activity values
- **Average per Hour**: Total activity ÷ 168 hours

---

## 📊 **3. PARETO CHART**

### **Data Points Used:**
- `trade.setupType` or `trade.setup` → Setup category
- `trade.profitLoss` → Setup performance value

### **Calculations:**
```javascript
// 1. Group by setup and sum P&L
const setupStats = new Map();
filteredTrades.forEach(trade => {
  const setup = trade.setupType || trade.setup || 'Unknown';
  setupStats.set(setup, (setupStats.get(setup) || 0) + trade.profitLoss);
});

// 2. Sort by value descending
const sortedSetups = Array.from(setupStats.entries())
  .map(([setup, value]) => ({ category: setup, value }))
  .sort((a, b) => b.value - a.value);

// 3. Calculate cumulative percentage
let cumulative = 0;
return sortedSetups.map(item => {
  cumulative += item.value;
  return {
    ...item,
    cumulativePercentage: (cumulative / total) * 100
  };
});
```

### **Key Metrics:**
- **Setup P&L**: Total profit/loss per setup
- **Cumulative Percentage**: Running percentage of total
- **80/20 Analysis**: Identifies top-performing setups
- **Total Value**: Sum of all setup values

---

## 🍩 **4. DONUT CHART**

### **Data Points Used:**
- `trade.emotion` → Emotion category
- Trade count per emotion

### **Calculations:**
```javascript
// 1. Count trades by emotion
const emotionStats = new Map();
filteredTrades.forEach(trade => {
  const emotion = trade.emotion || 'neutral';
  emotionStats.set(emotion, (emotionStats.get(emotion) || 0) + 1);
});

// 2. Convert to chart data
return Array.from(emotionStats.entries()).map(([emotion, count]) => ({
  name: emotion.charAt(0).toUpperCase() + emotion.slice(1),
  value: count
}));

// 3. Calculate percentages
const total = chartData.reduce((sum, item) => sum + item.value, 0);
const percentage = ((data.value / total) * 100).toFixed(1);
```

### **Key Metrics:**
- **Emotion Count**: Number of trades per emotion
- **Percentage**: (Count / Total) × 100
- **Total Trades**: Sum of all emotion counts

---

## 📊 **5. SETUP PERFORMANCE CHARTS**

### **Data Points Used:**
- `trade.setupType` or `trade.setup` → Setup category
- `trade.profitLoss` → P&L value
- `trade.totalTrades` → Trade count
- `trade.winRate` → Win percentage

### **Calculations:**
```javascript
// 1. P&L Chart Data
const pnlChartData = sortedData.map(d => ({
  setup: d.setup || 'Unknown',
  pnl: d.totalPnL,
  trades: d.totalTrades,
}));

// 2. Win Rate Chart Data (capped at 100%)
const winRateChartData = sortedData.map(d => ({
  setup: d.setup || 'Unknown',
  winRate: Math.min(d.winRate, 100),
  trades: d.totalTrades,
}));

// 3. Summary Statistics
const totalTrades = data.reduce((sum, d) => sum + d.totalTrades, 0);
const totalPnL = data.reduce((sum, d) => sum + d.totalPnL, 0);
const avgWinRate = data.reduce((sum, d) => sum + d.winRate, 0) / data.length;
const bestSetup = data.reduce((best, current) => 
  current.totalPnL > best.totalPnL ? current : best
);
```

### **Key Metrics:**
- **Total Trades**: Sum of trades across all setups
- **Total P&L**: Sum of P&L across all setups
- **Average Win Rate**: Mean win rate across setups
- **Best Setup**: Setup with highest total P&L

---

## 📊 **6. SUMMARY STATISTICS**

### **Data Points Used:**
- All trade fields for comprehensive analysis

### **Calculations:**
```javascript
// Total Trades
const totalTrades = filteredTrades.length;

// Total P&L
const totalPnL = filteredTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);

// Win Rate
const winRate = filteredTrades.length > 0 
  ? (filteredTrades.filter(t => (t.profitLoss || 0) > 0).length / filteredTrades.length) * 100
  : 0;

// Unique Setups
const uniqueSetups = new Set(filteredTrades.map(t => t.setupType || t.setup || 'Unknown')).size;
```

### **Key Metrics:**
- **Total Trades**: Count of all filtered trades
- **Total P&L**: Sum of all profit/loss values
- **Win Rate**: Percentage of profitable trades
- **Unique Setups**: Number of distinct trading setups

---

## 🎨 **7. COLOR CALCULATIONS**

### **P&L Colors:**
- **Green**: `#10b981` (positive values)
- **Red**: `#ef4444` (negative values)
- **Gray**: `#6b7280` (start/end values)

### **Heatmap Colors:**
- **Intensity Scale**: 0-100% mapped to color opacity
- **Color Range**: Light blue to dark blue
- **Formula**: `(value - minValue) / (maxValue - minValue)`

### **Chart Colors:**
- **Blue**: `#3b82f6` (primary)
- **Emerald**: `#10b981` (success)
- **Amber**: `#f59e0b` (warning)
- **Red**: `#ef4444` (danger)
- **Violet**: `#8b5cf6` (accent)
- **Pink**: `#ec4899` (highlight)

---

## 🔧 **8. FILTERING LOGIC**

### **Timeframe Filters:**
```javascript
switch (timeframe) {
  case "week": cutoff.setDate(now.getDate() - 7); break;
  case "month": cutoff.setMonth(now.getMonth() - 1); break;
  case "quarter": cutoff.setMonth(now.getMonth() - 3); break;
  case "year": cutoff.setFullYear(now.getFullYear() - 1); break;
}
```

### **Asset Filters:**
```javascript
if (selectedAsset !== "all") {
  filtered = filtered.filter(trade => trade.asset === selectedAsset);
}
```

---

## 📝 **9. DATA VALIDATION**

### **Safety Checks:**
- `Array.isArray(trades)` - Ensures trades is an array
- `trade.profitLoss || 0` - Defaults to 0 if undefined
- `trade.setupType || trade.setup || 'Unknown'` - Fallback setup names
- `trade.emotion || 'neutral'` - Default emotion

### **Error Handling:**
- Empty data arrays return empty chart data
- Division by zero protection
- Null/undefined value handling
- Date parsing error protection

---

## 🎯 **10. PERFORMANCE OPTIMIZATIONS**

### **Memoization:**
- All chart data calculations use `useMemo`
- Dependencies: `[filteredTrades]` or `[trades, timeframe, selectedAsset]`
- Prevents unnecessary recalculations

### **Data Processing:**
- Single-pass aggregation where possible
- Efficient Map/Set usage for grouping
- Sorted data for better visualization
- Capped values (e.g., win rate at 100%)

---

This comprehensive breakdown shows exactly how each chart calculates its data points and visualizations! 📊✨
