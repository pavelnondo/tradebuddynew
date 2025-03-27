
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface ChartContainerProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  isLoading?: boolean;
  emptyMessage?: string;
  isEmpty?: boolean;
}

export function ChartContainer({ 
  title, 
  icon, 
  children, 
  isLoading = false,
  emptyMessage = "No data available", 
  isEmpty = false
}: ChartContainerProps) {
  return (
    <div className="h-full w-full">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : isEmpty ? (
        <div className="flex items-center justify-center h-full w-full">
          <p className="text-muted-foreground text-center">{emptyMessage}</p>
        </div>
      ) : (
        <Card className="h-full">
          {(title || icon) && (
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-sm font-medium">
                {icon && <span className="mr-2">{icon}</span>}
                {title}
              </CardTitle>
            </CardHeader>
          )}
          <CardContent className="p-0">
            <div className="h-full w-full">{children}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
