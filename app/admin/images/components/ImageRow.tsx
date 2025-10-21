// app/admin/images/components/ImageRow.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";
import { WordData } from "@/lib/spacedRepetition/types";
import { generateDefaultPrompt } from "../lib/promptGeneration";
import { GeneratedImage } from "../types";

interface ImageRowProps {
  word: WordData;
  onImageGenerated: (generatedImage: GeneratedImage) => void;
}

export default function ImageRow({ word, onImageGenerated }: ImageRowProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [customStyle, setCustomStyle] = useState<"natural" | "vivid">("natural");

  const handleRefresh = async () => {
    setIsGenerating(true);
    try {
      const defaultPrompt = generateDefaultPrompt(word);
      const response = await fetch("/api/admin/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: defaultPrompt, style: "natural" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate image");
      }

      const data = await response.json();
      onImageGenerated({
        imageBase64: data.image,
        prompt: data.prompt,
        imgKey: word.img_key,
      });
    } catch (error: any) {
      console.error("Error generating image:", error);
      alert(`Failed to generate image:\n\n${error.message}\n\nTry rephrasing your prompt to avoid content filters.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCustomPromptSubmit = async () => {
    if (!customPrompt.trim()) {
      alert("Please enter a custom prompt");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/admin/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: customPrompt, style: customStyle }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate image");
      }

      const data = await response.json();
      onImageGenerated({
        imageBase64: data.image,
        prompt: data.prompt,
        imgKey: word.img_key,
      });
      setShowCustomPrompt(false);
      setCustomPrompt("");
    } catch (error: any) {
      console.error("Error generating image:", error);
      alert(`Failed to generate image:\n\n${error.message}\n\nTry rephrasing your prompt to avoid content filters.`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <div className="flex items-center gap-4">
        {/* Image thumbnail */}
        <div className="flex-shrink-0 w-[300px] h-[300px] bg-gray-700 rounded-lg overflow-hidden relative">
          {!imageError && (
            <Image
              src={`/img/${word.img_key}.webp`}
              alt={word.EnglishWord}
              fill
              className={`object-cover transition-opacity duration-300 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              loading="lazy"
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

        {/* Word info */}
        <div className="flex-grow min-w-0">
          <div className="flex flex-col">
            <h3 className="text-base font-medium text-white">
              {word.GeorgianWord}
            </h3>
            <p className="text-gray-300 text-sm">{word.EnglishWord}</p>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {word.PartOfSpeech} • {word.img_key}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex-shrink-0 flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={isGenerating}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
          >
            {isGenerating ? "Generating..." : "Refresh"}
          </button>
          <button
            onClick={() => setShowCustomPrompt(!showCustomPrompt)}
            disabled={isGenerating}
            className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
          >
            Custom Prompt
          </button>
        </div>
      </div>

      {/* Custom prompt input */}
      {showCustomPrompt && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Enter custom prompt..."
              className="flex-grow px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCustomPromptSubmit();
                }
              }}
            />
          </div>
          <div className="flex gap-2 items-center">
            <label className="text-sm text-gray-400">Style:</label>
            <select
              value={customStyle}
              onChange={(e) => setCustomStyle(e.target.value as "natural" | "vivid")}
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="natural">Natural</option>
              <option value="vivid">Vivid</option>
            </select>
            <div className="flex-grow"></div>
            <button
              onClick={handleCustomPromptSubmit}
              disabled={isGenerating || !customPrompt.trim()}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
            >
              Generate
            </button>
            <button
              onClick={() => {
                setShowCustomPrompt(false);
                setCustomPrompt("");
              }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
