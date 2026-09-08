importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCRtd4-YPYTvD3SEOmXZXxLitYLqdzE9uM",
  projectId: "gen-lang-client-0540152061",
  messagingSenderId: "678044530793",
  appId: "1:678044530793:web:035b1e17f9d62f25b68af8",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );
  const notificationTitle = payload.notification?.title || "Sistem Ketidakhadiran";
  const notificationOptions = {
    body: payload.notification?.body,
    icon: "/pwa-512x512.svg",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
