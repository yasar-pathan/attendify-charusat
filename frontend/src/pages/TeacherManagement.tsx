import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { UserPlus, Users, Mail, Lock, User, UserMinus, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS } from "@/config/api";

export const TeacherManagement = () => {
  const [teacherForm, setTeacherForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [removeEmail, setRemoveEmail] = useState("");
  const [isLoadingAdd, setIsLoadingAdd] = useState(false);
  const [isLoadingRemove, setIsLoadingRemove] = useState(false);
  const [teacherCount, setTeacherCount] = useState(0);
  const [isLoadingCount, setIsLoadingCount] = useState(true);
  const [teachersList, setTeachersList] = useState<any[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(true);
  const [showTeachersList, setShowTeachersList] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchTeacherCount = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.GET_TEACHERS_COUNT);
      const data = await res.json();
      if (res.ok && data.success) {
        setTeacherCount(data.count);
      } else {
        console.error('Failed to fetch teacher count:', data.error);
      }
    } catch (err) {
      console.error('Error fetching teacher count:', err);
    } finally {
      setIsLoadingCount(false);
    }
  };

  const fetchTeachersList = async () => {
    setIsLoadingTeachers(true);
    try {
      const res = await fetch(API_ENDPOINTS.GET_TEACHERS_LIST);
      const data = await res.json();
      if (res.ok && data.success) {
        setTeachersList(data.teachers);
      } else {
        setTeachersList([]);
      }
    } catch (err) {
      setTeachersList([]);
    } finally {
      setIsLoadingTeachers(false);
    }
  };

  const handleBack = () => {
    navigate("/admin-dashboard");
  };

  useEffect(() => {
    fetchTeacherCount();
    fetchTeachersList();
  }, []);

  // After add/remove, refresh list
  const afterTeacherChange = () => {
    fetchTeacherCount();
    fetchTeachersList();
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingAdd(true);
    try {
      const res = await fetch(API_ENDPOINTS.ADD_TEACHER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Full_Name: teacherForm.name,
          Email: teacherForm.email,
          Password: teacherForm.password,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: "Teacher Registered Successfully!", description: `${teacherForm.name} has been added to the system` });
        setTeacherForm({ name: "", email: "", password: "" });
        afterTeacherChange();
      } else {
        toast({ title: "Failed to add teacher", description: data.error || "Unknown error", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Network error", description: "Could not reach server", variant: "destructive" });
    } finally {
      setIsLoadingAdd(false);
    }
  };

  const handleRemoveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingRemove(true);
    try {
      const res = await fetch(API_ENDPOINTS.REMOVE_TEACHER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Email: removeEmail }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: "Teacher Removed", description: `${removeEmail} has been removed from the system` });
        setRemoveEmail("");
        afterTeacherChange();
      } else {
        toast({ title: "Failed to remove teacher", description: data.error || "Unknown error", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Network error", description: "Could not reach server", variant: "destructive" });
    } finally {
      setIsLoadingRemove(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setTeacherForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Header 
        title="Teacher Management" 
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
          <Card className="shadow-lg border-0 bg-gradient-to-br from-primary to-primary-glow text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Teachers</p>
                  <p className="text-3xl font-bold">
                    {isLoadingCount ? "..." : teacherCount}
                  </p>
                </div>
                <Users className="h-12 w-12 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Teacher Management Forms */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <UserPlus className="h-6 w-6 text-primary" />
                Add Teacher
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddTeacher} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter teacher's full name"
                      value={teacherForm.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="teacher@charusat.edu.in"
                      value={teacherForm.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create password for teacher"
                      value={teacherForm.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Button type="submit" variant="hero" className="w-full" disabled={isLoadingAdd}>
                    {isLoadingAdd ? "Registering..." : "Register Teacher"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <UserMinus className="h-6 w-6 text-destructive" />
                Remove Teacher
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRemoveTeacher} className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="removeEmail">Teacher Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="removeEmail"
                      type="email"
                      placeholder="teacher@charusat.edu.in"
                      value={removeEmail}
                      onChange={(e) => setRemoveEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" variant="destructive" disabled={isLoadingRemove}>
                  {isLoadingRemove ? "Removing..." : "Remove Teacher"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Toggle Teachers List Button */}
        <div className="mt-8 flex justify-end">
          <Button variant="outline" onClick={() => setShowTeachersList((v) => !v)}>
            {showTeachersList ? "Hide Teachers List" : "Show Teachers List"}
          </Button>
        </div>

        {/* Teachers List Table (conditionally rendered) */}
        {showTeachersList && (
          <div className="mt-6">
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl">All Teachers</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingTeachers ? (
                  <div>Loading teachers...</div>
                ) : teachersList.length === 0 ? (
                  <div>No teachers found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left">
                      <thead>
                        <tr>
                          <th className="px-2 py-1">ID</th>
                          <th className="px-2 py-1">Name</th>
                          <th className="px-2 py-1">Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teachersList.map((teacher) => (
                          <tr key={teacher.id} className="border-b">
                            <td className="px-2 py-1">{teacher.id}</td>
                            <td className="px-2 py-1">{teacher.Full_Name}</td>
                            <td className="px-2 py-1">{teacher.Email}</td>
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
