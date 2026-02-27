import { MoveDownLeft, MoveUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

export interface StatItem {
  value: string | number;
  change?: string;
  label: string;
  variant?: "primary" | "destructive" | "success" | "neutral";
}

interface StatsSectionProps {
  items?: StatItem[];
  className?: string;
}

function Stats({ items, className }: StatsSectionProps) {
  const { themeConfig } = useTheme();
  const defaultItems: StatItem[] = [
    { value: "500.000", change: "+20.1%", label: "Monthly active users", variant: "primary" },
    { value: "20.105", change: "-2%", label: "Daily active users", variant: "destructive" },
    { value: "$523.520", change: "+8%", label: "Monthly recurring revenue", variant: "success" },
    { value: "$1052", change: "+2%", label: "Cost per acquisition", variant: "primary" },
  ];
  const stats = items ?? defaultItems;

  const getIcon = (v: StatItem["variant"]) => {
    if (v === "destructive") return MoveDownLeft;
    return MoveUpRight;
  };
  const getColor = (v: StatItem["variant"]) => {
    if (v === "destructive") return themeConfig.destructive;
    if (v === "success") return themeConfig.success;
    if (v === "primary") return themeConfig.accent;
    return themeConfig.mutedForeground;
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="grid text-left grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full gap-6">
        {stats.map((item, i) => {
          const Icon = getIcon(item.variant);
          const iconColor = getColor(item.variant);
          return (
            <div
              key={i}
              className="flex flex-col gap-2 p-6 rounded-2xl transition-all duration-200"
              style={{
                backgroundColor: themeConfig.card,
                borderColor: themeConfig.border,
                borderWidth: 1,
                borderStyle: "solid",
              }}
            >
              <Icon className="w-4 h-4" style={{ color: iconColor }} />
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight flex flex-row gap-2 items-end flex-wrap">
                <span style={{ color: themeConfig.foreground }}>{item.value}</span>
                {item.change && (
                  <span className="text-sm font-normal" style={{ color: iconColor }}>
                    {item.change}
                  </span>
                )}
              </h2>
              <p className="text-sm font-medium" style={{ color: themeConfig.mutedForeground }}>
                {item.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { Stats };
