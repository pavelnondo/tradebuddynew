import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { Loader2 } from 'lucide-react';

interface NeonButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  icon?: React.ReactNode;
}

export const NeonButton: React.FC<NeonButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  type = 'button',
  icon
}) => {
  const { themeConfig } = useTheme();

  // Size configurations
  const sizeConfig = {
    sm: { padding: 'px-3 py-1.5', text: 'text-sm', icon: 'w-3.5 h-3.5' },
    md: { padding: 'px-5 py-2.5', text: 'text-base', icon: 'w-4 h-4' },
    lg: { padding: 'px-7 py-3.5', text: 'text-lg', icon: 'w-5 h-5' }
  };

  // Variant configurations with proper theming
  const getVariantStyles = () => {
    const baseStyle = {
      transition: 'all 0.2s ease',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: themeConfig.accent,
          color: themeConfig.accentForeground || '#ffffff',
          border: `1px solid ${themeConfig.accent}`,
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        };
      
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: themeConfig.card,
          color: themeConfig.foreground,
          border: `1px solid ${themeConfig.border}`,
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
        };
      
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          color: themeConfig.foreground,
          border: `2px solid transparent`
        };
      
      case 'destructive':
        return {
          ...baseStyle,
          backgroundColor: themeConfig.destructive,
          color: '#ffffff',
          border: `1px solid ${themeConfig.destructive}`,
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        };
      
      case 'success':
        return {
          ...baseStyle,
          backgroundColor: themeConfig.success,
          color: '#ffffff',
          border: `1px solid ${themeConfig.success}`,
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        };
      
      default:
        return baseStyle;
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    const target = e.currentTarget;
    if (variant === 'primary' || variant === 'destructive' || variant === 'success') {
      target.style.opacity = '0.92';
    } else if (variant === 'secondary') {
      target.style.backgroundColor = `${themeConfig.accent}08`;
      target.style.borderColor = `${themeConfig.border}`;
    } else if (variant === 'ghost') {
      target.style.backgroundColor = `${themeConfig.accent}08`;
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    const target = e.currentTarget;
    const s = getVariantStyles();
    target.style.opacity = String(s.opacity ?? 1);
    target.style.backgroundColor = (s as { backgroundColor?: string }).backgroundColor || '';
    const border = (s as { border?: string }).border;
    if (border && border.includes('solid')) {
      target.style.borderColor = border.split(' ')[2] || '';
    }
  };

  return (
    <motion.button
      type={type}
      className={`relative inline-flex items-center justify-center gap-2 rounded-lg font-medium ${sizeConfig[size].padding} ${sizeConfig[size].text} ${className}`}
      style={getVariantStyles()}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {loading && (
        <Loader2 className={`${sizeConfig[size].icon} animate-spin`} />
      )}
      {!loading && icon && (
        <span className={sizeConfig[size].icon}>{icon}</span>
      )}
      <span className={loading ? 'opacity-70' : 'opacity-100'}>
        {children}
      </span>
    </motion.button>
  );
};
