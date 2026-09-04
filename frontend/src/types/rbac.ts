export type UserRole = 'student' | 'admin' | 'super_admin' | 'program_head';

export const roleLabels: Record<UserRole, string> = {
  student: 'Student',
  admin: 'Professor',
  super_admin: 'Super Admin (Developer)',
  program_head: 'Program Head',
};

export const panelLabels: Record<UserRole, string> = {
  student: 'Student Panel',
  admin: 'Professor Portal',
  super_admin: 'Super Admin Panel',
  program_head: 'Program Head Portal',
};
