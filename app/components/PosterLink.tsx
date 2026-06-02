'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

const SCROLL_KEY = 'watchdeck-home-scroll-position';

export default function PosterLink({
  href,
  children,
  className = 'group block',
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      className={className}
      onClick={() => {
        window.sessionStorage.setItem(
          SCROLL_KEY,
          JSON.stringify({ y: window.scrollY })
        );
      }}
    >
      {children}
    </Link>
  );
}
