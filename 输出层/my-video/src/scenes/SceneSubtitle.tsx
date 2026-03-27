import { useCurrentFrame, useVideoConfig } from "remotion";

interface Props {
  text?: string;
}

// Scene-level subtitle overlay.
// Displays the full subtitleText for the scene duration.
// For word-level captions, a future version will accept a captions array.
export const SceneSubtitle: React.FC<Props> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!text) return null;

  // Fade in over first 0.3s
  const opacity = Math.min(1, (frame / fps) / 0.3);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 300,
        left: 40,
        right: 40,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        opacity,
      }}
    >
      <span
        style={{
          fontSize: 64,
          fontWeight: 900,
          fontFamily: "Arial Black, Impact, sans-serif",
          color: "white",
          textTransform: "uppercase",
          textAlign: "center",
          lineHeight: 1.2,
          textShadow: `
            -4px -4px 0 #000,
             4px -4px 0 #000,
            -4px  4px 0 #000,
             4px  4px 0 #000,
             0px -4px 0 #000,
             0px  4px 0 #000,
            -4px  0px 0 #000,
             4px  0px 0 #000
          `,
          letterSpacing: 2,
        }}
      >
        {text}
      </span>
    </div>
  );
};
