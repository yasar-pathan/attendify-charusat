import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Header } from "@/components/Header";
import {
  QrCode,
  Link2,
  Copy,
  CheckCircle,
  ArrowLeft,
  Users,
  Plus,
  AlertCircle,
  MapPin,
  CheckIcon,
  X,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import QRCode from "react-qr-code";
import { API_ENDPOINTS } from "@/config/api";
import { CLASSROOMS } from "@/config/classrooms";
import { SUBJECTS_MAP } from "@/config/subjects";

export const QRCodePage = () => {
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [totalEligible, setTotalEligible] = useState<number | null>(null);
  const [remainingCount, setRemainingCount] = useState<number | null>(null);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(true);
  const [isLoadingCount, setIsLoadingCount] = useState(false);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("");



  // Session form state
  const [attendanceSession, setAttendanceSession] = useState({
    subject: "",
    department: "",
    semester: "",
    division: "",
    lectureType: "lecture",
    timeSlot: "",
    classroom: "608",
    date: new Date().toISOString().split("T")[0],
    faculty: "",
    locationCheck: true,
  });

  // Generated session data
  const [sessionData, setSessionData] = useState<any>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Check if session data was passed from navigation
  useEffect(() => {
    if (location.state) {
      // Ensure the session data has the attendanceLink property
      const sessionFromNavigation = location.state;
      if (!sessionFromNavigation.attendanceLink) {
        // Generate the attendance link if it's missing
        const sessionId =
          sessionFromNavigation.sessionId ||
          `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const attendanceLink = `${window.location.origin}/student-auth/${sessionId}`;

        const completeSessionData = {
          ...sessionFromNavigation,
          sessionId,
          attendanceLink,
        };

        setSessionData(completeSessionData);
      } else {
        setSessionData(sessionFromNavigation);
      }

      setShowSessionForm(false);
    }
  }, [location.state]);

  // Check for existing sessions in localStorage on mount
  useEffect(() => {
    if (!location.state) {
      // Force show the form for new session creation
      setShowSessionForm(true);
      setSessionData(null);

      // Clear any existing sessions to force new creation
      localStorage.removeItem("attendanceSessions");
    }
  }, [location.state]);

  // Function to fetch live attendance count
  const fetchLiveAttendanceCount = async () => {
    if (!sessionData) return;

    try {
      setIsLoadingCount(true);
      const params = new URLSearchParams({
        subject: sessionData.subject || "",
        dept: sessionData.department || "",
        division: sessionData.division || "",
        date: sessionData.date || "",
        lectureType: sessionData.lectureType || "",
        timeSlot: sessionData.timeSlot || "",
        sem: sessionData.semester || "",
      });

      const response = await fetch(
        `${API_ENDPOINTS.GET_LIVE_ATTENDANCE_COUNT}?${params}`
      );
      const data = await response.json();

      if (data.success) {
        // Use unique students for present count to avoid duplicates
        const present = data.attendance_summary.unique_students ?? data.attendance_summary.total_present;
        setAttendanceCount(present);
        const eligible = data.attendance_summary.total_eligible ?? null;
        const remaining = data.attendance_summary.remaining ?? (eligible !== null ? Math.max(0, eligible - present) : null);
        setTotalEligible(eligible);
        setRemainingCount(remaining);
        setRecentAttendance(data.recent_attendance || []);
        setLastUpdated(data.last_updated || "");
      } else {
        console.error("Failed to fetch attendance count:", data.error);
      }
    } catch (error) {
      console.error("Error fetching attendance count:", error);
    } finally {
      setIsLoadingCount(false);
    }
  };






  useEffect(() => {
    if (sessionData) {
      fetchLiveAttendanceCount();
    }
  }, [sessionData]);

  // Set up real-time updates every 10 seconds for attendance count
  useEffect(() => {
    if (!sessionData) return;

    const interval = setInterval(() => {
      fetchLiveAttendanceCount();
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [sessionData]);



  const handleBack = () => {
    navigate("/teacher-dashboard");
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !attendanceSession.subject ||
      !attendanceSession.department ||
      !attendanceSession.semester ||
      !attendanceSession.division ||
      !attendanceSession.timeSlot
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingSession(true);
    try {
      const sessionId = `session_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Debug: Log the form data
      console.log("Creating session with form data:", attendanceSession);

      // Get selected classroom object to extract its geofence polygon
      const selectedClassroom = CLASSROOMS.find(c => c.id === attendanceSession.classroom);
      const classroomPolygonStr = selectedClassroom 
        ? JSON.stringify(selectedClassroom.polygon)
        : "";

      // Create URL with session data as query parameters
      const sessionParams = new URLSearchParams({
        subject: attendanceSession.subject,
        department: attendanceSession.department,
        semester: attendanceSession.semester,
        division: attendanceSession.division,
        lectureType: attendanceSession.lectureType,
        timeSlot: attendanceSession.timeSlot,
        classroom: attendanceSession.classroom,
        classroomPolygon: classroomPolygonStr,
        date: attendanceSession.date,
        faculty: attendanceSession.faculty || "Admin", // Use faculty from form or default
        locationCheck: attendanceSession.locationCheck.toString(),
      });

      console.log("Generated URL parameters:", sessionParams.toString());

      const attendanceLink = `${
        window.location.origin
      }/student-auth/${sessionId}?${sessionParams.toString()}`;

      const newSessionData = {
        sessionId,
        attendanceLink,
        subject: attendanceSession.subject,
        department: attendanceSession.department,
        semester: attendanceSession.semester,
        division: attendanceSession.division,
        lectureType: attendanceSession.lectureType,
        timeSlot: attendanceSession.timeSlot,
        classroom: attendanceSession.classroom,
        classroomPolygon: classroomPolygonStr,
        date: attendanceSession.date,
        locationCheck: attendanceSession.locationCheck.toString(),
        createdAt: new Date().toISOString(),
        status: "active",
      };

      // Store in localStorage
      const existingSessions = JSON.parse(
        localStorage.getItem("attendanceSessions") || "[]"
      );
      existingSessions.push(newSessionData);
      localStorage.setItem(
        "attendanceSessions",
        JSON.stringify(existingSessions)
      );

      setSessionData(newSessionData);
      setShowSessionForm(false);

      toast({
        title: "Attendance Session Created!",
        description: "QR code and link have been generated successfully",
      });
    } catch (error) {
      console.error("Error creating session:", error);
      toast({
        title: "Error",
        description: "Failed to create attendance session",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSession(false);
    }
  };

  const handleSessionInputChange = (field: string, value: string) => {
    setAttendanceSession((prev) => ({
      ...prev,
      [field]: value,
      // Reset dependent fields
      ...(field === "lectureType" ? { timeSlot: "" } : {}),
      ...(field === "department" ? { division: "", subject: "" } : {}),
      ...(field === "semester" ? { subject: "" } : {}),
    }));
  };

  const handleCopyLink = async () => {
    if (!sessionData?.attendanceLink) return;

    try {
      await navigator.clipboard.writeText(sessionData.attendanceLink);
      setIsLinkCopied(true);
      toast({
        title: "Link Copied!",
        description: "Attendance link has been copied to clipboard",
      });
      setTimeout(() => setIsLinkCopied(false), 3000);
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleCreateNewSession = () => {
    setSessionData(null);
    setShowSessionForm(true);
    // Clear localStorage to force fresh start
    localStorage.removeItem("attendanceSessions");
    setAttendanceSession({
      subject: "",
      department: "",
      semester: "",
      division: "",
      lectureType: "lecture",
      timeSlot: "",
      classroom: "608",
      date: new Date().toISOString().split("T")[0],
      faculty: "",
      locationCheck: true,
    });
  };

  // Derive teacher name for header: prefer navigation state faculty, fallback to localStorage
  const teacherName = (sessionData?.faculty ||
    (() => {
      try {
        const stored = localStorage.getItem("teacherInfo");
        if (stored) {
          const parsed = JSON.parse(stored);
          return parsed?.name || undefined;
        }
      } catch {}
      return undefined;
    })()) as string | undefined;

  const key = `${attendanceSession.department}_${attendanceSession.semester}`;
  const subjectOptions = SUBJECTS_MAP[key] || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Header
        title="Attendance Session Management"
        userRole="teacher"
        userName={teacherName}
        onLogout={() => navigate("/login")}
      />

      <div className="container mx-auto px-4 py-8">
        <Button onClick={handleBack} variant="outline" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        {showSessionForm ? (
          // Session Creation Form
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Plus className="h-6 w-6 text-primary" />
                Create Attendance Session
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleCreateSession}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <select
                    id="subject"
                    value={attendanceSession.subject}
                    onChange={(e) =>
                      handleSessionInputChange("subject", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    required
                    disabled={!attendanceSession.department || !attendanceSession.semester}
                  >
                    <option value="">
                      {!attendanceSession.department || !attendanceSession.semester
                        ? "Select Department & Semester first"
                        : "Select Subject"}
                    </option>
                    {subjectOptions.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <select
                    id="department"
                    value={attendanceSession.department}
                    onChange={(e) =>
                      handleSessionInputChange("department", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="IT">IT</option>
                    <option value="CSE">CSE</option>
                    <option value="CE">CE</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="semester">Semester</Label>
                  <select
                    id="semester"
                    value={attendanceSession.semester}
                    onChange={(e) =>
                      handleSessionInputChange("semester", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    required
                  >
                    <option value="">Select Semester</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>
                        {sem}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="division">Division</Label>
                  <select
                    id="division"
                    value={attendanceSession.division}
                    onChange={(e) =>
                      handleSessionInputChange("division", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    required
                  >
                    <option value="">Select Division</option>
                    {attendanceSession.department && (
                      <>
                        <option value={`${attendanceSession.department} 1`}>
                          {attendanceSession.department} 1
                        </option>
                        <option value={`${attendanceSession.department} 2`}>
                          {attendanceSession.department} 2
                        </option>
                      </>
                    )}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lectureType">Lecture Type</Label>
                  <select
                    id="lectureType"
                    value={attendanceSession.lectureType}
                    onChange={(e) =>
                      handleSessionInputChange("lectureType", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    required
                  >
                    <option value="lecture">Lecture</option>
                    <option value="lab">Lab</option>
                    <option value="tutorial">Tutorial</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeSlot">Time Slot</Label>
                  <select
                    id="timeSlot"
                    value={attendanceSession.timeSlot}
                    onChange={(e) =>
                      handleSessionInputChange("timeSlot", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    required
                  >
                    <option value="">Select Time Slot</option>
                    {attendanceSession.lectureType === "lab" ? (
                      <>
                        <option value="9:10 to 11:10">9:10 to 11:10</option>
                        <option value="12:10 to 2:10">12:10 to 2:10</option>
                        <option value="2:20 to 4:20">2:20 to 4:20</option>
                      </>
                    ) : (
                      <>
                        <option value="9:10 to 10:10">9:10 to 10:10</option>
                        <option value="10:10 to 11:10">10:10 to 11:10</option>
                        <option value="12:10 to 1:10">12:10 to 1:10</option>
                        <option value="1:10 to 2:10">1:10 to 2:10</option>
                        <option value="2:20 to 3:20">2:20 to 3:20</option>
                        <option value="3:20 to 4:20">3:20 to 4:20</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="classroom">Classroom</Label>
                  <select
                    id="classroom"
                    value={attendanceSession.classroom}
                    onChange={(e) =>
                      handleSessionInputChange("classroom", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    required
                  >
                    <option value="">Select Classroom</option>
                    {CLASSROOMS.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={attendanceSession.date}
                    onChange={(e) =>
                      handleSessionInputChange("date", e.target.value)
                    }
                    className="bg-background"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="faculty">Faculty Name</Label>
                  <Input
                    id="faculty"
                    type="text"
                    placeholder="e.g., Dr. John Smith"
                    value={attendanceSession.faculty}
                    onChange={(e) =>
                      handleSessionInputChange("faculty", e.target.value)
                    }
                    className="bg-background"
                    required
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 md:col-span-2 lg:col-span-3">
                  <div className="space-y-0.5">
                    <Label htmlFor="locationCheck" className="text-base font-semibold text-gray-950">
                      Enable Geolocation Check
                    </Label>
                    <p className="text-sm text-gray-500">
                      Require students to be physically present in the classroom to submit.
                    </p>
                  </div>
                  <Switch
                    id="locationCheck"
                    checked={attendanceSession.locationCheck}
                    onCheckedChange={(checked) =>
                      setAttendanceSession((prev) => ({ ...prev, locationCheck: checked }))
                    }
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <Button
                    type="submit"
                    variant="hero"
                    className="w-full"
                    disabled={isLoadingSession}
                  >
                    {isLoadingSession
                      ? "Creating Session..."
                      : "Create Attendance Session"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          // QR Code Display
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Session Info & QR Code */}
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="text-center">
                <CardTitle className="text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Attendance QR Code
                </CardTitle>
              </CardHeader>

              <CardContent className="text-center space-y-6">
                {/* Session Details */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-left">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <strong>Subject:</strong> {sessionData?.subject || "N/A"}
                    </div>
                    <div>
                      <strong>Department:</strong>{" "}
                      {sessionData?.department || "N/A"}
                    </div>
                    <div>
                      <strong>Semester:</strong>{" "}
                      {sessionData?.semester || "N/A"}
                    </div>
                    <div>
                      <strong>Division:</strong>{" "}
                      {sessionData?.division || "N/A"}
                    </div>
                    <div>
                      <strong>Time:</strong> {sessionData?.timeSlot || "N/A"}
                    </div>
                    <div>
                      <strong>Type:</strong> {sessionData?.lectureType || "N/A"}
                    </div>
                    <div>
                      <strong>Classroom:</strong>{" "}
                      {sessionData?.classroom || "N/A"}
                    </div>
                    <div>
                      <strong>Date:</strong>{" "}
                      {sessionData?.date
                        ? new Date(sessionData.date).toLocaleDateString()
                        : "N/A"}
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-primary/20">
                    {sessionData?.attendanceLink ? (
                      <QRCode
                        value={sessionData.attendanceLink}
                        size={200}
                        level="M"
                      />
                    ) : (
                      <div className="w-[200px] h-[200px] flex items-center justify-center text-gray-400">
                        <p>QR Code will appear here</p>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  Students can scan this QR code to mark their attendance
                </p>
              </CardContent>
            </Card>

            {/* Attendance Link & Live Count */}
            <div className="space-y-6">
              {/* Live Attendance Count */}
              <Card className="shadow-xl border-0 bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm opacity-90">Students Present</p>
                          <p className="text-4xl font-bold">
                            {isLoadingCount ? (
                              <div className="animate-pulse">...</div>
                            ) : (
                              attendanceCount
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm opacity-90">Remaining Students</p>
                          <p className="text-4xl font-bold">
                            {isLoadingCount ? (
                              <div className="animate-pulse">...</div>
                            ) : remainingCount !== null ? (
                              remainingCount
                            ) : (
                              "—"
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm opacity-75">
                          {lastUpdated
                            ? `Last updated: ${new Date(lastUpdated).toLocaleTimeString()}`
                            : "Live count updating..."}
                        </p>
                        {totalEligible !== null && (
                          <p className="text-sm opacity-90 mt-1">
                            Total Eligible: {totalEligible}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-16 w-16 opacity-80" />
                      <Button
                        onClick={fetchLiveAttendanceCount}
                        variant="outline"
                        size="sm"
                        className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                        disabled={isLoadingCount}
                      >
                        {isLoadingCount ? "↻" : "↻"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Attendance List */}
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Recent Attendance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentAttendance.length > 0 ? (
                    <div className="space-y-3 max-h-72 overflow-y-auto">
                      {recentAttendance.map((record, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            {record.selfie ? (
                              <img
                                src={record.selfie}
                                alt={record.student_id}
                                className="rounded-md border border-gray-200 w-20 h-16 object-cover"
                              />
                            ) : (
                              <div className="w-20 h-16 bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500">
                                No image
                              </div>
                            )}
                            <p className="text-sm font-medium text-gray-900">
                              {record.student_id}
                            </p>
                            <p className="text-xs text-gray-500 ml-auto">
                              {new Date(record.attendance_time).toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Present
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p>No attendance records yet</p>
                      <p className="text-xs">
                        Students will appear here as they mark attendance
                      </p>
                    </div>
                  )}
                  {recentAttendance.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <Button
                        onClick={fetchLiveAttendanceCount}
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled={isLoadingCount}
                      >
                        {isLoadingCount ? "Refreshing..." : "Refresh Now"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Attendance Link */}
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="h-5 w-5 text-primary" />
                    Attendance Link
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-3 break-all text-sm font-mono">
                    {sessionData?.attendanceLink ||
                      "No attendance link available"}
                  </div>

                  <Button
                    onClick={handleCopyLink}
                    variant={isLinkCopied ? "default" : "outline"}
                    className="w-full"
                  >
                    {isLinkCopied ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Link
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Share this link with students or display the QR code
                  </p>
                </CardContent>
              </Card>

              {/* Instructions */}
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Instructions for Students
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p>1. Scan the QR code or click the attendance link</p>
                    <p>2. Sign in with your @charusat.edu.in Google account</p>
                    <p>3. Take a live selfie for verification</p>
                    <p>4. Submit to mark attendance</p>
                  </div>
                </CardContent>
              </Card>

              {/* Create New Session Button */}
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                <CardContent className="p-6">
                  <Button
                    onClick={handleCreateNewSession}
                    variant="outline"
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Session
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}


      </div>
    </div>
  );
};
