require('dotenv').config();
const { Pool } = require('pg');

class AIAnalysisService {
  constructor() {
    this.pool = new Pool({
      host: process.env.PGHOST || 'localhost',
      user: process.env.PGUSER || 'tradebuddy_user',
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE || 'tradebuddy',
      port: process.env.PGPORT || 5432,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  // Analyze voice message and extract trade information
  async analyzeVoiceMessage(transcript) {
    try {
      // TODO: Integrate with OpenAI or other AI service for voice analysis
      const analysis = {
        tradeData: this.extractTradeData(transcript),
        sentiment: this.analyzeSentiment(transcript),
        confidence: this.analyzeConfidence(transcript),
        suggestions: this.generateSuggestions(transcript),
        rating: this.suggestRating(transcript)
      };

      return analysis;
    } catch (error) {
      console.error('Voice analysis error:', error);
      throw error;
    }
  }

  // Extract trade data from voice transcript
  extractTradeData(transcript) {
    const tradeData = {
      symbol: null,
      type: null,
      entryPrice: null,
      exitPrice: null,
      quantity: null,
      emotion: null,
      notes: transcript
    };

    // Simple regex patterns for extracting trade data
    const patterns = {
      symbol: /\b([A-Z]{1,5})\b/g, // Stock symbols like AAPL, TSLA
      price: /\$?(\d+\.?\d*)/g, // Prices like $150.50 or 150.50
      quantity: /\b(\d+)\s*(shares?|units?|contracts?)\b/gi, // Quantity
      type: /\b(long|short|buy|sell)\b/gi // Trade type
    };

    // Extract symbol (look for common stock symbols)
    const symbolMatch = transcript.match(/\b(AAPL|TSLA|MSFT|GOOGL|AMZN|NVDA|META|NFLX|SPY|QQQ|IWM|VTI)\b/gi);
    if (symbolMatch) {
      tradeData.symbol = symbolMatch[0].toUpperCase();
    }

    // Extract trade type
    const typeMatch = transcript.match(/\b(long|short|buy|sell)\b/gi);
    if (typeMatch) {
      const type = typeMatch[0].toLowerCase();
      tradeData.type = type === 'buy' ? 'LONG' : type === 'sell' ? 'SHORT' : type.toUpperCase();
    }

    // Extract prices
    const prices = transcript.match(/\$?(\d+\.?\d*)/g);
    if (prices && prices.length >= 2) {
      tradeData.entryPrice = parseFloat(prices[0].replace('$', ''));
      tradeData.exitPrice = parseFloat(prices[1].replace('$', ''));
    }

    // Extract quantity
    const quantityMatch = transcript.match(/\b(\d+)\s*(shares?|units?|contracts?)\b/gi);
    if (quantityMatch) {
      tradeData.quantity = parseInt(quantityMatch[0].match(/\d+/)[0]);
    }

    // Extract emotion
    const emotions = this.detectEmotion(transcript);
    tradeData.emotion = emotions.primary;

    return tradeData;
  }

  // Analyze sentiment of the voice message
  analyzeSentiment(transcript) {
    const positiveWords = ['profit', 'gain', 'win', 'success', 'confident', 'bullish', 'strong', 'good', 'great', 'excellent'];
    const negativeWords = ['loss', 'lose', 'bearish', 'weak', 'bad', 'worried', 'nervous', 'fear', 'doubt'];
    const neutralWords = ['neutral', 'okay', 'fine', 'average', 'normal'];

    const words = transcript.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    words.forEach(word => {
      if (positiveWords.some(pw => word.includes(pw))) positiveCount++;
      if (negativeWords.some(nw => word.includes(nw))) negativeCount++;
      if (neutralWords.some(nw => word.includes(nw))) neutralCount++;
    });

    if (positiveCount > negativeCount && positiveCount > neutralCount) {
      return 'positive';
    } else if (negativeCount > positiveCount && negativeCount > neutralCount) {
      return 'negative';
    } else {
      return 'neutral';
    }
  }

  // Analyze confidence level from voice message
  analyzeConfidence(transcript) {
    const confidentWords = ['confident', 'sure', 'certain', 'definitely', 'absolutely', 'strong', 'clear'];
    const uncertainWords = ['maybe', 'perhaps', 'might', 'could', 'uncertain', 'unsure', 'doubt', 'think'];

    const words = transcript.toLowerCase().split(/\s+/);
    let confidentCount = 0;
    let uncertainCount = 0;

    words.forEach(word => {
      if (confidentWords.some(cw => word.includes(cw))) confidentCount++;
      if (uncertainWords.some(uw => word.includes(uw))) uncertainCount++;
    });

    if (confidentCount > uncertainCount) {
      return 'high';
    } else if (uncertainCount > confidentCount) {
      return 'low';
    } else {
      return 'medium';
    }
  }

  // Detect emotion from voice transcript
  detectEmotion(transcript) {
    const emotionKeywords = {
      'Confident': ['confident', 'sure', 'certain', 'strong', 'bullish'],
      'Calm': ['calm', 'relaxed', 'steady', 'patient'],
      'Excited': ['excited', 'pumped', 'thrilled', 'energized'],
      'Nervous': ['nervous', 'anxious', 'worried', 'scared'],
      'Greedy': ['greedy', 'fomo', 'fear of missing out', 'rush'],
      'Fearful': ['fear', 'afraid', 'terrified', 'panic'],
      'Frustrated': ['frustrated', 'angry', 'mad', 'upset'],
      'Satisfied': ['satisfied', 'happy', 'content', 'pleased']
    };

    const words = transcript.toLowerCase().split(/\s+/);
    const emotionScores = {};

    Object.keys(emotionKeywords).forEach(emotion => {
      emotionScores[emotion] = 0;
      emotionKeywords[emotion].forEach(keyword => {
        words.forEach(word => {
          if (word.includes(keyword)) {
            emotionScores[emotion]++;
          }
        });
      });
    });

    const primaryEmotion = Object.keys(emotionScores).reduce((a, b) => 
      emotionScores[a] > emotionScores[b] ? a : b
    );

    return {
      primary: emotionScores[primaryEmotion] > 0 ? primaryEmotion : 'Calm',
      scores: emotionScores
    };
  }

  // Generate AI suggestions based on voice analysis
  generateSuggestions(transcript) {
    const suggestions = [];
    const sentiment = this.analyzeSentiment(transcript);
    const confidence = this.analyzeConfidence(transcript);
    const emotions = this.detectEmotion(transcript);

    // Sentiment-based suggestions
    if (sentiment === 'negative') {
      suggestions.push("Consider reviewing your risk management strategy");
      suggestions.push("This trade might need more analysis before execution");
    }

    // Confidence-based suggestions
    if (confidence === 'low') {
      suggestions.push("Consider waiting for a clearer setup");
      suggestions.push("Review your trading plan before entering");
    }

    // Emotion-based suggestions
    if (emotions.primary === 'Greedy') {
      suggestions.push("Be careful of FOMO - stick to your trading plan");
      suggestions.push("Consider if this trade fits your strategy");
    }

    if (emotions.primary === 'Fearful') {
      suggestions.push("Fear can lead to missed opportunities - review your analysis");
      suggestions.push("Consider if your stop loss is appropriate");
    }

    if (emotions.primary === 'Excited') {
      suggestions.push("Excitement can cloud judgment - double-check your analysis");
      suggestions.push("Make sure you're following your trading rules");
    }

    return suggestions;
  }

  // Suggest rating based on voice analysis
  suggestRating(transcript) {
    const sentiment = this.analyzeSentiment(transcript);
    const confidence = this.analyzeConfidence(transcript);
    const emotions = this.detectEmotion(transcript);

    let score = 0;

    // Sentiment scoring
    if (sentiment === 'positive') score += 2;
    else if (sentiment === 'neutral') score += 1;

    // Confidence scoring
    if (confidence === 'high') score += 2;
    else if (confidence === 'medium') score += 1;

    // Emotion scoring
    const goodEmotions = ['Confident', 'Calm', 'Satisfied'];
    const badEmotions = ['Greedy', 'Fearful', 'Frustrated'];

    if (goodEmotions.includes(emotions.primary)) score += 2;
    else if (badEmotions.includes(emotions.primary)) score -= 1;

    // Convert score to rating
    if (score >= 5) return 'A';
    else if (score >= 3) return 'B';
    else if (score >= 1) return 'C';
    else return 'D';
  }

  // Generate daily trading summary
  async generateDailySummary() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const result = await this.pool.query(`
        SELECT 
          COUNT(*) as total_trades,
          COUNT(CASE WHEN pnl > 0 THEN 1 END) as winning_trades,
          COUNT(CASE WHEN pnl < 0 THEN 1 END) as losing_trades,
          SUM(pnl) as total_pnl,
          AVG(pnl) as avg_pnl,
          AVG(CASE WHEN pnl > 0 THEN pnl END) as avg_win,
          AVG(CASE WHEN pnl < 0 THEN pnl END) as avg_loss
        FROM trades 
        WHERE DATE(entry_time) = $1
      `, [today]);

      const stats = result.rows[0];
      const winRate = stats.total_trades > 0 ? (stats.winning_trades / stats.total_trades * 100).toFixed(1) : 0;

      return {
        date: today,
        totalTrades: stats.total_trades,
        winRate: `${winRate}%`,
        totalPnl: `$${stats.total_pnl?.toFixed(2) || '0.00'}`,
        avgPnl: `$${stats.avg_pnl?.toFixed(2) || '0.00'}`,
        avgWin: `$${stats.avg_win?.toFixed(2) || '0.00'}`,
        avgLoss: `$${stats.avg_loss?.toFixed(2) || '0.00'}`,
        suggestions: this.generateDailySuggestions(stats)
      };
    } catch (error) {
      console.error('Daily summary error:', error);
      throw error;
    }
  }

  // Generate suggestions based on daily performance
  generateDailySuggestions(stats) {
    const suggestions = [];

    if (stats.total_trades === 0) {
      suggestions.push("No trades today. Consider reviewing your watchlist for opportunities.");
      return suggestions;
    }

    const winRate = stats.total_trades > 0 ? (stats.winning_trades / stats.total_trades * 100) : 0;

    if (winRate < 50) {
      suggestions.push("Win rate below 50%. Review your entry criteria and risk management.");
    }

    if (stats.total_pnl < 0) {
      suggestions.push("Negative P&L today. Consider reducing position sizes or taking a break.");
    }

    if (stats.total_trades > 10) {
      suggestions.push("High trade count. Consider being more selective with your entries.");
    }

    if (stats.avg_loss && Math.abs(stats.avg_loss) > Math.abs(stats.avg_win || 0)) {
      suggestions.push("Average loss larger than average win. Review your stop loss strategy.");
    }

    return suggestions;
  }

  // Analyze trade patterns and provide insights
  async analyzeTradePatterns() {
    try {
      const result = await this.pool.query(`
        SELECT 
          symbol,
          COUNT(*) as trade_count,
          AVG(pnl) as avg_pnl,
          COUNT(CASE WHEN pnl > 0 THEN 1 END) as wins,
          COUNT(CASE WHEN pnl < 0 THEN 1 END) as losses
        FROM trades 
        GROUP BY symbol 
        ORDER BY trade_count DESC 
        LIMIT 5
      `);

      return result.rows.map(row => ({
        symbol: row.symbol,
        tradeCount: row.trade_count,
        avgPnl: row.avg_pnl,
        winRate: row.trade_count > 0 ? (row.wins / row.trade_count * 100).toFixed(1) : 0
      }));
    } catch (error) {
      console.error('Pattern analysis error:', error);
      throw error;
    }
  }
}

module.exports = AIAnalysisService; 