import { Composition } from "remotion";
import { TikTokAd } from "./TikTokAd";
import { RenderSpecVideo } from "./RenderSpecVideo";
import { dittoMockSpec } from "./mockSpec";
import { computeTotalFrames } from "./renderSpec/load";
import { DITTO_ASSET_MAP } from "./renderSpec/assetMap";
import type { RenderSpec } from "./renderSpec/types";
import type { AssetMap } from "./renderSpec/assetMap";

// Try to load clone spec — may not exist yet
let cloneSpec: RenderSpec | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  cloneSpec = require("../../my-video/public/clone_spec.json") as RenderSpec;
} catch {
  // clone_spec.json doesn't exist yet — that's fine
}

// Try to load asset map — may not exist yet
let cloneAssetMap: AssetMap | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  cloneAssetMap = require("../../my-video/public/asset_map.json") as AssetMap;
} catch {
  // asset_map.json doesn't exist yet — use default
}

const mockDuration = computeTotalFrames(dittoMockSpec);
const cloneDuration = cloneSpec ? computeTotalFrames(cloneSpec) : 0;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Original hardcoded composition */}
      <Composition
        id="TikTokAd"
        component={TikTokAd}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* Mock spec-driven composition */}
      <Composition
        id="RenderSpecVideo"
        component={RenderSpecVideo}
        durationInFrames={mockDuration}
        fps={dittoMockSpec.fps}
        width={dittoMockSpec.width}
        height={dittoMockSpec.height}
      />

      {/* Clone MVP composition — uses clone_spec.json + asset_map.json from pipeline */}
      {cloneSpec && (
        <Composition
          id="CloneMVP"
          component={RenderSpecVideo}
          defaultProps={{
            renderSpec: cloneSpec,
            assetMap: cloneAssetMap
              ? { ...DITTO_ASSET_MAP, ...cloneAssetMap }
              : DITTO_ASSET_MAP,
          }}
          durationInFrames={cloneDuration}
          fps={cloneSpec.fps}
          width={cloneSpec.width}
          height={cloneSpec.height}
        />
      )}
    </>
  );
};
