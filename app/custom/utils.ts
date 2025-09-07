import { CustomWord, CustomWordData } from './types';

const CUSTOM_DECK_KEY = 'custom-deck';

// Generate a simple UUID
function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// Parse CSV text into CustomWord array
export function parseCustomCSV(csvText: string): CustomWord[] {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) return [];

  let startIndex = 0;
  const firstLine = lines[0].toLowerCase();
  
  // Auto-detect header row
  if (firstLine.includes('front') || firstLine.includes('back')) {
    startIndex = 1;
  }

  const words: CustomWord[] = [];
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Proper CSV parsing that handles quoted fields with commas
    const columns = parseCSVLine(line);
    
    if (columns.length < 2) continue; // Need at least front and back
    
    const word: CustomWord = {
      front: columns[0],
      back: columns[1],
      examplePreview: columns[2] || undefined,
      exampleRevealed: columns[3] || undefined,
      key: generateId()
    };
    
    words.push(word);
  }
  
  return words;
}

// Proper CSV line parsing that handles quoted fields with commas
function parseCSVLine(line: string): string[] {
  const columns: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // Escaped quote ("") -> single quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // End of column
      columns.push(current.trim());
      current = '';
      i++;
    } else {
      // Regular character
      current += char;
      i++;
    }
  }
  
  // Don't forget the last column
  columns.push(current.trim());
  
  return columns;
}

// Save custom words to localStorage
export function saveCustomWords(words: CustomWord[]): void {
  localStorage.setItem(CUSTOM_DECK_KEY, JSON.stringify(words));
}

// Load custom words from localStorage
export function loadCustomWords(): CustomWord[] {
  const stored = localStorage.getItem(CUSTOM_DECK_KEY);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Add words to existing deck
export function addToCustomDeck(newWords: CustomWord[]): CustomWord[] {
  const existing = loadCustomWords();
  const combined = [...existing, ...newWords];
  saveCustomWords(combined);
  return combined;
}

// Clear all custom words
export function clearCustomDeck(): void {
  localStorage.removeItem(CUSTOM_DECK_KEY);
}

// Transform CustomWord to match existing WordData structure for review logic
export function createCustomWordData(word: CustomWord): CustomWordData {
  return {
    data: word,
    easinessFactor: 2.5,
    interval: 1,
    repetitions: 0,
    nextReviewDate: new Date()
  };
}

// Get storage key for custom deck progress
export function getCustomProgressKey(): string {
  return 'custom-deck-progress';
}