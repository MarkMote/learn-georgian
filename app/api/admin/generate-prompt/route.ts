// app/api/admin/generate-prompt/route.ts

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { englishWord, georgianWord, exampleEnglish, partOfSpeech } = await request.json();

    if (!englishWord) {
      return NextResponse.json(
        { error: 'English word is required' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert at creating image generation prompts for language learning flashcards.
Your goal is to create memorable, visually interesting images that help learners remember vocabulary.

IMPORTANT STYLE RULES:
- AVOID cartoon, clipart, flat illustration, vector art, or typical "flashcard" styles - these are boring and forgettable
- PREFER: realistic photography, cinematic shots, oil paintings, watercolors, charcoal sketches, polaroid, vintage photographs, film stills, documentary style, fine art, surrealist art, Renaissance style, impressionist paintings, abstract, concept art, detailed digital illustration, pop art, ukiyo-e Japanese woodblock, gouache illustration, Art Nouveau, neon noir, Baroque painting, stained glass style, psychedelic art, Persian miniature, paper cut-out style, or anything not flashcard style.
- Additionally, the tone should match the word, but generally prefer "bright and vivid" vs "dark and moody" for words that are neutral. 
- Prefer creative and colorfull styles, rather than generic oil paintings (those are fine in moderation)
- Each image should feel unique and memorable, but still educational
- Each image should perfectly and uniquely describe the word
- include the word or phrase in the prompt

Guidelines:
- Make the image memorable and distinctive
- Consider the context from the example sentence if provided
- For abstract words, use creative visual metaphors or surrealist approaches
- For abstract words, not everything needs to be abstract, you can also depict people in a situation where the word is most relevant. e.g. the word "answer" could be shown abstractly, but it would better be shown by a person at a white board writing down an answer. 
- For concrete nouns, consider interesting compositions, lighting, or perspectives
- Keep prompts concise but descriptive (1-2 sentences)
- NEVER include any text, letters, or writing in the image
- Vary your approach - pick a different style for each word
- If a word needs multiple examples, you can consider composite images 
- Keep things simple! we dont need a complex prompt or image, just something that communicates the word concept
- remember: the core purpose is to create a prompt for an image that will represent the word. the image shouldnt be able to be confused with any other word. 
Return ONLY the image prompt, nothing else.`;

    const userPrompt = `Create an image generation prompt for this vocabulary word:

Word: ${englishWord} (Georgian: ${georgianWord})
Part of speech: ${partOfSpeech || 'unknown'}
${exampleEnglish ? `Example sentence: ${exampleEnglish}` : ''}

Generate a creative, memorable image prompt:`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 150,
      temperature: 0.7, // Higher temperature for more variety
    });

    const generatedPrompt = response.choices[0]?.message?.content?.trim();

    if (!generatedPrompt) {
      return NextResponse.json(
        { error: 'Failed to generate prompt' },
        { status: 500 }
      );
    }

    // Append the no-text instruction to be safe
    const finalPrompt = generatedPrompt.includes('no text')
      ? generatedPrompt
      : `${generatedPrompt} Do not include any text in the image.`;

    return NextResponse.json({ prompt: finalPrompt });
  } catch (error: any) {
    console.error('[Prompt Gen] ERROR:', error);
    return NextResponse.json(
      { error: error.message || 'Prompt generation failed' },
      { status: 500 }
    );
  }
}
