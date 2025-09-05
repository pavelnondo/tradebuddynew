import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sankey,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface SankeyData {
  nodes: Array<{
    name: string;
    category?: string;
  }>;
  links: Array<{
    source: string;
    target: string;
    value: number;
  }>;
}

interface SankeyChartProps {
  data: SankeyData;
  title?: string;
  description?: string;
  isLoading?: boolean;
}

export function SankeyChart({ 
  data, 
  title = "Trade Flow Analysis",
  description = "Visualize the flow from setups to outcomes",
  isLoading = false 
}: SankeyChartProps) {
  if (isLoading) {
    return (
      <Card className="card-modern">
        <CardContent className="p-6">
          <div className="h-96 bg-muted/50 rounded-lg shimmer"></div>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.source} → {data.target}</p>
          <p className="text-sm text-muted-foreground">
            Value: <span className="font-medium">${data.value.toFixed(2)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="card-modern">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <Sankey
              data={data}
              nodePadding={20}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              link={{ stroke: '#8884d8', strokeOpacity: 0.6 }}
              node={{ stroke: '#8884d8', strokeWidth: 1 }}
            >
              <Tooltip content={<CustomTooltip />} />
            </Sankey>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
