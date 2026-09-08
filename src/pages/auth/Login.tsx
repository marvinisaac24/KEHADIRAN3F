import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { AlertCircle, Users, Lock, Mail, CheckCircle2 } from 'lucide-react';

export function Login() {
  const [loginType, setLoginType] = useState<'parent' | 'staff'>('parent');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [parentPassword, setParentPassword] = useState('');
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleParentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parentPassword !== '1234') {
      setError('Kata laluan tidak sah.');
      return;
    }

    setError('');
    setLoading(true);
    const parentEmail = 'parent@sktudan.edu.my';
    const defaultPassword = 'password123'; // Internal password for this generic account

    try {
      await signInWithEmailAndPassword(auth, parentEmail, defaultPassword);
      navigate('/');
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          await createUserWithEmailAndPassword(auth, parentEmail, defaultPassword);
          navigate('/');
        } catch (createErr: any) {
          setError('Sistem ralat: Tidak dapat log masuk akaun ibu bapa.');
        }
      } else {
        setError('Gagal log masuk. Sila cuba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Sila masukkan alamat emel anda untuk menetapkan semula kata laluan.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await sendPasswordResetEmail(auth, email);
      setResetMessage('Pautan untuk menetapkan semula kata laluan telah dihantar ke emel anda.');
    } catch (err: any) {
      setError(err.message || 'Gagal menghantar pautan. Pastikan emel anda betul.');
    } finally {
      setLoading(false);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetMessage('');
    setLoading(true);

    // Hard bypass for specific accounts to prevent lockout
    if (password === 'Segar478659#' && (email === 'marvinisaac24@gmail.com' || email === 'g-01294773@moe-dl.edu.my')) {
      localStorage.setItem('mock_user_email', email);
      window.location.href = '/';
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Log masuk Emel/Kata Laluan tidak diaktifkan.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          navigate('/');
          return;
        } catch (createErr: any) {
          if (createErr.code === 'auth/email-already-in-use') {
            setError('Kata laluan salah. Sila klik "Lupa Kata Laluan" untuk menetapkan semula.');
          } else {
            setError(createErr.message || 'Gagal log masuk atau daftar akaun.');
          }
        }
      } else {
        setError(err.message || 'Gagal log masuk. Sila semak butiran anda.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
            <span className="text-white font-bold text-2xl -rotate-3">SK</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          SK TUDAN
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Sistem Ketidakhadiran Murid 3 Fleksibel
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white p-2 shadow-xl shadow-blue-900/5 sm:rounded-2xl border border-slate-100">
          <div className="flex p-1 space-x-1 bg-slate-100/80 rounded-xl mb-6 mx-4 mt-4">
            <button
              onClick={() => { setLoginType('parent'); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg flex items-center justify-center transition-colors ${
                loginType === 'parent' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Users className="w-4 h-4 mr-2" />
              Ibu Bapa / Penjaga
            </button>
            <button
              onClick={() => { setLoginType('staff'); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg flex items-center justify-center transition-colors ${
                loginType === 'staff' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Lock className="w-4 h-4 mr-2" />
              Kakitangan
            </button>
          </div>

          <div className="px-4 pb-8 sm:px-10">
            {loginType === 'parent' ? (
              <form className="space-y-6" onSubmit={handleParentLogin}>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center text-sm">
                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    {error}
                  </div>
                )}
                <div>
                  <label htmlFor="parentPassword" className="block text-sm font-medium text-slate-700">
                    Kata Laluan
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="parentPassword"
                      type="password"
                      required
                      value={parentPassword}
                      onChange={(e) => setParentPassword(e.target.value)}
                      className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Masukkan kata laluan"
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Gunakan kata laluan lalai: 1234</p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Log masuk...' : 'Log Masuk'}
                </button>
              </form>
            ) : (
              <form className="space-y-6" onSubmit={handleStaffLogin}>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center text-sm">
                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    {error}
                  </div>
                )}
                {resetMessage && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center text-sm">
                    <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0" />
                    {resetMessage}
                  </div>
                )}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                    Alamat Emel
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                      Kata Laluan
                    </label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none"
                    >
                      Lupa Kata Laluan?
                    </button>
                  </div>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Log masuk...' : 'Log Masuk'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
