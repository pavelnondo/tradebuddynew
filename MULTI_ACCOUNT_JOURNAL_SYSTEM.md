# Multi-Account Trading Journal System

## 🎯 **Concept: "Flipping Pages in a Trading Journal"**

Think of your trading journal like a physical notebook where:
- **Each page = One trading account**
- **Flipping pages = Switching between accounts**
- **All pages together = Your complete trading history**

## 📊 **How It Works**

### **Database Structure**
```
USER (You)
├── JOURNAL 1 (Account #1) - "My First Account"
│   ├── Trade 1: AAPL +$150
│   ├── Trade 2: TSLA -$200
│   └── Trade 3: MSFT +$75
│
├── JOURNAL 2 (Account #2) - "Challenge Account"
│   ├── Trade 1: NVDA +$300
│   ├── Trade 2: GOOGL -$100
│   └── Trade 3: AMZN +$250
│
└── JOURNAL 3 (Account #3) - "Live Trading"
    ├── Trade 1: SPY +$500
    └── Trade 2: QQQ -$150
```

### **Account Lifecycle**
1. **Create New Account** → New journal page created
2. **Trade in Account** → Trades stored under that journal
3. **Account Blown** → Mark as blown, start new account
4. **Account Passed** → Mark as passed (challenge completed)
5. **Switch Accounts** → "Flip pages" between journals

## 🔄 **Data Storage & Display**

### **Individual Account Data**
Each journal (account) stores:
- **Account Info**: Name, initial balance, current balance, broker
- **Trade History**: All trades in that specific account
- **Performance**: Win rate, total P&L, drawdown for that account
- **Status**: Active, Blown, or Passed

### **Combined Data (All Accounts)**
When viewing "All Accounts" or "Overall Performance":
- **Aggregated Trades**: All trades from all accounts combined
- **Total Performance**: Sum of all account performances
- **Account Comparison**: Side-by-side performance metrics
- **Timeline View**: Chronological view across all accounts

## 🎮 **User Experience**

### **Account Switching (Page Flipping)**
```
┌─────────────────────────────────────┐
│  📖 Trading Journal                │
├─────────────────────────────────────┤
│  Current Page: "Challenge Account"  │
│  [← Previous] [Next →]              │
├─────────────────────────────────────┤
│  Account Stats:                     │
│  • Balance: $8,500                  │
│  • Trades: 15                       │
│  • Win Rate: 73%                    │
│  • P&L: +$1,200                     │
└─────────────────────────────────────┘
```

### **Account Management**
- **Create New Account**: Start fresh with new balance
- **Mark as Blown**: Account failed, preserve data
- **Mark as Passed**: Challenge completed successfully
- **Switch Active**: Change which account you're trading in

## 📈 **Data Visualization**

### **Individual Account View**
- Account-specific charts and metrics
- Trade history for that account only
- Performance analytics for that account
- Balance progression over time

### **Combined View (All Accounts)**
- Master dashboard with all accounts
- Comparative performance charts
- Total portfolio value across accounts
- Cross-account trade analysis

### **Account Comparison**
- Side-by-side performance metrics
- Win rates comparison
- P&L comparison
- Risk metrics comparison

## 🛠️ **Technical Implementation**

### **Database Queries**

#### **Get All Accounts for User**
```sql
SELECT * FROM journals 
WHERE user_id = $1 
ORDER BY created_at DESC;
```

#### **Get Trades for Specific Account**
```sql
SELECT * FROM trades 
WHERE user_id = $1 AND journal_id = $2 
ORDER BY entry_time DESC;
```

#### **Get All Trades Across All Accounts**
```sql
SELECT t.*, j.name as account_name 
FROM trades t 
JOIN journals j ON t.journal_id = j.id 
WHERE t.user_id = $1 
ORDER BY t.entry_time DESC;
```

#### **Get Aggregated Performance**
```sql
SELECT 
  j.name as account_name,
  COUNT(t.id) as total_trades,
  SUM(t.pnl) as total_pnl,
  AVG(t.pnl) as avg_pnl,
  (COUNT(CASE WHEN t.pnl > 0 THEN 1 END)::float / COUNT(t.id)) * 100 as win_rate
FROM journals j
LEFT JOIN trades t ON j.id = t.journal_id
WHERE j.user_id = $1
GROUP BY j.id, j.name
ORDER BY j.created_at DESC;
```

### **Frontend State Management**
```typescript
// Current active account
const [activeJournal, setActiveJournal] = useState<Journal | null>(null);

// All user accounts
const [journals, setJournals] = useState<Journal[]>([]);

// Switch between accounts
const switchJournal = (journalId: string) => {
  setActiveJournal(journals.find(j => j.id === journalId));
  localStorage.setItem('activeJournalId', journalId);
};
```

## 🎯 **Use Cases**

### **1. Challenge Trading**
- **Account 1**: $5,000 challenge account
- **Account 2**: $10,000 challenge account
- **Account 3**: $25,000 challenge account
- Track progress separately, compare results

### **2. Strategy Testing**
- **Account 1**: Day trading strategy
- **Account 2**: Swing trading strategy
- **Account 3**: Long-term investing
- Compare which strategy works best

### **3. Broker Comparison**
- **Account 1**: Broker A (paper)
- **Account 2**: Broker B (paper)
- **Account 3**: Broker C (live)
- Test different brokers and platforms

### **4. Risk Management**
- **Account 1**: Conservative (1% risk)
- **Account 2**: Moderate (2% risk)
- **Account 3**: Aggressive (5% risk)
- See how different risk levels perform

## 📱 **UI/UX Features**

### **Account Switcher**
- Dropdown to select current account
- Visual indicators for account status
- Quick stats preview

### **Account Creation**
- Simple form to create new account
- Set initial balance and name
- Choose account type (paper/live/demo)

### **Account Status**
- **Active**: Currently trading
- **Blown**: Account failed, data preserved
- **Passed**: Challenge completed

### **Performance Views**
- **Individual**: Focus on one account
- **Combined**: All accounts together
- **Comparison**: Side-by-side metrics

## 🔄 **Workflow Example**

1. **Start Trading**: Create "Challenge Account 1" with $5,000
2. **Trade**: Make 20 trades, track performance
3. **Account Blown**: Mark as blown when balance hits $4,000
4. **New Account**: Create "Challenge Account 2" with $5,000
5. **Continue**: Trade in new account, compare to previous
6. **Analysis**: View combined performance across all accounts

This system gives you the flexibility to:
- ✅ Track multiple trading approaches
- ✅ Preserve historical data
- ✅ Compare performance across accounts
- ✅ Start fresh when needed
- ✅ Maintain complete trading history
