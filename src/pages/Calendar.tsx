import React from "react";
import { useApiTrades } from "@/hooks/useApiTrades";

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const month = "May 2024";

function getMonthYear(date: Date) {
  return `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export default function Calendar() {
  const { trades, isLoading, error } = useApiTrades();

  // For now, use current month
  const today = new Date();
  const year = today.getFullYear();
  const monthIdx = today.getMonth();
  const daysInMonth = getDaysInMonth(year, monthIdx);
  const firstDayOffset = new Date(year, monthIdx, 1).getDay();

  // Aggregate profit/loss by date (YYYY-MM-DD)
  const profitByDate: Record<string, number> = {};
  trades.forEach(trade => {
    if (!trade.date) return;
    const d = new Date(trade.date);
    if (d.getFullYear() === year && d.getMonth() === monthIdx) {
      const key = d.toISOString().slice(0, 10);
      profitByDate[key] = (profitByDate[key] || 0) + (trade.profitLoss || 0);
    }
  });

  // Build calendar grid
  const grid = [];
  let day = 1;
  for (let i = 0; i < 6 * 7; i++) {
    if (i < firstDayOffset || day > daysInMonth) {
      grid.push(null);
    } else {
      grid.push(day);
      day++;
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Profitability Calendar</h1>
        <div className="flex space-x-2">
          <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="px-4 py-1 font-medium">{getMonthYear(today)}</span>
          <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <span className="text-muted-foreground">Loading trades...</span>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-8">{error}</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
            {daysOfWeek.map((d) => (
              <div key={d} className="bg-gray-100 dark:bg-gray-800 py-2 text-center text-sm font-medium">{d}</div>
            ))}
          </div>
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
            {grid.map((d, i) => {
              let profit = null;
              if (d) {
                const key = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                profit = profitByDate[key];
              }
              return (
                <div key={i} className="calendar-day bg-white dark:bg-gray-900 h-24 p-1 relative group">
                  {d && <div className="absolute top-1 right-1 text-xs">{d}</div>}
                  {d && profit !== undefined && profit !== 0 && (
                    <div className={`${profit >= 0 ? "profit-gradient" : "loss-gradient"} text-white text-xs font-medium rounded p-1 mt-5 text-center`}>
                      {profit >= 0 ? "+" : ""}${profit.toFixed(0)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div className="mt-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
            <span className="text-sm">Profitable days</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
            <span className="text-sm">Losing days</span>
          </div>
        </div>
        <button className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
          View detailed monthly report
        </button>
      </div>
    </div>
  );
} 