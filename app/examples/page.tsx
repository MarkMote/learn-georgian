'use client'
import { useState, useEffect } from 'react'

interface Phrase {
  georgian_phrase: string
  transliteration: string
  english_phrase: string
}

interface VisibilityState {
  transliteration: boolean
  meaning: boolean
}

export default function PhrasesPage() {
  const [phrases, setPhrases] = useState<Phrase[]>([])
  const [visibleStates, setVisibleStates] = useState<{ [key: number]: VisibilityState }>({})

  useEffect(() => {
    fetch('/examples.json')
      .then(response => response.json())
      .then(data => setPhrases(data))
      .catch(error => console.error('Error loading phrases:', error))
  }, [])

  const toggleTransliteration = (index: number) => {
    setVisibleStates(prev => ({
      ...prev,
      [index]: {
        ...prev[index] || { transliteration: false, meaning: false },
        transliteration: !(prev[index]?.transliteration ?? false)
      }
    }))
  }

  const toggleMeaning = (index: number) => {
    setVisibleStates(prev => ({
      ...prev,
      [index]: {
        ...prev[index] || { transliteration: false, meaning: false },
        meaning: !(prev[index]?.meaning ?? false)
      }
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Georgian Phrases
        </h1>
        
        <div className="space-y-4">
          {phrases.map((phrase, index) => (
            <div 
              key={index} 
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
            >
              <div className="space-y-4">
                {/* Georgian Phrase - Always visible */}
                <div className="text-xl font-medium text-gray-900">
                  {phrase.georgian_phrase}
                </div>
                
                {/* Toggle Buttons */}
                <div className="flex gap-4">
                  <button 
                    onClick={() => toggleTransliteration(index)}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md
                             text-sm font-medium text-gray-700 bg-white
                             hover:bg-gray-50 focus:outline-none focus:ring-2
                             focus:ring-offset-2 focus:ring-indigo-500
                             transition-colors"
                  >
                    {visibleStates[index]?.transliteration ? 'Hide Transliteration' : 'Show Transliteration'}
                  </button>
                  
                  <button 
                    onClick={() => toggleMeaning(index)}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md
                             text-sm font-medium text-gray-700 bg-white
                             hover:bg-gray-50 focus:outline-none focus:ring-2
                             focus:ring-offset-2 focus:ring-indigo-500
                             transition-colors"
                  >
                    {visibleStates[index]?.meaning ? 'Hide Meaning' : 'Show Meaning'}
                  </button>
                </div>
                
                {/* Transliteration - Conditionally visible */}
                {visibleStates[index]?.transliteration && (
                  <div className="text-gray-600">
                    <span className="font-medium">Transliteration:</span>{' '}
                    {phrase.transliteration}
                  </div>
                )}
                
                {/* English Meaning - Conditionally visible */}
                {visibleStates[index]?.meaning && (
                  <div className="text-gray-800">
                    <span className="font-medium">English:</span>{' '}
                    {phrase.english_phrase}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}