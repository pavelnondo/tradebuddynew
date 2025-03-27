
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface ChartContainerProps {
  title: string;
  icon: React.ReactNode;
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
    <Card className="shadow-md hover:shadow-lg transition-shadow h-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          {icon}
          <span className="ml-2">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : isEmpty ? (
            <div className="flex items-center justify-center h-full w-full">
              <p className="text-muted-foreground text-center">{emptyMessage}</p>
            </div>
          ) : (
            <div className="h-full w-full">{children}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
