# Audio Generation with 11labs

NOTE: WE ARE WAITING FOR V3 MODEL TO BECOME AVAILABLE with API

## Setup

1. Copy `.env.example` to `.env`
2. Add your 11labs API key and Georgian voice ID
3. Run the script to test with one word:

```bash
node scripts/generate-audio.js
```

## How it works

The script:
1. Reads words from `public/words.csv`
2. Uses the unique `key` field for file naming
3. Generates MP3 files in:
   - `public/audio/words/{key}.mp3` for Georgian words
   - `public/audio/examples/{key}_ex1.mp3` for example sentences

## Voice Selection

For Georgian, you'll need to either:
- Find a Georgian voice in the 11labs voice library
- Clone a Georgian speaker's voice
- Use the multilingual model with a voice that handles Georgian well

## File Structure

```
public/audio/
├── words/
│   └── hello.mp3         # გამარჯობა
└── examples/
    └── hello_ex1.mp3     # გამარჯობა, როგორ ხარ დღეს?
```