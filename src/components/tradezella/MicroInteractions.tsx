import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  Bookmark, 
  Share2, 
  Download,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  RotateCw,
  Check,
  X,
  Plus,
  Minus,
  Zap,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Animated Button Component
interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  success?: boolean;
  error?: boolean;
  icon?: React.ReactNode;
  tooltip?: string;
}

export function AnimatedButton({ 
  children, 
  onClick, 
  variant = 'default', 
  size = 'md',
  className,
  disabled = false,
  loading = false,
  success = false,
  error = false,
  icon,
  tooltip
}: AnimatedButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => setIsPressed(false);
  const handleMouseLeave = () => setIsPressed(false);

  const getButtonClasses = () => {
    const baseClasses = "relative overflow-hidden transition-all duration-200 ease-in-out";
    const sizeClasses = {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 text-base",
      lg: "h-12 px-6 text-lg"
    };
    const variantClasses = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      ghost: "hover:bg-accent hover:text-accent-foreground"
    };
    const stateClasses = {
      pressed: "scale-95 shadow-sm",
      loading: "cursor-wait",
      success: "bg-green-500 hover:bg-green-600",
      error: "bg-red-500 hover:bg-red-600",
      disabled: "opacity-50 cursor-not-allowed"
    };

    return cn(
      baseClasses,
      sizeClasses[size],
      variantClasses[variant],
      isPressed && stateClasses.pressed,
      loading && stateClasses.loading,
      success && stateClasses.success,
      error && stateClasses.error,
      disabled && stateClasses.disabled,
      className
    );
  };

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        className={getButtonClasses()}
        onClick={onClick}
        disabled={disabled || loading}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={() => setShowTooltip(!!tooltip)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* Ripple Effect */}
        <div className="absolute inset-0 overflow-hidden rounded-md">
          <div className="absolute inset-0 bg-white/20 scale-0 animate-ping opacity-0 transition-all duration-300" />
        </div>

        {/* Content */}
        <div className="relative flex items-center justify-center space-x-2">
          {loading && (
            <div className="animate-spin">
              <RotateCw className="h-4 w-4" />
            </div>
          )}
          {success && <Check className="h-4 w-4" />}
          {error && <X className="h-4 w-4" />}
          {icon && !loading && !success && !error && icon}
          {children}
        </div>
      </Button>

      {/* Tooltip */}
      {tooltip && showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded shadow-lg z-50 animate-fade-in">
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-popover" />
        </div>
      )}
    </div>
  );
}

// Interactive Card Component
interface InteractiveCardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
  glow?: boolean;
  pulse?: boolean;
}

export function InteractiveCard({ 
  children, 
  className,
  hoverable = true,
  clickable = false,
  onClick,
  onHover,
  glow = false,
  pulse = false
}: InteractiveCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    onHover?.(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onHover?.(false);
  };

  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => setIsPressed(false);

  return (
    <Card
      className={cn(
        "transition-all duration-300 ease-in-out",
        hoverable && "hover:shadow-lg hover:-translate-y-1",
        clickable && "cursor-pointer",
        isHovered && hoverable && "shadow-xl",
        isPressed && "scale-95",
        glow && isHovered && "shadow-primary/25 shadow-2xl",
        pulse && "animate-pulse",
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={onClick}
    >
      <CardContent className="p-6">
        {children}
      </CardContent>
    </Card>
  );
}

// Like/Reaction Component
interface ReactionButtonProps {
  type: 'like' | 'dislike' | 'star' | 'bookmark' | 'heart';
  count?: number;
  active?: boolean;
  onToggle?: (active: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

export function ReactionButton({ 
  type, 
  count = 0, 
  active = false, 
  onToggle,
  size = 'md',
  showCount = true
}: ReactionButtonProps) {
  const [isActive, setIsActive] = useState(active);
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayCount, setDisplayCount] = useState(count);

  const icons = {
    like: ThumbsUp,
    dislike: ThumbsDown,
    star: Star,
    bookmark: Bookmark,
    heart: Heart
  };

  const Icon = icons[type];

  const handleClick = () => {
    const newActive = !isActive;
    setIsActive(newActive);
    setIsAnimating(true);
    
    // Update count
    const newCount = newActive ? count + 1 : count - 1;
    setDisplayCount(newCount);
    
    onToggle?.(newActive);
    
    // Reset animation
    setTimeout(() => setIsAnimating(false), 300);
  };

  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10"
  };

  const getColorClasses = () => {
    if (!isActive) return "text-muted-foreground hover:text-foreground";
    
    switch (type) {
      case 'like':
        return "text-blue-500";
      case 'dislike':
        return "text-red-500";
      case 'star':
        return "text-yellow-500";
      case 'bookmark':
        return "text-purple-500";
      case 'heart':
        return "text-red-500";
      default:
        return "text-primary";
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "relative transition-all duration-200",
          sizeClasses[size],
          getColorClasses(),
          isAnimating && "scale-110"
        )}
        onClick={handleClick}
      >
        <Icon className={cn(
          "transition-all duration-200",
          isActive && "fill-current",
          isAnimating && "animate-bounce"
        )} />
        
        {/* Sparkle effect */}
        {isAnimating && isActive && (
          <div className="absolute inset-0 pointer-events-none">
            <Sparkles className="h-3 w-3 text-yellow-400 animate-ping absolute -top-1 -right-1" />
            <Sparkles className="h-2 w-2 text-yellow-400 animate-ping absolute -bottom-1 -left-1 delay-100" />
          </div>
        )}
      </Button>
      
      {showCount && (
        <span className={cn(
          "text-sm font-medium transition-colors duration-200",
          isActive ? "text-foreground" : "text-muted-foreground"
        )}>
          {displayCount}
        </span>
      )}
    </div>
  );
}

// Progress Indicator Component
interface ProgressIndicatorProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  showPercentage?: boolean;
  animated?: boolean;
  label?: string;
}

export function ProgressIndicator({ 
  value, 
  max = 100, 
  size = 'md',
  variant = 'default',
  showPercentage = true,
  animated = true,
  label
}: ProgressIndicatorProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const percentage = Math.min((value / max) * 100, 100);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setDisplayValue(percentage);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayValue(percentage);
    }
  }, [percentage, animated]);

  const sizeClasses = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4"
  };

  const variantClasses = {
    default: "bg-primary",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    error: "bg-red-500"
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          {showPercentage && (
            <span className="font-medium">{Math.round(displayValue)}%</span>
          )}
        </div>
      )}
      
      <div className={cn(
        "w-full bg-muted rounded-full overflow-hidden",
        sizeClasses[size]
      )}>
        <div
          className={cn(
            "h-full transition-all duration-1000 ease-out rounded-full",
            variantClasses[variant],
            animated && "animate-pulse"
          )}
          style={{ width: `${displayValue}%` }}
        />
      </div>
    </div>
  );
}

// Floating Action Button
interface FloatingActionButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  tooltip?: string;
  pulse?: boolean;
}

export function FloatingActionButton({ 
  icon, 
  onClick,
  position = 'bottom-right',
  size = 'md',
  color = 'primary',
  tooltip,
  pulse = false
}: FloatingActionButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-14 w-14',
    lg: 'h-16 w-16'
  };

  const colorClasses = {
    primary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
    secondary: 'bg-secondary hover:bg-secondary/90 text-secondary-foreground',
    success: 'bg-green-500 hover:bg-green-600 text-white',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    error: 'bg-red-500 hover:bg-red-600 text-white'
  };

  return (
    <div className={cn(
      "fixed z-50",
      positionClasses[position]
    )}>
      <Button
        className={cn(
          "rounded-full shadow-lg hover:shadow-xl transition-all duration-300",
          sizeClasses[size],
          colorClasses[color],
          isHovered && "scale-110",
          pulse && "animate-pulse"
        )}
        onClick={onClick}
        onMouseEnter={() => {
          setIsHovered(true);
          setShowTooltip(!!tooltip);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          setShowTooltip(false);
        }}
      >
        {icon}
      </Button>

      {/* Tooltip */}
      {tooltip && showTooltip && (
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-popover text-popover-foreground text-sm rounded shadow-lg animate-fade-in">
          {tooltip}
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-popover" />
        </div>
      )}
    </div>
  );
}

// Notification Toast Component
interface NotificationToastProps {
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function NotificationToast({ 
  title, 
  description,
  type = 'info',
  duration = 5000,
  onClose,
  action
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  const typeClasses = {
    success: 'bg-green-500 text-white border-green-600',
    error: 'bg-red-500 text-white border-red-600',
    warning: 'bg-yellow-500 text-white border-yellow-600',
    info: 'bg-blue-500 text-white border-blue-600'
  };

  const icons = {
    success: Check,
    error: X,
    warning: Zap,
    info: Eye
  };

  const Icon = icons[type];

  if (!isVisible) return null;

  return (
    <div className={cn(
      "fixed top-4 right-4 z-50 max-w-sm w-full bg-background border rounded-lg shadow-lg transition-all duration-300",
      isExiting ? "translate-x-full opacity-0" : "translate-x-0 opacity-100",
      typeClasses[type]
    )}>
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium">{title}</h4>
            {description && (
              <p className="text-sm opacity-90 mt-1">{description}</p>
            )}
            {action && (
              <Button
                size="sm"
                variant="outline"
                className="mt-2 text-xs"
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-6 w-6 p-0 hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Loading Skeleton Component
interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function LoadingSkeleton({ 
  className,
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse'
}: LoadingSkeletonProps) {
  const variantClasses = {
    text: 'h-4 w-full',
    rectangular: 'w-full',
    circular: 'rounded-full aspect-square'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-wave',
    none: ''
  };

  return (
    <div
      className={cn(
        'bg-muted rounded',
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={{ width, height }}
    />
  );
}

// Export all components
export {
  AnimatedButton,
  InteractiveCard,
  ReactionButton,
  ProgressIndicator,
  FloatingActionButton,
  NotificationToast,
  LoadingSkeleton
};
