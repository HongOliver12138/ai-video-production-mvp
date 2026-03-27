import "dotenv/config";
import { writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel
const API_URL = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

async function generateVoiceover(text) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey || apiKey === "your_api_key_here") {
    throw new Error("Set a valid ELEVENLABS_API_KEY in .env");
  }

  console.log("Generating voiceover…");

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_monolingual_v1",
      voice_settings: {
        similarity_boost: 0.7,
        stability: 0.4,
        style: 0.2,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ElevenLabs API error ${res.status}: ${err}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  const outPath = resolve(__dirname, "../public/voiceover.mp3");
  await writeFile(outPath, buffer);

  console.log(`Voiceover saved to ${outPath} (${buffer.length} bytes)`);
}

const hookText =
  "Wait, you're telling me you still use normal toothpaste?! " +
  "I literally swapped to these whitening strips for just one week, " +
  "and look at the difference! Grab it before it sells out!";

generateVoiceover(hookText).catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
