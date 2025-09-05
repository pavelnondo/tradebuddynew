import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut,
  Move,
  Hand
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TouchGesturesProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
  onDoubleTap?: () => void;
  enableGestures?: boolean;
  className?: string;
}

export function TouchGestures({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPinch,
  onDoubleTap,
  enableGestures = true,
  className
}: TouchGesturesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number; time: number } | null>(null);
  const [lastTap, setLastTap] = useState<number>(0);
  const [isGesturing, setIsGesturing] = useState(false);
  const [gestureHint, setGestureHint] = useState<string>('');

  const minSwipeDistance = 50;
  const maxSwipeTime = 300;
  const doubleTapDelay = 300;

  useEffect(() => {
    if (!enableGestures || !containerRef.current) return;

    const container = containerRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        setTouchStart({
          x: touch.clientX,
          y: touch.clientY,
          time: Date.now()
        });
        setTouchEnd(null);
        setIsGesturing(true);
      } else if (e.touches.length === 2) {
        // Pinch gesture
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        setTouchStart({ x: distance, y: 0, time: Date.now() });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && touchStart) {
        const touch = e.touches[0];
        setTouchEnd({
          x: touch.clientX,
          y: touch.clientY,
          time: Date.now()
        });
      } else if (e.touches.length === 2 && touchStart) {
        // Pinch gesture
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        const scale = distance / touchStart.x;
        onPinch?.(scale);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart || !touchEnd) {
        setIsGesturing(false);
        return;
      }

      const deltaX = touchEnd.x - touchStart.x;
      const deltaY = touchEnd.y - touchStart.y;
      const deltaTime = touchEnd.time - touchStart.time;

      // Check for double tap
      const now = Date.now();
      if (now - lastTap < doubleTapDelay) {
        onDoubleTap?.();
        setLastTap(0);
        setIsGesturing(false);
        return;
      }
      setLastTap(now);

      // Check for swipe gestures
      if (deltaTime < maxSwipeTime) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Horizontal swipe
          if (Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0) {
              onSwipeRight?.();
              setGestureHint('Swipe Right');
            } else {
              onSwipeLeft?.();
              setGestureHint('Swipe Left');
            }
          }
        } else {
          // Vertical swipe
          if (Math.abs(deltaY) > minSwipeDistance) {
            if (deltaY > 0) {
              onSwipeDown?.();
              setGestureHint('Swipe Down');
            } else {
              onSwipeUp?.();
              setGestureHint('Swipe Up');
            }
          }
        }
      }

      setIsGesturing(false);
      setTouchStart(null);
      setTouchEnd(null);

      // Clear gesture hint after delay
      setTimeout(() => setGestureHint(''), 1000);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enableGestures, touchStart, touchEnd, lastTap, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onPinch, onDoubleTap]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative",
        isGesturing && "select-none",
        className
      )}
    >
      {children}
      
      {/* Gesture Hint Overlay */}
      {gestureHint && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
          <Card className="bg-black/80 text-white border-0">
            <CardContent className="p-2">
              <div className="flex items-center space-x-2 text-sm">
                <Hand className="w-4 h-4" />
                <span>{gestureHint}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Navigation Swipe Component
export function NavigationSwipe({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const pages = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/trades', label: 'Trades' },
    { path: '/analysis', label: 'Analysis' },
    { path: '/psychology', label: 'Psychology' },
    { path: '/professional-analytics', label: 'Analytics' },
    { path: '/trade-management', label: 'Management' },
    { path: '/planning-goals', label: 'Goals' },
  ];

  const handleSwipeLeft = () => {
    const nextIndex = (currentIndex + 1) % pages.length;
    setCurrentIndex(nextIndex);
    navigate(pages[nextIndex].path);
  };

  const handleSwipeRight = () => {
    const prevIndex = currentIndex === 0 ? pages.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    navigate(pages[prevIndex].path);
  };

  return (
    <TouchGestures
      onSwipeLeft={handleSwipeLeft}
      onSwipeRight={handleSwipeRight}
      enableGestures={true}
    >
      {children}
    </TouchGestures>
  );
}

// Chart Zoom Component
export function ChartZoom({ children, onZoomIn, onZoomOut, onReset }: {
  children: React.ReactNode;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onReset?: () => void;
}) {
  const [scale, setScale] = useState(1);

  const handlePinch = (pinchScale: number) => {
    const newScale = Math.max(0.5, Math.min(3, scale * pinchScale));
    setScale(newScale);
  };

  const handleDoubleTap = () => {
    setScale(1);
    onReset?.();
  };

  return (
    <TouchGestures
      onPinch={handlePinch}
      onDoubleTap={handleDoubleTap}
      enableGestures={true}
    >
      <div className="relative">
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'center',
            transition: 'transform 0.2s ease-in-out'
          }}
        >
          {children}
        </div>
        
        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setScale(Math.min(3, scale + 0.2));
              onZoomIn?.();
            }}
            className="w-8 h-8 p-0"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setScale(Math.max(0.5, scale - 0.2));
              onZoomOut?.();
            }}
            className="w-8 h-8 p-0"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setScale(1);
              onReset?.();
            }}
            className="w-8 h-8 p-0"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </TouchGestures>
  );
}
