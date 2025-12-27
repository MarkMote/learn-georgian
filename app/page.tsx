"use client";

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { Github, Star, Upload, MessageCircle, MessageSquare, Languages, Puzzle, Layers } from 'lucide-react';
import FeedbackModal from './components/FeedbackModal';

// --- Constants for Animation ---
// Start with Georgian, end with English
const sourceText = "Learn Georgian";
const targetText = "ისწავლე ქართული";
// Determine the maximum length for iteration
const maxLength = Math.max(sourceText.length, targetText.length);
// Animation interval speed (milliseconds per character)
const animationInterval = 95;
// Initial delay before animation starts (milliseconds)
const initialDelay = 1000;
// --- End Constants ---

export default function HomePage() {
  // --- State for Animation ---
  // Tracks the index of the last character switched to targetText
  const [revealedIndex, setRevealedIndex] = useState<number>(-1);
  // Triggers the animation sequence after the initial delay
  const [startAnimation, setStartAnimation] = useState<boolean>(false);
  // Ref to hold the interval ID for cleanup
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  // --- End State ---

  // --- State for Feedback Modal ---
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);
  // --- End Feedback State ---

  // --- Effects for Animation ---
  // Ensure scrolling is enabled (in case review page disabled it)
  useEffect(() => {
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
    document.body.style.overflow = '';

    return () => {
      // Don't restore anything on unmount
    };
  }, []);

  // Effect 1: Set a timer to start the animation after initialDelay
  useEffect(() => {
    const delayTimer = setTimeout(() => {
      setStartAnimation(true);
    }, initialDelay);

    // Cleanup: Clear the timer if the component unmounts before it fires
    return () => clearTimeout(delayTimer);
  }, []); // Empty dependency array: runs only once on mount

  // Effect 2: Run the character-by-character reveal animation
  useEffect(() => {
    // Only proceed if the animation is triggered and not yet complete
    if (startAnimation && revealedIndex < maxLength) {
      // Start an interval to increment the revealedIndex
      intervalRef.current = setInterval(() => {
        setRevealedIndex((prevIndex) => {
          const nextIndex = prevIndex + 1;
          // Check if the animation is complete
          if (nextIndex >= maxLength) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current); // Stop the interval
              intervalRef.current = null;        // Clear the ref
            }
            return maxLength; // Ensure state reflects completion
          }
          return nextIndex; // Continue to the next character
        });
      }, animationInterval);
    }

    // Cleanup: Clear the interval if the component unmounts or effect dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // Dependencies: This effect runs when startAnimation becomes true
  }, [startAnimation]); // Removed revealedIndex dependency as interval handles increments
  // --- End Effects ---

  // Basic styling consistent with other pages
  const containerClasses = "flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-white p-4";
  const buttonClasses = "px-8 py-4 w-[300px] text-center border border-gray-600 rounded text-lg hover:bg-gray-700 transition-colors duration-150 ease-in-out"; // Shared button style
  // Carved text effect using text-shadow: dark shadow below/right, light highlight above/left
  const carvedTextStyle = "[text-shadow:1px_1px_1px_rgba(0,0,0,0.5),_-1px_-1px_1px_rgba(255,255,255,0.05)]";

  return (
    <div className={containerClasses}>
      {/* Apply carved style and ensure consistent height/alignment */}
      <h1 className={`text-4xl font-light my-8 py-8 text-slate-300 h-12 flex items-center font-light justify-center ${carvedTextStyle}`}>
        {/* Map over the maximum possible length to render spans */}
        {Array.from({ length: maxLength }).map((_, index) => {
          // Determine if the character at this index should be from the target text
          const showTargetChar = index <= revealedIndex;

          // Select the currently active text string based on reveal progress
          const activeText = showTargetChar ? targetText : sourceText;
          // Get the character from the active text. Returns undefined if index is out of bounds.
          const char = activeText[index];

          // Generate a unique key that changes when the character source flips, triggering animation
          const key = `${index}-${showTargetChar ? 'target' : 'source'}`;

          // *** FIX: If character is undefined (index out of bounds for activeText), render nothing ***
          if (char === undefined) {
            return null;
          }

          // Render the character span
          return (
            <span
              key={key}
              // Apply fade-in animation only to the character that just flipped
              className={`inline-block ${showTargetChar && index === revealedIndex ? 'animate-fadeIn' : ''}`}
            >
              {/* Render non-breaking space for actual space characters, otherwise render the character */}
              {char === ' ' ? '\u00A0' : char}
            </span>
          );
        })}
      </h1>
      

      <div className="flex flex-col space-y-6 text-sm max-w-md w-full"> {/* Stack buttons vertically with space */}
        {/* Main Learning Options */}
        <div className="space-y-3">
          <Link
            href="/alphabet"
            className="flex items-center justify-center gap-3 px-4 py-3 w-full  border border-gray-600 rounded text-sm hover:bg-gray-700 transition-colors duration-150 ease-in-out"
          >
            <Languages className="w-4 h-4 text-gray-400" />
            <span>Learn the Alphabet</span>
          </Link>
          <Link
            href="/review"
            className="flex items-center justify-center gap-3 px-4 py-3 w-full border border-gray-600 rounded text-sm hover:bg-gray-700 transition-colors duration-150 ease-in-out"
          >
            <Star className="w-4 h-4 text-gray-400" />
            <span>Learn Core Vocabulary</span>
          </Link>
          <Link
            href="/chunks"
            className="flex items-center justify-center gap-3 px-4 py-3 w-full border border-gray-600 rounded text-sm hover:bg-gray-700 transition-colors duration-150 ease-in-out"
          >
            <MessageCircle className="w-4 h-4 text-gray-400" />
            <span>Learn Colloquial Georgian (advanced)</span>
          </Link>
          <Link
            href="/structure"
            className="flex items-center justify-center gap-3 px-4 py-3 w-full border border-gray-600 rounded text-sm hover:bg-gray-700 transition-colors duration-150 ease-in-out"
          >
            <Layers className="w-4 h-4 text-gray-400" />
            <span>Learn Sentence Structure (advanced)</span>
          </Link>
          <Link
            href="/morphology"
            className="flex items-center justify-center gap-3 px-4 py-3 w-full border border-gray-600 rounded text-sm hover:bg-gray-700 transition-colors duration-150 ease-in-out"
          >
            <Puzzle className="w-4 h-4 text-gray-400" />
            <span>Learn Morphology (advanced)</span>
          </Link>
          <Link
            href="/custom"
            className="flex items-center justify-center gap-3 px-4 py-3 w-full border border-gray-600 rounded text-sm hover:bg-gray-700 transition-colors duration-150 ease-in-out"
          >
            <Upload className="w-4 h-4 text-gray-400" />
            <span>Create Custom Deck</span>
          </Link>
        </div>
      </div>
      {/* Link to view all words */}
      <div className="mt-4">
      </div>

      {/* GitHub and Feedback Buttons */}
      <div className="mt-8 grid grid-cols-2 gap-3 max-w-md w-full">
        <a
          href="https://github.com/MarkMote/learn-georgian"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-3 text-center border border-gray-600 rounded text-sm hover:bg-gray-700 transition-colors duration-150 ease-in-out group"
        >
          <Github className="w-4 h-4 text-gray-400" />
          <span className="text-white">GitHub</span>
          <Star className="w-3 h-3 text-gray-500 group-hover:text-yellow-400 transition-colors" />
        </a>
        
        <button
          onClick={() => setIsFeedbackModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-3 text-center border border-gray-600 rounded text-sm hover:bg-gray-700 transition-colors duration-150 ease-in-out"
        >
          <MessageSquare className="w-4 h-4 text-gray-400" />
          <span className="text-white">Feedback</span>
        </button>
      </div>

      {/* Footer Links */}
      <div className="mt-8 pt-6 pb-3 border-t border-gray-800 flex items-center gap-6 text-base">
        <Link
          href="/getting-started"
          className="text-slate-100 hover:text-gray-200 transition-colors"
        >
          Read this first
        </Link>
        <span className="text-gray-300">•</span>
        <Link
          href="/all"
          className="text-slate-100 hover:text-gray-200 transition-colors"
        >
          View all words
        </Link>
        {/* <span className="text-gray-600">•</span> */}
        {/* <Link
          href="/about"
          className="text-gray-400 hover:text-gray-200 transition-colors"
        >
          About this app
        </Link> */}
      </div>

      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />

    </div>
  );
}
