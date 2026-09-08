import React, { useState, useEffect, useMemo } from 'react';
import { Users, CheckCircle, Clock, AlertTriangle, FileText, UserCheck, AlertCircle } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useStudents } from '../../lib/students';

export function TeacherDashboard() {
  const studentsList = useStudents();

  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchSync = () => {
      const syncDate = localStorage.getItem('last_csv_upload');
      setLastSyncDate(syncDate);
    };
    fetchSync();
    window.addEventListener('csv_uploaded', fetchSync);
    return () => window.removeEventListener('csv_uploaded', fetchSync);
  }, []);

  const isSyncRequired = useMemo(() => {
    if (!lastSyncDate) return true;
    const parsedDate = new Date(lastSyncDate);
    if (isNaN(parsedDate.getTime())) return true;
    const diffHours = (new Date().getTime() - parsedDate.getTime()) / (1000 * 60 * 60);
    return diffHours > 24; // Sync required if older than 24 hours
  }, [lastSyncDate]);

  const [absences, setAbsences] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  const today = new Date();
  const todayStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  const todayIso = today.toISOString().split('T')[0];

  useEffect(() => {
    const fetchTodayAbsences = async () => {
      try {
        const q1 = query(collection(db, 'absences'), where('date', '==', todayIso));
        const q2 = query(collection(db, 'absences'), where('date', '==', todayStr));
        
        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
        const docs = [...snap1.docs.map(d => ({id: d.id, ...d.data()})), ...snap2.docs.map(d => ({id: d.id, ...d.data()}))];
        
        // Remove duplicates if any (due to date format mismatch)
        const uniqueDocs = Array.from(new Map(docs.map(item => [item.id, item])).values()).filter((doc: any) => doc.status !== 'Sistem');
        setAbsences(uniqueDocs);
      } catch (error) {
        console.error("Error fetching today absences:", error);
      }
    };
    fetchTodayAbsences();

    // Listen for pending count
    const qPending = query(collection(db, 'absences'), where('status', '==', 'Menunggu Kelulusan'));
    const unsubscribe = onSnapshot(qPending, (snapshot) => {
      setPendingCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [todayStr, todayIso]);

  const totalStudents = studentsList?.length || 0;
  const presentToday = totalStudents - (absences?.length || 0);

  const stats = [
    { label: "Jumlah Pelajar", value: totalStudents, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Hadir Hari Ini", value: presentToday, icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
    { label: "Menunggu Kelulusan", value: pendingCount, icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
  ];

  const attendanceData = [
    { day: 'Isn', percentage: 94 },
    { day: 'Sel', percentage: 97 },
    { day: 'Rab', percentage: 92 },
    { day: 'Kha', percentage: Math.round((presentToday / totalStudents) * 100) || 98 },
    { day: 'Jum', percentage: 95 },
  ];

  const absenceData = [
    { day: 'Isn', count: Math.round(totalStudents * 0.06) },
    { day: 'Sel', count: Math.round(totalStudents * 0.03) },
    { day: 'Rab', count: Math.round(totalStudents * 0.08) },
    { day: 'Kha', count: absences.length || Math.round(totalStudents * 0.02) },
    { day: 'Jum', count: Math.round(totalStudents * 0.05) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Papan Pemuka Guru</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Kelas: 3 Fleksibel</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
            {today.toLocaleDateString('ms-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          {isSyncRequired ? (
            <div className="flex items-center text-xs font-medium text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800" title="Data kehadiran mungkin belum dikemas kini (Lebih 24 jam yang lalu)">
              <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
              Sila segerak data (Sync Required)
            </div>
          ) : (
            <div className="flex items-center text-xs font-medium text-green-700 bg-green-50 dark:bg-green-900/30 dark:text-green-400 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-800" title={`Dikemas kini pada: ${lastSyncDate && !isNaN(new Date(lastSyncDate).getTime()) ? new Date(lastSyncDate).toLocaleString('ms-MY') : 'Tidak diketahui'}`}>
              <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
              Data disegerak
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center">
              <div className={`w-12 h-12 rounded-full ${stat.bg} ${stat.color} flex items-center justify-center mr-4 shrink-0`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Senarai Ketidakhadiran Hari Ini</h2>
          {absences.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Nama Pelajar</th>
                    <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Sebab</th>
                    <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Status Rekod</th>
                    <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Lampiran</th>
                  </tr>
                </thead>
                <tbody>
                  {absences.map((record) => {
                    let statusIcon = <AlertCircle className="w-5 h-5 text-red-500" />;
                    let statusText = "Tidak Hadir (TH)";
                    let statusClass = "text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400";
                    
                    if (record.attachmentUrl) {
                      if (record.reason === 'Sakit' || record.reason === 'Temujanji Doktor' || (record.reason && record.reason.toUpperCase().includes('SAKIT'))) {
                        statusIcon = <span className="w-6 h-6 inline-flex items-center justify-center bg-amber-100 text-amber-700 font-bold rounded text-xs">S</span>;
                        statusText = "Sijil Sakit";
                        statusClass = "text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400";
                      } else {
                        statusIcon = <span className="w-6 h-6 inline-flex items-center justify-center bg-blue-100 text-blue-700 font-bold rounded text-xs">SR</span>;
                        statusText = "Surat Rasmi";
                        statusClass = "text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400";
                      }
                    }

                    return (
                      <tr key={record.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-900/20">
                        <td className="p-4 text-sm text-slate-900 dark:text-slate-100 font-medium">{record.studentName}</td>
                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{record.reason}</td>
                        <td className="p-4">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusClass}`}>
                            {statusIcon}
                            <span className="ml-2">{statusText}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          {record.attachmentUrl ? (
                            <a href={record.attachmentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
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
          ) : (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
              <UserCheck className="w-12 h-12 mx-auto text-green-500 mb-3 opacity-50" />
              <p className="font-medium">Tiada rekod ketidakhadiran hari ini.</p>
              <p className="text-sm mt-1">Semua pelajar hadir.</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Trend Kehadiran (%)</h2>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    domain={[80, 100]} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`${value}%`, 'Kehadiran']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="percentage" 
                    stroke="#2563eb" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Bilangan Tidak Hadir</h2>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={absenceData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    allowDecimals={false}
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [value, 'Tidak Hadir']}
                  />
                  <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
