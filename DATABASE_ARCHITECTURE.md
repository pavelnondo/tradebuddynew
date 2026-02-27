# TradeBuddy Database Architecture

## Overview
TradeBuddy uses a PostgreSQL database with a hierarchical structure that supports multiple users, each with multiple trading journals, and trades linked to specific journals.

## Database Structure

```
┌─────────────────┐
│     USERS       │
│                 │
│ • id (UUID)     │
│ • email         │
│ • password_hash │
│ • first_name    │
│ • last_name     │
│ • preferences   │
│ • is_active     │
│ • created_at    │
│ • updated_at    │
│ • last_login    │
└─────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│    JOURNALS     │
│                 │
│ • id (UUID)     │
│ • user_id (FK)  │
│ • name          │
│ • account_type  │
│ • broker        │
│ • initial_balance│
│ • current_balance│
│ • currency      │
│ • is_active     │
│ • created_at    │
│ • updated_at    │
└─────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│     TRADES      │
│                 │
│ • id (UUID)     │
│ • user_id (FK)  │
│ • journal_id (FK)│
│ • symbol        │
│ • trade_type    │
│ • direction     │
│ • entry_price   │
│ • exit_price    │
│ • quantity      │
│ • position_size │
│ • entry_time    │
│ • exit_time     │
│ • duration      │
│ • emotion       │
│ • confidence_level│
│ • execution_quality│
│ • setup_type    │
│ • market_condition│
│ • pnl           │
│ • pnl_percentage│
│ • commission    │
│ • fees          │
│ • notes         │
│ • tags          │
│ • screenshot_url│
│ • checklist_id  │
│ • checklist_items│
│ • created_at    │
│ • updated_at    │
└─────────────────┘

┌─────────────────┐
│ USER_SETTINGS   │
│                 │
│ • id (UUID)     │
│ • user_id (FK)  │
│ • initial_balance│
│ • currency      │
│ • date_format   │
│ • created_at    │
│ • updated_at    │
└─────────────────┘

┌─────────────────┐
│   CHECKLISTS    │
│                 │
│ • id (UUID)     │
│ • user_id (FK)  │
│ • name          │
│ • description   │
│ • items (JSONB) │
│ • created_at    │
│ • updated_at    │
└─────────────────┘

┌─────────────────┐
│TRADE_TEMPLATES  │
│                 │
│ • id (UUID)     │
│ • user_id (FK)  │
│ • name          │
│ • description   │
│ • symbol        │
│ • trade_type    │
│ • setup_type    │
│ • market_condition│
│ • confidence_level│
│ • notes         │
│ • tags (JSONB)  │
│ • is_active     │
│ • created_at    │
│ • updated_at    │
└─────────────────┘

┌─────────────────┐
│PERFORMANCE_METRICS│
│                 │
│ • id (UUID)     │
│ • user_id (FK)  │
│ • journal_id (FK)│
│ • period_type   │
│ • period_start  │
│ • period_end    │
│ • total_trades  │
│ • winning_trades│
│ • losing_trades │
│ • win_rate      │
│ • total_pnl     │
│ • avg_win       │
│ • avg_loss      │
│ • profit_factor │
│ • max_drawdown  │
│ • sharpe_ratio  │
│ • created_at    │
│ • updated_at    │
└─────────────────┘
```

## Key Relationships

### 1. User → Journals (1:Many)
- Each user can have multiple trading journals
- Journals represent different trading strategies, time periods, or account types
- Default journal "Journal 1" is created automatically for new users

### 2. Journal → Trades (1:Many)
- Each journal can contain multiple trades
- Trades are linked to both user and journal for data isolation
- Journal tracks initial and current balance

### 3. User → Settings (1:1)
- Each user has one settings record
- Contains default preferences like currency and date format

### 4. User → Checklists (1:Many)
- Users can create multiple trading checklists
- Checklists help maintain trading discipline

### 5. User → Trade Templates (1:Many)
- Users can save common trade setups as templates
- Templates speed up trade entry

### 6. Journal → Performance Metrics (1:Many)
- Performance metrics are calculated per journal
- Supports different time periods (daily, weekly, monthly, yearly)

## Account Types
Journals support different account types:
- **paper**: Paper trading/simulation
- **live**: Live trading with real money
- **demo**: Broker demo account

## Data Flow

### User Registration
1. User registers → `users` table
2. Default journal created → `journals` table
3. Default settings created → `user_settings` table

### Trade Entry
1. User selects journal
2. Trade data saved → `trades` table with `journal_id`
3. Journal balance updated if needed

### Performance Tracking
1. Trades aggregated by journal
2. Metrics calculated → `performance_metrics` table
3. Charts and analytics generated from this data

## Security & Data Isolation
- All queries filtered by `user_id` to ensure data isolation
- Foreign key constraints prevent orphaned records
- CASCADE deletes maintain data integrity
- UUID primary keys prevent enumeration attacks

## Indexes for Performance
- `idx_users_email` - Fast login lookups
- `idx_journals_user_id` - Quick journal retrieval
- `idx_trades_user_id` - Fast trade queries
- `idx_trades_journal_id` - Journal-specific trades
- `idx_trades_entry_time` - Time-based filtering
- `idx_trades_symbol` - Symbol-based searches
- `idx_trades_emotion` - Psychology analysis
- `idx_trades_pnl` - Performance queries

## Migration History
The database has evolved through several migrations:
1. Original simple structure
2. Added trading accounts (now journals)
3. Enhanced with psychology features
4. Migrated to Apple-inspired design
5. Renamed accounts to journals for clarity
