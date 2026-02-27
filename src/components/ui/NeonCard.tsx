import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { ShineBorder } from './shine-border';

interface NeonCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'metric' | 'chart' | 'modal';
  shineBorder?: boolean;
}

export const NeonCard: React.FC<NeonCardProps> = ({
  children,
  className = '',
  hover = true,
  glow = false,
  onClick,
  variant = 'default',
  shineBorder = false
}) => {
  const { themeConfig } = useTheme();

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl transition-colors duration-150',
        onClick && 'cursor-pointer',
        shineBorder && 'group/neoncard',
        className
      )}
      style={{ 
        backgroundColor: themeConfig.card,
        border: `1px solid ${themeConfig.border}`,
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
      }}
      onClick={onClick}
      onMouseEnter={hover ? (e) => {
        e.currentTarget.style.borderColor = themeConfig.border;
        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.06)';
      } : undefined}
      onMouseLeave={hover ? (e) => {
        e.currentTarget.style.borderColor = themeConfig.border;
        e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
      } : undefined}
    >
      {shineBorder && (
        <ShineBorder
          borderWidth={1}
          duration={18}
          shineColor="var(--accent)"
          className="opacity-0 group-hover/neoncard:opacity-100 transition-opacity duration-500 rounded-[inherit]"
        />
      )}
      <div className={cn(shineBorder && 'relative z-10')}>
        {children}
      </div>
    </div>
  );
};
