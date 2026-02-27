/**
 * Empty State Component
 * Displays when there's no data to show
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Secondary actions shown alongside the primary action */
  secondaryActions?: Array<{ label: string; onClick: () => void }>;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  secondaryActions,
  className,
}) => {
  const hasActions = action || (secondaryActions && secondaryActions.length > 0);
  return (
    <Card className={cn('p-12 text-center', className)}>
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <Icon className="w-8 h-8 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
          {description}
        </p>
      )}
      {hasActions && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {action && (
            <Button onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {secondaryActions?.map((a, i) => (
            <Button key={i} variant="outline" onClick={a.onClick}>
              {a.label}
            </Button>
          ))}
        </div>
      )}
    </Card>
  );
};

