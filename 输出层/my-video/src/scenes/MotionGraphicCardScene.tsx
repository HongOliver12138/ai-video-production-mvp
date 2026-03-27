import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { RenderScene } from "../renderSpec/types";
import type { AssetMap } from "../renderSpec/assetMap";
import { resolveAsset } from "../renderSpec/assetMap";
import { SceneSubtitle } from "./SceneSubtitle";

interface Props {
  scene: RenderScene;
  assetMap: AssetMap;
}

export const MotionGraphicCardScene: React.FC<Props> = ({ scene, assetMap }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = frame / (scene.durationSec * fps);

  // Try to resolve first asset as a screenshot/card image
  const imgRef = scene.assetRefs[0];
  const imgFile = imgRef ? resolveAsset(assetMap, imgRef) : null;

  // Only use <img> for real files that exist — skip placeholder screenshot refs
  const hasRealImage = imgFile && !imgFile.includes("screenshot");

  // Gentle zoom effect
  const scale = 1 + progress * 0.08;
  const opacity = Math.min(1, progress * 4);

  const displayText = scene.subtitleText || scene.voiceoverText || scene.label;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      {hasRealImage ? (
        <img
          src={staticFile(imgFile)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            transform: `scale(${scale})`,
          }}
        />
      ) : (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            padding: "80px",
          }}
        >
          <div
            style={{
              opacity,
              backgroundColor: "rgba(255,255,255,0.08)",
              borderRadius: 32,
              padding: "60px 48px",
              maxWidth: 900,
              textAlign: "center",
            }}
          >
            <span
              style={{
                fontSize: 56,
                fontWeight: 800,
                color: "white",
                fontFamily: "Arial, sans-serif",
                lineHeight: 1.3,
              }}
            >
              {displayText}
            </span>
          </div>
        </AbsoluteFill>
      )}
      <SceneSubtitle text={scene.subtitleText} />
    </AbsoluteFill>
  );
};
