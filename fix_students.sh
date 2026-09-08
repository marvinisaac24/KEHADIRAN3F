#!/bin/bash
cat << 'INNER_EOF' > src/lib/students.ts
import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, writeBatch, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

export interface Student {
  id: string;
  name: string;
  class: string;
}

const defaultStudents = [
  { id: '001', name: 'ABDUL ALYAN BIN ABDUL RAHIM', class: '3 Fleksibel' },
  { id: '002', name: 'ALKAYLA CHARLOTTE ANAK ABELL', class: '3 Fleksibel' },
  { id: '003', name: 'ANDREAS MARSHALL ANAK WELLDER', class: '3 Fleksibel' },
  { id: '004', name: 'ANGEL LOUISE MADELINA', class: '3 Fleksibel' },
  { id: '005', name: 'ANGEL ULAU ELISA LANGAT', class: '3 Fleksibel' },
  { id: '006', name: 'BIAHENNY TALI ANAK EDWIN', class: '3 Fleksibel' },
  { id: '007', name: 'BIEVELYN AZEERA HOSEN ANAK NANCY', class: '3 Fleksibel' },
  { id: '008', name: 'CARLISSA ABEL ANAK MATHEW ALIN', class: '3 Fleksibel' },
  { id: '009', name: 'CLAYRIANCE JUMAN NGAU', class: '3 Fleksibel' },
  { id: '010', name: 'DANIEL EDEN ANAK DOMENIC BANGKAM', class: '3 Fleksibel' },
  { id: '011', name: 'DEAN MORICE ANAK MECHELLE', class: '3 Fleksibel' },
  { id: '012', name: 'EDLYSHA YOVELA GRACE ANAK EDDIE SHIVA', class: '3 Fleksibel' },
  { id: '013', name: 'EERANDEL EDHAN ESTEFAN', class: '3 Fleksibel' },
  { id: '014', name: 'EKLYSIA JULIA ANAK MERINGAI', class: '3 Fleksibel' },
  { id: '015', name: 'FERYCA ANGGELA ANAK USIN', class: '3 Fleksibel' },
  { id: '016', name: 'GEORGE ONEIL ANAK NICOLE DASI', class: '3 Fleksibel' },
  { id: '017', name: 'GLENCARLSON BIGAR ANAK GARYNICHOL', class: '3 Fleksibel' },
  { id: '018', name: 'JOHANES ANAK JUNAS', class: '3 Fleksibel' },
  { id: '019', name: 'JOHN AMBROSE ANAK SIDI', class: '3 Fleksibel' },
  { id: '020', name: 'KYSON YONG SENG CHIET', class: '3 Fleksibel' },
  { id: '021', name: 'LUKE SAMGARRYAN RILIAN', class: '3 Fleksibel' },
  { id: '022', name: 'MCFREDLY DARRELL PATRICK', class: '3 Fleksibel' },
  { id: '023', name: 'MICHELL GWENDOLYN ANAK MCTYNDALE', class: '3 Fleksibel' },
  { id: '024', name: 'MIKE MICHAEL ANAK TRISA', class: '3 Fleksibel' },
  { id: '025', name: 'MOHAMMAD ISAAQ BIN ABDULLAH', class: '3 Fleksibel' },
  { id: '026', name: 'MUHAMMAD ANIQ BIN HUSLI', class: '3 Fleksibel' },
  { id: '027', name: 'MUHAMMAD AQIL DANISSH BIN JAKERON', class: '3 Fleksibel' },
  { id: '028', name: 'MUHAMMAD QHALEEF ADZHARIFFIN BIN ABDULLAH', class: '3 Fleksibel' },
  { id: '029', name: 'NAURA BATRISYA BINTI AZERI', class: '3 Fleksibel' },
  { id: '030', name: 'NUR QAIREN QISYA BINTI SULAIMAN', class: '3 Fleksibel' },
  { id: '031', name: 'NURUL AIN ANGIT BINTI ABDULLAH', class: '3 Fleksibel' },
  { id: '032', name: 'NURUL IMAN BINTI ABU HASSAN', class: '3 Fleksibel' },
  { id: '033', name: 'RICHALNEYLA RANJAR ANAK LEONARD EMPATI', class: '3 Fleksibel' },
  { id: '034', name: 'VALENTINA JULIET ANAK CAPPERY', class: '3 Fleksibel' },
  { id: '035', name: 'VETHRIZ ANAK TONY', class: '3 Fleksibel' },
  { id: '036', name: 'SHARON BIAH ANDOVERNA UREI', class: '3 Fleksibel' }
];

export const getStudentsList = (): Student[] => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('admin_students');
    if (saved) return JSON.parse(saved) as Student[];
  }
  return defaultStudents;
};

export const studentsList = getStudentsList();

let globalStudents: Student[] | null = null;
let subscribers: ((students: Student[]) => void)[] = [];
let initialized = false;

const seedAllAbsences = async () => {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem('absences_seeded_jan_apr_v2')) return;

  try {
    console.log('Seeding Jan-Apr absences...');
    
    // First, clear existing absences to ensure exact match with PDF data
    const q = query(collection(db, 'absences'));
    const snap = await getDocs(q);
    
    if (!snap.empty) {
      console.log('Clearing existing absences...');
      const deleteBatch = writeBatch(db);
      snap.docs.forEach(d => deleteBatch.delete(d.ref));
      await deleteBatch.commit();
    }

    const absencesToSeed = [
      // JANUARI (12,13,14,15,16, 19,20,21,22,23, 26,27,28,29,30)
      { id: '002', date: '19/01/2026' }, { id: '002', date: '20/01/2026' }, { id: '002', date: '21/01/2026' }, { id: '002', date: '22/01/2026' }, { id: '002', date: '23/01/2026' },
      { id: '004', date: '15/01/2026' },
      { id: '005', date: '14/01/2026' },
      { id: '006', date: '28/01/2026' },
      { id: '010', date: '26/01/2026' },
      { id: '019', date: '12/01/2026' },
      { id: '020', date: '22/01/2026' }, { id: '020', date: '23/01/2026' }, { id: '020', date: '28/01/2026' },
      { id: '021', date: '14/01/2026' }, { id: '021', date: '15/01/2026' },
      { id: '022', date: '29/01/2026' },
      { id: '024', date: '26/01/2026' }, { id: '024', date: '28/01/2026' }, { id: '024', date: '29/01/2026' },
      { id: '025', date: '19/01/2026' }, { id: '025', date: '28/01/2026' },
      { id: '027', date: '19/01/2026' }, { id: '027', date: '27/01/2026' }, { id: '027', date: '29/01/2026' },
      
      // FEBRUARI (02,03,04,05,06, 09,10,11,12,13, 23,24,25,26,27)
      { id: '001', date: '09/02/2026' }, { id: '001', date: '10/02/2026' },
      { id: '002', date: '03/02/2026' },
      { id: '004', date: '03/02/2026' },
      { id: '005', date: '09/02/2026' },
      { id: '008', date: '13/02/2026' },
      { id: '011', date: '02/02/2026' },
      { id: '012', date: '25/02/2026' },
      { id: '014', date: '23/02/2026' }, { id: '014', date: '24/02/2026' },
      { id: '015', date: '02/02/2026' }, { id: '015', date: '09/02/2026' }, { id: '015', date: '13/02/2026' },
      { id: '019', date: '02/02/2026' },
      { id: '020', date: '02/02/2026' },
      { id: '021', date: '05/02/2026' },
      { id: '022', date: '04/02/2026' }, { id: '022', date: '11/02/2026' }, { id: '022', date: '23/02/2026' }, { id: '022', date: '24/02/2026' }, { id: '022', date: '26/02/2026' },
      { id: '024', date: '11/02/2026' },
      { id: '025', date: '09/02/2026' },
      { id: '026', date: '24/02/2026' },
      { id: '027', date: '05/02/2026' }, { id: '027', date: '27/02/2026' },
      { id: '035', date: '03/02/2026' }, { id: '035', date: '04/02/2026' },
      
      // MAC (02,03,04,05,06, 09,10,11,12,13, 23,24,25,26)
      { id: '003', date: '02/03/2026' }, { id: '003', date: '03/03/2026' },
      { id: '004', date: '02/03/2026' },
      { id: '010', date: '11/03/2026' },
      { id: '011', date: '12/03/2026' },
      { id: '018', date: '09/03/2026' },
      { id: '021', date: '06/03/2026' }, { id: '021', date: '09/03/2026' },
      { id: '022', date: '24/03/2026' },
      { id: '023', date: '10/03/2026' },
      { id: '024', date: '13/03/2026' },
      { id: '026', date: '25/03/2026' },
      { id: '027', date: '23/03/2026' },
      { id: '029', date: '04/03/2026' },
      { id: '030', date: '02/03/2026' },
      { id: '031', date: '10/03/2026' }, { id: '031', date: '13/03/2026' },
      { id: '032', date: '12/03/2026' },
      
      // APRIL (01,02,03, 06,07,08, 13,14,15,16,17, 20,21,22,23,24, 27,28,29,30)
      { id: '001', date: '16/04/2026' },
      { id: '002', date: '16/04/2026' },
      { id: '003', date: '08/04/2026' },
      { id: '005', date: '03/04/2026' },
      { id: '008', date: '06/04/2026' }, { id: '008', date: '13/04/2026' }, { id: '008', date: '14/04/2026' },
      { id: '009', date: '13/04/2026' }, { id: '009', date: '16/04/2026' }, { id: '009', date: '17/04/2026' },
      { id: '011', date: '21/04/2026' }, { id: '011', date: '27/04/2026' },
      { id: '014', date: '22/04/2026' },
      { id: '015', date: '02/04/2026' }, { id: '015', date: '27/04/2026' },
      { id: '019', date: '28/04/2026' },
      { id: '020', date: '24/04/2026' },
      { id: '021', date: '20/04/2026' }, { id: '021', date: '24/04/2026' },
      { id: '022', date: '03/04/2026' }, { id: '022', date: '13/04/2026' }, { id: '022', date: '14/04/2026' },
      { id: '024', date: '01/04/2026' }, { id: '024', date: '16/04/2026' },
      { id: '026', date: '03/04/2026' },
      { id: '027', date: '08/04/2026' }, { id: '027', date: '14/04/2026' }, { id: '027', date: '21/04/2026' }, { id: '027', date: '22/04/2026' }, { id: '027', date: '27/04/2026' },
      { id: '033', date: '24/04/2026' }, { id: '033', date: '27/04/2026' },
      { id: '034', date: '17/04/2026' },
      { id: '035', date: '13/04/2026' }, { id: '035', date: '14/04/2026' }
    ];

    const insertBatch = writeBatch(db);
    for (const record of absencesToSeed) {
      const student = defaultStudents.find(s => s.id === record.id);
      if (student) {
        const docRef = doc(collection(db, 'absences'));
        const [d, m, y] = record.date.split('/');
        insertBatch.set(docRef, {
          studentId: student.id,
          studentName: student.name,
          date: record.date,
          reason: 'Tiada Sebab (Sistem)',
          status: 'Sistem',
          attachmentUrl: '',
          createdAt: new Date(`${y}-${m}-${d}T08:00:00Z`).toISOString()
        });
      }
    }
    await insertBatch.commit();
    localStorage.setItem('absences_seeded_jan_apr_v2', 'true');
    console.log('Finished seeding absences.');
  } catch (err) {
    console.error('Failed to seed absences:', err);
  }
};

const initFirestore = async () => {
  if (initialized) return;
  initialized = true;

  try {
    const snap = await getDocs(collection(db, 'students'));
    if (snap.empty) {
      console.log('Seeding initial students to Firestore...');
      const batch = writeBatch(db);
      defaultStudents.forEach(s => {
        const ref = doc(db, 'students', s.id);
        batch.set(ref, s);
      });
      await batch.commit();
    } else {
      const existingIds = snap.docs.map(d => d.id);
      const batch = writeBatch(db);
      let added = false;
      defaultStudents.forEach(s => {
        if (!existingIds.includes(s.id)) {
          const ref = doc(db, 'students', s.id);
          batch.set(ref, s);
          added = true;
        }
      });
      if (added) {
        await batch.commit();
        console.log('Added missing students to Firestore.');
      }
    }
    
    // Check and seed absences
    seedAllAbsences();

    onSnapshot(collection(db, 'students'), (snapshot) => {
      const updated: Student[] = [];
      snapshot.forEach(doc => {
        updated.push(doc.data() as Student);
      });
      updated.sort((a, b) => a.name.localeCompare(b.name));
      globalStudents = updated;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_students', JSON.stringify(updated));
      }
      
      subscribers.forEach(cb => cb(updated));
    });
  } catch (error) {
    console.error('Error initializing students from Firestore:', error);
  }
};

initFirestore();

export const useStudents = () => {
  const [students, setStudents] = useState<Student[]>(globalStudents || getStudentsList());

  useEffect(() => {
    const callback = (updated: Student[]) => {
      setStudents(updated);
    };
    subscribers.push(callback);
    
    if (globalStudents) {
      setStudents(globalStudents);
    }
    
    return () => {
      subscribers = subscribers.filter(cb => cb !== callback);
    };
  }, []);

  return students;
};
INNER_EOF
bash fix_students.sh