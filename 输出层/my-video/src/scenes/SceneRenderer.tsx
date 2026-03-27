import type { RenderScene } from "../renderSpec/types";
import type { AssetMap } from "../renderSpec/assetMap";
import { CapturedVideoScene } from "./CapturedVideoScene";
import { TextMotionScene } from "./TextMotionScene";
import { MotionGraphicCardScene } from "./MotionGraphicCardScene";
import { UIWalkthroughScene } from "./UIWalkthroughScene";

interface Props {
  scene: RenderScene;
  assetMap: AssetMap;
}

// Dispatches to the correct scene component based on visualType.
export const SceneRenderer: React.FC<Props> = ({ scene, assetMap }) => {
  switch (scene.visualType) {
    case "captured_video":
      return <CapturedVideoScene scene={scene} assetMap={assetMap} />;
    case "text_motion":
      return <TextMotionScene scene={scene} assetMap={assetMap} />;
    case "motion_graphic_card":
      return <MotionGraphicCardScene scene={scene} assetMap={assetMap} />;
    case "ui_walkthrough":
      return <UIWalkthroughScene scene={scene} assetMap={assetMap} />;
    case "branded_end_card":
      // Reuse motion graphic card as a simple end card for now
      return <MotionGraphicCardScene scene={scene} assetMap={assetMap} />;
    default:
      // Fallback: black screen with subtitle
      return <TextMotionScene scene={scene} assetMap={assetMap} />;
  }
};
