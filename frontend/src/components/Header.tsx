import { Button } from "@/components/ui/button";
import { GraduationCap, LogOut } from "lucide-react";

interface HeaderProps {
  title: string;
  userRole?: "admin" | "teacher";
  userName?: string;
  onLogout?: () => void;
}

export const Header = ({ title, userRole, userName, onLogout }: HeaderProps) => {
  return (
    <header className="bg-gradient-to-r from-primary to-primary-glow text-white shadow-lg relative">
      <div className="container mx-auto px-4 py-4">
        {/* Top row with logo and user info */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">CHARUSAT</h1>
              <p className="text-sm opacity-90">Attendance System</p>
            </div>
          </div>
          
          {userName && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs opacity-75 capitalize">{userRole}</p>
              </div>
              {onLogout && (
                <Button
                  onClick={onLogout}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              )}
            </div>
          )}
        </div>
        
        {/* Centered title row */}
        <div className="text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent drop-shadow-sm">
            {title}
          </h2>
          <div className="w-24 h-1 bg-white/30 rounded-full mx-auto mt-2"></div>
        </div>
      </div>
    </header>
  );
};