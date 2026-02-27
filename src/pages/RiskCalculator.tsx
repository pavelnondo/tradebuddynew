/**
 * Risk Calculator - Calculate risk/reward before entering a trade
 * Inputs: Entry Price, SL, TP, Lot Size
 * Outputs: Risk $, Reward $, R:R, Risk % of account
 */

import React, { useState, useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAccountManagement } from '@/hooks/useAccountManagement';
import { PageContainer } from '@/components/layout/PageContainer';
import { NeonCard } from '@/components/ui/NeonCard';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, Target, Shield, TrendingUp, Percent } from 'lucide-react';

const INSTRUMENT_PRESETS: Record<string, number> = {
  ES: 10.47,  // SPX500 — from real trade: $89.46 / (19.03pt × 0.45) ≈ $10.47/pt
  NQ: 2,      // MNQ — $2/pt (Micro Nasdaq)
};

export default function RiskCalculator() {
  const { themeConfig } = useTheme();
  const { activeJournal } = useAccountManagement();
  const [entryPrice, setEntryPrice] = useState('');
  const [sl, setSl] = useState('');
  const [tp, setTp] = useState('');
  const [lotSize, setLotSize] = useState('');
  const [instrument, setInstrument] = useState<string>('ES');

  const entry = parseFloat(entryPrice) || 0;
  const stopLoss = parseFloat(sl) || 0;
  const takeProfit = parseFloat(tp) || 0;
  const lots = parseFloat(lotSize) || 0;
  const pointValue = INSTRUMENT_PRESETS[instrument] ?? 10;

  const results = useMemo(() => {
    if (!entry || !lots || pointValue <= 0) return null;
    const riskDistance = Math.abs(entry - stopLoss);
    const rewardDistance = Math.abs(takeProfit - entry);
    const riskAmount = riskDistance * lots * pointValue;
    const rewardAmount = rewardDistance * lots * pointValue;
    const rr = riskAmount > 0 ? rewardAmount / riskAmount : 0;
    const balance = activeJournal?.currentBalance ?? activeJournal?.initialBalance ?? 10000;
    const riskPercent = balance > 0 ? (riskAmount / balance) * 100 : 0;
    return {
      riskAmount,
      rewardAmount,
      rr,
      riskPercent,
      riskDistance,
      rewardDistance,
    };
  }, [entry, stopLoss, takeProfit, lots, pointValue, activeJournal]);

  const labelStyle = { color: themeConfig.mutedForeground };
  const inputStyle = {
    backgroundColor: themeConfig.card,
    borderColor: themeConfig.border,
    color: themeConfig.foreground,
  };

  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: themeConfig.foreground }}>
            <Calculator className="w-8 h-8" style={{ color: themeConfig.accent }} />
            Risk Calculator
          </h1>
          <p className="mt-1" style={{ color: themeConfig.mutedForeground }}>
            Enter entry, SL, TP and lot size to see how much you're risking
          </p>
        </div>

        <NeonCard className="p-6" hover={false} shineBorder>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: themeConfig.foreground }}>
            <Target className="w-5 h-5" style={{ color: themeConfig.accent }} />
            Trade Parameters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium" style={labelStyle}>Entry Price</Label>
              <Input
                type="number"
                step="any"
                placeholder="e.g. 6830"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="mt-1.5 rounded-xl"
                style={inputStyle}
              />
            </div>
            <div>
              <Label className="text-sm font-medium" style={labelStyle}>Stop Loss</Label>
              <Input
                type="number"
                step="any"
                placeholder="e.g. 6810"
                value={sl}
                onChange={(e) => setSl(e.target.value)}
                className="mt-1.5 rounded-xl"
                style={inputStyle}
              />
            </div>
            <div>
              <Label className="text-sm font-medium" style={labelStyle}>Take Profit</Label>
              <Input
                type="number"
                step="any"
                placeholder="e.g. 6878"
                value={tp}
                onChange={(e) => setTp(e.target.value)}
                className="mt-1.5 rounded-xl"
                style={inputStyle}
              />
            </div>
            <div>
              <Label className="text-sm font-medium" style={labelStyle}>Lot Size (contracts)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g. 0.1 or 0.45"
                value={lotSize}
                onChange={(e) => setLotSize(e.target.value)}
                className="mt-1.5 rounded-xl"
                style={inputStyle}
              />
            </div>
            <div>
              <Label className="text-sm font-medium" style={labelStyle}>Instrument</Label>
              <Select value={instrument} onValueChange={setInstrument}>
                <SelectTrigger className="mt-1.5 rounded-xl" style={inputStyle}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ES">ES (SPX500) — $10/pt</SelectItem>
                  <SelectItem value="NQ">NQ (MNQ) — $2/pt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </NeonCard>

        {results && (
          <NeonCard className="p-6" hover={false} shineBorder>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: themeConfig.foreground }}>
              <Shield className="w-5 h-5" style={{ color: themeConfig.accent }} />
              Results
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl p-4" style={{ backgroundColor: `${themeConfig.destructive}15`, border: `1px solid ${themeConfig.border}` }}>
                <div className="flex items-center gap-2 text-sm" style={{ color: themeConfig.mutedForeground }}>
                  <Shield className="w-4 h-4" />
                  Risk Amount
                </div>
                <p className="text-2xl font-bold mt-1" style={{ color: themeConfig.destructive }}>
                  ${results.riskAmount.toFixed(2)}
                </p>
              </div>
              <div className="rounded-xl p-4" style={{ backgroundColor: `${themeConfig.success}15`, border: `1px solid ${themeConfig.border}` }}>
                <div className="flex items-center gap-2 text-sm" style={{ color: themeConfig.mutedForeground }}>
                  <TrendingUp className="w-4 h-4" />
                  Reward Amount
                </div>
                <p className="text-2xl font-bold mt-1" style={{ color: themeConfig.success }}>
                  ${results.rewardAmount.toFixed(2)}
                </p>
              </div>
              <div className="rounded-xl p-4" style={{ backgroundColor: `${themeConfig.accent}15`, border: `1px solid ${themeConfig.border}` }}>
                <div className="flex items-center gap-2 text-sm" style={{ color: themeConfig.mutedForeground }}>
                  <Target className="w-4 h-4" />
                  Risk:Reward
                </div>
                <p className="text-2xl font-bold mt-1" style={{ color: themeConfig.accent }}>
                  1:{results.rr.toFixed(2)}
                </p>
              </div>
              <div className="rounded-xl p-4" style={{ backgroundColor: themeConfig.card, border: `1px solid ${themeConfig.border}` }}>
                <div className="flex items-center gap-2 text-sm" style={{ color: themeConfig.mutedForeground }}>
                  <Percent className="w-4 h-4" />
                  Risk % of Account
                </div>
                <p className="text-2xl font-bold mt-1" style={{ color: themeConfig.foreground }}>
                  {results.riskPercent.toFixed(2)}%
                </p>
              </div>
            </div>
            <p className="text-sm mt-3" style={{ color: themeConfig.mutedForeground }}>
              Risk distance: {results.riskDistance.toFixed(4)} · Reward distance: {results.rewardDistance.toFixed(4)}
            </p>
          </NeonCard>
        )}

        {entry && lots && !results && (
          <NeonCard className="p-6" hover={false} shineBorder>
            <p style={{ color: themeConfig.mutedForeground }}>
              Enter entry price and lot size to calculate risk.
            </p>
          </NeonCard>
        )}
      </div>
    </PageContainer>
  );
}
