import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import type { RenderSpec } from "./renderSpec/types";
import type { AssetMap } from "./renderSpec/assetMap";
import { DITTO_ASSET_MAP, resolveAsset } from "./renderSpec/assetMap";
import { buildTimeline } from "./renderSpec/load";
import { SceneRenderer } from "./scenes/SceneRenderer";
import { dittoMockSpec } from "./mockSpec";

interface Props {
  renderSpec?: RenderSpec;
  assetMap?: AssetMap;
}

export const RenderSpecVideo: React.FC<Props> = ({
  renderSpec = dittoMockSpec,
  assetMap = DITTO_ASSET_MAP,
}) => {
  const timeline = buildTimeline(renderSpec);

  // Resolve global voiceover — try asset map first, then treat as direct filename
  const voiceoverRef = renderSpec.audio.voiceoverFile;
  const voiceoverFile = voiceoverRef
    ? resolveAsset(assetMap, voiceoverRef) ?? voiceoverRef
    : null;

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {/* Global voiceover track */}
      {voiceoverFile && <Audio src={staticFile(voiceoverFile)} />}

      {/* Scene timeline */}
      {timeline.map((entry) => {
        const scene = renderSpec.scenes.find(
          (s) => s.sceneId === entry.sceneId,
        );
        if (!scene) return null;

        return (
          <Sequence
            key={entry.sceneId}
            from={entry.from}
            durationInFrames={entry.durationInFrames}
            name={`${scene.sceneId}: ${scene.label}`}
          >
            <SceneRenderer scene={scene} assetMap={assetMap} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
