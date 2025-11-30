// app/admin/images/components/PreviewModal.tsx
"use client";

import React, { useState } from "react";
import { GeneratedImage } from "../types";

interface PreviewModalProps {
  generatedImage: GeneratedImage;
  onClose: () => void;
}

export default function PreviewModal({
  generatedImage,
  onClose,
}: PreviewModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/save-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: generatedImage.imageBase64,
          imgKey: generatedImage.imgKey,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save image");
      }

      alert(`Image saved successfully for ${generatedImage.imgKey}!`);
      onClose();

      // Refresh the page to show the new image
      window.location.reload();
    } catch (error) {
      console.error("Error saving image:", error);
      alert("Failed to save image. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTryAgain = async () => {
    setIsRegenerating(true);
    try {
      const response = await fetch("/api/admin/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: generatedImage.prompt }),
      });

      if (!response.ok) {
        throw new Error("Failed to regenerate image");
      }

      const data = await response.json();

      // Update the preview with the new image (keeping the same prompt and imgKey)
      generatedImage.imageBase64 = data.image;

      // Force re-render by creating a new object
      window.location.reload();
    } catch (error) {
      console.error("Error regenerating image:", error);
      alert("Failed to regenerate image. Please try again.");
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4">
      <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-3 md:p-4">
          <h2 className="text-lg md:text-xl font-semibold text-white">Preview Generated Image</h2>
          <p className="text-xs md:text-sm text-gray-400 mt-1">
            {generatedImage.imgKey}
          </p>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6">
          {/* Image preview */}
          <div className="bg-gray-800 rounded-lg p-2 md:p-4 mb-3 md:mb-4">
            <img
              src={`data:image/png;base64,${generatedImage.imageBase64}`}
              alt="Generated preview"
              className="w-full h-auto rounded"
            />
          </div>

          {/* Prompt display */}
          <div className="mb-4 md:mb-6">
            <h3 className="text-xs md:text-sm font-medium text-gray-400 mb-2">Prompt:</h3>
            <p className="text-white bg-gray-800 rounded p-2.5 md:p-3 text-xs md:text-sm">
              {generatedImage.prompt}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col md:flex-row gap-2 md:gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving || isRegenerating}
              className="flex-1 px-4 md:px-6 py-2.5 md:py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors touch-manipulation"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleTryAgain}
              disabled={isSaving || isRegenerating}
              className="flex-1 px-4 md:px-6 py-2.5 md:py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors touch-manipulation"
            >
              {isRegenerating ? "Regenerating..." : "Try Again"}
            </button>
            <button
              onClick={onClose}
              disabled={isSaving || isRegenerating}
              className="flex-1 px-4 md:px-6 py-2.5 md:py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors touch-manipulation"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
