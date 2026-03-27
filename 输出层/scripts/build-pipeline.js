require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const ffmpeg = require('fluent-ffmpeg');

// ==========================================
// CONFIG
// ==========================================
// TTS text: accept from CLI argument, fall back to original Ditto demo text
const TEXT_TO_SPEAK = process.argv[2] ||
  "Okay, real talk. I didn't think campus dating could be this easy. Ditto is insane! You just type it in your browser, and it plans the whole date for you!";

const INPUT_VIDEO = path.join(__dirname, '../Input/原始声音.mp4');
const TEMP_AUDIO = path.join(__dirname, '../public/temp_sample.mp3');
const FINAL_VOICEOVER = path.join(__dirname, '../public/voiceover.mp3');
const CAPTIONS_OUTPUT = path.join(__dirname, '../public/captions.json');

const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

const PROXY = {
  protocol: 'http',
  host: '127.0.0.1',
  port: 7890,
};

if (!ELEVENLABS_KEY) {
  console.error('Missing ELEVENLABS_API_KEY in .env');
  process.exit(1);
}
if (!OPENAI_KEY) {
  console.error('Missing OPENAI_API_KEY in .env');
  process.exit(1);
}

// ==========================================
// [1/4] Extract audio from source video
// ==========================================
function extractAudio() {
  return new Promise((resolve, reject) => {
    console.log('\n⏳ [1/4] Extracting audio from 原始声音.mp4...');
    ffmpeg(INPUT_VIDEO)
      .noVideo()
      .audioCodec('libmp3lame')
      .save(TEMP_AUDIO)
      .on('end', () => {
        console.log('✅ [1/4] Audio extracted → temp_sample.mp3');
        resolve();
      })
      .on('error', (err) => {
        console.error('❌ [1/4] Failed:', err.message);
        reject(err);
      });
  });
}

// ==========================================
// [2/4] Clone voice via ElevenLabs
// ==========================================
async function cloneVoice() {
  console.log('\n⏳ [2/4] Uploading voice to ElevenLabs for cloning...');
  const formData = new FormData();
  formData.append('name', `Pipeline_Clone_${Date.now()}`);
  formData.append('files', fs.createReadStream(TEMP_AUDIO));
  formData.append('description', 'TikTok energetic voice clone');

  const response = await axios.post(
    'https://api.elevenlabs.io/v1/voices/add',
    formData,
    {
      headers: { 'xi-api-key': ELEVENLABS_KEY, ...formData.getHeaders() },
      proxy: PROXY,
    }
  );

  const voiceId = response.data.voice_id;
  console.log(`✅ [2/4] Voice cloned! ID: ${voiceId}`);
  return voiceId;
}

// ==========================================
// [3/4] Generate TTS voiceover
// ==========================================
async function generateTTS(voiceId) {
  console.log('\n⏳ [3/4] Generating TTS voiceover...');
  const response = await axios.post(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      text: TEXT_TO_SPEAK,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        similarity_boost: 0.75,
        stability: 0.3,
        style: 0.2,
      },
    },
    {
      headers: {
        'xi-api-key': ELEVENLABS_KEY,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      responseType: 'stream',
      proxy: PROXY,
    }
  );

  const writer = fs.createWriteStream(FINAL_VOICEOVER);
  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  console.log('✅ [3/4] Voiceover saved → voiceover.mp3');
}

// ==========================================
// [4/4] Generate word-level captions (Whisper)
// ==========================================
async function generateCaptions() {
  console.log('\n⏳ [4/4] Sending voiceover to Whisper for word timestamps...');
  const form = new FormData();
  form.append('file', fs.createReadStream(FINAL_VOICEOVER));
  form.append('model', 'whisper-1');
  form.append('response_format', 'verbose_json');
  form.append('timestamp_granularities[]', 'word');

  const { data } = await axios.post(
    'https://api.openai.com/v1/audio/transcriptions',
    form,
    {
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        ...form.getHeaders(),
      },
      proxy: PROXY,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    }
  );

  const words = data.words;
  fs.writeFileSync(CAPTIONS_OUTPUT, JSON.stringify(words, null, 2));
  console.log(`✅ [4/4] Captions saved → captions.json (${words.length} words)`);
}

// ==========================================
// RUN PIPELINE
// ==========================================
async function run() {
  const publicDir = path.join(__dirname, '../public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);

  console.log('🚀 Starting build pipeline...\n');

  await extractAudio();
  const voiceId = await cloneVoice();
  await generateTTS(voiceId);
  await generateCaptions();

  console.log('\n🎉 Pipeline complete! Assets ready in /public:');
  console.log('   • temp_sample.mp3  (extracted audio)');
  console.log('   • voiceover.mp3    (cloned TTS)');
  console.log('   • captions.json    (word timestamps)');
}

run().catch((err) => {
  console.error('\n🚨 Pipeline failed:', err.response?.data || err.message);
  process.exit(1);
});
