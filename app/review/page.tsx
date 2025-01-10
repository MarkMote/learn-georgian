'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface Example {
  georgian: string
  transliteration: string
  english: string
}

interface Synonym {
  georgian: string
  transliteration: string
  description: string
}

interface Word {
  georgian: string
  english: string
  transliteration: string
  word_type: string
  category: string
  definition_georgian: string
  description_english: string
  synonyms: Synonym[]
  antonyms: Synonym[]
  examples: Example[]
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

interface Verb {
  english: string
  georgian: string
  transliteration: string
  word_type: string
  category: string
  definition_georgian: string
  description_english: string
  examples: Example[]
  conjugation_examples: {
    present_tense: PresentTense
  }
}

interface Phrase {
  english: string
  georgian: string
  transliteration: string
  description_english: string
  examples: Example[]
}

export default function LearnPage() {
  const [activeTab, setActiveTab] = useState<'words' | 'verbs' | 'phrases'>('words')
  const [words, setWords] = useState<Word[]>([])
  const [verbs, setVerbs] = useState<Verb[]>([])
  const [phrases, setPhrases] = useState<Phrase[]>([])
  const [showTransliterations, setShowTransliterations] = useState<{ [key: string]: boolean }>({})
  const [showMeanings, setShowMeanings] = useState<{ [key: string]: boolean }>({})
  const [imageExists, setImageExists] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    Promise.all([
      fetch('/data/words.json').then(res => res.json()),
      fetch('/data/verbs.json').then(res => res.json()),
      fetch('/data/phrases.json').then(res => res.json())
    ]).then(([wordsData, verbsData, phrasesData]) => {
      // Reverse the arrays before setting state
      const reversedWords = [...wordsData].reverse()
      const reversedVerbs = [...verbsData].reverse()
      const reversedPhrases = [...phrasesData].reverse()

      setWords(reversedWords)
      setVerbs(reversedVerbs)
      setPhrases(reversedPhrases)

      // Check for image existence for all items
      const allItems = [...reversedWords, ...reversedVerbs, ...reversedPhrases]
      allItems.forEach(item => {
        fetch(`/img/${item.georgian}.png`)
          .then(response => {
            setImageExists(prev => ({
              ...prev,
              [item.georgian]: response.ok
            }))
          })
          .catch(() => {
            setImageExists(prev => ({
              ...prev,
              [item.georgian]: false
            }))
          })
      })
    })
  }, [])

  const createUniqueKey = (base: string, index: number) => `${base}-${index}`

  const toggleTransliteration = (id: string) => {
    setShowTransliterations(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const toggleMeaning = (id: string) => {
    setShowMeanings(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const TabButton = ({ tab, label }: { tab: 'words' | 'verbs' | 'phrases', label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 font-medium rounded-lg transition-colors
                ${activeTab === tab 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
    >
      {label}
    </button>
  )

  const renderWordCard = (word: Word, index: number) => (
    <div key={createUniqueKey(word.georgian, index)} className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <div className="flex items-start space-x-4">
        {/* Image container */}
        <div className="w-32 h-32 relative flex-shrink-0">
          {imageExists[word.georgian] ? (
            <Image
              src={`/img/${encodeURIComponent(word.georgian)}.png`}
              alt={word.english}
              fill
              className="object-contain rounded-lg"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-sm">No image</span>
            </div>
          )}
        </div>

        <div className="flex-grow">
          <div className="text-xl font-medium text-gray-900">{word.georgian}</div>
          <div className="text-sm text-gray-600">{word.category}</div>
        </div>
      </div>
      
      <div className="flex gap-4">
        <button
          onClick={() => toggleTransliteration(createUniqueKey(word.georgian, index))}
          className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium
                   text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          {showTransliterations[createUniqueKey(word.georgian, index)] ? 'Hide Transliteration' : 'Show Transliteration'}
        </button>
        <button
          onClick={() => toggleMeaning(createUniqueKey(word.georgian, index))}
          className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium
                   text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          {showMeanings[createUniqueKey(word.georgian, index)] ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {showTransliterations[createUniqueKey(word.georgian, index)] && (
        <div className="text-gray-600">
          <span className="font-medium">Transliteration:</span> {word.transliteration}
        </div>
      )}

      {showMeanings[createUniqueKey(word.georgian, index)] && (
        <div className="space-y-3 pt-2">
          <div>
            <span className="font-medium">English:</span> {word.english}
          </div>
          <div>
            <span className="font-medium">Category:</span> {word.category}
          </div>
          <div>
            <span className="font-medium">Definition (Georgian):</span> {word.definition_georgian}
          </div>
          <div>
            <span className="font-medium">Description:</span> {word.description_english}
          </div>
          {word.examples.length > 0 && (
            <div>
              <span className="font-medium">Examples:</span>
              {word.examples.map((example, exampleIndex) => (
                <div key={`${createUniqueKey(word.georgian, index)}-example-${exampleIndex}`} className="ml-4 mt-2">
                  <div>{example.georgian}</div>
                  <div className="text-gray-600">{example.english}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderVerbCard = (verb: Verb, index: number) => (
    <div key={createUniqueKey(verb.georgian, index)} className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <div className="flex items-start space-x-4">
        {/* Image container */}
        <div className="w-20 h-20 relative flex-shrink-0">
          {imageExists[verb.georgian] ? (
            <Image
              src={`/img/${encodeURIComponent(verb.georgian)}.png`}
              alt={verb.english}
              fill
              className="object-contain rounded-lg"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-sm">No image</span>
            </div>
          )}
        </div>

        <div className="flex-grow">
          <div className="text-xl font-medium text-gray-900">{verb.georgian}</div>
          <div className="text-sm text-gray-600">{verb.category}</div>
        </div>
      </div>
      
      <div className="flex gap-4">
        <button
          onClick={() => toggleTransliteration(createUniqueKey(verb.georgian, index))}
          className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium
                   text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          {showTransliterations[createUniqueKey(verb.georgian, index)] ? 'Hide Transliteration' : 'Show Transliteration'}
        </button>
        <button
          onClick={() => toggleMeaning(createUniqueKey(verb.georgian, index))}
          className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium
                   text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          {showMeanings[createUniqueKey(verb.georgian, index)] ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {showTransliterations[createUniqueKey(verb.georgian, index)] && (
        <div className="text-gray-600">
          <span className="font-medium">Transliteration:</span> {verb.transliteration}
        </div>
      )}

      {showMeanings[createUniqueKey(verb.georgian, index)] && (
        <div className="space-y-3 pt-2">
          <div>
            <span className="font-medium">English:</span> {verb.english}
          </div>
          <div>
            <span className="font-medium">Category:</span> {verb.category}
          </div>
          <div>
            <span className="font-medium">Description:</span> {verb.description_english}
          </div>
          {verb.examples.length > 0 && (
            <div>
              <span className="font-medium">Examples:</span>
              {verb.examples.map((example, exampleIndex) => (
                <div key={`${createUniqueKey(verb.georgian, index)}-example-${exampleIndex}`} className="ml-4 mt-2">
                  <div>{example.georgian}</div>
                  <div className="text-gray-600">{example.english}</div>
                </div>
              ))}
            </div>
          )}
          <div>
            <span className="font-medium">Conjugation (Present Tense):</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              {Object.entries(verb.conjugation_examples.present_tense).map(([person, form], conjugationIndex) => (
                <div key={`${createUniqueKey(verb.georgian, index)}-conjugation-${conjugationIndex}`} className="border rounded p-2">
                  <div className="font-medium">{form.english}</div>
                  <div>{form.georgian}</div>
                  <div className="text-gray-600 text-sm">{form.transliteration}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderPhraseCard = (phrase: Phrase, index: number) => (
    <div key={createUniqueKey(phrase.georgian, index)} className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <div className="flex items-start space-x-4">
        {/* Image container */}
        <div className="w-20 h-20 relative flex-shrink-0">
          {imageExists[phrase.georgian] ? (
            <Image
              src={`/img/${encodeURIComponent(phrase.georgian)}.png`}
              alt={phrase.english}
              fill
              className="object-contain rounded-lg"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-sm">No image</span>
            </div>
          )}
        </div>

        <div className="flex-grow">
          <div className="text-xl font-medium text-gray-900">{phrase.georgian}</div>
        </div>
      </div>
      
      <div className="flex gap-4">
        <button
          onClick={() => toggleTransliteration(createUniqueKey(phrase.georgian, index))}
          className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium
                   text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          {showTransliterations[createUniqueKey(phrase.georgian, index)] ? 'Hide Transliteration' : 'Show Transliteration'}
        </button>
        <button
          onClick={() => toggleMeaning(createUniqueKey(phrase.georgian, index))}
          className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium
                   text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          {showMeanings[createUniqueKey(phrase.georgian, index)] ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {showTransliterations[createUniqueKey(phrase.georgian, index)] && (
        <div className="text-gray-600">
          <span className="font-medium">Transliteration:</span> {phrase.transliteration}
        </div>
      )}

      {showMeanings[createUniqueKey(phrase.georgian, index)] && (
        <div className="space-y-3 pt-2">
          <div>
            <span className="font-medium">English:</span> {phrase.english}
          </div>
          <div>
            <span className="font-medium">Description:</span> {phrase.description_english}
          </div>
          {phrase.examples.length > 0 && (
            <div>
              <span className="font-medium">Examples:</span>
              {phrase.examples.map((example, exampleIndex) => (
                <div key={`${createUniqueKey(phrase.georgian, index)}-example-${exampleIndex}`} className="ml-4 mt-2">
                  <div>{example.georgian}</div>
                  <div className="text-gray-600">{example.english}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8 text-black px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Learn Georgian
        </h1>

        <div className="flex gap-4 mb-8 justify-center">
          <TabButton tab="words" label="Words" />
          <TabButton tab="verbs" label="Verbs" />
          <TabButton tab="phrases" label="Phrases" />
        </div>

        <div className="space-y-4">
          {activeTab === 'words' && words.map((word, index) => renderWordCard(word, index))}
          {activeTab === 'verbs' && verbs.map((verb, index) => renderVerbCard(verb, index))}
          {activeTab === 'phrases' && phrases.map((phrase, index) => renderPhraseCard(phrase, index))}
        </div>
      </div>
    </div>
  )
}