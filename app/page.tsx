"use client"; // Required for onClick handlers if using useRouter, good practice for Link too

import Link from 'next/link'; // Use Next.js Link for navigation
import { useState, useEffect, useRef } from 'react'; // Import React hooks and useRef

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

  // --- Effects for Animation ---
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
  const containerClasses = "flex flex-col items-center justify-center min-h-screen bg-black text-white p-4";
  const buttonClasses = "px-8 py-4 w-[300px] text-center border border-gray-600 rounded text-lg hover:bg-gray-700 transition-colors duration-150 ease-in-out"; // Shared button style
  // Carved text effect using text-shadow: dark shadow below/right, light highlight above/left
  const carvedTextStyle = "[text-shadow:1px_1px_1px_rgba(0,0,0,0.5),_-1px_-1px_1px_rgba(255,255,255,0.05)]";

  return (
    <div className={containerClasses}>
      {/* Apply carved style and ensure consistent height/alignment */}
      <h1 className={`text-4xl font-light mb-12 text-slate-300 h-12 flex items-center font-light justify-center ${carvedTextStyle}`}>
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
      {/* <p className="text-sm text-slate-400 mb-12">Mark's Georgian Learning App. </p> */}

      <div className="flex flex-col space-y-6 text-sm"> {/* Stack buttons vertically with space */}
        <Link href="/review" className={buttonClasses}>
          Words with Images
        </Link>

        <Link href="/phrases" className={buttonClasses}>
          Words and Phrases
        </Link>
      </div>

      <div className="flex flex-co border-none space-y-6 text-md">
        <Link href="/what-is-this" className="border-none my-10 px-4 py-1 border bg-gray-900/0 text-gray-300 hover:bg-gray-900/0 rounded-md">
          what is this?
        </Link>
      </div>
    </div>
  );
}
