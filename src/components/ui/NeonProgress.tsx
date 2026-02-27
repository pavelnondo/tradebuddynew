import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

interface NeonProgressProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
  animated?: boolean;
}

export const NeonProgress: React.FC<NeonProgressProps> = ({
  value,
  max = 100,
  label,
  showPercentage = true,
  size = 'md',
  glow = true,
  animated = true
}) => {
  const { themeConfig } = useTheme();

  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  return (
    <motion.div
      className="space-y-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {(label || showPercentage) && (
        <div className="flex justify-between items-center">
          {label && (
            <span className="text-sm font-medium text-foreground">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="text-sm font-bold neon-text">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      
      <div className={`neon-progress ${sizeClasses[size]}`}>
        <motion.div
          className="neon-progress-bar"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ 
            duration: animated ? 1 : 0,
            ease: "easeOut"
          }}
        />
      </div>
    </motion.div>
  );
};
