import { useState, useEffect } from "react";

import { ExampleMode } from '../types';

interface UIStateOptions {
  chunkId: string;
  mode: string;
}

export function useUIState({ chunkId, mode }: UIStateOptions) {
  // Card display state
  const [isFlipped, setIsFlipped] = useState(false);
  const [showEnglish, setShowEnglish] = useState(false);

  // User preferences
  const [isLeftHanded, setIsLeftHanded] = useState(false);
  const [skipVerbs, setSkipVerbs] = useState(false);
  const [showImageHint, setShowImageHint] = useState(true);
  const [showExamples, setShowExamples] = useState<ExampleMode>("tap-ka");

  // Example reveal state
  const [revealedExamples, setRevealedExamples] = useState<Set<string>>(new Set());

  // Storage key for preferences
  const prefsKey = `ui_prefs_${chunkId}_${mode}`;

  // Load preferences from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(prefsKey);
    if (stored) {
      try {
        const prefs = JSON.parse(stored);
        setIsLeftHanded(prefs.isLeftHanded ?? false);
        setSkipVerbs(prefs.skipVerbs ?? false);
        setShowExamples(prefs.showExamples ?? "tap-ka");
      } catch (err) {
        console.error("Failed to load UI preferences:", err);
      }
    }
  }, [prefsKey]);

  // Save preferences to localStorage
  useEffect(() => {
    const prefs = {
      isLeftHanded,
      skipVerbs,
      showExamples
    };
    localStorage.setItem(prefsKey, JSON.stringify(prefs));
  }, [isLeftHanded, skipVerbs, showExamples, prefsKey]);

  // Auto-hide image hint after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowImageHint(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Reset card display state when moving to next card
  const resetCardDisplay = () => {
    setIsFlipped(false);
    setShowEnglish(false);
    setRevealedExamples(new Set());
  };

  return {
    // Card display
    isFlipped,
    setIsFlipped,
    showEnglish,
    setShowEnglish,

    // User preferences
    isLeftHanded,
    setIsLeftHanded,
    skipVerbs,
    setSkipVerbs,
    showImageHint,
    setShowImageHint,
    showExamples,
    setShowExamples,

    // Example management
    revealedExamples,
    setRevealedExamples,

    // Actions
    resetCardDisplay
  };
}