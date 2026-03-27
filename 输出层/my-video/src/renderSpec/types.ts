// Render Spec types — mirrors the RenderSpecResult protocol from video-decomposition-engine.
// This project only READS the spec, never generates it.

export type VisualType =
  | "captured_video"
  | "text_motion"
  | "motion_graphic_card"
  | "ui_walkthrough"
  | "branded_end_card";

export type AudioStrategy = "use_original" | "tts" | "none";

export interface RenderScene {
  sceneId: string;
  segmentId?: string;    // trace back to decomposition segment
  label: string;
  role: string; // e.g. hook, problem, solution_reveal, how_it_works, benefit_claim, value_explanation, human_cta
  durationSec: number;
  visualType: VisualType;
  audioStrategy: AudioStrategy;
  assetRefs: string[]; // semantic keys, not file paths
  subtitleText?: string;
  voiceoverText?: string;
  structuralPurpose?: string;
  motionStyle?: string;
  visualTreatment?: "grayscale" | "none";
}

export interface RenderSpecAudio {
  voiceoverFile?: string;
  captionsFile?: string;
}

export interface RenderSpec {
  specVersion: string;
  videoId: string;
  title: string;
  fps: number;
  width: number;
  height: number;
  scenes: RenderScene[];
  audio: RenderSpecAudio;
}
