require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const ffmpeg = require('fluent-ffmpeg');

// ==========================================
// 💡 在这里修改你想让 AI 念的台词！(支持 Emoji 停顿和标点符号情绪)
// ==========================================
const TEXT_TO_SPEAK = "Okay, real talk. I didn't think campus dating could actually be this easy... Tinder and Hinge literally don't work. But then my friend told me about Ditto, and it's INSANE. You just type it in your browser, and it plans the whole date for you!";

// 文件路径配置
const INPUT_VIDEO = path.join(__dirname, '../Input/input.mp4');
const TEMP_AUDIO = path.join(__dirname, '../public/temp_sample.mp3');
const FINAL_VOICEOVER = path.join(__dirname, '../public/voiceover.mp3');
const API_KEY = process.env.ELEVENLABS_API_KEY;

if (!API_KEY) {
    console.error("❌ 错误: 请在 .env 文件中设置 ELEVENLABS_API_KEY");
    process.exit(1);
}

// 第一步：从视频中提取音频
function extractAudio() {
    return new Promise((resolve, reject) => {
        console.log("⏳ [1/3] 正在从 input.mp4 提取达人原声...");
        ffmpeg(INPUT_VIDEO)
            .noVideo()
            .audioCodec('libmp3lame')
            .save(TEMP_AUDIO)
            .on('end', () => {
                console.log("✅ 原声提取成功!");
                resolve();
            })
            .on('error', (err) => {
                console.error("❌ 提取音频失败:", err);
                reject(err);
            });
    });
}

// 第二步：调用 ElevenLabs 克隆声音
async function cloneVoice() {
    console.log("⏳ [2/3] 正在将声音上传至 ElevenLabs 进行克隆...");
    const formData = new FormData();
    formData.append('name', `KOC_Clone_${Date.now()}`); // 每次生成一个唯一名字
    formData.append('files', fs.createReadStream(TEMP_AUDIO));
    formData.append('description', 'TikTok energetic voice');

    try {
        const response = await axios.post('https://api.elevenlabs.io/v1/voices/add', formData, {
            headers: {
                'xi-api-key': API_KEY,
                ...formData.getHeaders()
            }
        });
        const voiceId = response.data.voice_id;
        console.log(`✅ 声音克隆成功! 专属 Voice ID: ${voiceId}`);
        return voiceId;
    } catch (error) {
        console.error("❌ 克隆声音失败:", error.response ? error.response.data : error.message);
        throw error;
    }
}

// 第三步：生成新的画外音
async function generateVoiceover(voiceId) {
    console.log("⏳ [3/3] 正在使用克隆的声音生成新的 TikTok 配音...");
    try {
        const response = await axios.post(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
            {
                text: TEXT_TO_SPEAK,
                model_id: "eleven_multilingual_v2", // V2 模型表现力最强
                voice_settings: {
                    similarity_boost: 0.75, // 还原度
                    stability: 0.3,         // 越低情绪起伏越大 (适合 TikTok)
                    style: 0.2
                }
            },
            {
                headers: {
                    'xi-api-key': API_KEY,
                    'Content-Type': 'application/json',
                    'Accept': 'audio/mpeg'
                },
                responseType: 'stream'
            }
        );

        const writer = fs.createWriteStream(FINAL_VOICEOVER);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        console.error("❌ 生成配音失败:", error.response ? error.response.data : error.message);
        throw error;
    }
}

// 运行流水线
async function runPipeline() {
    try {
        // 确保 public 文件夹存在
        const publicDir = path.join(__dirname, '../public');
        if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);

        await extractAudio();
        const voiceId = await cloneVoice();
        await generateVoiceover(voiceId);
        
        console.log(`🎉 恭喜！流水线执行完毕！请去 public 文件夹收听你的 voiceover.mp3`);
    } catch (error) {
        console.error("🚨 流水线执行中断。");
    }
}

runPipeline();