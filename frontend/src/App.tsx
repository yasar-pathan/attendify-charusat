import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { Login } from "./pages/Login";
import { ForgotPassword } from "./pages/ForgotPassword";
import { AdminDashboard } from "./pages/AdminDashboard";
import { TeacherDashboard } from "./pages/TeacherDashboard";
import { TeacherManagement } from "./pages/TeacherManagement";
import { StudentManagement } from "./pages/StudentManagement";
import { TakeAttendance } from "./pages/TakeAttendance";
import { QRCodePage } from "./pages/QRCodePage";
import { GetAttendance } from "./pages/GetAttendance";
import { StudentAuth } from "./pages/StudentAuth";
import { StudentAttendance } from "./pages/StudentAttendance";
import { AttendanceSuccess } from "./pages/AttendanceSuccess";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/teacher-management" element={<TeacherManagement />} />
          <Route path="/student-management" element={<StudentManagement />} />
          <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
          <Route path="/take-attendance" element={<TakeAttendance />} />
          <Route path="/qr-code" element={<QRCodePage />} />
          <Route path="/get-attendance" element={<GetAttendance />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="/student-auth/:sessionId" element={<StudentAuth />} />
          <Route path="/student-attendance/:sessionId" element={<StudentAttendance />} />

          <Route path="/attendance-success" element={<AttendanceSuccess />} />
          <Route path="/attendance-success/:sessionId" element={<AttendanceSuccess />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
