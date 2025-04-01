
import React, { useEffect, useRef } from 'react';

interface TurnstileProps {
  siteKey: string;
  onVerify: (token: string) => void;
}

export function Turnstile({ siteKey, onVerify }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Load the Turnstile script if it hasn't been loaded already
    if (!window.turnstile) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      script.onload = renderWidget;
    } else {
      renderWidget();
    }

    return () => {
      // Clean up widget when component unmounts
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, [siteKey]);

  const renderWidget = () => {
    if (containerRef.current && window.turnstile) {
      // Remove existing widget if it exists
      if (widgetIdRef.current !== null) {
        window.turnstile.remove(widgetIdRef.current);
      }

      // Render new widget
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: onVerify,
        theme: 'auto',
      });
    }
  };

  return <div ref={containerRef} className="my-3"></div>;
}

// Add type definition for Turnstile global object
declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, config: any) => number;
      remove: (widgetId: number) => void;
    };
  }
}
