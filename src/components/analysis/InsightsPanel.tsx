
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface AssetData {
  asset: string;
  profitLoss: number;
  winRate: number;
  trades: number;
}

interface InsightsPanelProps {
  bestAsset?: AssetData;
  worstAsset?: AssetData;
  bestEmotion?: { emotion: string; winRate: number };
  bestTradeType?: { type: string; profitLoss: number };
  bestHour?: { hour: number; winRate: number; profitLoss: number };
}

export function InsightsPanel({ 
  bestAsset,
  worstAsset,
  bestEmotion,
  bestTradeType,
  bestHour
}: InsightsPanelProps) {
  if (!bestAsset && !worstAsset && !bestEmotion && !bestTradeType && !bestHour) {
    return null;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Insights</CardTitle>
        <CardDescription>
          System-generated insights based on your trading history
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {bestAsset && (
          <div>
            <h3 className="font-semibold mb-1">Best Performing Asset</h3>
            <p className="text-sm">
              <strong>{bestAsset.asset}</strong> has been your most profitable asset, 
              with a total profit of <strong>${bestAsset.profitLoss.toFixed(2)}</strong> and a win rate of{' '}
              <strong>{bestAsset.winRate.toFixed(1)}%</strong> across {bestAsset.trades} trades.
            </p>
          </div>
        )}
        
        {worstAsset && (
          <div>
            <h3 className="font-semibold mb-1">Underperforming Asset</h3>
            <p className="text-sm">
              <strong>{worstAsset.asset}</strong> has been your least profitable asset,
              with a total loss of <strong>${Math.abs(worstAsset.profitLoss).toFixed(2)}</strong> and a win rate of{' '}
              <strong>{worstAsset.winRate.toFixed(1)}%</strong>. Consider revising your strategy for this asset.
            </p>
          </div>
        )}
        
        {bestEmotion && (
          <div>
            <h3 className="font-semibold mb-1">Optimal Trading Mindset</h3>
            <p className="text-sm">
              You perform best when trading with a <strong>{bestEmotion.emotion}</strong> mindset,
              achieving a win rate of <strong>{bestEmotion.winRate.toFixed(1)}%</strong>.
            </p>
          </div>
        )}
        
        {bestTradeType && (
          <div>
            <h3 className="font-semibold mb-1">Best Trade Direction</h3>
            <p className="text-sm">
              <strong>{bestTradeType.type}</strong> trades have performed best for you,
              generating <strong>${bestTradeType.profitLoss.toFixed(2)}</strong> in profits.
            </p>
          </div>
        )}
        
        {bestHour && (
          <div>
            <h3 className="font-semibold mb-1">Optimal Trading Time</h3>
            <p className="text-sm">
              Trading at <strong>{bestHour.hour}:00</strong> has been most profitable for you,
              with a win rate of <strong>{bestHour.winRate.toFixed(1)}%</strong> and 
              P&L of <strong>${bestHour.profitLoss.toFixed(2)}</strong>.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
