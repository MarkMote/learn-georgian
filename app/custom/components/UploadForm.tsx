// app/custom/components/UploadForm.tsx
"use client";

import React, { useState } from 'react';
import { Eye, Upload, X, Edit3, Copy, Check } from 'lucide-react';
import { CustomWord } from '../types';
import { parseCustomCSV } from '../utils';

interface UploadFormProps {
  onUpload: (words: CustomWord[]) => void;
  isAddMode?: boolean;
  onCancel?: () => void;
}

export default function UploadForm({ onUpload, isAddMode = false, onCancel }: UploadFormProps) {
  const [csvText, setCsvText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<CustomWord[]>([]);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedCSV, setCopiedCSV] = useState(false);

  const examplePrompt = `Generate a vocabulary list in CSV format for learning Georgian.

Topic: [YOUR TOPIC]
Number of rows: [NUMBER]

Use this exact CSV format with headers:
front,back,examplePreview,exampleRevealed

Where:
- front: English word/phrase
- back: Translation in target language
- examplePreview: Example sentence in English
- exampleRevealed: Same sentence translated

Use quotations to enclose the content of each row so things are properly delimited. 

Output ONLY the CSV with no explanation.`;

  const exampleCSV = `front,back,examplePreview,exampleRevealed
"go","წასვლა","I go home.","მე სახლში მივდივარ."
"come","მოსვლა","I come to you.","მე შენთან მოვდივარ."
"walk","სიარული","I walk in the park.","მე პარკში დავდივარ."
"run","სირბილი","I run every morning.","მე ყოველ დილით ვარბენ."
"arrive","მისვლა","I arrive at work.","მე სამსახურში მივდივარ."
"leave","გამოსვლა","I leave the house.","მე სახლიდან გამოვდივარ."
"enter","შესვლა","I enter the room.","მე ოთახში შევდივარ."
"exit","გამოსვლა","I exit the building.","მე შენობიდან გამოვდივარ."
"return","დაბრუნება","I return home.","მე სახლში ვბრუნდები."
"travel","მოგზაურობა","I travel to Georgia.","მე საქართველოში ვმოგზაურობ."
"move","მოძრაობა","I move forward.","მე წინ ვმოძრაობ."
"bring","მოტანა","I bring the book.","მე წიგნს მოვიტან."
"take","წაღება","I take the bag.","მე ჩანთას წავიღებ."
"approach","მიახლოება","I approach the door.","მე კართან ვუახლოვდები."
"pass","გავლა","I pass the street.","მე ქუჩას გავდივარ."
"cross","გადაკვეთა","I cross the bridge.","მე ხიდს გადავკვეთ."
"climb","ასვლა","I climb the hill.","მე გორაზე ავდივარ."
"descend","ჩასვლა","I descend the stairs.","მე კიბეზე ჩავდივარ."
"stop","გაჩერება","I stop here.","მე აქ ვჩერდები."
"follow","გაყოლა","I follow you.","მე შენ გყვები."`;

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(examplePrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleCopyCSV = async () => {
    await navigator.clipboard.writeText(exampleCSV);
    setCopiedCSV(true);
    setTimeout(() => setCopiedCSV(false), 2000);
  };

  const handlePreview = () => {
    if (!csvText.trim()) {
      setError('Please enter CSV content');
      return;
    }

    setError('');
    setIsProcessing(true);

    try {
      const words = parseCustomCSV(csvText);
      if (words.length === 0) {
        setError('No valid words found. Make sure your CSV has at least front,back columns.');
        setPreview([]);
      } else {
        setPreview(words);
      }
    } catch (err) {
      setError('Error parsing CSV. Please check the format.');
      setPreview([]);
    }

    setIsProcessing(false);
  };

  const handleUpload = () => {
    if (preview.length === 0) {
      handlePreview();
      return;
    }

    onUpload(preview);
  };

  const sampleCSV = `front,back,examplePreview,exampleRevealed
cat,კატა,I have a cat,მე კატა მყავს
dog,ძაღლი,The dog is big,ძაღლი დიდია
house,სახლი,My house is small,ჩემი სახლი პატარაა`;

  return (
    <div className="text-white p-6 max-w-3xl w-full">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-light mb-4 text-slate-300">
          {isAddMode ? 'Add More Words' : 'Upload Custom Deck'}
        </h1>
        <p className="text-gray-400 text-sm">
          Paste your CSV content below. Format: front,back. Optional columns: examplePreview,exampleRevealed. 
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-lg font-medium mb-4">CSV Content</label>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={`Paste your CSV here, for example:\n\n${sampleCSV}`}
            className="w-full h-40 p-3 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-500 font-mono text-sm"
            disabled={isProcessing}
          />
        </div>

        {error && (
          <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded">
            {error}
          </div>
        )}

        {preview.length > 0 && (
          <div className="bg-gray-800 border border-gray-600 p-4 rounded">
            <h3 className="text-lg font-medium mb-3">Preview ({preview.length} words)</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {preview.slice(0, 5).map((word, index) => (
                <div key={word.key} className="flex items-center justify-between text-sm py-1">
                  <span className="text-gray-300 truncate flex-1">{word.front}</span>
                  <span className="text-gray-500 mx-2">→</span>
                  <span className="text-gray-300 truncate flex-1 text-right">{word.back}</span>
                  {(word.examplePreview || word.exampleRevealed) && (
                    <span className="text-green-500 text-xs ml-2">ex</span>
                  )}
                </div>
              ))}
              {preview.length > 5 && (
                <div className="text-gray-500 text-sm pt-2 border-t border-gray-700">
                  ... and {preview.length - 5} more words
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col space-y-4 max-w-md w-full mx-auto">
          {preview.length === 0 ? (
            <button
              onClick={handlePreview}
              disabled={isProcessing || !csvText.trim()}
              className="flex items-center justify-center gap-3 px-8 py-4 w-full border border-gray-600 hover:bg-gray-700 disabled:hover:bg-transparent disabled:opacity-50 rounded text-lg transition-colors"
            >
              <Eye className="w-5 h-5 text-gray-400" />
              <span>{isProcessing ? 'Processing...' : 'Preview'}</span>
            </button>
          ) : (
            <button
              onClick={handleUpload}
              className="flex items-center justify-center gap-3 px-8 py-4 w-full border border-gray-600 hover:bg-gray-700 rounded text-lg transition-colors"
            >
              <Upload className="w-5 h-5 text-gray-400" />
              <span>{isAddMode ? 'Add Words' : 'Upload Deck'}</span>
            </button>
          )}
          
          {((isAddMode || preview.length > 0) && onCancel) || preview.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {(isAddMode || preview.length > 0) && onCancel && (
                <button
                  onClick={onCancel}
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-600 hover:bg-gray-700 rounded transition-colors text-sm"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              )}

              {preview.length > 0 && (
                <button
                  onClick={() => {
                    setPreview([]);
                    setCsvText('');
                    setError('');
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-600 hover:bg-gray-700 rounded transition-colors text-sm"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-12  text-sm">
        <div className="flex items-center py-2 justify-between mb-3">
          <h4 className="font-medium text-lg">Example Prompt for AI</h4>
          <button
            onClick={handleCopyPrompt}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 border border-gray-600 rounded-lg transition-colors"
          >
            {copiedPrompt ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-400" />
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        <pre className="text-gray-300 border rounded-xl my-3 border-neutral-700 text-xs whitespace-pre-wrap bg-neutral-800/40 p-5  overflow-x-auto">
{examplePrompt}
        </pre>
        <p className="text-gray-500 text-xs mt-2">
          Copy this prompt, customize the [BRACKETS], and paste into ChatGPT, Claude, Gemini, or your preferred AI.
        </p>
      </div>

      <div className="mt-8 text-sm">
        <div className="flex items-center py-2 justify-between mb-3">
          <h4 className="font-medium text-lg">Example CSV</h4>
          <button
            onClick={handleCopyCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 border border-gray-600 rounded-lg transition-colors"
          >
            {copiedCSV ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-400" />
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        <pre className="text-gray-300 border rounded-xl my-3 border-neutral-700 text-xs whitespace-pre-wrap bg-neutral-800/40 p-5 overflow-x-auto max-h-60 overflow-y-auto">
{exampleCSV}
        </pre>
        <p className="text-gray-500 text-xs mt-2">
          20 Georgian motion verbs with example sentences. Copy and paste directly into the text area above.
        </p>
      </div>
    </div>
  );
}