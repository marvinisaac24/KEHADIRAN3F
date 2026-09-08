import React, { useState, useEffect } from 'react';
import { useStudents } from '../../lib/students';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Search, UserCheck, AlertCircle, FileText } from 'lucide-react';

export function TeacherStudents() {
  const studentsList = useStudents();
  const [absences, setAbsences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Get today's date formatted as DD/MM/YYYY
  const today = new Date();
  const todayStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

  useEffect(() => {
    const fetchTodayAbsences = async () => {
      try {
        const q = query(
          collection(db, 'absences'),
          where('date', '==', today.toISOString().split('T')[0]) // The form saves date as YYYY-MM-DD
        );
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(doc => doc.data());
        
        // Also fetch by DD/MM/YYYY just in case
        const q2 = query(
          collection(db, 'absences'),
          where('date', '==', todayStr)
        );
        const snapshot2 = await getDocs(q2);
        const docs2 = snapshot2.docs.map(doc => doc.data());

        setAbsences([...docs, ...docs2]);
      } catch (error) {
        console.error("Error fetching absences:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTodayAbsences();
  }, [todayStr]);

  const filteredStudents = studentsList.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pengurusan Kelas</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Status kehadiran untuk hari ini ({today.toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })})</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="font-semibold text-slate-900 dark:text-white mr-2">Petunjuk Status:</div>
        <span className="flex items-center"><UserCheck className="w-4 h-4 mr-1 text-green-500" /> Hadir (Tiada Laporan)</span>
        <span className="flex items-center"><AlertCircle className="w-4 h-4 mr-1 text-red-500" /> TH - Tidak Hadir (Tiada Lampiran)</span>
        <span className="flex items-center"><span className="w-5 h-5 inline-flex items-center justify-center bg-amber-100 text-amber-700 font-bold rounded text-xs mr-1">S</span> Sijil Sakit</span>
        <span className="flex items-center"><span className="w-5 h-5 inline-flex items-center justify-center bg-blue-100 text-blue-700 font-bold rounded text-xs mr-1">SR</span> Surat Rasmi</span>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Cari nama pelajar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300 w-16 text-center">Bil</th>
                <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Nama Pelajar</th>
                <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Status Hari Ini</th>
                <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Sebab / Catatan</th>
                <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Lampiran</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">Memuatkan data kehadiran...</td>
                </tr>
              ) : filteredStudents.map((student, idx) => {
                // Check if student has absence record for today
                const absenceRecord = absences.find(a => (a.studentId === student.id || a.studentName === student.name) && a.status !== 'Sistem');
                
                let statusIcon = <UserCheck className="w-5 h-5 text-green-500" />;
                let statusText = "Hadir";
                let statusClass = "text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400";
                
                if (absenceRecord) {
                  if (absenceRecord.attachmentUrl) {
                    if (absenceRecord.reason === 'Sakit' || absenceRecord.reason === 'Temujanji Doktor' || absenceRecord.reason.toUpperCase().includes('SAKIT')) {
                      statusIcon = <span className="w-6 h-6 inline-flex items-center justify-center bg-amber-100 text-amber-700 font-bold rounded text-xs">S</span>;
                      statusText = "Sijil Sakit";
                      statusClass = "text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400";
                    } else {
                      statusIcon = <span className="w-6 h-6 inline-flex items-center justify-center bg-blue-100 text-blue-700 font-bold rounded text-xs">SR</span>;
                      statusText = "Surat Rasmi";
                      statusClass = "text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400";
                    }
                  } else {
                    statusIcon = <AlertCircle className="w-5 h-5 text-red-500" />;
                    statusText = "Tidak Hadir (TH)";
                    statusClass = "text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400";
                  }
                }

                return (
                  <tr key={student.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-900/20">
                    <td className="p-4 text-sm text-slate-500 text-center">{idx + 1}</td>
                    <td className="p-4 text-sm text-slate-900 dark:text-slate-100 font-medium">{student.name}</td>
                    <td className="p-4">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusClass}`}>
                        {statusIcon}
                        <span className="ml-2">{statusText}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                      {absenceRecord ? absenceRecord.reason : '-'}
                    </td>
                    <td className="p-4">
                      {absenceRecord?.attachmentUrl ? (
                        <a href={absenceRecord.attachmentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                          <FileText className="w-4 h-4 mr-1" />
                          <span className="text-xs font-medium">Lihat</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
