import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Sun, 
  Moon, 
  Monitor, 
  Palette,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = 'light' | 'dark' | 'system';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'button' | 'dropdown';
}

export function ThemeToggle({ 
  className, 
  showLabel = false, 
  variant = 'button' 
}: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);

  // Get system theme preference
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  // Apply theme to document
  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    const systemTheme = getSystemTheme();
    
    if (newTheme === 'system') {
      root.classList.remove('light', 'dark');
      root.classList.add(systemTheme);
    } else {
      root.classList.remove('light', 'dark');
      root.classList.add(newTheme);
    }
  };

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    const initialTheme = savedTheme || 'system';
    
    setTheme(initialTheme);
    applyTheme(initialTheme);
    setMounted(true);
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const getCurrentThemeIcon = () => {
    if (!mounted) return <Monitor className="w-4 h-4" />;
    
    switch (theme) {
      case 'light':
        return <Sun className="w-4 h-4" />;
      case 'dark':
        return <Moon className="w-4 h-4" />;
      case 'system':
        return <Monitor className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const getCurrentThemeLabel = () => {
    if (!mounted) return 'System';
    
    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
      default:
        return 'System';
    }
  };

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className={className}>
        <Monitor className="w-4 h-4" />
        {showLabel && <span className="ml-2">Theme</span>}
      </Button>
    );
  }

  if (variant === 'dropdown') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className={cn("flex items-center space-x-2", className)}>
            {getCurrentThemeIcon()}
            {showLabel && <span>{getCurrentThemeLabel()}</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem 
            onClick={() => handleThemeChange('light')}
            className="flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <Sun className="w-4 h-4" />
              <span>Light</span>
            </div>
            {theme === 'light' && <Check className="w-4 h-4" />}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleThemeChange('dark')}
            className="flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <Moon className="w-4 h-4" />
              <span>Dark</span>
            </div>
            {theme === 'dark' && <Check className="w-4 h-4" />}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleThemeChange('system')}
            className="flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <Monitor className="w-4 h-4" />
              <span>System</span>
            </div>
            {theme === 'system' && <Check className="w-4 h-4" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Simple button toggle between light and dark
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    handleThemeChange(newTheme);
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={toggleTheme}
      className={cn("flex items-center space-x-2", className)}
    >
      {getCurrentThemeIcon()}
      {showLabel && <span>{getCurrentThemeLabel()}</span>}
    </Button>
  );
}

// Theme-aware color picker component
export function ThemeColorPicker({ 
  onColorChange, 
  currentColor 
}: { 
  onColorChange: (color: string) => void;
  currentColor?: string;
}) {
  const themeColors = [
    { name: 'Blue', value: 'blue', class: 'bg-blue-500' },
    { name: 'Green', value: 'green', class: 'bg-green-500' },
    { name: 'Purple', value: 'purple', class: 'bg-purple-500' },
    { name: 'Red', value: 'red', class: 'bg-red-500' },
    { name: 'Orange', value: 'orange', class: 'bg-orange-500' },
    { name: 'Pink', value: 'pink', class: 'bg-pink-500' },
    { name: 'Indigo', value: 'indigo', class: 'bg-indigo-500' },
    { name: 'Teal', value: 'teal', class: 'bg-teal-500' },
  ];

  return (
    <div className="flex items-center space-x-2">
      <Palette className="w-4 h-4" />
      <span className="text-sm font-medium">Accent Color:</span>
      <div className="flex space-x-1">
        {themeColors.map((color) => (
          <button
            key={color.value}
            onClick={() => onColorChange(color.value)}
            className={cn(
              "w-6 h-6 rounded-full border-2 transition-all hover:scale-110",
              color.class,
              currentColor === color.value 
                ? "border-foreground ring-2 ring-foreground/20" 
                : "border-transparent"
            )}
            title={color.name}
          />
        ))}
      </div>
    </div>
  );
}

// Accessibility features component
export function AccessibilityFeatures() {
  const [fontSize, setFontSize] = useState(16);
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const savedFontSize = localStorage.getItem('fontSize');
    const savedHighContrast = localStorage.getItem('highContrast') === 'true';
    const savedReducedMotion = localStorage.getItem('reducedMotion') === 'true';

    if (savedFontSize) setFontSize(parseInt(savedFontSize));
    if (savedHighContrast) setHighContrast(savedHighContrast);
    if (savedReducedMotion) setReducedMotion(savedReducedMotion);

    applyAccessibilitySettings();
  }, []);

  const applyAccessibilitySettings = () => {
    const root = document.documentElement;
    
    // Font size
    root.style.fontSize = `${fontSize}px`;
    
    // High contrast
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Reduced motion
    if (reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  };

  const handleFontSizeChange = (newSize: number) => {
    setFontSize(newSize);
    localStorage.setItem('fontSize', newSize.toString());
    applyAccessibilitySettings();
  };

  const handleHighContrastToggle = () => {
    const newValue = !highContrast;
    setHighContrast(newValue);
    localStorage.setItem('highContrast', newValue.toString());
    applyAccessibilitySettings();
  };

  const handleReducedMotionToggle = () => {
    const newValue = !reducedMotion;
    setReducedMotion(newValue);
    localStorage.setItem('reducedMotion', newValue.toString());
    applyAccessibilitySettings();
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">Accessibility Settings</h3>
      
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">Font Size</label>
          <div className="flex items-center space-x-2 mt-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleFontSizeChange(Math.max(12, fontSize - 2))}
            >
              A-
            </Button>
            <span className="text-sm w-12 text-center">{fontSize}px</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleFontSizeChange(Math.min(24, fontSize + 2))}
            >
              A+
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">High Contrast</label>
          <Button
            size="sm"
            variant={highContrast ? "default" : "outline"}
            onClick={handleHighContrastToggle}
          >
            {highContrast ? "On" : "Off"}
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Reduce Motion</label>
          <Button
            size="sm"
            variant={reducedMotion ? "default" : "outline"}
            onClick={handleReducedMotionToggle}
          >
            {reducedMotion ? "On" : "Off"}
          </Button>
        </div>
      </div>
    </div>
  );
}
