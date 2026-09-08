const fs = require('fs');
const content = fs.readFileSync('src/pages/parent/ParentDashboard.tsx', 'utf8');

let newContent = content.replace(
  "import { db } from '../../lib/firebase';",
  "import { db, requestNotificationPermission, messaging } from '../../lib/firebase';\nimport { doc, setDoc } from 'firebase/firestore';\nimport { onMessage } from 'firebase/messaging';"
);

// Add useEffect for FCM
newContent = newContent.replace(
  "  useEffect(() => {\n    if (userData?.uid) {",
  "  useEffect(() => {\n    const setupFCM = async () => {\n      if (userData?.uid) {\n        const token = await requestNotificationPermission();\n        if (token) {\n          try {\n            await setDoc(doc(db, 'fcm_tokens', userData.uid), { token, updatedAt: new Date().toISOString() }, { merge: true });\n          } catch (err) {\n            console.error('Failed to save FCM token:', err);\n          }\n        }\n      }\n    };\n    setupFCM();\n    \n    if (messaging) {\n      onMessage(messaging, (payload) => {\n        console.log('Message received. ', payload);\n        alert(`Notifikasi Baru: ${payload.notification?.title} - ${payload.notification?.body}`);\n      });\n    }\n\n    if (userData?.uid) {"
);

fs.writeFileSync('src/pages/parent/ParentDashboard.tsx', newContent);
console.log("ParentDashboard patched");
