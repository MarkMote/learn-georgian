"use client"; // Required for onClick handlers if using useRouter, good practice for Link too

import Link from 'next/link'; // Use Next.js Link for navigation
import { useState, useEffect, useRef } from 'react'; // Import React hooks and useRef
import { useRouter } from 'next/navigation';
import { Github, Star, ExternalLink, Upload, MessageCircle, MessageSquare } from 'lucide-react';
import FeedbackModal from './components/FeedbackModal';

// Word data types
type WordData = {
  word_key: string;
  key: string;
  img_key: string;
  EnglishWord: string;
  PartOfSpeech: string;
  GeorgianWord: string;
  hint: string;
  priority: string;
  group: string;
};

// Configurable chunk size (should match review page)
const CHUNK_SIZE = 100;

/**
 * Parse CSV text into an array of WordData objects.
 */
function parseCSV(csvText: string): WordData[] {
  const lines = csvText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  // Skip the header line
  const rows = lines.slice(1);

  return rows.map((row) => {
    const cols = row.split(",");
    return {
      word_key: cols[0],
      key: cols[1],
      img_key: cols[2],
      EnglishWord: cols[3],
      PartOfSpeech: cols[4],
      GeorgianWord: cols[5],
      hint: cols[6],
      priority: cols[7] || "",
      group: cols[8] || "",
    };
  });
}

/**
 * Get unique word keys in CSV order
 */
function getUniqueWordKeys(allWords: WordData[]): string[] {
  const seen = new Set<string>();
  const uniqueKeys: string[] = [];
  
  for (const word of allWords) {
    if (!seen.has(word.word_key)) {
      seen.add(word.word_key);
      uniqueKeys.push(word.word_key);
    }
  }
  
  return uniqueKeys;
}

/**
 * Calculate the number of chunks needed
 */
function getChunkCount(allWords: WordData[]): number {
  const uniqueWordKeys = getUniqueWordKeys(allWords);
  return Math.ceil(uniqueWordKeys.length / CHUNK_SIZE);
}

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
  const router = useRouter();
  
  // --- State for Animation ---
  // Tracks the index of the last character switched to targetText
  const [revealedIndex, setRevealedIndex] = useState<number>(-1);
  // Triggers the animation sequence after the initial delay
  const [startAnimation, setStartAnimation] = useState<boolean>(false);
  // Ref to hold the interval ID for cleanup
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  // --- End State ---

  // --- State for Chunks ---
  const [allWords, setAllWords] = useState<WordData[]>([]);
  const [chunkCount, setChunkCount] = useState<number>(0);
  // --- End Chunk State ---

  // --- State for Feedback Modal ---
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);
  // --- End Feedback State ---

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

  // --- Effect for Loading CSV and Calculating Chunks ---
  useEffect(() => {
    fetch("/words.csv")
      .then((res) => res.text())
      .then((csv) => {
        const parsed = parseCSV(csv);
        setAllWords(parsed);
        setChunkCount(getChunkCount(parsed));
      })
      .catch((error) => {
        console.error("Error loading CSV:", error);
      });
  }, []);
  // --- End CSV Loading Effect ---

  // Handle chunk navigation
  const handleChunkClick = (chunkNumber: number) => {
    router.push(`/review/${chunkNumber}`);
  };

  // Basic styling consistent with other pages
  const containerClasses = "flex flex-col items-center justify-center min-h-screen bg-black text-white p-4";
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
        {/* Chunk Selection for Words with Images */}
        <div className="space-y-3">
          {/* <h2 className="text-sm text-center text-slate-400 mb-4">This is a spaced repetition flashcard app for learning Georgian. Progress is saved in your browser - you don&apos;t need an account and you can close the app anytime and pick up right where you left off.</h2> */}
          
          {chunkCount > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: chunkCount }, (_, index) => {
                const chunkNumber = index + 1;
                const startWord = index * CHUNK_SIZE + 1;
                const endWord = Math.min((index + 1) * CHUNK_SIZE, getUniqueWordKeys(allWords).length);
                
                return (
                  <button
                    key={chunkNumber}
                    onClick={() => handleChunkClick(chunkNumber)}
                    className="px-4 py-3 text-center border border-gray-600 rounded text-sm hover:bg-gray-700 transition-colors duration-150 ease-in-out cursor-pointer"
                  >
                    Words {startWord}-{endWord}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-400">Loading chunks...</div>
          )}
        </div>

        {/* Custom Deck Option */}
        <div className="pt-6 border-t border-gray-700 space-y-3">
          <Link 
            href="/chunks" 
            className="flex items-center justify-center gap-3 px-4 py-3 w-full border border-gray-600 rounded text-sm hover:bg-gray-700 transition-colors duration-150 ease-in-out"
          >
            <MessageCircle className="w-4 h-4 text-gray-400" />
            <span>Colloquial Georgian</span>
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
      <div className="mt-8 pt-6 pb-3 border-t border-gray-800 flex items-center gap-6 text-sm">
        <Link
          href="/all"
          className="text-gray-400 hover:text-gray-200 transition-colors"
        >
          View all words
        </Link>
        <span className="text-gray-600">•</span>
        <Link 
          href="/about" 
          className="text-gray-400 hover:text-gray-200 transition-colors"
        >
          About this app
        </Link>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />

    </div>
  );
}
