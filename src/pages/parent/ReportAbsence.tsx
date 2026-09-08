import React, { useState, useRef } from 'react';
import { Upload, MapPin, ArrowLeft, Download, FileText, Image as ImageIcon } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStudents } from '../../lib/students';

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

export function ReportAbsence() {
  const studentsList = useStudents();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [reference, setReference] = useState('');
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { userData } = useAuth();
  
  const studentId = searchParams.get('studentId');
  const student = studentsList.find(s => s.id === studentId);

  const processFile = (selectedFile: File) => {
    // Check file size (max 5MB to avoid Firestore limits)
    if (selectedFile.size > 5 * 1024 * 1024) {
      alert('Saiz fail tidak boleh melebihi 5MB');
      return;
    }
    setFile(selectedFile);
    
    // Read file as Base64 to store in Firestore directly
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setFileDataUrl(e.target.result as string);
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !userData) return;
    
    setLoading(true);
    try {
      const refId = `ABS-${Math.floor(1000 + Math.random() * 9000)}`;

      await addDoc(collection(db, 'absences'), {
        reference: refId,
        studentId: student.id,
        studentName: student.name,
        studentClass: student.class,
        parentId: userData.uid,
        date: date,
        reason: reason,
        attachmentUrl: fileDataUrl || '',
        fileName: file ? file.name : '',
        status: 'Menunggu Kelulusan',
        createdAt: serverTimestamp(),
      });

      // Hantar notifikasi FCM ke guru/admin
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'teacher-admin-topic-or-token',
          title: 'Laporan Ketidakhadiran Baru',
          body: `Pelajar ${student.name} dari kelas ${student.class} tidak hadir pada ${date}. Sebab: ${reason}`
        })
      }).catch(err => console.error('Gagal menghantar notifikasi FCM', err));

      setReference(refId);
      setSuccess(true);
    } catch (error) {
      console.error('Error reporting absence:', error);
      alert('Gagal menghantar laporan. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const generateReceipt = () => {
    if (!student) return;
    const content = `
      <html><head><title>Resit Ketidakhadiran</title></head><body onload="window.print();window.close();">
      <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="text-align: center; color: #1e40af;">RESIT KETIDAKHADIRAN PENGESAHAN</h2>
        <hr style="margin: 20px 0;" />
        <p><strong>Rujukan:</strong> ${reference}</p>
        <p><strong>Tarikh:</strong> ${new Date().toLocaleDateString('ms-MY')}</p>
        <br />
        <h3>Maklumat Pelajar:</h3>
        <p><strong>Nama:</strong> ${student.name}</p>
        <p><strong>Kelas:</strong> ${student.class}</p>
        <br />
        <h3>Butiran Ketidakhadiran:</h3>
        <p><strong>Tarikh Ketidakhadiran:</strong> ${date}</p>
        <p><strong>Sebab:</strong> ${reason}</p>
        <p><strong>Status:</strong> Menunggu Kelulusan</p>
        <hr style="margin: 20px 0;" />
        <p style="text-align: center; color: #64748b;">Terima kasih.</p>
      </div>
      </body></html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
    }
  };

  if (!student) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Pelajar tidak dipilih</h2>
        <button onClick={() => navigate('/parent/dashboard')} className="text-blue-600 hover:underline">
          Kembali ke Papan Pemuka untuk memilih pelajar
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 text-center">
        <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Penghantaran Berjaya</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">Rujukan: {reference}</p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={generateReceipt}
            className="flex items-center justify-center px-6 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Muat Turun Resit
          </button>
          <button 
            onClick={() => navigate('/parent/dashboard')} 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Kembali ke Papan Pemuka
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Lapor Ketidakhadiran</h1>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Melapor untuk Pelajar:</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">{student.name}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Kelas: {student.class}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Tarikh
            </label>
            <input 
              type="date" 
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Sebab
            </label>
            <select 
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih sebab</option>
              <option value="Sakit">Sakit</option>
              <option value="Temujanji Doktor">Temujanji Doktor</option>
              <option value="Kecemasan Keluarga">Kecemasan Keluarga</option>
              <option value="Masalah Pengangkutan">Masalah Pengangkutan</option>
              <option value="Urusan Peribadi">Urusan Peribadi</option>
              <option value="Aktiviti Rasmi Sekolah">Aktiviti Rasmi Sekolah</option>
              <option value="Lain-lain">Lain-lain</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Lampiran (Sijil Cuti Sakit, dll.)
            </label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".pdf,.jpg,.jpeg,.png"
              />
              {file ? (
                <div className="flex flex-col items-center">
                  <FileText className="w-8 h-8 text-blue-500 mb-2" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{file.name}</p>
                  <p className="text-xs text-slate-500 mt-1">Klik untuk menukar fail</p>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Klik untuk muat naik atau seret dan lepas</p>
                  <p className="text-xs text-slate-500 mt-1">PDF, JPG, PNG (Maks 10MB)</p>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center text-sm text-slate-500 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            <MapPin className="w-4 h-4 mr-2 text-blue-500 shrink-0" />
            Lokasi GPS dan maklumat peranti anda akan direkodkan secara automatik untuk pengesahan.
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Menghantar...' : 'Hantar Laporan'}
          </button>
        </form>
      </div>
    </div>
  );
}
