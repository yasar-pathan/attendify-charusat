import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Download,
  RotateCcw,
  ArrowLeft,
  FileSpreadsheet,
  X,
  FileDown,
  Search,
  Filter,
  Calendar,
  Users,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS } from "@/config/api";
import * as XLSX from "xlsx";

interface AttendanceRecord {
  id: number;
  student_id: string;
  selfie: string;
  attendance_time: string;
  date: string;
}

export const GetAttendance = () => {
  const [formData, setFormData] = useState({
    department: "",
    division: "",
    timeSlot: "",
    semester: "",
    date: "",
    classType: "",
  });
  const [teacherName, setTeacherName] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [isRemoving, setIsRemoving] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "student_id">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleBack = () => navigate("/teacher-dashboard");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("teacherInfo");
      if (stored) {
        const parsed = JSON.parse(stored);
        setTeacherName(parsed?.name);
      }
    } catch {}
  }, []);

  // Reset time slot when class type changes
  useEffect(() => {
    setFormData((prev) => ({ ...prev, timeSlot: "" }));
  }, [formData.classType]);

  // Build time slot options based on class type
  const timeSlotOptions = useMemo(() => {
    if (formData.classType === "Lab") {
      return ["9:10 to 11:10", "12:10 to 2:10", "2:20 to 4:20"];
    }
    return [
      "9:10 to 10:10",
      "10:10 to 11:10",
      "12:10 to 1:10",
      "1:10 to 2:10",
      "2:20 to 3:20",
      "3:20 to 4:20",
    ];
  }, [formData.classType]);

  const handleFetch = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.GET_ATTENDANCE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setAttendanceData(result.data);
        toast({
          title: "Attendance Fetched!",
          description: `Found ${result.count} attendance records`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch attendance data",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch attendance data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveRecord = async (id: number) => {
    setIsRemoving(id);
    try {
      const response = await fetch(API_ENDPOINTS.REMOVE_ATTENDANCE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const result = await response.json();

      if (result.success) {
        setAttendanceData((prev) => prev.filter((record) => record.id !== id));
        toast({
          title: "Record Removed!",
          description: "Attendance record has been deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to remove record",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove record",
        variant: "destructive",
      });
    } finally {
      setIsRemoving(null);
    }
  };

  // Inline selfie display; no modal needed

  const handleResetClick = () => {
    if (attendanceData.length === 0) {
      toast({
        title: "No Data",
        description: "No attendance data to reset",
        variant: "destructive",
      });
      return;
    }
    setShowResetDialog(true);
  };

  const handleResetConfirm = () => {
    setShowResetDialog(false);
    setShowPasswordDialog(true);
  };

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      toast({
        title: "Password Required",
        description: "Please enter your password to continue",
        variant: "destructive",
      });
      return;
    }

    setIsResetting(true);
    try {
      // Get teacher info from localStorage
      const teacherInfo = localStorage.getItem("teacherInfo");
      if (!teacherInfo) {
        throw new Error("Teacher information not found");
      }

      const teacherData = JSON.parse(teacherInfo);

      // Verify password by attempting to login
      const response = await fetch(API_ENDPOINTS.TEACHER_LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: teacherData.email,
          password: password,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Password is correct, now delete attendance records
        await deleteAttendanceRecords();
      } else {
        toast({
          title: "Incorrect Password",
          description: "Please enter the correct password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify password",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
      setPassword("");
      setShowPasswordDialog(false);
    }
  };

  const deleteAttendanceRecords = async () => {
    try {
      // Build filter parameters for deletion
      const filterParams = {
        department: formData.department,
        division: formData.division,
        timeSlot: formData.timeSlot,
        semester: formData.semester,
        date: formData.date,
      };

      // Use the bulk deletion endpoint
      const response = await fetch(API_ENDPOINTS.DELETE_ATTENDANCE_BULK, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(filterParams),
      });

      const result = await response.json();

      if (result.success) {
        // Reset local state
        setFormData({
          department: "",
          division: "",
          timeSlot: "",
          semester: "",
          date: "",
          classType: "",
        });
        setAttendanceData([]);
        setSearchTerm("");
        setSortBy("date");
        setSortOrder("desc");

        toast({
          title: "Records Deleted!",
          description: `${result.deletedCount} attendance records have been permanently deleted from the database`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete records",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete attendance records",
        variant: "destructive",
      });
    }
  };

  // Computed properties for better performance
  const filteredAndSortedData = useMemo(() => {
    let filtered = attendanceData;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((record) =>
        record.student_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      if (sortBy === "date") {
        aValue = new Date(a.attendance_time).getTime();
        bValue = new Date(b.attendance_time).getTime();
      } else {
        aValue = a.student_id;
        bValue = b.student_id;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [attendanceData, searchTerm, sortBy, sortOrder]);

  const attendanceStats = useMemo(() => {
    const total = attendanceData.length;
    const today = new Date().toISOString().split("T")[0];
    const todayCount = attendanceData.filter(
      (record) => record.date === today
    ).length;

    return { total, today: todayCount };
  }, [attendanceData]);

  const handleDownloadExcel = () => {
    if (filteredAndSortedData.length === 0) {
      toast({
        title: "No Data",
        description: "No attendance data to download",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create comprehensive worksheet data
      const worksheetData = filteredAndSortedData.map((record, index) => ({
        "S.No.": index + 1,
        "Student ID": record.student_id || "N/A",
        "Date": record.date || "N/A",
        "Time": record.attendance_time ? new Date(record.attendance_time).toLocaleTimeString() : "N/A",
        "Status": "Present"
      }));

      // Add session info at the top
      const sessionInfo = [
        { "S.No.": "Session Details", "Student ID": "", "Date": "", "Time": "", "Status": "" },
        { "S.No.": "Department:", "Student ID": formData.department || "All", "Date": "", "Time": "", "Status": "" },
        { "S.No.": "Division:", "Student ID": formData.division || "All", "Date": "", "Time": "", "Status": "" },
        { "S.No.": "Semester:", "Student ID": formData.semester || "All", "Date": "", "Time": "", "Status": "" },
        { "S.No.": "Time Slot:", "Student ID": formData.timeSlot || "All", "Date": "", "Time": "", "Status": "" },
        { "S.No.": "Date Filter:", "Student ID": formData.date || "All", "Date": "", "Time": "", "Status": "" },
        { "S.No.": "", "Student ID": "", "Date": "", "Time": "", "Status": "" },
        { "S.No.": "Attendance Records", "Student ID": "", "Date": "", "Time": "", "Status": "" },
        ...worksheetData
      ];

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(sessionInfo);

      // Set column widths for better readability
      worksheet["!cols"] = [
        { width: 10 }, // S.No.
        { width: 20 }, // Student ID
        { width: 15 }, // Date
        { width: 15 }, // Time
        { width: 12 }  // Status
      ];

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Report");

      // Generate filename with session details
      const currentDate = new Date().toISOString().split("T")[0];
      const dept = formData.department || "All";
      const div = formData.division ? formData.division.replace(/\s+/g, "") : "All";
      const filename = `Attendance_${dept}_${div}_${currentDate}.xlsx`;

      // Download the file
      XLSX.writeFile(workbook, filename);

      toast({
        title: "Excel Downloaded!",
        description: `Attendance report with ${filteredAndSortedData.length} students has been downloaded successfully`,
      });
    } catch (error) {
      console.error("Excel download error:", error);
      toast({
        title: "Download Failed",
        description: "Failed to generate Excel file. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Header
        title="Get Attendance"
        userRole="teacher"
        userName={teacherName}
        onLogout={() => navigate("/login")}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={handleBack}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>

          {attendanceData.length > 0 && (
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                Total: {attendanceStats.total}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Today: {attendanceStats.today}
              </Badge>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                Filter Attendance Records
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Class Type</Label>
                <Select
                  value={formData.classType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, classType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="Lecture">Lecture</SelectItem>
                    <SelectItem value="Lab">Lab</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Department</Label>
                  <Select
                    onValueChange={(value) =>
                      setFormData({ ...formData, department: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="IT">IT</SelectItem>
                      <SelectItem value="CSE">CSE</SelectItem>
                      <SelectItem value="CE">CE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Division</Label>
                  <Select
                    onValueChange={(value) =>
                      setFormData({ ...formData, division: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          formData.department
                            ? "Select division"
                            : "Select department first"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {formData.department && (
                        <>
                          <SelectItem
                            value={`${formData.department} 1`}
                          >{`${formData.department} 1`}</SelectItem>
                          <SelectItem
                            value={`${formData.department} 2`}
                          >{`${formData.department} 2`}</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Time Slot</Label>
                  <Select
                    value={formData.timeSlot}
                    onValueChange={(value) =>
                      setFormData({ ...formData, timeSlot: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time slot" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {timeSlotOptions.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Semester</Label>
                  <Select
                    onValueChange={(value) =>
                      setFormData({ ...formData, semester: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <SelectItem key={i + 1} value={`${i + 1}`}>
                          Semester {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Input
                type="date"
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />

              <div className="flex gap-4">
                <Button
                  onClick={handleFetch}
                  variant="hero"
                  className="flex-1"
                  disabled={isLoading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isLoading ? "Fetching..." : "Fetch"}
                </Button>
                <Button
                  onClick={handleResetClick}
                  variant="destructive"
                  className="flex-1"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Data
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Attendance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span>Total Students</span>
                    <span className="font-bold">{attendanceStats.total}</span>
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span>Present</span>
                    <span className="font-bold text-green-600">
                      {attendanceStats.total}
                    </span>
                  </div>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span>Absent</span>
                    <span className="font-bold text-red-600">0</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Table */}
        {attendanceData.length > 0 && (
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm mt-8">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                  Attendance Records ({filteredAndSortedData.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by Student ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select
                    value={sortBy}
                    onValueChange={(value: "date" | "student_id") =>
                      setSortBy(value)
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Sort by Date</SelectItem>
                      <SelectItem value="student_id">Sort by ID</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                    }
                    className="flex items-center gap-1"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${
                        sortOrder === "desc" ? "rotate-180" : ""
                      }`}
                    />
                    {sortOrder === "asc" ? "Asc" : "Desc"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Index</TableHead>
                    <TableHead className="font-semibold">Student ID</TableHead>
                    <TableHead className="font-semibold">Selfie</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedData.map((record, index) => (
                    <TableRow
                      key={record.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <TableCell className="font-medium text-center">
                        <Badge variant="outline" className="font-mono">
                          {index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <Badge variant="secondary">{record.student_id}</Badge>
                      </TableCell>
                      <TableCell>
                        <img
                          src={record.selfie}
                          alt="Student selfie"
                          className="h-60 w-60 object-cover rounded-md border border-gray-200"
                        />
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(record.attendance_time).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveRecord(record.id)}
                          disabled={isRemoving === record.id}
                          className="h-8 w-8 p-0 hover:bg-red-50"
                        >
                          {isRemoving === record.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Download Excel Button */}
        {attendanceData.length > 0 && (
          <div className="mt-8 flex justify-center">
            <Card className="shadow-lg border-0 bg-gradient-to-r from-green-50 to-emerald-50 p-6">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center">
                  <div className="p-3 bg-green-100 rounded-full">
                    <FileDown className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Export Attendance Data
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Download an Excel file with {filteredAndSortedData.length} attendance records including session details
                  </p>
                  <Button
                    onClick={handleDownloadExcel}
                    variant="default"
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <FileDown className="h-5 w-5 mr-2" />
                    Download Excel Report
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Inline selfie display replaces modal */}

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <RotateCcw className="h-5 w-5" />
              Warning: Delete Attendance Records
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700">
              Are you sure you want to permanently delete all attendance records
              for this session? This action cannot be undone and will remove{" "}
              {attendanceData.length} records from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Yes, Delete Records
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Password Verification Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-red-600" />
              Verify Your Password
            </DialogTitle>
            <DialogDescription>
              Please enter your account password to confirm the deletion of
              attendance records.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="mt-1"
                disabled={isResetting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordDialog(false);
                setPassword("");
              }}
              disabled={isResetting}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePasswordSubmit}
              disabled={isResetting || !password.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isResetting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Delete Records"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
