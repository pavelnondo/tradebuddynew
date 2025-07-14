// Topstep-inspired chart configuration
export const chartConfig = {
  // Color palette inspired by Topstep's professional look
  colors: {
    primary: '#2563eb', // Professional blue
    secondary: '#10b981', // Success green
    accent: '#f59e0b', // Warning orange
    danger: '#ef4444', // Error red
    neutral: '#6b7280', // Gray
    light: '#f3f4f6', // Light gray
    dark: '#1f2937', // Dark gray
    success: '#059669', // Dark green
    warning: '#d97706', // Dark orange
  },
  
  // Gradient configurations
  gradients: {
    primary: {
      light: 'rgba(37, 99, 235, 0.1)',
      medium: 'rgba(37, 99, 235, 0.3)',
      dark: 'rgba(37, 99, 235, 0.8)',
    },
    success: {
      light: 'rgba(16, 185, 129, 0.1)',
      medium: 'rgba(16, 185, 129, 0.3)',
      dark: 'rgba(16, 185, 129, 0.8)',
    },
    danger: {
      light: 'rgba(239, 68, 68, 0.1)',
      medium: 'rgba(239, 68, 68, 0.3)',
      dark: 'rgba(239, 68, 68, 0.8)',
    },
  },

  // Chart.js global defaults
  chartJsDefaults: {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 750,
      easing: 'easeInOutQuart' as const,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 12,
            weight: '500' as const,
          },
          color: '#374151',
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#f9fafb',
        bodyColor: '#f3f4f6',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        titleFont: {
          family: 'Inter, system-ui, sans-serif',
          size: 14,
          weight: '600' as const,
        },
        bodyFont: {
          family: 'Inter, system-ui, sans-serif',
          size: 13,
          weight: '400' as const,
        },
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              }).format(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      intersect: false,
      axis: 'x' as const,
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: 'rgba(156, 163, 175, 0.1)',
          drawBorder: false,
        },
        ticks: {
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 11,
            weight: '400' as const,
          },
          color: '#6b7280',
          padding: 8,
        },
        border: {
          display: false,
        },
      },
      y: {
        grid: {
          display: true,
          color: 'rgba(156, 163, 175, 0.1)',
          drawBorder: false,
        },
        ticks: {
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 11,
            weight: '400' as const,
          },
          color: '#6b7280',
          padding: 8,
          callback: function(value: any) {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(value);
          },
        },
        border: {
          display: false,
        },
      },
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 6,
        hoverBorderWidth: 2,
        hoverBorderColor: '#ffffff',
      },
      line: {
        tension: 0.4,
        borderWidth: 2,
      },
    },
  },

  // Recharts configuration
  rechartsDefaults: {
    margin: { top: 20, right: 30, left: 20, bottom: 5 },
    colors: ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
  },
};

// Dark mode overrides
export const darkModeChartConfig = {
  ...chartConfig,
  chartJsDefaults: {
    ...chartConfig.chartJsDefaults,
    plugins: {
      ...chartConfig.chartJsDefaults.plugins,
      legend: {
        ...chartConfig.chartJsDefaults.plugins.legend,
        labels: {
          ...chartConfig.chartJsDefaults.plugins.legend.labels,
          color: '#d1d5db',
        },
      },
      tooltip: {
        ...chartConfig.chartJsDefaults.plugins.tooltip,
        backgroundColor: 'rgba(31, 41, 55, 0.95)',
        titleColor: '#f9fafb',
        bodyColor: '#d1d5db',
        borderColor: '#4b5563',
      },
    },
    scales: {
      x: {
        ...chartConfig.chartJsDefaults.scales.x,
        grid: {
          ...chartConfig.chartJsDefaults.scales.x.grid,
          color: 'rgba(75, 85, 99, 0.2)',
        },
        ticks: {
          ...chartConfig.chartJsDefaults.scales.x.ticks,
          color: '#9ca3af',
        },
      },
      y: {
        ...chartConfig.chartJsDefaults.scales.y,
        grid: {
          ...chartConfig.chartJsDefaults.scales.y.grid,
          color: 'rgba(75, 85, 99, 0.2)',
        },
        ticks: {
          ...chartConfig.chartJsDefaults.scales.y.ticks,
          color: '#9ca3af',
        },
      },
    },
  },
};

// Helper function to get chart config based on theme
export function getChartConfig(isDark: boolean = false) {
  return isDark ? darkModeChartConfig : chartConfig;
}

// Helper function to create gradient
export function createGradient(ctx: CanvasRenderingContext2D, colors: string[]) {
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  colors.forEach((color, index) => {
    gradient.addColorStop(index / (colors.length - 1), color);
  });
  return gradient;
} 