import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Shield, AlertCircle, CheckCircle } from "lucide-react";

import { GOOGLE_CONFIG } from "@/config/google";

// Google OAuth configuration
const GOOGLE_CLIENT_ID = GOOGLE_CONFIG.CLIENT_ID;

export const StudentAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [isValidEmail, setIsValidEmail] = useState(false);
  const [authError, setAuthError] = useState("");
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const location = useLocation();
  const { toast } = useToast();

  // Extract session data from URL parameters
  const [sessionData, setSessionData] = useState<any>(null);

  // Load Google Identity Services script dynamically
  useEffect(() => {
    if (!document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    // Extract session data from URL parameters
    const urlParams = new URLSearchParams(location.search);

    // Debug: Log the URL parameters
    console.log("StudentAuth - URL parameters:", Object.fromEntries(urlParams));
    console.log("StudentAuth - Full URL:", window.location.href);



    const extractedSessionData = {
      subject: urlParams.get("subject") || "",
      department: urlParams.get("department") || "",
      semester: urlParams.get("semester") || "",
      division: urlParams.get("division") || "",
      lectureType: urlParams.get("lectureType") || "",
      timeSlot: urlParams.get("timeSlot") || "",
      classroom: urlParams.get("classroom") || "",
      classroomPolygon: urlParams.get("classroomPolygon") || "",
      date: urlParams.get("date") || "",
      faculty: urlParams.get("faculty") || "",
      locationCheck: urlParams.get("locationCheck") || "true",
    };

    // Debug: Log the extracted data
    console.log("StudentAuth - Extracted session data:", extractedSessionData);

    // Store session data in localStorage for later use
    if (sessionId) {
      localStorage.setItem(
        `sessionData_${sessionId}`,
        JSON.stringify(extractedSessionData)
      );
      setSessionData(extractedSessionData);
    }

    // Check if user is already authenticated
    const storedAuth = localStorage.getItem(`studentAuth_${sessionId}`);
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        if (authData.isValid && authData.sessionId === sessionId) {
          setIsAuthenticated(true);
          setUserEmail(authData.email);
          setIsValidEmail(true);
        }
      } catch (error) {
        console.error("Error parsing stored auth:", error);
      }
    }
  }, [sessionId, location.search]);

  // Handle GIS OAuth popup login flow
  const handleGoogleAuth = () => {
    if (typeof window === "undefined" || !(window as any).google) {
      toast({
        title: "Google Sign-In is loading...",
        description: "Please wait a moment and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: "email profile openid",
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error_description) {
            console.error("Google auth callback error:", tokenResponse.error_description);
            setAuthError(tokenResponse.error_description);
            setIsLoading(false);
            return;
          }

          if (tokenResponse.access_token) {
            try {
              // Fetch user info using access token
              const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
                headers: {
                  Authorization: `Bearer ${tokenResponse.access_token}`,
                },
              });

              if (!res.ok) {
                throw new Error("Failed to fetch Google user profile");
              }

              const userInfo = await res.json();
              if (!userInfo || !userInfo.email) {
                throw new Error("No email returned from Google profile");
              }

              // Validate CHARUSAT email domain
              if (!userInfo.email.endsWith("@charusat.edu.in")) {
                toast({
                  title: "Invalid Email Domain",
                  description: `Please use your CHARUSAT official account. You signed in with: ${userInfo.email}`,
                  variant: "destructive",
                });
                setIsLoading(false);
                return;
              }

              // Store authentication details
              const authData = {
                email: userInfo.email,
                sessionId: sessionId || "default",
                isValid: true,
                timestamp: new Date().toISOString(),
                name: userInfo.name || userInfo.email.split("@")[0],
                picture: userInfo.picture || "",
              };

              localStorage.setItem(`studentAuth_${sessionId || "default"}`, JSON.stringify(authData));

              toast({
                title: "Authentication Successful!",
                description: `Welcome ${userInfo.name || userInfo.email.split("@")[0]}!`,
              });

              // Proceed to StudentAttendance screen
              navigate(`/student-attendance/${sessionId}`);
            } catch (err: any) {
              console.error("OAuth token exchange error:", err);
              setAuthError(err.message || "Failed to retrieve user information from Google.");
            } finally {
              setIsLoading(false);
            }
          } else {
            setIsLoading(false);
          }
        },
      });

      client.requestAccessToken();
    } catch (err: any) {
      console.error("Failed to initialize Google Auth client:", err);
      setAuthError("Failed to start Google sign-in. Please try again.");
      setIsLoading(false);
    }
  };

  const handleManualEmailInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setUserEmail(email);
    setIsValidEmail(email.endsWith("@charusat.edu.in"));
    setAuthError("");
  };

  const handleContinueWithEmail = () => {
    if (isValidEmail) {
      // Store authentication data
      const authData = {
        email: userEmail,
        sessionId,
        isValid: true,
        timestamp: new Date().toISOString(),
        name: userEmail.split("@")[0], // Use email prefix as name
        picture: "",
      };

      localStorage.setItem(
        `studentAuth_${sessionId}`,
        JSON.stringify(authData)
      );

      toast({
        title: "Email Verified!",
        description: "You can now proceed to mark attendance.",
      });

      console.log("Navigating to:", `/student-attendance/${sessionId}`);
      navigate(`/student-attendance/${sessionId}`);
    } else {
      setAuthError("Please enter a valid CHARUSAT email address");
    }
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-xl text-green-600">
              Already Authenticated!
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              You are already authenticated with {userEmail}
            </p>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              onClick={() => navigate(`/student-attendance/${sessionId}`)}
              className="w-full"
            >
              Continue to Attendance
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl">Student Authentication</CardTitle>
          <p className="text-sm text-muted-foreground">
            Session ID: {sessionId}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-700 text-sm">
              <Mail className="h-4 w-4" />
              <span className="font-medium">CHARUSAT Students Only</span>
            </div>
            <p className="text-blue-600 text-xs mt-1">
              ⚠️ <strong>Important:</strong> You must sign in with your official
              @charusat.edu.in Google account. Personal Gmail accounts will be
              rejected.
            </p>
          </div>

          {/* Google OAuth Button */}
          <Button
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-sm"
            size="lg"
          >
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 24 24" className="h-5 w-5">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {isLoading ? "Authenticating..." : "Continue with Google"}
            </div>
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          {/* Manual Email Input */}
          <div className="space-y-3">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Enter your CHARUSAT email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  placeholder="student@charusat.edu.in"
                  value={userEmail}
                  onChange={handleManualEmailInput}
                  className="w-full pl-10 pr-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            {userEmail && (
              <div
                className={`flex items-center gap-2 text-sm ${
                  isValidEmail ? "text-green-600" : "text-red-600"
                }`}
              >
                {isValidEmail ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {isValidEmail ? "Valid CHARUSAT email" : "Invalid email domain"}
              </div>
            )}

            <Button
              onClick={handleContinueWithEmail}
              disabled={!isValidEmail || isLoading}
              className="w-full"
              size="sm"
            >
              Continue with Email
            </Button>
          </div>

          {authError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{authError}</span>
              </div>
            </div>
          )}

          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              By continuing, you agree to our terms of service and privacy
              policy
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
