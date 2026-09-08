export type Role = 'parent' | 'teacher' | 'admin';

export interface User {
  uid: string;
  email: string;
  role: Role;
  name: string;
  studentId?: string; // For parents
  classId?: string;   // For teachers
}

export interface Student {
  id: string; // Document ID
  studentId: string; // E.g. "001"
  name: string;
  classId: string;
}

export interface Class {
  id: string; // Document ID
  name: string; // E.g. "3 Fleksibel"
  teacherId: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'pending';
export type AbsenceReason = 'Sick' | 'Medical Appointment' | 'Family Emergency' | 'Transport Problem' | 'Personal Matter' | 'Official School Activity' | 'Others';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'need_info';

export interface AttendanceRecord {
  id: string; // Document ID
  studentId: string;
  classId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  
  // Only for absences
  reason?: AbsenceReason;
  explanation?: string;
  attachmentUrl?: string; // Storage URL
  location?: { lat: number; lng: number };
  timestamp?: number;
  deviceInfo?: string;
  
  // Teacher approval
  approvalStatus?: ApprovalStatus;
  teacherComment?: string;
}
