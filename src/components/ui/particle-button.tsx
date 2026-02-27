import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MousePointerClick } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Particle {
  id: number;
  x: number;
  y: number;
  delay: number;
  duration: number;
  angle: number;
  distance: number;
  size: number;
  color: string;
}

interface ParticleButtonProps extends ButtonProps {
  children: React.ReactNode;
  onSuccess?: () => void | Promise<void>;
  showParticles?: boolean;
  showClickIcon?: boolean;
}

const createParticles = (rect: DOMRect, color: string): Particle[] => {
  const particles: Particle[] = [];
  const count = 18;
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    particles.push({
      id: i,
      x: centerX,
      y: centerY,
      delay: Math.random() * 0.1,
      duration: 0.5 + Math.random() * 0.2,
      angle,
      distance: 40 + Math.random() * 50,
      size: 6 + Math.random() * 6,
      color,
    });
  }
  return particles;
};

export const ParticleButton = React.forwardRef<HTMLButtonElement, ParticleButtonProps>(
  ({ children, className, onClick, onSuccess, showParticles = true, showClickIcon = false, disabled, ...props }, ref) => {
    const [particles, setParticles] = React.useState<Particle[]>([]);
    const [isProcessing, setIsProcessing] = React.useState(false);
    const buttonRef = React.useRef<HTMLButtonElement>(null);

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || isProcessing) return;

      if (showParticles && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const primaryColor = getComputedStyle(document.documentElement)
          .getPropertyValue("--primary")
          .trim() || "#f59e0b";
        const newParticles = createParticles(rect, primaryColor);
        setParticles(newParticles);

        setTimeout(() => setParticles([]), 800);
      }

      setIsProcessing(true);
      try {
        const result = onClick?.(e);
        if (result instanceof Promise) {
          await result;
        }
        await onSuccess?.();
      } finally {
        setIsProcessing(false);
      }
    };

    return (
      <>
        <motion.div
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.15 }}
          className="inline-flex"
        >
          <Button
            ref={(node) => {
              (buttonRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
              if (typeof ref === "function") {
                ref(node);
              } else if (ref) {
                ref.current = node;
              }
            }}
            className={cn("relative overflow-visible", className)}
            onClick={handleClick}
            disabled={disabled || isProcessing}
            {...props}
          >
            {showClickIcon && !disabled && (
              <MousePointerClick className="w-4 h-4 opacity-70 mr-1" />
            )}
            {children}
          </Button>
        </motion.div>

        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="fixed pointer-events-none z-[9999] rounded-full"
              style={{
                left: p.x,
                top: p.y,
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                boxShadow: `0 0 ${p.size}px ${p.color}`,
              }}
              initial={{
                x: -p.size / 2,
                y: -p.size / 2,
                opacity: 1,
                scale: 1,
              }}
              animate={{
                x: -p.size / 2 + Math.cos(p.angle) * p.distance,
                y: -p.size / 2 + Math.sin(p.angle) * p.distance,
                opacity: 0,
                scale: 0.2,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: "easeOut",
              }}
            />
          ))}
        </AnimatePresence>
      </>
    );
  }
);
ParticleButton.displayName = "ParticleButton";
