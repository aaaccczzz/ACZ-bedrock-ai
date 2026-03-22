const WebSocket = require('ws');
const { exec } = require('child_process');
const { send } = require('process');
const readline = require('readline'); // 加入這行
const OpenAI = require("openai");
const fs = require('fs').promises;
const Groq = require('groq-sdk');

const loadprop = require('./loadprop.js');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const wss = new WebSocket.Server({ port: 8080 });
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let {
    scarchCommandlist,
    prompt1,
    AiConTent,
    Aimodel,
    groqmodel,
    geminimodel,
    tellmode,
    not_allow_command,
    prefix,
    aiLib,
    groqkey,
    openrouterkey,
    geminikey,
    userName,
    blacklist,
    consolename
} = loadprop.loadprop(); //載入數值

// 1. 建立伺服器，監聽 8080 端口
const args = process.argv.slice(2);
let opai=false;
let ailog=[];
let airemember=[];
let serverstatus="open";
let prompt2 = 1;
let isaithinking=false;
let per=[1,1];
let per2=[];
let getplayer="";
let files;
let commandversion=42;
let latesttime=0;
let delay=0;
let tps=20;
let playerlist=[];
const groq = new Groq({ apiKey:groqkey});
readFiles();

const bopomofoMap = {
    '1':'ㄅ','q':'ㄆ','a':'ㄇ','z':'ㄈ','2':'ㄉ','w':'ㄊ','s':'ㄋ','x':'ㄌ',
    'e':'ㄍ','d':'ㄎ','c':'ㄏ','r':'ㄐ','f':'ㄑ','v':'ㄒ','5':'ㄓ','t':'ㄔ',
    'g':'ㄕ','b':'ㄖ','y':'ㄗ','h':'ㄘ','n':'ㄙ','8':'ㄚ','i':'ㄛ','k':'ㄜ',
    'm':'ㄩ','9':'ㄞ','o':'ㄟ','l':'ㄠ',',':'ㄝ','0':'ㄢ','p':'ㄣ',';':'ㄤ',
    '.':'ㄡ','-':'ㄦ','u':'ㄧ','j':'ㄨ','3':'ˇ','4':'ˋ','6':'ˊ','7':'˙',' ':'-','/':'ㄥ'
};
const pinyinMap = {
    "ㄅ": "b", "ㄆ": "p", "ㄇ": "m", "ㄈ": "f", "ㄉ": "d", "ㄊ": "t", "ㄋ": "n", "ㄌ": "l",
    "ㄍ": "g", "ㄎ": "k", "ㄏ": "h", "ㄐ": "j", "ㄑ": "q", "ㄒ": "x",
    "ㄓ": "zh", "ㄔ": "ch", "ㄕ": "sh", "ㄖ": "r", "ㄗ": "z", "ㄘ": "c", "ㄙ": "s",
    "ㄚ": "a", "ㄛ": "o", "ㄜ": "e", "ㄝ": "e", 
    "ㄞ": "ai", "ㄟ": "ei", "ㄠ": "ao", "ㄡ": "ou",
    "ㄢ": "an", "ㄣ": "en", "ㄤ": "ang", "ㄥ": "eng", "ㄦ": "er",
    "ㄧ": "i", "ㄨ": "u", "ㄩ": "u",
    "ˊ": " ", "ˇ": " ", "ˋ": " ", "˙": " ", "-": " "
};

function zhuyinToPinyin(zhuyin) {
    const toneMatch = zhuyin.match(/[ˊˇˋ˙-]/) || ["-"];
    const tone = pinyinMap[toneMatch[0]];
    const body = zhuyin.replace(/[ˊˇˋ˙-]/, ""); // 去掉聲調的部分

    const initials = "ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙ";
    let initial = "";
    let final = body;

    if (initials.includes(body[0])) {
        initial = pinyinMap[body[0]];
        final = body.substring(1);
    }
    let pinyinFinal = final;
    if (final.startsWith("ㄧ")) {
        if (!initial) { // 無聲母：i -> y
            const map = { "ㄧ": "yi", "ㄧㄚ": "ya", "ㄧㄛ": "yo", "ㄧㄝ": "ye", "ㄧㄠ": "yao", "ㄧㄡ": "you", "ㄧㄢ": "yan", "ㄧㄣ": "yin", "ㄧㄤ": "yang", "ㄧㄥ": "ying" };
            pinyinFinal = map[final] || final.replace("ㄧ", "y");
        } else { // 有聲母
            const map = { "ㄧ": "i", "ㄧㄚ": "ia", "ㄧㄝ": "ie", "ㄧㄠ": "iao", "ㄧㄡ": "iu", "ㄧㄢ": "ian", "ㄧㄣ": "in", "ㄧㄤ": "iang", "ㄧㄥ": "ing" };
            pinyinFinal = map[final] || final.replace("ㄧ", "i");
        }
    }
    else if (final.startsWith("ㄨ")) {
        if (!initial) { // 無聲母：u -> w
            const map = { "ㄨ": "wu", "ㄨㄚ": "wa", "ㄨㄛ": "wo", "ㄨㄞ": "wai", "ㄨㄟ": "wei", "ㄨㄢ": "wan", "ㄨㄣ": "wen", "ㄨㄤ": "wang", "ㄨㄥ": "weng" };
            pinyinFinal = map[final] || final.replace("ㄨ", "w");
        } else { // 有聲母
            const map = { "ㄨ": "u", "ㄨㄚ": "ua", "ㄨㄛ": "uo", "ㄨㄞ": "uai", "ㄨㄟ": "ui", "ㄨㄢ": "uan", "ㄨㄣ": "un", "ㄨㄤ": "uang", "ㄨㄥ": "ong" };
            pinyinFinal = map[final] || final.replace("ㄨ", "u");
        }
    }
    else if (final.startsWith("ㄩ")) {
        if (!initial) { // 無聲母：yu
            const map = { "ㄩ": "yu", "ㄩㄝ": "yue", "ㄩㄢ": "yuan", "ㄩㄣ": "yun", "ㄩㄥ": "yong" };
            pinyinFinal = map[final] || final.replace("ㄩ", "yu");
        } else { // 有聲母 (j, q, x 要去點，n, l 要保留但通常寫成 v)
            let uChar = (initial === "j" || initial === "q" || initial === "x") ? "u" : "v";
            const map = { "ㄩ": uChar, "ㄩㄝ": uChar+"e", "ㄩㄢ": uChar+"an", "ㄩㄣ": uChar+"n", "ㄩㄥ": "iong" };
            pinyinFinal = map[final] || final.replace("ㄩ", uChar);
        }
    }
    else {
        pinyinFinal = pinyinMap[final] || final;
    }
    return initial + pinyinFinal + tone;
}
function translateSentenceToPinyin(input) {
    const tones = "ˊˇˋ˙- ";
    const initials = "ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙ";
    const medials = "ㄧㄨㄩ";
    let result = "";
    let buffer = "";

    for (let i = 0; i < input.length; i++) {
        let char = input[i];
        buffer += char;

        // 判斷音節何時結束並送出轉換
        let shouldFlush = false;

        // 1. 遇到聲調符號，這一定是音節的結束
        if (tones.includes(char)) {
            shouldFlush = true;
        } 
        // 2. 如果下一個字是「聲母」，代表當前音節已結束（漏打聲調的情況）
        else if (i + 1 < input.length && initials.includes(input[i+1])) {
            buffer += "-"; // 自動補一聲
            shouldFlush = true;
        }
        // 3. 如果當前已經有介母(ㄧㄨㄩ)且下一個又是介母，代表是新音節（例如 ㄧㄨ -> ㄧ, ㄨ）
        else if (i + 1 < input.length && medials.includes(input[i+1]) && buffer.split('').some(c => medials.includes(c))) {
            buffer += "-";
            shouldFlush = true;
        }

        if (shouldFlush) {
            result += zhuyinToPinyin(buffer);
            buffer = "";
        }
    }
    return result;
}
function translateToBopomofo(input) {

    const regex = /([a-z125890,.;/-]{1,3}[3467 ])/g;
    
    let matches = input.match(regex);
    if (!matches) return input; // 如果完全不符合注音格式，回傳原字串

    return matches.map(word => {
        return word.split('').map(char => bopomofoMap[char] || char).join('');
    }).join('');
}


async function openfiles(fils) {
    fileopen=[];
    for (const file of fils) {
        const content = await fs.readFile(`./ai-lib/${file}`, 'utf-8');
        fileopen.push(content);
    }
    return fileopen.join("|\n");
}

const gettime = (time) => {
    const d = new Date(time);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0'); // 月份從0開始，要+1
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    const ms = String(d.getMilliseconds()).padStart(3, '0');
    return `${y}-${m}-${day} ${h}:${min}:${s}.${ms}`;
}

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: openrouterkey,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000", // 隨便填，但必須要有
    "X-Title": "MC_Command_Helper",         // 你的應用程式名稱
  }
});

async function askMinecraftAI(playerMessage,playername,sendCommand,showthink) {
    isaithinking=true;
    if (showthink===true) sendCommand(`me §b[${Aimodel}] §rAI思考中...`);
    try {
        const libraryData = (aiLib === "on") ? ("，資料庫:" + await readFiles()) : "";
        const messages = [
            { 
              role: "system", 
              content: prompt2 == 0 ? AiConTent : prompt1 
            }
        ];

        // 處理歷史對話記憶 (非 user 角色)
        if (ailog && ailog.length > 0) {
            ailog.forEach(log => {
                messages.push({ role: "assistant", content: log });
            });
        }
        await sendCommand("list");
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log(`玩家列表:${playerlist.join(' ')}`);
        if (playername === "system"){
            messages.push({
                role: "user",
                content: `<external_data>- 查詢結果:${playerMessage}，繼續回答用戶問題</external_data>`
            });
        } else {
            messages.push({ 
                role: "user", 
                content: `${playername}說:${playerMessage}
<external_data>
${airemember.length > 0 ? "- 記憶" + airemember.join('|') : ""}
${libraryData.length > 0 ? "- " + libraryData : ""}
- 玩家列表:${playerlist.join(',')}
</external_data>`
            });
        }
        completion = await openrouter.chat.completions.create({
            model: Aimodel, 
            messages: messages,
            temperature: 0.3,
        });

        const reply = completion.choices[0].message.content;
        const lines = reply.split(/\n+/);
        
        if (reply !== "<()>" && reply !== "?" && reply) {
            ailog.push(`user:${playername}:${playerMessage},ai:${reply}|`);
        }
        console.log(`\x1b[38;5;244mAI對話紀錄:\n${ailog.join('\n')}\x1b[0m`);
        console.log(`\x1b[38;5;244mAI記憶內容:\n${airemember.join('\n')}\x1b[0m`);
        if (ailog.length>20){
            ailog.shift();
        }

        for (const line of lines) {
            console.log("AI 回覆:", reply);
            if (args[1] === "debug"){
                console.log();
            }
            const aiMsg = completion.choices[0].message;
            const thinking = aiMsg.reasoning || aiMsg.reasoning_content;

            if (thinking) {
                // 在控制台顯示漂亮的思考區塊
                console.log("\x1b[38;5;244m╔════════ AI 思考邏輯 ════════╗\x1b[0m");
                console.log(`\x1b[38;5;244m${thinking}\x1b[0m`);
                console.log("\x1b[38;5;244m╚═════════════════════════════╝\x1b[0m");
            }
            if (line.startsWith(".command")){
                const cmd = line.slice(8).trim();
                sendCommand(cmd);
                sendCommand(`me §b[${Aimodel}]§f 已執行指令: ${cmd}`);
            } else {
                if (line.trim().startsWith(".remember")) {
                    const rememberContent = playername + ":" + line.trim().slice(9).trim();
                    airemember.push(rememberContent);
                    sendCommand(`me §b[${Aimodel}]§f 已記住: ${rememberContent}`);
                } else if (line.trim().startsWith(".forget")) {
                    const forgetContent = line.trim().slice(7).trim();
                    airemember = airemember.filter(item => !item.includes(forgetContent));
                    sendCommand(`me §b[記憶]§f 已刪除包含 "${forgetContent}" 的紀錄`);
                } else if (line.startsWith(".search")) {
                    console.log(`查詢的結果:${await search(line.trim().slice(7).trim())}`);
                    askMinecraftAI(await search(line.trim().slice(7).trim()),"system",sendCommand,true);
                } else if (line.trim() !== "<()>") {
                    sendCommand(`me §b[${Aimodel}]§f ${line.trim()}`);
                }
            }
        }
        isaithinking=false;
        return reply;
    } catch (error) {
        console.error(`調用出錯: ${error.message}\n切換到groq嘗試...`);
        isaithinking=false;
        askGroq(playerMessage,playername,sendCommand,showthink)
    }
}



const genAI = new GoogleGenerativeAI(geminikey);
model = genAI.getGenerativeModel({ 
    model: geminimodel,
    systemInstruction: AiConTent,
});

async function handleAIChat(playerQuestion, playerName, sendCommand, showthink) {
    isaithinking = true;
    if (showthink === true) sendCommand(`me §b[${geminimodel}] §rAI思考中...`);
    
    try {
        const libraryData = aiLib === "on" ? "，資料庫:" + await readFiles() : "";
        let chatHistory = [];
        ailog.forEach((content, index) => {
            chatHistory.push({
                role: index % 2 === 0 ? "user" : "model", 
                parts: [{ text: content }],
            });
        });

        // 直到第一筆是 user 為止
        while (chatHistory.length > 0 && chatHistory[0].role !== "user") {
            chatHistory.shift();
        }

        sendCommand("list");
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log(`玩家列表:${playerlist.join(' ')}`);
        let userPrompt="NULL";
        if (playerName === "system") {
            userPrompt =`<external_data>- 查詢結果:${playerQuestion}，繼續回答用戶問題</external_data>`
        } else {
            userPrompt =`${playerName}說:${playerQuestion}
<external_data>
${airemember.length > 0 ? "- 記憶" + airemember.join('|') : ""}
${libraryData.length > 0 ? "- " + libraryData : ""}
- 玩家列表:${playerlist.join(',')}
</external_data>`
        }
        console.log(`\x1b[38;5;51m[AI 請求]\x1b[0m ${userPrompt}`);
        const chat = model.startChat({
            history: chatHistory,
            generationConfig: { temperature: 0.3 },
        });

        const result = await chat.sendMessage(userPrompt);
        const response = await result.response;
        const reply = response.text();

        if (reply !== "<()>") {
            ailog.push(`user:${playerName}:${playerQuestion},ai:${reply}|`);
        }
        console.log(`\x1b[38;5;244mAI對話紀錄:\n${ailog.join('\n')}\x1b[0m`);
        console.log(`\x1b[38;5;244mAI記憶內容:\n${airemember.join('\n')}\x1b[0m`);
        if (ailog.length>20){
            ailog.shift();
        }

        // 處理回覆邏輯
        const cleanText = reply.replace(/[*#_>`]/g, "").trim();
        const lines = cleanText.split(/\n+/);
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.length === 0 || trimmed === "<()>") continue;

            if (trimmed.startsWith(".command")) {
                const cmd = trimmed.slice(8).trim();
                sendCommand(cmd);
                sendCommand(`me §b[Gemini]§f 已執行指令: ${cmd}`);
            } else if (trimmed.startsWith(".remember")) {
                const content = playerName + ":" + trimmed.slice(9).trim();
                airemember.push(content);
                sendCommand(`me §b[Gemini]§f 已記住: ${content}`);
            } else if (trimmed.startsWith(".forget")) {
                const target = trimmed.slice(7).trim();
                airemember = airemember.filter(item => !item.includes(target));
                sendCommand(`me §b[記憶]§f 已刪除包含 "${target}" 的紀錄`);
            } else if (trimmed.startsWith(".search")) {
                console.log(`查詢的結果:${await search(line.trim().slice(7).trim())}`);
                handleAIChat(await search(line.trim().slice(7).trim()),"system",sendCommand,true);
            } else {
                sendCommand(`me §b[Gemini]§f ${trimmed}`);
            }
        }

        isaithinking = false;
        return reply;

    } catch (error) {
        console.error("\x1b[31m[AI 錯誤]\x1b[0m", error.message);
        // 如果是 Role 錯誤或額度問題，直接切換備援
        return await askMinecraftAI(playerQuestion, playerName, sendCommand, showthink);
    }
}


console.log("\x1b[38;5;51m=== Minecraft JS 伺服器已啟動 ===\x1b[0m");
console.log("\x1b[38;5;226m請在遊戲輸入: /connect localhost:8080\x1b[0m");
// 這是連線成功後的邏輯
wss.on('connection', (ws) => {
    console.log(`\x1b[38;5;89m遊戲已成功接入 來源ip: "${ws._socket.remoteAddress}"\x1b[0m 時間戳記: ${Date.now()}`);

    const rl = readline.createInterface({   //終端機輸入監聽
        input: process.stdin,
        output: process.stdout,
        terminal: false // 避免在某些終端機出現重複字元
    });
    rl.on('line', (input) => {  //同上
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    if (trimmedInput.startsWith("/")) {
        // 如果輸入的是 / 開頭，直接當作指令發送
        // 例如輸入: /weather rain
        const cmd = trimmedInput.slice(1);
        sendCommand(cmd);
        console.log(`\x1b[38;5;45m[終端機指令]\x1b[0m 執行: ${cmd}`);
    } else if (trimmedInput.startsWith("!ai ")) {
        // 擴充功能：在終端機也能強制 AI 說話
        const aiQuery = trimmedInput.slice(4);
        handleAIChat(aiQuery, consolename, sendCommand);
    } else if (trimmedInput.startsWith(".")) {
        handleCommand(trimmedInput, { body: { sender: consolename } }, sendCommand);
    } else if (trimmedInput === "!clear") {
        console.clear();
    } else {
        // 普通文字則當作 say 廣播
        sendCommand(`me §e[${consolename}]§f ${trimmedInput}`);
    }
    });

    // --- A.發送指令工具 (像 C++ 的 Member Function) ---
    const sendCommand = (cmd) => {
        cmd = cmd.trim().replace(/[\u200B-\u200D\uFEFF]/g, '');
        if (not_allow_command.includes(cmd.split(' ')[0])){
            sendCommand(`me §c[系統]§f 禁止使用 ${cmd.split(' ')[0]} 指令`);
            return;
        }
        if (serverstatus==="close"){
            if (!(cmd.startsWith("me") || cmd.startsWith("say") || cmd.startsWith("tell") || cmd.startsWith("tellraw") || cmd.startsWith("kill") || cmd.startsWith("tp") || cmd.startsWith("summon") || cmd.startsWith("give") || cmd.startsWith("clear"))){
            const msg = {
            header: {
                version: 1,
                requestId: Math.random().toString(36).substring(7), // 隨機產生 ID
                messagePurpose: "commandRequest",
                messageType: "commandRequest"
            },
            body: {
                commandLine: "me §c[系統]§f當前伺服器處於無人管制 禁止指令使用",
                version: commandversion
            }
        };
        ws.send(JSON.stringify(msg));
        console.log(`\x1b[38;5;100m[OUT]\x1b[0m 已送出指令: \x1b[38;5;100m${cmd}\x1b[0m`);
                return;
            }
        }
        const msg = {
            header: {
                version: 1,
                requestId: Math.random().toString(36).substring(7), // 隨機產生 ID
                messagePurpose: "commandRequest",
                messageType: "commandRequest"
            },
            body: {
                commandLine: cmd,
                version: commandversion
            }
        };
        ws.send(JSON.stringify(msg));
        console.log(`\x1b[38;5;100m[OUT]\x1b[0m 已送出指令: \x1b[38;5;100m${cmd}\x1b[0m`);
    };

    // --- B. 封裝「訂閱事件」的工具 ---
    const subscribe = (eventName) => {
        const sub = {
            header: {
                version: 1,
                requestId: Math.random().toString(36).substring(7),
                messagePurpose: "subscribe"
            },
            body: {
                eventName: eventName
            }
        };
        ws.send(JSON.stringify(sub));
    };

    // --- C. 初始化：連線後立刻做的事情 ---
    setTimeout(() => {
        sendCommand("me JS 伺服器已連線");
        subscribe("PlayerMessage"); // 訂閱玩家聊天
        console.log("\x1b[38;5;45m[SUB]\x1b[0m 已送出訂閱請求：PlayerMessage");
    }, 500);
    
    // --- D. 監聽從遊戲傳回來的資料 (JSON 解析) ---
    ws.on('message', async (packet) => {
        try {
            const data = JSON.parse(packet);

            // 1. 從 header 抓取事件名稱
            const eventName = data.header.eventName;
            const logmessage = data.body.statusMessage;
            if (args[0] === "debug") {
                console.log("\x1b[38;5;244m收到Json訊息:\n" + JSON.stringify(data, null, 2) + "\x1b[0m");
            } 
            if (logmessage) console.log(`\x1b[38;5;244m[狀態訊息]\x1b[0m ${logmessage}`);
            if (logmessage?.includes("將最多")){
                per[0] = 2;
                per2[0]=1;
            }
            if (logmessage?.includes("傳送")){
                per[1] = 2;
                per2[1]=1;
            }
            if (logmessage?.includes("權限等級不正確")){
                per2[0]=1;
            } if (logmessage?.includes("權限不足，無法擴大選擇器")){
                per2[1]=1;
            }
            if (/共有 \d+\/\d+ 玩家在線上：/.test(logmessage)){
                playerlist = logmessage.replace(/共有 \d+\/\d+ 玩家在線上：\n/,"").split(' ');
                console.log("成功存入玩家列表");
            }
            if (per2[0]===1 && per2[1]===1){
                delay = (Date.now() - latesttime) / 1.5 ;
                if (per[0] === 1 && per[1] === 1) {
                    if (tellmode === "tell"){
                        sendCommand(`tell ${getplayer} 當前權限:成員 延遲:${Date.now() - latesttime}ms`)
                    } else if (tellmode === "raw") {
                        sendCommand(`tellraw ${getplayer} {"rawtext":[{"text":"當前權限:成員\n延遲:${Date.now() - latesttime}ms"}]}`)
                    }
                } else if (per[0] === 1 && per[1] === 2) {
                    if (tellmode === "tell"){
                        sendCommand(`tell ${getplayer} 當前權限:管理 延遲:${Date.now() - latesttime}`)
                    } else if (tellmode === "raw") {
                        sendCommand(`tellraw ${getplayer} {"rawtext":[{"text":"當前權限:管理\n延遲:${Date.now() - latesttime}ms"}]}`)
                    }
                } else if (per[0] === 2 && per[1] === 2) {
                    if (tellmode === "tell"){
                        sendCommand(`tell ${getplayer} 當前權限:最大權限 延遲:${Date.now() - latesttime}ms`)
                    } else if (tellmode === "raw") {
                        sendCommand(`tellraw ${getplayer} {"rawtext":[{"text":"當前權限:最大權限\n延遲:${Date.now() - latesttime}ms"}]}`)                    }
                }
                tps=delay > 100 ? (20 / (delay / 50)).toFixed(1) : 20;
                console.log(`預計tps:${tps}`)
                per2=[];
                getplayer="";
            }

            if (eventName === "PlayerMessage") {    //玩家聊天事件
                // 2. 從 body 抓取小寫的 message 和 sender
                const msg = data.body.message;
                const user = data.body.sender;

                if(/([a-z125890,.;/-]{1,3}[3467 ])/g.test(msg) && data.body.sender !== "外部"){
                    sendCommand("me 偵測到錯字，翻譯:" + translateToBopomofo(msg));
                    sendCommand("me 偵測到錯字，翻譯:" + translateSentenceToPinyin(translateToBopomofo(msg)));
                }
                if (user !== "外部") {  //消息控制台顯示
                    console.log(`\x1b[38;5;208m[訊息]${user} 說: ${msg}\x1b[0m`);
                }
                if (opai){  //無人管理伺服器
                    prompt=0; //自動回復看場景回答問題
                    if (user !== "外部" && !msg.startsWith(`${prefix}`)){ //ai自動管理伺服器開啟中，且發話者不是外部(代表是玩家)，就讓AI回覆
                        const aiReply = await askMinecraftAI(`${msg}`,user,sendCommand,false);
                    }
                }
                handleCommand(msg,data,sendCommand);
                //#region 指令處理
            }
            //#endregion
        } catch (e) {
            // 預防解析錯誤
            console.error("解析 JSON 失敗:", e);
        }
    }); //主程式

    // 當遊戲斷開連線
    ws.on('close', () => {
        console.log("\x1b[38;5;240m【中斷】遊戲已離線。\x1b[0m");
    });
});

async function handleCommand(msg,data,sendCommand) {
    let message=msg.split(' ');
    if(blacklist.includes(data.body.sender) && message[0][0] === prefix){
        sendCommand(`me 黑名單玩家:${data.body.sender}嘗試使用功能，但是該玩家被封鎖`)
        return;
    }
    if (message[0] === `${prefix}say`) {
    sendCommand(`say ${message.slice(1).join(' ')}`); 
    }
    if (message[0] === `${prefix}command`) {
    sendCommand(`${message.slice(1).join(' ')}`); 
    }
    if (message[0] === `${prefix}system` && data.body.sender === userName) {
    exec(`chcp 65001 > nul && ${message.slice(1).join(' ')}`, (error, stdout, stderr) => {
    if (error) {
        console.error(`執行出錯: ${error.message}`);
        sendCommand(`tellraw ${data.body.sender} {"rawtext":[{"text":${JSON.stringify(error.message.replace(/[\r\x00-\x08\x0B-\x1F]/g, ''))}}]}`);
        return;
    }
    if (stderr) {
        console.error(`標準錯誤輸出: ${stderr}`);
        sendCommand(`tellraw ${data.body.sender} {"rawtext":[{"text":${JSON.stringify(stderr.replace(/[\r\x00-\x08\x0B-\x1F]/g, ''))}}]}`);
        return;
    } 
        console.log(`系統回傳結果:\n${stdout}`);
        sendCommand(`tellraw ${data.body.sender} {"rawtext":[{"text":${JSON.stringify(stdout.replace(/[\r\x00-\x08\x0B-\x1F]/g, ''))}}]}`);
    });
        } else if (data.body.sender !== userName && message[0] === ".system") {
    sendCommand(`me ${data.body.sender} 嘗試使用了系統指令，但是被拒絕了`);
    }
    if (message[0] === `${prefix}repeat` && data.body.sender === userName) {
    if(message.length === 1){
        if (tellmode === "raw") {
            sendCommand(`tellraw ${data.body.sender} {"rawtext":[{"text":"用法: ${prefix}repeat <指令> <重複次數>"}]}`);
        } else {
            sendCommand(`tell ${data.body.sender} 用法: ${prefix}repeat <指令> <重複次數>`);
        }
    } else if (message.length === 2){
        if (tellmode === "raw") {
            sendCommand(`tellraw ${data.body.sender} {"rawtext":[{"text":"請指定重複次數"}]}`);
        } else {
            sendCommand(`tell ${data.body.sender} 請指定重複次數`);
        }
    } else {
        for (let i = 0; i < parseInt(message[message.length - 1]); i++) {
            sendCommand(`${message.slice(1, -1).join(' ')}`);
        }
    }
    }
    if (message[0] === `${prefix}ai`) {
        prompt=1; //手動召喚ai不用忽略不相關問題
        await handleAIChat(message.slice(1).join(' '), data.body.sender, sendCommand, true);
    }
    if (message[0] === `${prefix}ai2`){
        prompt=1; //手動召喚ai不用忽略不相關問題
        await askMinecraftAI(message.slice(1).join(' '), data.body.sender, sendCommand, true);
    }
    if (message[0] === `${prefix}ai3`){
        prompt=1; //手動召喚ai不用忽略不相關問題
        await askGroq(message.slice(1).join(' '), data.body.sender, sendCommand, true);
    }
    if (message[0] === `${prefix}subscribe`) {
    subscribe(message[1]);
    sendCommand(`me 已訂閱事件: ${message[1]}`);
    }
    if (message[0] === `${prefix}setai` && data.body.sender === userName) {
        if (message.length === 1) {
            if(tellmode === "raw") {
                sendCommand(`tellraw ${data.body.sender} {"rawtext":[{"text":"用法: ${prefix}setai2 -m <模型名稱> -s <系統提示詞> -l <on/off開啟ai資料庫>"}]}`);
            } else {
                sendCommand(`tell ${data.body.sender} 用法: ${prefix}setai2 -m <模型名稱> -s <系統提示詞> -l <on/off開啟ai資料庫>`);
            }
        }
        if (message.includes("-m")) {
            modelIndex = message.indexOf("-m");
            geminimodel = message[modelIndex + 1];
            sendCommand(`me 已設定模型: ${message[modelIndex + 1]}`);
        } 
        if (message.includes("-s")) {
            systemIndex = message.indexOf("-s");
            AiConTent = message[systemIndex + 1];
            sendCommand(`me 已設定系統提示詞: ${message[systemIndex + 1]}`);
        }
        if (message.includes("-l")) {
            systemIndex = message.indexOf("-l");
            aiLib = message[systemIndex + 1];
            sendCommand(`me Ai資料庫啟用狀態: ${message[systemIndex + 1]}`);
        }
    }
    if (message[0] === `${prefix}setai2` && data.body.sender === userName) {
        if (message.length === 1) {
            if(tellmode === "raw") {
                sendCommand(`tellraw ${data.body.sender} {"rawtext":[{"text":"用法: ${prefix}setai2 -m <模型名稱> -s <系統提示詞> -l <on/off開啟ai資料庫>"}]}`);
            } else {
                sendCommand(`tell ${data.body.sender} 用法: ${prefix}setai2 -m <模型名稱> -s <系統提示詞> -l <on/off開啟ai資料庫>`);
            }
        }
        if (message.includes("-m")) {
            modelIndex = message.indexOf("-m");
            Aimodel = message[modelIndex + 1];
            sendCommand(`me 已設定模型: ${message[modelIndex + 1]}`);
        } 
        if (message.includes("-s")) {
            systemIndex = message.indexOf("-s");
            AiConTent = message[systemIndex + 1];
            sendCommand(`me 已設定系統提示詞: ${message[systemIndex + 1]}`);
        }
        if (message.includes("-l")) {
            systemIndex = message.indexOf("-l");
            aiLib = message[systemIndex + 1];
            sendCommand(`me Ai資料庫啟用狀態: ${message[systemIndex + 1]}`);
        }
    }
    if (message[0] === `${prefix}setai3` && data.body.sender === userName) {
        if (message.length === 1) {
            if(tellmode === "raw") {
                sendCommand(`tellraw ${data.body.sender} {"rawtext":[{"text":"用法: ${prefix}setai2 -m <模型名稱> -s <系統提示詞> -l <on/off開啟ai資料庫>"}]}`);
            } else {
                sendCommand(`tell ${data.body.sender} 用法: ${prefix}setai2 -m <模型名稱> -s <系統提示詞> -l <on/off開啟ai資料庫>`);
            }
        }
        if (message.includes("-m")) {
            modelIndex = message.indexOf("-m");
            groqmodel = message[modelIndex + 1];
            sendCommand(`me 已設定模型: ${message[modelIndex + 1]}`);
        } 
        if (message.includes("-s")) {
            systemIndex = message.indexOf("-s");
            AiConTent = message[systemIndex + 1];
            sendCommand(`me 已設定系統提示詞: ${message[systemIndex + 1]}`);
        }
        if (message.includes("-l")) {
            systemIndex = message.indexOf("-l");
            aiLib = message[systemIndex + 1];
            sendCommand(`me Ai資料庫啟用狀態: ${message[systemIndex + 1]}`);
        }
    }
    if (message[0] === `${prefix}setmode`){
    if (message.length === 1) {
        sendCommand(`tell ${data.body.sender} 用法: ${prefix}setmode <模式 (tell,raw)>`)
    } else {
        tellmode=message[1];
        if (tellmode === "raw") {
            sendCommand(`tellraw ${data.body.sender} {"rawtext":[{"text":"已切換到 raw 模式"}]}`);
        } else {
            sendCommand(`tell ${data.body.sender} 已切換到 tell 模式`);
        }
    }
    }
    if (message[0] === `${prefix}opai` && data.body.sender === userName) {
    if (message[1]==="on"){
        opai=true;
        prompt2=0; //開啟ai自動管理伺服器後，讓ai自動判斷是否忽略不相關問題
        serverstatus="close";
        if (tellmode === "raw") {
            sendCommand(`tellraw ${data.body.sender} {"rawtext":[{"text":"已開啟 AI 自動管理伺服器 (opai)"}]}`);
        } else {
            sendCommand(`tell ${data.body.sender} 已開啟 AI 自動管理伺服器 (opai)`);
        }
    } else if (message[1]==="off"){
        opai=false;
        prompt2=1; //關閉ai自動管理伺服器後，ai不用判斷是否忽略不相關問題，直接回答
        serverstatus="open";
        if (tellmode === "raw") {
            sendCommand(`tellraw ${data.body.sender} {"rawtext":[{"text":"已關閉 AI 自動管理伺服器 (opai)"}]}`);
        } else {
            sendCommand(`tell ${data.body.sender} 已關閉 AI 自動管理伺服器 (opai)`);
        }
    }
    }
    if (message[0] === `${prefix}resetai`) {
    ailog=[];
    airemember=[];
    if (tellmode === "raw") {
        sendCommand(`tellraw ${data.body.sender} {"rawtext":[{"text":"已重置 AI 對話紀錄與記憶"}]}`);
    } else {
        sendCommand(`tell ${data.body.sender} 已重置 AI 對話紀錄與記憶`);
    }
    }
    if (message[0] === `${prefix}setprefix`) {
    prefix=message[1];
    if (tellmode === "raw") {
        sendCommand(`tellraw ${data.body.sender} {"rawtext":[{"text":"已設定指令前綴為: ${message[1]}"}]}`);
    } else {
        sendCommand(`tell ${data.body.sender} 已設定指令前綴為: ${message[1]}`);
    }
    }
    if (message[0] === `${prefix}runjs`) {
        if (data.body.sender === userName || data.body.sender === "aaaccczzz888"){
            if (tellmode === "raw") {
                sendCommand(`tellraw ${data.body.sender} {"rawtext":[{"text":"js代碼: ${message.slice(1).join(' ')}，執行結果: ${eval(message.slice(1).join(' '))}"}]}`);
            } else if (tellmode === "tell") {
                sendCommand(`tell ${data.body.sender} js代碼: ${message.slice(1).join(' ')} 執行結果: ${eval(message.slice(1).join(' '))}`);
            }
        }
    }
    if (message[0] === `${prefix}gettime`) {
    if (tellmode === "raw") {
        sendCommand(`tellraw ${data.body.sender} {"rawtext":[{"text":"當前時間:${gettime(Date.now())}"}]}`);
    } else if (tellmode === "tell") {
        sendCommand(`tell ${data.body.sender} 當前時間:${gettime(Date.now())}`);
    }
    }
    if (message[0] === `${prefix}help`) {
        if (!message[1] || message[1] === "1"){
            if (tellmode === "raw") {
                sendCommand(`tellraw "${data.body.sender}" {"rawtext":[{"text":"指令列表:\n ${prefix}say <訊息> - 讓伺服器說話\n ${prefix}command <指令> - 執行 Minecraft 指令\n ${prefix}repeat <指令> <次數> - 重複執行指令\n ${prefix}ai <內容> - 調用外部ai\n ${prefix}subscribe <事件> - 訂閱事件\n ${prefix}opai <on/off> - 開啟/關閉ai自動管理伺服器\n ${prefix}setprefix - 設定指令開頭字元\n ${prefix}setmode <tell/raw> - 切換模式\n ${prefix}gettime - 獲得當前時間\n ${prefix}help <page> - 顯示此幫助訊息"}]}`);
            } else {
                sendCommand(`tell "${data.body.sender}" 指令列表: ${prefix}say <訊息> - 讓伺服器說話 ${prefix}command <指令> - 執行 Minecraft 指令 ${prefix}repeat <指令> <次數> - 重複執行指令 ${prefix}ai <內容> - 調用外部ai ${prefix}subscribe <事件> - 訂閱事件 ${prefix}opai <on/off> - 開啟/關閉ai自動管理伺服器 ${prefix}setprefix - 設定指令開頭字元 ${prefix}setmode <tell/raw> - 切換模式 ${prefix}gettime - 獲得當前時間 ${prefix}saveai - 保存ai記憶 ${prefix}saveai - 載入ai記憶 ${prefix}help<page> - 顯示此幫助訊息`);
            }
        } else if (message[1] === "2"){
            if (tellmode === "raw") {
                sendCommand(`tellraw "${data.body.sender}" {"rawtext":[{"text":"指令列表(2):\n ${prefix}saveai - 保存ai記憶\n ${prefix}loadai - 載入ai記憶\n"}]}`)
            } else {
                sendCommand(`tell "${data.body.sender}" 指令列表: ${prefix}saveai - 保存ai記憶 ${prefix}loadai - 載入ai記憶`)
            }
        }
    }
    if (message[0] === `${prefix}saveai`) {
        await fs.writeFile('./memory.json', JSON.stringify(airemember, null, 2));
        if (tellmode === "raw") {
            sendCommand(`tellraw "${data.body.sender}" {"rawtext":[{"text":"已保存ai記憶資料"}]}`);
        } else {
            sendCommand(`tell "${data.body.sender}" 已保存ai記憶資料`);
        }
    }
    if (message[0] === `${prefix}loadai`) {
        try {
            const data = await fs.readFile('./memory.json', 'utf8');
            airemember = JSON.parse(data);

            if (tellmode === "raw") {
                sendCommand(`tellraw "${data.body.sender}" {"rawtext":[{"text":"已載入ai記憶"}]}`);
            } else {
                sendCommand(`tell "${data.body.sender}" 已載入ai記憶`);
            }

        } catch (err) {
            if (tellmode === "raw") {
                sendCommand(`tellraw "${data.body.sender}" {"rawtext":[{"text":"沒有找到記憶檔案"}]}`);
            } else {
                sendCommand(`tell "${data.body.sender}" 沒有找到記憶檔案`);
            }
        }
    }
    if (message[0] === `${prefix}getper`) {
            latesttime=Date.now();
            per=[1];
            sendCommand(`setmaxplayers 10`);
            per.push(1);
            sendCommand(`tp "${data.body.sender}" "${data.body.sender}"`);
            getplayer=`${data.body.sender}`;
            
    }
    if (message[0] === `${prefix}devlist`) {
        if (tellmode === "raw") {
            sendCommand(`tellraw "${data.body.sender}" {"rawtext":[{"text":"§l開發工具:§r\n ${prefix}system - 系統命令\n ${prefix}setai2 - 設定AI系統提示詞與模型\n ${prefix}resetai - 重置AI對話紀錄與記憶\n ${prefix}runjs - 運行js代碼\n ${prefix}blacklist <name> - 禁止某位玩家執行指令\n ${prefix}devlist - 顯示開發者工具列表"}]}`);
        } else {
            sendCommand(`tell "${data.body.sender}" 開發工具: ${prefix}system - 系統命令 ${prefix}setai2 - 設定AI系統提示詞與模型 ${prefix}resetai - 重置AI對話紀錄與記憶 ${prefix}runjs - 運行js代碼 ${prefix}blacklist <name> - 禁止某位玩家執行指令 ${prefix}devlist - 顯示開發者工具列表`);
        }
    }
    if (message[0] === `${prefix}log`) {
        console.log(`當前AI模型: ${Aimodel}\n當前指令前綴: ${prefix}\n當前tell模式: ${tellmode}\nAI自動管理伺服器(opai): ${opai ? "開啟" : "關閉"}\nAI對話紀錄條數: ${ailog.length}\nAI對話紀錄: ${ailog.join('\n')}\nAI記憶條數: ${airemember.length}\nAI記憶: ${airemember.join('\n')}\nai是否正在思考: ${isaithinking ? "是" : "否"}\n伺服器狀態: ${serverstatus}\nai prompt目前狀態:${prompt2 === 0 ? "忽略" : "不忽略" }\n權限狀態:${per.join(' ')}\n權限判定狀態:${per2.join(' ')}\n讀取到的檔案: ${files}\ndebug:${aiLib === "on" ? "，資料庫:" + await readFiles() : ""}`);
    }
    if (message[0] === `${prefix}blacklist`){
        if (data.body.sender === userName){
            if (message[1] === "add"){
                blacklist.push(message.slice(2).join(' '));
                if (tellmode === "raw"){
                    sendCommand(`tellraw ${data.body.sender} {"rawtext":[{"text":"成功把${message.slice(2).join(' ')}加入黑名單 當前:${blacklist.join(',')}"}]}`);
                } else {
                    sendCommand(`tell ${data.body.sender} 成功把${message.slice(2).join(' ')}加入黑名單 當前:${blacklist.join(',')}`);
                }
            } else if (message[1] === "remove") {
                if (blacklist.indexOf(message.slice(2).join(' ')) !== -1 ) {
                    blacklist.splice(blacklist.indexOf(message.slice(2).join(' ')),1);
                } else {
                    if (tellmode === "raw"){
                        sendCommand(`tellraw ${data.body.sender} {"rawtext":[{"text":"失敗!找不到玩家:${message.slice(2).join(' ')}"}]}`);
                    } else {
                        sendCommand(`tell ${data.body.sender} 失敗!找不到玩家:${message.slice(2).join(' ')}`);
                    }  
                    return;
                }
                if (tellmode === "raw"){
                    sendCommand(`tellraw ${data.body.sender} {"rawtext":[{"text":"玩家:${message.slice(2).join(' ')}從黑名單中刪除"}]}`);
                } else {
                    sendCommand(`tell ${data.body.sender} 玩家:${message.slice(2).join(' ')}從黑名單中刪除`);
                }                    
            } else if (message[1] === "list"){
                if (tellmode === "raw"){
                    sendCommand(`tellraw ${data.body.sender} {"rawtext":[{"text":"當前:${blacklist.join(',')}"}]}`);
                } else {
                    sendCommand(`tell ${data.body.sender} 當前:${blacklist.join(',')}`);
                }                
            }
        }
    }
}

async function readFiles() {    //輸出目錄下所有檔案 傳給openfiles輸出所有檔案內容
    try {
        const dirPath = './ai-lib';
        const fileNames = await fs.readdir(dirPath);
        files = fileNames.join('|\n ');
        return(openfiles(fileNames));
    } catch (err) {
        console.error('讀取檔案失敗:', err);
    }
}

async function askGroq(playerMessage, playername, sendCommand, showthink) {
    isaithinking = true;
    if (showthink === true) sendCommand(`me §b[${groqmodel}] §rAI思考中...`);

    try {
        const messages = [
            { 
                role: "system", 
                content: prompt2 == 0 ? AiConTent : prompt1 
            }
        ];

        // 處理歷史對話記憶
        if (ailog && ailog.length > 0) {
            ailog.forEach(log => {
                messages.push({ role: "assistant", content: log });
            });
        }

        sendCommand("list");
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log(`玩家列表:${playerlist.join(' ')}`);        

        // 當前玩家輸入與資料庫
        const libraryData = aiLib === "on" ? "，資料庫:" + await readFiles() : "";
        
        if(playername === "system"){
            console.log(`用戶傳給ai的資料:<external_data>查詢結果:${playerMessage}，請繼續回答用戶問題</external_data>`);
            messages.push({ 
                role: "user", 
                content: `<external_data>查詢結果:${playerMessage}，請繼續回答用戶問題</external_data>` 
            });
        } else {
            messages.push({ 
                role: "user", 
                content: `${playername}說:${playerMessage}
<external_data>
${airemember.length > 0 ? "- 記憶" + airemember.join('|') : ""}
${libraryData.length > 0 ? "- " + libraryData : ""}
- 玩家列表:${playerlist.join(',')}
</external_data>` 
            });
        }
        const chatCompletion = await groq.chat.completions.create({
            "messages": messages,
            "model": groqmodel,
            "temperature": 0.3,
            "top_p": 1,
            "stream": false,
            "stop": null
        });

        const reply = chatCompletion.choices[0].message.content.replaceAll(" aczacz888"," aczaczacz888");
        const lines = reply.split(/\n+/);
        const aiMsg = chatCompletion.choices[0].message;
        const thinking = aiMsg.reasoning;

        console.log(`\x1b[38;5;154m[Groq 回覆]\x1b[0m: ${reply}`);
        if (args[1] === "debug"){
            // --- 暴力查看原始 JSON 開始 ---
            console.log("\x1b[38;5;208m════════ 原始 API 返回數據 ════════\x1b[0m");
            console.log(JSON.stringify(chatCompletion, null, 2)); // null, 2 代表縮進兩格，比較好讀
            console.log("\x1b[38;5;208m══════════════════════════════════\x1b[0m");
            // --- 暴力查看原始 JSON 結束 ---
        }
        if (thinking) {
            console.log("\x1b[38;5;214m╔════════ Groq 思考內容 (Reasoning) ════════╗\x1b[0m");
            console.log(`\x1b[38;5;244m${thinking}\x1b[0m`);
            console.log("\x1b[38;5;214m╚══════════════════════════════════════════╝\x1b[0m");
        }

        if (lines.join('\n') !== "<()>") {
            ailog.push(`user:${playername}:${playerMessage},ai:${lines.join('\n')}|`);
        }
        console.log(`\x1b[38;5;244mAI對話紀錄:\n${ailog.join('\n')}\x1b[0m`);
        console.log(`\x1b[38;5;244mAI記憶內容:\n${airemember.join('\n')}\x1b[0m`);
        if (ailog.length>20){
            ailog.shift();
        }

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed === "<()>" || trimmed === "") continue;

            if (trimmed.startsWith(".command")) {
                const cmd = trimmed.slice(8).trim();
                sendCommand(cmd);
                sendCommand(`me §b[Groq]§f 已執行指令: ${cmd}`);
            } else if (trimmed.startsWith(".remember")) {
                const rememberContent = playername + ":" + trimmed.slice(9).trim();
                airemember.push(rememberContent);
                sendCommand(`me §b[Groq]§f 已記住: ${rememberContent}`);
            } else if (trimmed.startsWith(".forget")) {
                const forgetContent = trimmed.slice(7).trim();
                airemember = airemember.filter(item => !item.includes(forgetContent));
                sendCommand(`me §b[記憶]§f 已刪除包含 "${forgetContent}" 的紀錄`);
            } else if (trimmed.startsWith(".search")) {
                console.log(`查詢結果:${await search(trimmed.slice(7).trim())}`)
                await askGroq(await search(trimmed.slice(7).trim()),"system",sendCommand,true)   
            } else {
                sendCommand(`me §b[Groq]§f ${trimmed}`);
            }
        }

        isaithinking = false;
        return reply;

    } catch (error) {
        console.error(`\x1b[31m[Groq 錯誤]\x1b[0m: ${error.message}`);
        isaithinking = false;
        if (showthink) sendCommand(`me §c[系統] Groq 呼叫失敗: ${error.message}`);
        console.log(`召喚其他ai嘗試`);
        return await askMinecraftAI(playerQuestion, playerName, sendCommand, showthink);
    }
}

async function search(query) {
    try {
        // 構建 URL (加入 kad=wt-wt 優先使用全球資料，也可改 zh-tw)
        const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // 優先順序：1. 直接摘要 -> 2. 相關話題的第一條 -> 3. 找不到
        let result = "";

        if (data.AbstractText) {
            result = data.AbstractText;
        } else if (data.RelatedTopics && data.RelatedTopics.length > 0) {
            // 有些結果在 RelatedTopics 裡，過濾掉沒有 Text 的項目
            const firstTopic = data.RelatedTopics.find(topic => topic.Text);
            result = firstTopic ? firstTopic.Text : "查無直接摘要。";
        } else {
            result = "查無相關資料，請嘗試更換關鍵字。";
        }

        // 限制長度，避免 AI 上下文過長
        return result.length > 500 ? result.substring(0, 500) + "..." : result;

    } catch (error) {
        console.error("\x1b[31m[搜尋錯誤]\x1b[0m", error.message);
        return "搜尋失敗，請檢查網路連線或稍後再試。";
    }
}