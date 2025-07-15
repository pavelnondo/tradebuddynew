
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
    <Card className="h-full flex flex-col justify-between p-4 rounded-lg shadow-md bg-background">
      <CardHeader className="pb-2">
        <CardDescription className="text-sm font-medium text-muted-foreground">{title}</CardDescription>
        <div className="flex items-center mt-2">
          {icon && <div className="mr-2 h-6 w-6 flex items-center justify-center">{icon}</div>}
          <CardTitle className={`text-2xl font-bold ${valueClassName || ''}`}>{value}</CardTitle>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardHeader>
    </Card>
  );
}
