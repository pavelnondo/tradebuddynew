import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ShapeLandingHeroProps {
  badge?: string;
  headline: string;
  subheadline?: string;
  gradientFrom?: string;
  gradientTo?: string;
  children?: React.ReactNode;
  className?: string;
}

export function ShapeLandingHero({
  badge = "Trading Journal",
  headline = "Track. Analyze. Improve.",
  subheadline = "Professional trading journal with AI-powered insights",
  gradientFrom = "var(--primary, #f59e0b)",
  gradientTo = "var(--secondary, #d97706)",
  children,
  className,
}: ShapeLandingHeroProps) {
  return (
    <div
      className={cn(
        "relative min-h-screen overflow-x-hidden overflow-y-auto flex flex-col items-center justify-center py-12 px-4",
        className
      )}
    >
      {/* Soft gradient blur background */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${gradientFrom}15, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 60%, ${gradientTo}10, transparent 50%),
            var(--background, #0f1219)`,
        }}
      />

      {/* Floating glass shapes */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            y: [0, -12, 0],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-[20%] left-[15%] w-48 h-48 rounded-3xl opacity-20 blur-2xl"
          style={{
            background: `linear-gradient(135deg, ${gradientFrom}40, ${gradientTo}20)`,
            backdropFilter: "blur(40px)",
          }}
        />
        <motion.div
          animate={{
            y: [0, 15, 0],
            rotate: [0, -8, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-[40%] right-[10%] w-64 h-64 rounded-full opacity-15 blur-3xl"
          style={{
            background: `linear-gradient(225deg, ${gradientTo}50, ${gradientFrom}30)`,
          }}
        />
        <motion.div
          animate={{
            y: [0, -8, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-[25%] left-[25%] w-40 h-40 rounded-2xl opacity-10 blur-xl"
          style={{
            background: `linear-gradient(45deg, ${gradientFrom}30, transparent)`,
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-2xl mx-auto">
        {badge && (
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-medium border border-border/60 bg-card/50 backdrop-blur-sm text-muted-foreground mb-6"
          >
            {badge}
          </motion.span>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight"
          style={{
            background: `linear-gradient(135deg, var(--foreground, #fff) 0%, var(--muted-foreground, #94a3b8) 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {(() => {
            const words = headline.split(" ");
            const lastWord = words[words.length - 1] ?? "";
            const rest = words.slice(0, -1).join(" ");
            return (
              <>
                {rest && `${rest} `}
                <span
                  style={{
                    background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {lastWord}
                </span>
              </>
            );
          })()}
        </motion.h1>

        {subheadline && (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl"
          >
            {subheadline}
          </motion.p>
        )}

        {children && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="mt-8 w-full max-w-md"
          >
            {children}
          </motion.div>
        )}
      </div>
    </div>
  );
}
