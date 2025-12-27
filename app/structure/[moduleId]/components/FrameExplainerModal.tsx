// app/structure/[moduleId]/components/FrameExplainerModal.tsx
"use client";

import React from "react";
import { X } from 'lucide-react';
import { FrameData } from '../types';

interface FrameExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  frame: FrameData | null;
}

// Helper to render markdown-style bold text (**text**)
function renderWithBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <span key={index} className="font-semibold text-gray-200">
          {part.slice(2, -2)}
        </span>
      );
    }
    return part;
  });
}

export default function FrameExplainerModal({
  isOpen,
  onClose,
  frame,
}: FrameExplainerModalProps) {
  if (!isOpen || !frame) return null;

  return (
    <div
      className="fixed inset-0 bg-neutral-950/95 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 w-full max-w-lg max-h-[80vh] rounded-xl flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            {frame.frame_name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Slot Map */}
          {frame.slot_map && (
            <div>
              <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                Pattern
              </h3>
              <div className="bg-gray-800 rounded-lg px-4 py-3">
                <p className="text-sm font-mono text-gray-300">
                  {frame.slot_map}
                </p>
              </div>
            </div>
          )}

          {/* Usage Summary */}
          {frame.usage_summary && (
            <div>
              <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                When to Use
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {frame.usage_summary}
              </p>
            </div>
          )}

          {/* Deep Grammar */}
          {frame.deep_grammar && (
            <div>
              <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                Grammar Explanation
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {renderWithBold(frame.deep_grammar)}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
