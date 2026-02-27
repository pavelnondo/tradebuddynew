/**
 * Advanced Filter Bar - Modern Magic UI style filter component
 * Replaces the basic HTML select-based filter bar
 */

"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { ChevronDown, X, Filter, SlidersHorizontal } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { cn } from '@/lib/utils';

export interface FilterValues {
  session?: string;
  winLoss?: string;
  rMin?: string;
  rMax?: string;
  riskMin?: string;
  riskMax?: string;
  checklistMin?: string;
  checklistMax?: string;
  emotion?: string;
  setupType?: string;
  tradeGrade?: string;
}

interface AdvancedFilterBarProps {
  filters: FilterValues;
  onFilterChange: (filters: FilterValues) => void;
  className?: string;
}

export function AdvancedFilterBar({
  filters,
  onFilterChange,
  className,
}: AdvancedFilterBarProps) {
  const { themeConfig } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [activeFilters, setActiveFilters] = useState(0);

  // Count active filters
  React.useEffect(() => {
    let count = 0;
    if (filters.session) count++;
    if (filters.winLoss && filters.winLoss !== 'all') count++;
    if (filters.rMin || filters.rMax) count++;
    if (filters.riskMin || filters.riskMax) count++;
    if (filters.checklistMin || filters.checklistMax) count++;
    if (filters.emotion) count++;
    if (filters.setupType) count++;
    if (filters.tradeGrade) count++;
    setActiveFilters(count);
  }, [filters]);

  const updateFilter = (key: keyof FilterValues, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilter = (key: keyof FilterValues) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFilterChange(newFilters);
  };

  const clearAll = () => {
    onFilterChange({});
  };

  const FilterSelect = ({
    label,
    value,
    onChange,
    options,
    placeholder = "Any",
  }: {
    label: string;
    value?: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
  }) => {
    const [open, setOpen] = useState(false);
    const selected = options.find((o) => o.value === value);

    return (
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
            "border hover:border-opacity-80"
          )}
          style={{
            backgroundColor: themeConfig.card,
            borderColor: value ? themeConfig.accent : themeConfig.border,
            color: themeConfig.foreground,
          }}
        >
          <span className="text-xs" style={{ color: themeConfig.mutedForeground }}>
            {label}:
          </span>
          <span>{selected?.label || placeholder}</span>
          <ChevronDown
            className={cn("w-3 h-3 transition-transform", open && "rotate-180")}
            style={{ color: themeConfig.mutedForeground }}
          />
        </button>

        <AnimatePresence>
          {open && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full mt-1 z-50 rounded-lg border shadow-lg min-w-[160px] overflow-hidden"
                style={{
                  backgroundColor: themeConfig.popover,
                  borderColor: themeConfig.border,
                }}
              >
                {options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm transition-colors",
                      value === option.value && "font-medium"
                    )}
                    style={{
                      backgroundColor:
                        value === option.value
                          ? `${themeConfig.accent}15`
                          : 'transparent',
                      color:
                        value === option.value
                          ? themeConfig.accent
                          : themeConfig.foreground,
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const RangeInput = ({
    label,
    minValue,
    maxValue,
    onMinChange,
    onMaxChange,
    placeholder = { min: "min", max: "max" },
  }: {
    label: string;
    minValue?: string;
    maxValue?: string;
    onMinChange: (value: string) => void;
    onMaxChange: (value: string) => void;
    placeholder?: { min: string; max: string };
  }) => {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium whitespace-nowrap" style={{ color: themeConfig.mutedForeground }}>
          {label}:
        </span>
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            placeholder={placeholder.min}
            value={minValue || ''}
            onChange={(e) => onMinChange(e.target.value)}
            className="w-20 h-8 text-sm"
            style={{
              backgroundColor: themeConfig.bg,
              borderColor: themeConfig.border,
              color: themeConfig.foreground,
            }}
          />
          <span style={{ color: themeConfig.mutedForeground }}>–</span>
          <Input
            type="number"
            placeholder={placeholder.max}
            value={maxValue || ''}
            onChange={(e) => onMaxChange(e.target.value)}
            className="w-20 h-8 text-sm"
            style={{
              backgroundColor: themeConfig.bg,
              borderColor: themeConfig.border,
              color: themeConfig.foreground,
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div
      className={cn("rounded-xl border p-4", className)}
      style={{
        backgroundColor: themeConfig.card,
        borderColor: themeConfig.border,
      }}
    >
      {/* Main Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-shrink-0">
          <SlidersHorizontal className="w-4 h-4" style={{ color: themeConfig.accent }} />
          <span className="text-sm font-semibold" style={{ color: themeConfig.foreground }}>
            Filters
          </span>
          {activeFilters > 0 && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `${themeConfig.accent}20`,
                color: themeConfig.accent,
              }}
            >
              {activeFilters}
            </span>
          )}
        </div>

        <FilterSelect
          label="Session"
          value={filters.session}
          onChange={(v) => updateFilter('session', v)}
          options={[
            { value: '', label: 'Any' },
            { value: 'Asia', label: 'Asia' },
            { value: 'London', label: 'London' },
            { value: 'NewYork', label: 'New York' },
            { value: 'Other', label: 'Other' },
          ]}
        />

        <FilterSelect
          label="Outcome"
          value={filters.winLoss}
          onChange={(v) => updateFilter('winLoss', v)}
          options={[
            { value: 'all', label: 'Any' },
            { value: 'win', label: 'Wins' },
            { value: 'loss', label: 'Losses' },
            { value: 'breakeven', label: 'Breakeven' },
          ]}
        />

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: themeConfig.mutedForeground }}>
            R:
          </span>
          <FilterSelect
            label=""
            value={
              filters.rMin === '1' && !filters.rMax
                ? 'ge1'
                : filters.rMin === '2' && !filters.rMax
                ? 'ge2'
                : filters.rMin === '3' && !filters.rMax
                ? 'ge3'
                : filters.rMax === '-1' && !filters.rMin
                ? 'le-1'
                : filters.rMin || filters.rMax
                ? 'custom'
                : ''
            }
            onChange={(v) => {
              if (v === 'ge1') updateFilter('rMin', '1');
              else if (v === 'ge2') updateFilter('rMin', '2');
              else if (v === 'ge3') updateFilter('rMin', '3');
              else if (v === 'le-1') updateFilter('rMax', '-1');
              else if (v === '') {
                clearFilter('rMin');
                clearFilter('rMax');
              }
            }}
            options={[
              { value: '', label: 'Any' },
              { value: 'ge1', label: '≥ 1' },
              { value: 'ge2', label: '≥ 2' },
              { value: 'ge3', label: '≥ 3' },
              { value: 'le-1', label: '≤ -1' },
              { value: 'custom', label: 'Custom' },
            ]}
          />
          {(filters.rMin || filters.rMax) && (
            <RangeInput
              label=""
              minValue={filters.rMin}
              maxValue={filters.rMax}
              onMinChange={(v) => updateFilter('rMin', v)}
              onMaxChange={(v) => updateFilter('rMax', v)}
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: themeConfig.mutedForeground }}>
            Risk %:
          </span>
          <FilterSelect
            label=""
            value={
              filters.riskMax === '0.5' && !filters.riskMin
                ? 'le05'
                : filters.riskMax === '1' && !filters.riskMin
                ? 'le1'
                : filters.riskMax === '2' && !filters.riskMin
                ? 'le2'
                : filters.riskMin === '1' && !filters.riskMax
                ? 'ge1'
                : filters.riskMin || filters.riskMax
                ? 'custom'
                : ''
            }
            onChange={(v) => {
              if (v === 'le05') updateFilter('riskMax', '0.5');
              else if (v === 'le1') updateFilter('riskMax', '1');
              else if (v === 'le2') updateFilter('riskMax', '2');
              else if (v === 'ge1') updateFilter('riskMin', '1');
              else if (v === '') {
                clearFilter('riskMin');
                clearFilter('riskMax');
              }
            }}
            options={[
              { value: '', label: 'Any' },
              { value: 'le05', label: '≤ 0.5%' },
              { value: 'le1', label: '≤ 1%' },
              { value: 'le2', label: '≤ 2%' },
              { value: 'ge1', label: '≥ 1%' },
              { value: 'custom', label: 'Custom' },
            ]}
          />
          {(filters.riskMin || filters.riskMax) && (
            <RangeInput
              label=""
              minValue={filters.riskMin}
              maxValue={filters.riskMax}
              onMinChange={(v) => updateFilter('riskMin', v)}
              onMaxChange={(v) => updateFilter('riskMax', v)}
            />
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="ml-auto"
        >
          <Filter className="w-4 h-4 mr-1" />
          More filters
          <ChevronDown
            className={cn("w-3 h-3 ml-1 transition-transform", expanded && "rotate-180")}
          />
        </Button>

        {activeFilters > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-xs"
          >
            <X className="w-3 h-3 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      {/* Expanded Filters */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t"
              style={{ borderColor: themeConfig.border }}
            >
              <RangeInput
                label="Checklist %"
                minValue={filters.checklistMin}
                maxValue={filters.checklistMax}
                onMinChange={(v) => updateFilter('checklistMin', v)}
                onMaxChange={(v) => updateFilter('checklistMax', v)}
              />

              <FilterSelect
                label="Emotion"
                value={filters.emotion}
                onChange={(v) => updateFilter('emotion', v)}
                options={[
                  { value: '', label: 'Any' },
                  { value: 'confident', label: 'Confident' },
                  { value: 'calm', label: 'Calm' },
                  { value: 'excited', label: 'Excited' },
                  { value: 'nervous', label: 'Nervous' },
                  { value: 'frustrated', label: 'Frustrated' },
                  { value: 'greedy', label: 'Greedy' },
                  { value: 'fearful', label: 'Fearful' },
                ]}
              />

              <FilterSelect
                label="Setup Type"
                value={filters.setupType}
                onChange={(v) => updateFilter('setupType', v)}
                options={[
                  { value: '', label: 'Any' },
                  { value: 'breakout', label: 'Breakout' },
                  { value: 'pullback', label: 'Pullback' },
                  { value: 'reversal', label: 'Reversal' },
                ]}
              />

              <FilterSelect
                label="Grade"
                value={filters.tradeGrade}
                onChange={(v) => updateFilter('tradeGrade', v)}
                options={[
                  { value: '', label: 'Any' },
                  { value: 'A', label: 'A' },
                  { value: 'B', label: 'B' },
                  { value: 'C', label: 'C' },
                ]}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
