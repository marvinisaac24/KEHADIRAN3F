import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, query, where, getDocs, deleteDoc, writeBatch } from "firebase/firestore";

const firebaseConfig = {
  projectId: "gen-lang-client-0540152061",
  appId: "1:678044530793:web:035b1e17f9d62f25b68af8",
  apiKey: "AIzaSyCRtd4-YPYTvD3SEOmXZXxLitYLqdzE9uM",
  authDomain: "gen-lang-client-0540152061.firebaseapp.com",
  storageBucket: "gen-lang-client-0540152061.firebasestorage.app",
  messagingSenderId: "678044530793",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-sistemketidakhad-75f156d3-289b-4e79-b60f-62b18aa9625e");

const absencesToInsert = [
  { name: 'ALKAYLA CHARLOTTE ANAK ABELL', dates: ['2026-01-19', '2026-01-20', '2026-01-21', '2026-01-22', '2026-01-23'] },
  { name: 'ANGEL LOUISE MADELINA', dates: ['2026-01-15'] },
  { name: 'ANGEL ULAU ELISA LANGAT', dates: ['2026-01-14'] },
  { name: 'BIAHENNY TALI ANAK EDWIN', dates: ['2026-01-28'] },
  { name: 'BIEVELYN AZEERA HOSEN ANAK NANCY', dates: ['2026-01-28'] },
  { name: 'DANIEL EDEN ANAK DOMENIC BANGKAM', dates: ['2026-01-26'] },
  { name: 'JOHN AMBROSE ANAK SIDI', dates: ['2026-01-12'] },
  { name: 'KYSON YONG SENG CHIET', dates: ['2026-01-21', '2026-01-22', '2026-01-28'] },
  { name: 'LUKE SAMGARRYAN RILIAN', dates: ['2026-01-14', '2026-01-15'] },
  { name: 'MCFREDLY DARRELL PATRICK', dates: ['2026-01-29'] },
  { name: 'MIKE MICHAEL ANAK TRISA', dates: ['2026-01-26', '2026-01-28', '2026-01-29'] },
  { name: 'MOHAMMAD ISAAQ BIN ABDULLAH', dates: ['2026-01-19', '2026-01-27'] },
  { name: 'MUHAMMAD AQIL DANISSH BIN JAKERON', dates: ['2026-01-19', '2026-01-27', '2026-01-29'] }
];

async function seed() {
  const batch = writeBatch(db);
  let count = 0;

  // Since we don't have composite index for this query, let's just fetch all and filter client side
  const existingDocs = await getDocs(collection(db, 'absences'));
  
  existingDocs.forEach(doc => {
      const data = doc.data();
      if (data.date && data.date.startsWith('2026-01-')) {
          batch.delete(doc.ref);
      }
  });

  for (const student of absencesToInsert) {
    for (const date of student.dates) {
      const docRef = addDoc.name ? null : null; // we will use batch.set on new refs
      // Wait, let's just use regular batch.set since we don't have addDoc returning a ref directly to batch? 
      // Actually we can use doc(collection(db, 'absences'))
    }
  }
}
// We will just execute it with esbuild/tsx
