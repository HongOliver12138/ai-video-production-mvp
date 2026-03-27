/**
 * director.ts — AI Director Layer
 *
 * Analyzes segment transitions and ensures natural flow between scenes.
 * Provides transition recommendations and continuity notes.
 */

interface Segment {
  id: string
  narrativeRole: string
  primaryModality: string
  summary: string
  startMs: number
  endMs: number
}

interface TransitionAnalysis {
  fromSegment: string
  toSegment: string
  transitionType: 'cut' | 'fade' | 'dissolve' | 'match_cut'
  durationMs: number
  reasoning: string
  continuityNotes: string[]
}

interface DirectorResult {
  transitions: TransitionAnalysis[]
  overallFlow: string
  recommendations: string[]
}

export async function analyzeTransitions(
  segments: Segment[],
  provider: any
): Promise<DirectorResult> {
  if (segments.length < 2) {
    return {
      transitions: [],
      overallFlow: 'Single segment - no transitions needed',
      recommendations: []
    }
  }

  const transitions: TransitionAnalysis[] = []

  for (let i = 0; i < segments.length - 1; i++) {
    const from = segments[i]
    const to = segments[i + 1]

    const transition = analyzeTransition(from, to)
    transitions.push(transition)
  }

  const recommendations = generateRecommendations(segments, transitions)
  const overallFlow = assessOverallFlow(transitions)

  return {
    transitions,
    overallFlow,
    recommendations
  }
}

function analyzeTransition(from: Segment, to: Segment): TransitionAnalysis {
  const fromModality = from.primaryModality
  const toModality = to.primaryModality

  // Determine transition type based on modality change
  let transitionType: TransitionAnalysis['transitionType'] = 'cut'
  let durationMs = 0
  let reasoning = ''
  const continuityNotes: string[] = []

  // Talking head to talking head - direct cut
  if (fromModality === 'talking_head' && toModality === 'talking_head') {
    transitionType = 'cut'
    durationMs = 0
    reasoning = 'Direct cut maintains energy between creator segments'
    continuityNotes.push('Ensure consistent lighting and framing')
    continuityNotes.push('Match audio levels between clips')
  }

  // Talking head to AI content - fade
  else if (fromModality === 'talking_head' && toModality !== 'talking_head') {
    transitionType = 'fade'
    durationMs = 300
    reasoning = 'Gentle fade transitions from human to AI-generated content'
    continuityNotes.push('Fade to black for 300ms before AI content')
  }

  // AI to talking head - dissolve
  else if (fromModality !== 'talking_head' && toModality === 'talking_head') {
    transitionType = 'dissolve'
    durationMs = 400
    reasoning = 'Dissolve brings viewer back to creator presence'
    continuityNotes.push('Dissolve over 400ms to re-establish human connection')
  }

  // AI to AI - cut or match cut
  else {
    if (from.narrativeRole === 'problem' && to.narrativeRole === 'solution') {
      transitionType = 'match_cut'
      durationMs = 200
      reasoning = 'Match cut emphasizes problem-solution contrast'
      continuityNotes.push('Use visual similarity for match cut effect')
    } else {
      transitionType = 'cut'
      durationMs = 0
      reasoning = 'Clean cut between AI-generated segments'
    }
  }

  return {
    fromSegment: from.id,
    toSegment: to.id,
    transitionType,
    durationMs,
    reasoning,
    continuityNotes
  }
}

function generateRecommendations(
  segments: Segment[],
  transitions: TransitionAnalysis[]
): string[] {
  const recs: string[] = []

  // Check for too many modality switches
  const modalitySwitches = transitions.filter((t, i) =>
    segments[i].primaryModality !== segments[i + 1].primaryModality
  ).length

  if (modalitySwitches > segments.length * 0.6) {
    recs.push('High modality switching detected - consider grouping similar content types')
  }

  // Check for talking head bookends
  const firstIsTalking = segments[0].primaryModality === 'talking_head'
  const lastIsTalking = segments[segments.length - 1].primaryModality === 'talking_head'

  if (firstIsTalking && lastIsTalking) {
    recs.push('✓ Strong bookend structure with creator presence at start and end')
  } else if (!firstIsTalking) {
    recs.push('Consider starting with creator talking head for immediate connection')
  } else if (!lastIsTalking) {
    recs.push('Consider ending with creator CTA for stronger close')
  }

  // Check pacing
  const avgDuration = segments.reduce((sum, s) => sum + (s.endMs - s.startMs), 0) / segments.length
  if (avgDuration < 3000) {
    recs.push('Fast pacing detected - ensure transitions are smooth to avoid jarring cuts')
  } else if (avgDuration > 8000) {
    recs.push('Slower pacing - use varied transitions to maintain visual interest')
  }

  return recs
}

function assessOverallFlow(transitions: TransitionAnalysis[]): string {
  const fadeCount = transitions.filter(t => t.transitionType === 'fade').length
  const cutCount = transitions.filter(t => t.transitionType === 'cut').length
  const dissolveCount = transitions.filter(t => t.transitionType === 'dissolve').length

  if (cutCount === transitions.length) {
    return 'Fast-paced, energetic flow with all direct cuts'
  } else if (fadeCount + dissolveCount > cutCount) {
    return 'Smooth, polished flow with emphasis on gentle transitions'
  } else {
    return 'Balanced flow mixing direct cuts with transitional effects'
  }
}
