/**
 * Utility functions for student-related operations
 */

/**
 * Extracts student ID from CHARUSAT email address
 * Handles both formats: d24it181@charusat.edu.in and 24it181@charusat.edu.in
 * @param email - The student's email address
 * @returns The extracted student ID or null if invalid
 */
export const extractStudentId = (email: string): string | null => {
  if (!email || typeof email !== 'string') {
    return null;
  }

  // Check if it's a valid CHARUSAT email
  if (!email.endsWith('@charusat.edu.in')) {
    return null;
  }

  // Extract the part before @
  const localPart = email.split('@')[0];
  
  // Pattern to match: d? + 2 digits + dept code + 3 digits
  // Examples: d24it181, 24it181, d25ce123, 25ce123
  const pattern = /^(d?)(\d{2})(it|cse|ce)(\d{3})$/i;
  const match = localPart.match(pattern);
  
  if (match) {
    // Return the full student ID (with or without 'd')
    return localPart.toLowerCase();
  }
  
  return null;
};

/**
 * Validates if the email is a valid CHARUSAT student email
 * @param email - The email to validate
 * @returns boolean indicating if valid
 */
export const isValidCharusatEmail = (email: string): boolean => {
  return extractStudentId(email) !== null;
};

/**
 * Gets department from student ID
 * @param studentId - The student ID (e.g., d24it181, 25ce123)
 * @returns The department code or null if invalid
 */
export const getDepartmentFromStudentId = (studentId: string): string | null => {
  if (!studentId) return null;
  
  const pattern = /^(d?)(\d{2})(it|cse|ce)(\d{3})$/i;
  const match = studentId.match(pattern);
  
  if (match) {
    return match[3].toUpperCase(); // Return IT, CSE, or CE
  }
  
  return null;
};

/**
 * Gets year from student ID
 * @param studentId - The student ID (e.g., d24it181, 25ce123)
 * @returns The year or null if invalid
 */
export const getYearFromStudentId = (studentId: string): string | null => {
  if (!studentId) return null;
  
  const pattern = /^(d?)(\d{2})(it|cse|ce)(\d{3})$/i;
  const match = studentId.match(pattern);
  
  if (match) {
    return match[2]; // Return the year part
  }
  
  return null;
};

/**
 * Formats attendance data for database insertion
 * @param sessionData - Data from create session form
 * @param studentId - Extracted student ID
 * @param gmail - Student's email
 * @param selfie - Base64 encoded selfie image
 * @returns Formatted data for database
 */
export const formatAttendanceData = (
  sessionData: any,
  studentId: string,
  gmail: string,
  selfie: string,
  position?: { lat?: number; lng?: number; accuracy?: number }
) => {
  return {
    MOT: sessionData.lectureType || sessionData.MOT,
    timeslot: sessionData.timeSlot || sessionData.timeslot,
    dept: sessionData.department || sessionData.dept,
    division: sessionData.division,
    subject: sessionData.subject,
    faculty_name: sessionData.faculty || sessionData.faculty_name,
    sem: parseInt(sessionData.semester || sessionData.sem) || 0,
    date: sessionData.date,
    student_id: studentId,
    selfie: selfie,
    gmail: gmail,
    latitude: position?.lat ?? null,
    longitude: position?.lng ?? null,
    accuracy: position?.accuracy ?? null
  };
};
