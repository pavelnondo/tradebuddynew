import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

interface NeonToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
}

export const NeonToggle: React.FC<NeonToggleProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  size = 'md',
  glow = false
}) => {
  const { themeConfig } = useTheme();

  const sizeClasses = {
    sm: 'h-4 w-7',
    md: 'h-6 w-11',
    lg: 'h-8 w-14'
  };

  const thumbSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-6 w-6'
  };

  const translateClasses = {
    sm: 'translate-x-3',
    md: 'translate-x-5',
    lg: 'translate-x-6'
  };

  return (
    <motion.div
      className="flex items-center space-x-3"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.button
        type="button"
        className={`neon-toggle ${sizeClasses[size]} ${checked ? 'checked' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        whileHover={!disabled ? { scale: 1.05 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
        animate={{
          backgroundColor: checked ? themeConfig.accent : themeConfig.border
        }}
        transition={{ duration: 0.2 }}
      >
        <motion.span
          className={`neon-toggle-thumb ${thumbSizeClasses[size]}`}
          animate={{
            x: checked ? (size === 'sm' ? 12 : size === 'md' ? 20 : 24) : 0
          }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        />
      </motion.button>
      
      {label && (
        <span className="text-sm font-medium text-foreground">
          {label}
        </span>
      )}
    </motion.div>
  );
};
