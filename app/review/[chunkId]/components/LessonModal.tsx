"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface LessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  georgianWord: string;
  lessonContent: string;
  isLoading: boolean;
}

export default function LessonModal({
  isOpen,
  onClose,
  georgianWord,
  lessonContent,
  isLoading,
}: LessonModalProps) {
  if (!isOpen) return null;

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
        className="mb-3 leading-relaxed text-slate-300 text-base tracking-wide font-light"
        {...props}
      />
    ),
    ul: (props: any) => (
      <ul
        className="list-disc list-outside mb-3 ml-6 text-slate-200 tracking-wide text-lg font-light"
        {...props}
      />
    ),
    ol: (props: any) => (
      <ol
        className="list-decimal list-outside mb-3 ml-6 text-slate-200 font-light"
        {...props}
      />
    ),
    li: (props: any) => (
      <li className="mb-2 text-slate-200 leading-relaxed" {...props} />
    ),
    strong: (props: any) => (
      <strong className="font-semibold" {...props} />
    ),
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-neutral-950 bg-opacity-80 z-50" 
      onClick={onClose}
    >
      <div
        className="bg-neutral-950/70 backdrop-blur-lg text-white p-6 rounded-xl w-[95%] max-w-3xl max-h-[90dvh] overflow-auto relative border-2 border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-0 right-1 p-3 text-4xl text-gray-400 hover:text-gray-100"
        >
          ✕
        </button>

        <div className="mt-6">
          <h1 className="text-3xl font-bold mb-3">{georgianWord}</h1>
          
          {isLoading && !lessonContent && (
            <div className="flex items-center justify-center mt-6 mb-6">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white mr-3"></div>
              <span>Preparing lesson...</span>
            </div>
          )}
          
          {lessonContent && (
            <div className="relative">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {lessonContent}
              </ReactMarkdown>
              
              {isLoading && (
                <div className="mt-4 flex items-center text-gray-400">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span className="ml-2 text-sm">Writing...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}