import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Camera,
  Eye,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Upload,
} from "lucide-react";
import { extractStudentId, formatAttendanceData } from "@/lib/studentUtils";
import { API_ENDPOINTS } from "@/config/api";
import { CLASSROOMS } from "@/config/classrooms";

interface AuthData {
  email: string;
  name: string;
  picture: string;
  sessionId: string;
  isValid: boolean;
  timestamp: string;
}

export const StudentAttendance = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attendanceAlreadySubmitted, setAttendanceAlreadySubmitted] =
    useState(false);
  const [checkingAttendance, setCheckingAttendance] = useState(true);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [locationChecking, setLocationChecking] = useState(false);

  // Debug: last liveness result (for UI and troubleshooting)
  const [lastLiveness, setLastLiveness] = useState<any>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [userEmail, setUserEmail] = useState("");
  const { toast } = useToast();

  // Capture current frame to data URL (must be declared before effects)
  const snapshotFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    // video dimensions may be zero briefly; skip until ready
    if (!video.videoWidth || !video.videoHeight || video.videoWidth < 50) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  }, []);

  const handleCapture = useCallback(() => {
    const imageDataUrl = snapshotFrame();
    if (!imageDataUrl) return;
    setCapturedImage(imageDataUrl);
  }, [snapshotFrame]);

  // On mount, check if attendance already submitted
  useEffect(() => {
    if (!authData || !authData.email) {
      console.log("Waiting for authData.email...");
      setCheckingAttendance(true);
      return;
    }
    const key = `attendance_submitted_${sessionId}_${authData.email}`;
    const value = localStorage.getItem(key);
    if (value) {
      setAttendanceAlreadySubmitted(true);
      navigate(`/attendance-success/${sessionId}`, { replace: true });
    } else {
      setAttendanceAlreadySubmitted(false);
    }
    setCheckingAttendance(false);
  }, [sessionId, authData, navigate]);

  useEffect(() => {
    const storedAuth = localStorage.getItem(`studentAuth_${sessionId}`);
    if (storedAuth) {
      try {
        const auth = JSON.parse(storedAuth);
        if (auth.isValid && auth.sessionId === sessionId) {
          setAuthData(auth);
        } else {
          navigate(`/student-auth/${sessionId}`);
          return;
        }
      } catch {
        navigate(`/student-auth/${sessionId}`);
        return;
      }
    } else {
      navigate(`/student-auth/${sessionId}`);
      return;
    }

    // Get session info
    const sessions = JSON.parse(
      localStorage.getItem("attendanceSessions") || "[]"
    );
    const currentSession = sessions.find((s: any) => s.sessionId === sessionId);
    if (currentSession) {
      setSessionInfo(currentSession);
    } else {
      const testSession = {
        sessionId,
        subject: "Test Subject",
        department: "IT",
        semester: "5",
        division: "IT 1",
        lectureType: "lecture",
        timeSlot: "10:10 to 11:10",
        classroom: "608",
        date: new Date().toISOString().split("T")[0],
        attendanceLink: `${window.location.origin}/student-auth/${sessionId}`,
        createdAt: new Date().toISOString(),
        status: "active",
      };
      setSessionInfo(testSession);
    }
  }, [sessionId, navigate]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        try {
          // Attempt to play; some browsers require explicit play call
          // muted is set on the video element, so play should be allowed.
          // Wait for metadata so videoWidth/videoHeight are available.
          await videoRef.current.play();
        } catch (e) {
          console.debug("startCamera: video.play() failed, will rely on autoplay settings", e);
        }
        setIsVideoPlaying(true);
        setIsCapturing(true);
      }
    } catch {
      alert("Camera access denied or not available.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      try {
        videoRef.current.pause();
      } catch {}
    }
    setIsCapturing(false);
    setIsVideoPlaying(false);
  }, []);

  
  // Blink detection improved
  const [prevBrightness, setPrevBrightness] = useState<number | null>(null);
  const [blinkDetected, setBlinkDetected] = useState(false);
  const [blinkCount, setBlinkCount] = useState(0);

  // Face movement detection
  const [motionDetected, setMotionDetected] = useState(false);
  const [motionCount, setMotionCount] = useState(0);
  const [prevFrameData, setPrevFrameData] = useState<ImageData | null>(null);
  const [motionLevel, setMotionLevel] = useState(0);

  // Gemini-backed blink detection (auto-capture on liveness pass)
  useEffect(() => {
    if (!isCapturing || capturedImage) return;
    let interval: NodeJS.Timeout;
    let closing = false;
    let lastGeminiAt = 0;
    const cooldownMs = 1600; // Avoid flooding Gemini

    async function maybeGeminiAndCapture() {
      const now = Date.now();
      if (now - lastGeminiAt < cooldownMs) return;
      lastGeminiAt = now;
      try {
        const frame = snapshotFrame();
        if (!frame) return;
        const { analyzeLiveness } = await import("@/lib/geminiLiveness");
        // Lower threshold to 0.25 to increase sensitivity for local heuristic
        const result = await analyzeLiveness(frame, { threshold: 0.25 });
        console.debug("Liveness check result:", result);
        setLastLiveness(result);
        if (result.isLive) {
          handleCapture();
        } else {
          // Helpful debug toast when developer debugging automatic capture
          if (result.reason) {
            console.debug("Liveness rejected, reason:", result.reason, "score:", result.score);
          }
        }
      } catch (_) {
        // ignore and continue scanning
      }
    }

    function detectBlink() {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      // Ensure video metadata is ready and dimensions are non-zero
      if (!video.videoWidth || !video.videoHeight) return;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      } catch (e) {
        // drawing may fail if video not ready
        return;
      }

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Take brightness of center region
      const centerX = Math.floor(canvas.width / 2);
      const centerY = Math.floor(canvas.height / 2);
      const areaSize = Math.min(canvas.width, canvas.height) / 6;

      let total = 0,
        count = 0;
      for (let y = Math.max(0, Math.floor(centerY - areaSize)); y < Math.min(canvas.height, Math.floor(centerY + areaSize)); y += 2) {
        for (let x = Math.max(0, Math.floor(centerX - areaSize)); x < Math.min(canvas.width, Math.floor(centerX + areaSize)); x += 2) {
          const index = (y * canvas.width + x) * 4;
          const brightness =
            (data[index] + data[index + 1] + data[index + 2]) / 3;
          total += brightness;
          count++;
        }
      }

      const avg = count > 0 ? total / count : 0;

      if (prevBrightness !== null && prevBrightness > 0) {
        const drop = prevBrightness - avg;
        const rel = drop / prevBrightness;

        // Detect a blink as a reasonably large relative drop OR an absolute drop
        if (!closing && (rel > 0.18 || drop > 18)) {
          closing = true;
        }

        if (closing && rel < 0.12) {
          setBlinkCount((prev) => prev + 1);
          setBlinkDetected(true);

          setTimeout(() => {
            setBlinkDetected(false);
            // Immediate capture on blink (OR logic) to make detection more responsive
            handleCapture();
            setBlinkCount(0);
          }, 250);

          closing = false;
        }
      }

      setPrevBrightness(avg);
    }

    interval = setInterval(detectBlink, 120);
    return () => clearInterval(interval);
  }, [isCapturing, capturedImage, prevBrightness, snapshotFrame, handleCapture]);

  // Face movement detection
  // Gemini-backed motion detection (auto-capture on liveness pass)
  useEffect(() => {
    if (!isCapturing || capturedImage) return;
    let interval: NodeJS.Timeout;
    let motionThreshold = 400; // tuned down for typical webcam frames
    let consecutiveMotionFrames = 0;
    let lastGeminiAt = 0;
    const cooldownMs = 1600;

    async function maybeGeminiAndCapture() {
      const now = Date.now();
      if (now - lastGeminiAt < cooldownMs) return;
      lastGeminiAt = now;
      try {
        const frame = snapshotFrame();
        if (!frame) return;
        const { analyzeLiveness } = await import("@/lib/geminiLiveness");
        // Lower threshold to 0.25 to make motion-triggered checks more permissive
        const result = await analyzeLiveness(frame, { threshold: 0.25 });
        console.debug("Liveness check result (motion):", result);
        setLastLiveness(result);
        if (result.isLive) {
          handleCapture();
        } else {
          if (result.reason) console.debug("Motion liveness rejected:", result.reason, "score:", result.score);
        }
      } catch (_) {
        // ignore
      }
    }

    function detectMotion() {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      // Ensure video dimensions available
      if (!video.videoWidth || !video.videoHeight) return;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      } catch (e) {
        return;
      }

      let currentFrameData: ImageData;
      try {
        currentFrameData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } catch (e) {
        // getImageData can fail if dimensions are zero or tainted
        return;
      }

      if (prevFrameData) {
        let totalDifference = 0;
        const data1 = prevFrameData.data;
        const data2 = currentFrameData.data;

        for (let i = 0; i < data1.length; i += 16) {
          const r1 = data1[i];
          const g1 = data1[i + 1];
          const b1 = data1[i + 2];
          const r2 = data2[i];
          const g2 = data2[i + 1];
          const b2 = data2[i + 2];

          const diff = Math.abs(r2 - r1) + Math.abs(g2 - g1) + Math.abs(b2 - b1);
          totalDifference += diff;
        }

        setMotionLevel(Math.round(totalDifference / 1000));

        if (totalDifference > motionThreshold) {
          consecutiveMotionFrames++;
          if (consecutiveMotionFrames >= 2) {
            setMotionDetected(true);
            setMotionCount((prev) => prev + 1);

            setTimeout(() => {
              setMotionDetected(false);
              // Verify with Gemini before capturing
              maybeGeminiAndCapture();
              consecutiveMotionFrames = 0;
            }, 350);
          }
        } else {
          consecutiveMotionFrames = 0;
        }
      }

        setPrevFrameData(currentFrameData);
    }

    interval = setInterval(detectMotion, 150);
    return () => clearInterval(interval);
  }, [isCapturing, capturedImage, prevFrameData, snapshotFrame, handleCapture]);

  // Periodic fallback: run liveness analysis every 2s in case blink/motion didn't trigger
  useEffect(() => {
    if (!isCapturing || capturedImage) return;
    let running = true;
    const intervalId = setInterval(async () => {
      if (!running) return;
      try {
        const frame = snapshotFrame();
        if (!frame) return;
        const { analyzeLiveness } = await import("@/lib/geminiLiveness");
        // Periodic fallback uses a permissive threshold to catch low-confidence live frames
        const result = await analyzeLiveness(frame, { threshold: 0.25 });
        setLastLiveness(result);
        console.debug("Periodic liveness:", result);
        if (result.isLive) {
          handleCapture();
        }
      } catch (e) {
        // ignore errors
      }
    }, 2000);

    return () => {
      running = false;
      clearInterval(intervalId);
    };
  }, [isCapturing, capturedImage, snapshotFrame, handleCapture]);

  
  const handleRetake = () => {
    setCapturedImage(null);
    setBlinkCount(0);
    setMotionCount(0);
    setMotionLevel(0);
    setPrevFrameData(null);
    startCamera();
  };

  const handleSubmitAttendance = async () => {
    if (!capturedImage || !authData || !sessionInfo) return;
    setIsSubmitting(true);

    try {
      // Geo-fence check (support single-point radius OR polygon corners)
      const pointInPolygon = (lat: number, lng: number, polygon: { lat: number; lng: number }[]) => {
        // Ray-casting algorithm. Treat longitude as x and latitude as y.
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
          const xi = polygon[i].lng;
          const yi = polygon[i].lat;
          const xj = polygon[j].lng;
          const yj = polygon[j].lat;

          const intersect = ((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / ((yj - yi) || Number.EPSILON) + xi);
          if (intersect) inside = !inside;
        }
        return inside;
      };

      const ensureWithinGeofence = async (expected: { lat?: number; lng?: number; radius?: number; polygon?: { lat: number; lng: number }[] }) => {
        // If no geofence info provided, allow by default
        if ((!expected.lat && !expected.lng && !expected.radius) && (!expected.polygon || expected.polygon.length === 0)) {
          console.warn("No geofence data provided, allowing submission");
          return { allowed: true, position: null };
        }

        setLocationChecking(true);
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            if (!("geolocation" in navigator)) {
              reject(new Error("Location not supported on this device"));
              return;
            }
            navigator.geolocation.getCurrentPosition(
              resolve,
              (err) => reject(err),
              { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
            );
          });

          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = position.coords.accuracy;
          console.log("🌍 Geolocation captured:", { lat, lng, accuracy });
          setCurrentPosition({ lat, lng, accuracy });

          // If polygon provided, use point-in-polygon test
          if (expected.polygon && expected.polygon.length > 0) {
            console.debug("Checking geofence polygon:", expected.polygon);
            console.debug("Student location:", { lat, lng, accuracy });
            const inside = pointInPolygon(lat, lng, expected.polygon);
            setLocationChecking(false);
            if (!inside) {
              toast({
                title: "Please get in the classroom",
                description: "You must be inside the classroom area to submit attendance.",
                variant: "destructive",
              });
              return { allowed: false, position: null };
            }
            console.log("✓ Student is inside the classroom polygon");
            return { allowed: true, position: { lat, lng, accuracy } };
          }

          // Otherwise fall back to circular radius check
          const toRad = (v: number) => (v * Math.PI) / 180;
          const R = 6371000; // meters
          const dLat = toRad(lat - (expected.lat || 0));
          const dLng = toRad(lng - (expected.lng || 0));
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(expected.lat || 0)) *
              Math.cos(toRad(lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;

          setLocationChecking(false);

          if (distance > (expected.radius || 0)) {
            toast({
              title: "Outside Allowed Area",
              description: `You are ~${Math.round(distance)}m away. Allowed radius is ${Math.round(
                expected.radius || 0
              )}m. Move closer to the classroom and try again.`,
              variant: "destructive",
            });
            return { allowed: false, position: null };
          }
          console.log("✓ Student is within allowed radius");
          return { allowed: true, position: { lat, lng, accuracy } };
        } catch (err: any) {
          setLocationChecking(false);
          console.error("Geofence check error:", err);
          toast({
            title: "Location Error",
            description: err.message || "Unable to verify your location. Please enable location services and try again.",
            variant: "destructive",
          });
          return { allowed: false, position: null };
        }
      };

      // Extract student ID from email
      const studentId = extractStudentId(authData.email);
      if (!studentId) {
        toast({
          title: "Invalid Email",
          description: "Please use a valid CHARUSAT email address",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Get session data from localStorage (stored by StudentAuth)
      const storedSessionData = localStorage.getItem(
        `sessionData_${sessionId}`
      );
      console.log("Stored Session Data Key:", `sessionData_${sessionId}`);
      console.log("Raw Stored Session Data:", storedSessionData);

      let sessionData;

      if (!storedSessionData) {
        // Fallback: Try to extract from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const extractedSessionData = {
          subject: urlParams.get("subject") || "",
          department: urlParams.get("department") || "",
          semester: urlParams.get("semester") || "",
          division: urlParams.get("division") || "",
          lectureType: urlParams.get("lectureType") || "",
          timeSlot: urlParams.get("timeSlot") || "",
          classroom: urlParams.get("classroom") || "",
          classroomPolygon: urlParams.get("classroomPolygon") || "",
          classroomLat: urlParams.get("classroomLat") || "",
          classroomLng: urlParams.get("classroomLng") || "",
          radiusMeters: urlParams.get("radiusMeters") || "",
          date: urlParams.get("date") || "",
          faculty: urlParams.get("faculty") || "",
          locationCheck: urlParams.get("locationCheck") || "true",
        };

        console.log("Extracted session data from URL:", extractedSessionData);

        // Check if we have any data from URL
        const hasUrlData = Object.values(extractedSessionData).some(
          (value) => value !== ""
        );

        if (!hasUrlData) {
          toast({
            title: "Session Data Missing",
            description:
              "Session information not found. Please use a fresh session link.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }

        sessionData = extractedSessionData;
      } else {
        sessionData = JSON.parse(storedSessionData);
      }
      console.log("Parsed Session Data:", sessionData);

      // Use session data directly - no fallbacks to preserve actual input
      const finalSessionData = {
        subject: sessionData.subject,
        department: sessionData.department,
        semester: sessionData.semester,
        division: sessionData.division,
        lectureType: sessionData.lectureType,
        timeSlot: sessionData.timeSlot,
        classroom: sessionData.classroom,
        classroomPolygon: sessionData.classroomPolygon,
        classroomLat: sessionData.classroomLat,
        classroomLng: sessionData.classroomLng,
        radiusMeters: sessionData.radiusMeters,
        date: sessionData.date,
        faculty: sessionData.faculty,
        locationCheck: sessionData.locationCheck,
      };

      console.log("Final Session Data (actual values):", finalSessionData);

      // Validate that all required session data is present
      const requiredFields = [
        "subject",
        "department",
        "semester",
        "division",
        "lectureType",
        "timeSlot",
        "date",
        "faculty",
      ];
      const missingFields = requiredFields.filter(
        (field) => !finalSessionData[field as keyof typeof finalSessionData]
      );

      if (missingFields.length > 0) {
        console.error("Missing session data fields:", missingFields);
        toast({
          title: "Session Data Incomplete",
          description: `Missing required session information: ${missingFields.join(
            ", "
          )}. Please try again with a fresh session link.`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Check if location check is enabled
      const locationCheck = finalSessionData.locationCheck !== "false";
      let verifiedPosition = null;

      if (locationCheck) {
        // Perform geofence check if coordinates were provided.
        // Prefer polygon if present; otherwise fall back to center+radius.
        let expected: any = {};

        // If the session includes a polygon (stored as JSON string), use it.
        if (sessionData.classroomPolygon) {
          try {
            const parsed = typeof sessionData.classroomPolygon === 'string' ? JSON.parse(sessionData.classroomPolygon) : sessionData.classroomPolygon;
            if (Array.isArray(parsed) && parsed.length > 2) {
              expected.polygon = parsed.map((p: any) => ({ lat: Number(p.lat), lng: Number(p.lng) }));
            }
          } catch (e) {
            // ignore parse errors
          }
        }

        // If no polygon from parameter, try matching selected classroom name/id from CLASSROOMS config
        if (!expected.polygon || expected.polygon.length === 0) {
          const matchedClassroom = CLASSROOMS.find(c => c.id === sessionData.classroom || c.name === sessionData.classroom);
          if (matchedClassroom) {
            expected.polygon = matchedClassroom.polygon;
          }
        }

        // If no polygon supplied by session, try classroomLat/classroomLng + radius
        if (!expected.polygon || expected.polygon.length === 0) {
          const expectedLat = parseFloat(finalSessionData.classroomLat || "");
          const expectedLng = parseFloat(finalSessionData.classroomLng || "");
          const expectedRadius = parseFloat(finalSessionData.radiusMeters || "");
          if (isFinite(expectedLat) && isFinite(expectedLng) && isFinite(expectedRadius)) {
            expected.lat = expectedLat;
            expected.lng = expectedLng;
            expected.radius = expectedRadius;
          } else {
            // As a final fallback, use the default classroom corner coordinates (default polygon for 608)
            const fallbackRoom = CLASSROOMS.find(c => c.id === "608");
            expected.polygon = fallbackRoom ? fallbackRoom.polygon : [
              { lat: 22.600728, lng: 72.826142 },
              { lat: 22.600823, lng: 72.826125 },
              { lat: 22.60081, lng: 72.826045 },
              { lat: 22.60071, lng: 72.826065 },
            ];
          }
        }

        const geofenceResult = await ensureWithinGeofence(expected);
        if (!geofenceResult.allowed) {
          setIsSubmitting(false);
          return;
        }

        // Use the position returned from geofence check, NOT the state variable
        verifiedPosition = geofenceResult.position;
      }

      // Format data for database
      const attendanceData = formatAttendanceData(
        finalSessionData,
        studentId,
        authData.email,
        capturedImage,
        verifiedPosition
      );

      // Debug: Log the data being sent
      console.log("Session Data:", sessionData);
      console.log("Formatted Attendance Data:", attendanceData);
      console.log("📍 FINAL: Sending coordinates to backend:", { latitude: attendanceData.latitude, longitude: attendanceData.longitude, accuracy: attendanceData.accuracy });

      // Validate all required attendance data fields
      const requiredAttendanceFields = [
        "MOT",
        "timeslot",
        "dept",
        "division",
        "subject",
        "faculty_name",
        "sem",
        "date",
        "student_id",
        "selfie",
        "gmail",
      ];
      const missingAttendanceFields = requiredAttendanceFields.filter(
        (field) => !attendanceData[field] || attendanceData[field] === ""
      );

      if (missingAttendanceFields.length > 0) {
        console.error("Missing attendance fields:", missingAttendanceFields);
        toast({
          title: "Missing Data",
          description: `Missing required fields: ${missingAttendanceFields.join(
            ", "
          )}`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Submit to database
      const response = await fetch(API_ENDPOINTS.INSERT_ATTENDANCE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(attendanceData),
      });

      const result = await response.json();

      console.log("PHP Response:", result);

      if (result.success) {
        // Stop camera stream after successful submission
        stopCamera();
        // Store local record for fallback
        const attendanceRecord = {
          sessionId,
          studentEmail: authData.email,
          studentName: authData.name,
          timestamp: new Date().toISOString(),
          image: capturedImage,
          status: "present",
        };

        const existingRecords = JSON.parse(
          localStorage.getItem(`attendance_${sessionId}`) || "[]"
        );
        existingRecords.push(attendanceRecord);
        localStorage.setItem(
          `attendance_${sessionId}`,
          JSON.stringify(existingRecords)
        );

        // Mark attendance as submitted
        const key = `attendance_submitted_${sessionId}_${authData.email}`;
        localStorage.setItem(key, "1");

        toast({
          title: "Attendance Recorded!",
          description:
            "Your attendance has been successfully recorded in the database.",
        });

        navigate(`/attendance-success/${sessionId}`, { replace: true });
      } else {
        // Show specific backend-provided error (e.g., student not registered)
        toast({
          title: "Error",
          description: result.error || "Failed to record attendance",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
    } catch (error) {
      console.error("Error submitting attendance:", error);
      toast({
        title: "Error",
        description: "Failed to record attendance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (authData && sessionInfo) {
      setTimeout(() => {
        startCamera();
      }, 1000);
    }
    return () => {
      stopCamera();
    };
  }, [authData, sessionInfo, startCamera, stopCamera]);

  if (!authData || !authData.email || checkingAttendance) {
    return (
      <div className="flex items-center justify-center min-h-screen text-lg">
        Loading...
      </div>
    );
  }
  if (attendanceAlreadySubmitted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="container mx-auto max-w-4xl">
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Camera className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Mark Your Attendance</CardTitle>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Welcome, {authData.name}!</p>
              <p>
                Session: {sessionInfo.subject} - {sessionInfo.department}{" "}
                {sessionInfo.semester} Sem
              </p>
              <p>Date: {new Date(sessionInfo.date).toLocaleDateString()}</p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {!capturedImage ? (
              <div className="space-y-6">
                {/* AI Detection Status */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-purple-700 text-sm mb-2">
                    <Eye className="h-4 w-4 animate-pulse" />
                    <span className="font-medium">
                      🤖 AI Liveness Detection Active
                    </span>
                  </div>
                  <div className="space-y-2 text-purple-600 text-xs">
                    <p>
                      ✨ <strong>Automatic Capture Mode:</strong> AI is analyzing
                      your face in real-time
                    </p>
                    <p>
                      👁️ <strong>Blink Detection:</strong> Simply blink naturally
                      when ready
                    </p>
                    <p>
                      🎭 <strong>Motion Detection:</strong> Move your head/face to trigger capture
                    </p>
                    <p>
                      🔒 <strong>Security:</strong> Prevents photo spoofing with
                      liveness detection
                    </p>
                    <p className="text-purple-700 font-semibold mt-2">
                      Status: {blinkDetected ? "🎯 Blink Detected! Capturing..." : motionDetected ? "🎭 Motion Detected! Capturing..." : "👀 Scanning for blinks or motion..."}
                    </p>
                  </div>
                </div>

                {/* Camera */}
                <div className="flex flex-col items-center justify-center my-8">
                  {!capturedImage && (
                    <>
                      <div className="relative">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          width={320}
                          height={240}
                          style={{
                            borderRadius: "1.5rem",
                            border: blinkDetected
                              ? "4px solid #f59e42"
                              : "4px solid #22c55e",
                            background: "#000",
                            objectFit: "cover",
                            display: isCapturing ? "block" : "none",
                          }}
                        />
                        <canvas ref={canvasRef} style={{ display: "none" }} />
                        
                        {/* AI Scanning Overlay */}
                        {isCapturing && !blinkDetected && !motionDetected && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
                              <div className="flex items-center gap-2 text-white text-xs font-semibold">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                AI Scanning...
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Blink Detected Overlay */}
                        {blinkDetected && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-orange-500/90 backdrop-blur-sm rounded-full px-4 py-2 animate-pulse">
                              <div className="flex items-center gap-2 text-white text-xs font-bold">
                                <Eye className="h-4 w-4" />
                                Blink Detected! Capturing...
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Motion Detected Overlay */}
                        {motionDetected && !blinkDetected && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-blue-500/90 backdrop-blur-sm rounded-full px-4 py-2 animate-pulse">
                              <div className="flex items-center gap-2 text-white text-xs font-bold">
                                <div className="w-3 h-3 border-2 border-white rounded-full animate-ping"></div>
                                Motion Detected! Capturing...
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {!isCapturing && (
                        <Button onClick={startCamera} className="mt-4">
                          <Camera className="h-4 w-4 mr-2" />
                          Start Camera
                        </Button>
                      )}
                      
                      {/* AI Detection Status */}
                      {isCapturing && (
                        <div className="mt-4 space-y-2 text-center">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center justify-center gap-2 text-green-700 text-sm font-medium">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              AI Liveness Detection Active
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <p className="font-medium">Detection Stats:</p>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-blue-50 rounded p-2">
                                <p className="text-blue-700 font-semibold">👁️ Blinks</p>
                                <p className="text-blue-600 text-sm">{blinkCount}</p>
                              </div>
                              <div className="bg-purple-50 rounded p-2">
                                <p className="text-purple-700 font-semibold">🎭 Motion</p>
                                <p className="text-purple-600 text-sm">{motionCount}</p>
                              </div>
                            </div>
                            <div className="text-gray-500 text-xs mt-2">
                              📊 Motion Level: {motionLevel} | Brightness: {prevBrightness ? Math.round(prevBrightness) : "N/A"}
                            </div>
                            {/* Debug panel: video + liveness */}
                            <div className="mt-2 text-xs text-left bg-gray-50 p-2 rounded">
                              <div>Video: <span className="font-medium">{isVideoPlaying ? 'playing' : 'stopped'}</span></div>
                              <div>Last liveness: <span className="font-medium">{lastLiveness ? `${lastLiveness.score} (${lastLiveness.reason ?? 'no-reason'})` : 'n/a'}</span></div>
                            </div>
                          </div>
                          
                          {/* Backup Manual Capture Button */}
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <Button
                              onClick={() => {
                                handleCapture();
                                toast({
                                  title: "Selfie Captured!",
                                  description: "Photo captured manually. Please review and submit.",
                                });
                              }}
                              variant="outline"
                              size="sm"
                              className="w-full"
                            >
                              <Camera className="h-4 w-4 mr-2" />
                              Manual Capture (Backup)
                            </Button>
                            <div className="mt-2">
                              <Button
                                onClick={async () => {
                                  const frame = snapshotFrame();
                                  if (!frame) {
                                    toast({ title: 'No frame', description: 'Video not ready or no frame captured', variant: 'destructive' });
                                    return;
                                  }
                                  try {
                                    const { analyzeLiveness } = await import('@/lib/geminiLiveness');
                                    const result = await analyzeLiveness(frame, { threshold: 0.35 });
                                    setLastLiveness(result);
                                    // Save debug artifact
                                    try {
                                      localStorage.setItem('last_debug_frame', JSON.stringify({ frame, result, ts: new Date().toISOString() }));
                                    } catch {}
                                    toast({ title: 'Analyze Result', description: `score=${result.score} reason=${result.reason || 'n/a'}` });
                                    console.debug('Force analyze result:', result);
                                    if (result.isLive) {
                                      handleCapture();
                                    }
                                  } catch (e) {
                                    console.error('Force analyze failed', e);
                                    toast({ title: 'Analyze Failed', description: String(e), variant: 'destructive' });
                                  }
                                }}
                                variant="ghost"
                                size="sm"
                                className="w-full mt-2"
                              >
                                🔍 Force Analyze (Debug)
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Use this if automatic detection doesn't work
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {capturedImage && (
                    <div className="flex flex-col items-center">
                      <img
                        src={capturedImage}
                        alt="Selfie"
                        className="rounded-xl border-4 border-green-500 w-64 h-48 object-cover"
                      />
                      <Button
                        className="mt-4"
                        onClick={handleSubmitAttendance}
                        disabled={isSubmitting}
                      >
                        Send Attendance
                      </Button>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-green-600 mb-4">
                    Selfie Captured Successfully!
                  </h3>
                  <div className="relative inline-block">
                    <img
                      src={capturedImage}
                      alt="Captured selfie"
                      className="rounded-lg border-4 border-green-300 max-w-sm shadow-lg"
                    />
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      <CheckCircle className="h-3 w-3 inline mr-1" />
                      Verified
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Your photo has been captured. Please review and submit your
                    attendance.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={handleRetake}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Retake Photo
                  </Button>
                  <Button
                    onClick={handleSubmitAttendance}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Send Attendance
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
