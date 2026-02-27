import React from 'react';
import { Link } from 'react-router-dom';
import { useParticleBurst } from '@/hooks/useParticleBurst';
import { cn } from '@/lib/utils';

interface NavLinkWithParticlesProps {
  to: string;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  onMouseEnter?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  children: React.ReactNode;
  showParticles?: boolean;
}

export function NavLinkWithParticles({
  to,
  onClick,
  className,
  style,
  onMouseEnter,
  onMouseLeave,
  children,
  showParticles = true,
}: NavLinkWithParticlesProps) {
  const { trigger, portal } = useParticleBurst(showParticles);
  const ref = React.useRef<HTMLAnchorElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    trigger(ref.current);
    onClick?.();
  };

  return (
    <>
      <Link
        ref={ref}
        to={to}
        onClick={handleClick}
        className={cn(className)}
        style={style}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {children}
      </Link>
      {portal}
    </>
  );
}
