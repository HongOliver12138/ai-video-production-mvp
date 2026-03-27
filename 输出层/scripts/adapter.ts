/**
 * adapter.ts
 *
 * 将拆解层 RenderSpec 格式转换为 Remotion RenderSpec 格式。
 * 两种格式的核心差异：
 *   - voiceoverMode (拆解) vs audioStrategy (Remotion)
 *   - assetRefs: {required, optional} (拆解) vs assetRefs: string[] (Remotion)
 *   - purpose (拆解) vs role (Remotion)
 */

// ---------------------------------------------------------------------------
// 拆解层类型（来自 package.json）
// ---------------------------------------------------------------------------

export interface DecompScene {
  sceneId: string
  segmentId: string
  purpose: string
  durationSec: number
  visualType: string
  assetRefs: { required: string[]; optional: string[] }
  voiceoverMode: 'none' | 'embedded_original' | 'tts' | 'external_audio'
  voiceoverText: string
  subtitleText: string
  layoutHint: string
  sceneNotes: string
}

export interface DecompRenderSpec {
  compositionPattern: string
  width: number
  height: number
  fps: number
  totalDurationSec: number
  renderSummary: string
  scenes: DecompScene[]
}

export interface PackageJSON {
  jobId: string
  referenceVideoId: string
  renderSpec: DecompRenderSpec
  assetMap: Record<string, string>
  [key: string]: unknown
}

// ---------------------------------------------------------------------------
// Remotion 类型（目标格式）
// ---------------------------------------------------------------------------

export interface RemotionScene {
  sceneId: string
  segmentId: string
  label: string
  role: string
  durationSec: number
  visualType: string
  audioStrategy: 'use_original' | 'tts' | 'none'
  assetRefs: string[]
  subtitleText?: string
  voiceoverText?: string
}

export interface RemotionRenderSpec {
  specVersion: string
  videoId: string
  title: string
  fps: number
  width: number
  height: number
  scenes: RemotionScene[]
  audio: {
    voiceoverFile?: string
    captionsFile?: string
  }
}

// ---------------------------------------------------------------------------
// 转换函数
// ---------------------------------------------------------------------------

function adaptVoiceoverMode(mode: string): 'use_original' | 'tts' | 'none' {
  switch (mode) {
    case 'embedded_original': return 'use_original'
    case 'tts': return 'tts'
    default: return 'none'
  }
}

function adaptScene(scene: DecompScene): RemotionScene {
  return {
    sceneId: scene.sceneId,
    segmentId: scene.segmentId,
    label: `${scene.sceneId}: ${scene.purpose}`,
    role: scene.purpose,
    durationSec: scene.durationSec,
    visualType: scene.visualType,
    audioStrategy: adaptVoiceoverMode(scene.voiceoverMode),
    assetRefs: [...scene.assetRefs.required, ...scene.assetRefs.optional],
    subtitleText: scene.subtitleText || undefined,
    voiceoverText: scene.voiceoverText || undefined,
  }
}

/**
 * 将 package.json 中的拆解层 RenderSpec 转换为 Remotion 可消费的格式。
 * 可选传入 audio 信息（来自 status.json 或 pipeline 输出）。
 */
export function adaptToRemotionSpec(
  pkg: PackageJSON,
  audio?: { voiceoverFile?: string; captionsFile?: string }
): RemotionRenderSpec {
  const rs = pkg.renderSpec
  return {
    specVersion: '1.0',
    videoId: pkg.referenceVideoId,
    title: `Clone — ${pkg.referenceVideoId}`,
    fps: rs.fps,
    width: rs.width,
    height: rs.height,
    scenes: rs.scenes.map(adaptScene),
    audio: {
      voiceoverFile: audio?.voiceoverFile ?? undefined,
      captionsFile: audio?.captionsFile ?? undefined,
    },
  }
}

/**
 * 从 package.json 提取 asset map（直接透传）。
 */
export function buildAssetMap(pkg: PackageJSON): Record<string, string> {
  return { ...pkg.assetMap }
}

/**
 * 从 package.json 聚合 TTS 文本。
 * 按 scene 顺序拼接所有 voiceoverMode === 'tts' 的 voiceoverText。
 */
export function aggregateTtsText(pkg: PackageJSON): string {
  return pkg.renderSpec.scenes
    .filter(s => s.voiceoverMode === 'tts')
    .map(s => s.voiceoverText)
    .filter(t => t && !t.startsWith('['))  // 跳过 placeholder
    .join(' ')
}
