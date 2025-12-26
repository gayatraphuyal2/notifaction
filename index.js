import admin from "firebase-admin";
import fetch from "node-fetch";
import fs from "fs";

// 🔐 Load Firebase service account
const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceAccountKey.json", "utf8")
);

// 🔥 Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// 🧠 Memory store (FREE, simple, works)
let sentLinks = new Set();

// 📰 YOUR NEWS API URL
const NEWS_API_URL = "https://api-for-test-8nmw.onrender.com/news";
// OR your own backend URL
// const NEWS_API_URL = "https://your-backend.onrender.com/news";

async function checkNewsAndNotify() {
  try {
    console.log("🔍 Checking news...");

    const res = await fetch(NEWS_API_URL);
    const data = await res.json();

    const articles = data.articles || [];

    for (const article of articles) {
      const link = article.link || article.url;
      if (!link) continue;

      // 🚫 Skip already sent news
      if (sentLinks.has(link)) continue;

      // 🔔 SEND PUSH NOTIFICATION
      await admin.messaging().send({
        topic: "news", // Flutter users subscribe to this
        notification: {
          title: article.title,
          body: article.description?.substring(0, 120) || "New News Update",
        },
        data: {
          link: link,
          source: article.source || "",
        },
        android: {
          priority: "high",
        },
      });

      console.log("📢 Sent:", article.title);

      // ✅ Mark as sent
      sentLinks.add(link);
    }

    // 🧹 Keep memory small
    if (sentLinks.size > 300) {
      sentLinks = new Set([...sentLinks].slice(-150));
    }

  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

// ⏱ Run every 5 minutes
setInterval(checkNewsAndNotify, 5 * 60 * 1000);

// 🚀 Run immediately on start
checkNewsAndNotify();

console.log("🚀 News Push Backend Running...");
