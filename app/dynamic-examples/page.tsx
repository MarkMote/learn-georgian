'use client'

import { useState, useEffect } from 'react'

interface VocabItem {
  type: string
  english: string
  georgian: string
  created: string
  ease: number
  last_seen_index: number
}

interface GeneratedExample {
  georgian: string
  english: string
  transliteration: string
}

export default function DynamicExamplesPage() {
  const [vocab, setVocab] = useState<VocabItem[]>([])
  const [selectedWords, setSelectedWords] = useState<string[]>([])
  const [examples, setExamples] = useState<GeneratedExample[]>([])
  const [loading, setLoading] = useState(false)
  const [showTransliterations, setShowTransliterations] = useState<{ [key: number]: boolean }>({})
  const [showMeanings, setShowMeanings] = useState<{ [key: number]: boolean }>({})

  useEffect(() => {
    fetch('/data/vocab.json')
      .then(res => res.json())
      .then(data => setVocab(data))
      .catch(error => console.error('Error loading vocabulary:', error))
  }, [])

  const toggleTransliteration = (index: number) => {
    setShowTransliterations(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const toggleMeaning = (index: number) => {
    setShowMeanings(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const handleWordSelect = (georgian: string) => {
    setSelectedWords(prev => 
      prev.includes(georgian)
        ? prev.filter(word => word !== georgian)
        : [...prev, georgian]
    )
  }

  const selectAllWords = () => {
    setSelectedWords(vocab.map(item => item.georgian))
  }

  const clearSelection = () => {
    setSelectedWords([])
  }

  const generateExamples = async () => {
    setLoading(true)
    
    // Create the prompt for the API
    const selectedVocab = vocab.filter(item => selectedWords.includes(item.georgian))
    const prompt = `Create 5 example sentences in Georgian that use these words: ${selectedVocab.map(item => 
      `${item.georgian} (${item.english})`).join(', ')}. 

      Use simple language and common vocabulary. Keep the sentences short and clear.
      
      For each sentence, provide:
      1. The Georgian sentence
      2. English translation
      3. Latin transliteration
      
      Format each example as a JSON object with these properties:
      {
        "georgian": "Georgian sentence",
        "english": "English translation",
        "transliteration": "Latin transliteration"
      }`

    try {
      const response = await fetch('/api/generate-examples', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt })
      })

      if (!response.ok) {
        throw new Error('Failed to generate examples')
      }

      const data = await response.json()
      setExamples(data.examples)
    } catch (error) {
      console.error('Error generating examples:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 text-black">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Generate Practice Examples
        </h1>

        {/* Word Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-medium">Select Words to Practice</h2>
            <div className="space-x-4">
              <button
                onClick={selectAllWords}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={clearSelection}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {vocab.map((item) => (
              <button
                key={`${item.georgian}-${item.english}`}
                onClick={() => handleWordSelect(item.georgian)}
                className={`p-2 rounded border text-left
                          ${selectedWords.includes(item.georgian)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-blue-300'}`}
              >
                <div className="font-medium">{item.georgian}</div>
                <div className="text-sm text-gray-600">{item.english}</div>
              </button>
            ))}
          </div>

          <button
            onClick={generateExamples}
            disabled={selectedWords.length === 0 || loading}
            className={`mt-6 w-full py-3 rounded-md font-medium text-white
                      ${selectedWords.length === 0 || loading
                        ? 'bg-gray-400'
                        : 'bg-green-500 hover:bg-green-600'}`}
          >
            {loading ? 'Generating...' : 'Generate Examples'}
          </button>
        </div>

        {/* Generated Examples */}
        {examples.length > 0 && (
          <div className="space-y-4">
            {examples.map((example, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 space-y-4">
                <div className="text-xl font-medium text-gray-900">
                  {example.georgian}
                </div>
                
                <div className="flex gap-4">
                  <button
                    onClick={() => toggleTransliteration(index)}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium
                             text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    {showTransliterations[index] ? 'Hide Transliteration' : 'Show Transliteration'}
                  </button>
                  <button
                    onClick={() => toggleMeaning(index)}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium
                             text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    {showMeanings[index] ? 'Hide Meaning' : 'Show Meaning'}
                  </button>
                </div>

                {showTransliterations[index] && (
                  <div className="text-gray-600">
                    <span className="font-medium">Transliteration:</span>{' '}
                    {example.transliteration}
                  </div>
                )}

                {showMeanings[index] && (
                  <div className="text-gray-800">
                    <span className="font-medium">English:</span>{' '}
                    {example.english}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}