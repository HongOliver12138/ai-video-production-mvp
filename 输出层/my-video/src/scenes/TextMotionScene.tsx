import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { RenderScene } from "../renderSpec/types";
import type { AssetMap } from "../renderSpec/assetMap";
import { SceneSubtitle } from "./SceneSubtitle";

interface Props {
  scene: RenderScene;
  assetMap: AssetMap;
}

export const TextMotionScene: React.FC<Props> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = frame / (scene.durationSec * fps);

  // Simple scale-in animation
  const scale = Math.min(1, 0.5 + progress * 1.5);
  const opacity = Math.min(1, progress * 3);

  const displayText = scene.subtitleText || scene.voiceoverText || scene.label;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#111",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          opacity,
          textAlign: "center",
          padding: "0 60px",
        }}
      >
        <span
          style={{
            fontSize: 72,
            fontWeight: 900,
            fontFamily: "Arial Black, Impact, sans-serif",
            color: "white",
            textTransform: "uppercase",
            lineHeight: 1.2,
            textShadow: `
              -3px -3px 0 #000,
               3px -3px 0 #000,
              -3px  3px 0 #000,
               3px  3px 0 #000
            `,
          }}
        >
          {displayText}
        </span>
      </div>
      <SceneSubtitle text={scene.subtitleText} />
    </AbsoluteFill>
  );
};
