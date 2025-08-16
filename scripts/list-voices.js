require('dotenv').config({ path: '.env.local' });

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

async function listVoices() {
  if (!ELEVENLABS_API_KEY) {
    console.error('❌ ELEVENLABS_API_KEY not set in .env.local file');
    process.exit(1);
  }
  
  console.log('Using API key:', ELEVENLABS_API_KEY.substring(0, 10) + '...');

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response status:', response.status);
      console.error('Response headers:', response.headers);
      console.error('Error details:', errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    console.log('\n📢 Available Voices:\n');
    console.log('━'.repeat(80));
    
    data.voices.forEach(voice => {
      console.log(`Name: ${voice.name}`);
      console.log(`ID: ${voice.voice_id}`);
      console.log(`Category: ${voice.category || 'N/A'}`);
      
      // Check if it supports Georgian or is multilingual
      if (voice.labels) {
        const languages = voice.labels.language || 'Not specified';
        console.log(`Languages: ${languages}`);
        
        if (voice.labels.description) {
          console.log(`Description: ${voice.labels.description}`);
        }
      }
      
      // Highlight multilingual voices
      if (voice.name.toLowerCase().includes('multilingual') || 
          voice.category === 'generated') {
        console.log('✅ Likely supports Georgian (multilingual)');
      }
      
      console.log('─'.repeat(80));
    });
    
    console.log(`\nTotal voices: ${data.voices.length}`);
    console.log('\n💡 Look for multilingual voices or those that specifically mention Georgian support');
    console.log('💡 Copy the voice_id of your chosen voice and add it to your .env file\n');
    
  } catch (error) {
    console.error('Error fetching voices:', error.message);
  }
}

listVoices();