#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { getCachedLesson, cacheLesson, getCacheStats } from '../lib/lessonCache';
import { parseArgs } from 'util';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Parse command line arguments
const { values: args } = parseArgs({
  options: {
    help: { type: 'boolean', short: 'h', default: false },
    test: { type: 'string', short: 't' },
    limit: { type: 'string', short: 'l' },
    overwrite: { type: 'boolean', short: 'o', default: false },
    'dry-run': { type: 'boolean', default: false },
    delay: { type: 'string', short: 'd', default: '1000' },
  },
  allowPositionals: true,
});

// Show help
if (args.help) {
  console.log(`
Generate Lessons Script

Usage: npm run generate-lessons [options]

Options:
  -h, --help         Show this help message
  -t, --test <word>  Test with a specific word (can use multiple times)
  -l, --limit <n>    Limit to first n words
  -o, --overwrite    Overwrite existing cached lessons
  --dry-run          Show what would be generated without actually doing it
  -d, --delay <ms>   Delay between API calls in milliseconds (default: 1000)

Examples:
  npm run generate-lessons --test "hello"           # Test with one word
  npm run generate-lessons --test "hello" --test "thank you"  # Test with multiple words
  npm run generate-lessons --limit 10               # Generate first 10 words
  npm run generate-lessons --limit 10 --overwrite   # Regenerate first 10 words
  npm run generate-lessons --dry-run                # See what would be generated
  npm run generate-lessons                          # Generate all missing lessons
  npm run generate-lessons --overwrite              # Regenerate all lessons (careful!)
`);
  process.exit(0);
}

interface WordEntry {
  EnglishWord: string;
  GeorgianWord: string;
}

// Load words from CSV
function loadWords(): WordEntry[] {
  const csvPath = path.join(process.cwd(), 'public', 'words.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',');
  
  const englishIndex = headers.indexOf('EnglishWord');
  const georgianIndex = headers.indexOf('GeorgianWord');
  
  const words: WordEntry[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split(',');
    if (parts[georgianIndex] && parts[englishIndex]) {
      words.push({
        EnglishWord: parts[englishIndex],
        GeorgianWord: parts[georgianIndex],
      });
    }
  }
  
  return words;
}

// Sleep helper for delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate lesson with exponential backoff for rate limiting
async function generateLessonWithRetry(
  word: string, 
  maxRetries = 5,
  baseDelay = 1000
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not set in environment');
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const prompt = `Teach me about the Georgian word or phrase "${word}" by providing a short lesson. 
        First: provide a *short* description of what the word or phrase means, including other meanings if there are any.
        Next, provide a list of 4 usage examples, with english translations. 
          - The examples should demonstrate *typical* usage of the word or phrase.
          - They should increase in complexity, from the simplest possible example to intermediate examples.
          - Try to use simple vocabulary in the examples, but feel free to demonstrate different grammar tenses.
          - Feel free to make examples build off of one another (recycle new vocab).
        If you are explaining a phrase, list the translation of each word in the phrase.
        Next a short examle of when someone might use the word, adding quotations around the georgian word being used.
        Then provide a short list of synoynms and related words, and their meanings.
        Then provide a short list of antonyms and related words, and their meanings.
        In the final section, write any other short notes that could be useful for the learner, for example *optional* sections include:
          - is the word made up of or related to another word? is there interesting etymology? (if not leave out)
          - does the learner need to know anything about context, or when to use vs similar words? (if not leave out)
          - can you think of an interesting auditory mnemonic to help remember the word? (if not leave out) 
          - is there anything else you think the learner should know? (if not leave out)

        Avoid transliteration but feel free to include the English translation.
        
        Answer in **markdown** format, using headings, bullet points, etc. 
        Write it as if for a language learner.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful Georgian language tutor.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (response.status === 429) {
        // Rate limited - exponential backoff
        const retryAfter = response.headers.get('retry-after');
        const waitTime = retryAfter 
          ? parseInt(retryAfter) * 1000 
          : baseDelay * Math.pow(2, attempt);
        
        console.log(`  ⚠️  Rate limited. Waiting ${waitTime/1000}s before retry ${attempt + 1}/${maxRetries}...`);
        await sleep(waitTime);
        continue;
      }

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;

    } catch (error) {
      console.error(`  ❌ Error generating lesson (attempt ${attempt + 1}/${maxRetries}):`, error);
      
      if (attempt < maxRetries - 1) {
        const waitTime = baseDelay * Math.pow(2, attempt);
        console.log(`  ⏳ Waiting ${waitTime/1000}s before retry...`);
        await sleep(waitTime);
      } else {
        return null;
      }
    }
  }
  
  return null;
}

// Main generation function
async function generateLessons() {
  // Check for API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY environment variable not set');
    console.log('Please set it in your .env.local file or export it:');
    console.log('  export OPENAI_API_KEY="your-key-here"');
    process.exit(1);
  }

  const delay = parseInt(args.delay || '1000');
  const overwrite = args.overwrite;
  const dryRun = args['dry-run'];
  const limit = args.limit ? parseInt(args.limit) : undefined;
  
  // Load words
  let words = loadWords();
  console.log(`📚 Loaded ${words.length} words from CSV\n`);

  // Filter based on test mode
  if (args.test) {
    const testWords = Array.isArray(args.test) ? args.test : [args.test];
    words = words.filter(w => 
      testWords.some(test => 
        w.GeorgianWord.toLowerCase().includes(test.toLowerCase()) ||
        w.EnglishWord.toLowerCase().includes(test.toLowerCase())
      )
    );
    console.log(`🧪 Test mode: Processing ${words.length} matching words\n`);
  }

  // Apply limit
  if (limit) {
    words = words.slice(0, limit);
    console.log(`📊 Limited to first ${limit} words\n`);
  }

  // Check existing cache
  const stats = getCacheStats();
  console.log(`📊 Current cache: ${stats.count} lessons (${(stats.totalSizeBytes / 1024).toFixed(1)} KB)\n`);

  // Filter out already cached (unless overwriting)
  const toGenerate: WordEntry[] = [];
  let skipped = 0;

  for (const word of words) {
    const cached = getCachedLesson(word.GeorgianWord);
    if (cached && !overwrite) {
      skipped++;
    } else {
      toGenerate.push(word);
    }
  }

  console.log(`📝 Generation plan:`);
  console.log(`  - Total words: ${words.length}`);
  console.log(`  - Already cached: ${skipped}`);
  console.log(`  - To generate: ${toGenerate.length}`);
  console.log(`  - Mode: ${overwrite ? 'OVERWRITE' : 'Skip existing'}`);
  console.log(`  - Delay between calls: ${delay}ms`);
  
  if (dryRun) {
    console.log(`\n🔍 Dry run - would generate lessons for:`);
    toGenerate.slice(0, 10).forEach(w => {
      console.log(`  - ${w.GeorgianWord} (${w.EnglishWord})`);
    });
    if (toGenerate.length > 10) {
      console.log(`  ... and ${toGenerate.length - 10} more`);
    }
    return;
  }

  if (toGenerate.length === 0) {
    console.log('\n✅ No lessons to generate!');
    return;
  }

  // Confirm before proceeding with large generations
  if (toGenerate.length > 20 && !args.test) {
    console.log(`\n⚠️  This will generate ${toGenerate.length} lessons`);
    console.log(`   Estimated cost: $${(toGenerate.length * 0.01).toFixed(2)}`);
    console.log(`   Estimated time: ${Math.round(toGenerate.length * (delay + 500) / 60000)} minutes`);
    console.log('\nPress Ctrl+C to cancel, or wait 5 seconds to continue...');
    await sleep(5000);
  }

  console.log(`\n🚀 Starting generation...\n`);

  // Generate lessons
  let successful = 0;
  let failed = 0;

  for (let i = 0; i < toGenerate.length; i++) {
    const word = toGenerate[i];
    const progress = `[${i + 1}/${toGenerate.length}]`;
    
    console.log(`${progress} Generating: ${word.GeorgianWord} (${word.EnglishWord})`);
    
    const lesson = await generateLessonWithRetry(word.GeorgianWord, 5, delay);
    
    if (lesson) {
      cacheLesson(word.GeorgianWord, lesson);
      successful++;
      console.log(`  ✅ Success! (${(lesson.length / 1024).toFixed(1)} KB)\n`);
    } else {
      failed++;
      console.log(`  ❌ Failed to generate\n`);
    }

    // Add delay between requests (except for last one)
    if (i < toGenerate.length - 1) {
      await sleep(delay);
    }
  }

  // Final stats
  console.log('\n📊 Generation complete!');
  console.log(`  ✅ Successful: ${successful}`);
  console.log(`  ❌ Failed: ${failed}`);
  
  const finalStats = getCacheStats();
  console.log(`\n📚 Final cache: ${finalStats.count} lessons (${(finalStats.totalSizeBytes / 1024).toFixed(1)} KB)`);
}

// Run the script
generateLessons().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});