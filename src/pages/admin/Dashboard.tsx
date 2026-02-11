import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/button";
import { Eye, X, ChevronLeft } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

// Import stat icons (colored for dashboard)
import StatLeadsIcon from "@/assets/icons/stat-leads.svg";
import StatEventsIcon from "@/assets/icons/stat-events.svg";
import StatTransactionsIcon from "@/assets/icons/stat-transactions.svg";
import StatToolsIcon from "@/assets/icons/stat-tools.svg";

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [leads, venues, events, transactions, tasks] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("venues").select("id", { count: "exact", head: true }),
        supabase.from("events").select("id", { count: "exact", head: true }),
        supabase.from("transactions").select("id", { count: "exact", head: true }),
        supabase.from("tasks").select("id", { count: "exact", head: true }).eq("is_completed", false),
      ]);

      return {
        leads: leads.count || 0,
        venues: venues.count || 0,
        events: events.count || 0,
        transactions: transactions.count || 0,
        openTasks: tasks.count || 0,
      };
    },
  });

  // Fetch recent inquiries
  const { data: recentInquiries } = useQuery({
    queryKey: ["recent-inquiries-with-profiles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("support_tickets")
        .select("id, subject, description, user_id, status, created_at")
        .eq("ticket_type", "inquiry")
        .order("created_at", { ascending: false })
        .limit(3);
      
      if (!data) return [];
      
      const userIds = data.map(t => t.user_id).filter(Boolean);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone, email")
        .in("user_id", userIds);
      
      return data.map(ticket => ({
        ...ticket,
        profile: profiles?.find(p => p.user_id === ticket.user_id) || null
      }));
    },
  });

  // Fetch recent issues
  const { data: recentIssues } = useQuery({
    queryKey: ["recent-issues-with-profiles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("support_tickets")
        .select(`
          id, subject, description, user_id, venue_id, status, created_at,
          venues (name, address)
        `)
        .eq("ticket_type", "issue")
        .order("created_at", { ascending: false })
        .limit(3);
      
      if (!data) return [];
      
      const userIds = data.map(t => t.user_id).filter(Boolean);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone, email")
        .in("user_id", userIds);
      
      return data.map(ticket => ({
        ...ticket,
        profile: profiles?.find(p => p.user_id === ticket.user_id) || null
      }));
    },
  });

  // Fetch recent tasks
  const { data: recentTasks } = useQuery({
    queryKey: ["recent-tasks"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tasks")
        .select("id, description, due_date, user_id, is_completed")
        .eq("is_completed", false)
        .order("created_at", { ascending: false })
        .limit(3);
      
      if (!data) return [];
      
      const userIds = data.map(t => t.user_id).filter(Boolean);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);
      
      return data.map(task => ({
        ...task,
        profile: profiles?.find(p => p.user_id === task.user_id) || null
      }));
    },
  });

  const handleCompleteTask = async (taskId: string) => {
    await supabase.from("tasks").update({ is_completed: true }).eq("id", taskId);
    queryClient.invalidateQueries({ queryKey: ["recent-tasks"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
  };

  const handleCloseTicket = async (ticketId: string) => {
    await supabase.from("support_tickets").update({ status: "closed" }).eq("id", ticketId);
    queryClient.invalidateQueries({ queryKey: ["recent-inquiries-with-profiles"] });
    queryClient.invalidateQueries({ queryKey: ["recent-issues-with-profiles"] });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="לידים" value={stats?.leads || 0} icon={StatLeadsIcon} />
        <StatCard title="אולמות אירועים" value={stats?.venues || 0} icon={StatEventsIcon} />
        <StatCard title="בעלי אירועים" value={stats?.events || 0} icon={StatEventsIcon} />
        <StatCard title="עסקאות" value={stats?.transactions || 0} icon={StatTransactionsIcon} />
        <StatCard title="משימות פתוחות" value={stats?.openTasks || 0} icon={StatToolsIcon} />
      </div>

      {/* ===== פניות אחרונות ===== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/admin/support")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            לכל הפניות
          </button>
          <h2 className="text-xl font-bold text-secondary">פניות אחרונות</h2>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-[1fr_1fr_1.5fr_2fr_auto] gap-4 px-6 py-3 text-sm font-medium text-muted-foreground text-center">
          <span>שם הפונה</span>
          <span>טלפון</span>
          <span>כתובת מייל</span>
          <span>מהות הפנייה</span>
          <span className="w-10"></span>
        </div>

        {/* Rows */}
        <div className="space-y-3">
          {recentInquiries?.map((inquiry) => (
            <div
              key={inquiry.id}
              className="grid grid-cols-[1fr_1fr_1.5fr_2fr_auto] gap-4 items-center bg-white rounded-2xl px-6 py-5 shadow-sm"
            >
              <span className="text-center font-bold">{inquiry.profile?.full_name || "לא ידוע"}</span>
              <span className="text-center font-bold">{inquiry.profile?.phone || "—"}</span>
              <span className="text-center font-bold">{inquiry.profile?.email || "—"}</span>
              <span className="text-center text-muted-foreground truncate">{inquiry.subject}</span>
              <button
                onClick={() => setSelectedInquiry(inquiry)}
                className="w-10 h-10 rounded-full bg-[#1a2942] text-white flex items-center justify-center hover:bg-[#243a56] transition-colors"
              >
                <Eye className="w-5 h-5" />
              </button>
            </div>
          ))}

          {!recentInquiries?.length && (
            <div className="text-center py-12 text-muted-foreground bg-white rounded-2xl">
              אין פניות להצגה
            </div>
          )}
        </div>
      </div>

      {/* Inquiry View Dialog */}
      <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden" hideCloseButton>
          <div className="bg-[#1a2942] text-white p-4 flex items-center justify-between">
            <button onClick={() => setSelectedInquiry(null)} className="hover:opacity-80">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold">פרטי הפנייה</h2>
            <Eye className="w-5 h-5" />
          </div>
          {selectedInquiry && (
            <div className="bg-white p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm mb-2 block text-center">שם הפונה</Label>
                  <p className="text-center font-bold">{selectedInquiry.profile?.full_name || "לא ידוע"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm mb-2 block text-center">נושא</Label>
                  <p className="text-center font-bold">{selectedInquiry.subject}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block text-center">תיאור הפנייה</Label>
                <div className="bg-[#f5f5f5] rounded-xl p-4 text-center">
                  {selectedInquiry.description}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== תקלות אחרונות ===== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/admin/support?tab=issues")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            לכל התקלות
          </button>
          <h2 className="text-xl font-bold text-secondary">תקלות אחרונות</h2>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-[1fr_1fr_1fr_1.5fr_auto_auto_auto] gap-4 px-6 py-3 text-sm font-medium text-muted-foreground text-center">
          <span>שם הלקוח</span>
          <span>כתובת</span>
          <span>שם האולם</span>
          <span>מהות התקלה</span>
          <span className="w-20"></span>
          <span className="w-24"></span>
          <span className="w-10"></span>
        </div>

        {/* Rows */}
        <div className="space-y-3">
          {recentIssues?.map((issue) => (
            <div
              key={issue.id}
              className="grid grid-cols-[1fr_1fr_1fr_1.5fr_auto_auto_auto] gap-4 items-center bg-white rounded-2xl px-6 py-5 shadow-sm"
            >
              <span className="text-center font-bold">{issue.profile?.full_name || "לא ידוע"}</span>
              <span className="text-center font-bold">{issue.venues?.address || "—"}</span>
              <span className="text-center font-bold text-[#c9a54e]">{issue.venues?.name || "—"}</span>
              <span className="text-center text-muted-foreground truncate">{issue.subject}</span>
              <button className="px-4 py-2 rounded-full bg-[#c9a54e] text-white font-medium hover:bg-[#b8943d] transition-colors">
                מענה
              </button>
              <button
                onClick={() => handleCloseTicket(issue.id)}
                className="px-4 py-2 rounded-full bg-[#1a2942] text-white font-medium hover:bg-[#243a56] transition-colors"
              >
                סגירת הפנייה
              </button>
              <button
                onClick={() => setSelectedIssue(issue)}
                className="w-10 h-10 rounded-full bg-[#1a2942] text-white flex items-center justify-center hover:bg-[#243a56] transition-colors"
              >
                <Eye className="w-5 h-5" />
              </button>
            </div>
          ))}

          {!recentIssues?.length && (
            <div className="text-center py-12 text-muted-foreground bg-white rounded-2xl">
              אין תקלות להצגה
            </div>
          )}
        </div>
      </div>

      {/* Issue View Dialog */}
      <Dialog open={!!selectedIssue} onOpenChange={() => setSelectedIssue(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden" hideCloseButton>
          <div className="bg-[#1a2942] text-white p-4 flex items-center justify-between">
            <button onClick={() => setSelectedIssue(null)} className="hover:opacity-80">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold">פרטי התקלה</h2>
            <Eye className="w-5 h-5" />
          </div>
          {selectedIssue && (
            <div className="bg-white p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm mb-2 block text-center">שם הפונה</Label>
                  <p className="text-center font-bold">{selectedIssue.profile?.full_name || "לא ידוע"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm mb-2 block text-center">אולם</Label>
                  <p className="text-center font-bold text-[#c9a54e]">{selectedIssue.venues?.name || "—"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm mb-2 block text-center">כתובת</Label>
                  <p className="text-center font-bold">{selectedIssue.venues?.address || "—"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm mb-2 block text-center">נושא התקלה</Label>
                  <p className="text-center font-bold">{selectedIssue.subject}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block text-center">תיאור</Label>
                <div className="bg-[#f5f5f5] rounded-xl p-4 text-center">
                  {selectedIssue.description}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== משימות לביצוע ===== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/admin/leads")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            לכל המשימות
          </button>
          <h2 className="text-xl font-bold text-secondary">משימות לביצוע</h2>
        </div>

        <div className="space-y-3">
          {recentTasks?.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between bg-white rounded-2xl px-6 py-5 shadow-sm"
            >
              <div className="flex items-center gap-6 flex-1">
                <span className="text-muted-foreground flex-1">{task.description}</span>
                <span className="font-bold text-secondary min-w-[100px] text-center">
                  {task.profile?.full_name || "לא משויך"}
                </span>
                <span className="text-muted-foreground min-w-[100px] text-center">
                  {task.due_date ? new Date(task.due_date).toLocaleDateString("he-IL") : "-"}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleCompleteTask(task.id)}
                  className="px-4 py-2 rounded-full bg-[#c9a54e] text-white font-medium hover:bg-[#b8943d] transition-colors"
                >
                  סימון כבוצע
                </button>
              </div>
            </div>
          ))}

          {!recentTasks?.length && (
            <div className="text-center py-12 text-muted-foreground bg-white rounded-2xl">
              אין משימות להצגה
            </div>
          )}
        </div>
      </div>
    </div>
  );
}