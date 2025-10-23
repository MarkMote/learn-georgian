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
  onWordUpdated?: (imgKey: string, updates: Partial<WordData>) => void;
}

export default function ImageRow({ word, onImageGenerated, onWordUpdated }: ImageRowProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [customStyle, setCustomStyle] = useState<"natural" | "vivid">("natural");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedWord, setEditedWord] = useState({
    EnglishWord: word.EnglishWord,
    GeorgianWord: word.GeorgianWord,
    ExampleEnglish1: word.ExampleEnglish1 || "",
    ExampleGeorgian1: word.ExampleGeorgian1 || "",
  });

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

  const handleSaveEdits = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/update-word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imgKey: word.img_key,
          updates: editedWord,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update word");
      }

      onWordUpdated?.(word.img_key, editedWord);
      setIsEditing(false);
      alert("Word updated successfully!");
    } catch (error: any) {
      console.error("Error updating word:", error);
      alert(`Failed to update word: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedWord({
      EnglishWord: word.EnglishWord,
      GeorgianWord: word.GeorgianWord,
      ExampleEnglish1: word.ExampleEnglish1 || "",
      ExampleGeorgian1: word.ExampleGeorgian1 || "",
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-gray-900 rounded-lg p-3 md:p-4">
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
        {/* Image thumbnail */}
        <div className="flex-shrink-0 w-full md:w-[300px] h-[200px] md:h-[300px] bg-gray-700 rounded-lg overflow-hidden relative">
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
          {isEditing ? (
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Georgian Word</label>
                <input
                  type="text"
                  value={editedWord.GeorgianWord}
                  onChange={(e) => setEditedWord({ ...editedWord, GeorgianWord: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">English Word</label>
                <input
                  type="text"
                  value={editedWord.EnglishWord}
                  onChange={(e) => setEditedWord({ ...editedWord, EnglishWord: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Georgian Example</label>
                <input
                  type="text"
                  value={editedWord.ExampleGeorgian1}
                  onChange={(e) => setEditedWord({ ...editedWord, ExampleGeorgian1: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">English Example</label>
                <input
                  type="text"
                  value={editedWord.ExampleEnglish1}
                  onChange={(e) => setEditedWord({ ...editedWord, ExampleEnglish1: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col">
                <h3 className="text-base font-medium text-white">
                  {word.GeorgianWord}
                </h3>
                <p className="text-gray-300 text-sm">{word.EnglishWord}</p>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {word.PartOfSpeech} • {word.img_key}
              </div>
              {(word.ExampleGeorgian1 || word.ExampleEnglish1) && (
                <div className="mt-2 text-xs">
                  {word.ExampleGeorgian1 && (
                    <p className="text-gray-400">{word.ExampleGeorgian1}</p>
                  )}
                  {word.ExampleEnglish1 && (
                    <p className="text-gray-500">{word.ExampleEnglish1}</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex-shrink-0 flex flex-wrap gap-2 w-full md:w-auto">
          {isEditing ? (
            <>
              <button
                onClick={handleSaveEdits}
                disabled={isSaving}
                className="flex-1 md:flex-none px-4 py-2 md:py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors touch-manipulation"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="flex-1 md:flex-none px-4 py-2 md:py-1.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors touch-manipulation"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleRefresh}
                disabled={isGenerating}
                className="flex-1 md:flex-none px-4 py-2 md:py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors touch-manipulation"
              >
                {isGenerating ? "Generating..." : "Refresh"}
              </button>
              <button
                onClick={() => setShowCustomPrompt(!showCustomPrompt)}
                disabled={isGenerating}
                className="flex-1 md:flex-none px-4 py-2 md:py-1.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors touch-manipulation"
              >
                Custom
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 md:flex-none px-4 py-2 md:py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors touch-manipulation"
              >
                Edit
              </button>
            </>
          )}
        </div>
      </div>

      {/* Custom prompt input */}
      {showCustomPrompt && (
        <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-700">
          <div className="flex flex-col md:flex-row gap-2 mb-2">
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Enter custom prompt..."
              className="flex-grow px-3 py-2.5 md:py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleCustomPromptSubmit();
                }
              }}
            />
          </div>
          <div className="flex flex-col md:flex-row gap-2 md:items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-400">Style:</label>
              <select
                value={customStyle}
                onChange={(e) => setCustomStyle(e.target.value as "natural" | "vivid")}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="natural">Natural</option>
                <option value="vivid">Vivid</option>
              </select>
            </div>
            <div className="hidden md:block flex-grow"></div>
            <div className="flex gap-2">
              <button
                onClick={handleCustomPromptSubmit}
                disabled={isGenerating || !customPrompt.trim()}
                className="flex-1 md:flex-none px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors touch-manipulation"
              >
                Generate
              </button>
              <button
                onClick={() => {
                  setShowCustomPrompt(false);
                  setCustomPrompt("");
                }}
                className="flex-1 md:flex-none px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors touch-manipulation"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
