"use client";

import React, { useState } from "react";
import Image from "next/image";
import { WordData } from "../types";

interface FlashCardProps {
  word: WordData;
  isFlipped: boolean;
  showEnglish: boolean;
  showImageHint: boolean;
  showExamples: "off" | "on" | "tap";
  revealedExamples: Set<string>;
  verbHint: string | null;
  verbTenseLabel: string | null;
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
  onImageClick,
  onRevealExamples,
}: FlashCardProps) {
  const [justCopied, setJustCopied] = useState(false);

  const handleCopyGeorgian = () => {
    navigator.clipboard.writeText(word.GeorgianWord);
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 400);
  };

  return (
    <div className="flex flex-col items-center justify-center text-center w-full max-w-sm">
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
        {verbTenseLabel && !isFlipped && verbHint && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded">
            {verbTenseLabel}
          </div>
        )}
      </div>

      {showImageHint && (
        <div className="mb-2">
          <p className="text-sm text-gray-300">
            <span className="animate-pulse">👆</span> Tap/click image to see English word
          </p>
        </div>
      )}

      {showEnglish && (
        <p className="text-base font-semibold mb-3">
          {word.EnglishWord}
        </p>
      )}

      <p className={`tracking-wider mb-4 min-h-[40px] transition-colors duration-200 ${
        (() => {
          const text = !isFlipped ? verbHint ?? "" : word.GeorgianWord;
          const length = text.length;
          if (length <= 12) return "text-3xl";
          if (length <= 18) return "text-2xl";
          if (length <= 24) return "text-xl";
          return "text-lg";
        })()
      } ${justCopied ? 'text-green-400' : ''}`}
      onClick={isFlipped ? handleCopyGeorgian : undefined}
      style={isFlipped ? { cursor: 'pointer' } : undefined}
      title={isFlipped ? "Click to copy Georgian word" : undefined}
      >
        {!isFlipped ? verbHint ?? "" : word.GeorgianWord}
      </p>

      {isFlipped && showExamples !== "off" && (word.ExampleGeorgian1 || word.ExampleEnglish1) && (
        <div className="flex flex-col items-center justify-center text-center w-full max-w-sm py-2">
          {showExamples === "on" || revealedExamples.has(word.key) ? (
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
            <button
              onClick={() => onRevealExamples(word.key)}
              className="px-4 py-0 min-w-[95%] h-[52px] rounded text-sm text-gray-300 bg-white/5 backdrop-blur-sm transition-colors rounded-lg"
            >
                <p className="text-xs text-gray-500">example</p>
              {/* <div className="">
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
              </div> */}
            </button>
          )}
        </div>
      )}
    </div>
  );
}