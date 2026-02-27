/**
 * Theme-aware audio player with custom UI (play/pause, progress, time).
 * No native controls – avoids white/browser-default styling.
 * Pattern: ref + play()/pause() + onPlay/onPause sync (Context7 React docs).
 */

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

export interface AudioPlayerProps {
  src: string;
  duration?: number; // optional, for display before load
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function AudioPlayer({ src, duration: propDuration, className, onPlay, onPause }: AudioPlayerProps) {
  const { themeConfig } = useTheme();
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(propDuration ?? 0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onTimeUpdate = () => setCurrentTime(el.currentTime);
    const onDurationChange = () => setDuration(el.duration);
    const onEnded = () => {
      setPlaying(false);
      setCurrentTime(0);
    };
    const onLoadedMetadata = () => {
      setDuration(el.duration);
      setReady(true);
    };

    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('durationchange', onDurationChange);
    el.addEventListener('ended', onEnded);
    el.addEventListener('loadedmetadata', onLoadedMetadata);
    return () => {
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('durationchange', onDurationChange);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('loadedmetadata', onLoadedMetadata);
    };
  }, [src]);

  useEffect(() => {
    if (propDuration != null && propDuration > 0 && !ready) setDuration(propDuration);
  }, [propDuration, ready]);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (playing) {
      el.pause();
      onPause?.();
    } else {
      el.play().catch(() => {});
      onPlay?.();
    }
    setPlaying(!playing);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    el.currentTime = pct * duration;
    setCurrentTime(el.currentTime);
  };

  const displayDuration = duration > 0 ? duration : (propDuration ?? 0);
  const progress = displayDuration > 0 ? currentTime / displayDuration : 0;

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border p-2.5',
        className
      )}
      style={{
        backgroundColor: themeConfig.card,
        borderColor: themeConfig.border,
      }}
    >
      <audio ref={ref} src={src} preload="metadata" className="hidden" />
      <button
        type="button"
        onClick={toggle}
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-opacity hover:opacity-90"
        style={{
          backgroundColor: themeConfig.accent,
          color: themeConfig.accentForeground,
        }}
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div
          role="progressbar"
          aria-valuenow={currentTime}
          aria-valuemin={0}
          aria-valuemax={displayDuration}
          className="h-2 rounded-full cursor-pointer overflow-hidden"
          style={{ backgroundColor: themeConfig.muted + '60' }}
          onClick={seek}
        >
          <div
            className="h-full rounded-full transition-all duration-150 ease-out"
            style={{
              width: `${progress * 100}%`,
              backgroundColor: themeConfig.accent,
            }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs" style={{ color: themeConfig.mutedForeground }}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(displayDuration)}</span>
        </div>
      </div>
    </div>
  );
}
