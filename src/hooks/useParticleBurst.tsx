import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

export interface Particle {
  id: string;
  x: number;
  y: number;
  delay: number;
  duration: number;
  angle: number;
  distance: number;
  size: number;
  color: string;
}

const getAccentColor = (): string => {
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
  const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
  const color = accent || primary || '#3b82f6';
  return color.startsWith('#') || color.startsWith('rgb') ? color : `hsl(${color})`;
};

const createParticles = (rect: DOMRect, color: string, burstId: number): Particle[] => {
  const particles: Particle[] = [];
  const count = 12;
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    particles.push({
      id: `${burstId}-${i}`,
      x: centerX,
      y: centerY,
      delay: Math.random() * 0.06,
      duration: 0.35 + Math.random() * 0.15,
      angle,
      distance: 24 + Math.random() * 32,
      size: 3 + Math.random() * 4,
      color,
    });
  }
  return particles;
};

export function useParticleBurst(enabled = true) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const burstIdRef = useRef(0);

  const trigger = useCallback(
    (target: HTMLElement | null) => {
      if (!enabled || !target) return;
      const rect = target.getBoundingClientRect();
      const color = getAccentColor();
      burstIdRef.current += 1;
      setParticles(createParticles(rect, color, burstIdRef.current));
      setTimeout(() => setParticles([]), 600);
    },
    [enabled]
  );

  const portal =
    typeof document !== 'undefined'
      ? createPortal(
          <AnimatePresence>
            {particles.map((p) => (
              <motion.div
                key={p.id}
                className="fixed pointer-events-none rounded-full"
                style={{
                  left: p.x,
                  top: p.y,
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  boxShadow: `0 0 ${p.size}px ${p.color}`,
                  zIndex: 99999,
                }}
                initial={{ x: -p.size / 2, y: -p.size / 2, opacity: 1, scale: 1 }}
                animate={{
                  x: -p.size / 2 + Math.cos(p.angle) * p.distance,
                  y: -p.size / 2 + Math.sin(p.angle) * p.distance,
                  opacity: 0,
                  scale: 0.2,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' }}
              />
            ))}
          </AnimatePresence>,
          document.body
        )
      : null;

  return { trigger, portal };
}
