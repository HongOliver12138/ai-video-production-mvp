import { useState, useCallback, useRef } from 'react'
import {
  segments as mockSegments,
  creatorTasks as mockTasks,
  summary as mockSummary,
  transformPipelineResult,
  type Segment,
  type CreatorTask,
  type Summary,
  type PipelineResult,
  type DirectorResult,
} from './data'
import './App.css'

function FlowConnector() {
  return (
    <div className="flow-connector">
      <div className="flow-arrow" />
    </div>
  )
}

// ── 1. Reference Video (with upload) ──
function ReferenceVideo({
  onFileSelected,
  onAnalyze,
  loading,
  error,
  videoFile,
  videoInfo,
  hasResult,
}: {
  onFileSelected: (file: File) => void
  onAnalyze: () => void
  loading: boolean
  error: string | null
  videoFile: File | null
  videoInfo: { title: string; archetype: string; duration: number; summary: string } | null
  hasResult: boolean
}) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const videoUrl = videoFile ? URL.createObjectURL(videoFile) : null

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file?.type.startsWith('video/')) onFileSelected(file)
    },
    [onFileSelected],
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) onFileSelected(file)
    },
    [onFileSelected],
  )

  const title = videoInfo?.title ?? (videoFile ? videoFile.name : 'Ditto — Campus Dating App Pitch')
  const archetype = videoInfo?.archetype ?? 'Talking-head product pitch'
  const duration = videoInfo?.duration ?? 28

  return (
    <div className="section">
      <div className="section-header">
        <div className="section-number">1</div>
        <div className="section-title">Reference Video</div>
      </div>

      {!videoFile ? (
        <div
          className={`upload-zone${dragOver ? ' upload-zone--active' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <div className="upload-icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="#EDE9FE"/>
              <path d="M24 14v12m0 0l-4-4m4 4l4-4M16 30v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="upload-text">Drop a video file here, or click to browse</div>
          <div className="upload-hint">MP4, MOV, WebM — up to 100MB</div>
        </div>
      ) : (
        <div className="card ref-video">
          <div className="ref-preview">
            {videoUrl && <video src={videoUrl} className="ref-video-player" controls muted />}
          </div>
          <div className="ref-info">
            <div className="ref-title">{title}</div>
            <div className="ref-meta">
              <span className="ref-meta-item"><strong>Type:</strong> {archetype}</span>
              <span className="ref-meta-item"><strong>Duration:</strong> {duration}s</span>
              <span className="ref-meta-item"><strong>Size:</strong> {(videoFile.size / 1024 / 1024).toFixed(1)}MB</span>
            </div>
            {videoInfo && <div className="ref-message">{videoInfo.summary}</div>}
            {hasResult && <div className="tag tag--success" style={{ marginTop: 8 }}>Analysis complete</div>}
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-bar">
          <div className="loading-spinner" />
          <div className="loading-text">Analyzing video with Gemini AI... This may take 60–120 seconds.</div>
        </div>
      )}

      {error && <div className="error-bar">Error: {error}</div>}

      {videoFile && !loading && !hasResult && (
        <button className="analyze-btn" onClick={onAnalyze}>
          Analyze with AI
        </button>
      )}
    </div>
  )
}

// ── 2. AI Decomposition ──
function AIDecomposition({ segments }: { segments: Segment[] }) {
  const [selected, setSelected] = useState<Segment | null>(null)

  return (
    <div className="section">
      <div className="section-header">
        <div className="section-number">2</div>
        <div className="section-title">AI Decomposition</div>
      </div>
      <div className="decomp-layout">
        <div className="segment-list">
          {segments.map((seg) => (
            <div
              key={seg.id}
              className={`segment-card segment-card--${seg.productionMode === 'ai_generated' ? 'ai' : 'creator'}${selected?.id === seg.id ? ' segment-card--selected' : ''}`}
              onClick={() => setSelected(selected?.id === seg.id ? null : seg)}
            >
              <div className="segment-index">{seg.id}</div>
              <div className="segment-body">
                <div className="segment-role">{seg.label}</div>
                <div className="segment-time">{seg.timeRange} &middot; {seg.durationSec}s</div>
                <div className="segment-script-preview">{seg.shortScript}</div>
              </div>
              <div className="segment-tags">
                <span className={`tag tag--${seg.productionMode === 'ai_generated' ? 'ai' : 'creator'}`}>
                  {seg.productionMode === 'ai_generated' ? 'AI' : 'Creator'}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="detail-panel">
          {selected ? (
            <>
              <div className="detail-role">{selected.role}</div>
              <div className="detail-time">{selected.timeRange} &middot; {selected.durationSec}s</div>
              <div className="detail-tags">
                <span className="tag tag--role">{selected.sceneType}</span>
                <span className={`tag tag--${selected.productionMode === 'ai_generated' ? 'ai' : 'creator'}`}>
                  {selected.productionMode === 'ai_generated' ? 'AI Generated' : 'Creator Required'}
                </span>
              </div>
              <div className="detail-section">
                <div className="detail-label">Full Script / Direction</div>
                <div className="detail-value">{selected.fullScript}</div>
              </div>
              <div className="detail-section">
                <div className="detail-label">Scene Type</div>
                <div className="detail-value">{selected.sceneType}</div>
              </div>
              <div className="detail-section">
                <div className="detail-label">Production Mode</div>
                <div className="detail-value">
                  {selected.productionMode === 'ai_generated'
                    ? 'Fully AI-generated — no creator involvement needed'
                    : 'Creator capture required — micro-task assigned'}
                </div>
              </div>
            </>
          ) : (
            <div className="detail-empty">Click a segment to view details</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── 3. Production Decision ──
function ProductionDecision({ segments, summary }: { segments: Segment[]; summary: Summary }) {
  return (
    <div className="section">
      <div className="section-header">
        <div className="section-number">3</div>
        <div className="section-title">Production Decision</div>
      </div>
      <div className="decision-summary">
        <div className="stat-card">
          <div className="stat-value stat-value--accent">{summary.totalSegments}</div>
          <div className="stat-label">Segments Decomposed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value stat-value--ai">{summary.aiGenerated}</div>
          <div className="stat-label">AI Generated</div>
        </div>
        <div className="stat-card">
          <div className="stat-value stat-value--creator">{summary.creatorRequired}</div>
          <div className="stat-label">Creator Required</div>
        </div>
        <div className="stat-card">
          <div className="stat-value stat-value--success">{summary.creatorCaptureSec}s</div>
          <div className="stat-label">Creator Capture</div>
        </div>
      </div>
      <div className="card">
        <div className="decision-bar">
          {segments.map((seg) => (
            <div
              key={seg.id}
              className={`decision-bar-chunk decision-bar-chunk--${seg.productionMode === 'ai_generated' ? 'ai' : 'creator'}`}
              style={{ flex: seg.durationSec }}
            >
              {seg.role}
            </div>
          ))}
        </div>
        <div className="decision-legend">
          <span>
            <span className="decision-legend-dot" style={{ background: 'var(--ai)' }} />
            AI Generated ({summary.aiGenerated} segments)
          </span>
          <span>
            <span className="decision-legend-dot" style={{ background: 'var(--creator)' }} />
            Creator Required ({summary.creatorRequired} segments, {summary.creatorCaptureSec}s)
          </span>
        </div>
      </div>
    </div>
  )
}

// ── 4. AI Director Layer ──
function AIDirectorLayer({ director, segments }: { director: DirectorResult | null; segments: Segment[] }) {
  if (!director || director.transitions.length === 0) {
    return null
  }

  const transitionIcons = {
    cut: '✂️',
    fade: '🌫️',
    dissolve: '✨',
    match_cut: '🎬'
  }

  return (
    <div className="section">
      <div className="section-header">
        <div className="section-number">3.5</div>
        <div className="section-title">AI Director — Transition Analysis</div>
      </div>
      <div className="card" style={{ padding: 24 }}>
        <div className="director-flow">
          <strong>Overall Flow:</strong> {director.overallFlow}
        </div>
        {director.recommendations.length > 0 && (
          <div className="director-recommendations">
            {director.recommendations.map((rec, i) => (
              <div key={i} className="director-rec">{rec}</div>
            ))}
          </div>
        )}
        <div className="transition-list">
          {director.transitions.map((t, i) => {
            const fromSeg = segments[i]
            const toSeg = segments[i + 1]
            return (
              <div key={i} className="transition-card">
                <div className="transition-header">
                  <span className="transition-icon">{transitionIcons[t.transitionType]}</span>
                  <span className="transition-type">{t.transitionType.replace('_', ' ').toUpperCase()}</span>
                  {t.durationMs > 0 && <span className="transition-duration">{t.durationMs}ms</span>}
                </div>
                <div className="transition-segments">
                  <span className="transition-from">{fromSeg?.role}</span>
                  <span className="transition-arrow">→</span>
                  <span className="transition-to">{toSeg?.role}</span>
                </div>
                <div className="transition-reasoning">{t.reasoning}</div>
                {t.continuityNotes.length > 0 && (
                  <div className="transition-notes">
                    {t.continuityNotes.map((note, j) => (
                      <div key={j} className="transition-note">• {note}</div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── 5. Creator Task Cards ──
function CreatorTaskCards({ tasks }: { tasks: CreatorTask[] }) {
  const [expanded, setExpanded] = useState<number | null>(null)

  if (tasks.length === 0) {
    return (
      <div className="section">
        <div className="section-header">
          <div className="section-number">4</div>
          <div className="section-title">Creator Task Cards</div>
        </div>
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
          No creator capture needed — all segments can be AI-generated.
        </div>
      </div>
    )
  }

  return (
    <div className="section">
      <div className="section-header">
        <div className="section-number">4</div>
        <div className="section-title">Creator Task Cards</div>
      </div>
      <div className="task-list">
        {tasks.map((task) => (
          <div key={task.id} className="task-card" onClick={() => setExpanded(expanded === task.id ? null : task.id)}>
            <div className="task-card-header">
              <div className="task-card-title">{task.title}</div>
              <div className="task-card-meta">
                <span className="task-card-meta-item"><strong>Segment:</strong> {task.segmentRole}</span>
                <span className="task-card-meta-item"><strong>Duration:</strong> {task.durationSec}s</span>
                <span className="task-card-meta-item"><strong>Framing:</strong> {task.framing}</span>
              </div>
            </div>
            <div className="task-card-body">
              <div className="task-card-action">{task.action}</div>
              <button className="task-card-expand">
                {expanded === task.id ? '▾ Hide details' : '▸ Show acceptance criteria'}
              </button>
              {expanded === task.id && (
                <div className="task-card-details">
                  <div className="detail-label">Acceptance Criteria</div>
                  <ul className="criteria-list">
                    {task.acceptanceCriteria.map((c, i) => (
                      <li key={i} className="criteria-item">
                        <span className="criteria-check">✓</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                  {task.retakeHints.length > 0 && (
                    <>
                      <div className="detail-label" style={{ marginTop: 12 }}>Retake Hints</div>
                      <ul className="criteria-list">
                        {task.retakeHints.map((h, i) => (
                          <li key={i} className="criteria-item">
                            <span style={{ color: 'var(--creator)' }}>↻</span>
                            {h}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 5. Final Output ──
function FinalOutput({ segments, summary }: { segments: Segment[]; summary: Summary }) {
  const [showTimeline, setShowTimeline] = useState(false)

  return (
    <div className="section">
      <div className="section-header">
        <div className="section-number">5</div>
        <div className="section-title">Final Output</div>
      </div>
      <div className="output-layout">
        <div className="card output-status">
          <div className="output-status-badge">
            <span className="output-status-dot" />
            {summary.status}
          </div>
          <div className="output-stats">
            <div className="output-stat">
              <div className="output-stat-value">{summary.totalDuration}s</div>
              <div className="output-stat-label">Total Duration</div>
            </div>
            <div className="output-stat">
              <div className="output-stat-value" style={{ color: 'var(--ai)' }}>{summary.aiGenerated}</div>
              <div className="output-stat-label">AI Scenes</div>
            </div>
            <div className="output-stat">
              <div className="output-stat-value" style={{ color: 'var(--creator)' }}>{summary.creatorRequired}</div>
              <div className="output-stat-label">Creator Scenes</div>
            </div>
          </div>
        </div>
        <div className="timeline-preview" onClick={() => setShowTimeline(!showTimeline)}>
          <div className="timeline-label">Timeline Preview</div>
          <div className="timeline-bar">
            {segments.map((seg) => (
              <div
                key={seg.id}
                className={`timeline-block timeline-block--${seg.productionMode === 'ai_generated' ? 'ai' : 'creator'}`}
                style={{ flex: seg.durationSec }}
              >
                {seg.durationSec}s
                <span className="timeline-block-role">{seg.role}</span>
              </div>
            ))}
          </div>
          <div className="timeline-time-axis">
            <span>0:00</span>
            <span>{Math.floor(summary.totalDuration / 4)}s</span>
            <span>{Math.floor(summary.totalDuration / 2)}s</span>
            <span>{Math.floor(summary.totalDuration * 3 / 4)}s</span>
            <span>{summary.totalDuration}s</span>
          </div>
          {showTimeline && (
            <div className="timeline-expanded">
              {segments.map((seg) => (
                <div key={seg.id} className="timeline-expanded-row">
                  <div className={`timeline-expanded-dot timeline-expanded-dot--${seg.productionMode === 'ai_generated' ? 'ai' : 'creator'}`} />
                  <div className="timeline-expanded-role">{seg.role}</div>
                  <div className="timeline-expanded-type">{seg.sceneType}</div>
                  <div>{seg.timeRange}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── App ──
function App() {
  const [result, setResult] = useState<PipelineResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)

  const transformed = result ? transformPipelineResult(result) : null
  const displaySegments = transformed?.segments ?? mockSegments
  const displayTasks = transformed?.creatorTasks ?? mockTasks
  const displaySummary = transformed?.summary ?? mockSummary
  const videoInfo = transformed?.videoInfo ?? null
  const director = result?.director ?? null

  const handleFileSelected = useCallback((file: File) => {
    setVideoFile(file)
    setResult(null)
    setError(null)
  }, [])

  const handleAnalyze = useCallback(async () => {
    if (!videoFile) return
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('video', videoFile)

      // Use direct backend URL to avoid Vite proxy timeout issues
      const apiBase = window.location.port === '5173' ? 'http://localhost:3001' : ''
      const response = await fetch(`${apiBase}/api/decompose`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(err.error || `HTTP ${response.status}`)
      }

      const data: PipelineResult = await response.json()
      setResult(data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [videoFile])

  return (
    <div className="page">
      <h1 className="page-title">Video Clone Pipeline</h1>
      <p className="page-subtitle">
        Upload a reference video → AI decomposes it → production decisions → creator micro-tasks → deliverable video
      </p>

      <ReferenceVideo
        onFileSelected={handleFileSelected}
        onAnalyze={handleAnalyze}
        loading={loading}
        error={error}
        videoFile={videoFile}
        videoInfo={videoInfo}
        hasResult={!!result}
      />
      <FlowConnector />
      <AIDecomposition segments={displaySegments} />
      <FlowConnector />
      <ProductionDecision segments={displaySegments} summary={displaySummary} />
      <FlowConnector />
      <AIDirectorLayer director={director} segments={displaySegments} />
      {director && <FlowConnector />}
      <CreatorTaskCards tasks={displayTasks} />
      <FlowConnector />
      <FinalOutput segments={displaySegments} summary={displaySummary} />
    </div>
  )
}

export default App
