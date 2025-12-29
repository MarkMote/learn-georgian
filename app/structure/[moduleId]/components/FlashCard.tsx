// app/structure/[moduleId]/components/FlashCard.tsx
"use client";

import React, { useState } from "react";
import { FrameExampleData, FrameData, ReviewMode } from "../types";
import { Info } from "lucide-react";

interface FlashCardProps {
  example: FrameExampleData;
  frame: FrameData;
  isFlipped: boolean;
  reviewMode: ReviewMode;
  onExplainClick: () => void;
  showContext: boolean;
}

export default function FlashCard({
  example,
  frame,
  isFlipped,
  reviewMode,
  onExplainClick,
  showContext,
}: FlashCardProps) {
  const [justCopied, setJustCopied] = useState(false);

  const handleCopyGeorgian = () => {
    navigator.clipboard.writeText(example.georgian);
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 400);
  };

  const isReverse = reviewMode === 'reverse';

  // Front content depends on mode
  const frontMain = isReverse ? example.georgian : example.english;
  const frontContext = example.context;

  // Dynamic text sizing based on length
  const getTextSize = (text: string, isMain: boolean) => {
    const length = text.length;
    if (isMain) {
      if (length <= 30) return "text-2xl";
      if (length <= 50) return "text-xl";
      if (length <= 80) return "text-lg";
      return "text-base";
    }
    return "text-sm";
  };

  return (
    <div className="flex flex-col items-center justify-center text-center w-full max-w-lg min-h-[400px]">
      {!isFlipped ? (
        // Front of card
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <p className={`tracking-wide transition-colors duration-200 ${getTextSize(frontMain, true)}`}>
            {frontMain}
          </p>
          {showContext && frontContext && (
            <p className="text-sm text-gray-500 italic">
              {frontContext}
            </p>
          )}
        </div>
      ) : (
        // Back of card
        <div className="flex flex-col items-center justify-start space-y-5 w-full py-6 relative">
          {/* Explain button - top right */}
          <button
            onClick={onExplainClick}
            className="absolute top-0 right-0 p-2 text-gray-400 hover:text-gray-200 transition-colors"
            title="Explain this frame"
          >
            <Info className="w-5 h-5" />
          </button>

          {/* Main content */}
          <div className="space-y-3 text-center px-4">
            {isReverse ? (
              // Reverse mode: show English as main, Georgian as secondary
              <>
                <p className={`tracking-wide transition-colors duration-200 ${getTextSize(example.english, true)}`}>
                  {example.english}
                </p>
                <p
                  className={`text-lg text-gray-300 cursor-pointer ${justCopied ? 'text-green-400' : ''}`}
                  onClick={handleCopyGeorgian}
                  title="Click to copy Georgian text"
                >
                  {example.georgian}
                </p>
              </>
            ) : (
              // Normal mode: show Georgian as main, English as secondary
              <>
                <p
                  className={`tracking-wide transition-colors duration-200 cursor-pointer ${getTextSize(example.georgian, true)} ${justCopied ? 'text-green-400' : ''}`}
                  onClick={handleCopyGeorgian}
                  title="Click to copy Georgian text"
                >
                  {example.georgian}
                </p>
                <p className="text-lg text-gray-300">
                  {example.english}
                </p>
              </>
            )}
          </div>

          {/* Usage tip - if available */}
          {example.usage_tip && (
            <div className="w-full max-w-sm px-4">
              <div className="border-t border-gray-700 pt-3">
                <p className="text-sm text-gray-400">
                  {example.usage_tip}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
