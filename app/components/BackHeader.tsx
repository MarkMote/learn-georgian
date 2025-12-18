// app/components/BackHeader.tsx
"use client";

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface BackHeaderProps {
  href?: string;
  label?: string;
}

export default function BackHeader({
  href = "/",
  label = "Back to Home"
}: BackHeaderProps) {
  return (
    <header className="sticky top-0 bg-neutral-950/95 backdrop-blur-sm border-b border-gray-800 z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <Link
          href={href}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium pt-1">{label}</span>
        </Link>
      </div>
    </header>
  );
}
