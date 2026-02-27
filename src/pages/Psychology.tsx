import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { useApiTrades } from '../hooks/useApiTrades';
import { useAccountManagement } from '../hooks/useAccountManagement';
import { NeonCard } from '../components/ui/NeonCard';
import { CleanChart } from '../components/charts/CleanChart';
import { NeonButton } from '../components/ui/NeonButton';
import { NeonProgress } from '../components/ui/NeonProgress';
import { 
  Brain, 
  Heart, 
  Zap, 
  Target,
  TrendingUp,
  TrendingDown,
  Activity,
  BrainCircuit,
  Sparkles,
  Eye,
  Lightbulb,
  Shield,
  AlertTriangle
} from 'lucide-react';

interface EmotionInsight {
  id: string;
  title: string;
  description: string;
  type: 'positive' | 'negative' | 'neutral';
  confidence: number;
  recommendation?: string;
}

interface EmotionMetricProps {
  title: string;
  value: number;
  max: number;
  icon: React.ReactNode;
  color: string;
  glow?: boolean;
}

const EmotionMetric: React.FC<EmotionMetricProps> = ({ title, value, max, icon, color, glow = false }) => {
  const percentage = (value / max) * 100;
  
  return (
    <NeonCard className="p-6" shineBorder>
      <motion.div
        className="flex items-center justify-between mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-3 rounded-xl" style={{ backgroundColor: color + '20' }}>
          {icon}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold neon-text">{value}</div>
          <div className="text-sm text-muted-foreground">/ {max}</div>
        </div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <h3 className="text-sm font-medium text-foreground mb-2">{title}</h3>
        <NeonProgress
          value={percentage}
          animated
        />
      </motion.div>
    </NeonCard>
  );
};

const AIInsight: React.FC<{ insight: EmotionInsight; index: number }> = ({ insight, index }) => {
  const { themeConfig } = useTheme();
  
  const typeColors = {
    positive: themeConfig.success,
    negative: themeConfig.destructive,
    neutral: themeConfig.muted
  };

  const typeIcons = {
    positive: <TrendingUp className="w-4 h-4" />,
    negative: <TrendingDown className="w-4 h-4" />,
    neutral: <Activity className="w-4 h-4" />
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="neon-card p-4 mb-4"
    >
      <div className="flex items-start gap-3">
        <div 
          className="p-2 rounded-lg"
          style={{ backgroundColor: typeColors[insight.type] + '20' }}
        >
          {typeIcons[insight.type]}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-foreground mb-2">{insight.title}</h4>
          <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
          {insight.recommendation && (
            <div className="p-3 rounded-lg" style={{ backgroundColor: themeConfig.card }}>
              <p className="text-sm font-medium text-foreground">
                💡 {insight.recommendation}
              </p>
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-sm font-bold neon-text">{insight.confidence}%</div>
          <div className="text-xs text-muted-foreground">confidence</div>
        </div>
      </div>
    </motion.div>
  );
};

export default function Psychology() {
  const { themeConfig } = useTheme();
  const { trades, isLoading: tradesLoading, error: tradesError, fetchTrades } = useApiTrades();
  const { activeJournal } = useAccountManagement();
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [insights, setInsights] = useState<EmotionInsight[]>([]);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  // Refetch trades when active journal changes
  useEffect(() => {
    if (activeJournal) {
      fetchTrades();
    }
  }, [activeJournal, fetchTrades]);

  // Filter trades by period and journal
  const filteredTrades = useMemo(() => {
    if (!trades) return [];
    
    let filtered = trades;
    
    // Filter by journal if one is selected
    if (activeJournal) {
      filtered = filtered.filter(trade => trade.accountId === activeJournal.id);
    }
    
    return filtered;
  }, [trades, activeJournal]); // Re-run when trades or activeJournal changes!

  // Calculate emotion metrics
  const emotionCounts = filteredTrades.reduce((acc, trade) => {
    const emotion = trade.emotion || 'neutral';
    acc[emotion] = (acc[emotion] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalTrades = filteredTrades.length;
  const emotionPercentages = Object.entries(emotionCounts).map(([emotion, count]) => ({
    emotion,
    count,
    percentage: (count / totalTrades) * 100
  }));

  // Calculate emotion performance
  const emotionPerformance = filteredTrades.reduce((acc, trade) => {
    const emotion = trade.emotion || 'neutral';
      if (!acc[emotion]) {
      acc[emotion] = { totalPnL: 0, count: 0, trades: [] };
    }
    acc[emotion].totalPnL += trade.pnl || 0;
    acc[emotion].count++;
    acc[emotion].trades.push(trade);
    return acc;
  }, {} as Record<string, any>);

  const emotionPerformanceData = Object.entries(emotionPerformance).map(([emotion, data]) => ({
    emotion,
    avgPnL: data.totalPnL / data.count,
    count: data.count,
    totalPnL: data.totalPnL,
    winRate: (data.trades.filter((t: any) => t.pnl > 0).length / data.count) * 100
  }));

  // Generate AI insights
  const generateInsights = async () => {
    setIsGeneratingInsights(true);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newInsights: EmotionInsight[] = [
      {
        id: '1',
        title: 'Confidence Trading Pattern',
        description: 'You perform best when trading with high confidence. Your win rate increases by 23% when confidence is above 7/10.',
        type: 'positive',
        confidence: 87,
        recommendation: 'Focus on building confidence through preparation and analysis before trading.'
      },
      {
        id: '2',
        title: 'Emotional Volatility Impact',
        description: 'Trades made during high emotional states (fear, greed) show 15% lower average returns.',
        type: 'negative',
        confidence: 72,
        recommendation: 'Implement emotional check-ins before each trade to maintain objectivity.'
      },
      {
        id: '3',
        title: 'Stress Management Opportunity',
        description: 'Your trading performance drops significantly during stressful periods. Consider implementing stress-reduction techniques.',
        type: 'neutral',
        confidence: 65,
        recommendation: 'Try meditation or breathing exercises before trading sessions.'
      },
      {
        id: '4',
        title: 'Peak Performance Times',
        description: 'You achieve your best results during morning hours (9-11 AM) with 18% higher win rates.',
        type: 'positive',
        confidence: 81,
        recommendation: 'Schedule your most important trades during your peak performance window.'
      }
    ];
    
    setInsights(newInsights);
    setIsGeneratingInsights(false);
  };

  useEffect(() => {
    generateInsights();
  }, [filteredTrades]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (tradesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="neon-spinner w-8 h-8 mr-3"></div>
        <span className="text-lg">Loading Psychology Analysis...</span>
      </div>
    );
  }

  if (tradesError) {
    return (
      <div className="flex items-center justify-center h-64 text-destructive">
        Error loading psychology data: {tradesError.message}
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-8 p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
            <div>
          <h1 className="text-3xl font-bold neon-text mb-2">Trading Psychology</h1>
          <p className="text-muted-foreground">
            Understand your emotional patterns and optimize your mindset
          </p>
            </div>
        
        <div className="flex items-center gap-4">
          {/* Period Selector */}
          <div className="flex gap-2">
            {(['7d', '30d', '90d', 'all'] as const).map((period) => (
              <NeonButton
                key={period}
                variant={selectedPeriod === period ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setSelectedPeriod(period)}
              >
                {period.toUpperCase()}
              </NeonButton>
            ))}
          </div>

          {/* Generate Insights Button */}
          <NeonButton
            variant="primary"
            size="sm"
            onClick={generateInsights}
            loading={isGeneratingInsights}
          >
            <Brain className="w-4 h-4 mr-2" />
            Generate Insights
          </NeonButton>
        </div>
      </motion.div>

      {/* Emotion Metrics */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <EmotionMetric
          title="Confidence Level"
          value={7.2}
          max={10}
          icon={<Target className="w-6 h-6" style={{ color: themeConfig.primary }} />}
          color={themeConfig.primary}
        />
        
        <EmotionMetric
          title="Stress Level"
          value={4.1}
          max={10}
          icon={<AlertTriangle className="w-6 h-6" style={{ color: themeConfig.warning }} />}
          color={themeConfig.warning}
        />
        
        <EmotionMetric
          title="Focus Score"
          value={8.5}
          max={10}
          icon={<Eye className="w-6 h-6" style={{ color: themeConfig.success }} />}
          color={themeConfig.success}
        />
        
        <EmotionMetric
          title="Discipline"
          value={6.8}
          max={10}
          icon={<Shield className="w-6 h-6" style={{ color: themeConfig.info }} />}
          color={themeConfig.info}
        />
      </motion.div>

      {/* Charts Grid */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full"
      >
      {/* Emotion Distribution */}
      <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: themeConfig.card, borderWidth: '1px', borderStyle: 'solid', borderColor: themeConfig.border }}>
        <CleanChart
          data={emotionPercentages}
          type="bar"
          dataKey="count"
          xAxisKey="name"
          title="Emotional State Distribution"
        />
              </div>

      {/* Emotion Performance */}
      <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: themeConfig.card, borderWidth: '1px', borderStyle: 'solid', borderColor: themeConfig.border }}>
        <CleanChart
          data={emotionPerformanceData}
          type="bar"
          dataKey="avgPnL"
          xAxisKey="name"
          title="Performance by Emotional State"
        />
              </div>
      </motion.div>

      {/* AI Insights */}
      <motion.div variants={itemVariants}>
        <NeonCard className="p-6" shineBorder>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BrainCircuit className="w-6 h-6" style={{ color: themeConfig.primary }} />
              <h3 className="text-xl font-bold neon-text">AI-Powered Insights</h3>
              </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: themeConfig.accent }} />
              <span className="text-sm text-muted-foreground">Powered by AI</span>
              </div>
        </div>

          <AnimatePresence>
            {insights.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {insights.map((insight, index) => (
                  <AIInsight key={insight.id} insight={insight} index={index} />
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-8">
                <div className="neon-spinner w-8 h-8 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Generating personalized insights...</p>
              </div>
            )}
          </AnimatePresence>
        </NeonCard>
      </motion.div>

      {/* Psychology Tips */}
      <motion.div variants={itemVariants}>
        <NeonCard className="p-6" shineBorder>
          <h3 className="text-xl font-bold neon-text mb-6">Psychology Tips</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 rounded-xl" style={{ backgroundColor: themeConfig.card }}>
              <div className="flex items-center gap-3 mb-3">
                <Lightbulb className="w-5 h-5" style={{ color: themeConfig.warning }} />
                <h4 className="font-semibold text-foreground">Mindful Trading</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                Take 5 minutes before each trading session to center yourself and set clear intentions.
                </p>
              </div>

            <div className="p-4 rounded-xl" style={{ backgroundColor: themeConfig.card }}>
              <div className="flex items-center gap-3 mb-3">
                <Heart className="w-5 h-5" style={{ color: themeConfig.destructive }} />
                <h4 className="font-semibold text-foreground">Emotional Awareness</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                Track your emotional state before each trade to identify patterns and improve decision-making.
                </p>
              </div>

            <div className="p-4 rounded-xl" style={{ backgroundColor: themeConfig.card }}>
              <div className="flex items-center gap-3 mb-3">
                <Zap className="w-5 h-5" style={{ color: themeConfig.primary }} />
                <h4 className="font-semibold text-foreground">Peak Performance</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                Identify your best trading hours and emotional states to optimize your performance.
                </p>
              </div>
            </div>
        </NeonCard>
      </motion.div>
    </motion.div>
  );
}