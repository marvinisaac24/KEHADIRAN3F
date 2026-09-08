import { useState, useEffect } from 'react';

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
  { id: '007', name: 'CARLISSA ABEL ANAK MATHEW ALIN', class: '3 Fleksibel' },
  { id: '008', name: 'CLAYRIANCE JUMAN NGAU', class: '3 Fleksibel' },
  { id: '009', name: 'DANIEL EDEN ANAK DOMENIC BANGKAM', class: '3 Fleksibel' },
  { id: '010', name: 'DEAN MORICE ANAK MECHELLE', class: '3 Fleksibel' },
  { id: '011', name: 'EDLYSHA YOVELA GRACE ANAK EDDIE SHIVA', class: '3 Fleksibel' },
  { id: '012', name: 'EERANDEL EDHAN ESTEFAN', class: '3 Fleksibel' },
  { id: '013', name: 'EKLYSIA JULIA ANAK MERINGAI', class: '3 Fleksibel' },
  { id: '014', name: 'FERYCA ANGGELA ANAK USIN', class: '3 Fleksibel' },
  { id: '015', name: 'GLENCARLSON BIGAR ANAK GARYNICHOL', class: '3 Fleksibel' },
  { id: '016', name: 'JOHANES ANAK JUNAS', class: '3 Fleksibel' },
  { id: '017', name: 'JOHN AMBROSE ANAK SIDI', class: '3 Fleksibel' },
  { id: '018', name: 'KYSON YONG SENG CHIET', class: '3 Fleksibel' },
  { id: '019', name: 'LUKE SAMGARRYAN RILIAN', class: '3 Fleksibel' },
  { id: '020', name: 'MCFREDLY DARRELL PATRICK', class: '3 Fleksibel' },
  { id: '021', name: 'MICHELL GWENDOLYN ANAK MCTYNDALE', class: '3 Fleksibel' },
  { id: '022', name: 'MIKE MICHAEL ANAK TRISA', class: '3 Fleksibel' },
  { id: '023', name: 'MOHAMMAD ISAAQ BIN ABDULLAH', class: '3 Fleksibel' },
  { id: '024', name: 'MOHAMMAD QALEEF ABARANG BIN APRIANSYAH ABARANG', class: '3 Fleksibel' },
  { id: '025', name: 'MUHAMMAD ANIQ BIN HUSLI', class: '3 Fleksibel' },
  { id: '026', name: 'MUHAMMAD AQIL DANISSH BIN JAKERON', class: '3 Fleksibel' },
  { id: '027', name: 'MUHAMMAD QHALEEF ADZHARIFFIN BIN ABDULLAH', class: '3 Fleksibel' },
  { id: '028', name: 'NAURA BATRISYA BINTI AZERI', class: '3 Fleksibel' },
  { id: '029', name: 'NUR QAIREN QISYA BINTI SULAIMAN', class: '3 Fleksibel' },
  { id: '030', name: 'NURUL AIN ANGIT BINTI ABDULLAH', class: '3 Fleksibel' },
  { id: '031', name: 'NURUL IMAN BINTI ABU HASSAN', class: '3 Fleksibel' },
  { id: '032', name: 'RICHALNEYLA RANJAR ANAK LEONARD EMPATI', class: '3 Fleksibel' },
  { id: '033', name: 'VALENTINA JULIET ANAK CAPPERY', class: '3 Fleksibel' },
  { id: '034', name: 'VETHRIZ ANAK TONY', class: '3 Fleksibel' }
];

export const getStudentsList = (): Student[] => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('admin_students');
    if (saved) return JSON.parse(saved) as Student[];
  }
  return defaultStudents;
};

export const studentsList = getStudentsList();

export const useStudents = () => {
  const [students, setStudents] = useState<Student[]>(getStudentsList());

  useEffect(() => {
    const handleStorageChange = () => {
      setStudents(getStudentsList());
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('students_updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('students_updated', handleStorageChange);
    };
  }, []);

  return students;
};


