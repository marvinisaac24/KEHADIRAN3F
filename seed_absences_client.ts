import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, doc, writeBatch, serverTimestamp } from "firebase/firestore";

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

  console.log('Fetching existing absences...');
  const existingDocs = await getDocs(collection(db, 'absences'));
  existingDocs.forEach(d => {
      const data = d.data();
      if (data.date && data.date.startsWith('2026-01-')) {
          batch.delete(d.ref);
      }
  });

  for (const student of absencesToInsert) {
    for (const date of student.dates) {
      const docRef = doc(collection(db, 'absences'));
      batch.set(docRef, {
        studentId: student.name.substring(0, 8),
        studentName: student.name,
        studentClass: '3 Fleksibel',
        date: date,
        reason: 'Sakit (Rekod Januari)',
        status: 'Diluluskan',
        createdAt: new Date(),
        reference: `JAN26-${count}`
      });
      count++;
    }
  }
  
  await batch.commit();
  console.log(`Successfully seeded ${count} absences.`);
}

seed().catch(console.error).finally(() => process.exit(0));
