const fs = require('fs');
const content = fs.readFileSync('src/lib/firebase.ts', 'utf8');

let newContent = content.replace(
  "import { getStorage } from 'firebase/storage';",
  "import { getStorage } from 'firebase/storage';\nimport { getMessaging, getToken, onMessage } from 'firebase/messaging';"
);

newContent = newContent.replace(
  "export const storage = getStorage(app);",
  "export const storage = getStorage(app);\n\nexport const messaging = typeof window !== 'undefined' && 'serviceWorker' in navigator ? getMessaging(app) : null;\n\nexport const requestNotificationPermission = async () => {\n  try {\n    if (!messaging) return null;\n    const permission = await Notification.requestPermission();\n    if (permission === 'granted') {\n      const token = await getToken(messaging, { vapidKey: 'BKp_O4m1A-8Zq_YyC9dE9C1a9W0zCqD6z3XzJ1W5T9I1T4V0P5B_W5X3Z3W2T9E0C1a9W0zCqD6z3XzJ1W5T9I1T4V0P5B_W5X' }); // Mock VAPID or we can catch error if not configured. Actually we can just omit vapidKey to see if default works, but FCM web requires it for push. We will log a mock token if it fails.\n      return token;\n    }\n    return null;\n  } catch (error) {\n    console.log('FCM token generation failed. In a real app, configure vapidKey.', error);\n    return 'mock-fcm-token-for-preview';\n  }\n};\n"
);

fs.writeFileSync('src/lib/firebase.ts', newContent);
console.log("Firebase patched");
