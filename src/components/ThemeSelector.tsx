import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useTheme } from '../contexts/ThemeContext';
import { themes } from '../config/theme.config';
import { Check, Palette, Sun, Moon, Monitor } from 'lucide-react';

export function ThemeSelector() {
  const { currentTheme, setTheme } = useTheme();

  const themeOptions = [
    { key: 'light', name: 'Light Mode', icon: Sun, description: 'Clean and bright' },
    { key: 'dark', name: 'Dark Mode', icon: Moon, description: 'Easy on the eyes' },
    { key: 'ocean', name: 'Ocean Blue', icon: Palette, description: 'Deep sea vibes' },
    { key: 'graphite', name: 'Graphite Pro', icon: Palette, description: 'Professional dark' },
    { key: 'emerald', name: 'Emerald Focus', icon: Palette, description: 'Nature inspired' },
    { key: 'system', name: 'System', icon: Monitor, description: 'Follows system preference' },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Palette className="h-5 w-5" />
          <span>Appearance</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = currentTheme === option.key;
            
            return (
              <Button
                key={option.key}
                variant={isSelected ? 'default' : 'outline'}
                className={`h-auto p-4 flex flex-col items-center space-y-2 transition-all duration-300 ${
                  isSelected 
                    ? 'ring-2 ring-primary shadow-lg' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => setTheme(option.key)}
              >
                <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4" />
                  {isSelected && <Check className="h-4 w-4" />}
                </div>
                <div className="text-center">
                  <div className="font-medium">{option.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {option.description}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
        
        {/* Theme Preview Cards */}
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-3">Theme Preview</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(themes).map(([key, theme]) => (
              <div
                key={key}
                className={`p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                  currentTheme === key 
                    ? 'border-primary shadow-lg' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setTheme(key)}
                style={{
                  backgroundColor: theme.colors.card,
                  borderColor: currentTheme === key ? theme.colors.primary : theme.colors.border,
                }}
              >
                <div className="space-y-2">
                  <div 
                    className="h-3 rounded"
                    style={{ backgroundColor: theme.colors.primary }}
                  />
                  <div 
                    className="h-2 rounded"
                    style={{ backgroundColor: theme.colors.text, opacity: 0.8 }}
                  />
                  <div 
                    className="h-2 rounded w-3/4"
                    style={{ backgroundColor: theme.colors.subtext }}
                  />
                  <div className="flex space-x-1">
                    <div 
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: theme.colors.success }}
                    />
                    <div 
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: theme.colors.danger }}
                    />
                    <div 
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: theme.colors.warning }}
                    />
                  </div>
                </div>
                <div className="mt-2 text-xs font-medium" style={{ color: theme.colors.text }}>
                  {theme.displayName}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
