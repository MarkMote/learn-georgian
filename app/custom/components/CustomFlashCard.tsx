"use client";

import React, { useState } from "react";
import { CustomWord, CustomReviewMode, CustomExampleMode } from "../types";

interface CustomFlashCardProps {
  word: CustomWord;
  isFlipped: boolean;
  reviewMode: CustomReviewMode;
  showExamples: CustomExampleMode;
  revealedExamples: Set<string>;
  onRevealExamples: (wordKey: string) => void;
}

export default function CustomFlashCard({
  word,
  isFlipped,
  reviewMode,
  showExamples,
  revealedExamples,
  onRevealExamples,
}: CustomFlashCardProps) {
  const [justCopied, setJustCopied] = useState(false);

  const handleCopyContent = (text: string) => {
    navigator.clipboard.writeText(text);
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 400);
  };
  
  // Determine display logic based on mode
  const isReverse = reviewMode === 'reverse';
  const isExampleMode = reviewMode === 'examples';
  const isExampleReverse = reviewMode === 'examples-reverse';
  
  // Determine what to show on front (unflipped) state
  let frontContent = '';
  
  if (isReverse) {
    frontContent = word.back;
  } else if (isExampleMode) {
    frontContent = word.examplePreview || word.front;
  } else if (isExampleReverse) {
    frontContent = word.exampleRevealed || word.back;
  } else {
    frontContent = word.front;
  }

  return (
    <div className="flex flex-col items-center justify-center text-center w-full max-w-sm h-full">
      {/* Main content display */}
      {!isFlipped ? (
        // Front of card
        <div className="flex items-center justify-center h-[280px] w-full">
          <p className={`tracking-wider transition-colors duration-200 text-center px-4 ${
            (() => {
              const length = frontContent.length;
              if (length <= 12) return "text-3xl";
              if (length <= 18) return "text-2xl";
              if (length <= 24) return "text-xl";
              return "text-lg";
            })()
          }`}>
            {frontContent}
          </p>
        </div>
      ) : (
        // Back of card
        <div className="space-y-4">
          {/* Main back content */}
          {reviewMode === 'normal' ? (
            // Normal mode back - show back content
            <div className="mb-4">
              <p className={`tracking-wider transition-colors duration-200 ${
                (() => {
                  const length = word.back.length;
                  if (length <= 12) return "text-3xl";
                  if (length <= 18) return "text-2xl"; 
                  if (length <= 24) return "text-xl";
                  return "text-lg";
                })()
              } ${justCopied ? 'text-green-400' : ''}`}
              onClick={() => handleCopyContent(word.back)}
              style={{ cursor: 'pointer' }}
              title="Click to copy"
              >
                {word.back}
              </p>
            </div>
          ) : isReverse ? (
            // Reverse mode back - show front content
            <div className="mb-4">
              <p className={`tracking-wider transition-colors duration-200 ${
                (() => {
                  const length = word.front.length;
                  if (length <= 12) return "text-2xl";
                  if (length <= 18) return "text-xl"; 
                  if (length <= 24) return "text-lg";
                  return "text-base";
                })()
              } ${justCopied ? 'text-green-400' : ''}`}
              onClick={() => handleCopyContent(word.front)}
              style={{ cursor: 'pointer' }}
              title="Click to copy"
              >
                {word.front}
              </p>
            </div>
          ) : isExampleMode ? (
            // Example mode back - show both preview and revealed
            <div className="flex items-center justify-center h-[100px] w-full">
              <div className="flex flex-col items-center justify-center text-center space-y-3 px-4">
                {word.exampleRevealed && (
                  <p className="text-xl tracking-wide text-gray-200">
                    {word.exampleRevealed}
                  </p>
                )}
                {word.examplePreview && (
                  <p className="text-lg tracking-wide text-gray-400">
                    {word.examplePreview}
                  </p>
                )}
              </div>
            </div>
          ) : (
            // Example-reverse mode back - show both in reverse order
            <div className="flex items-center justify-center h-[100px] w-full">
              <div className="flex flex-col items-center justify-center text-center space-y-3 px-4">
                {word.examplePreview && (
                  <p className="text-xl tracking-wide text-gray-200">
                    {word.examplePreview}
                  </p>
                )}
                {word.exampleRevealed && (
                  <p className="text-lg tracking-wide text-gray-400">
                    {word.exampleRevealed}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Examples section - only for normal and reverse modes when examples exist */}
      {isFlipped && (word.examplePreview || word.exampleRevealed) && (reviewMode === 'normal' || isReverse) && (
        <div className="flex flex-col items-center justify-center text-center w-full max-w-sm py-2">
          {(showExamples === "on" || revealedExamples.has(word.key)) ? (
            <>
              {word.exampleRevealed && (
                <div className="text-lg text-gray-300">
                  {word.exampleRevealed}
                </div>
              )}
              {word.examplePreview && (
                <div className="text-gray-400">
                  {word.examplePreview}
                </div>
              )}
            </>
          ) : (
            (showExamples === "tap" || showExamples === "tap-en" || showExamples === "tap-ka") && (
              <button
                onClick={() => onRevealExamples(word.key)}
                className="px-4 py-0 min-w-[95%] h-[52px] rounded text-sm text-gray-300 bg-white/10 backdrop-blur-sm transition-colors rounded-lg"
              >
                {showExamples === "tap" ? (
                  <p className="text-base text-gray-500 font-mono font-light">example</p>
                ) : showExamples === "tap-en" ? (
                  <p className="text-base text-gray-300 font-normal">{word.examplePreview}</p>
                ) : (
                  <p className="text-base text-gray-300 font-normal">{word.exampleRevealed}</p>
                )}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}