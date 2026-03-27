// Asset map: maps semantic assetRef keys from render spec to local staticFile paths.
// This is the glue between the spec's abstract references and actual files in public/.

export type AssetMap = Record<string, string>;

// Try to load asset map from public/asset_map.json (written by run-clone-mvp.ts).
// Fall back to the hardcoded Ditto demo map for backward compatibility.
let loadedAssetMap: AssetMap | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  loadedAssetMap = require("../../public/asset_map.json") as AssetMap;
} catch {
  // asset_map.json doesn't exist yet — fall back to default
}

// Default asset map for the Ditto demo.
const DITTO_DEFAULT_MAP: AssetMap = {
  hook_clip: "part1.MOV",
  hook_video: "part1.MOV",
  main_broll: "b_roll.MOV",
  talking_head: "part1.MOV",
  cta_clip: "part2.MOV",
  cta_video: "part2.MOV",
  voiceover: "voiceover.mp3",
  voiceover_audio: "voiceover.mp3",
  captions: "captions.json",
  captions_json: "captions.json",
  // Screenshots / UI walkthrough — placeholder for now
  screenshot_1: "screenshot_1.png",
  screenshot_2: "screenshot_2.png",
  screenshot_3: "screenshot_3.png",
  product_screenshots: "screenshot_1.png",
  brand_assets: "brand_logo.png",
  brand_copy: "brand_copy.txt",
};

export const DITTO_ASSET_MAP: AssetMap = loadedAssetMap
  ? { ...DITTO_DEFAULT_MAP, ...loadedAssetMap }
  : DITTO_DEFAULT_MAP;

export function resolveAsset(assetMap: AssetMap, ref: string): string | null {
  // First try the map, then treat the ref as a direct filename
  return assetMap[ref] ?? (ref.includes(".") ? ref : null);
}
