import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User, Role } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for mock login first
    const mockEmail = localStorage.getItem('mock_user_email');
    if (mockEmail) {
      let role: Role = 'parent';
      let name = 'Pengguna';
      if (mockEmail === 'marvinisaac24@gmail.com') {
        role = 'admin';
        name = 'Pentadbir';
      } else if (mockEmail === 'g-01294773@moe-dl.edu.my') {
        role = 'teacher';
        name = 'Guru Kelas';
      }
      
      const mockUid = mockEmail === 'marvinisaac24@gmail.com' ? 'mock-admin-123' : 'mock-teacher-123';
      
      setUserData({
        uid: mockUid,
        email: mockEmail,
        role: role,
        name: name,
        studentId: ''
      });
      setCurrentUser({ uid: mockUid, email: mockEmail } as FirebaseUser);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch user document
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserData({ uid: user.uid, ...userDoc.data() } as User);
        } else {
          // If no user doc, default to parent (for now) - in real life, admin creates accounts
          let defaultRole: Role = 'parent';
          let defaultName = user.displayName || 'Ibu Bapa / Penjaga';
          
          if (user.email === 'marvinisaac24@gmail.com') {
            defaultRole = 'admin';
            defaultName = 'Pentadbir';
          } else if (user.email === 'g-01294773@moe-dl.edu.my') {
            defaultRole = 'teacher';
            defaultName = 'Guru Kelas';
          }

          const defaultUserData: User = {
            uid: user.uid,
            email: user.email || '',
            role: defaultRole,
            name: defaultName,
            studentId: '1' // Temporary default for testing
          };
          await setDoc(userDocRef, defaultUserData);
          setUserData(defaultUserData);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signOut = async () => {
    localStorage.removeItem('mock_user_email');
    if (auth.currentUser) {
      await firebaseSignOut(auth);
    } else {
      window.location.reload();
    }
  };

  const value = {
    currentUser,
    userData,
    loading,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
