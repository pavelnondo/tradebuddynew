/**
 * EmotionTag component
 * Displays emotion with consistent styling
 */

import React from 'react';
import { Emotion } from '@/types/trade';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EmotionTagProps {
  emotion: Emotion;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const emotionColors: Record<Emotion, string> = {
  confident: 'bg-green-500/20 text-green-600 border-green-500/30',
  calm: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
  excited: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
  nervous: 'bg-orange-500/20 text-orange-600 border-orange-500/30',
  frustrated: 'bg-red-500/20 text-red-600 border-red-500/30',
  greedy: 'bg-purple-500/20 text-purple-600 border-purple-500/30',
  fearful: 'bg-gray-500/20 text-gray-600 border-gray-500/30',
  fomo: 'bg-pink-500/20 text-pink-600 border-pink-500/30',
  satisfied: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30',
  disappointed: 'bg-slate-500/20 text-slate-600 border-slate-500/30',
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

export const EmotionTag: React.FC<EmotionTagProps> = ({
  emotion,
  className,
  size = 'sm',
}) => {
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  return (
    <Badge
      variant="outline"
      className={cn(
        emotionColors[emotion],
        sizeClasses[size],
        className
      )}
    >
      {capitalize(emotion)}
    </Badge>
  );
};

