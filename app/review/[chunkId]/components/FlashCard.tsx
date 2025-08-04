"use client";

import React from "react";
import Image from "next/image";
import { WordData } from "../types";

interface FlashCardProps {
  word: WordData;
  isFlipped: boolean;
  showEnglish: boolean;
  showImageHint: boolean;
  verbHint: string | null;
  verbTenseLabel: string | null;
  onImageClick: () => void;
}

export default function FlashCard({
  word,
  isFlipped,
  showEnglish,
  showImageHint,
  verbHint,
  verbTenseLabel,
  onImageClick,
}: FlashCardProps) {
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
          <div className="absolute w-[130px] bottom-[0px] right-[127px]  bg-black/80 backdrop-blur-sm text-white text-xs px-2 py-1">
            {verbTenseLabel}
          </div>
        )}
      </div>

      {showImageHint && (
        <div className="mb-2">
          <p className="text-sm text-gray-300">
            👆 Tap/click image to see English word
          </p>
        </div>
      )}

      {showEnglish && (
        <p className="text-base font-semibold mb-3">
          {word.EnglishWord}
        </p>
      )}

      <p className="text-3xl tracking-wider mb-4 min-h-[40px]">
        {!isFlipped ? verbHint ?? "" : word.GeorgianWord}
      </p>
    </div>
  );
}