import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { CLASSROOMS } from "@/config/classrooms";
import { SUBJECTS_MAP } from "@/config/subjects";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Header } from "@/components/Header";
import {
  Calendar,
  Clock,
  User,
  BookOpen,
  Users,
  GraduationCap,
  ArrowLeft,
  Lock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export const TakeAttendance = () => {
  const [formData, setFormData] = useState({
    timeSlot: "",
    lectureType: "",
    subject: "",
    faculty: "",
    department: "",
    division: "",
    className: "",
    semester: "",
    date: new Date().toISOString().split("T")[0],
    locationCheck: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const storedTeacherInfo = localStorage.getItem("teacherInfo");
    if (storedTeacherInfo) {
      try {
        const teacherData = JSON.parse(storedTeacherInfo);
        if (teacherData?.name) {
          setFormData((prev) => ({ ...prev, faculty: teacherData.name }));
        }
      } catch (error) {
        // ignore parse errors
      }
    }
  }, []);

  const handleBack = () => {
    navigate("/teacher-dashboard");
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      // Reset dependent fields
      ...(field === "lectureType" ? { timeSlot: "" } : {}),
      ...(field === "department" ? { division: "", subject: "" } : {}),
      ...(field === "semester" ? { subject: "" } : {}),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const requiredFields = [
      "lectureType",
      "timeSlot",
      "subject",
      "department",
      "division",
      "semester",
      "date",
    ];
    const missingFields = requiredFields.filter(
      (field) => !formData[field as keyof typeof formData]
    );

    if (missingFields.length > 0) {
      toast({
        title: "Missing Information",
        description: `Please fill in: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create session data
      const sessionId = `session_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Get selected classroom object to extract its geofence polygon
      const selectedClassroom = CLASSROOMS.find(c => c.id === formData.className);
      const classroomPolygonStr = selectedClassroom 
        ? JSON.stringify(selectedClassroom.polygon)
        : "";

      // Create URL with session data as query parameters
      const sessionParams = new URLSearchParams({
        subject: formData.subject,
        department: formData.department,
        semester: formData.semester,
        division: formData.division,
        lectureType: formData.lectureType,
        timeSlot: formData.timeSlot,
        classroom: formData.className,
        classroomPolygon: classroomPolygonStr,
        date: formData.date,
        faculty: formData.faculty,
        locationCheck: formData.locationCheck.toString(),
      });

      const attendanceLink = `${
        window.location.origin
      }/student-auth/${sessionId}?${sessionParams.toString()}`;

      const sessionData = {
        sessionId,
        attendanceLink,
        subject: formData.subject,
        department: formData.department,
        semester: formData.semester,
        division: formData.division,
        lectureType: formData.lectureType,
        timeSlot: formData.timeSlot,
        classroom: formData.className,
        classroomPolygon: classroomPolygonStr,
        date: formData.date,
        faculty: formData.faculty,
        locationCheck: formData.locationCheck.toString(),
        createdAt: new Date().toISOString(),
        status: "active",
      };

      // Store in localStorage
      const existingSessions = JSON.parse(
        localStorage.getItem("attendanceSessions") || "[]"
      );
      existingSessions.push(sessionData);
      localStorage.setItem(
        "attendanceSessions",
        JSON.stringify(existingSessions)
      );

      setIsLoading(false);
      toast({
        title: "Attendance Session Created!",
        description: "QR code and link have been generated successfully",
      });

      // Navigate to QR code page with session data
      navigate("/qr-code", { state: sessionData });
    } catch (error) {
      console.error("Error creating session:", error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Failed to create attendance session",
        variant: "destructive",
      });
    }
  };

  const lectureTimeSlots = [
    "9:10 to 10:10",
    "10:10 to 11:10",
    "12:10 to 1:10",
    "1:10 to 2:10",
    "2:20 to 3:20",
    "3:20 to 4:20",
  ];

  const labTimeSlots = ["9:10 to 11:10", "12:10 to 2:10", "2:20 to 4:20"];

  const timeSlots =
    formData.lectureType === "lab"
      ? labTimeSlots
      : formData.lectureType === "lecture"
      ? lectureTimeSlots
      : [];

  const semesters = ["1", "2", "3", "4", "5", "6", "7", "8"];
  const classes = CLASSROOMS;

  const departments = ["IT", "CSE", "CE"];

  const divisionOptions = formData.department
    ? [`${formData.department} 1`, `${formData.department} 2`]
    : [];

  // Subject options dynamically loaded from config
  const key = `${formData.department}_${formData.semester}`;
  const subjectOptions = SUBJECTS_MAP[key] || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Header
        title="Take Attendance"
        userRole="teacher"
        userName={formData.faculty}
        onLogout={() => navigate("/login")}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Button onClick={handleBack} variant="outline" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Create Attendance Session
              </CardTitle>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lectureType">Lecture / Lab</Label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                      <Select
                        onValueChange={(value) =>
                          handleInputChange("lectureType", value)
                        }
                        required
                      >
                        <SelectTrigger className="pl-10">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border shadow-lg z-50">
                          <SelectItem value="lecture">Lecture</SelectItem>
                          <SelectItem value="lab">Lab</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeSlot">Time Slot</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                      <Select
                        onValueChange={(value) =>
                          handleInputChange("timeSlot", value)
                        }
                        required
                      >
                        <SelectTrigger
                          className="pl-10"
                          disabled={!formData.lectureType}
                        >
                          <SelectValue
                            placeholder={
                              formData.lectureType
                                ? "Select time slot"
                                : "Select type first"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className="bg-white border shadow-lg z-50">
                          {timeSlots.map((slot) => (
                            <SelectItem key={slot} value={slot}>
                              {slot}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Department and Division */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                      <Select
                        onValueChange={(value) =>
                          handleInputChange("department", value)
                        }
                        required
                      >
                        <SelectTrigger className="pl-10">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border shadow-lg z-50">
                          {departments.map((dep) => (
                            <SelectItem key={dep} value={dep}>
                              {dep}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="division">Division</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                      <Select
                        onValueChange={(value) =>
                          handleInputChange("division", value)
                        }
                        required
                      >
                        <SelectTrigger
                          className="pl-10"
                          disabled={!formData.department}
                        >
                          <SelectValue
                            placeholder={
                              formData.department
                                ? "Select division"
                                : "Select department first"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className="bg-white border shadow-lg z-50">
                          {divisionOptions.map((div) => (
                            <SelectItem key={div} value={div}>
                              {div}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="semester">Semester</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                    <Select
                      onValueChange={(value) =>
                        handleInputChange("semester", value)
                      }
                      required
                    >
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border shadow-lg z-50">
                        {semesters.map((sem) => (
                          <SelectItem key={sem} value={sem}>
                            Semester {sem}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                    <Select
                      onValueChange={(value) => handleInputChange("subject", value)}
                      disabled={!formData.department || !formData.semester}
                      required
                    >
                      <SelectTrigger className="pl-10">
                        <SelectValue
                          placeholder={
                            subjectOptions.length > 0
                              ? "Select subject"
                              : "Select department (IT) and semester"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="bg-white border shadow-lg z-50">
                        {subjectOptions.length > 0 ? (
                          subjectOptions.map((subj) => (
                            <SelectItem key={subj} value={subj}>
                              {subj}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="__placeholder" disabled>
                            {formData.department === "IT"
                              ? "Select Semester 1 or 5 to view subjects"
                              : "Subjects available only for IT"}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="faculty">Faculty Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="faculty"
                      type="text"
                      placeholder="Auto-filled from your profile"
                      value={formData.faculty}
                      className="pl-10 pr-10 font-semibold bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100 disabled:opacity-100 disabled:cursor-not-allowed border-gray-300"
                      disabled
                      readOnly
                    />
                    <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="className">Class</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                    <Select
                      onValueChange={(value) =>
                        handleInputChange("className", value)
                      }
                      required
                    >
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border shadow-lg z-50">
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        handleInputChange("date", e.target.value)
                      }
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
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
                    checked={formData.locationCheck}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, locationCheck: checked }))
                    }
                  />
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading
                    ? "Creating Session..."
                    : "Generate QR Code & Link"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
