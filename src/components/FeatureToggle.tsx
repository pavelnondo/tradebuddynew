
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface FeatureToggleProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function FeatureToggle({ 
  id, 
  label, 
  description, 
  checked, 
  onCheckedChange 
}: FeatureToggleProps) {
  return (
    <div className="flex items-center justify-between space-x-2 rounded-lg border p-3 shadow-sm">
      <div className="space-y-0.5">
        <Label htmlFor={id} className="font-medium">{label}</Label>
        {description && (
          <p className="text-[0.8rem] text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}
