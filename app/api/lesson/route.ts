import { NextRequest } from "next/server";
import { getCachedLesson, cacheLesson } from "../../../lib/lessonCache";

// Streaming response with better reliability and UX
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get("word");
  
  if (!word) {
    return new Response(
      JSON.stringify({ error: "No word provided." }),
      { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  // Check cache first
  const cachedLesson = getCachedLesson(word);
  if (cachedLesson) {
    // Return cached lesson immediately
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"status":"connecting"}\n\n'));
        controller.enqueue(new TextEncoder().encode('data: {"status":"generating"}\n\n'));
        controller.enqueue(new TextEncoder().encode(
          `data: ${JSON.stringify({ 
            status: "complete",
            lesson: cachedLesson
          })}\n\n`
        ));
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "OPENAI_API_KEY not set" }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  // Create a ReadableStream for streaming response
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const prompt = `Teach me about the Georgian word or phrase "${word}" by providing a short lesson. 
        First: provide a *short* description of what the word or phrase means, including other meanings if there are any.
        Next, provide a list of 4 usage examples, with english translations. 
          - The examples should demonstrate *typical* usage of the word or phrase.
          - They should increase in complexity, from the simplest possible example to intermediate examples.
          - Try to use simple vocabulary in the examples, but feel free to demonstrate different grammar tenses.
          - Feel free to make examples build off of one another (recycle new vocab).
        If you are explaining a phrase, list the translation of each word in the phrase 
          Exception: single pronoun (of form მე მან ის ჩვენ თქვენ ისინი მას მათ) + a verb does not need to be broken down.
        Next a short examle of when someone might use the word, adding quotations around the georgian word being used.
        Then provide a short list of synoynms and related words, and their meanings.
        Then provide a short list of antonyms and related words, and their meanings.
        In the final section, write any other short notes that could be useful for the learner, for example *optional* sections include:
          - is the word made up of or related to another word? is there interesting etymology? (if not leave out)
          - does the learner need to know anything about context, or when to use vs similar words? (if not leave out)
          - can you think of an interesting auditory mnemonic (to similar sounding english words) to help remember the word? (if not leave out) 
          - is there anything else you think the learner should know? (if not leave out)

        Avoid transliteration but feel free to include the English translation.
        
        Answer in **markdown** format, using headings, bullet points, etc. 
        Write it as if for a language learner.`;

        // Send initial status
        controller.enqueue(new TextEncoder().encode('data: {"status":"connecting"}\n\n'));

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: "You are a helpful Georgian language tutor.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.7,
            stream: true, // Enable streaming
          }),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          console.error(`OpenAI API error: ${response.status} ${response.statusText}`, errorBody);
          
          controller.enqueue(new TextEncoder().encode(
            `data: ${JSON.stringify({ 
              error: `OpenAI API error: ${response.statusText}`,
              details: errorBody 
            })}\n\n`
          ));
          controller.close();
          return;
        }

        // Send status update
        controller.enqueue(new TextEncoder().encode('data: {"status":"generating"}\n\n'));

        // Process streaming response
        const reader = response.body?.getReader();
        if (!reader) {
          controller.enqueue(new TextEncoder().encode(
            'data: {"error":"Failed to get response stream"}\n\n'
          ));
          controller.close();
          return;
        }

        let fullContent = "";
        const decoder = new TextDecoder();
        const startTime = Date.now();
        const TIMEOUT_MS = 60000; // 60 second timeout

        while (true) {
          // Check for timeout
          if (Date.now() - startTime > TIMEOUT_MS) {
            controller.enqueue(new TextEncoder().encode(
              `data: ${JSON.stringify({ 
                error: "Request timed out",
                lesson: fullContent
              })}\n\n`
            ));
            break;
          }

          const { done, value } = await reader.read();
          
          if (done) {
            // Cache the completed lesson
            if (fullContent.trim()) {
              cacheLesson(word, fullContent);
            }
            
            controller.enqueue(new TextEncoder().encode(
              `data: ${JSON.stringify({ 
                status: "complete",
                lesson: fullContent
              })}\n\n`
            ));
            break;
          }

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                
                if (content) {
                  fullContent += content;
                  
                  // Send incremental update
                  controller.enqueue(new TextEncoder().encode(
                    `data: ${JSON.stringify({ 
                      status: "streaming", 
                      content: content,
                      fullContent: fullContent 
                    })}\n\n`
                  ));
                }
              } catch (e) {
                // Skip malformed JSON
                continue;
              }
            }
          }
        }

      } catch (err: any) {
        console.error("Error in streaming lesson:", err);
        
        controller.enqueue(new TextEncoder().encode(
          `data: ${JSON.stringify({ 
            error: "Failed to generate lesson",
            details: err.message 
          })}\n\n`
        ));
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}