"use client";

import React, { useState } from "react";
import Image from "next/image";
import { WordData, KnownWordState } from "../../review/[chunkId]/types";

interface WordCardProps {
  word: WordData;
  progress: KnownWordState | null;
  isLazyLoaded: boolean;
}

function getRatingColor(rating: number): string {
  switch (rating) {
    case 3: return "bg-green-500"; // Easy
    case 2: return "bg-yellow-500"; // Good
    case 1: return "bg-orange-500"; // Hard
    case 0: return "bg-red-500"; // Fail
    default: return "bg-gray-500"; // Unknown
  }
}


export default function WordCard({ word, progress, isLazyLoaded }: WordCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const rating = progress ? progress.rating : -1;
  const repetitions = progress ? progress.repetitions : 0;

  return (
    <div className="bg-gray-900 rounded-lg p-4 flex items-center gap-4 hover:bg-gray-800 transition-colors">
      {/* Image */}
      <div className="flex-shrink-0 w-16 h-16 bg-gray-700 rounded-lg overflow-hidden relative">
        {!imageError && (
          <Image
            src={`/img/${word.img_key}.webp`}
            alt={word.EnglishWord}
            fill
            className={`object-cover transition-opacity duration-300 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            loading={isLazyLoaded ? "lazy" : "eager"}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}
        {!imageLoaded && !imageError && (
          <div className="w-full h-full bg-gray-700 animate-pulse" />
        )}
        {imageError && (
          <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-500 text-xs">
            No image
          </div>
        )}
      </div>

      {/* Word content */}
      <div className="flex-grow min-w-0">
        <div className="flex flex-col">
          <h3 className="text-base font-medium text-white">
            {word.GeorgianWord}
          </h3>
          <p className="text-gray-300 text-sm">
            {word.EnglishWord}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-500">
            {word.PartOfSpeech}
          </span>
          {progress && (
            <>
              <span className="text-gray-500">•</span>
              <span className="text-xs text-gray-500">
                {repetitions} repetition{repetitions !== 1 ? 's' : ''}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Progress indicator */}
      <div className="flex-shrink-0">
        <div className={`w-3 h-3 rounded-full ${getRatingColor(rating)}`} />
      </div>
    </div>
  );
}