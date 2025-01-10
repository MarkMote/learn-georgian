// src/app/flashcards/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

// Data interfaces
interface Synonym {
  georgian: string
  transliteration: string
  description: string
}

interface Example {
  georgian: string
  transliteration: string
  english: string
}

interface ConjugationForm {
  georgian: string
  transliteration: string
  english: string
}

interface PresentTense {
  first_person_singular: ConjugationForm
  second_person_singular: ConjugationForm
  third_person_singular: ConjugationForm
  first_person_plural: ConjugationForm
  second_person_plural: ConjugationForm
  third_person_plural: ConjugationForm
}

interface FlashcardItem {
  type: 'word' | 'verb' | 'phrase'
  georgian: string
  english: string
  transliteration: string
  word_type?: string
  category?: string
  description_english?: string
  synonyms?: Synonym[]
  antonyms?: Synonym[]
  examples?: Example[]
  conjugation_examples?: {
    present_tense: PresentTense
  }
}

export default function FlashcardsPage() {
  const [allItems, setAllItems] = useState<FlashcardItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [showWord, setShowWord] = useState(false)
  const [imageExists, setImageExists] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    Promise.all([
      fetch('/data/words.json').then((res) => res.json()),
      fetch('/data/verbs.json').then((res) => res.json()),
      fetch('/data/phrases.json').then((res) => res.json()),
    ])
      .then(([wordsData, verbsData, phrasesData]) => {
        // Transform each type into a common shape
        const wordItems: FlashcardItem[] = wordsData.map((w: any) => ({
          type: 'word',
          georgian: w.georgian,
          english: w.english,
          transliteration: w.transliteration,
          word_type: w.word_type,
          category: w.category,
          description_english: w.description_english,
          synonyms: w.synonyms,
          antonyms: w.antonyms,
          examples: w.examples,
        }))
        const verbItems: FlashcardItem[] = verbsData.map((v: any) => ({
          type: 'verb',
          georgian: v.georgian,
          english: v.english,
          transliteration: v.transliteration,
          word_type: v.word_type,
          category: v.category,
          description_english: v.description_english,
          examples: v.examples,
          conjugation_examples: v.conjugation_examples,
        }))
        const phraseItems: FlashcardItem[] = phrasesData.map((p: any) => ({
          type: 'phrase',
          georgian: p.georgian,
          english: p.english,
          transliteration: p.transliteration,
          description_english: p.description_english,
          examples: p.examples,
        }))

        const combined = [...wordItems, ...verbItems, ...phraseItems]
        const shuffled = shuffleArray(combined)
        setAllItems(shuffled)

        // Check for images
        shuffled.forEach((item) => {
          fetch(`/img/${encodeURIComponent(item.georgian)}.png`)
            .then((response) =>
              setImageExists((prev) => ({ ...prev, [item.georgian]: response.ok }))
            )
            .catch(() =>
              setImageExists((prev) => ({ ...prev, [item.georgian]: false }))
            )
        })
      })
      .catch((error) => {
        console.error('Error fetching data:', error)
      })
  }, [])

  function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array]
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
    }
    return newArray
  }

  function handlePrev() {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : allItems.length - 1))
    resetStates()
  }

  function handleNext() {
    setCurrentIndex((prev) => (prev < allItems.length - 1 ? prev + 1 : 0))
    resetStates()
  }

  function resetStates() {
    setShowHint(false)
    setShowWord(false)
  }

  // If there are no items yet, render a loading state
  if (allItems.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-700">Loading flashcards...</p>
      </div>
    )
  }

  const currentItem = allItems[currentIndex]
  const hasImage = currentItem && imageExists[currentItem.georgian]

  // Render the "all details" box content
  function renderDetails(item: FlashcardItem) {
    return (
      <div className="space-y-2">
        {/* Row: large Georgian on left, transliteration on right */}
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">{item.georgian}</div>
          <div className="text-xl text-gray-700">{item.transliteration}</div>
        </div>

        {/* If verb, show conjugation right after transliteration */}
        {item.type === 'verb' && item.conjugation_examples?.present_tense && (
          <div className=" rounded p-2">
            <div className="font-medium mb-2">Conjugation (Present Tense):</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {Object.entries(item.conjugation_examples.present_tense).map(([, form], idx) => (
                <div key={idx} className="border rounded p-2">
                  <div className="font-medium">{form.english}</div>
                  <div>{form.georgian}</div>
                  <div className="text-gray-600 text-sm">{form.transliteration}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Word type */}
        {item.word_type && (
          <div>
            <span className="font-medium">Word Type:</span> {item.word_type}
          </div>
        )}

        {/* Category */}
        {item.category && (
          <div>
            <span className="font-medium">Category:</span> {item.category}
          </div>
        )}

        {/* Description */}
        {item.description_english && (
          <div>
            <span className="font-medium">Description:</span> {item.description_english}
          </div>
        )}

        {/* Synonyms */}
        {item.synonyms && item.synonyms.length > 0 && (
          <div>
            <span className="font-medium">Synonyms:</span>
            <ul className="list-disc list-inside ml-4">
              {item.synonyms.map((syn, i) => (
                <li key={i}>
                  {syn.georgian} ({syn.transliteration}) - {syn.description}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Antonyms */}
        {item.antonyms && item.antonyms.length > 0 && (
          <div>
            <span className="font-medium">Antonyms:</span>
            <ul className="list-disc list-inside ml-4">
              {item.antonyms.map((ant, i) => (
                <li key={i}>
                  {ant.georgian} ({ant.transliteration}) - {ant.description}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Examples */}
        {item.examples && item.examples.length > 0 && (
          <div>
            <span className="font-medium">Examples:</span>
            {item.examples.map((ex, i) => (
              <div key={i} className="ml-4 mt-1">
                <div>{ex.georgian}</div>
                <div className="text-gray-600">{ex.english}</div>
                <div className="text-gray-500 text-sm">{ex.transliteration}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="max-w-4xl w-full mx-auto px-4 py-8 flex-1 flex flex-col">
        {/* Navigation row (top) */}
        <div className="flex justify-between mb-4">
          <button
            onClick={handlePrev}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
          >
            Previous
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setShowHint((prev) => !prev)}
              className="px-4 py-2 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
            >
              Show Hint
            </button>
            <button
              onClick={() => setShowWord((prev) => !prev)}
              className="px-4 py-2 bg-green-100 rounded hover:bg-green-200 transition-colors"
            >
              Show All Details
            </button>
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            >
              Next
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md flex-1 flex flex-col">
          {/* Top section (image) */}
          <div className="flex flex-col md:flex-row md:justify-center items-center">
            <div className="relative w-64 h-64 mb-4 md:mb-0 md:mr-8">
              {hasImage ? (
                <Image
                  src={`/img/${encodeURIComponent(currentItem.georgian)}.png`}
                  alt={currentItem.georgian}
                  fill
                  className="object-contain rounded-lg"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400 text-sm">No image</span>
                </div>
              )}
            </div>
          </div>

          {/* Hint box */}
          {showHint && (
            <div className="border rounded-lg p-4 mt-4 text-gray-700 space-y-1">
              <div className="font-medium">
                {currentItem.type === 'phrase'
                  ? 'Phrase'
                  : currentItem.type.charAt(0).toUpperCase() +
                    currentItem.type.slice(1)}
              </div>
              <div>
                <span className="font-medium">English:</span> {currentItem.english}
              </div>
              {currentItem.category && (
                <div>
                  <span className="font-medium">Category:</span> {currentItem.category}
                </div>
              )}
            </div>
          )}

          {/* All details box */}
          {showWord && (
            <div className=" rounded-lg p-4 mt-4 text-gray-700">
              {renderDetails(currentItem)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
