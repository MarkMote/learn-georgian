"use client";

import { useState } from "react";

export function useLessonModal() {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [lessonMarkdown, setLessonMarkdown] = useState<string>("");
  const [isLessonLoading, setIsLessonLoading] = useState<boolean>(false);
  const [isIncomplete, setIsIncomplete] = useState<boolean>(false);
  const [currentWord, setCurrentWord] = useState<string>("");

  const handleGetLesson = async (georgianWord: string, retryCount = 0) => {
    setIsModalOpen(true);
    setIsLessonLoading(true);
    setLessonMarkdown("");
    setIsIncomplete(false);
    setCurrentWord(georgianWord);

    try {
      const response = await fetch(`/api/lesson?word=${encodeURIComponent(georgianWord)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to get lesson: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get response stream");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.error) {
                console.error("Lesson error:", data.error);
                setLessonMarkdown(`Error: ${data.error}`);
                setIsLessonLoading(false);
                return;
              }

              switch (data.status) {
                case "connecting":
                  setLessonMarkdown("🔗 Connecting to AI tutor...");
                  break;
                  
                case "generating":
                  setLessonMarkdown("🤔 AI is thinking about your word...");
                  break;
                  
                case "streaming":
                  if (data.fullContent) {
                    setLessonMarkdown(data.fullContent);
                    setIsLessonLoading(false);
                  }
                  break;
                  
                case "complete":
                  setLessonMarkdown(data.lesson || "No lesson found");
                  setIsLessonLoading(false);
                  setIsIncomplete(false);
                  break;
                  
                case "incomplete":
                  setLessonMarkdown(data.lesson || "No lesson found");
                  setIsLessonLoading(false);
                  setIsIncomplete(true);
                  break;
              }
            } catch (e) {
              continue;
            }
          }
        }
      }
    } catch (error) {
      console.error("Lesson fetch error:", error);
      
      if (retryCount < 2) {
        console.log(`Retrying lesson request (attempt ${retryCount + 2}/3)...`);
        setLessonMarkdown(`🔄 Connection failed, retrying (${retryCount + 2}/3)...`);
        setTimeout(() => handleGetLesson(georgianWord, retryCount + 1), 2000);
        return;
      }
      
      setLessonMarkdown("❌ Error fetching lesson from the server. Please try again.");
      setIsLessonLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const retryLesson = () => {
    if (currentWord) {
      handleGetLesson(currentWord);
    }
  };

  return {
    isModalOpen,
    lessonMarkdown,
    isLessonLoading,
    isIncomplete,
    handleGetLesson,
    closeModal,
    retryLesson,
  };
}