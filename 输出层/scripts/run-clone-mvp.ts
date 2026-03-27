/**
 * run-clone-mvp.ts  — Package-Driven Clone MVP
 *
 * 纯 package.json 驱动的端到端视频复刻脚本。
 * 不包含任何 hardcode 内容。
 *
 * 用法:
 *   npx tsx scripts/run-clone-mvp.ts <jobId>
 *   npx tsx scripts/run-clone-mvp.ts ditto-demo
 *
 * 环境变量:
 *   MVP_SHARED_DIR  — 共享目录路径 (默认 ../shared)
 *
 * 流程:
 *   1. 读取 {jobId}.package.json + {jobId}.status.json
 *   2. 聚合 TTS 文本
 *   3. 运行音频流水线 (voice clone + TTS + Whisper)
 *   4. 匹配 segment 文本到词级时间戳
 *   5. 适配 → Remotion spec，用真实 duration 覆盖 heuristic
 *   6. 写入 clone_spec.json + asset_map.json → 触发 Remotion 渲染
 *   7. 更新 status.json
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import {
  adaptToRemotionSpec,
  buildAssetMap,
  aggregateTtsText,
  type PackageJSON,
  type RemotionRenderSpec,
} from './adapter.js'

// ============================================================
// Path resolution
// ============================================================

const ROOT = path.resolve(import.meta.dirname ?? __dirname, '..')
const PUBLIC_DIR = path.join(ROOT, 'public')
const REMOTION_DIR = path.join(ROOT, 'my-video')
const REMOTION_PUBLIC = path.join(REMOTION_DIR, 'public')
const CAPTIONS_PATH = path.join(PUBLIC_DIR, 'captions.json')

function resolveSharedDir(): string {
  if (process.env.MVP_SHARED_DIR) return path.resolve(process.env.MVP_SHARED_DIR)
  return path.resolve(ROOT, '..', 'shared')
}

// ============================================================
// Types
// ============================================================

interface WordTimestamp {
  word: string
  start: number
  end: number
}

interface Segment {
  id: string
  text: string
  role: string
}

interface TimedSegment extends Segment {
  startSec: number
  endSec: number
  durationSec: number
  matchedWords: WordTimestamp[]
}

// ============================================================
// Step 1: Load Job Files
// ============================================================

function loadJob(jobId: string): { pkg: PackageJSON; status: Record<string, unknown>; statusPath: string } {
  const sharedDir = resolveSharedDir()
  const jobsDir = path.join(sharedDir, 'jobs')

  const pkgPath = path.join(jobsDir, `${jobId}.package.json`)
  const statusPath = path.join(jobsDir, `${jobId}.status.json`)

  if (!fs.existsSync(pkgPath)) {
    console.error(`❌ Package file not found: ${pkgPath}`)
    process.exit(1)
  }
  if (!fs.existsSync(statusPath)) {
    console.error(`❌ Status file not found: ${statusPath}`)
    process.exit(1)
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as PackageJSON
  const status = JSON.parse(fs.readFileSync(statusPath, 'utf-8'))

  console.log(`  📦 Package loaded: ${pkg.referenceVideoId}`)
  console.log(`  📋 Status: ${status.status}`)
  console.log(`  🎬 Scenes: ${pkg.renderSpec.scenes.length}, Duration: ${pkg.renderSpec.totalDurationSec}s`)

  return { pkg, status, statusPath }
}

// ============================================================
// Step 2: Update Status
// ============================================================

function updateStatus(statusPath: string, updates: Record<string, unknown>): void {
  const status = JSON.parse(fs.readFileSync(statusPath, 'utf-8'))
  Object.assign(status, updates, { updatedAt: new Date().toISOString() })
  fs.writeFileSync(statusPath, JSON.stringify(status, null, 2))
}

// ============================================================
// Step 3: Run Audio Pipeline
// ============================================================

function runAudioPipeline(ttsText: string): void {
  console.log('\n⏳ [Step 3/7] 运行音频流水线...')

  const pipelineScript = path.join(ROOT, 'scripts', 'build-pipeline.js')

  if (!fs.existsSync(path.join(PUBLIC_DIR, 'voiceover.mp3')) || !fs.existsSync(CAPTIONS_PATH)) {
    console.log('  音频资产不存在，执行 build-pipeline.js...')
    try {
      execSync(`node "${pipelineScript}" "${ttsText.replace(/"/g, '\\"')}"`, {
        cwd: ROOT,
        stdio: 'inherit',
        timeout: 120_000,
      })
    } catch {
      console.error('  ❌ 音频流水线失败，尝试使用已有资产继续...')
    }
  } else {
    console.log('  ✅ voiceover.mp3 和 captions.json 已存在，跳过生成。')
  }

  // 同步到 Remotion public
  for (const file of ['voiceover.mp3', 'captions.json']) {
    const src = path.join(PUBLIC_DIR, file)
    const dst = path.join(REMOTION_PUBLIC, file)
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dst)
      console.log(`  📋 已同步 ${file} → my-video/public/`)
    }
  }
}

// ============================================================
// Step 4: Word-level timestamp matching (from legacy, battle-tested)
// ============================================================

function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
}

function matchSegmentsToCaptions(segments: Segment[], captions: WordTimestamp[]): TimedSegment[] {
  console.log('\n⏳ [Step 4/7] 匹配 segment 文本到词级时间戳...')

  let captionIdx = 0
  const results: TimedSegment[] = []

  for (const seg of segments) {
    const segWords = normalize(seg.text)
    const matchedWords: WordTimestamp[] = []
    let localIdx = captionIdx

    for (const sw of segWords) {
      let found = false
      for (let look = localIdx; look < Math.min(localIdx + 5, captions.length); look++) {
        const cw = captions[look].word.toLowerCase().replace(/[^a-z0-9']/g, '')
        if (cw === sw || cw.startsWith(sw) || sw.startsWith(cw)) {
          matchedWords.push(captions[look])
          localIdx = look + 1
          found = true
          break
        }
      }
      if (!found) continue
    }

    if (matchedWords.length === 0) {
      console.warn(`  ⚠️ ${seg.id} 未匹配到任何词，使用默认 3s`)
      results.push({
        ...seg,
        startSec: captionIdx > 0 ? captions[captionIdx - 1]?.end ?? 0 : 0,
        endSec: (captionIdx > 0 ? captions[captionIdx - 1]?.end ?? 0 : 0) + 3,
        durationSec: 3,
        matchedWords: [],
      })
      continue
    }

    const startSec = matchedWords[0].start
    const endSec = matchedWords[matchedWords.length - 1].end
    const durationSec = Math.round((endSec - startSec + 0.3) * 100) / 100

    captionIdx = localIdx

    console.log(
      `  ✅ ${seg.id} (${seg.role}): ${startSec.toFixed(2)}s → ${endSec.toFixed(2)}s = ${durationSec}s [${matchedWords.length}/${segWords.length} words matched]`,
    )

    results.push({ ...seg, startSec, endSec, durationSec, matchedWords })
  }

  return results
}

// ============================================================
// Step 5: Adapt to Remotion spec with real durations
// ============================================================

function buildFinalSpec(
  pkg: PackageJSON,
  timedSegments: TimedSegment[],
): RemotionRenderSpec {
  console.log('\n⏳ [Step 5/7] 构建 Remotion render spec...')

  // Build timing map: sceneId -> real duration
  const durationMap = new Map<string, number>()
  for (const ts of timedSegments) {
    durationMap.set(ts.id, ts.durationSec)
  }

  // Adapt to Remotion format
  const spec = adaptToRemotionSpec(pkg, {
    voiceoverFile: 'voiceover.mp3',
    captionsFile: 'captions.json',
  })

  // Override heuristic durations with real TTS durations
  for (const scene of spec.scenes) {
    const realDuration = durationMap.get(scene.sceneId)
    if (realDuration !== undefined) {
      scene.durationSec = realDuration
    }
  }

  const totalDuration = spec.scenes.reduce((sum, s) => sum + s.durationSec, 0)
  console.log(`  📐 总时长: ${totalDuration.toFixed(2)}s (${spec.scenes.length} scenes)`)

  return spec
}

// ============================================================
// Step 6: Write spec + asset map + trigger render
// ============================================================

function writeAndRender(spec: RemotionRenderSpec, assetMap: Record<string, string>): string {
  console.log('\n⏳ [Step 6/7] 写入文件并触发渲染...')

  fs.mkdirSync(path.join(REMOTION_DIR, 'out'), { recursive: true })

  // Write clone spec
  const specPath = path.join(REMOTION_PUBLIC, 'clone_spec.json')
  fs.writeFileSync(specPath, JSON.stringify(spec, null, 2))
  console.log(`  📝 Render spec → ${specPath}`)

  // Write asset map
  const assetMapPath = path.join(REMOTION_PUBLIC, 'asset_map.json')
  fs.writeFileSync(assetMapPath, JSON.stringify(assetMap, null, 2))
  console.log(`  📝 Asset map → ${assetMapPath}`)

  // Trigger Remotion render
  const videoOutput = path.join(REMOTION_DIR, 'out', 'clone_mvp.mp4')
  console.log('  🎬 开始 Remotion 渲染...')
  try {
    execSync(
      `npx remotion render CloneMVP "${videoOutput}" --browser-executable="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --concurrency=1`,
      { cwd: REMOTION_DIR, stdio: 'inherit', timeout: 600_000 },
    )
    console.log(`\n🎉 渲染完成！输出: ${videoOutput}`)
    return videoOutput
  } catch {
    console.error('\n❌ Remotion 渲染失败。手动运行:')
    console.error(`  cd "${REMOTION_DIR}" && npx remotion render CloneMVP out/clone_mvp.mp4`)
    return ''
  }
}

// ============================================================
// Main
// ============================================================

async function main(): Promise<void> {
  const jobId = process.argv[2]
  if (!jobId) {
    console.error('用法: npx tsx scripts/run-clone-mvp.ts <jobId>')
    console.error('示例: npx tsx scripts/run-clone-mvp.ts ditto-demo')
    process.exit(1)
  }

  console.log(`🚀 === Package-Driven Clone MVP ===\n`)

  // Step 1: Load job
  console.log('⏳ [Step 1/7] 读取 Job 文件...')
  const { pkg, statusPath } = loadJob(jobId)

  // Step 2: Aggregate TTS text
  console.log('\n⏳ [Step 2/7] 聚合 TTS 文本...')
  const ttsText = aggregateTtsText(pkg)
  if (!ttsText) {
    console.error('❌ 无 TTS 文本可用（所有 voiceoverText 都是 placeholder）')
    process.exit(1)
  }
  console.log(`  📝 TTS 文本 (${ttsText.length} chars): "${ttsText.slice(0, 80)}..."`)

  // Update status → rendering_preview
  updateStatus(statusPath, {
    status: 'rendering_preview',
    audio: { ttsText, voiceoverFile: null, captionsFile: null, pipelineComplete: false },
  })

  // Step 3: Audio pipeline
  runAudioPipeline(ttsText)

  // Update audio status
  updateStatus(statusPath, {
    audio: { ttsText, voiceoverFile: 'voiceover.mp3', captionsFile: 'captions.json', pipelineComplete: true },
  })

  // Step 4: Match segments to captions
  if (!fs.existsSync(CAPTIONS_PATH)) {
    console.error('❌ captions.json 不存在，无法继续。')
    process.exit(1)
  }
  const captions: WordTimestamp[] = JSON.parse(fs.readFileSync(CAPTIONS_PATH, 'utf-8'))
  console.log(`  📖 已加载 ${captions.length} 个词级时间戳`)

  // Build segment list from TTS scenes
  const ttsSegments: Segment[] = pkg.renderSpec.scenes
    .filter(s => s.voiceoverMode === 'tts' && s.voiceoverText && !s.voiceoverText.startsWith('['))
    .map(s => ({
      id: s.sceneId,
      text: s.voiceoverText,
      role: s.purpose,
    }))

  const timedSegments = matchSegmentsToCaptions(ttsSegments, captions)

  // Step 5: Build final spec
  const spec = buildFinalSpec(pkg, timedSegments)

  // Step 6: Write + render
  const assetMap = buildAssetMap(pkg)
  const outputFile = writeAndRender(spec, assetMap)

  // Step 7: Update status
  console.log('\n⏳ [Step 7/7] 更新 status.json...')
  updateStatus(statusPath, {
    status: outputFile ? 'ready_for_review' : 'rendering_preview',
    render: {
      outputFile: outputFile || null,
      remotionSpecFile: 'clone_spec.json',
    },
  })
  console.log('  ✅ Status 已更新。')
}

main().catch((err) => {
  console.error('🚨 总控脚本失败:', err)
  process.exit(1)
})
