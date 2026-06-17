import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { UserPlus, Users, UserMinus, GraduationCap, Settings, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS } from "@/config/api";

export const AdminDashboard = () => {
  const [teacherCount, setTeacherCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [isLoadingCount, setIsLoadingCount] = useState(true);

  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchTeacherCount = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.GET_TEACHERS_COUNT);
      const data = await res.json();
      if (res.ok && data.success) {
        setTeacherCount(data.count);
      } else {
        console.error("Failed to fetch teacher count:", data.error);
      }
    } catch (err) {
      console.error("Error fetching teacher count:", err);
    } finally {
      setIsLoadingCount(false);
    }
  };

  const fetchStudentCount = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.GET_STUDENTS_COUNT);
      const data = await res.json();
      if (res.ok && data.success) {
        setStudentCount(data.total_count);
      } else {
        console.error("Failed to fetch student count:", data.error);
      }
    } catch (err) {
      console.error("Error fetching student count:", err);
    } finally {
      setIsLoadingCount(false);
    }
  };

  const handleLogout = () => {
    navigate("/login?role=admin");
  };

  useEffect(() => {
    // Initial fetch
    fetchTeacherCount();
    fetchStudentCount();

    // Poll every 10 seconds for live counts
    const intervalId = setInterval(() => {
      fetchTeacherCount();
      fetchStudentCount();
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  const handleNavigateToModule = (module: string) => {
    navigate(`/${module}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Header
        title="Admin Dashboard"
        userRole="admin"
        userName="Admin"
        onLogout={handleLogout}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
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

          <Card className="shadow-lg border-0 bg-gradient-to-br from-secondary to-orange-400 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Active Sessions</p>
                  <p className="text-3xl font-bold">12</p>
                </div>
                <UserPlus className="h-12 w-12 opacity-80" />
              </div>
            </CardContent>
          </Card>

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

          <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-600 to-indigo-500 text-white cursor-pointer" onClick={() => handleNavigateToModule('analytics')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Analytics</p>
                  <p className="text-3xl font-bold">Open</p>
                </div>
                <BarChart3 className="h-12 w-12 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Modules */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Teacher Management Module */}
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Teacher Management
              </CardTitle>
            </CardHeader>

            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Manage teacher accounts, add new teachers, and remove existing
                ones from the system
              </p>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p>✓ Add New Teachers</p>
                <p>✓ Remove Teachers</p>
                <p>✓ View Teacher Count</p>
              </div>

              <Button
                onClick={() => handleNavigateToModule("teacher-management")}
                variant="secondary"
                size="lg"
                className="w-full"
              >
                Manage Teachers
              </Button>
            </CardContent>
          </Card>

          {/* Student Management Module */}
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mb-4">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
                Student Management
              </CardTitle>
            </CardHeader>

            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Manage student records, add new students, and remove existing
                ones from the system
              </p>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p>✓ Add New Students</p>
                <p>✓ Remove Students</p>
                <p>✓ View Student Count</p>
              </div>

              <Button
                onClick={() => handleNavigateToModule("student-management")}
                variant="secondary"
                size="lg"
                className="w-full"
              >
                Manage Students
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
