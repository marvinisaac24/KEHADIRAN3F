import { ErrorBoundary } from "./components/ErrorBoundary";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/auth/Login';

// Import dashboards (to be created)
import { ParentDashboard } from './pages/parent/ParentDashboard';
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ReportAbsence } from './pages/parent/ReportAbsence';
import { ParentHistory } from './pages/parent/ParentHistory';
import { AdminStudents } from './pages/admin/AdminStudents';

// Placeholder imports
import { TeacherStudents } from './pages/teacher/TeacherStudents';
import { TeacherReports } from './pages/teacher/TeacherReports';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminSettings } from './pages/admin/AdminSettings';

function RootRedirect() {
  const { userData, loading } = useAuth();
  
  if (loading) return null;
  
  if (!userData) return <Navigate to="/login" replace />;
  
  return <Navigate to={`/${userData.role}/dashboard`} replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<RootRedirect />} />
            
            {/* Parent Routes */}
            <Route path="parent/dashboard" element={<ProtectedRoute allowedRoles={['parent']}><ParentDashboard /></ProtectedRoute>} />
            <Route path="parent/report-absence" element={<ProtectedRoute allowedRoles={['parent']}><ReportAbsence /></ProtectedRoute>} />
            <Route path="parent/history" element={<ProtectedRoute allowedRoles={['parent']}><ParentHistory /></ProtectedRoute>} />
            
            {/* Teacher Routes */}
            <Route path="teacher/dashboard" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherDashboard /></ProtectedRoute>} />
            <Route path="teacher/students" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherStudents /></ProtectedRoute>} />
            <Route path="teacher/reports" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherReports /></ProtectedRoute>} />
            
            {/* Admin Routes */}
            <Route path="admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="admin/students" element={<ProtectedRoute allowedRoles={['admin']}><AdminStudents /></ProtectedRoute>} />
            <Route path="admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><AdminReports /></ProtectedRoute>} />
            <Route path="admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><AdminSettings /></ProtectedRoute>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
    </ErrorBoundary>
  );
}

