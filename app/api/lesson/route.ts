
import { NextRequest, NextResponse } from "next/server";

// (Optional) If using the openai npm package: npm install openai
// Here we demonstrate a direct fetch call for clarity.

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get("word");
  if (!word) {
    return NextResponse.json(
      { error: "No word provided." },
      { status: 400 }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not set" },
      { status: 500 }
    );
  }

  try {
    const prompt = `Teach me about the Georgian word "${word}" by providing a short lesson. 
    First, provide a list of 5 short usage examples, with english translations. They should be in simple Georgian, 2-3 words long.
    Next give 1-2 examples of when someone might use the word, adding quotations around the georgian word being used.
    Then provide a short list of synoynms and related words, and their meanings.
    Then provide a short list of antonyms and related words, and their meanings.
    Then provide a short explanation of the word's meaning and usage, interesting etymology, notes on usage or grammar, etc.

    Avoid transliteration but feel free to include the English translation.
    
    Answer in **markdown** format, using headings, bullet points, etc. 
    Write it as if for a language learner.`;

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
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "OpenAI API error" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const lessonMarkdown = data.choices?.[0]?.message?.content || "No response";

    return NextResponse.json({ lesson: lessonMarkdown });
  } catch (err) {
    console.error("Error calling OpenAI:", err);
    return NextResponse.json(
      { error: "Failed to fetch lesson." },
      { status: 500 }
    );
  }
}
