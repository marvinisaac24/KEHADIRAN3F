import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { CheckCircle2, XCircle, Clock, Search, Plus, User as UserIcon, Download } from 'lucide-react';

import { useStudents, Student } from '../../lib/students';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, requestNotificationPermission, messaging } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { onMessage } from 'firebase/messaging';

export function ParentDashboard() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const studentsList = useStudents();
  const [myChildrenIds, setMyChildrenIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleDownloadPDF = () => {
    window.print();
  };

  const [absenceStats, setAbsenceStats] = useState<Record<string, { total: number, reasons: Record<string, number> }>>({});

  useEffect(() => {
    const setupFCM = async () => {
      if (userData?.uid) {
        const token = await requestNotificationPermission();
        if (token) {
          try {
            await setDoc(doc(db, 'fcm_tokens', userData.uid), { token, updatedAt: new Date().toISOString() }, { merge: true });
          } catch (err) {
            console.error('Failed to save FCM token:', err);
          }
        }
      }
    };
    setupFCM();
    
    if (messaging) {
      onMessage(messaging, (payload) => {
        console.log('Message received. ', payload);
        alert(`Notifikasi Baru: ${payload.notification?.title} - ${payload.notification?.body}`);
      });
    }

    if (userData?.uid) {
      const saved = localStorage.getItem(`parent_children_${userData.uid}`);
      if (saved) {
        setMyChildrenIds(JSON.parse(saved));
      }
    }
  }, [userData]);

  useEffect(() => {
    const fetchStats = async () => {
      if (myChildrenIds.length === 0) return;
      
      try {
        const stats: Record<string, { total: number, reasons: Record<string, number> }> = {};
        
        for (const id of myChildrenIds) {
          const q = query(
            collection(db, 'absences'),
            where('studentId', '==', id)
          );
          const snap = await getDocs(q);
          
          let total = 0;
          const reasons: Record<string, number> = {};
          
          snap.docs.forEach(doc => {
            total++;
            const data = doc.data();
            reasons[data.reason] = (reasons[data.reason] || 0) + 1;
          });
          
          stats[id] = { total, reasons };
        }
        
        setAbsenceStats(stats);
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    
    fetchStats();
  }, [myChildrenIds]);

  const handleAddChild = (studentId: string) => {
    if (!myChildrenIds.includes(studentId) && userData?.uid) {
      const newIds = [...myChildrenIds, studentId];
      setMyChildrenIds(newIds);
      localStorage.setItem(`parent_children_${userData.uid}`, JSON.stringify(newIds));
    }
    setSearchTerm('');
    setIsSearching(false);
  };

  const handleRemoveChild = (studentId: string) => {
    if (userData?.uid) {
      const newIds = myChildrenIds.filter(id => id !== studentId);
      setMyChildrenIds(newIds);
      localStorage.setItem(`parent_children_${userData.uid}`, JSON.stringify(newIds));
    }
  };

  const searchResults = searchTerm.length > 0 
    ? studentsList.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) && !myChildrenIds.includes(s.id))
    : studentsList.filter(s => !myChildrenIds.includes(s.id));

  const myChildren = studentsList.filter(s => myChildrenIds.includes(s.id));

  return (
    <div className="space-y-6">
      <div className="flex justify-end print:hidden">
        <button onClick={handleDownloadPDF} className="inline-flex items-center px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
          <Download className="w-4 h-4 mr-2" /> Muat Turun Analisis PDF
        </button>
      </div>
      <div id="parent-report-content" className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Selamat Datang, {userData?.name || 'Ibu Bapa'}</h1>
        
        {!isSearching ? (
          <button 
            onClick={() => setIsSearching(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Anak
          </button>
        ) : (
          <button 
            onClick={() => { setIsSearching(false); setSearchTerm(''); }}
            className="flex items-center px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-300 transition-colors"
          >
            Tutup Carian
          </button>
        )}
      </div>
      
      {isSearching && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 animate-in fade-in slide-in-from-top-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Cari Nama Anak Anda</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Masukkan nama penuh atau separuh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          
          <div className="mt-4 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
            {searchResults.length > 0 ? searchResults.map(student => (
                <div key={student.id} className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700 last:border-0">
                  <div>
                    <p className="font-medium text-sm text-slate-900 dark:text-white">{student.name}</p>
                    <p className="text-xs text-slate-500">{student.class}</p>
                  </div>
                  <button 
                    onClick={() => handleAddChild(student.id)}
                    className="px-3 py-1 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                  >
                    Pilih
                  </button>
                </div>
              )) : (
                <div className="p-4 text-center text-sm text-slate-500">Tiada padanan dijumpai.</div>
              )}
            </div>
        </div>
      )}

      {myChildren.length === 0 && !isSearching ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 shadow-sm border border-slate-100 dark:border-slate-700 text-center">
          <UserIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Tiada rekod anak</h2>
          <p className="text-slate-500 mb-6">Sila cari dan tambah rekod anak anda untuk melaporkan ketidakhadiran.</p>
          <button 
            onClick={() => setIsSearching(true)}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Search className="w-5 h-5 mr-2" />
            Cari Anak Anda
          </button>
        </div>
      ) : null}

      {myChildren.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Senarai Anak Anda</h2>
          <div className="space-y-4">
            {myChildren.map((student) => {
              const stats = absenceStats[student.id] || { total: 0, reasons: {} };
              
              return (
                <div key={student.id} className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 border border-slate-100 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                  <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-slate-700 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-2xl shrink-0">
                    {student.name.charAt(0)}
                  </div>
                  
                  <div className="flex-1 text-center sm:text-left space-y-3">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{student.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Kelas: {student.class}</p>
                    </div>
                    
                    {/* Rumusan Kehadiran */}
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 inline-block text-left w-full sm:w-auto">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Rumusan Ketidakhadiran</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 font-bold">
                            {stats.total}
                          </div>
                          <span className="text-slate-700 dark:text-slate-300 font-medium">Hari Tidak Hadir</span>
                        </div>
                      </div>
                      {stats.total > 0 && (
                        <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                          <strong>Sebab:</strong> {Object.entries(stats.reasons).map(([reason, count]) => `${reason} (${count})`).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                    <button 
                      onClick={() => navigate(`/parent/report-absence?studentId=${student.id}`)}
                      className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Lapor Ketidakhadiran
                    </button>
                    <button 
                      onClick={() => navigate(`/parent/history`)}
                      className="w-full flex items-center justify-center px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Rekod Pengisian
                    </button>
                    <button 
                      onClick={() => handleRemoveChild(student.id)}
                      className="w-full text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mt-2"
                    >
                      Buang dari senarai
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
