"use client";

import React, { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";
import { Menu, X, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import BottomBar from '../components/BottomBar';

/**
 * CSV row structure.
 * Columns: key, img_key, EnglishWord, PartOfSpeech, GeorgianWord, hint
 */
type WordData = {
  key: string;
  img_key: string;
  EnglishWord: string;
  PartOfSpeech: string;
  GeorgianWord: string;
  hint: string;
};

/**
 * Known card state with SM-2 properties:
 *   rating: 0..3 → 0=fail,1=hard,2=good,3=easy
 *   lastSeen: how many picks ago we last displayed it
 *   interval, repetitions, easeFactor are used to schedule reviews
 */
interface KnownWordState {
  data: WordData;
  rating: number;
  lastSeen: number;
  interval: number;
  repetitions: number;
  easeFactor: number;
}

/**
 * Parse CSV text into an array of WordData objects.
 * It assumes that the first row is the header and is skipped.
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
      key: cols[0],
      img_key: cols[1],
      EnglishWord: cols[2],
      PartOfSpeech: cols[3],
      GeorgianWord: cols[4],
      hint: cols[5],
    };
  });
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

/**
 * Returns a brief verb hint if PartOfSpeech includes "verb".
 * Example: If GeorgianWord is "მე ვმუშაობ", we might show "მე ვმუშაობ ____" on the front.
 */
function getVerbHint(word: WordData): string | null {
  if (!word.PartOfSpeech.toLowerCase().includes("verb")) {
    return null;
  }
  // return ___ for infinitive forms
  if (word.key.endsWith("_inf")) {
    return "____";
  }


  const firstWord = word.GeorgianWord.split(" ")[0];
  return `${firstWord} ____`;
}

/**
 * Extract the "base" of a verb key so that we can group its various conjugations.
 * E.g. "work_p1s" => "work", "play_p3p" => "play".
 * If there's no "_p" suffix, just return the whole key (some verbs might be stored that way).
 */
function getVerbBaseKey(word: WordData): string | null {
  if (!word.PartOfSpeech.toLowerCase().includes("verb")) {
    return null;
  }

  // Fix #1: Also handle "_inf"
  if (word.key.endsWith("_inf")) {
    return word.key.slice(0, -4);
  }

  const underscoreIdx = word.key.indexOf("_p");
  if (underscoreIdx > -1) {
    return word.key.slice(0, underscoreIdx);
  }
  // If no suffix => treat the entire key as the "base"
  return word.key;
}

// Key for localStorage usage
const LOCAL_STORAGE_KEY = "reviewState";

export default function ReviewPage() {
  const [allWords, setAllWords] = useState<WordData[]>([]);
  const [knownWords, setKnownWords] = useState<KnownWordState[]>([]);

  // Index of the current flashcard
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Flip states
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [showEnglish, setShowEnglish] = useState<boolean>(false);

  // Count how many total cards have been shown
  const [cardCounter, setCardCounter] = useState<number>(0);

  // Modal state for AI lessons
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [lessonMarkdown, setLessonMarkdown] = useState<string>("");
  const [isLessonLoading, setIsLessonLoading] = useState<boolean>(false);

  // Menu state
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // Configuration state
  const [randomizeVerbs, setRandomizeVerbs] = useState<boolean>(false);
  const [skipVerbs, setSkipVerbs] = useState<boolean>(false);

  // Add state for left-handed mode
  const [isLeftHanded, setIsLeftHanded] = useState<boolean>(false);

  // Basic styling
  const containerClasses = "relative w-full bg-black text-white";
  const mainAreaClasses =
    "flex items-center justify-center px-4";

  const router = useRouter();

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
        case "i":
          // Toggle English
          setShowEnglish((prev) => !prev);
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
    fetch("/words.csv")
      .then((res) => res.text())
      .then((csv) => setAllWords(parseCSV(csv)));
  }, []);

  // ----------------------------------------------------
  //  Initialize state from localStorage or introduce first word
  // ----------------------------------------------------
  useEffect(() => {
    // This effect now handles all initialization logic based on allWords
    if (allWords.length === 0) return; // Wait for CSV

    let loadedState = false;
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Add more robust check: ensure knownWords is array and has items
        if (parsed.knownWords && Array.isArray(parsed.knownWords) && parsed.knownWords.length > 0) {
          console.log("Loading state from localStorage. Word count:", parsed.knownWords.length);
          setKnownWords(parsed.knownWords);
          // Ensure currentIndex is valid for the loaded words, default to 0 otherwise
          setCurrentIndex( (parsed.currentIndex >= 0 && parsed.currentIndex < parsed.knownWords.length) ? parsed.currentIndex : 0 );
          setRandomizeVerbs(parsed.randomizeVerbs ?? false);
          setSkipVerbs(parsed.skipVerbs ?? false);
          setIsLeftHanded(parsed.isLeftHanded ?? false);
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

    // If no valid state was loaded from localStorage AND knownWords is still empty
    // Check knownWords.length directly as setKnownWords might not update immediately for this check
    if (!loadedState && knownWords.length === 0) { // Use ref for immediate check
      console.log("No valid saved state found. Introducing first word.");
      introduceRandomKnownWord();
    }
    // Depend on allWords to trigger this effect initially.
  }, [allWords]); // Only depend on allWords

  // ----------------------------------------------------
  //  Whenever knownWords/currentIndex changes, store them
  // ----------------------------------------------------
  useEffect(() => {
    // Only save if there's data to prevent overwriting on initial load errors
    if (knownWords.length > 0 || currentIndex !== 0 || randomizeVerbs || skipVerbs || isLeftHanded) {
      const toSave = {
        knownWords,
        currentIndex,
        randomizeVerbs,
        skipVerbs,
        isLeftHanded,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(toSave));
    }
  }, [knownWords, currentIndex, randomizeVerbs, skipVerbs, isLeftHanded]);

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

  // Ref to get immediate access to knownWords length for initialization check
  const knownWordsRef = React.useRef(knownWords);
  useEffect(() => {
    knownWordsRef.current = knownWords;
  }, [knownWords]);

  // Declare currentCard *before* the useEffect that uses it
  const currentCard = knownWords[currentIndex];

  // Moved this useEffect hook up before the conditional returns
  // Attempt to recover by setting index to 0 if it becomes invalid
  useEffect(() => {
    // Add the condition *inside* the effect
    if (!currentCard && knownWords.length > 0 && currentIndex !== 0) {
        console.warn(`No current card (index ${currentIndex}), but ${knownWords.length} knownWords exist. Resetting index to 0.`);
        setCurrentIndex(0);
    }
    // currentCard is now defined here
  }, [currentCard, knownWords, currentIndex]); // Add currentIndex dependency

  // ----------------------------------------------------
  //  Introduce a new random word. If it is a verb,
  //  also introduce all other conjugations with the same base.
  // ----------------------------------------------------
  function introduceRandomKnownWord() {
    if (allWords.length === 0) return;

    // Filter out words that are already introduced
    const knownKeys = new Set(knownWords.map((k) => k.data.key));
    const candidates = allWords.filter((w) => !knownKeys.has(w.key));
    if (candidates.length === 0) return;

    // Separate verb and non-verb candidates
    const verbCandidates = candidates.filter(w =>
      w.PartOfSpeech.toLowerCase().includes("verb")
    );
    const nonVerbCandidates = candidates.filter(w =>
      !w.PartOfSpeech.toLowerCase().includes("verb")
    );

    // Handle empty categories
    if (verbCandidates.length === 0 && nonVerbCandidates.length === 0) return;

    // Decide whether to introduce a verb (1/6 chance) or non-verb (5/6 chance)
    let newWord: WordData;
    const useVerb = Math.random() < .1 && verbCandidates.length > 0;

    if (useVerb) {
      let chosenVerb: WordData | undefined;
      // Only use priority list if randomizeVerbs is false
      if (!randomizeVerbs) {
        const priorityVerbs = [
          "be_p1s", "have_inanimate_p1s", "want_p1s", "know_p1s",
          "have_animate_p1s", "speak_p1s", "work_p1s", "live_p1s",
          "understand_p1s", "like_p1s", "go_p1s"
        ];

        // Try to find a priority verb that isn't known yet
        for (const verbKey of priorityVerbs) {
          if (!knownKeys.has(verbKey)) {
            chosenVerb = verbCandidates.find(w => w.key === verbKey);
            if (chosenVerb) break;
          }
        }
      }

      // Use the priority verb if found and not randomizing, otherwise pick a random verb
      newWord = chosenVerb || verbCandidates[Math.floor(Math.random() * verbCandidates.length)];

    } else if (nonVerbCandidates.length > 0) {
      // Pick a random non-verb
      newWord = nonVerbCandidates[Math.floor(Math.random() * nonVerbCandidates.length)];
    } else {
      // If no non-verbs, fall back to verbs (pick a random one)
      newWord = verbCandidates[Math.floor(Math.random() * verbCandidates.length)];
    }

    let wordsToIntroduce: WordData[] = [newWord];

    // If it's a verb, gather all of its conjugations by the same base
    if (newWord.PartOfSpeech.toLowerCase().includes("verb")) {
      const baseKey = getVerbBaseKey(newWord);
      if (baseKey) {
        // Collect all "sibling" forms that share the same base
        const siblingForms = candidates.filter((w) => {
          if (!w.PartOfSpeech.toLowerCase().includes("verb")) return false;
          return getVerbBaseKey(w) === baseKey;
        });
        // Merge them, removing duplicates
        wordsToIntroduce = [...new Set([...wordsToIntroduce, ...siblingForms])];
      }
    }

    // Convert them to KnownWordState
    const newEntries: KnownWordState[] = wordsToIntroduce.map((w) => ({
      data: w,
      rating: 0,
      lastSeen: 0,
      interval: 1,
      repetitions: 0,
      easeFactor: 2.5,
    }));

    // Add to knownWords
    setKnownWords((prev) => [...prev, ...newEntries]);
  }

  // ----------------------------
  //  Handle rating (SM-2 logic)
  // ----------------------------
  function handleScore(diff: "easy" | "good" | "hard" | "fail") {
    let nextKnownWords: KnownWordState[] = []; // To store the updated state for score calculation

    setKnownWords((prev) => {
      const updated = [...prev];
       // Ensure currentIndex is valid before accessing
      if (currentIndex < 0 || currentIndex >= updated.length) {
          console.error(`Invalid currentIndex ${currentIndex} for knownWords length ${updated.length}. Resetting index.`);
          setCurrentIndex(0); // Simple recovery attempt
          return prev; // Return previous state to avoid crash or unexpected updates
      }
      const cardState = updated[currentIndex];
      const score = difficultyToScore(diff);
      console.log(`Handling score for card index ${currentIndex}, word: ${cardState.data.key}, score: ${diff}(${score})`); // LOG 1
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
      nextKnownWords = updated; // Capture the updated state
      return updated;
    });

    // --- Introduction Trigger Logic ---
    // Use a timeout to allow state update to potentially settle before calculating score
    // Although capturing nextKnownWords should be sufficient, this adds robustness
    setTimeout(() => {
        let introductionTriggerScore = 0;
        const currentKnownWords = knownWordsRef.current; // Use ref for the most current state

        if (currentKnownWords.length > 0) {
            const relevantWords = skipVerbs
                ? currentKnownWords.filter(kw => !kw.data.PartOfSpeech.toLowerCase().includes("verb"))
                : currentKnownWords;

            if (relevantWords.length > 0) {
                const sum = relevantWords.reduce((acc, kw) => acc + kw.rating / 3, 0);
                introductionTriggerScore = sum / relevantWords.length;
                console.log(`Calculated trigger score: ${introductionTriggerScore.toFixed(3)} (sum: ${sum.toFixed(3)}, relevant count: ${relevantWords.length}, total count: ${currentKnownWords.length}, skipVerbs: ${skipVerbs})`); // LOG 2
            } else {
                console.log(`No relevant words found for trigger score calculation (total count: ${currentKnownWords.length}, skipVerbs: ${skipVerbs})`); // LOG 3
            }
        } else {
            console.log("KnownWords is empty, cannot calculate trigger score."); // LOG 4
        }


        // Possibly introduce more cards if the score of *relevant* cards is high
        if (introductionTriggerScore > 0.68) {
          console.log("Threshold met. Attempting to introduce new word."); // LOG 5
          introduceRandomKnownWord();
        } else {
          console.log(`Threshold (0.8) not met. Score: ${introductionTriggerScore.toFixed(3)}. Skipping word introduction.`); // LOG 6
        }

        pickNextCard();
    }, 0); // Timeout 0 ms pushes execution to after the current call stack
  }

  /** Average rating/3 across ALL known words. */
  function computeOverallScore(): number {
    if (knownWords.length === 0) return 0;
    const sum = knownWords.reduce((acc, kw) => acc + kw.rating / 3, 0);
    return sum / knownWords.length;
  }

  /** Priority for SM-2 scheduling: overdue cards get higher priority. */
  function calculateCardPriority(card: KnownWordState): number {
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

    setKnownWords((prev) => {
      // Increment lastSeen for all cards except the one just shown
      const updatedLastSeen = prev.map((kw, i) =>
        i === currentIndex ? kw : { ...kw, lastSeen: kw.lastSeen + 1 }
      );

      let candidates = updatedLastSeen;

      // If skipVerbs is true, try to filter out verbs
      if (skipVerbs) {
        const nonVerbCandidates = updatedLastSeen.filter(
          kw => !kw.data.PartOfSpeech.toLowerCase().includes("verb")
        );
        // Only use the filtered list if it's not empty
        if (nonVerbCandidates.length > 0) {
          candidates = nonVerbCandidates;
        }
        // If only verbs are left, we'll proceed with the full list (candidates = updatedLastSeen)
      }

      // Find the highest priority card among the candidates
      let bestIdx = -1; // Use -1 to indicate not found initially
      let bestVal = -Infinity;
      candidates.forEach((kw) => {
        const priority = calculateCardPriority(kw);
        if (priority > bestVal) {
          bestVal = priority;
          // Find the original index in updatedLastSeen
          bestIdx = updatedLastSeen.findIndex(originalKw => originalKw.data.key === kw.data.key);
        }
      });

      // If no suitable candidate was found (e.g., empty list, though unlikely), default to 0
      if (bestIdx === -1 && updatedLastSeen.length > 0) {
          console.warn("No suitable next card found, defaulting to index 0.");
          bestIdx = 0;
      } else if (bestIdx === -1) {
          console.warn("Known words list is empty.");
          // Cannot set index if list is empty
          return updatedLastSeen; // Return unchanged list
      }


      setCurrentIndex(bestIdx);
      return updatedLastSeen; // Return the list with updated lastSeen values
    });

    setIsFlipped(false);
    setShowEnglish(false);
  }

  // --------------
  //  "Get Lesson"
  // --------------
  async function handleGetLesson() {
    if (!knownWords[currentIndex]) return;
    try {
      setIsModalOpen(true);
      setIsLessonLoading(true);
      setLessonMarkdown("");

      const word = knownWords[currentIndex].data.GeorgianWord;
      const res = await fetch(`/api/lesson?word=${encodeURIComponent(word)}`);
      if (!res.ok) {
        throw new Error("Failed to get lesson");
      }
      const data = await res.json();
      setLessonMarkdown(data.lesson || "No lesson found");
    } catch (error) {
      console.error(error);
      setLessonMarkdown("Error fetching lesson from the server.");
    } finally {
      setIsLessonLoading(false);
    }
  }

  // -----------------------------------
  //  Button to clear progress (now inside menu)
  // -----------------------------------
  function handleClearProgress() {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setKnownWords([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowEnglish(false);
    setCardCounter(0);
    setIsMenuOpen(false); // Close menu after resetting
    setRandomizeVerbs(false); // <-- Reset config
    setSkipVerbs(false);      // <-- Reset config
    setIsLeftHanded(false);   // <-- Reset config

    // Introduce the first word after clearing
    // Need a slight delay or ensure allWords is ready
    setTimeout(() => {
        if (allWords.length > 0) {
            introduceRandomKnownWord();
        }
    }, 100); // Small delay to ensure state updates settle
  }

  // Add the Home button click handler
  const handleHomeClick = () => {
    router.push('/'); // Navigate to the home page
  };

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

  // --- Helper functions for BottomBar props ---
  const handleFlip = (): void => {
    setIsFlipped(true);
  };

  const handleToggleHandedness = (): void => {
    setIsLeftHanded(prev => !prev);
  };
  // --- End Helper functions ---

  // Loading or no data state
  if (knownWords.length === 0 && allWords.length > 0) {
      // Waiting for the initialization useEffect to run
      return (
          <div className="p-8 text-center text-white bg-black h-screen flex items-center justify-center">
              <p>Initializing...</p>
          </div>
      );
  } else if (!currentCard && knownWords.length > 0) {
      // This might happen briefly if currentIndex is invalid after load/reset
      // The useEffect above will attempt to fix this, show a temporary message
      return (
          <div className="p-8 text-center text-white bg-black h-screen flex items-center justify-center">
              <p>Resetting view...</p>
          </div>
      );
  } else if (knownWords.length === 0 && allWords.length === 0) {
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
  const { EnglishWord, GeorgianWord } = currentCard.data;
  const verbHint = getVerbHint(currentCard.data);

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

            {/* Dropdown Menu - Including existing items */}
            {isMenuOpen && (
              <div className="absolute left-0 mt-2 w-56 bg-gray-800 border border-gray-600 rounded-md shadow-lg z-10">
                <ul className="divide-y divide-gray-700">
                  {/* Randomize Verbs Toggle - Keep this */}
                  <li>
                    <button
                      onClick={() => setRandomizeVerbs(prev => !prev)} // Ensure setRandomizeVerbs exists
                      className="flex justify-between items-center w-full px-4 py-2 text-sm text-slate-200 hover:bg-gray-700"
                    >
                      <span>Randomize Verbs</span>
                      <span className={`ml-2 px-2 py-0.5 rounded text-xs ${randomizeVerbs ? 'bg-green-600' : 'bg-gray-600'}`}>
                        {randomizeVerbs ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  </li>
                  {/* Skip Verbs Toggle - Keep this */}
                  <li>
                    <button
                      onClick={() => setSkipVerbs(prev => !prev)} // Ensure setSkipVerbs exists
                      className="flex justify-between items-center w-full px-4 py-2 text-sm text-slate-200 hover:bg-gray-700"
                    >
                      <span>Skip Verbs</span>
                      <span className={`ml-2 px-2 py-0.5 rounded text-xs ${skipVerbs ? 'bg-green-600' : 'bg-gray-600'}`}>
                        {skipVerbs ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  </li>
                  {/* Reset Progress - Keep this */}
                  <li>
                    <button
                      onClick={handleClearProgress} // Ensure handleClearProgress exists
                      className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
                    >
                      Reset Progress
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Home Button - Add this */}
          <button
            onClick={handleHomeClick}
            className="p-2 border border-gray-600 rounded hover:bg-gray-700"
            aria-label="Go to Home"
          >
            <Home size={20} />
          </button>
          {/* End Home Button */}
        </div>

        {/* Center Score - Keep this */}
        <div className="text-sm">Score: {knownWords.length}</div>

        {/* Right Button - Keep this */}
        <button
          onClick={handleGetLesson}
          className="px-3 py-2 border border-gray-600 rounded text-sm hover:bg-gray-700"
        >
          Get Lesson
        </button>
      </div>
      {/* End Top Bar */}

      {/* Main Content - Fixed height area */}
      <div className={`${mainAreaClasses} h-[calc(100vh-140px)]`}>
        <div className="flex flex-col items-center justify-center text-center w-full max-w-sm">
          <div className="relative w-full mb-3" style={{ height: '280px' }}>
            <Image
              src={`/img/${currentCard.data.img_key}.webp`}
              alt={EnglishWord}
              fill
              sizes="(max-width: 768px) 100vw, 320px"
              className="object-contain"
              onClick={() => setShowEnglish((prev) => !prev)}
              priority
            />
          </div>

          {showEnglish && (
            <p className="text-base font-semibold mb-3">
              {EnglishWord}
            </p>
          )}
          {/* {!showEnglish && !isFlipped && (
            <p className=" text-slate-700  mb-3">
              click for translation
            </p>
          )} */}

          <p className="text-3xl tracking-wider mb-4 min-h-[40px]">
            {!isFlipped ? verbHint ?? "" : GeorgianWord}
          </p>
        </div>
      </div>

      {/* Bottom Bar - Replace existing JSX with the component */}
      <BottomBar
        isFlipped={isFlipped}
        isLeftHanded={isLeftHanded}
        onFlip={handleFlip}
        onRate={handleScore} // Pass handleScore directly
        onToggleHandedness={handleToggleHandedness}
      />

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
                <h1 className="text-3xl font-bold mb-3">{GeorgianWord}</h1>
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