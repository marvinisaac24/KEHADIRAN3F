import React, { useState } from 'react';
import { Search, Filter, UserPlus, X, Edit, Trash2 } from 'lucide-react';
import { useStudents } from '../../lib/students';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export function AdminStudents() {
  const [searchTerm, setSearchTerm] = useState('');
  const students = useStudents();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentId, setNewStudentId] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState<any>(null);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName || !newStudentId) return;
    
    const newStudent = {
      id: newStudentId,
      name: newStudentName.toUpperCase(),
      class: '3 Fleksibel'
    };
    
    const updated = [...students, newStudent].sort((a, b) => a.name.localeCompare(b.name));
    localStorage.setItem('admin_students', JSON.stringify(updated)); window.dispatchEvent(new Event('students_updated'));
    
    try {
      await addDoc(collection(db, 'absences'), {
        studentId: newStudent.id,
        studentName: newStudent.name,
        date: `01/01/${new Date().getFullYear()}`,
        reason: 'Sistem - Rekod Baru',
        status: 'Sistem',
        attachmentUrl: '',
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error(err);
    }
    
    setIsAddModalOpen(false);
    setNewStudentName('');
    setNewStudentId('');
  };

  const openEditModal = (student: any) => {
    setEditingStudent(student);
    setIsEditModalOpen(true);
  };

  const handleEditStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent.name || !editingStudent.id) return;
    
    // We update based on the original ID, assuming that's how we find the record. 
    // Wait, the user might edit the ID. So we need to find it by something else or just assume replacing the first match of something?
    // In our case we can replace by ID (assuming they edit name) or maybe we store original ID?
    // Let's just find by the id, assuming id is immutable or we update it. Actually let's assume `editingStudent.id` matches the one we want to replace, which is flawed if they edit the ID.
    // So let's store original student ID in editingStudent when opening modal, or we just find index.
    const updated = students.map(s => s.id === editingStudent.originalId ? { id: editingStudent.id, name: editingStudent.name.toUpperCase(), class: editingStudent.class } : s);
    localStorage.setItem('admin_students', JSON.stringify(updated)); window.dispatchEvent(new Event('students_updated'));
    setIsEditModalOpen(false);
  };

  const openDeleteModal = (student: any) => {
    setDeletingStudent(student);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteStudent = () => {
    const updated = students.filter(s => s.id !== deletingStudent.id);
    localStorage.setItem('admin_students', JSON.stringify(updated)); window.dispatchEvent(new Event('students_updated'));
    setIsDeleteModalOpen(false);
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.id.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pangkalan Data Pelajar</h1>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Tambah Pelajar
        </button>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tambah Pelajar Baru</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">ID Pelajar / No. K/P</label>
                <input 
                  type="text" 
                  required
                  value={newStudentId}
                  onChange={(e) => setNewStudentId(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500"
                  placeholder="Cth: 035"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Penuh</label>
                <input 
                  type="text" 
                  required
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 uppercase"
                  placeholder="Cth: ALI BIN AHMAD"
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && editingStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Pelajar</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">ID Pelajar / No. K/P</label>
                <input 
                  type="text" 
                  required
                  value={editingStudent.id}
                  onChange={(e) => setEditingStudent({...editingStudent, id: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Penuh</label>
                <input 
                  type="text" 
                  required
                  value={editingStudent.name}
                  onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 uppercase"
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && deletingStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Padam Pelajar</h2>
              <button onClick={() => setIsDeleteModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Adakah anda pasti mahu memadam rekod pelajar <span className="font-bold">{deletingStudent.name}</span>? Tindakan ini tidak boleh dikembalikan.
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button 
                onClick={handleDeleteStudent}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
              >
                Padam
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Cari nama atau ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="flex items-center px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
            <Filter className="w-4 h-4 mr-2" />
            Tapis
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300 w-24">ID</th>
                <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Nama</th>
                <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Kelas</th>
                <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-900/20">
                  <td className="p-4 text-sm text-slate-500 dark:text-slate-400">{student.id}</td>
                  <td className="p-4 text-sm text-slate-900 dark:text-slate-100 font-medium">{student.name}</td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{student.class}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => openEditModal({ ...student, originalId: student.id })}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openDeleteModal(student)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Padam"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
