import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS } from "@/config/api";

type Dept = "IT" | "CSE" | "CE";

type DeptSummary = { dept: Dept; count: number };

type AttendanceSummaryResponse = {
  success: boolean;
  department: Dept;
  summary: {
    total_students: number;
    unique_students: number;
    total_subjects: number;
  };
  department_summary: DeptSummary[];
  total_records: number;
};

export const AnalyticsDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [filters, setFilters] = useState({
    dept: "IT" as Dept,
    date: new Date().toISOString().split("T")[0],
    division: "",
    timeSlot: "",
    sem: "",
    subject: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<AttendanceSummaryResponse | null>(null);

  const handleBack = () => navigate("/teacher-dashboard");

  const fetchSummary = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        dept: filters.dept,
        date: filters.date,
      });
      if (filters.division) params.set("division", filters.division);
      if (filters.timeSlot) params.set("timeSlot", filters.timeSlot);
      if (filters.sem) params.set("sem", filters.sem);
      if (filters.subject) params.set("subject", filters.subject);

      const res = await fetch(`${API_ENDPOINTS.VIEW_CLASS_ATTENDANCE}?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setSummary(data);
      } else {
        throw new Error(data?.error || "Failed to load analytics");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deptBreakdown = useMemo(() => {
    if (!summary) return [] as DeptSummary[];
    // Ensure numbers
    return (summary.department_summary || []).map((d: any) => ({ dept: d.dept, count: Number(d.count) }));
  }, [summary]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Header title="Analytics Dashboard" userRole="teacher" userName="Faculty" onLogout={handleBack} />

      <div className="container mx-auto px-4 py-8">
        <Button onClick={handleBack} variant="outline" className="mb-6">
          Back
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <Label>Department</Label>
            <Select value={filters.dept} onValueChange={(v) => setFilters((f) => ({ ...f, dept: v as Dept }))}>
              <SelectTrigger>
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IT">IT</SelectItem>
                <SelectItem value="CSE">CSE</SelectItem>
                <SelectItem value="CE">CE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Date</Label>
            <Input type="date" value={filters.date} onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <Label>Semester</Label>
            <Input placeholder="e.g. 5" value={filters.sem} onChange={(e) => setFilters((f) => ({ ...f, sem: e.target.value }))} />
          </div>
          <div className="flex items-end">
            <Button onClick={fetchSummary} disabled={isLoading} className="w-full">{isLoading ? "Loading..." : "Refresh"}</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="shadow-lg border-0 bg-gradient-to-br from-primary to-primary-glow text-white">
            <CardHeader>
              <CardTitle>Total Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{summary?.summary?.total_students ?? 0}</div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-0 bg-gradient-to-br from-emerald-500 to-green-600 text-white">
            <CardHeader>
              <CardTitle>Unique Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{summary?.summary?.unique_students ?? 0}</div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-0 bg-gradient-to-br from-orange-500 to-amber-600 text-white">
            <CardHeader>
              <CardTitle>Subjects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{summary?.summary?.total_subjects ?? 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Simple bar chart using divs to avoid adding new deps */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Department-wise Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            {deptBreakdown.length === 0 ? (
              <div className="text-sm text-muted-foreground">No data available for selected filters.</div>
            ) : (
              <div className="space-y-3">
                {deptBreakdown.map((d) => {
                  const max = Math.max(...deptBreakdown.map((x) => x.count));
                  const widthPct = max > 0 ? Math.round((d.count / max) * 100) : 0;
                  return (
                    <div key={d.dept} className="w-full">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{d.dept}</span>
                        <span>{d.count}</span>
                      </div>
                      <div className="w-full h-3 bg-muted rounded">
                        <div className="h-3 bg-primary rounded" style={{ width: `${widthPct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;


