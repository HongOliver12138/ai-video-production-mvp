import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Video,
} from "remotion";

type WordEntry = { word: string; start: number; end: number };

// Import captions JSON directly — tsconfig has resolveJsonModule enabled
import captionsData from "../../public/captions.json";
const words: WordEntry[] = captionsData as WordEntry[];

const Subtitle: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  const currentWord = words.find(
    (w) => currentTime >= w.start && currentTime <= w.end,
  );

  if (!currentWord) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 350,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <span
        style={{
          fontSize: 90,
          fontWeight: 900,
          fontFamily: "Arial Black, Impact, sans-serif",
          color: "white",
          textTransform: "uppercase",
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
        {currentWord.word}
      </span>
    </div>
  );
};

export const TikTokAd: React.FC = () => {
  const FPS = 30;

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <Audio src={staticFile("voiceover.mp3")} />

      {/* 0-3s: Hook clip */}
      <Sequence from={0} durationInFrames={FPS * 3}>
        <Video
          src={staticFile("part1.MOV")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </Sequence>

      {/* 3s to end: B-roll */}
      <Sequence from={FPS * 3} durationInFrames={FPS * 12}>
        <Video
          src={staticFile("b_roll.MOV")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </Sequence>

      {/* Dynamic word-level captions */}
      <Subtitle />
    </AbsoluteFill>
  );
};
