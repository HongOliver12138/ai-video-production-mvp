/**
 * api.ts — Express API for video decomposition pipeline
 *
 * POST /api/decompose
 *   - Accepts multipart video upload (field: "video")
 *   - Runs full pipeline: decompose → judgment → recommendation → brief → tasks → package → renderSpec
 *   - Returns merged JSON result
 *
 * Supports two modes:
 *   - GEMINI_URL set → uses proxy provider (Authorization: Bearer, raw fetch)
 *   - GEMINI_URL not set → uses Google SDK directly (x-goog-api-key)
 */

import express from 'express'
import multer from 'multer'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

// Import decomposition engine modules
import { decomposeReferenceVideo } from '../../视频拆解/video-decomposition-engine/src/pipeline/decompose.js'
import { GeminiExperimentalProvider } from '../../视频拆解/video-decomposition-engine/src/provider/gemini-experimental.js'
import { judgeDecomposition } from '../../视频拆解/video-decomposition-engine/src/judgment/classify.js'
import { buildRecommendation } from '../../视频拆解/video-decomposition-engine/src/recommendation/build.js'
import { buildProductionBrief } from '../../视频拆解/video-decomposition-engine/src/brief/build.js'
import { buildCaptureTasks } from '../../视频拆解/video-decomposition-engine/src/tasks/build.js'
import { buildProductionPackage } from '../../视频拆解/video-decomposition-engine/src/package/build.js'
import { buildRenderSpec } from '../../视频拆解/video-decomposition-engine/src/render-spec/build.js'
import type { DecompositionProvider } from '../../视频拆解/video-decomposition-engine/src/provider/types.js'

// Proxy-compatible provider (uses fetch + Bearer auth)
import { GeminiProxyProvider } from './gemini-proxy-provider.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TMP_DIR = path.join(__dirname, 'tmp')

fs.mkdirSync(TMP_DIR, { recursive: true })

const upload = multer({
  dest: TMP_DIR,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true)
    } else {
      cb(new Error('Only video files are accepted'))
    }
  },
})

export const app = express()
app.use(cors({ origin: true }))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    geminiKey: !!process.env.GEMINI_API_KEY,
    proxyMode: !!process.env.GEMINI_URL,
  })
})

function createProvider(apiKey: string, videoPath: string): DecompositionProvider {
  const geminiUrl = process.env.GEMINI_URL
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-pro'

  if (geminiUrl) {
    // Proxy mode: use raw fetch with Authorization: Bearer
    console.log(`🔀 Using proxy provider: ${geminiUrl}`)
    return new GeminiProxyProvider({
      apiKey,
      baseUrl: geminiUrl,
      apiVersion: process.env.GEMINI_API_VERSION || 'v1',
      model,
      videoPath,
      verbose: true,
    })
  } else {
    // Direct mode: use Google SDK
    console.log('🔗 Using direct Google SDK')
    return new GeminiExperimentalProvider({
      apiKey,
      model,
      video: { mode: 'local_file', path: videoPath },
      verbose: true,
    })
  }
}

app.post('/api/decompose', upload.single('video'), async (req, res) => {
  // Gemini can take 30-120s — extend timeout
  req.setTimeout(300000)
  res.setTimeout(300000)

  const file = req.file
  if (!file) {
    res.status(400).json({ error: 'No video file uploaded' })
    return
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    cleanup(file.path)
    res.status(500).json({ error: 'GEMINI_API_KEY not configured on server' })
    return
  }

  const ext = path.extname(file.originalname) || '.mp4'
  const videoPath = file.path + ext
  fs.renameSync(file.path, videoPath)

  console.log(`\n📥 Video received: ${file.originalname} (${(file.size / 1024 / 1024).toFixed(1)}MB)`)

  try {
    // Step 1: Decompose
    console.log('⏳ Step 1/3: Decomposing video...')
    const provider = createProvider(apiKey, videoPath)

    const decomposition = await decomposeReferenceVideo(
      {
        referenceVideoId: `upload_${Date.now()}`,
        source: { type: 'local_file', path: videoPath },
      },
      { provider },
    )
    console.log(`✅ Decomposition: ${decomposition.segments.length} segments`)

    // Step 2: Judgment → Recommendation → Brief → Tasks
    console.log('⏳ Step 2/3: Building production plan...')
    const judgment = judgeDecomposition(decomposition)
    const recommendation = buildRecommendation(judgment)
    const brief = buildProductionBrief(recommendation)
    const tasks = buildCaptureTasks(recommendation, brief)

    // Step 3: Package → Render Spec
    console.log('⏳ Step 3/3: Assembling package...')
    const pkg = buildProductionPackage(recommendation, brief, tasks)
    const renderSpec = buildRenderSpec(pkg)

    console.log('🎉 Full pipeline complete!')

    res.json({
      decomposition,
      judgment,
      recommendation,
      brief,
      package: pkg,
      renderSpec,
      meta: {
        filename: file.originalname,
        fileSize: file.size,
        processedAt: new Date().toISOString(),
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('❌ Pipeline failed:', message)
    res.status(500).json({ error: `Pipeline failed: ${message}` })
  } finally {
    cleanup(videoPath)
  }
})

function cleanup(filePath: string) {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  } catch { /* ignore */ }
}
