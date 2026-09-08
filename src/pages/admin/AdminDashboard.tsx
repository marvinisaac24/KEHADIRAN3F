import React, { useState, useEffect } from 'react';
import { Users, BookOpen, AlertTriangle, TrendingUp, Clock, FileText, Image as ImageIcon, X, CheckCircle2, XCircle, Filter, CalendarCheck } from 'lucide-react';
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { db } from '../../lib/firebase';
import { parseAbsenceDate, formatAbsenceDate, formatDateTime } from '../../lib/dateUtils';

export function AdminDashboard() {
  const [pendingAbsences, setPendingAbsences] = useState<any[]>([]);
  const [approvalHistory, setApprovalHistory] = useState<any[]>([]);
  const [activeApprovalTab, setActiveApprovalTab] = useState<'pending' | 'history'>('pending');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Diluluskan' | 'Ditolak'>('all');
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      // Fetch all absences to get complete approval records and analytics
      const q = query(collection(db, 'absences'));
      const snapshot = await getDocs(q);
      const allDocs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // 1. Pending absences
      const pending = allDocs.filter((d: any) => d.status === 'Menunggu Kelulusan');
      pending.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      setPendingAbsences(pending);

      // 2. Processed approval records (Diluluskan & Ditolak)
      const history = allDocs.filter((d: any) => d.status === 'Diluluskan' || d.status === 'Ditolak');
      history.sort((a: any, b: any) => {
        const timeA = new Date(a.approvedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.approvedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      setApprovalHistory(history);

      // 3. Dynamic Chart Data for Approved Absences by Date
      const approved = allDocs.filter((d: any) => d.status === 'Diluluskan');
      const dateCounts: Record<string, { count: number; displayLabel: string; sortKey: string }> = {};

      approved.forEach((record: any) => {
        const parsed = parseAbsenceDate(record.date);
        if (parsed) {
          const sortKey = `${parsed.year}-${String(parsed.month).padStart(2, '0')}-${String(parsed.day).padStart(2, '0')}`;
          const displayLabel = `${String(parsed.day).padStart(2, '0')}/${String(parsed.month).padStart(2, '0')}`;
          if (!dateCounts[sortKey]) {
            dateCounts[sortKey] = { count: 0, displayLabel, sortKey };
          }
          dateCounts[sortKey].count += 1;
        }
      });

      // Sort chronological and take the latest 14 active days
      const sortedChartEntries = Object.keys(dateCounts)
        .sort()
        .slice(-14)
        .map(key => ({
          date: dateCounts[key].displayLabel,
          jumlah: dateCounts[key].count
        }));

      setChartData(sortedChartEntries);
    } catch (err) {
      console.error('Error fetching dashboard records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string, parentId?: string, studentName?: string) => {
    try {
      const nowIso = new Date().toISOString();
      await updateDoc(doc(db, 'absences', id), {
        status: newStatus,
        approvedAt: nowIso,
        approvedBy: 'Pentadbir'
      });

      // Refresh list
      await fetchRecords();

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
  const approvedTotal = approvalHistory.filter(h => h.status === 'Diluluskan').length;

  const stats = [
    { label: "Jumlah Pelajar", value: 34, icon: Users, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
    { label: "Jumlah Kelas", value: 1, icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-100 dark:bg-indigo-900/30" },
    { label: "Rekod Diluluskan", value: approvedTotal, icon: CalendarCheck, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30" },
    { label: "Menunggu Kelulusan", value: pendingAbsences.length, icon: Clock, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30" },
  ];

  const filteredHistory = approvalHistory.filter(record => {
    if (statusFilter === 'all') return true;
    return record.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white">Pratonton Lampiran (MC / Surat)</h3>
              <button onClick={() => setPreviewImage(null)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 flex justify-center bg-slate-50 dark:bg-slate-900/50">
              {previewImage.startsWith('data:image') || previewImage.includes('.png') || previewImage.includes('.jpg') || previewImage.includes('.jpeg') ? (
                <img src={previewImage} alt="Attachment" className="max-w-full h-auto object-contain rounded-lg border border-slate-200 dark:border-slate-700" />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <FileText className="w-16 h-16 mb-4 text-slate-400" />
                  <p>Format fail atau dokumen lampiran.</p>
                  <a href={previewImage} download="lampiran" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                    Muat Turun Fail
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Papan Pemuka Pentadbir</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Pengurusan kelulusan permohonan ketidakhadiran dan laporan analitik murid
        </p>
      </div>
      
      {absentToday > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-6 flex items-start gap-4 shadow-sm">
          <div className="bg-amber-100 dark:bg-amber-900/50 p-3 rounded-full shrink-0">
            <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-amber-800 dark:text-amber-300">
              {absentToday} Laporan Menunggu Kelulusan
            </h2>
            <p className="text-amber-700/80 dark:text-amber-400/80 mt-1">
              Sila semak permohonan ketidakhadiran murid dalam tab kelulusan di bawah.
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kelulusan & Rekod Ketidakhadiran Murid */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveApprovalTab('pending')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                  activeApprovalTab === 'pending'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Clock className="w-4 h-4" />
                Menunggu Kelulusan
                {pendingAbsences.length > 0 && (
                  <span className="ml-1.5 px-2 py-0.5 text-xs font-bold rounded-full bg-red-500 text-white">
                    {pendingAbsences.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveApprovalTab('history')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                  activeApprovalTab === 'history'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <CalendarCheck className="w-4 h-4" />
                Rekod Kelulusan ({approvalHistory.length})
              </button>
            </div>

            {activeApprovalTab === 'history' && (
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 p-1 rounded-lg text-xs">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2 py-1 rounded font-medium ${statusFilter === 'all' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setStatusFilter('Diluluskan')}
                  className={`px-2 py-1 rounded font-medium ${statusFilter === 'Diluluskan' ? 'bg-white dark:bg-slate-800 text-green-600 dark:text-green-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
                >
                  Diluluskan
                </button>
                <button
                  onClick={() => setStatusFilter('Ditolak')}
                  className={`px-2 py-1 rounded font-medium ${statusFilter === 'Ditolak' ? 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
                >
                  Ditolak
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-1">
            {loading ? (
              <div className="text-center py-12 text-slate-500">Memuatkan data rekod...</div>
            ) : activeApprovalTab === 'pending' ? (
              pendingAbsences.length > 0 ? (
                pendingAbsences.map(record => (
                  <div key={record.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{record.studentName}</span>
                        {record.studentClass && (
                          <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                            {record.studentClass}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <span className="font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                          {record.reason}
                        </span>
                        <span>Tarikh Tidak Hadir: <strong className="text-slate-800 dark:text-slate-200">{formatAbsenceDate(record.date)}</strong></span>
                        {record.attachmentUrl && (
                          <button 
                            onClick={() => setPreviewImage(record.attachmentUrl)}
                            className="flex items-center text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium ml-1"
                          >
                            <ImageIcon className="w-3.5 h-3.5 mr-1" /> Lampiran
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={() => handleUpdateStatus(record.id, 'Diluluskan', record.parentId, record.studentName)} 
                        className="inline-flex items-center px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Lulus
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(record.id, 'Ditolak', record.parentId, record.studentName)} 
                        className="inline-flex items-center px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Tolak
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-green-500 mb-2 opacity-60" />
                  <p className="font-medium text-slate-700 dark:text-slate-300">Tiada permohonan yang menunggu kelulusan</p>
                  <p className="text-xs text-slate-500 mt-1">Semua permohonan ketidakhadiran telah diproses.</p>
                </div>
              )
            ) : (
              /* Rekod Kelulusan (Diluluskan & Ditolak) */
              filteredHistory.length > 0 ? (
                filteredHistory.map(record => {
                  const isApproved = record.status === 'Diluluskan';
                  return (
                    <div key={record.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/40">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{record.studentName}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                            isApproved
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                          }`}>
                            {record.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                          <span>Tarikh Tidak Hadir: <strong>{formatAbsenceDate(record.date)}</strong></span>
                          <span>Sebab: <span className="font-medium text-slate-700 dark:text-slate-300">{record.reason}</span></span>
                          {record.approvedAt && (
                            <span className="text-slate-400 dark:text-slate-500">
                              Diluluskan pada: {formatDateTime(record.approvedAt)}
                            </span>
                          )}
                          {record.attachmentUrl && (
                            <button 
                              onClick={() => setPreviewImage(record.attachmentUrl)}
                              className="flex items-center text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium"
                            >
                              <ImageIcon className="w-3.5 h-3.5 mr-1" /> Lihat Lampiran
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isApproved ? (
                          <button
                            onClick={() => handleUpdateStatus(record.id, 'Ditolak', record.parentId, record.studentName)}
                            className="px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded border border-red-200 dark:border-red-800 transition-colors"
                          >
                            Tukar ke Tolak
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(record.id, 'Diluluskan', record.parentId, record.studentName)}
                            className="px-2.5 py-1.5 text-xs text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded border border-green-200 dark:border-green-800 transition-colors"
                          >
                            Tukar ke Lulus
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                  <p className="text-sm">Tiada rekod kelulusan dengan tapisan ini.</p>
                </div>
              )
            )}
          </div>
        </div>

        {/* Laporan Analitik Ketidakhadiran Diluluskan */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Analisis Ketidakhadiran Diluluskan</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Statistik mengikut tarikh ketidakhadiran yang telah diluluskan
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                {approvedTotal} Diluluskan
              </span>
            </div>

            {chartData.length > 0 ? (
              <div className="w-full h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip 
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(val: any) => [`${val} Murid`, 'Tidak Hadir Diluluskan']}
                    />
                    <Bar dataKey="jumlah" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[280px] flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                <FileText className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm font-medium">Tiada data ketidakhadiran diluluskan</p>
                <p className="text-xs text-slate-500 mt-1">Luluskan permohonan untuk menjana graf analitik.</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/70 text-xs text-slate-500 flex justify-between">
            <span>Jumlah Laporan Diproses: {approvalHistory.length}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              Kadar Kelulusan: {approvalHistory.length > 0 ? Math.round((approvedTotal / approvalHistory.length) * 100) : 100}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

