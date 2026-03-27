require("dotenv").config();
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");

async function getTimestamps() {
  const audioPath = path.join(__dirname, "..", "public", "voiceover.mp3");
  const outputPath = path.join(__dirname, "..", "public", "captions.json");

  if (!fs.existsSync(audioPath)) {
    console.error("Audio file not found:", audioPath);
    process.exit(1);
  }

  console.log("Reading audio file:", audioPath);
  console.log("Sending to Whisper API for word-level transcription...");

  const form = new FormData();
  form.append("file", fs.createReadStream(audioPath));
  form.append("model", "whisper-1");
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "word");

  const { data } = await axios.post(
    "https://api.openai.com/v1/audio/transcriptions",
    form,
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        ...form.getHeaders(),
      },
      proxy: {
        protocol: "http",
        host: "127.0.0.1",
        port: 7890,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    }
  );

  const words = data.words;
  console.log(`Received ${words.length} word timestamps.`);

  fs.writeFileSync(outputPath, JSON.stringify(words, null, 2));
  console.log("Captions written to:", outputPath);
}

getTimestamps().catch((err) => {
  console.error("Error:", err.response?.data || err.message);
  process.exit(1);
});
