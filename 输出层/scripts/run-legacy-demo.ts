/**
 * run-clone-mvp.ts
 *
 * 端到端 1:1 视频复刻 MVP 总控脚本
 *
 * 流程：
 *   Step 1: 读取 mock decomposition segments
 *   Step 2: 调用音频流水线（build-pipeline.js）
 *   Step 3: 读取 captions.json，按 segment 文本匹配词级时间戳，算出真实 durationSec
 *   Step 4: 组装 render-spec.json
 *   Step 5: 写入文件 + 触发 Remotion 渲染
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

// ============================================================
// 路径常量
// ============================================================
const ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const REMOTION_DIR = path.join(ROOT, "my-video");
const REMOTION_PUBLIC = path.join(REMOTION_DIR, "public");
const CAPTIONS_PATH = path.join(PUBLIC_DIR, "captions.json");
const SPEC_OUTPUT = path.join(REMOTION_PUBLIC, "clone_spec.json");
const VIDEO_OUTPUT = path.join(REMOTION_DIR, "out", "clone_mvp.mp4");

// ============================================================
// Types
// ============================================================
interface Segment {
  id: string;
  text: string;
  role: string;
}

interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

interface TimedSegment extends Segment {
  startSec: number;
  endSec: number;
  durationSec: number;
  matchedWords: WordTimestamp[];
}

interface RenderScene {
  sceneId: string;
  label: string;
  role: string;
  durationSec: number;
  visualType: string;
  audioStrategy: string;
  assetRefs: string[];
  subtitleText: string;
}

interface RenderSpec {
  specVersion: string;
  videoId: string;
  title: string;
  fps: number;
  width: number;
  height: number;
  scenes: RenderScene[];
  audio: {
    voiceoverFile: string;
    captionsFile: string;
  };
}

// ============================================================
// Step 1: Mock Decomposition Segments
// ============================================================
// 这些 segment 对应 build-pipeline.js 中的 TTS 文本，按句子拆分
const MOCK_SEGMENTS: Segment[] = [
  {
    id: "seg_1",
    text: "Okay, real talk. I didn't think campus dating could be this easy.",
    role: "hook",
  },
  {
    id: "seg_2",
    text: "Ditto is insane!",
    role: "solution_reveal",
  },
  {
    id: "seg_3",
    text: "You just type it in your browser, and it plans the whole date for you!",
    role: "how_it_works",
  },
];

// 每个 segment 对应的视频素材（hardcode 占位）
const SEGMENT_ASSET_MAP: Record<string, string> = {
  seg_1: "part1.MOV",
  seg_2: "b_roll.MOV",
  seg_3: "part2.MOV",
};

// ============================================================
// Step 2: 运行音频流水线
// ============================================================
function runAudioPipeline(): void {
  console.log("\n⏳ [Step 2/5] 运行音频流水线 (build-pipeline.js)...");

  const pipelineScript = path.join(ROOT, "scripts", "build-pipeline.js");

  if (!fs.existsSync(path.join(PUBLIC_DIR, "voiceover.mp3")) || !fs.existsSync(CAPTIONS_PATH)) {
    console.log("  音频资产不存在，执行 build-pipeline.js...");
    try {
      execSync(`node "${pipelineScript}"`, {
        cwd: ROOT,
        stdio: "inherit",
        timeout: 120_000,
      });
    } catch (e) {
      console.error("  ❌ 音频流水线失败，尝试使用已有资产继续...");
    }
  } else {
    console.log("  ✅ voiceover.mp3 和 captions.json 已存在，跳过生成。");
  }

  // 同步到 Remotion public
  for (const file of ["voiceover.mp3", "captions.json"]) {
    const src = path.join(PUBLIC_DIR, file);
    const dst = path.join(REMOTION_PUBLIC, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dst);
      console.log(`  📋 已同步 ${file} → my-video/public/`);
    }
  }
}

// ============================================================
// Step 3: 词级时间戳匹配算法
// ============================================================
function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

function matchSegmentsToCaptions(
  segments: Segment[],
  captions: WordTimestamp[],
): TimedSegment[] {
  console.log("\n⏳ [Step 3/5] 匹配 segment 文本到词级时间戳...");

  let captionIdx = 0;
  const results: TimedSegment[] = [];

  for (const seg of segments) {
    const segWords = normalize(seg.text);
    const matchedWords: WordTimestamp[] = [];
    let localIdx = captionIdx;

    // 贪心前向匹配：在 captions 中找到与 segment 词序列对应的连续词
    for (const sw of segWords) {
      // 从当前位置向前搜索，允许小范围跳跃（Whisper 可能漏词或变形）
      let found = false;
      for (let look = localIdx; look < Math.min(localIdx + 5, captions.length); look++) {
        const cw = captions[look].word.toLowerCase().replace(/[^a-z0-9']/g, "");
        if (cw === sw || cw.startsWith(sw) || sw.startsWith(cw)) {
          matchedWords.push(captions[look]);
          localIdx = look + 1;
          found = true;
          break;
        }
      }
      if (!found) {
        // 跳过这个词，继续匹配下一个
        continue;
      }
    }

    if (matchedWords.length === 0) {
      // Fallback：如果完全没匹配到，给一个默认时长
      console.warn(`  ⚠️ seg ${seg.id} 未匹配到任何词，使用默认 3s`);
      results.push({
        ...seg,
        startSec: captionIdx > 0 ? captions[captionIdx - 1]?.end ?? 0 : 0,
        endSec: (captionIdx > 0 ? captions[captionIdx - 1]?.end ?? 0 : 0) + 3,
        durationSec: 3,
        matchedWords: [],
      });
      continue;
    }

    const startSec = matchedWords[0].start;
    const endSec = matchedWords[matchedWords.length - 1].end;
    // 加 0.3s 尾部缓冲，让句子结尾不会被截断
    const durationSec = Math.round((endSec - startSec + 0.3) * 100) / 100;

    captionIdx = localIdx;

    console.log(
      `  ✅ ${seg.id} (${seg.role}): ${startSec.toFixed(2)}s → ${endSec.toFixed(2)}s = ${durationSec}s [${matchedWords.length}/${segWords.length} words matched]`,
    );

    results.push({
      ...seg,
      startSec,
      endSec,
      durationSec,
      matchedWords,
    });
  }

  return results;
}

// ============================================================
// Step 4: 组装 Render Spec
// ============================================================
function assembleRenderSpec(timedSegments: TimedSegment[]): RenderSpec {
  console.log("\n⏳ [Step 4/5] 组装 render-spec.json...");

  const scenes: RenderScene[] = timedSegments.map((seg, i) => ({
    sceneId: `scene_${i + 1}`,
    label: `${seg.role} — ${seg.text.slice(0, 40)}...`,
    role: seg.role,
    durationSec: seg.durationSec,
    visualType: "captured_video",
    audioStrategy: "tts",
    assetRefs: [SEGMENT_ASSET_MAP[seg.id] ?? "part1.MOV"],
    subtitleText: seg.text,
  }));

  const totalDuration = scenes.reduce((sum, s) => sum + s.durationSec, 0);
  console.log(`  📐 总时长: ${totalDuration.toFixed(2)}s (${scenes.length} scenes)`);

  return {
    specVersion: "1.0",
    videoId: "ditto-clone-mvp",
    title: "Ditto Campus Dating — Clone MVP",
    fps: 30,
    width: 1080,
    height: 1920,
    scenes,
    audio: {
      voiceoverFile: "voiceover.mp3",
      captionsFile: "captions.json",
    },
  };
}

// ============================================================
// Step 5: 写入文件 + 触发渲染
// ============================================================
function writeSpecAndRender(spec: RenderSpec): void {
  console.log("\n⏳ [Step 5/5] 写入 spec 并触发 Remotion 渲染...");

  // 确保输出目录存在
  fs.mkdirSync(path.join(REMOTION_DIR, "out"), { recursive: true });

  // 写入 spec
  fs.writeFileSync(SPEC_OUTPUT, JSON.stringify(spec, null, 2));
  console.log(`  📝 Render spec 已写入: ${SPEC_OUTPUT}`);

  // 触发渲染
  console.log(`  🎬 开始 Remotion 渲染...`);
  try {
    execSync(
      `npx remotion render CloneMVP "${VIDEO_OUTPUT}" --browser-executable="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --concurrency=1`,
      {
        cwd: REMOTION_DIR,
        stdio: "inherit",
        timeout: 600_000,
      },
    );
    console.log(`\n🎉 渲染完成！输出: ${VIDEO_OUTPUT}`);
  } catch {
    console.error("\n❌ Remotion 渲染失败。请手动运行:");
    console.error(`  cd "${REMOTION_DIR}" && npx remotion render CloneMVP out/clone_mvp.mp4 --browser-executable="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --concurrency=1`);
  }
}

// ============================================================
// Main
// ============================================================
async function main(): Promise<void> {
  console.log("🚀 === 1:1 视频复刻 MVP 总控脚本 ===\n");

  // Step 1
  console.log("⏳ [Step 1/5] 读取 decomposition segments...");
  console.log(`  📦 ${MOCK_SEGMENTS.length} segments loaded`);
  for (const seg of MOCK_SEGMENTS) {
    console.log(`    - ${seg.id} (${seg.role}): "${seg.text.slice(0, 50)}..."`);
  }

  // Step 2
  runAudioPipeline();

  // Step 3
  if (!fs.existsSync(CAPTIONS_PATH)) {
    console.error("❌ captions.json 不存在，无法继续。");
    process.exit(1);
  }
  const captions: WordTimestamp[] = JSON.parse(fs.readFileSync(CAPTIONS_PATH, "utf-8"));
  console.log(`  📖 已加载 ${captions.length} 个词级时间戳`);

  const timedSegments = matchSegmentsToCaptions(MOCK_SEGMENTS, captions);

  // Step 4
  const spec = assembleRenderSpec(timedSegments);

  // Step 5
  writeSpecAndRender(spec);
}

main().catch((err) => {
  console.error("🚨 总控脚本失败:", err);
  process.exit(1);
});
