import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return true; // Default to dark
  });

  useEffect(() => {
    // Apply theme on mount
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="liquid-btn h-6 w-6 p-0 min-w-6 min-h-6"
      title={`Current theme: ${isDark ? 'dark' : 'light'}`}
    >
      {isDark ? (
        <Moon className="h-3 w-3 text-primary" />
      ) : (
        <Sun className="h-3 w-3 text-primary" />
      )}
    </Button>
  );
}