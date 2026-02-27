# TradeBuddy Data Analyzer (n8n)

This guide explains how to set up the n8n workflow that powers the **Trading Habits & Insights** section on the Analysis page.

## What It Does

The data analyzer:
- Receives your trade data from TradeBuddy
- Computes trading habits (win rate by symbol, emotion, session, checklist discipline, etc.)
- Returns personalized recommendations to improve your trading

## Setup

### 1. Import the Workflow

1. Open n8n at http://localhost:5678 (or your n8n URL)
2. Go to **Workflows** → **Import from File** (or drag & drop)
3. Select `n8n-tradebuddy-insights-workflow.json` from this project
4. Save the workflow

### 2. Activate the Workflow

1. Open the imported workflow
2. Click **Activate** (toggle in the top right)
3. The webhook URL will be: `http://localhost:5678/webhook/tradebuddy-insights`

### 3. Configure DeepSeek Credential in n8n

1. In n8n, go to **Credentials** → **Create New**
2. Search for **Header Auth** (or **HTTP Header Auth**)
3. Create a credential named **DeepSeek API**:
   - **Header Name:** `Authorization`
   - **Header Value:** `Bearer sk-your-deepseek-api-key` (replace with your actual DeepSeek API key)
4. Open the TradeBuddy AI Insights workflow and assign this credential to the **DeepSeek Chat** node (if not already linked)

### 4. Backend Environment (optional)

In `backend/.env`:

```
N8N_BASE_URL=http://localhost:5678
N8N_INSIGHTS_WEBHOOK_PATH=webhook/tradebuddy-insights
N8N_API_KEY=your_n8n_api_key
```

The AI key is now stored in n8n credentials. Without a valid DeepSeek credential, the workflow falls back to basic statistical insights.

### 5. Use It

Go to **Analysis** in TradeBuddy. The **Trading Habits & Insights** card will load insights from n8n when you have trades.

If n8n is not running or the workflow is inactive, TradeBuddy will show basic fallback insights computed locally.
