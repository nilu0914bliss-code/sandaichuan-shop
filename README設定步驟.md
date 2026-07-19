# 三代傳訂購網站 — 階段 1（正式程式）

## 目前狀態
- ✅ 客人端 index.html：商品從 Firestore 載入、下單真實寫入資料庫
- ✅ 商品匯入工具 seed.html、Firestore 安全規則
- ✅ 藍新金流後端 functions/（已寫好，等升級 Blaze 後部署）
- ⏳ 待辦：Blaze 綁卡 → 部署 Functions → 付款跳轉上線
- 會員／LINE 登入目前仍為示意（階段 3）

## 設定步驟（跟著做即可）

### 1. 建立 Firestore 資料庫
Firebase 控制台（sandaichuan-tw）→ 左側「Firestore Database」→ 建立資料庫
→ 位置選 asia-east1（台灣）→ 以「正式版模式」建立。

### 2. 註冊網頁應用程式、填設定
專案設定 → 你的應用程式 → 新增「網頁 </>」→ 名稱：三代傳
→ 把畫面上 firebaseConfig 的六個值，抄進本資料夾的 firebase-config.js。

### 3. 貼上安全規則
Firestore → 規則 → 貼上 firestore.rules 的內容 → 發布。

### 4. 匯入商品（只做一次）
a. 規則暫時換成 firestore.rules.匯入用.txt 的內容 → 發布
b. 用瀏覽器打開 seed.html → 按「開始匯入」→ 看到「完成」
c. 立刻把規則換回 firestore.rules → 發布

### 5. 本機預覽
直接用瀏覽器打開 index.html。右上角徽章顯示「已連線資料庫」代表成功；
下一張測試單，然後到 Firestore 的 orders 集合看訂單有沒有進來。

### 6.（等朋友綁卡後）啟用金流
升級 Blaze → functions/.env 照 .env.example 填入測試金鑰 →
部署 Functions → firebase-config.js 的 PAY_LIVE 改 true。
這步到時我會帶著做。

## 檔案說明
| 檔案 | 用途 |
|---|---|
| index.html | 客人訂購網站（正式） |
| firebase-config.js | Firebase 連線設定（要自己填） |
| seed.html | 商品一次性匯入工具 |
| firestore.rules | 資料庫安全規則（正式） |
| firestore.rules.匯入用.txt | 匯入商品時暫用 |
| functions/ | 藍新金流後端（等 Blaze） |
| 金鑰備忘-請勿上傳GitHub.txt | 金鑰備忘（只留本機） |
