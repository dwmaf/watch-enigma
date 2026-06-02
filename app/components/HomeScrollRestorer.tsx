'use client';

import { useEffect } from 'react';

const SCROLL_KEY = 'watchdeck-home-scroll-position';

export default function HomeScrollRestorer() {
  useEffect(() => {
    const raw = window.sessionStorage.getItem(SCROLL_KEY);
    if (!raw) {
      return;
    }

    window.sessionStorage.removeItem(SCROLL_KEY);

    try {
      const { y } = JSON.parse(raw) as { y?: number };
      if (typeof y === 'number') {
        window.requestAnimationFrame(() => {
          window.scrollTo({ top: y, behavior: 'auto' });
        });
      }
    } catch {
      // ignore malformed state
    }
  }, []);

  return null;
}
