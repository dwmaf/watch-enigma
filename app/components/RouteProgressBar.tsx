'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const COMPLETE_HOLD_MS = 180;

function isModifiedClick(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

function shouldTrackAnchor(anchor: HTMLAnchorElement) {
  if (anchor.target && anchor.target !== '_self') {
    return false;
  }

  if (anchor.hasAttribute('download')) {
    return false;
  }

  const href = anchor.getAttribute('href');
  if (!href || href.startsWith('#')) {
    return false;
  }

  try {
    const url = new URL(anchor.href, window.location.href);
    return url.origin === window.location.origin && url.href !== window.location.href;
  } catch {
    return false;
  }
}

export default function RouteProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const hideTimerRef = useRef<number | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const lastPathRef = useRef(`${pathname}?${searchParams.toString()}`);

  const clearTimers = () => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (progressTimerRef.current) {
      window.clearTimeout(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };

  const startProgress = () => {
    clearTimers();
    setActive(true);
    setProgress(18);

    progressTimerRef.current = window.setTimeout(() => setProgress(52), 140);
    window.setTimeout(() => setProgress(76), 320);
    window.setTimeout(() => setProgress(88), 620);
  };

  const finishProgress = () => {
    clearTimers();
    setProgress(100);
    hideTimerRef.current = window.setTimeout(() => {
      setActive(false);
      setProgress(0);
    }, COMPLETE_HOLD_MS);
  };

  useEffect(() => {
    const currentPath = `${pathname}?${searchParams.toString()}`;
    if (lastPathRef.current !== currentPath) {
      lastPathRef.current = currentPath;
      finishProgress();
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    const onClickCapture = (event: MouseEvent) => {
      if (isModifiedClick(event)) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest('a');
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      if (shouldTrackAnchor(anchor)) {
        startProgress();
      }
    };

    const onSubmitCapture = (event: SubmitEvent) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) {
        return;
      }

      const method = (form.getAttribute('method') || 'get').toLowerCase();
      if (method === 'get') {
        startProgress();
      }
    };

    const onPopState = () => {
      startProgress();
    };

    document.addEventListener('click', onClickCapture, true);
    document.addEventListener('submit', onSubmitCapture, true);
    window.addEventListener('popstate', onPopState);

    return () => {
      document.removeEventListener('click', onClickCapture, true);
      document.removeEventListener('submit', onSubmitCapture, true);
      window.removeEventListener('popstate', onPopState);
      clearTimers();
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-60 h-0.5 w-full overflow-hidden"
    >
      <div className="h-full w-full bg-transparent">
        <div
          className={`h-full origin-left rounded-r-full bg-linear-to-r from-sky-400 via-cyan-400 to-emerald-400 shadow-[0_0_14px_rgba(56,189,248,0.55)] transition-all duration-200 ease-out ${active ? 'opacity-100' : 'opacity-0'}`}
          style={{
            width: `${progress}%`,
            transform: active ? 'scaleX(1)' : 'scaleX(0)',
          }}
        />
      </div>
    </div>
  );
}