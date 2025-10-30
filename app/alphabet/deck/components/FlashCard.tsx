// app/alphabet/deck/components/FlashCard.tsx
"use client";

import React, { useState } from "react";
import { AlphabetData } from "../types";

interface FlashCardProps {
  letter: AlphabetData;
  isFlipped: boolean;
}

export default function FlashCard({
  letter,
  isFlipped,
}: FlashCardProps) {
  const [justCopied, setJustCopied] = useState(false);

  const handleCopyGeorgian = () => {
    navigator.clipboard.writeText(letter.georgianLetter);
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 400);
  };

  return (
    <div className="flex flex-col items-center justify-center text-center w-full max-w-lg min-h-[400px]">
      {!isFlipped ? (
        // Front of card - just the Georgian letter in large font
        <div className="flex items-center justify-center py-8">
          <p className="text-8xl md:text-9xl tracking-wider">
            {letter.georgianLetter}
          </p>
        </div>
      ) : (
        // Back of card - Georgian letter + transliteration + IPA + explanation + example
        <div className="flex flex-col items-center justify-start space-y-4 w-full py-8  ">
          {/* Georgian letter (still shown) */}
          <p
            className={`text-6xl md:text-7xl tracking-wider cursor-pointer mb-6 ${justCopied ? 'text-green-400' : ''}`}
            onClick={handleCopyGeorgian}
            title="Click to copy Georgian letter"
          >
            {letter.georgianLetter}
          </p>
          <div className="w-full h-px bg-gray-800 my-1 max-w-[200px]"></div>

          {/* Transliteration and IPA */}
          <p className="text-4xl pt-3 text-gray-200 mt-6">
            {letter.englishLetter} <span className="text-gray-300">({letter.ipaSymbol})</span>
          </p>

          {/* Explanation */}
          <p className="text-base text-gray-200 max-w-md px-4">
            {letter.explanation}
          </p>


          {/* Georgian example with translation */}
          {letter.georgianExample && (
            <div className="mt-6 space-y-2">
              <p className="text-base mt-2 text-gray-400">
                Example:
                </p>
              <p className="text-xl text-gray-200">
                {letter.georgianExample}
              </p>
              {letter.translation && (
                <p className="text-lg text-gray-300 ">
                  {letter.translation}
                </p>
              )}
            </div>
          )}

          {/* English example (if provided) */}
          {/* {letter.englishExample && (
            <p className="text-sm text-gray-300 italic mt-2">
              "{letter.englishExample}"
            </p>
          )} */}
        </div>
      )}
    </div>
  );
}
