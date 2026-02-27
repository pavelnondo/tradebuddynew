import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const shimmerButtonVariants = cva(
  [
    "shimmer-button",
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium",
    "ring-offset-background transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "relative overflow-hidden",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0",
        outline:
          "border border-input bg-background/50 hover:bg-accent/50 hover:text-accent-foreground hover:border-accent",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0",
        ghost: "hover:bg-accent/10 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ShimmerButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof shimmerButtonVariants> {
  asChild?: boolean
  shimmerColor?: string
  shimmerSize?: string
  shimmerDuration?: string
}

const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      shimmerColor = "rgba(255, 255, 255, 0.3)",
      shimmerSize = "200px",
      shimmerDuration = "2s",
      children,
      style,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"

    const shimmerStyle = {
      "--shimmer-color": shimmerColor,
      "--shimmer-size": shimmerSize,
      "--shimmer-duration": shimmerDuration,
      ...style,
    } as React.CSSProperties

    return (
      <Comp
        className={cn(shimmerButtonVariants({ variant, size, className }))}
        ref={ref}
        style={shimmerStyle}
        {...props}
      >
        {children}
      </Comp>
    )
  }
)
ShimmerButton.displayName = "ShimmerButton"

export { ShimmerButton, shimmerButtonVariants }
