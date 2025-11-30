// app/admin/images/components/ImageRow.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { WordData } from "@/lib/spacedRepetition/types";
import { GeneratedImage } from "../types";

interface ImageRowProps {
  word: WordData;
  onImageGenerated: (generatedImage: GeneratedImage) => void;
  onWordUpdated?: (key: string, updates: Partial<WordData>) => void;
  suggestedTips?: Array<{ timestamp: string; tip: string }>;
}

export default function ImageRow({ word, onImageGenerated, onWordUpdated, suggestedTips = [] }: ImageRowProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedWord, setEditedWord] = useState({
    EnglishWord: word.EnglishWord,
    GeorgianWord: word.GeorgianWord,
    ExampleEnglish1: word.ExampleEnglish1 || "",
    ExampleGeorgian1: word.ExampleGeorgian1 || "",
    tips: word.tips || "",
  });

  const handleRefresh = async () => {
    setIsGenerating(true);
    try {
      // First, generate a creative prompt using the LLM
      const promptResponse = await fetch("/api/admin/generate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          englishWord: word.EnglishWord,
          georgianWord: word.GeorgianWord,
          exampleEnglish: word.ExampleEnglish1,
          partOfSpeech: word.PartOfSpeech,
        }),
      });

      if (!promptResponse.ok) {
        const errorData = await promptResponse.json();
        throw new Error(errorData.error || "Failed to generate prompt");
      }

      const promptData = await promptResponse.json();
      const generatedPrompt = promptData.prompt;

      // Now generate the image with the LLM-created prompt
      const response = await fetch("/api/admin/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: generatedPrompt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate image");
      }

      const data = await response.json();
      onImageGenerated({
        imageBase64: data.image,
        prompt: generatedPrompt,
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
        body: JSON.stringify({ prompt: customPrompt }),
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
          key: word.key,
          updates: editedWord,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update word");
      }

      onWordUpdated?.(word.key, editedWord);
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
      tips: word.tips || "",
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-gray-900 rounded-lg p-3 md:p-4">
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
        {/* Image thumbnail */}
        <div className="flex-shrink-0 w-full md:w-[200px] mx-auto h-[200px] w-[200px] h-[200px] md:h-[200px] bg-gray-700 rounded-lg overflow-hidden relative">
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
              <div>
                <label className="text-xs text-gray-400 block mb-1">Tips</label>
                <input
                  type="text"
                  value={editedWord.tips}
                  onChange={(e) => setEditedWord({ ...editedWord, tips: e.target.value })}
                  placeholder="Optional tips or explanation"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col">
                <h3 className="text-base font-medium text-white pb-1">
                  {word.GeorgianWord}
                </h3>
                <p className="text-gray-300 text-base">{word.EnglishWord}</p>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {word.PartOfSpeech} • {word.key}
              </div>
              {(word.ExampleGeorgian1 || word.ExampleEnglish1) && (
                <div className="mt-2 text-base text-gray-200">
                  {word.ExampleGeorgian1 && (
                    <p className="text-gray-200">{word.ExampleGeorgian1}</p>
                  )}
                  {word.ExampleEnglish1 && (
                    <p className="text-gray-200">{word.ExampleEnglish1}</p>
                  )}
                </div>
              )}
              {word.tips && (
                <div className="mt-2 text-sm text-blue-400 italic flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                  <span>{word.tips}</span>
                </div>
              )}
            </>
          )}
          {/* Action buttons */}
          <div className="flex-shrink-0 flex flex-wrap gap-2 w-full mt-4 md:w-auto">
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
      )}

      {/* Suggested tips */}
      {!isEditing && suggestedTips.length > 0 && (
        <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-700">
          <h4 className="text-sm font-medium text-yellow-400 mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>Suggested Tips ({suggestedTips.length})</span>
          </h4>
          <div className="space-y-2">
            {suggestedTips.map((suggestion, index) => (
              <div key={index} className="bg-gray-800 p-3 rounded-lg">
                <p className="text-sm text-gray-200 mb-2">{suggestion.tip}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {new Date(suggestion.timestamp).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => {
                      setEditedWord({ ...editedWord, tips: suggestion.tip });
                      setIsEditing(true);
                    }}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
