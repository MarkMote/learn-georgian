// app/review/[chunkId]/components/TipSuggestionModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { WordData } from "../types";

interface TipSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  word: WordData;
}

export default function TipSuggestionModal({
  isOpen,
  onClose,
  word,
}: TipSuggestionModalProps) {
  const [tipText, setTipText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Prefill with existing tip when modal opens
  useEffect(() => {
    if (isOpen) {
      setTipText(word.tips || "");
      setShowSuccess(false);
    }
  }, [isOpen, word.tips]);

  const handleSubmit = async () => {
    if (!tipText.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/tip-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wordKey: word.key,
          tip: tipText.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit tip");
      }

      setShowSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error submitting tip:", error);
      alert("Failed to submit tip. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Suggest a Tip</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-400 mb-2">
            Word: <span className="text-white">{word.GeorgianWord}</span> ({word.EnglishWord})
          </p>
          {word.tips && (
            <p className="text-xs text-blue-400 italic mb-2">
              Current tip: {word.tips}
            </p>
          )}
        </div>

        {showSuccess ? (
          <div className="text-center py-8">
            <p className="text-green-400 text-lg mb-2">✓ Tip submitted!</p>
            <p className="text-sm text-gray-400">Your tip was submitted for review</p>
          </div>
        ) : (
          <>
            <textarea
              value={tipText}
              onChange={(e) => setTipText(e.target.value)}
              placeholder="Enter a helpful tip or explanation..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 min-h-[100px] resize-y"
              disabled={isSubmitting}
            />

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !tipText.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {isSubmitting ? "Submitting..." : "Submit Tip"}
              </button>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
