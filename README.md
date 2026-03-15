# ACZ-bedrock-ai - 一個在minecraft基岩版裡原生使用ai的工具
## 🚀功能
- 免費(~~白嫖~~)
- 支持多個供應商更換(Gemini ,openrouter ,Groq)
- 多功能
- ai可以使用遊戲內部指令
- 無人AI自動管理伺服器
- 高自由度
## ✨如何使用
### 安裝環境

確保你有node.js

輸入:
```npm install ws groq-sdk axios```

### 註冊三個API 
[google](https://aistudio.google.com/api-keys)

[openrouter](https://openrouter.ai/settings/keys)

[Groq](https://console.groq.com/keys)
### 編寫配置文件
在目錄下創建一個
```
loadprop.js
```
loadprop.js範例:
```js
function loadprop(){
    return {
    scarchCommandlist: ["camera","execute","scoreboard","playsound"],
	prompt1: `你是一個 Minecraft 基岩版專家。若涉及操作，請回覆 .command <指令> 格式。例如：.command give @p diamond 64並且不附加任何內容，若指令數量有多個，請用換行分開，禁止玩家使用 高權限指令(如op,deop)，指令一定要有\"執行者\" 假設要把a玩家傳送到b 必須用tp a b而不是tp b，請避免使用@p的選擇器。請簡潔地回答，避免使用markdown格式。，當用戶要你記住的時候請輸出 .remember <內容>，請以你的方式述說，而不是照抄，當用戶要你忘記或你覺得需要忘記的時候請輸出 .forget <內容>。請使用繁體中文，不要提示用戶使用"."開頭的指令。`,
	AiConTent: `你是一個 Minecraft 基岩版專家。若涉及操作，請回覆 .command <指令> 格式。例如：.command give 玩家名稱 diamond 64 並且不附加任何內容，開頭不須加斜線，若指令數量有多個，請用換行分開，禁止玩家使用高權限指令(如op,deop)，指令一定要有執行者，例如使用 tp 玩家A 玩家B 而不是 tp 玩家B，請避免使用@p選擇器。請簡潔地回答，禁止使用任何Markdown格式(如粗體、標題、列表、表格、代碼塊)。當你認為問題不關於你，請輸出<()>，若有人@ai則代表跟你一定有關，若不知道對方在說什麼則發送單個?。當用戶要你記住時請輸出 .remember <內容>，請以你的方式轉述內容而非照抄。當用戶要你忘記或你認為需要忘記時請輸出 .forget <內容>。請使用繁體中文，不要提示用戶使用"."開頭的指令。`,
	Aimodel: "stepfun/step-3.5-flash:free",  //openrouter.ai模型
	groqmodel: "groq/compound",
	geminimodel: "gemini-2.5-flash",
	tellmode: "raw",
	not_allow_command: ["op","deop","setworldspawn"],
	prefix: '.',
	aiLib: "off",
	groqkey: "YOUR_KEY",
	openrouterkey: "YOUR_KEY",
	geminikey: "YOUR_KEY",
  userName: "YOUR_USERNAME"
    };
}
module.exports={loadprop};
```
**把```YOUR_KEY```換成你的API**
**把```YOUR_USERNAME```換成你的遊戲ID**
### 運行
終端輸入:
```bash
node test.cjs
```

## 🛜如何連接?
在遊戲中輸入:
```
/connect localhost:8080
```

## 🖨️指令列表
### 詢問ai
```
.ai <內容>
.ai2 <內容>
.ai3 <內容>
```
1,2,3分別代表:Gemini,openrouter,Groq

### 設定ai
```
.setai -m <模型名稱> -s <系統提示詞> -l <ai資料庫(on/off)>
.setai2 -m <模型名稱> -s <系統提示詞> -l <ai資料庫(on/off)>
.setai3 -m <模型名稱> -s <系統提示詞> -l <ai資料庫(on/off)>
```
1,2,3分別代表:Gemini,openrouter,Groq
**註:"系統提示詞/ai資料庫"是通用的**

### ai自動管理伺服器(世界)
```
.opai <on/off>
```

### 其他功能
```
.runjs <js>
```
執行jsvascript腳本

```
.gettime
```
獲取當前時間

```
.help <page>
```
更多指令清單

```
.devlist
```
開發者指令清單
