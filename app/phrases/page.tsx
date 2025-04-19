"use client";

import React, { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Menu, X, Home, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [currentIndex, setCurrentIndex] = useState<number>(0); // Explicitly type as number

  // Flip states
  const [isFlipped, setIsFlipped] = useState<boolean>(false); // Explicitly type as boolean

  // Count how many total cards have been shown
  const [cardCounter, setCardCounter] = useState<number>(0); // Explicitly type as number

  // Modal state for AI lessons
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false); // Explicitly type as boolean
  const [lessonMarkdown, setLessonMarkdown] = useState<string>(""); // Explicitly type as string
  const [isLessonLoading, setIsLessonLoading] = useState<boolean>(false); // Explicitly type as boolean

  // Menu state
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false); // Explicitly type as boolean

  // Loading/Error state for phrases
  const [isLoadingPhrases, setIsLoadingPhrases] = useState<boolean>(true); // New state for loading
  const [loadingError, setLoadingError] = useState<string | null>(null); // New state for errors

  // Basic styling
  const containerClasses = "relative w-full bg-black text-white";
  const mainAreaClasses =
    "flex items-center justify-center px-4";

  const router = useRouter(); // Get the router instance

  const [isLeftHanded, setIsLeftHanded] = useState<boolean>(false);

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
    // Ensure dependencies are correct, including handleScore if it changes
  }, [isFlipped, currentIndex, knownPhrases]); // Added knownPhrases dependency

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
  //  Load Phrases from API on mount
  // ---------------------------
  useEffect(() => {
    setIsLoadingPhrases(true); // Start loading
    setLoadingError(null); // Reset error state

    fetch("/api/phrases") // Fetch from the new API route
      .then((res) => {
        if (!res.ok) {
          // Try to get error details from the response body
          return res.json().then(errData => {
             throw new Error(errData.error || `API request failed with status ${res.status}`);
          }).catch(() => {
             // Fallback if parsing error body fails
             throw new Error(`API request failed with status ${res.status}`);
          });
        }
        return res.json(); // Parse the JSON response
      })
      .then((data) => {
        // The API returns { phrases: PhraseData[] }
        if (!data || !Array.isArray(data.phrases)) {
            console.error("Invalid data structure received from API:", data);
            throw new Error("Received invalid data format from server.");
        }
        console.log(`Received ${data.phrases.length} phrases from API.`);
        setAllPhrases(data.phrases); // Set the state with the phrases array
      })
      .catch(error => {
        console.error("Error fetching phrases from API:", error);
        setLoadingError(error.message || "An unknown error occurred while fetching phrases.");
        setAllPhrases([]); // Clear phrases on error
      })
      .finally(() => {
        setIsLoadingPhrases(false); // Stop loading regardless of success/failure
      });
  }, []); // Empty dependency array means this runs once on mount

  // ----------------------------------------------------
  //  Initialize state from localStorage or introduce first phrase
  // ----------------------------------------------------
  useEffect(() => {
    // This effect now handles all initialization logic based on allPhrases
    // It should only run AFTER phrases are loaded and if there's no loading error
    if (isLoadingPhrases || loadingError || allPhrases.length === 0) {
        console.log("Initialization skipped: Still loading, error occurred, or no phrases available.");
        return; // Wait for phrases to load successfully
    }

    let loadedState = false;
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Add more robust check: ensure knownPhrases is array and has items
        // Also, verify that the stored phrases still exist in the newly fetched `allPhrases`
        if (parsed.knownPhrases && Array.isArray(parsed.knownPhrases) && parsed.knownPhrases.length > 0) {
            const validStoredPhrases = parsed.knownPhrases.filter((kp: KnownPhraseState) =>
                allPhrases.some(ap => ap.key === kp.data.key)
            );

            if (validStoredPhrases.length > 0) {
                console.log(`Loading ${validStoredPhrases.length} valid phrases from localStorage.`);
                setKnownPhrases(validStoredPhrases);
                // Ensure currentIndex is valid for the loaded phrases, default to 0 otherwise
                const newIndex = (parsed.currentIndex >= 0 && parsed.currentIndex < validStoredPhrases.length) ? parsed.currentIndex : 0;
                setCurrentIndex(newIndex);
                loadedState = true;
            } else {
                console.log("localStorage found but contained no phrases matching the current vocabulary. Clearing.");
                localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear invalid state
            }
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
    if (!loadedState && knownPhrasesRef.current.length === 0) { // Use ref for immediate check
      console.log("No valid saved state found or initial load. Introducing first phrase.");
      introduceRandomKnownPhrase(); // Call updated function
    }
    // Depend on allPhrases, isLoadingPhrases, and loadingError to trigger this effect correctly.
  }, [allPhrases, isLoadingPhrases, loadingError]); // Added isLoadingPhrases, loadingError dependencies

  // ----------------------------------------------------
  //  Whenever knownPhrases/currentIndex changes, store them
  // ----------------------------------------------------
  useEffect(() => {
    // Only save if there's data and phrases have loaded without error
    if (!isLoadingPhrases && !loadingError && (knownPhrases.length > 0 || currentIndex !== 0)) {
      const toSave = {
        knownPhrases,
        currentIndex,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(toSave));
    }
    // Depend on loading state as well to prevent saving during initial load/error
  }, [knownPhrases, currentIndex, isLoadingPhrases, loadingError]);

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
  const knownPhrasesRef = useRef(knownPhrases); // Use useRef
  useEffect(() => {
    knownPhrasesRef.current = knownPhrases; // Update ref
  }, [knownPhrases]); // Depend on knownPhrases

  // Declare currentCard *before* the useEffect that uses it
  // Add checks for valid index and non-empty array
  const currentCard = (knownPhrases.length > 0 && currentIndex >= 0 && currentIndex < knownPhrases.length)
    ? knownPhrases[currentIndex]
    : null; // Use null if index is invalid or array is empty

  // Moved this useEffect hook up before the conditional returns
  // Attempt to recover by setting index to 0 if it becomes invalid
  useEffect(() => {
    // Add the condition *inside* the effect
    // Only reset if phrases are loaded, not loading, no error, and index is bad
    if (!isLoadingPhrases && !loadingError && !currentCard && knownPhrases.length > 0 && currentIndex !== 0) {
        console.warn(`No current card (index ${currentIndex}), but ${knownPhrases.length} knownPhrases exist. Resetting index to 0.`);
        setCurrentIndex(0);
    }
    // currentCard is now defined here
  }, [currentCard, knownPhrases, currentIndex, isLoadingPhrases, loadingError]); // Add loading dependencies

  // ----------------------------------------------------
  //  Introduce a new random phrase.
  // ----------------------------------------------------
  function introduceRandomKnownPhrase() {
    // Ensure phrases are loaded and available
    if (isLoadingPhrases || loadingError || allPhrases.length === 0) {
        console.log("Cannot introduce phrase: Still loading, error occurred, or no phrases available.");
        return;
    }

    // Filter out phrases that are already introduced
    const knownKeys = new Set(knownPhrasesRef.current.map((k) => k.data.key)); // Use ref for immediate check
    const candidates = allPhrases.filter((p) => !knownKeys.has(p.key));
    if (candidates.length === 0) {
        console.log("No new phrases left to introduce.");
        // Optionally display a message to the user here
        return;
    }

    // Pick a random candidate
    const newPhrase = candidates[Math.floor(Math.random() * candidates.length)];

    // Convert to KnownPhraseState
    const newEntry: KnownPhraseState = {
      data: newPhrase,
      rating: 0,
      lastSeen: 0,
      interval: 1,
      repetitions: 0,
      easeFactor: 2.5,
    };

    // Add to knownPhrases
    setKnownPhrases((prev) => [...prev, newEntry]);
    // Set the current index to the newly added phrase
    setCurrentIndex(knownPhrasesRef.current.length); // Set index to the end (where the new one was added)
    setIsFlipped(false); // Ensure the new card starts unflipped
    console.log(`Introduced new phrase: ${newPhrase.key}`);
  }

  // ----------------------------
  //  Handle rating (SM-2 logic)
  // ----------------------------
  function handleScore(diff: "easy" | "good" | "hard" | "fail") {
    // Ensure there is a current card to score
    if (!currentCard) {
        console.error("handleScore called but there is no current card.");
        return;
    }

    let nextKnownPhrases: KnownPhraseState[] = []; // To store the updated state for score calculation

    setKnownPhrases((prev) => {
      const updated = [...prev];
       // Double-check currentIndex validity (should be guaranteed by currentCard check, but safe)
      if (currentIndex < 0 || currentIndex >= updated.length) {
          console.error(`Invalid currentIndex ${currentIndex} in handleScore. This should not happen.`);
          // Attempt recovery or simply return previous state
          setCurrentIndex(0);
          return prev;
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
    setTimeout(() => {
        let introductionTriggerScore = 0;
        const currentKnownPhrases = knownPhrasesRef.current; // Use ref for the most current state

        if (currentKnownPhrases.length > 0) {
            const relevantPhrases = currentKnownPhrases; // Now considers all known phrases

            if (relevantPhrases.length > 0) {
                const sum = relevantPhrases.reduce((acc, kp) => acc + kp.rating / 3, 0);
                introductionTriggerScore = sum / relevantPhrases.length;
                console.log(`Calculated trigger score: ${introductionTriggerScore.toFixed(3)} (sum: ${sum.toFixed(3)}, count: ${relevantPhrases.length})`); // LOG 2
            } else {
                console.log(`No relevant phrases found for trigger score calculation.`); // LOG 3
            }
        } else {
            console.log("KnownPhrases is empty, cannot calculate trigger score."); // LOG 4
        }

        // Possibly introduce more cards if the score is high
        // Check if there are still phrases left to introduce from allPhrases
        const knownKeys = new Set(currentKnownPhrases.map(kp => kp.data.key));
        const remainingPhrasesCount = allPhrases.filter(p => !knownKeys.has(p.key)).length;

        if (introductionTriggerScore > 0.75 && remainingPhrasesCount > 0) {
          console.log(`Threshold met (${introductionTriggerScore.toFixed(3)} > 0.75) and ${remainingPhrasesCount} phrases remaining. Attempting to introduce.`); // LOG 5
          introduceRandomKnownPhrase(); // Call updated function
        } else {
          if (remainingPhrasesCount === 0) {
              console.log(`Threshold met but no new phrases left to introduce.`);
          } else {
              console.log(`Threshold (0.75) not met. Score: ${introductionTriggerScore.toFixed(3)}. Skipping phrase introduction.`); // LOG 6
          }
          // Only pick next card if not introducing (introduce handles picking next)
          pickNextCard();
        }
    }, 0); // Timeout 0 ms
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
    // Don't pick if still loading or error occurred
    if (isLoadingPhrases || loadingError) return;

    setCardCounter((n) => n + 1);

    setKnownPhrases((prev) => {
      // Ensure prev is not empty before proceeding
      if (prev.length === 0) {
          console.warn("pickNextCard called with empty knownPhrases.");
          return prev; // Return unchanged empty array
      }

      // Increment lastSeen for all cards except the one just shown (if currentIndex is valid)
      const updatedLastSeen = prev.map((kw, i) =>
        (currentIndex >= 0 && i === currentIndex) ? kw : { ...kw, lastSeen: kw.lastSeen + 1 }
      );

      const candidates = updatedLastSeen;

      // Find the highest priority card among the candidates
      let bestIdx = -1;
      let bestVal = -Infinity;
      // Use map to calculate priorities and find the best index
      const priorities = candidates.map(kp => calculateCardPriority(kp));
      priorities.forEach((priority, index) => {
          if (priority > bestVal) {
              bestVal = priority;
              bestIdx = index; // Index directly corresponds to candidates/updatedLastSeen
          }
      });


      // If no suitable candidate was found (e.g., all priorities are -Infinity or list empty), default to 0
      if (bestIdx === -1 && updatedLastSeen.length > 0) {
          console.warn("No suitable next card found based on priority, defaulting to index 0.");
          bestIdx = 0;
      } else if (bestIdx === -1) {
          // This case should only happen if updatedLastSeen is empty, handled above.
          console.warn("Known phrases list is empty in pickNextCard.");
          return updatedLastSeen; // Return unchanged list
      }

      // Only update state if the index actually changes or if it's the only card
      if (bestIdx !== currentIndex || updatedLastSeen.length === 1) {
          setCurrentIndex(bestIdx);
      } else {
          // If the same card is picked again, force a re-render by returning a new array instance
          // This might happen if only one card is known or priorities lead back to the same card.
          // However, usually, lastSeen increment prevents immediate repeats unless interval=1.
          console.log(`Picking the same card index: ${bestIdx}`);
          // No state update needed for knownPhrases if only index changes
          // setCurrentIndex(bestIdx); // Already called above if needed
      }

      return updatedLastSeen; // Return the list with updated lastSeen values
    });

    setIsFlipped(false);
  }

  // --------------
  //  "Get Lesson"
  // --------------
  async function handleGetLesson() {
    // Use currentCard which already checks for validity
    if (!currentCard) {
        console.warn("Get Lesson clicked but no current card.");
        return;
    }
    let errorToDisplay = "Error fetching lesson from the server."; // Default error

    try {
      setIsModalOpen(true);
      setIsLessonLoading(true);
      setLessonMarkdown(""); // Clear previous lesson/error

      const phrase = currentCard.data.GeorgianPhrase; // Get GeorgianPhrase from currentCard

      // Use the original /api/lesson endpoint
      const res = await fetch(`/api/lesson?word=${encodeURIComponent(phrase)}`);

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
    setKnownPhrases([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setCardCounter(0);
    setIsMenuOpen(false);

    // Introduce the first phrase after clearing
    // Need a slight delay or ensure allPhrases is ready
    setTimeout(() => {
        // Check loading/error state before introducing
        if (!isLoadingPhrases && !loadingError && allPhrases.length > 0) {
            introduceRandomKnownPhrase();
        } else {
            console.log("Clear progress: Cannot introduce first phrase yet (loading/error/no phrases).");
        }
    }, 100); // Small delay
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
  };

  // Loading or no data state
  if (isLoadingPhrases) {
      return (
          <div className="p-8 text-center text-white bg-black h-screen flex items-center justify-center">
              <p>Loading vocabulary from Google Sheets...</p>
              {/* Optional: Add a spinner here */}
          </div>
      );
  }

  if (loadingError) {
      return (
          <div className="p-8 text-center text-white bg-black h-screen flex flex-col items-center justify-center">
              <p className="text-red-500 font-semibold">Error loading vocabulary:</p>
              <p className="text-red-400 mt-2">{loadingError}</p>
              <p className="mt-4 text-sm text-gray-400">Please check the console for details and ensure the Google Sheet is accessible and correctly formatted.</p>
              {/* Optionally add a retry button */}
          </div>
      );
  }

  if (allPhrases.length === 0) {
       // This means loading finished, no error, but sheet was empty or filtered out all rows
      return (
        <div className="p-8 text-center text-white bg-black h-screen flex items-center justify-center">
          <p>No phrases found in the Google Sheet.</p>
          <p className="mt-2 text-sm text-gray-400">Ensure the sheet 'Sheet1' exists, has data in columns A-D starting from row 2, and the Georgian phrase (column B) is not empty.</p>
        </div>
      );
  }

  // If initialization hasn't set knownPhrases yet (e.g., localStorage load pending or first intro pending)
  // or if currentCard is somehow null despite checks (fallback)
  if (knownPhrases.length === 0 || !currentCard) {
      // This state should be brief as the initialization useEffect runs after loading
       console.log("Waiting for initialization or current card...");
       return (
        <div className="p-8 text-center text-white bg-black h-screen flex items-center justify-center">
          <p>Initializing review...</p>
        </div>
      );
  }


  // Get what to display from the current card (already checked for null)
  const { EnglishPhrase, GeorgianPhrase, ExampleGeorgian, ExampleEnglish } = currentCard.data;

  return (
    <div className={containerClasses} style={{ height: '100dvh', overflow: isModalOpen ? 'auto' : 'hidden' }}>
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 relative top-bar-menu-area">
        {/* Left Button Group */}
        <div className="flex items-center space-x-2">
          {/* Menu Button & Dropdown */}
          <div className="relative">
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
            onClick={handleHomeClick}
            className="p-2 border border-gray-600 rounded hover:bg-gray-700"
            aria-label="Go to Home"
          >
            <Home size={20} />
          </button>
        </div>

        {/* Center Score: Show number of known phrases / total phrases */}
        <div className="text-sm">
            {knownPhrases.length} / {allPhrases.length} Phrases
        </div>

        {/* Right Button */}
        <button
          onClick={handleGetLesson}
          disabled={!currentCard} // Disable if no current card
          className="px-3 py-2 border border-gray-600 rounded text-sm hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Get Lesson
        </button>
      </div>

      {/* Main Content - Adjusted height and content */}
      <div className={`${mainAreaClasses} h-[calc(100vh-140px)]`}>
        <div className="flex flex-col items-center justify-center text-center w-full max-w-md px-2">

          {/* Front of Card (English) */}
          {/* Always show English for context, maybe smaller when flipped */}
           <p className={`text-slate-100 mb-4 min-h-[20px] flex items-center justify-center transition-opacity duration-300 ${isFlipped ? 'text-xl opacity-60' : 'text-3xl tracking-wider'}`}>
              {EnglishPhrase}
            </p>


          {/* Back of Card (Georgian + Examples) */}
          {/* Use opacity and height transition for smoother flip */}
          <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isFlipped ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
            {isFlipped && ( // Render content only when flipped for performance
              <div className="flex flex-col items-center">
                <div className="flex flex-col items-center mt-2 w-[90px] border-t border-slate-700 pb-6 h-[1px]">
                  {/* Divider line */}
                </div>
                {/* Main Georgian Phrase */}
                <p className="text-3xl tracking-wider mb-4 text-slate-50">
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
      </div>

      {/* Bottom Bar */}
      {!isFlipped ? (
        // Show FLIP button
        <div className="absolute bottom-0 left-0 w-full flex text-white bg-black">
          <button
            onClick={() => setIsFlipped(true)}
            className="flex-1 py-3 text-center border-t-4 border-gray-400 text-xl tracking-wide h-[70px]  transition-colors"
          >
            Flip <span className="hidden md:inline">(Space)</span>
          </button>
        </div>
      ) : (
        // Show RATING buttons with Left/Right Handed Mode Toggle
        <div className="absolute bottom-0 left-0 w-full h-[70px] text-xl font-semibold tracking-wide flex text-white bg-black items-stretch"> {/* Use items-stretch */}

          {!isLeftHanded ? (
            // Right-Handed Layout (Default)
            <>
              {/* Switch to Left Button (Mobile Only) */}
              <button
                onClick={() => setIsLeftHanded(true)}
                className="flex-shrink-0 basis-1/6 px-2 py-3 font-light text-center text-xs opacity-70 md:hidden flex items-center justify-center transition-colors border-t-4 border-gray-700" // Added border for consistency
                aria-label="Switch to left-handed mode"
                title="Switch Layout"
              >
                <ChevronLeft size={24} />
              </button>

              {/* Rating Buttons (Grow to fill remaining space) */}
              {/* Use flex-grow on the container and flex-1 on buttons */}
              <div className="flex flex-grow">
                <button
                  onClick={() => handleScore("fail")}
                  className="flex-1 py-3 text-center border-t-4 border-red-500 text-red-400 bg-red-900/20  transition-colors"
                  title="Fail (Q)"
                >
                  Fail <span className="hidden md:inline">(Q)</span>
                </button>
                <button
                  onClick={() => handleScore("hard")}
                  className="flex-1 py-3 text-center border-t-4 border-yellow-500 text-yellow-400 bg-yellow-900/20  transition-colors"
                  title="Hard (W)"
                >
                  Hard <span className="hidden md:inline">(W)</span>
                </button>
                <button
                  onClick={() => handleScore("good")}
                  className="flex-1 py-3 text-center border-t-4 border-blue-500 text-blue-400 bg-blue-900/20  transition-colors"
                  title="Good (E)"
                >
                  Good <span className="hidden md:inline">(E)</span>
                </button>
                <button
                  onClick={() => handleScore("easy")}
                  className="flex-1 py-3 text-center border-t-4 border-green-500 text-green-400 bg-green-900/20  transition-colors"
                  title="Easy (R)"
                >
                  Easy <span className="hidden md:inline">(R)</span>
                </button>
              </div>
            </>
          ) : (
            // Left-Handed Layout
            <>
              {/* Rating Buttons (Grow to fill remaining space) */}
              <div className="flex flex-grow">
                 <button
                  onClick={() => handleScore("fail")}
                  className="flex-1 py-3 text-center border-t-4 border-red-500 text-red-400 bg-red-900/20  transition-colors"
                  title="Fail (Q)"
                >
                  Fail <span className="hidden md:inline">(Q)</span>
                </button>
                <button
                  onClick={() => handleScore("hard")}
                  className="flex-1 py-3 text-center border-t-4 border-yellow-500 text-yellow-400 bg-yellow-900/20  transition-colors"
                  title="Hard (W)"
                >
                  Hard <span className="hidden md:inline">(W)</span>
                </button>
                <button
                  onClick={() => handleScore("good")}
                  className="flex-1 py-3 text-center border-t-4 border-blue-500 text-blue-400 bg-blue-900/20  transition-colors"
                  title="Good (E)"
                >
                  Good <span className="hidden md:inline">(E)</span>
                </button>
                <button
                  onClick={() => handleScore("easy")}
                  className="flex-1 py-3 text-center border-t-4 border-green-500 text-green-400 bg-green-900/20  transition-colors"
                  title="Easy (R)"
                >
                  Easy <span className="hidden md:inline">(R)</span>
                </button>
              </div>

              {/* Switch to Right Button (Mobile Only) */}
              <button
                onClick={() => setIsLeftHanded(false)}
                className="flex-shrink-0 basis-1/6 px-2 py-3 font-light text-center text-xs opacity-70 md:hidden flex items-center justify-center hover:bg-gray-700 transition-colors border-t-4 border-gray-700" // Added border for consistency
                aria-label="Switch to right-handed mode"
                title="Switch Layout"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
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
              className="absolute top-0 right-1 p-3 text-4xl text-gray-400 hover:text-gray-100 z-10" // Ensure button is clickable
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
                 {/* Show Georgian Phrase in modal title only if currentCard exists */}
                {currentCard && <h1 className="text-3xl font-bold mb-3">{currentCard.data.GeorgianPhrase}</h1>}
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