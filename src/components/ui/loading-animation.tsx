/**
 * Loading Animation - Magic UI style with particles and smooth animations
 * Adapted from Magic UI component bundle
 */

"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  hue: number;
}

interface LoadingAnimationProps {
  message?: string;
  showParticles?: boolean;
  particleCount?: number;
  className?: string;
  /** Show as overlay (full screen) or inline */
  overlay?: boolean;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  message = "Loading...",
  showParticles = true,
  particleCount = 30,
  className,
  overlay = false,
}) => {
  const { themeConfig } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!showParticles || !mounted) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasSize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Initialize particles
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.5 + 0.3,
      hue: Math.random() * 60 + 200,
    }));

    const animate = () => {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      particlesRef.current.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > canvas.offsetWidth) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.offsetHeight) particle.vy *= -1;

        particle.opacity = Math.sin(Date.now() * 0.001 + particle.x) * 0.3 + 0.5;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${particle.hue}, 70%, 60%, ${particle.opacity})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `hsla(${particle.hue}, 70%, 60%, ${particle.opacity})`;
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [showParticles, particleCount, mounted]);

  if (!mounted) {
    return null;
  }

  const containerClass = overlay
    ? "fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
    : "relative flex items-center justify-center";

  return (
    <div
      className={cn(containerClass, className)}
      style={{
        backgroundColor: overlay ? `${themeConfig.bg}ee` : 'transparent',
      }}
    >
      <div className="relative flex flex-col items-center justify-center">
        {showParticles && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none"
            style={{ width: overlay ? '400px' : '200px', height: overlay ? '400px' : '200px' }}
          />
        )}

        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="relative">
            <motion.div
              className="relative rounded-full"
              style={{
                width: overlay ? '96px' : '64px',
                height: overlay ? '96px' : '64px',
                background: `conic-gradient(from 0deg, ${themeConfig.accent}, ${themeConfig.accent}80, ${themeConfig.accent})`,
              }}
              animate={{ rotate: 360 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <div
                className="absolute inset-2 rounded-full"
                style={{ backgroundColor: themeConfig.bg }}
              />
            </motion.div>

            <motion.div
              className="absolute inset-0 rounded-full border-4"
              style={{
                borderColor: `${themeConfig.accent}4d`,
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <motion.div
              className="absolute inset-0 rounded-full border-4"
              style={{
                borderColor: `${themeConfig.accent}4d`,
              }}
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.3, 0, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
            />

            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="rounded-full"
                style={{
                  width: overlay ? '12px' : '8px',
                  height: overlay ? '12px' : '8px',
                  backgroundColor: themeConfig.accent,
                }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [1, 0.5, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
          </div>

          {message && (
            <div className="flex flex-col items-center gap-3">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-sm font-medium"
                style={{ color: themeConfig.foreground }}
              >
                {message}
              </motion.div>

              <div className="flex gap-2">
                {[0, 1, 2].map((index) => (
                  <motion.div
                    key={index}
                    className="rounded-full"
                    style={{
                      width: overlay ? '8px' : '6px',
                      height: overlay ? '8px' : '6px',
                      backgroundColor: themeConfig.accent,
                    }}
                    animate={{
                      y: [0, -10, 0],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: index * 0.2,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <motion.div
            className="absolute -inset-20 rounded-full opacity-20"
            style={{
              background: `radial-gradient(circle, ${themeConfig.accent}4d 0%, transparent 70%)`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.1, 0.2],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      </div>
    </div>
  );
};
