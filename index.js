/**
 * 三代傳 — 藍新金流後端（階段 1，預先備妥）
 * 部署前置：Firebase 升級 Blaze 後執行 `firebase deploy --only functions`
 * 金鑰放在 functions/.env（參考 .env.example），絕不進 GitHub。
 */
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const crypto = require("crypto");
admin.initializeApp();

const MID = process.env.NEWEBPAY_MERCHANT_ID;
const KEY = process.env.NEWEBPAY_HASH_KEY;
const IV  = process.env.NEWEBPAY_HASH_IV;
const IS_PROD = process.env.NEWEBPAY_ENV === "prod";
const GATEWAY = IS_PROD
  ? "https://core.newebpay.com/MPG/mpg_gateway"
  : "https://ccore.newebpay.com/MPG/mpg_gateway";
const FRONTEND = process.env.FRONTEND_URL || "";

function aesEncrypt(obj){
  const data = new URLSearchParams(obj).toString();
  const c = crypto.createCipheriv("aes-256-cbc", KEY, IV);
  return c.update(data, "utf8", "hex") + c.final("hex");
}
function aesDecrypt(hex){
  const d = crypto.createDecipheriv("aes-256-cbc", KEY, IV);
  d.setAutoPadding(false);
  const t = d.update(hex, "hex", "utf8") + d.final("utf8");
  return t.replace(/[\x00-\x20]+$/g, "");
}
function tradeSha(tradeInfo){
  return crypto.createHash("sha256")
    .update(`HashKey=${KEY}&${tradeInfo}&HashIV=${IV}`)
    .digest("hex").toUpperCase();
}

// 前端呼叫：取得導向藍新付款頁所需的加密參數
exports.createPayment = onRequest({ cors: true, region: "asia-east1" }, async (req, res) => {
  try{
    const { docId } = req.method === "POST" ? req.body : req.query;
    if(!docId) return res.status(400).json({ error: "缺少 docId" });
    const snap = await admin.firestore().doc(`orders/${docId}`).get();
    if(!snap.exists) return res.status(404).json({ error: "訂單不存在" });
    const o = snap.data();
    if(o.status !== "pending_payment") return res.status(400).json({ error: "此訂單非待付款狀態" });

    const params = {
      MerchantID: MID,
      RespondType: "JSON",
      TimeStamp: Math.floor(Date.now() / 1000),
      Version: "2.0",
      MerchantOrderNo: o.orderNo,
      Amt: o.total,
      ItemDesc: "三代傳滷味",
      Email: o.email || "",
      LoginType: 0,
      NotifyURL: `${process.env.NOTIFY_URL || ""}`,
      ReturnURL: `${FRONTEND}?paid=${o.orderNo}`,
      CREDIT: o.payMethod === "card" ? 1 : 0,
      LINEPAY: o.payMethod === "linepay" ? 1 : 0
    };
    const TradeInfo = aesEncrypt(params);
    res.json({ gateway: GATEWAY, MerchantID: MID, TradeInfo, TradeSha: tradeSha(TradeInfo), Version: "2.0" });
  }catch(e){
    console.error(e);
    res.status(500).json({ error: "建立付款失敗" });
  }
});

// 藍新付款完成後的主動通知（webhook）：自動把訂單標為已付款
exports.newebpayNotify = onRequest({ region: "asia-east1" }, async (req, res) => {
  try{
    const { TradeInfo, TradeSha } = req.body;
    if(!TradeInfo || tradeSha(TradeInfo) !== TradeSha){
      console.error("TradeSha 驗證失敗");
      return res.status(400).send("bad sha");
    }
    const info = JSON.parse(aesDecrypt(TradeInfo));
    if(info.Status !== "SUCCESS"){
      console.log("付款未成功：", info.Status);
      return res.send("OK");
    }
    const r = info.Result || {};
    const q = await admin.firestore().collection("orders")
      .where("orderNo", "==", r.MerchantOrderNo).limit(1).get();
    if(q.empty){
      console.error("找不到訂單：", r.MerchantOrderNo);
      return res.send("OK");
    }
    await q.docs[0].ref.update({
      status: "paid",
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
      tradeNo: r.TradeNo || "",
      payType: r.PaymentType || ""
    });
    res.send("OK"); // 藍新收到 OK 才不會重送
  }catch(e){
    console.error(e);
    res.status(500).send("error");
  }
});
