/**
 * Global keyboard shortcuts for TradeBuddy
 */
import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Cmd/Ctrl + key
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
        return;
      }

      // Single key shortcuts (only when not in form)
      switch (e.key.toLowerCase()) {
        case 'n':
          if (!mod) {
            e.preventDefault();
            navigate('/add-trade');
          }
          break;
        case 't':
          if (!mod) {
            e.preventDefault();
            navigate('/trade-history');
          }
          break;
        case 'd':
          if (!mod) {
            e.preventDefault();
            navigate('/dashboard');
          }
          break;
        case 'escape':
          (document.activeElement as HTMLElement)?.blur();
          break;
        default:
          break;
      }
    },
    [navigate]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
