// Demo Configuration for Testing
// This file contains demo data and settings for testing the system

export const DEMO_CONFIG = {
  // Demo Google OAuth (for testing only - replace with real credentials in production)
  GOOGLE_CLIENT_ID: "123456789-abcdefghijklmnop.apps.googleusercontent.com",
  
  // Demo session data
  DEMO_SESSIONS: [
    {
      sessionId: "demo_session_1",
      subject: "Data Structures",
      department: "IT",
      semester: "3",
      division: "IT 1",
      lectureType: "lecture",
      timeSlot: "9:10 to 10:10",
      classroom: "608",
      date: new Date().toISOString().split('T')[0],
      status: 'active'
    },
    {
      sessionId: "demo_session_2", 
      subject: "Computer Networks",
      department: "CSE",
      semester: "5",
      division: "CSE 2",
      lectureType: "lab",
      timeSlot: "2:20 to 4:20",
      classroom: "608",
      date: new Date().toISOString().split('T')[0],
      status: 'active'
    },
    {
      sessionId: "demo_session_3", 
      subject: "Structural Analysis",
      department: "CE",
      semester: "4",
      division: "CE 1",
      lectureType: "lecture",
      timeSlot: "10:10 to 11:10",
      classroom: "608",
      date: new Date().toISOString().split('T')[0],
      status: 'active'
    }
  ],
  
  // Demo student data
  DEMO_STUDENTS: [
    {
      email: "student1@charusat.edu.in",
      name: "John Doe",
      department: "IT",
      semester: "3"
    },
    {
      email: "student2@charusat.edu.in", 
      name: "Jane Smith",
      department: "CSE",
      semester: "5"
    },
    {
      email: "student3@charusat.edu.in", 
      name: "Mike Johnson",
      department: "CE",
      semester: "4"
    }
  ],
  
  // Demo teacher data
  DEMO_TEACHERS: [
    {
      email: "teacher1@charusat.edu.in",
      name: "Dr. John Smith",
      department: "IT"
    },
    {
      email: "teacher2@charusat.edu.in",
      name: "Prof. Jane Doe", 
      department: "CSE"
    },
    {
      email: "teacher3@charusat.edu.in",
      name: "Prof. Robert Wilson", 
      department: "CE"
    }
  ],
  
  // Feature flags
  FEATURES: {
    ENABLE_BLINK_DETECTION: true,
    ENABLE_GOOGLE_OAUTH: true,
    ENABLE_QR_GENERATION: true,
    ENABLE_CAMERA_CAPTURE: true,
    DEMO_MODE: true
  },
  
  // Camera settings
  CAMERA: {
    WIDTH: 640,
    HEIGHT: 480,
    FACING_MODE: 'user',
    BLINK_DETECTION_INTERVAL: 100, // ms
    BRIGHTNESS_THRESHOLD: 100,
    REQUIRED_BLINKS: 2
  },
  
  // QR Code settings
  QR_CODE: {
    SIZE: 200,
    LEVEL: 'M',
    INCLUDE_MARGIN: true
  }
};

// Helper function to check if running in demo mode
export const isDemoMode = () => DEMO_CONFIG.FEATURES.DEMO_MODE;

// Helper function to get demo data
export const getDemoData = (type: 'sessions' | 'students' | 'teachers') => {
  switch (type) {
    case 'sessions':
      return DEMO_CONFIG.DEMO_SESSIONS;
    case 'students':
      return DEMO_CONFIG.DEMO_STUDENTS;
    case 'teachers':
      return DEMO_CONFIG.DEMO_TEACHERS;
    default:
      return [];
  }
};

// Helper function to initialize demo data in localStorage
export const initializeDemoData = () => {
  if (typeof window === 'undefined') return;
  
  // Initialize demo sessions if none exist
  if (!localStorage.getItem('attendanceSessions')) {
    localStorage.setItem('attendanceSessions', JSON.stringify(DEMO_CONFIG.DEMO_SESSIONS));
  }
  
  // Initialize demo teachers if none exist
  if (!localStorage.getItem('teachers')) {
    localStorage.setItem('teachers', JSON.stringify(DEMO_CONFIG.DEMO_TEACHERS));
  }
  
  console.log('Demo data initialized successfully');
};
