import React from 'react';

interface TradeDay {
  date: string; // YYYY-MM-DD
  pnl: number;
  tradeCount: number;
}

interface TradeCalendarProps {
  days: TradeDay[];
  month: number; // 0-11
  year: number;
  onDayClick?: (day: TradeDay) => void;
}

function getDaysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(month: number, year: number) {
  return new Date(year, month, 1).getDay();
}

export const TradeCalendar: React.FC<TradeCalendarProps> = ({ days, month, year, onDayClick }) => {
  const daysInMonth = getDaysInMonth(month, year);
  const firstDayOfWeek = getFirstDayOfWeek(month, year);
  const calendarDays: (TradeDay | null)[] = [];

  // Fill leading empty days
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }

  // Fill actual days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayData = days.find(day => day.date === dateStr) || { date: dateStr, pnl: 0, tradeCount: 0 };
    calendarDays.push(dayData);
  }

  // Fill trailing empty days
  while (calendarDays.length % 7 !== 0) {
    calendarDays.push(null);
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
        <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day, idx) => {
          if (!day) return <div key={idx} className="h-16 bg-transparent" />;
          let bg = 'bg-gray-200 dark:bg-gray-700';
          if (day.tradeCount > 0) {
            bg = day.pnl > 0 ? 'bg-green-200 dark:bg-green-700' : day.pnl < 0 ? 'bg-red-200 dark:bg-red-700' : 'bg-gray-300 dark:bg-gray-600';
          }
          return (
            <div
              key={day.date}
              className={`h-16 rounded-lg flex flex-col items-center justify-center ${bg} p-1 cursor-pointer transition hover:ring-2 hover:ring-primary/60`}
              onClick={() => onDayClick?.(day)}
            >
              <div className="text-xs font-bold text-gray-700 dark:text-gray-100">{parseInt(day.date.split('-')[2], 10)}</div>
              <div className="text-xs font-mono">
                {day.tradeCount > 0 ? `$${day.pnl.toFixed(2)}` : ''}
              </div>
              <div className="text-[10px] text-gray-500 dark:text-gray-300">
                {day.tradeCount > 0 ? `${day.tradeCount} trade${day.tradeCount > 1 ? 's' : ''}` : ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}; 