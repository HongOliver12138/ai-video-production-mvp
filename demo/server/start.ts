/**
 * start.ts — Start the API server
 *
 * Usage: tsx --env-file=.env server/start.ts
 */

import 'dotenv/config'
import { app } from './api.js'

const PORT = Number(process.env.API_PORT) || 3001

app.listen(PORT, () => {
  console.log(`\n🚀 API server running at http://localhost:${PORT}`)
  console.log(`   GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ configured' : '❌ missing'}`)
  console.log(`   GEMINI_URL:     ${process.env.GEMINI_URL ?? '(default Google API)'}`)
  console.log(`   GEMINI_MODEL:   ${process.env.GEMINI_MODEL ?? 'gemini-3.1-pro-preview'}`)
  console.log(`   POST /api/decompose — upload a video to run full pipeline\n`)
})
