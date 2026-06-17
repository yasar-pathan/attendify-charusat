import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/Header";
import { UserPlus, Users, Mail, Lock, User, UserMinus, ArrowLeft, GraduationCap, Hash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS } from "@/config/api";

export const StudentManagement = () => {
  const [studentForm, setStudentForm] = useState({
    studentId: "",
    name: "",
    email: "",
    department: "",
    division: "",
    semester: "",
  });
  const [removeStudentId, setRemoveStudentId] = useState("");
  const [isLoadingAdd, setIsLoadingAdd] = useState(false);
  const [isLoadingRemove, setIsLoadingRemove] = useState(false);
  const [studentCount, setStudentCount] = useState(0);
  const [isLoadingCount, setIsLoadingCount] = useState(true);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [showStudentsList, setShowStudentsList] = useState(false);
  const [isDeptLocked, setIsDeptLocked] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const departments = ["IT", "CSE", "CE"];
  const divisions = ["1", "2"];
  const allSemesters = ["1", "2", "3", "4", "5", "6", "7", "8"];
  
  // Get available semesters based on student ID (diploma students skip sem 1&2)
  const getAvailableSemesters = (studentId: string) => {
    if (studentId.toLowerCase().startsWith('d')) {
      return allSemesters.filter(sem => sem !== "1" && sem !== "2");
    }
    return allSemesters;
  };

  const fetchStudentCount = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.GET_STUDENTS_COUNT);
      const data = await res.json();
      if (res.ok && data.success) {
        setStudentCount(data.total_count);
      } else {
        console.error('Failed to fetch student count:', data.error);
      }
    } catch (err) {
      console.error('Error fetching student count:', err);
    } finally {
      setIsLoadingCount(false);
    }
  };

  const fetchStudentsList = async () => {
    setIsLoadingStudents(true);
    try {
      const res = await fetch(API_ENDPOINTS.GET_STUDENTS_LIST);
      const data = await res.json();
      if (res.ok && data.success) {
        setStudentsList(data.students);
      } else {
        setStudentsList([]);
      }
    } catch (err) {
      setStudentsList([]);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleBack = () => {
    navigate("/admin-dashboard");
  };

  useEffect(() => {
    fetchStudentCount();
    fetchStudentsList();
  }, []);

  // After add/remove, refresh list
  const afterStudentChange = () => {
    fetchStudentCount();
    fetchStudentsList();
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingAdd(true);
    try {
      const res = await fetch(API_ENDPOINTS.ADD_STUDENT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentForm.studentId,
          name: studentForm.name,
          email: studentForm.email,
          department: studentForm.department,
          division: studentForm.division,
          semester: studentForm.semester,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ 
          title: "Student Added Successfully!", 
          description: `${studentForm.name} (${studentForm.studentId}) has been added to the system` 
        });
        setStudentForm({
          studentId: "",
          name: "",
          email: "",
          department: "",
          division: "",
          semester: "",
        });
        afterStudentChange();
      } else {
        toast({ title: "Failed to add student", description: data.error || "Unknown error", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Network error", description: "Could not reach server", variant: "destructive" });
    } finally {
      setIsLoadingAdd(false);
    }
  };

  const handleRemoveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingRemove(true);
    try {
      const res = await fetch(API_ENDPOINTS.REMOVE_STUDENT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: removeStudentId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ 
          title: "Student Removed", 
          description: `${data.student_name} (${removeStudentId}) has been removed from the system` 
        });
        setRemoveStudentId("");
        afterStudentChange();
      } else {
        toast({ title: "Failed to remove student", description: data.error || "Unknown error", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Network error", description: "Could not reach server", variant: "destructive" });
    } finally {
      setIsLoadingRemove(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === "studentId") {
      const isDiplomaStudent = value.toLowerCase().startsWith('d');
      setStudentForm(prev => {
        let updated = { ...prev, [field]: value };
        if (isDiplomaStudent && (prev.semester === "1" || prev.semester === "2")) {
          updated.semester = "";
        }
        // Auto-fill email if empty or matches previous enrollment-based email
        const prevEnrollmentEmail = prev.studentId ? `${prev.studentId}@charusat.edu.in` : "";
        if (!prev.email || prev.email === prevEnrollmentEmail) {
          updated.email = value ? `${value}@charusat.edu.in` : "";
        }
        // Auto-select and lock department
        const idLower = value.toLowerCase();
        if (idLower.includes('it')) {
          updated.department = 'IT';
          setIsDeptLocked(true);
        } else if (idLower.includes('cse')) {
          updated.department = 'CSE';
          setIsDeptLocked(true);
        } else if (idLower.includes('ce')) {
          updated.department = 'CE';
          setIsDeptLocked(true);
        } else {
          setIsDeptLocked(false);
        }
        return updated;
      });
    } else {
      setStudentForm(prev => ({ ...prev, [field]: value }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Header 
        title="Student Management" 
        userRole="admin" 
        userName="Admin"
        onLogout={() => navigate("/login?role=admin")}
      />
      
      <div className="container mx-auto px-4 py-8">
        <Button onClick={handleBack} variant="outline" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Stats Card */}
        <div className="mb-8">
          <Card className="shadow-lg border-0 bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Students</p>
                  <p className="text-3xl font-bold">
                    {isLoadingCount ? "..." : studentCount}
                  </p>
                </div>
                <Users className="h-12 w-12 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Student Management Forms */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <UserPlus className="h-6 w-6 text-primary" />
                Add Student
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddStudent} className="space-y-4">
                                 <div className="space-y-2">
                   <Label htmlFor="studentId">Student ID</Label>
                   <div className="relative">
                     <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                     <Input
                       id="studentId"
                       type="text"
                       placeholder="e.g., d24it176 or 24it176"
                       value={studentForm.studentId}
                       onChange={(e) => handleInputChange("studentId", e.target.value)}
                       className="pl-10"
                       required
                     />
                   </div>
                   <p className="text-xs text-muted-foreground">
                     Format: [d]YYdept### (d = diploma student, YY = admission year, dept = IT/CSE/CE, ### = roll number)
                   </p>
                 </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter student's full name"
                      value={studentForm.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="student@charusat.edu.in"
                      value={studentForm.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select onValueChange={(value) => handleInputChange("department", value)} required disabled={isDeptLocked} value={studentForm.department}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select dept" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Division</Label>
                    <Select onValueChange={(value) => handleInputChange("division", value)} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select div" />
                      </SelectTrigger>
                      <SelectContent>
                        {divisions.map((div) => (
                          <SelectItem key={div} value={div}>{div}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                                     <div className="space-y-2">
                     <Label>Semester</Label>
                     <Select onValueChange={(value) => handleInputChange("semester", value)} required>
                       <SelectTrigger>
                         <SelectValue placeholder="Select sem" />
                       </SelectTrigger>
                       <SelectContent>
                         {getAvailableSemesters(studentForm.studentId).map((sem) => (
                           <SelectItem key={sem} value={sem}>{sem}</SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                </div>
                
                <Button type="submit" variant="hero" className="w-full" disabled={isLoadingAdd}>
                  {isLoadingAdd ? "Adding..." : "Add Student"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <UserMinus className="h-6 w-6 text-destructive" />
                Remove Student
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRemoveStudent} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="removeStudentId">Student ID</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                         <Input
                       id="removeStudentId"
                       type="text"
                       placeholder="e.g., d24it176 or 24it176"
                       value={removeStudentId}
                       onChange={(e) => setRemoveStudentId(e.target.value)}
                       className="pl-10"
                       required
                     />
                  </div>
                </div>
                <Button type="submit" variant="destructive" className="w-full" disabled={isLoadingRemove}>
                  {isLoadingRemove ? "Removing..." : "Remove Student"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Toggle Students List Button */}
        <div className="mt-8 flex justify-end">
          <Button variant="outline" onClick={() => setShowStudentsList((v) => !v)}>
            {showStudentsList ? "Hide Students List" : "Show Students List"}
          </Button>
        </div>

        {/* Students List Table (conditionally rendered) */}
        {showStudentsList && (
          <div className="mt-6">
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl">All Students</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingStudents ? (
                  <div>Loading students...</div>
                ) : studentsList.length === 0 ? (
                  <div>No students found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left">
                      <thead>
                        <tr>
                          <th className="px-2 py-1">Student ID</th>
                          <th className="px-2 py-1">Name</th>
                          <th className="px-2 py-1">Email</th>
                          <th className="px-2 py-1">Department</th>
                          <th className="px-2 py-1">Division</th>
                          <th className="px-2 py-1">Semester</th>
                          <th className="px-2 py-1">Created At</th>
                          <th className="px-2 py-1">Updated At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentsList.map((student) => (
                          <tr key={student.id} className="border-b">
                            <td className="px-2 py-1">{student.student_id}</td>
                            <td className="px-2 py-1">{student.name}</td>
                            <td className="px-2 py-1">{student.email}</td>
                            <td className="px-2 py-1">{student.department}</td>
                            <td className="px-2 py-1">{student.division}</td>
                            <td className="px-2 py-1">{student.semester}</td>
                            <td className="px-2 py-1">{student.created_at}</td>
                            <td className="px-2 py-1">{student.updated_at}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
