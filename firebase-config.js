// ══ Firebase 設定 ══
// 到 Firebase 控制台：專案 sandaichuan-tw → 齒輪「專案設定」→「你的應用程式」
// → 新增「網頁應用程式 </>」→ 把它給的 firebaseConfig 內容貼進下面對應欄位。
// 尚未填寫時，網站會以「示範模式」運作（看得到畫面、但不連資料庫）。
window.FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

// 金流開通（Blaze + Functions 部署完成）後改為 true
window.PAY_LIVE = false;
