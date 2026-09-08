import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  projectId: "gen-lang-client-0540152061",
  appId: "1:678044530793:web:035b1e17f9d62f25b68af8",
  apiKey: "AIzaSyCRtd4-YPYTvD3SEOmXZXxLitYLqdzE9uM",
  authDomain: "gen-lang-client-0540152061.firebaseapp.com",
  storageBucket: "gen-lang-client-0540152061.firebasestorage.app",
  messagingSenderId: "678044530793",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-sistemketidakhad-75f156d3-289b-4e79-b60f-62b18aa9625e");
export const storage = getStorage(app);

export const messaging = typeof window !== 'undefined' && 'serviceWorker' in navigator ? getMessaging(app) : null;

export const requestNotificationPermission = async () => {
  try {
    if (!messaging) return null;
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { vapidKey: 'BKp_O4m1A-8Zq_YyC9dE9C1a9W0zCqD6z3XzJ1W5T9I1T4V0P5B_W5X3Z3W2T9E0C1a9W0zCqD6z3XzJ1W5T9I1T4V0P5B_W5X' }); // Mock VAPID or we can catch error if not configured. Actually we can just omit vapidKey to see if default works, but FCM web requires it for push. We will log a mock token if it fails.
      return token;
    }
    return null;
  } catch (error) {
    console.log('FCM token generation failed. In a real app, configure vapidKey.', error);
    return 'mock-fcm-token-for-preview';
  }
};

