import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, PartyPopper, Loader2, Clock, User, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AttendanceSuccess() {
  const [isLoading, setIsLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [searchParams] = useSearchParams();
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();



  useEffect(() => {
    const loadAttendanceData = async () => {
      try {
        // Get attendance data from localStorage
        const storedAuthData = localStorage.getItem(`studentAuth_${sessionId}`);
        const storedSessionData = localStorage.getItem(`sessionData_${sessionId}`);
        
        if (storedAuthData) {
          const authData = JSON.parse(storedAuthData);
          
          // Try to get session data from localStorage first
          let sessionData: any = {};
          if (storedSessionData) {
            try {
              sessionData = JSON.parse(storedSessionData);
      } catch (error) {
              console.error('Error parsing session data:', error);
            }
          }
          
                     // If session data is empty, try to get it from URL parameters
           if (!sessionData.subject && window.location.search) {
             const urlParams = new URLSearchParams(window.location.search);
             sessionData = {
               subject: urlParams.get('subject') || 'N/A',
               department: urlParams.get('department') || 'N/A',
               semester: urlParams.get('semester') || 'N/A',
               division: urlParams.get('division') || 'N/A',
               lectureType: urlParams.get('lectureType') || 'N/A',
               timeSlot: urlParams.get('timeSlot') || 'N/A',
               classroom: urlParams.get('classroom') || 'N/A',
               date: urlParams.get('date') || new Date().toISOString().split('T')[0],
               faculty: urlParams.get('faculty') || 'N/A'
             };
           }
           
           
          
          // Create attendance record
          const attendanceRecord = {
            studentId: authData.email.split('@')[0],
            email: authData.email,
            subject: sessionData.subject || 'N/A',
            department: sessionData.department || 'N/A',
            semester: sessionData.semester || 'N/A',
            division: sessionData.division || 'N/A',
            lectureType: sessionData.lectureType || 'N/A',
            timeSlot: sessionData.timeSlot || 'N/A',
            classroom: sessionData.classroom || 'N/A',
            date: sessionData.date || new Date().toISOString().split('T')[0],
            faculty: sessionData.faculty || 'N/A',
            submissionTime: new Date().toLocaleString(),
            sessionId: sessionId
          };
          
          setAttendanceData(attendanceRecord);
        }
        
      setIsLoading(false);
      
      toast({
          title: "Attendance Submitted Successfully!",
          description: "Your attendance has been recorded in the database.",
      });
      
    } catch (error) {
        console.error('Error loading attendance data:', error);
        setIsLoading(false);
        toast({
          title: "Error",
          description: "Failed to load attendance details.",
          variant: "destructive",
        });
      }
    };

    loadAttendanceData();
  }, [sessionId, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50 p-6">
        <div className="text-center space-y-6">
          <Loader2 className="h-16 w-16 text-green-600 animate-spin mx-auto" />
          <h2 className="text-2xl font-semibold text-gray-700">
            Recording Attendance...
          </h2>
          <p className="text-gray-600">
            Please wait while we save your attendance record.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50 p-6">
      <div className="text-center space-y-8 max-w-2xl mx-auto">
        {/* Success Animation */}
        <div className="relative">
          <div className="mx-auto w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
            <CheckCircle className="h-20 w-20 text-white" />
          </div>
          
          {/* Floating celebration icons */}
          <div className="absolute -top-4 -left-4 text-yellow-500 animate-bounce">
            <PartyPopper className="h-8 w-8" />
          </div>
          <div className="absolute -top-4 -right-4 text-pink-500 animate-bounce" style={{ animationDelay: '0.5s' }}>
            <PartyPopper className="h-8 w-8" />
          </div>
          <div className="absolute -bottom-4 -left-6 text-blue-500 animate-bounce" style={{ animationDelay: '1s' }}>
            <PartyPopper className="h-6 w-6" />
          </div>
          <div className="absolute -bottom-4 -right-6 text-purple-500 animate-bounce" style={{ animationDelay: '1.5s' }}>
            <PartyPopper className="h-6 w-6" />
          </div>
        </div>

        {/* Success Message */}
        <div className="space-y-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-700 bg-clip-text text-transparent">
            Attendance Submitted Successfully!
          </h1>
          
          <div className="max-w-lg mx-auto space-y-4">
            <p className="text-xl text-gray-700 font-medium">
              🎉 Your attendance has been recorded! 🎉
            </p>
            
            {/* Attendance Details Card */}
            {/* Attendance details removed as requested */}
            
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-green-800 font-semibold">
                ✅ Attendance Recorded Successfully!
              </p>
              <p className="text-green-700 text-sm mt-1">
                Your attendance has been saved to the database. You can now close this tab.
              </p>
            </div>
            
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-blue-800 font-semibold">
                 📊 What happens next?
                </p>
                <p className="text-blue-700 text-sm mt-1">
                 Your attendance record will be available to your faculty for review and reporting.
                </p>
              </div>
             

          </div>
        </div>

        {/* Decorative elements */}
        <div className="flex justify-center space-x-2 mt-8">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
} 