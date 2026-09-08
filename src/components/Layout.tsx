import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText, 
  Settings, 
  LogOut,
  Menu,
  X,
  History,
  Bell
} from 'lucide-react';
import { cn } from '../lib/utils';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function Layout() {
  const { userData, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notification, setNotification] = useState<{message: string, id: string} | null>(null);

  useEffect(() => {
    // Only teachers and admins need real-time notifications for pending absences
    if (userData?.role === 'teacher' || userData?.role === 'admin') {
      const q = query(
        collection(db, 'absences'),
        where('status', '==', 'Menunggu Kelulusan'),
        orderBy('createdAt', 'desc'),
        limit(1)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            // Only notify if it was created recently (simple check to avoid showing on load)
            const createdAt = data.createdAt?.toDate();
            const now = new Date();
            if (createdAt && (now.getTime() - createdAt.getTime() < 5000)) {
               let docType = '';
               if (data.attachmentUrl) {
                 if (data.reason === 'Sakit' || data.reason === 'Temujanji Doktor' || (data.reason && data.reason.toUpperCase().includes('SAKIT'))) {
                   docType = ' (Lampiran: Sijil Sakit)';
                 } else {
                   docType = ' (Lampiran: Surat Rasmi)';
                 }
               }
               setNotification({
                 id: change.doc.id,
                 message: `Permohonan baru${docType}: ${data.studentName} (${data.reason})`
               });
               
               // Auto hide after 5 seconds
               setTimeout(() => {
                 setNotification(null);
               }, 5000);
            }
          }
        });
      });

      return () => unsubscribe();
    }
  }, [userData]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to sign out', error);
    }
  };

  const role = userData?.role || 'parent';

  const navItems = {
    parent: [
      { name: 'Papan Pemuka', path: '/parent/dashboard', icon: LayoutDashboard },
      { name: 'Lapor Ketidakhadiran', path: '/parent/report-absence', icon: FileText },
      { name: 'Sejarah', path: '/parent/history', icon: History },
    ],
    teacher: [
      { name: 'Papan Pemuka', path: '/teacher/dashboard', icon: LayoutDashboard },
      { name: 'Kelas Saya', path: '/teacher/students', icon: Users },
      { name: 'Laporan', path: '/teacher/reports', icon: FileText },
    ],
    admin: [
      { name: 'Papan Pemuka', path: '/admin/dashboard', icon: LayoutDashboard },
      { name: 'Urus Pelajar', path: '/admin/students', icon: Users },
      { name: 'Laporan & Analitik', path: '/admin/reports', icon: FileText },
      { name: 'Tetapan', path: '/admin/settings', icon: Settings },
    ],
  };

  const links = navItems[role] || [];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg rounded-xl p-4 flex items-start space-x-4 max-w-sm">
            <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-full shrink-0">
              <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Notifikasi Baru</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{notification.message}</p>
            </div>
            <button 
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50 print:hidden">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-white dark:bg-slate-800 rounded-md shadow-md text-slate-600 dark:text-slate-300"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex lg:flex-col print:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-center h-16 border-b border-slate-200 dark:border-slate-700">
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">SK TUDAN</h1>
        </div>
        
        <div className="px-4 py-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
              {userData?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="text-sm font-medium">{userData?.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{userData?.role === 'parent' ? 'Ibu Bapa' : userData?.role === 'teacher' ? 'Guru' : 'Pentadbir'}</p>
            </div>
          </div>

          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname.startsWith(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                    isActive 
                      ? "bg-blue-50 text-blue-600 dark:bg-slate-700 dark:text-blue-400" 
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                  )}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={handleSignOut}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Log Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto print:overflow-visible">
        <div className="p-4 lg:p-8 mt-12 lg:mt-0 max-w-7xl mx-auto print:p-0 print:m-0 print:max-w-none">
          <Outlet />
        </div>
      </main>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
