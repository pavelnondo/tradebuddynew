import React, { useEffect, useRef, ReactNode } from 'react';

export interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: 'blue' | 'purple' | 'green' | 'red' | 'orange';
  size?: 'sm' | 'md' | 'lg';
  width?: string | number;
  height?: string | number;
  customSize?: boolean;
}

const glowColorMap: Record<string, { base: number; spread: number }> = {
  blue: { base: 220, spread: 200 },
  purple: { base: 280, spread: 300 },
  green: { base: 120, spread: 200 },
  red: { base: 0, spread: 200 },
  orange: { base: 30, spread: 200 },
};

const sizeMap: Record<string, string> = {
  sm: 'w-48 h-64',
  md: 'w-64 h-80',
  lg: 'w-80 h-96',
};

export const GlowCard: React.FC<GlowCardProps> = ({
  children,
  className = '',
  glowColor = 'orange',
  size = 'md',
  width,
  height,
  customSize = false,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncPointer = (e: PointerEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      if (cardRef.current) {
        cardRef.current.style.setProperty('--x', String(x));
        cardRef.current.style.setProperty('--xp', String(x / window.innerWidth));
        cardRef.current.style.setProperty('--y', String(y));
        cardRef.current.style.setProperty('--yp', String(y / window.innerHeight));
      }
    };
    document.addEventListener('pointermove', syncPointer);
    return () => document.removeEventListener('pointermove', syncPointer);
  }, []);

  const { base, spread } = glowColorMap[glowColor] ?? glowColorMap.orange;
  const sizeClasses = customSize ? '' : sizeMap[size];
  const aspectClass = customSize ? '' : 'aspect-[3/4]';

  const style: React.CSSProperties = {
    ['--base' as string]: base,
    ['--spread' as string]: spread,
    ['--radius' as string]: '14',
    ['--border' as string]: '3',
    ['--backdrop' as string]: 'hsl(0 0% 60% / 0.12)',
    ['--border-size' as string]: '3px',
    ['--spotlight-size' as string]: '200px',
    ['--hue' as string]: `calc(${base} + (var(--xp, 0) * ${spread}))`,
    backgroundImage: 'radial-gradient(var(--spotlight-size) var(--spotlight-size) at calc(var(--x, 0) * 1px) calc(var(--y, 0) * 1px), hsl(var(--hue) 100% 70% / 0.15), transparent)',
    backgroundColor: 'var(--backdrop)',
    backgroundSize: 'calc(100% + 6px) calc(100% + 6px)',
    backgroundPosition: '50% 50%',
    backgroundAttachment: 'fixed',
    border: '3px solid var(--backdrop)',
    position: 'relative',
    touchAction: 'none',
  };
  if (width !== undefined) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height !== undefined) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      ref={cardRef}
      data-glow
      style={style}
      className={`${sizeClasses} ${aspectClass} rounded-2xl relative grid grid-rows-[1fr_auto] shadow-lg p-4 gap-4 backdrop-blur-[5px] border border-border/50 bg-card/80 ${className}`}
    >
      {children}
    </div>
  );
};
