require('dotenv').config();
const admin = require('firebase-admin');
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) : null;

if (!serviceAccount) {
    console.error("No service account found in environment.");
    process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

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
  const batch = db.batch();
  let count = 0;
  
  // Clean up existing jan absences just in case we run it multiple times
  const existing = await db.collection('absences').where('date', '>=', '2026-01-01').where('date', '<=', '2026-01-31').get();
  existing.forEach(doc => {
      batch.delete(doc.ref);
  });

  for (const student of absencesToInsert) {
    for (const date of student.dates) {
      const docRef = db.collection('absences').doc();
      batch.set(docRef, {
        studentId: student.name.substring(0, 8), // fake id for missing ones, or we can look it up
        studentName: student.name,
        studentClass: '3 Fleksibel',
        date: date,
        reason: 'Sakit (Rekod Januari)',
        status: 'Diluluskan',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        reference: `JAN26-${count}`
      });
      count++;
    }
  }
  
  await batch.commit();
  console.log(`Successfully seeded ${count} absences.`);
}

seed().catch(console.error).finally(() => process.exit(0));
