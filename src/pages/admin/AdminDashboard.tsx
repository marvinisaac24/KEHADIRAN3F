import React, { useState, useEffect } from 'react';
import { Users, BookOpen, AlertTriangle, TrendingUp, Clock, FileText, Image as ImageIcon, X } from 'lucide-react';
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { db } from '../../lib/firebase';

export function AdminDashboard() {
  const [pendingAbsences, setPendingAbsences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const approvedQ = query(
          collection(db, 'absences'),
          where('status', '==', 'Diluluskan')
        );
        const approvedSnapshot = await getDocs(approvedQ);
        const dateCounts: Record<string, number> = {};
        approvedSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.date && data.date.startsWith('2026-01-')) {
            dateCounts[data.date] = (dateCounts[data.date] || 0) + 1;
          }
        });
        const formattedData = Object.keys(dateCounts).sort().map(date => ({
          date: date.substring(8, 10) + ' Jan',
          jumlah: dateCounts[date]
        }));
        setChartData(formattedData);
      } catch (err) {
        console.error('Error fetching chart data:', err);
      }

      try {
        const q = query(
          collection(db, 'absences'),
          where('status', '==', 'Menunggu Kelulusan')
        );
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        docs.sort((a: any, b: any) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
        setPendingAbsences(docs);
      } catch (error) {
        console.error("Error fetching pending absences: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPending();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string, parentId?: string, studentName?: string) => {
    try {
      await updateDoc(doc(db, 'absences', id), {
        status: newStatus
      });
      setPendingAbsences(prev => prev.filter(record => record.id !== id));

      // Send FCM notification to parent
      if (parentId) {
        try {
          const tokenDoc = await getDoc(doc(db, 'fcm_tokens', parentId));
          if (tokenDoc.exists()) {
            const { token } = tokenDoc.data();
            if (token) {
              fetch('/api/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  token,
                  title: `Status Laporan: ${newStatus}`,
                  body: `Laporan ketidakhadiran untuk ${studentName || 'anak anda'} telah ${newStatus.toLowerCase()}.`
                })
              }).catch(console.error);
            }
          }
        } catch (err) {
          console.error('Error sending notification', err);
        }
      }
    } catch (error) {
      console.error("Error updating status: ", error);
      alert('Gagal mengemas kini status.');
    }
  };

  const absentToday = pendingAbsences.length;

  const stats = [
    { label: "Jumlah Pelajar", value: 34, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Jumlah Kelas", value: 1, icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-100" },
    { label: "Kehadiran Keseluruhan", value: "94%", icon: TrendingUp, color: "text-green-600", bg: "bg-green-100" },
    { label: "Menunggu Kelulusan", value: pendingAbsences.length, icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
  ];

  return (
    <div className="space-y-6">
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white">Pratonton Lampiran (MC)</h3>
              <button onClick={() => setPreviewImage(null)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 flex justify-center bg-slate-50 dark:bg-slate-900/50">
              {previewImage.startsWith('data:image') ? (
                <img src={previewImage} alt="Attachment" className="max-w-full h-auto object-contain rounded-lg border border-slate-200 dark:border-slate-700" />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <FileText className="w-16 h-16 mb-4 text-slate-400" />
                  <p>Format fail tidak disokong untuk pratonton langsung.</p>
                  <a href={previewImage} download="lampiran" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                    Muat Turun
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Papan Pemuka Pentadbir</h1>
      
      {absentToday > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl p-6 flex items-start gap-4 shadow-sm">
          <div className="bg-red-100 dark:bg-red-900/50 p-3 rounded-full shrink-0">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-red-700 dark:text-red-400">
              {absentToday} Pelajar Melaporkan Ketidakhadiran
            </h2>
            <p className="text-red-600/80 dark:text-red-400/80 mt-1">
              Sila semak senarai kelulusan di bawah.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Menunggu Kelulusan</h2>
          <div className="space-y-4">
            {loading ? (
              <p className="text-slate-500">Memuatkan...</p>
            ) : pendingAbsences.length > 0 ? (
              pendingAbsences.map(record => (
                <div key={record.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{record.studentName}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-600 dark:text-slate-400">
                      <span className="font-medium bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">{record.reason}</span>
                      <span>{record.date}</span>
                      {record.attachmentUrl && (
                        <button 
                          onClick={() => setPreviewImage(record.attachmentUrl)}
                          className="flex items-center text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          <ImageIcon className="w-4 h-4 mr-1" /> Lihat Lampiran
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleUpdateStatus(record.id, 'Diluluskan', record.parentId, record.studentName)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
                      Lulus
                    </button>
                    <button onClick={() => handleUpdateStatus(record.id, 'Ditolak', record.parentId, record.studentName)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
                      Tolak
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500">Tiada laporan yang menunggu kelulusan.</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 flex flex-col items-center justify-center min-h-[300px]">
          {chartData.length > 0 ? (
            <div className="w-full h-full min-h-[300px]">
              <h3 className="text-sm font-medium text-slate-500 mb-4 text-center">Analisis Ketidakhadiran Harian (Januari 2026)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="jumlah" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-slate-500">Tiada data analisis bulan ini.</p>
          )}
        </div>
      </div>
    </div>
  );
}
