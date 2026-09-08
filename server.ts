import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

// Initialize Firebase Admin if Service Account is provided
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initializeApp({
      credential: cert(serviceAccount)
    });
    console.log("Firebase Admin initialized.");
  } catch (err) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT", err);
  }
} else {
  console.log("FIREBASE_SERVICE_ACCOUNT not provided. FCM notifications will be simulated.");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route to send FCM notification
  app.post("/api/notify", async (req, res) => {
    const { token, title, body } = req.body;
    
    if (getApps().length > 0) {
      try {
        await getMessaging().send({
          token,
          notification: { title, body }
        });
        console.log(`[FCM] Notification sent successfully to ${token}`);
        res.json({ success: true, message: "Notification sent." });
      } catch (err) {
        console.error("[FCM] Error sending message:", err);
        res.status(500).json({ success: false, error: "Failed to send notification" });
      }
    } else {
      console.log(`[FCM Mock] Sending notification to ${token}`);
      console.log(`[FCM Mock] Title: ${title}`);
      console.log(`[FCM Mock] Body: ${body}`);
      res.json({ success: true, message: "Notification simulated successfully." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
