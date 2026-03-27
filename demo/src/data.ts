export interface Segment {
  id: number
  role: string
  label: string
  timeRange: string
  startSec: number
  endSec: number
  durationSec: number
  shortScript: string
  fullScript: string
  sceneType: string
  productionMode: 'ai_generated' | 'creator_required'
  creatorCaptureNeeded: boolean
}

export interface CreatorTask {
  id: number
  segmentId: number
  title: string
  segmentRole: string
  durationSec: number
  framing: string
  action: string
  deliveryMode: string
  acceptanceCriteria: string[]
  retakeHints: string[]
}

export const segments: Segment[] = [
  {
    id: 1,
    role: 'Hook',
    label: 'Hook — Attention Grab',
    timeRange: '0:00 – 0:04',
    startSec: 0,
    endSec: 4,
    durationSec: 4,
    shortScript: '"Okay real talk — I didn\'t think this could be this easy."',
    fullScript: 'Look directly into camera with a mix of surprise and excitement. Deliver the line with authentic energy — this is the moment that stops the scroll. The hook must feel unscripted even though it\'s precisely timed.',
    sceneType: 'Talking-head direct address',
    productionMode: 'creator_required',
    creatorCaptureNeeded: true,
  },
  {
    id: 2,
    role: 'Problem',
    label: 'Problem — Pain Point',
    timeRange: '0:04 – 0:09',
    startSec: 4,
    endSec: 9,
    durationSec: 5,
    shortScript: '"Finding the perfect date spot is a nightmare..."',
    fullScript: 'Finding the perfect date spot on campus is a nightmare. Between classes, clubs, and studying, who has time to plan something special? You end up at the same coffee shop every time.',
    sceneType: 'Text motion + AI voiceover',
    productionMode: 'ai_generated',
    creatorCaptureNeeded: false,
  },
  {
    id: 3,
    role: 'Solution Demo',
    label: 'Solution — Product Reveal',
    timeRange: '0:09 – 0:15',
    startSec: 9,
    endSec: 15,
    durationSec: 6,
    shortScript: '"Ditto is insane — one search and it plans everything."',
    fullScript: 'Ditto is insane. One search, and it finds the best date ideas near you, perfectly matched to your vibe. No more guessing, no more boring repeats.',
    sceneType: 'Motion graphic card + AI voiceover',
    productionMode: 'ai_generated',
    creatorCaptureNeeded: false,
  },
  {
    id: 4,
    role: 'Proof',
    label: 'Trust — How It Works',
    timeRange: '0:15 – 0:22',
    startSec: 15,
    endSec: 22,
    durationSec: 7,
    shortScript: '"Just type in your browser, tell it what you want..."',
    fullScript: 'You just type it in your browser, tell Ditto what you\'re into, and boom — curated date plans, time slots, even reservation links. All in under 30 seconds. It literally does the thinking for you.',
    sceneType: 'UI walkthrough + AI voiceover',
    productionMode: 'ai_generated',
    creatorCaptureNeeded: false,
  },
  {
    id: 5,
    role: 'CTA',
    label: 'CTA — Call to Action',
    timeRange: '0:22 – 0:28',
    startSec: 22,
    endSec: 28,
    durationSec: 6,
    shortScript: '"Try it yourself — link in bio!"',
    fullScript: 'Look at the camera with a warm smile. Deliver a short, punchy CTA with friendly energy. Point down toward the link. Keep it natural — not salesy.',
    sceneType: 'Talking-head direct address',
    productionMode: 'creator_required',
    creatorCaptureNeeded: true,
  },
]

export const creatorTasks: CreatorTask[] = [
  {
    id: 1,
    segmentId: 1,
    title: 'Record Hook Line',
    segmentRole: 'Hook',
    durationSec: 3,
    framing: 'Mid close-up, front-facing, stable camera',
    action: 'Look at camera with excited expression and say: "Okay real talk — I didn\'t think this could be this easy."',
    deliveryMode: 'Spoken line',
    acceptanceCriteria: [
      'Face clearly visible and well-lit',
      'No major camera shake',
      'Script delivered in one take',
      'Expression reads as authentic surprise',
      'Quiet environment, no background noise',
    ],
    retakeHints: [
      'If energy feels flat, try standing up',
      'Emphasize "real talk" with a slight head tilt',
    ],
  },
  {
    id: 2,
    segmentId: 5,
    title: 'Record CTA Close',
    segmentRole: 'CTA',
    durationSec: 3,
    framing: 'Mid close-up, front-facing, friendly expression',
    action: 'Smile at camera, point down, and say: "Try it yourself — link in bio!"',
    deliveryMode: 'Spoken line + gesture',
    acceptanceCriteria: [
      'Face clearly visible',
      'Spoken line clearly audible',
      'Completed within 3 seconds',
      'Natural smile, not forced',
      'Pointing gesture visible in frame',
    ],
    retakeHints: [
      'Smile more naturally — think of telling a friend',
      'Keep the line shorter if over duration',
    ],
  },
]

export const summary = {
  totalDuration: 28,
  totalSegments: 5,
  aiGenerated: 3,
  creatorRequired: 2,
  creatorCaptureSec: 6,
  status: 'Ready for Review' as const,
}

// ============================================================
// Pipeline result transform (real API → frontend display)
// ============================================================

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface Summary {
  totalDuration: number
  totalSegments: number
  aiGenerated: number
  creatorRequired: number
  creatorCaptureSec: number
  status: string
}

export interface PipelineResult {
  decomposition: any
  judgment: any
  recommendation: any
  brief: any
  package: any
  renderSpec: any
  meta: { filename: string; fileSize: number; processedAt: string }
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const MODALITY_LABELS: Record<string, string> = {
  talking_head: 'Talking-head direct address',
  voiceover: 'AI voiceover narration',
  on_screen_text: 'Text motion overlay',
  product_demo: 'Product demonstration',
  lifestyle_visual: 'Lifestyle b-roll',
  reaction: 'Reaction shot',
  before_after: 'Before/after comparison',
  broll: 'B-roll footage',
}

function capitalize(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function transformPipelineResult(result: PipelineResult): {
  segments: Segment[]
  creatorTasks: CreatorTask[]
  summary: Summary
  videoInfo: { title: string; archetype: string; duration: number; summary: string }
} {
  const { decomposition, judgment, recommendation, renderSpec } = result
  const pkg = result.package

  // Build judgment map: segmentId → productionClass
  const judgmentMap = new Map<string, string>()
  for (const sj of judgment.segmentJudgments) {
    judgmentMap.set(sj.segmentId, sj.productionClass)
  }

  // Build recommendation map: segmentId → recommendedOwner
  const ownerMap = new Map<string, string>()
  for (const sr of recommendation.segmentRecommendations) {
    ownerMap.set(sr.segmentId, sr.recommendedOwner)
  }

  // Build capture task segmentIds set
  const captureSegIds = new Set<string>()
  if (pkg.captureTasks?.taskCards) {
    for (const tc of pkg.captureTasks.taskCards) {
      captureSegIds.add(tc.segmentId)
    }
  }

  // Transform segments
  const segs: Segment[] = decomposition.segments.map((seg: any, i: number) => {
    const startSec = Math.round(seg.startMs / 1000)
    const endSec = Math.round(seg.endMs / 1000)
    const durationSec = endSec - startSec

    const prodClass = judgmentMap.get(seg.id) ?? 'hybrid_possible'
    const owner = ownerMap.get(seg.id) ?? 'system'
    const isCreator = prodClass === 'real_required' || owner === 'creator' || captureSegIds.has(seg.id)

    return {
      id: i + 1,
      role: capitalize(seg.narrativeRole),
      label: `${capitalize(seg.narrativeRole)} — ${seg.label}`,
      timeRange: `${formatTime(startSec)} – ${formatTime(endSec)}`,
      startSec,
      endSec,
      durationSec,
      shortScript: seg.summary.length > 80 ? `"${seg.summary.slice(0, 77)}..."` : `"${seg.summary}"`,
      fullScript: seg.visualDescription || seg.summary,
      sceneType: MODALITY_LABELS[seg.primaryModality] ?? capitalize(seg.primaryModality),
      productionMode: isCreator ? 'creator_required' as const : 'ai_generated' as const,
      creatorCaptureNeeded: isCreator,
    }
  })

  // Transform creator tasks
  const tasks: CreatorTask[] = (pkg.captureTasks?.taskCards ?? []).map((tc: any, i: number) => {
    const segIdx = segs.findIndex(s => {
      const segId = decomposition.segments[s.id - 1]?.id
      return segId === tc.segmentId
    })

    return {
      id: i + 1,
      segmentId: segIdx >= 0 ? segs[segIdx].id : i + 1,
      title: `Record ${capitalize(tc.narrativeRole)} Clip`,
      segmentRole: capitalize(tc.narrativeRole),
      durationSec: tc.durationLimitSeconds,
      framing: tc.framingInstruction,
      action: tc.exactAction,
      deliveryMode: capitalize(tc.deliveryMode),
      acceptanceCriteria: tc.acceptanceCriteria ?? [],
      retakeHints: tc.retakeHints ?? [],
    }
  })

  // Summary
  const aiCount = segs.filter(s => s.productionMode === 'ai_generated').length
  const creatorCount = segs.filter(s => s.productionMode === 'creator_required').length
  const creatorCaptureSec = tasks.reduce((sum, t) => sum + t.durationSec, 0)

  const smry: Summary = {
    totalDuration: renderSpec.totalDurationSec ?? Math.round(decomposition.videoSummary.durationMs / 1000),
    totalSegments: segs.length,
    aiGenerated: aiCount,
    creatorRequired: creatorCount,
    creatorCaptureSec,
    status: 'Ready for Review',
  }

  return {
    segments: segs,
    creatorTasks: tasks,
    summary: smry,
    videoInfo: {
      title: decomposition.videoSummary.oneLineSummary ?? 'Uploaded Video',
      archetype: capitalize(decomposition.videoSummary.archetype ?? 'unknown'),
      duration: Math.round(decomposition.videoSummary.durationMs / 1000),
      summary: decomposition.videoSummary.oneLineSummary ?? '',
    },
  }
}
