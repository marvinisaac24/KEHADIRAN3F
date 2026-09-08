import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

export function ParentHistory() {
  const { userData } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!userData) return;
      try {
        const q = query(
          collection(db, 'absences'), 
          where('parentId', '==', userData.uid),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setHistory(docs);
      } catch (error) {
        console.error("Error fetching history: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [userData]);

  const generateReceipt = (record: any) => {
    const content = `
      <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="text-align: center; color: #1e40af;">RESIT KETIDAKHADIRAN PENGESAHAN</h2>
        <hr style="margin: 20px 0;" />
        <p><strong>Rujukan:</strong> ${record.reference}</p>
        <br />
        <h3>Maklumat Pelajar:</h3>
        <p><strong>Nama:</strong> ${record.studentName}</p>
        <p><strong>Kelas:</strong> ${record.studentClass}</p>
        <br />
        <h3>Butiran Ketidakhadiran:</h3>
        <p><strong>Tarikh Ketidakhadiran:</strong> ${record.date}</p>
        <p><strong>Sebab:</strong> ${record.reason}</p>
        <p><strong>Status:</strong> ${record.status}</p>
        <hr style="margin: 20px 0;" />
        <p style="text-align: center; color: #64748b;">Terima kasih.</p>
      </div>
    `;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(content);
      win.document.close();
      win.print();
    } else {
      alert('Sila benarkan pop-up untuk mencetak resit.');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Memuatkan...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sejarah Ketidakhadiran</h1>
      
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Rujukan</th>
                <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Pelajar</th>
                <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Tarikh Ketidakhadiran</th>
                <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Sebab</th>
                <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Status</th>
                <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Ulasan Guru</th>
                <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Resit</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? history.map((record) => (
                <tr key={record.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-900/20">
                  <td className="p-4 text-sm text-slate-900 dark:text-slate-100 font-medium">{record.reference}</td>
                  <td className="p-4 text-sm text-slate-900 dark:text-slate-100 font-medium">{record.studentName}</td>
                  <td className="p-4 text-sm text-slate-900 dark:text-slate-100 font-medium">{record.date}</td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{record.reason}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      record.status === 'Diluluskan' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                      record.status === 'Ditolak' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{record.comment || '-'}</td>
                  <td className="p-4">
                    <button onClick={() => generateReceipt(record)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">Tiada rekod ketidakhadiran dijumpai.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
