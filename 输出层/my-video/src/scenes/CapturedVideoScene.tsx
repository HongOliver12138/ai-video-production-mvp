import React from "react";
import { AbsoluteFill, Video, staticFile } from "remotion";
import type { RenderScene } from "../renderSpec/types";
import type { AssetMap } from "../renderSpec/assetMap";
import { resolveAsset } from "../renderSpec/assetMap";
import { SceneSubtitle } from "./SceneSubtitle";

interface Props {
  scene: RenderScene;
  assetMap: AssetMap;
}

export const CapturedVideoScene: React.FC<Props> = ({ scene, assetMap }) => {
  const videoRef = scene.assetRefs[0];
  const file = videoRef ? resolveAsset(assetMap, videoRef) : null;

  const isGrayscale = scene.visualTreatment === "grayscale";

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {file && (
        <Video
          src={staticFile(file)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: isGrayscale ? "grayscale(100%) contrast(110%)" : "none",
          }}
        />
      )}
      <SceneSubtitle text={scene.subtitleText} />
    </AbsoluteFill>
  );
};
