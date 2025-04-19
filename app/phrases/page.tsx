"use client";

import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Menu, X, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

/**
 * CSV row structure for phrases.csv.
 * Columns: english, georgian, example_georgian, example_english
 */
type PhraseData = {
  key: string; // Using Georgian phrase as key
  EnglishPhrase: string;
  GeorgianPhrase: string;
  ExampleGeorgian: string;
  ExampleEnglish: string;
};

/**
 * Known card state with SM-2 properties:
 *   rating: 0..3 → 0=fail,1=hard,2=good,3=easy
 *   lastSeen: how many picks ago we last displayed it
 *   interval, repetitions, easeFactor are used to schedule reviews
 */
interface KnownPhraseState {
  data: PhraseData; // Use PhraseData
  rating: number;
  lastSeen: number;
  interval: number;
  repetitions: number;
  easeFactor: number;
}

/**
 * Parse CSV text into an array of PhraseData objects.
 * It assumes that the first row is the header and is skipped.
 */
function parseCSV(csvText: string): PhraseData[] {
  const lines = csvText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  // Skip the header line
  const rows = lines.slice(1);

  return rows.map((row) => {
    // Handle potential commas within quoted fields if necessary in the future
    // For now, assuming simple comma separation without internal quotes/commas
    const cols = row.split(",");
    const georgianPhrase = cols[1]?.trim() || ""; // Use Georgian as key, ensure it's defined
    return {
      key: georgianPhrase, // Use Georgian phrase as the key
      EnglishPhrase: cols[0]?.trim() || "",
      GeorgianPhrase: georgianPhrase,
      ExampleGeorgian: cols[2]?.trim() || "",
      ExampleEnglish: cols[3]?.trim() || "",
    };
  }).filter(phrase => phrase.key); // Filter out rows where the key might be empty
}

/** Convert difficulty label to a numeric score (0..3). */
function difficultyToScore(difficulty: "easy" | "good" | "hard" | "fail"): number {
  switch (difficulty) {
    case "easy":
      return 3;
    case "good":
      return 2;
    case "hard":
      return 1;
    case "fail":
      return 0;
  }
}

// Key for localStorage usage
const LOCAL_STORAGE_KEY = "reviewState_phrases"; // Changed key to avoid conflicts

export default function ReviewPage() {
  const [allPhrases, setAllPhrases] = useState<PhraseData[]>([]); // Renamed state
  const [knownPhrases, setKnownPhrases] = useState<KnownPhraseState[]>([]); // Renamed state

  // Index of the current flashcard
  const [currentIndex, setCurrentIndex] = useState(0);

  // Flip states
  const [isFlipped, setIsFlipped] = useState(false);

  // Count how many total cards have been shown
  const [cardCounter, setCardCounter] = useState(0);

  // Modal state for AI lessons
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lessonMarkdown, setLessonMarkdown] = useState("");
  const [isLessonLoading, setIsLessonLoading] = useState(false);

  // Menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Basic styling
  const containerClasses = "relative w-full bg-black text-white";
  const mainAreaClasses =
    "flex items-center justify-center px-4";

  const router = useRouter(); // Get the router instance

  // ---------------------------
  //  Handle Keyboard shortcuts
  // ---------------------------
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      // If user is typing in an input/textarea, ignore
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case " ":
          e.preventDefault();
          if (!isFlipped) setIsFlipped(true);
          break;
        case "r": // easy
          if (isFlipped) handleScore("easy");
          break;
        case "e": // good
          if (isFlipped) handleScore("good");
          break;
        case "w": // hard
          if (isFlipped) handleScore("hard");
          break;
        case "q": // fail
          if (isFlipped) handleScore("fail");
          break;
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isFlipped, currentIndex]);

  // ---------------------------
  //  Disable viewport scaling for iOS Safari
  // ---------------------------
  useEffect(() => {
    // Only prevent scrolling when modal is closed
    if (!isModalOpen) {
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      document.body.style.overflow = 'hidden';
      
      // Add touchmove prevention for the main page
      const preventDefault = (e: Event) => e.preventDefault();
      document.addEventListener('touchmove', preventDefault, { passive: false });
      
      return () => {
        document.removeEventListener('touchmove', preventDefault);
      };
    }
    
    // When modal is open, restore scrolling
    return () => {
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  // ---------------------------
  //  Load CSV on mount
  // ---------------------------
  useEffect(() => {
    fetch("/phrases.csv") // Fetch phrases.csv
      .then((res) => res.text())
      .then((csv) => setAllPhrases(parseCSV(csv))); // Use setAllPhrases
  }, []);

  // ----------------------------------------------------
  //  Initialize state from localStorage or introduce first phrase
  // ----------------------------------------------------
  useEffect(() => {
    // This effect now handles all initialization logic based on allPhrases
    if (allPhrases.length === 0) return; // Wait for CSV

    let loadedState = false;
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Add more robust check: ensure knownPhrases is array and has items
        if (parsed.knownPhrases && Array.isArray(parsed.knownPhrases) && parsed.knownPhrases.length > 0) {
          console.log("Loading state from localStorage. Phrase count:", parsed.knownPhrases.length);
          setKnownPhrases(parsed.knownPhrases); // Use setKnownPhrases
          // Ensure currentIndex is valid for the loaded phrases, default to 0 otherwise
          setCurrentIndex( (parsed.currentIndex >= 0 && parsed.currentIndex < parsed.knownPhrases.length) ? parsed.currentIndex : 0 );
          // Removed loading of randomizeVerbs/skipVerbs
          loadedState = true;
        } else {
           console.log("localStorage found but invalid content. Clearing.");
           localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear invalid state
        }
      }
    } catch (err) {
      console.error("Error loading local storage:", err);
      localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear potentially corrupted state
    }

    // If no valid state was loaded from localStorage AND knownPhrases is still empty
    // Check knownPhrases.length directly as setKnownPhrases might not update immediately for this check
    if (!loadedState && knownPhrases.length === 0) { // Use ref for immediate check
      console.log("No valid saved state found. Introducing first phrase.");
      introduceRandomKnownPhrase(); // Call updated function
    }
    // Depend on allPhrases to trigger this effect initially.
  }, [allPhrases]); // Only depend on allPhrases

  // ----------------------------------------------------
  //  Whenever knownPhrases/currentIndex changes, store them
  // ----------------------------------------------------
  useEffect(() => {
    // Only save if there's data to prevent overwriting on initial load errors
    if (knownPhrases.length > 0 || currentIndex !== 0) { // Removed randomizeVerbs/skipVerbs check
      const toSave = {
        knownPhrases, // Save knownPhrases
        currentIndex,
        // Removed randomizeVerbs/skipVerbs from save data
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(toSave));
    }
  }, [knownPhrases, currentIndex]); // Removed randomizeVerbs/skipVerbs dependencies

  // -----------------------------------
  //  Close menu when clicking outside
  // -----------------------------------
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Check if the click is outside the menu area (you might need a ref for more precise control)
      // For simplicity, we assume any click outside the top bar closes the menu
      const target = event.target as HTMLElement;
      if (isMenuOpen && !target.closest('.top-bar-menu-area')) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Ref to get immediate access to knownPhrases length for initialization check
  const knownPhrasesRef = React.useRef(knownPhrases); // Renamed ref
  useEffect(() => {
    knownPhrasesRef.current = knownPhrases; // Update ref
  }, [knownPhrases]); // Depend on knownPhrases

  // Declare currentCard *before* the useEffect that uses it
  const currentCard = knownPhrases[currentIndex]; // Use knownPhrases

  // Moved this useEffect hook up before the conditional returns
  // Attempt to recover by setting index to 0 if it becomes invalid
  useEffect(() => {
    // Add the condition *inside* the effect
    if (!currentCard && knownPhrases.length > 0 && currentIndex !== 0) { // Use knownPhrases
        console.warn(`No current card (index ${currentIndex}), but ${knownPhrases.length} knownPhrases exist. Resetting index to 0.`); // Use knownPhrases
        setCurrentIndex(0);
    }
    // currentCard is now defined here
  }, [currentCard, knownPhrases, currentIndex]); // Add knownPhrases dependency

  // ----------------------------------------------------
  //  Introduce a new random phrase.
  // ----------------------------------------------------
  function introduceRandomKnownPhrase() { // Renamed function
    if (allPhrases.length === 0) return; // Use allPhrases

    // Filter out phrases that are already introduced
    const knownKeys = new Set(knownPhrases.map((k) => k.data.key)); // Use knownPhrases
    const candidates = allPhrases.filter((p) => !knownKeys.has(p.key)); // Use allPhrases
    if (candidates.length === 0) return;

    // Pick a random candidate
    const newPhrase = candidates[Math.floor(Math.random() * candidates.length)];

    // Convert to KnownPhraseState
    const newEntry: KnownPhraseState = { // Use KnownPhraseState
      data: newPhrase,
      rating: 0,
      lastSeen: 0,
      interval: 1,
      repetitions: 0,
      easeFactor: 2.5,
    };

    // Add to knownPhrases
    setKnownPhrases((prev) => [...prev, newEntry]); // Use setKnownPhrases
  }

  // ----------------------------
  //  Handle rating (SM-2 logic)
  // ----------------------------
  function handleScore(diff: "easy" | "good" | "hard" | "fail") {
    let nextKnownPhrases: KnownPhraseState[] = []; // To store the updated state for score calculation

    setKnownPhrases((prev) => { // Use setKnownPhrases
      const updated = [...prev];
       // Ensure currentIndex is valid before accessing
      if (currentIndex < 0 || currentIndex >= updated.length) {
          console.error(`Invalid currentIndex ${currentIndex} for knownPhrases length ${updated.length}. Resetting index.`);
          setCurrentIndex(0); // Simple recovery attempt
          return prev; // Return previous state to avoid crash or unexpected updates
      }
      const cardState = updated[currentIndex];
      const score = difficultyToScore(diff);
      console.log(`Handling score for card index ${currentIndex}, phrase: ${cardState.data.key}, score: ${diff}(${score})`); // LOG 1
      cardState.rating = score;

      const normalizedScore = score / 3;
      // Simple SM-2 approach
      if (score === 0) {
        cardState.repetitions = 0;
        cardState.interval = 1;
      } else {
        cardState.repetitions += 1;
        if (cardState.repetitions === 1) {
          cardState.interval = 1;
        } else if (cardState.repetitions === 2) {
          cardState.interval = 6;
        } else {
          cardState.interval = Math.round(
            cardState.interval * cardState.easeFactor
          );
        }
      }
      // Adjust ease factor
      const easeChange = 0.1 - (1 - normalizedScore) * 0.8;
      cardState.easeFactor = Math.max(1.3, cardState.easeFactor + easeChange);

      cardState.lastSeen = 0;
      nextKnownPhrases = updated; // Capture the updated state
      return updated;
    });

    // --- Introduction Trigger Logic ---
    // Use a timeout to allow state update to potentially settle before calculating score
    // Although capturing nextKnownPhrases should be sufficient, this adds robustness
    setTimeout(() => {
        let introductionTriggerScore = 0;
        const currentKnownPhrases = knownPhrasesRef.current; // Use ref for the most current state

        if (currentKnownPhrases.length > 0) {
            // Removed skipVerbs logic, calculate score based on all known phrases
            const relevantPhrases = currentKnownPhrases;

            if (relevantPhrases.length > 0) {
                const sum = relevantPhrases.reduce((acc, kp) => acc + kp.rating / 3, 0);
                introductionTriggerScore = sum / relevantPhrases.length;
                console.log(`Calculated trigger score: ${introductionTriggerScore.toFixed(3)} (sum: ${sum.toFixed(3)}, relevant count: ${relevantPhrases.length})`); // LOG 2 (simplified)
            } else {
                // This case should ideally not happen if currentKnownPhrases.length > 0
                console.log(`No relevant phrases found for trigger score calculation.`); // LOG 3 (simplified)
            }
        } else {
            console.log("KnownPhrases is empty, cannot calculate trigger score."); // LOG 4
        }


        // Possibly introduce more cards if the score of *relevant* cards is high
        // Adjusted threshold slightly as phrases might be learned differently
        if (introductionTriggerScore > 0.75) {
          console.log("Threshold met. Attempting to introduce new phrase."); // LOG 5
          introduceRandomKnownPhrase(); // Call updated function
        } else {
          console.log(`Threshold (0.75) not met. Score: ${introductionTriggerScore.toFixed(3)}. Skipping phrase introduction.`); // LOG 6 (updated threshold)
        }

        pickNextCard();
    }, 0); // Timeout 0 ms pushes execution to after the current call stack
  }

  /** Average rating/3 across ALL known phrases. */
  function computeOverallScore(): number {
    if (knownPhrases.length === 0) return 0; // Use knownPhrases
    const sum = knownPhrases.reduce((acc, kp) => acc + kp.rating / 3, 0); // Use knownPhrases
    return sum / knownPhrases.length; // Use knownPhrases
  }

  /** Priority for SM-2 scheduling: overdue cards get higher priority. */
  function calculateCardPriority(card: KnownPhraseState): number { // Use KnownPhraseState
    const normalizedRating = card.rating / 3;
    const overdueFactor = card.lastSeen / card.interval;
    const difficultyFactor = 1 + (1 - normalizedRating) * 2;

    if (overdueFactor >= 1) {
      return overdueFactor * difficultyFactor;
    }
    // Not overdue => a small fraction so that eventually it's surfaced
    return 0.1 * overdueFactor * difficultyFactor;
  }

  /** Pick the next card by the highest priority. */
  function pickNextCard() {
    setCardCounter((n) => n + 1);

    setKnownPhrases((prev) => {
      // Increment lastSeen for all cards except the one just shown
      const updatedLastSeen = prev.map((kw, i) =>
        i === currentIndex ? kw : { ...kw, lastSeen: kw.lastSeen + 1 }
      );

      // Use const since candidates is not reassigned
      const candidates = updatedLastSeen;

      // Find the highest priority card among the candidates
      let bestIdx = -1; // Use -1 to indicate not found initially
      let bestVal = -Infinity;
      candidates.forEach((kp) => { // Use kp for knownPhrase
        const priority = calculateCardPriority(kp);
        if (priority > bestVal) {
          bestVal = priority;
          // Find the original index in updatedLastSeen
          bestIdx = updatedLastSeen.findIndex(originalKp => originalKp.data.key === kp.data.key);
        }
      });

      // If no suitable candidate was found (e.g., empty list, though unlikely), default to 0
      if (bestIdx === -1 && updatedLastSeen.length > 0) {
          console.warn("No suitable next card found, defaulting to index 0.");
          bestIdx = 0;
      } else if (bestIdx === -1) {
          console.warn("Known phrases list is empty."); // Updated warning
          // Cannot set index if list is empty
          return updatedLastSeen; // Return unchanged list
      }


      setCurrentIndex(bestIdx);
      return updatedLastSeen; // Return the list with updated lastSeen values
    });

    setIsFlipped(false);
    // Removed setShowEnglish(false);
  }

  // --------------
  //  "Get Lesson"
  // --------------
  async function handleGetLesson() {
    if (!knownPhrases[currentIndex]) return; // Use knownPhrases
    let errorToDisplay = "Error fetching lesson from the server."; // Default error

    try {
      setIsModalOpen(true);
      setIsLessonLoading(true);
      setLessonMarkdown(""); // Clear previous lesson/error

      const phrase = knownPhrases[currentIndex].data.GeorgianPhrase; // Get GeorgianPhrase
      // const englishPhrase = knownPhrases[currentIndex].data.EnglishPhrase; // No longer sending English

      // --- CHANGE HERE: Revert API endpoint and parameter ---
      // Use the original /api/lesson endpoint
      // Send the Georgian phrase as the 'word' parameter
      const res = await fetch(`/api/lesson?word=${encodeURIComponent(phrase)}`);
      // --- END CHANGE ---

      if (!res.ok) {
        // Try to get more specific error from response body
        let backendErrorMsg = `API responded with status ${res.status}`; // Basic error if JSON parsing fails
        try {
            const errorData = await res.json();
            // Use the error message provided by the API route if available
            // The /api/lesson route might return { error: "...", details: "..." }
            if (errorData && errorData.error) {
                backendErrorMsg = errorData.error;
                if (errorData.details) {
                  // Log details for debugging but don't necessarily show raw details to user
                  console.error("API Error Details:", errorData.details);
                }
            }
        } catch (parseError) {
            console.warn("Could not parse error response body as JSON:", parseError);
            // Keep the basic status message if parsing fails
        }
        // Throw an error that includes the backend message
        throw new Error(`Failed to get lesson: ${backendErrorMsg}`);
      }

      const data = await res.json();
      setLessonMarkdown(data.lesson || "No lesson content received."); // Update message slightly

    } catch (error) {
      console.error("handleGetLesson Error:", error); // Log the full error object
      // Set the error message for display in the modal
      if (error instanceof Error) {
        errorToDisplay = error.message; // Use the message from the thrown error
      }
      // Display the error in the modal content area instead of just logging
      setLessonMarkdown(`Error: Mark bad at software... sorry`);
    } finally {
      setIsLessonLoading(false);
    }
  }

  // -----------------------------------
  //  Button to clear progress (now inside menu)
  // -----------------------------------
  function handleClearProgress() {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setKnownPhrases([]); // Use setKnownPhrases
    setCurrentIndex(0);
    setIsFlipped(false);
    // Removed setShowEnglish(false);
    setCardCounter(0);
    setIsMenuOpen(false); // Close menu after resetting
    // Removed resetting randomizeVerbs/skipVerbs

    // Introduce the first phrase after clearing
    // Need a slight delay or ensure allPhrases is ready
    setTimeout(() => {
        if (allPhrases.length > 0) { // Use allPhrases
            introduceRandomKnownPhrase(); // Call updated function
        }
    }, 100); // Small delay to ensure state updates settle
  }

  /**
   * Customized ReactMarkdown rendering:
   * - If you want to style code blocks, blockquotes, etc., you can expand further.
   */
  const markdownComponents = {
    h1: (props: any) => (
      <h1
        className="text-3xl font-bold mb-3 mt-6 text-slate-300 font-light border-b pb-4"
        {...props}
      />
    ),
    h2: (props: any) => (
      <h2 className="text-2xl text-slate-300 font-bold mb-2 mt-5" {...props} />
    ),
    h3: (props: any) => (
      <h3
        className="text-xl text-slate-200 tracking-wide font-semibold mb-2 mt-4"
        {...props}
      />
    ),
    p: (props: any) => (
      <p
        className="mb-3 leading-relaxed text-slate-300 text-lg tracking-wide font-light"
        {...props}
      />
    ),
    ul: (props: any) => (
      <ul
        className="list-disc list-inside mb-3 ml-4 text-slate-200 tracking-wide text-lg font-light"
        {...props}
      />
    ),
    ol: (props: any) => (
      <ol
        className="list-decimal list-inside mb-3 ml-4 text-slate-200 font-light"
        {...props}
      />
    ),
    li: (props: any) => (
      <li className="mb-1 text-slate-200" {...props} />
    ),
    strong: (props: any) => (
      <strong className="font-semibold" {...props} />
    ),
  };

  // Modal classes for dark theme
  const modalBgClass =
    "fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50";
  const modalContentClass =
    "bg-black/70 backdrop-blur-lg text-white p-6 rounded-xl w-[95%] max-w-3xl max-h-[90vh] overflow-auto relative border-2 border-gray-700";

  // Update the Home button click handler
  const handleHomeClick = () => {
    router.push('/'); // Navigate to the home page
    // setIsMenuOpen(false); // Optional: close menu if open
  };

  // Loading or no data state
  if (knownPhrases.length === 0 && allPhrases.length > 0) { // Use knownPhrases, allPhrases
      // Waiting for the initialization useEffect to run
      return (
          <div className="p-8 text-center text-white bg-black h-screen flex items-center justify-center">
              <p>Initializing...</p>
          </div>
      );
  } else if (!currentCard && knownPhrases.length > 0) { // Use knownPhrases
      // This might happen briefly if currentIndex is invalid after load/reset
      // The useEffect above will attempt to fix this, show a temporary message
      return (
          <div className="p-8 text-center text-white bg-black h-screen flex items-center justify-center">
              <p>Resetting view...</p>
          </div>
      );
  } else if (knownPhrases.length === 0 && allPhrases.length === 0) { // Use knownPhrases, allPhrases
       // Waiting for CSV to load
      return (
        <div className="p-8 text-center text-white bg-black h-screen flex items-center justify-center">
          <p>Loading vocabulary...</p>
        </div>
      );
  } else if (!currentCard) {
      // Should ideally not be reached if logic above is correct, but acts as a fallback
       console.warn("Reached unexpected state: No current card. Displaying loading.");
       return (
        <div className="p-8 text-center text-white bg-black h-screen flex items-center justify-center">
          <p>Loading...</p>
        </div>
      );
  }

  // Get what to display from the current card
  const { EnglishPhrase, GeorgianPhrase, ExampleGeorgian, ExampleEnglish } = currentCard.data; // Destructure new fields
  // Removed verbHint

  return (
    <div className={containerClasses} style={{ height: '100dvh', overflow: isModalOpen ? 'auto' : 'hidden' }}>
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 relative top-bar-menu-area">
        {/* Left Button Group */}
        <div className="flex items-center space-x-2"> {/* Group buttons with spacing */}
          {/* Menu Button & Dropdown */}
          <div className="relative"> {/* Keep dropdown relative to menu button */}
            <button
              onClick={() => setIsMenuOpen(prev => !prev)}
              className="p-2 border border-gray-600 rounded hover:bg-gray-700"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute left-0 mt-2 w-56 bg-gray-800 border border-gray-600 rounded-md shadow-lg z-10">
                <ul className="divide-y divide-gray-700">
                  {/* Reset Progress */}
                  <li>
                    <button
                      onClick={handleClearProgress}
                      className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
                    >
                      Reset Progress
                    </button>
                  </li>
                  {/* Add other menu items if needed */}
                </ul>
              </div>
            )}
          </div>

          {/* Home Button */}
          <button
            onClick={handleHomeClick} // Uses the updated handler
            className="p-2 border border-gray-600 rounded hover:bg-gray-700" // Similar styling
            aria-label="Go to Home"
          >
            <Home size={20} /> {/* Add Home icon */}
          </button>
        </div>

        {/* Center Score */}
        <div className="text-sm">Score: {knownPhrases.length}</div> {/* Use knownPhrases */}

        {/* Right Button */}
        <button
          onClick={handleGetLesson}
          className="px-3 py-2 border border-gray-600 rounded text-sm hover:bg-gray-700"
        >
          Get Lesson
        </button>
      </div>

      {/* Main Content - Adjusted height and content */}
      <div className={`${mainAreaClasses} h-[calc(100vh-140px)]`}> {/* Kept height for now, can adjust */}
        <div className="flex flex-col items-center justify-center text-center w-full max-w-md px-2"> {/* Increased max-width slightly */}
          {/* Removed Image container */}

          {/* Front of Card (English) */}
          {/* {!isFlipped && ( */}
            <p className="text-3xl tracking-wider mb-4 min-h-[20px] flex items-center justify-center"> {/* Added min-height */}
              {EnglishPhrase}
            </p>
          

          {/* Back of Card (Georgian + Examples + English) */}
          {isFlipped && (
            <div className="flex flex-col items-center">
              {/* Show English phrase again, maybe smaller/greyed out */}
              {/* <p className="text-xl text-slate-400 mb-2">
                {EnglishPhrase}
              </p> */}
              <div className="flex flex-col items-center mt-4 w-[90px] border-t border-slate-700 pb-8 h-[20px]">
              </div>
              {/* Main Georgian Phrase */}
              <p className="text-3xl tracking-wider mb-4">
                {GeorgianPhrase}
              </p>
              {/* Examples */}
              {ExampleGeorgian && (
                <p className="text-xl text-slate-300 mt-4 mb-1 ">
                  &quot;{ExampleGeorgian}&quot;
                </p>
              )}
              {ExampleEnglish && (
                <p className="text-xl text-slate-400 mb-4">
                  ({ExampleEnglish})
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      {!isFlipped ? (
        // Show FLIP button
        <div className="absolute bottom-0 left-0 w-full flex text-white bg-black">
          <button
            onClick={() => setIsFlipped(true)}
            className="flex-1 py-3 text-center border-t-4 border-gray-400 text-xl tracking-wide h-[70px]"
          >
            Flip
          </button>
        </div>
      ) : (
        // Show RATING buttons
        <div className="absolute bottom-0 left-0 w-full h-[70px] text-xl font-semibold tracking-wide flex text-white bg-black">
          <button
            onClick={() => handleScore("fail")}
            className="flex-1 py-3 text-center border-t-4 border-red-500/0 text-red-400 bg-red-800/0"
          />
          <button
            onClick={() => handleScore("fail")}
            className="flex-1 py-3 text-center border-t-4 border-red-500 text-red-400 bg-red-800/10"
          >
            Fail
          </button>
          <button
            onClick={() => handleScore("hard")}
            className="flex-1 py-3 text-center border-t-4 border-yellow-500 text-yellow-400 bg-yellow-700/10"
          >
            Hard
          </button>
          <button
            onClick={() => handleScore("good")}
            className="flex-1 py-3 text-center border-t-4 border-blue-500 text-blue-400 bg-blue-700/10"
          >
            Good
          </button>
          <button
            onClick={() => handleScore("easy")}
            className="flex-1 py-3 text-center border-t-4 border-green-500 text-green-400 bg-green-700/10"
          >
            Easy
          </button>
        </div>
      )}

      {/* Lesson Modal */}
      {isModalOpen && (
        <div className={modalBgClass} onClick={() => setIsModalOpen(false)}>
          <div
            className={modalContentClass}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-0 right-1 p-3 text-4xl text-gray-400 hover:text-gray-100"
            >
              ✕
            </button>

            {/* Loading spinner or the markdown */}
            {isLessonLoading ? (
              <div className="flex items-center justify-center mt-6 mb-6">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
              </div>
            ) : (
              <div className="mt-6">
                <h1 className="text-3xl font-bold mb-3">{GeorgianPhrase}</h1> {/* Show Georgian Phrase in modal title */}
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {lessonMarkdown}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}