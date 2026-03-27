import type { RenderSpec } from "./types";

// Load a render spec from a JSON object (already parsed).
// In Remotion, JSON can be imported directly or passed as inputProps.
export function loadRenderSpec(data: unknown): RenderSpec {
  const spec = data as RenderSpec;
  if (!spec.scenes || !Array.isArray(spec.scenes)) {
    throw new Error("Invalid render spec: missing scenes array");
  }
  if (!spec.fps) {
    throw new Error("Invalid render spec: missing fps");
  }
  return spec;
}

// Compute total duration in frames from a spec
export function computeTotalFrames(spec: RenderSpec): number {
  const totalSec = spec.scenes.reduce((sum, s) => sum + s.durationSec, 0);
  return Math.ceil(totalSec * spec.fps);
}

// Build a timeline: for each scene, compute { from, durationInFrames }
export interface SceneTimeline {
  sceneId: string;
  from: number;
  durationInFrames: number;
}

export function buildTimeline(spec: RenderSpec): SceneTimeline[] {
  let currentFrame = 0;
  return spec.scenes.map((scene) => {
    const durationInFrames = Math.round(scene.durationSec * spec.fps);
    const entry: SceneTimeline = {
      sceneId: scene.sceneId,
      from: currentFrame,
      durationInFrames,
    };
    currentFrame += durationInFrames;
    return entry;
  });
}
