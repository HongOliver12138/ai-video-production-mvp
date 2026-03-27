import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { RenderScene } from "../renderSpec/types";
import type { AssetMap } from "../renderSpec/assetMap";
import { resolveAsset } from "../renderSpec/assetMap";
import { SceneSubtitle } from "./SceneSubtitle";

interface Props {
  scene: RenderScene;
  assetMap: AssetMap;
}

export const UIWalkthroughScene: React.FC<Props> = ({ scene, assetMap }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const totalFrames = scene.durationSec * fps;

  // Resolve all screenshot assets
  const screenshots = scene.assetRefs
    .map((ref) => resolveAsset(assetMap, ref))
    .filter((f): f is string => f !== null);

  const count = screenshots.length || 1;
  const framesPerShot = totalFrames / count;
  const currentIndex = Math.min(
    Math.floor(frame / framesPerShot),
    count - 1,
  );
  const currentFile = screenshots[currentIndex];

  // Gentle pan: shift X based on progress within current screenshot
  const localProgress = (frame - currentIndex * framesPerShot) / framesPerShot;
  const translateX = -10 + localProgress * 20;
  const scale = 1 + localProgress * 0.05;

  // Only use <img> if we have a real file — otherwise show text placeholder
  const hasImage = currentFile && !currentFile.includes("screenshot");

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {hasImage ? (
        <img
          src={staticFile(currentFile)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            transform: `translateX(${translateX}px) scale(${scale})`,
          }}
        />
      ) : (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          }}
        >
          <div
            style={{
              opacity: Math.min(1, (frame / fps) / 0.3),
              textAlign: "center",
              padding: "0 60px",
            }}
          >
            <span style={{ color: "#aaa", fontSize: 48, fontFamily: "Arial", lineHeight: 1.4 }}>
              {scene.subtitleText || scene.label}
            </span>
          </div>
        </AbsoluteFill>
      )}
      <SceneSubtitle text={scene.subtitleText} />
    </AbsoluteFill>
  );
};
