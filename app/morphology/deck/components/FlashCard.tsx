// app/morphology/deck/components/FlashCard.tsx
"use client";

import React, { useState } from "react";
import { MorphologyData } from "../types";

interface FlashCardProps {
  marker: MorphologyData;
  isFlipped: boolean;
}

export default function FlashCard({
  marker,
  isFlipped,
}: FlashCardProps) {
  const [justCopied, setJustCopied] = useState(false);

  const handleCopyMarker = () => {
    navigator.clipboard.writeText(marker.marker);
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 400);
  };

  // Parse example to separate Georgian and English parts (format: "გაღება • opening")
  const parseExample = (example: string) => {
    const parts = example.split("•").map(s => s.trim());
    return {
      georgian: parts[0] || "",
      english: parts[1] || ""
    };
  };

  const example1 = parseExample(marker.example1);
  const example2 = parseExample(marker.example2);

  return (
    <div className="flex flex-col items-center justify-center text-center w-full max-w-lg min-h-[400px]">
      {!isFlipped ? (
        // Front of card - just the marker in large font
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-7xl md:text-8xl tracking-wider">
            {marker.marker}
          </p>
          <p className="text-sm text-gray-500 mt-4">
            {marker.markerType}
          </p>
        </div>
      ) : (
        // Back of card - marker + meaning + examples
        <div className="flex flex-col items-center justify-start space-y-4 w-full py-8">
          {/* Marker (still shown) */}
          <p
            className={`text-5xl md:text-6xl tracking-wider cursor-pointer mb-2 ${justCopied ? 'text-green-400' : ''}`}
            onClick={handleCopyMarker}
            title="Click to copy marker"
          >
            {marker.marker}
          </p>

          {/* Marker Type */}
          <p className="text-sm text-gray-500">
            {marker.markerType}
          </p>

          <div className="w-full h-px bg-gray-800 my-1 max-w-[200px]"></div>

          {/* Meaning */}
          <p className="text-2xl pt-3 text-gray-200">
            {marker.meaning}
          </p>

          {/* Examples */}
          <div className="mt-6 space-y-4 w-full px-4">
            {marker.example1 && (
              <div className="bg-gray-900/50 rounded-lg p-3">
                <p className="text-xl text-gray-100">
                  {example1.georgian}
                </p>
                <p className="text-base text-gray-400">
                  {example1.english}
                </p>
              </div>
            )}

            {marker.example2 && (
              <div className="bg-gray-900/50 rounded-lg p-3">
                <p className="text-xl text-gray-100">
                  {example2.georgian}
                </p>
                <p className="text-base text-gray-400">
                  {example2.english}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
