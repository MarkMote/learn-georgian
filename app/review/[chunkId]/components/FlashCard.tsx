"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { WordData, ReviewMode, ExampleMode } from "../types";

interface FlashCardProps {
  word: WordData;
  isFlipped: boolean;
  showEnglish: boolean;
  showImageHint: boolean;
  showExamples: ExampleMode;
  revealedExamples: Set<string>;
  verbHint: string | null;
  verbTenseLabel: string | null;
  reviewMode: ReviewMode;
  showTips: boolean;
  onImageClick: () => void;
  onRevealExamples: (wordKey: string) => void;
}

export default function FlashCard({
  word,
  isFlipped,
  showEnglish,
  showImageHint,
  showExamples,
  revealedExamples,
  verbHint,
  verbTenseLabel,
  reviewMode,
  showTips,
  onImageClick,
  onRevealExamples,
}: FlashCardProps) {
  const [justCopied, setJustCopied] = useState(false);

  const handleCopyGeorgian = () => {
    navigator.clipboard.writeText(word.GeorgianWord);
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 400);
  };
  
  // Determine display logic based on mode
  const isReverse = reviewMode === 'reverse';
  const isExampleMode = reviewMode === 'examples';
  const isExampleReverse = reviewMode === 'examples-reverse';
  
  // Determine what to show on front (unflipped) state
  let frontContent = '';
  let showImageOnFront = false;
  
  if (isReverse) {
    // Reverse: Georgian word on front, no image
    frontContent = word.GeorgianWord;
    showImageOnFront = false;
  } else if (isExampleMode) {
    // Examples: English example on front, no image
    frontContent = word.ExampleEnglish1 || word.EnglishWord;
    showImageOnFront = false;
  } else if (isExampleReverse) {
    // Examples Reverse: Georgian example on front, no image
    frontContent = word.ExampleGeorgian1 || word.GeorgianWord;
    showImageOnFront = false;
  } else {
    // Normal mode: English word (or verb hint) on front, with image
    frontContent = verbHint || word.EnglishWord;
    showImageOnFront = true;
  }

  return (
    <div className="flex flex-col items-center justify-center text-center w-full max-w-sm h-full">
      {/* Image display logic based on mode */}
      {reviewMode === 'normal' ? (
        // Normal mode: always show image
        <div className="relative w-full mb-3 h-[270px] md:h-[350px]">
          <Image
            src={`/img/${word.img_key}.webp`}
            alt={word.EnglishWord}
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            className="object-contain cursor-pointer"
            onClick={onImageClick}
            priority
          />
          {verbTenseLabel && !isFlipped && verbHint && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded">
              {verbTenseLabel}
            </div>
          )}
        </div>
      ) : isReverse ? (
        // Reverse mode: show image on back only
        isFlipped ? (
          <div className="relative w-full mb-3" style={{ height: '280px' }}>
            <Image
              src={`/img/${word.img_key}.webp`}
              alt={word.EnglishWord}
              fill
              sizes="(max-width: 768px) 100vw, 320px"
              className="object-contain cursor-pointer"
              onClick={onImageClick}
              priority
            />
          </div>
        ) : (
          <div className="flex items-center justify-center" style={{ minHeight: '280px' }} />
        )
      ) : null
      // Example modes: no image - removed placeholder for better centering
      }

      {showImageHint && (showImageOnFront || (isReverse && isFlipped)) && (
        <div className="mb-2">
          <p className="text-sm text-gray-300">
            <span className="animate-pulse">👆</span> Tap/click image to see English word
          </p>
        </div>
      )}

      {showEnglish && (showImageOnFront || (isReverse && isFlipped)) && (
        <p className="text-base font-semibold mb-3">
          {word.EnglishWord}
        </p>
      )}

      {/* Main content display */}
      {!isFlipped ? (
        // Front of card
        reviewMode === 'normal' ? (
          // Normal mode front - only show verb hint, not the English word
          <div className="mb-4 min-h-[40px]">
            {verbHint && (
              <p className={`tracking-wider transition-colors duration-200 ${
                (() => {
                  const length = verbHint.length;
                  if (length <= 12) return "text-3xl";
                  if (length <= 18) return "text-2xl";
                  if (length <= 24) return "text-xl";
                  return "text-lg";
                })()
              }`}>
                {verbHint}
              </p>
            )}
          </div>
        ) : (
          // Other modes front: centered content
          <div className="flex items-center justify-center w-full">
            {isExampleMode || isExampleReverse ? (
              // For example modes, show the full sentence
              <p className="text-xl tracking-wide text-center px-4">
                {frontContent}
              </p>
            ) : (
              // For reverse mode, show Georgian word
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
            )}
          </div>
        )
      ) : (
        // Back of card
        reviewMode === 'normal' ? (
          // Normal mode back (keep existing behavior - just Georgian word)
          <div className="mb-4">
            <p className={`tracking-wider transition-colors duration-200 ${
              (() => {
                const length = word.GeorgianWord.length;
                if (length <= 12) return "text-3xl";
                if (length <= 18) return "text-2xl"; 
                if (length <= 24) return "text-xl";
                return "text-lg";
              })()
            } ${justCopied ? 'text-green-400' : ''}`}
            onClick={handleCopyGeorgian}
            style={{ cursor: 'pointer' }}
            title="Click to copy Georgian word"
            >
              {word.GeorgianWord}
            </p>
          </div>
        ) : isReverse ? (
          // Reverse mode back: show Georgian word (English shown via image tap)
          <div className="space-y-2 mb-4">
            {/* Georgian word */}
            <p className={`tracking-wider transition-colors duration-200 ${
              (() => {
                const length = word.GeorgianWord.length;
                if (length <= 12) return "text-2xl";
                if (length <= 18) return "text-xl"; 
                if (length <= 24) return "text-lg";
                return "text-base";
              })()
            } ${justCopied ? 'text-green-400' : ''}`}
            onClick={handleCopyGeorgian}
            style={{ cursor: 'pointer' }}
            title="Click to copy Georgian word"
            >
              {word.GeorgianWord}
            </p>
          </div>
        ) : isExampleMode ? (
          // Example mode back: show both sentences (centered)
          <div className="flex items-center justify-center w-full">
            <div className="flex flex-col items-center justify-center text-center space-y-3 px-4">
              {word.ExampleGeorgian1 && (
                <p className="text-xl tracking-wide text-gray-200">
                  {word.ExampleGeorgian1}
                </p>
              )}
              {word.ExampleEnglish1 && (
                <p className="text-lg tracking-wide text-gray-400">
                  {word.ExampleEnglish1}
                </p>
              )}
            </div>
          </div>
        ) : (
          // Example-reverse mode back: show both sentences (centered)
          <div className="flex items-center justify-center w-full">
            <div className="flex flex-col items-center justify-center text-center space-y-3 px-4">
              {word.ExampleEnglish1 && (
                <p className="text-xl tracking-wide text-gray-200">
                  {word.ExampleEnglish1}
                </p>
              )}
              {word.ExampleGeorgian1 && (
                <p className="text-lg tracking-wide text-gray-400">
                  {word.ExampleGeorgian1}
                </p>
              )}
            </div>
          </div>
        )
      )}

      {/* Examples section - only for normal and reverse modes */}
      {isFlipped && (word.ExampleGeorgian1 || word.ExampleEnglish1) && (reviewMode === 'normal' || isReverse) && (
        <div className="flex flex-col items-center justify-center text-center w-full max-w-sm py-2">
          {/* Both normal and reverse modes: respect showExamples settings */}
          {(showExamples === "on" || revealedExamples.has(word.key)) ? (
            <>
              {word.ExampleGeorgian1 && (
                <div className="text-lg text-gray-300">
                  {word.ExampleGeorgian1}
                </div>
              )}
              {word.ExampleEnglish1 && (
                <div className="text-gray-400">
                  {word.ExampleEnglish1}
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
                  <p className="text-base text-gray-300 font-normal">{word.ExampleEnglish1}</p>
                ) : (
                  <p className="text-base text-gray-300 font-normal">{word.ExampleGeorgian1}</p>
                )}
              </button>
            )
          )}
        </div>
      )}

      {/* Tips section - show when flipped and tips are enabled */}
      {isFlipped && showTips && word.tips && (
        <div className={`flex flex-col items-center justify-center text-center w-full max-w-lg py-3 ${(isExampleMode || isExampleReverse) ? 'mt-6' : ''}`}>
          <div className="flex items-center gap-2 text-xs md:text-sm text-slate-300">
            <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 flex-shrink-0" />
            <span>{word.tips}</span>
          </div>
        </div>
      )}
    </div>
  );
}