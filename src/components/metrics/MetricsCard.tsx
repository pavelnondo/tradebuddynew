
import React, { ReactNode } from 'react';
import { Card, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';

interface MetricsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  valueClassName?: string;
}

export function MetricsCard({ title, value, icon, description, valueClassName }: MetricsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className={`text-2xl flex items-center ${valueClassName || ''}`}>
          {icon && <div className="mr-2 h-5 w-5">{icon}</div>}
          {value}
        </CardTitle>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardHeader>
    </Card>
  );
}
