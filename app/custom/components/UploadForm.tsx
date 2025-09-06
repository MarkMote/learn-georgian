"use client";

import React, { useState } from 'react';
import { Eye, Upload, X, Edit3 } from 'lucide-react';
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
    <div className="text-white p-6 max-w-2xl w-full">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-light mb-4 text-slate-300">
          {isAddMode ? 'Add More Words' : 'Upload Custom Deck'}
        </h1>
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