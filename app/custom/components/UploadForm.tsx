"use client";

import React, { useState } from 'react';
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
    <div className="bg-black text-white p-6 rounded-lg max-w-2xl w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">
          {isAddMode ? 'Add More Words' : 'Upload Custom Deck'}
        </h2>
        <p className="text-gray-400 text-sm">
          Paste your CSV content below. Format: front,back,examplePreview,exampleRevealed
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">CSV Content</label>
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
          <div className="bg-gray-800 p-4 rounded">
            <h3 className="text-lg font-medium mb-3">Preview ({preview.length} words)</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {preview.slice(0, 5).map((word, index) => (
                <div key={word.key} className="flex justify-between text-sm">
                  <span className="text-gray-300">{word.front}</span>
                  <span className="text-white">→</span>
                  <span className="text-gray-300">{word.back}</span>
                  {word.examplePreview && (
                    <span className="text-gray-500 text-xs">+ examples</span>
                  )}
                </div>
              ))}
              {preview.length > 5 && (
                <div className="text-gray-500 text-sm">
                  ... and {preview.length - 5} more words
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          {preview.length === 0 ? (
            <button
              onClick={handlePreview}
              disabled={isProcessing || !csvText.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded transition-colors"
            >
              {isProcessing ? 'Processing...' : 'Preview'}
            </button>
          ) : (
            <button
              onClick={handleUpload}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded transition-colors"
            >
              {isAddMode ? 'Add Words' : 'Upload Deck'}
            </button>
          )}
          
          {(isAddMode || preview.length > 0) && onCancel && (
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded transition-colors"
            >
              Cancel
            </button>
          )}

          {preview.length > 0 && (
            <button
              onClick={() => {
                setPreview([]);
                setCsvText('');
                setError('');
              }}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded transition-colors"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-900 rounded text-sm">
        <h4 className="font-medium mb-2">CSV Format Guide:</h4>
        <ul className="text-gray-400 space-y-1">
          <li>• <strong>front,back</strong> - Required columns</li>
          <li>• <strong>examplePreview,exampleRevealed</strong> - Optional example columns</li>
          <li>• Header row is auto-detected and skipped</li>
          <li>• Use commas to separate columns</li>
          <li>• Wrap text in quotes if it contains commas</li>
        </ul>
      </div>
    </div>
  );
}