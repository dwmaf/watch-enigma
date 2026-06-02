'use client';

import Link from 'next/link';

export default function BackButton({ href = '/' }: { href?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-sm font-medium rounded-lg transition"
    >
      &larr; Back to Overview
    </Link>
  );
}
