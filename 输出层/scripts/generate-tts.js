require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// 这里我已经帮你加上了完美的双引号
const KOC_VOICE_ID = "7Prnkfw9Jt90KeSHxQAL"; 

const TEXT_TO_SPEAK = "Okay, if you're still taking notes by hand in meetings... you need to stop. I just got the PLAUD AI recorder, and it's literally a cheat code for work! You just press one button, it records everything, and ChatGPT turns it into a perfect summary and mind map on your phone! My boss thinks I'm a genius. You have to check this out.";

// 确保路径对了
const FINAL_VOICEOVER = path.join(__dirname, '../public/voiceover.mp3');
const API_KEY = process.env.ELEVENLABS_API_KEY;

// 增加了一层安全检查，看看是不是 API_KEY 没读到
if (!API_KEY) {
    console.error("❌ 严重错误: 没有读取到 API Key！请确保 .env 文件在项目根目录，并且拼写正确。");
    process.exit(1);
}

async function generateVoiceover() {
    console.log("⏳ 正在调用 KOC 的专属声纹生成 PLAUD AI 配音...");
    try {
        const response = await axios.post(
            `https://api.elevenlabs.io/v1/text-to-speech/${KOC_VOICE_ID}`,
            {
                text: TEXT_TO_SPEAK,
                model_id: "eleven_multilingual_v2",
                voice_settings: {
                    similarity_boost: 0.7, 
                    stability: 0.45,       
                    style: 0.15
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
            writer.on('finish', () => {
                console.log("✅ 成功！去 public 文件夹听听最新的 voiceover.mp3 吧！");
                resolve();
            });
            writer.on('error', reject);
        });
    } catch (error) {
        // 如果是 ElevenLabs 官方报错，这里会打印出非常具体的错误原因
        console.error("❌ 生成失败详情:", error.response ? error.response.data : error.message);
    }
}

generateVoiceover();