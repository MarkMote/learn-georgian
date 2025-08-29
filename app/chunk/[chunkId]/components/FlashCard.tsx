"use client";

import React, { useState } from "react";
import { ChunkData, ReviewMode } from "../types";

interface FlashCardProps {
  chunk: ChunkData;
  isFlipped: boolean;
  showExamples: "off" | "on" | "tap";
  showExplanation: "off" | "on" | "tap";
  revealedExamples: Set<string>;
  revealedExplanations: Set<string>;
  reviewMode: ReviewMode;
  onRevealExamples: (chunkKey: string) => void;
  onRevealExplanation: (chunkKey: string) => void;
}

export default function FlashCard({
  chunk,
  isFlipped,
  showExamples,
  showExplanation,
  revealedExamples,
  revealedExplanations,
  reviewMode,
  onRevealExamples,
  onRevealExplanation,
}: FlashCardProps) {
  const [justCopied, setJustCopied] = useState(false);

  const handleCopyGeorgian = () => {
    navigator.clipboard.writeText(chunk.chunk_ka);
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 400);
  };
  
  const isReverse = reviewMode === 'reverse';
  const isExampleMode = reviewMode === 'examples';
  const isExampleReverse = reviewMode === 'examples-reverse';
  
  let frontContent = '';
  
  if (isReverse) {
    frontContent = chunk.chunk_ka;
  } else if (isExampleMode) {
    frontContent = chunk.example_en || chunk.chunk_en;
  } else if (isExampleReverse) {
    frontContent = chunk.example_ka || chunk.chunk_ka;
  } else {
    frontContent = chunk.chunk_en;
  }

  return (
    <div className="flex flex-col items-center justify-center text-center w-full max-w-lg min-h-[400px]">
      {/* Main content display */}
      {!isFlipped ? (
        // Front of card - centered
        <div className="flex items-center justify-center py-8">
          <p className={`tracking-wider transition-colors duration-200 ${
            (() => {
              const length = frontContent.length;
              if (length <= 20) return "text-3xl";
              if (length <= 40) return "text-2xl";
              if (length <= 60) return "text-xl";
              return "text-lg";
            })()
          }`}>
            {frontContent}
          </p>
        </div>
      ) : (
        // Back of card - structured with main content and additional sections
        <div className="flex flex-col items-center justify-start space-y-6 w-full py-8">
          {/* Main back content */}
          <div className="flex items-center justify-center">
            {reviewMode === 'normal' ? (
              <div className="space-y-3 text-center">
                <p className={`tracking-wider transition-colors duration-200 ${
                  (() => {
                    const length = chunk.chunk_ka.length;
                    if (length <= 20) return "text-2xl";
                    if (length <= 40) return "text-xl"; 
                    if (length <= 60) return "text-lg";
                    return "text-base";
                  })()
                } ${justCopied ? 'text-green-400' : ''}`}
                onClick={handleCopyGeorgian}
                style={{ cursor: 'pointer' }}
                title="Click to copy Georgian text"
                >
                  {chunk.chunk_ka}
                </p>
                <p className="text-lg text-gray-300">
                  {chunk.chunk_en}
                </p>
              </div>
            ) : isReverse ? (
              <div className="space-y-3 text-center">
                <p className={`tracking-wider transition-colors duration-200 ${
                  (() => {
                    const length = chunk.chunk_en.length;
                    if (length <= 20) return "text-2xl";
                    if (length <= 40) return "text-xl"; 
                    if (length <= 60) return "text-lg";
                    return "text-base";
                  })()
                }`}>
                  {chunk.chunk_en}
                </p>
                <p className={`text-lg text-gray-300 ${justCopied ? 'text-green-400' : ''}`}
                onClick={handleCopyGeorgian}
                style={{ cursor: 'pointer' }}
                title="Click to copy Georgian text"
                >
                  {chunk.chunk_ka}
                </p>
              </div>
            ) : isExampleMode ? (
              <div className="flex flex-col items-center justify-center text-center space-y-3">
                {chunk.example_ka && (
                  <p className="text-xl tracking-wide text-gray-200">
                    {chunk.example_ka}
                  </p>
                )}
                {chunk.example_en && (
                  <p className="text-lg tracking-wide text-gray-400">
                    {chunk.example_en}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center space-y-3">
                {chunk.example_en && (
                  <p className="text-xl tracking-wide text-gray-200">
                    {chunk.example_en}
                  </p>
                )}
                {chunk.example_ka && (
                  <p className="text-lg tracking-wide text-gray-400">
                    {chunk.example_ka}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Explanation section - only when in normal or reverse modes */}
          {chunk.explanation && (reviewMode === 'normal' || isReverse) && (
            <div className="w-full max-w-sm">
              {(showExplanation === "on" || revealedExplanations.has(chunk.chunk_key)) ? (
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-sm text-gray-300">
                    {chunk.explanation}
                  </p>
                </div>
              ) : (
                showExplanation === "tap" && (
                  <button
                    onClick={() => onRevealExplanation(chunk.chunk_key)}
                    className="w-full py-3 rounded-lg text-sm text-gray-300 bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20"
                  >
                    <p className="text-base text-gray-500 font-mono font-light">explanation</p>
                  </button>
                )
              )}
            </div>
          )}

          {/* Examples section - only for normal and reverse modes when they have examples */}
          {(chunk.example_ka || chunk.example_en) && (reviewMode === 'normal' || isReverse) && (
            <div className="w-full max-w-sm">
              {(showExamples === "on" || revealedExamples.has(chunk.chunk_key)) ? (
                <div className="text-center space-y-1">
                  {chunk.example_ka && (
                    <div className="text-base text-gray-300">
                      {chunk.example_ka}
                    </div>
                  )}
                  {chunk.example_en && (
                    <div className="text-sm text-gray-400">
                      {chunk.example_en}
                    </div>
                  )}
                </div>
              ) : (
                showExamples === "tap" && (
                  <button
                    onClick={() => onRevealExamples(chunk.chunk_key)}
                    className="w-full py-3 rounded-lg text-sm text-gray-300 bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20"
                  >
                    <p className="text-base text-gray-500 font-mono font-light">example</p>
                  </button>
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}