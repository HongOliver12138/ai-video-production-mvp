/**
 * gemini-proxy-provider.ts
 *
 * 兼容中转服务的 Gemini provider。
 * 用原生 fetch + Authorization: Bearer header，不走 @google/generative-ai SDK。
 * API 格式完全兼容 Gemini generateContent REST API。
 */

import { existsSync, statSync, readFileSync } from 'node:fs'
import type { DecompositionProvider, VideoUnderstanding, RawSegment } from '../../视频拆解/video-decomposition-engine/src/provider/types.js'
import type { VideoArchetype, NarrativeRole, PrimaryModality } from '../../视频拆解/video-decomposition-engine/src/domain/types.js'
import { videoArchetypeSchema, narrativeRoleSchema, primaryModalitySchema } from '../../视频拆解/video-decomposition-engine/src/domain/schema.js'

const VALID_ARCHETYPES = videoArchetypeSchema.options
const VALID_ROLES = narrativeRoleSchema.options
const VALID_MODALITIES = primaryModalitySchema.options

export interface ProxyProviderConfig {
  apiKey: string
  baseUrl: string       // e.g. "https://new.wuxuai.com"
  apiVersion?: string   // e.g. "v1", default "v1beta"
  model?: string        // e.g. "gemini-3.1-pro-preview"
  videoPath: string     // local file path
  verbose?: boolean
}

export class GeminiProxyProvider implements DecompositionProvider {
  private apiKey: string
  private baseUrl: string
  private apiVersion: string
  private model: string
  private videoPath: string
  private verbose: boolean
  private cachedBase64: string | null = null

  constructor(config: ProxyProviderConfig) {
    if (!config.apiKey) throw new Error('apiKey is required')
    if (!config.baseUrl) throw new Error('baseUrl is required')
    if (!existsSync(config.videoPath)) throw new Error(`Video not found: ${config.videoPath}`)

    const stat = statSync(config.videoPath)
    if (stat.size > 100 * 1024 * 1024) throw new Error(`Video too large: ${(stat.size/1024/1024).toFixed(1)}MB (max 100MB)`)

    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl.replace(/\/+$/, '')
    this.model = config.model ?? 'gemini-3.1-pro-preview'
    this.videoPath = config.videoPath
    this.verbose = config.verbose ?? false

    this.log(`Initialized (model=${this.model}, baseUrl=${this.baseUrl})`)
  }

  async understand(_videoRef: string): Promise<VideoUnderstanding> {
    this.log('Stage 1 [understand]: starting...')
    const t0 = Date.now()

    const text = await this.callGenerateContent(UNDERSTAND_PROMPT)
    this.log(`Stage 1 [understand]: completed in ${Date.now() - t0}ms`)
    if (this.verbose) this.log(`Stage 1 raw:\n${text}`)

    const json = extractJson(text)
    const understanding = parseUnderstanding(json, this.log.bind(this))
    this.log(`Stage 1 result: archetype=${understanding.archetype}, durationMs=${understanding.durationMs}`)
    return understanding
  }

  async segment(_videoRef: string, understanding: VideoUnderstanding): Promise<RawSegment[]> {
    this.log('Stage 2 [segment]: starting...')
    const t0 = Date.now()

    const text = await this.callGenerateContent(buildSegmentPrompt(understanding))
    this.log(`Stage 2 [segment]: completed in ${Date.now() - t0}ms`)
    if (this.verbose) this.log(`Stage 2 raw:\n${text}`)

    const json = extractJson(text)
    const segments = parseSegments(json, understanding.durationMs, this.log.bind(this))
    this.log(`Stage 2 result: ${segments.length} segments`)
    return segments
  }

  private getVideoBase64(): string {
    if (!this.cachedBase64) {
      this.log(`Reading video as base64: ${this.videoPath}`)
      const t0 = Date.now()
      const buf = readFileSync(this.videoPath)
      this.cachedBase64 = buf.toString('base64')
      this.log(`File read: ${(buf.length / 1024 / 1024).toFixed(1)}MB in ${Date.now() - t0}ms`)
    }
    return this.cachedBase64
  }

  private async callGenerateContent(prompt: string): Promise<string> {
    // baseUrl already includes version path (e.g. https://proxy.com/v1)
    const url = `${this.baseUrl}/models/${this.model}:generateContent`
    this.log(`POST ${url}`)

    const body = {
      contents: [{
        parts: [
          { inline_data: { mime_type: 'video/mp4', data: this.getVideoBase64() } },
          { text: prompt },
        ],
      }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
      },
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Gemini API error ${res.status}: ${errText.slice(0, 500)}`)
    }

    const data = await res.json() as any
    // Gemini REST API response: { candidates: [{ content: { parts: [{ text }] } }] }
    // Gemini 2.5+ may include "thought" parts — filter those out
    const parts = data?.candidates?.[0]?.content?.parts ?? []
    const textParts = parts.filter((p: any) => p.text && !p.thought)
    const text = textParts.map((p: any) => p.text).join('')
    if (!text) throw new Error(`Empty response from Gemini: ${JSON.stringify(data).slice(0, 300)}`)
    return text
  }

  private log(msg: string): void {
    console.error(`[gemini-proxy] ${msg}`)
  }
}

// ---------------------------------------------------------------------------
// Prompts (identical to gemini-experimental.ts)
// ---------------------------------------------------------------------------

const UNDERSTAND_PROMPT = `You are an expert video structure analyst specializing in content marketing and short-form video. Watch this video carefully and produce a detailed structural understanding.

Return a single JSON object with exactly these fields:
{
  "durationMs": <estimated total duration in milliseconds>,
  "language": "<primary spoken/text language, e.g. en, zh, es>",
  "productOrTopic": "<main product, brand, or topic featured>",
  "archetype": "<one of: ${VALID_ARCHETYPES.join(', ')}>",
  "oneLineSummary": "<one sentence capturing the video's persuasive strategy, not just topic>",
  "styleTags": ["<tag1>", "<tag2>", ...],
  "narrativeBeats": {
    "hook": "<how the video grabs attention in the first few seconds>",
    "setup": "<what context or framing is established before the core message>",
    "problem": "<what pain point, frustration, or gap is articulated>",
    "demo": "<what is shown or explained as the solution/product/method>",
    "proof": "<what evidence, results, or social proof is presented>",
    "payoff": "<what transformation, benefit, or outcome is promised>",
    "cta": "<what specific action the viewer is asked to take>"
  }
}

Rules:
- durationMs should be your best estimate of the video length in milliseconds
- archetype must be exactly one of the listed values
- oneLineSummary should describe the persuasive arc, not just the topic
- styleTags: 2-5 tags about visual style, editing approach, and tone
- narrativeBeats: fill in beats that are present. Omit or set to null beats that are genuinely absent
- Return ONLY the JSON object, no other text`

function buildSegmentPrompt(understanding: VideoUnderstanding): string {
  return `You are an expert video structure analyst. Decompose this video into semantic segments that reveal its persuasive and narrative structure.

Understanding context:
- Duration: ${understanding.durationMs}ms
- Archetype: ${understanding.archetype}
- Summary: ${understanding.oneLineSummary}
- Style: ${understanding.styleTags.join(', ')}

Return a JSON array of segment objects. Each segment:
{
  "startMs": <start time in ms>,
  "endMs": <end time in ms>,
  "label": "<specific structural label, 3-6 words>",
  "summary": "<2-3 sentences: what happens AND why it matters structurally>",
  "narrativeRole": "<one of: ${VALID_ROLES.join(', ')}>",
  "structuralPurpose": "<1 sentence: what this segment accomplishes>",
  "primaryModality": "<one of: ${VALID_MODALITIES.join(', ')}>",
  "visualDescription": "<2-3 sentences: specific visual details>",
  "audioDescription": "<what the viewer hears>",
  "textOverlaySummary": "<exact or near-exact on-screen text if any>",
  "keyObjects": ["<specific objects visible>", ...],
  "keyActions": ["<specific actions performed>", ...],
  "evidenceType": "<ONLY for proof/testimonial segments. One of: demonstration, social_proof, authority, testimonial, statistical, implied>"
}

Rules:
- Aim for 5-8 segments (narrative-level, not shot-level)
- Segments must be contiguous: first starts at 0, each starts where the previous ends
- Last segment must end at ${understanding.durationMs}
- narrativeRole must be exactly one of the listed values
- primaryModality must be exactly one of the listed values
- evidenceType is REQUIRED for proof and testimonial segments, OMIT for all other roles
- Return ONLY the JSON array, no other text`
}

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

type LogFn = (msg: string) => void

function extractJson(text: string): unknown {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const jsonStr = codeBlockMatch ? codeBlockMatch[1].trim() : text.trim()
  try { return JSON.parse(jsonStr) }
  catch { throw new Error(`Failed to parse JSON: ${jsonStr.slice(0, 300)}`) }
}

function clampEnum<T extends string>(value: string, valid: readonly T[], fallback: T, log: LogFn, field: string): T {
  if (valid.includes(value as T)) return value as T
  log(`WARN: "${value}" is not a valid ${field}, falling back to "${fallback}"`)
  return fallback
}

function parseUnderstanding(json: unknown, log: LogFn): VideoUnderstanding {
  const obj = json as Record<string, unknown>
  const beats = (obj.narrativeBeats ?? {}) as Record<string, unknown>
  return {
    durationMs: Number(obj.durationMs) || 30000,
    language: String(obj.language ?? 'en'),
    productOrTopic: String(obj.productOrTopic ?? ''),
    archetype: clampEnum(String(obj.archetype), VALID_ARCHETYPES, 'mixed', log, 'archetype') as VideoArchetype,
    oneLineSummary: String(obj.oneLineSummary ?? ''),
    styleTags: Array.isArray(obj.styleTags) ? obj.styleTags.map(String) : [],
    narrativeBeats: {
      hook: beats.hook ? String(beats.hook) : undefined,
      setup: beats.setup ? String(beats.setup) : undefined,
      problem: beats.problem ? String(beats.problem) : undefined,
      demo: beats.demo ? String(beats.demo) : undefined,
      proof: beats.proof ? String(beats.proof) : undefined,
      payoff: beats.payoff ? String(beats.payoff) : undefined,
      cta: beats.cta ? String(beats.cta) : undefined,
    },
  }
}

const VALID_EVIDENCE_TYPES = ['demonstration', 'social_proof', 'authority', 'testimonial', 'statistical', 'implied'] as const
type EvidenceType = typeof VALID_EVIDENCE_TYPES[number]

function parseEvidenceType(value: unknown, narrativeRole: unknown, log: LogFn): EvidenceType | undefined {
  const role = String(narrativeRole)
  const isProofRole = role === 'proof' || role === 'testimonial'
  if (!value) { return isProofRole ? 'implied' : undefined }
  if (!isProofRole) return undefined
  const str = String(value)
  if (VALID_EVIDENCE_TYPES.includes(str as EvidenceType)) return str as EvidenceType
  log(`WARN: "${str}" is not a valid evidenceType, falling back to "implied"`)
  return 'implied'
}

function parseSegments(json: unknown, totalDurationMs: number, log: LogFn): RawSegment[] {
  if (!Array.isArray(json)) throw new Error(`Expected array of segments, got: ${typeof json}`)

  const segments: RawSegment[] = json.map((item: Record<string, unknown>) => ({
    startMs: Number(item.startMs) || 0,
    endMs: Number(item.endMs) || 0,
    label: String(item.label ?? ''),
    summary: String(item.summary ?? ''),
    narrativeRole: clampEnum(String(item.narrativeRole), VALID_ROLES, 'transition', log, 'narrativeRole') as NarrativeRole,
    primaryModality: clampEnum(String(item.primaryModality), VALID_MODALITIES, 'broll', log, 'primaryModality') as PrimaryModality,
    visualDescription: String(item.visualDescription ?? ''),
    audioDescription: item.audioDescription ? String(item.audioDescription) : undefined,
    textOverlaySummary: item.textOverlaySummary ? String(item.textOverlaySummary) : undefined,
    keyObjects: Array.isArray(item.keyObjects) ? item.keyObjects.map(String) : undefined,
    keyActions: Array.isArray(item.keyActions) ? item.keyActions.map(String) : undefined,
    structuralPurpose: item.structuralPurpose ? String(item.structuralPurpose) : undefined,
    evidenceType: parseEvidenceType(item.evidenceType, item.narrativeRole, log),
  }))

  if (segments.length > 0) {
    segments.sort((a, b) => a.startMs - b.startMs)
    segments[0].startMs = 0
    for (let i = 1; i < segments.length; i++) {
      if (segments[i].startMs !== segments[i - 1].endMs) {
        segments[i].startMs = segments[i - 1].endMs
      }
    }
    if (segments[segments.length - 1].endMs !== totalDurationMs) {
      segments[segments.length - 1].endMs = totalDurationMs
    }
  }

  return segments
}
