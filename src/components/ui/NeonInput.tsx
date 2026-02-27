import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

interface NeonInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  glow?: boolean;
  variant?: 'default' | 'search' | 'numeric';
}

export const NeonInput = forwardRef<HTMLInputElement, NeonInputProps>(({
  label,
  error,
  glow = false,
  variant = 'default',
  className = '',
  ...props
}, ref) => {
  const { themeConfig } = useTheme();

  const baseClasses = 'glass-input w-full';
  
  const variantClasses = {
    default: '',
    search: 'pl-10',
    numeric: 'text-right'
  };

  return (
    <motion.div
      className="space-y-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      
      <div className="relative">
        <motion.input
          ref={ref}
          className={`${baseClasses} ${variantClasses[variant]} ${className}`}
          {...props}
          whileFocus={{ 
            scale: 1.02,
            transition: { duration: 0.2 }
          }}
        />
        
        {error && (
          <motion.p
            className="text-destructive text-sm mt-1"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {error}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
});

NeonInput.displayName = 'NeonInput';
