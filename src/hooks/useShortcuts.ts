import { useEffect } from 'react';

export function useShortcuts(handlers: {
  onNewChat: () => void;
  onSearch: () => void;
  onQuickAction: (index: number) => void;
  onToggleDarkMode: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n': e.preventDefault(); handlers.onNewChat(); break;
          case 'f': e.preventDefault(); handlers.onSearch(); break;
          case 'd': e.preventDefault(); handlers.onToggleDarkMode(); break;
          case '1': case '2': case '3': case '4': case '5': case '6': case '7':
            e.preventDefault();
            handlers.onQuickAction(parseInt(e.key) - 1);
            break;
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handlers]);
}
