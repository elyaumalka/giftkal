import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentList } from "@/components/dashboard/RecentList";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

// Import stat icons (colored for dashboard)
import StatLeadsIcon from "@/assets/icons/stat-leads.svg";
import StatEventsIcon from "@/assets/icons/stat-events.svg";
import StatCustomersIcon from "@/assets/icons/stat-customers.svg";
import StatTransactionsIcon from "@/assets/icons/stat-transactions.svg";
import StatToolsIcon from "@/assets/icons/stat-tools.svg";

export default function AdminDashboard() {
  const queryClient = useQueryClient();

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

  // Fetch recent inquiries with profile data via raw query
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
      
      // Get profile data for each ticket
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

  // Fetch recent issues with venue and profile data
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
      
      // Get profile data for each ticket
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
      
      // Get profile data for assigned users
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

  const handleDeleteTask = async (taskId: string) => {
    await supabase.from("tasks").delete().eq("id", taskId);
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
        <StatCard
          title="לידים"
          value={stats?.leads || 0}
          icon={StatLeadsIcon}
        />
        <StatCard
          title="אולמות אירועים"
          value={stats?.venues || 0}
          icon={StatEventsIcon}
        />
        <StatCard
          title="בעלי אירועים"
          value={stats?.events || 0}
          icon={StatEventsIcon}
        />
        <StatCard
          title="עסקאות"
          value={stats?.transactions || 0}
          icon={StatTransactionsIcon}
        />
        <StatCard
          title="משימות פתוחות"
          value={stats?.openTasks || 0}
          icon={StatToolsIcon}
        />
      </div>

      {/* Recent Inquiries - פניות אחרונות */}
      <RecentList
        title="פניות אחרונות"
        viewAllPath="/admin/support"
        viewAllText="לכל הפניות"
        isEmpty={!recentInquiries?.length}
      >
        <div className="space-y-2">
          {recentInquiries?.map((inquiry) => (
            <div
              key={inquiry.id}
              className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-6 flex-1">
                <span className="font-medium text-secondary min-w-[100px]">
                  {inquiry.profile?.full_name || "לא ידוע"}
                </span>
                <span className="text-muted-foreground min-w-[100px]">
                  {inquiry.profile?.phone || "-"}
                </span>
                <span className="text-muted-foreground min-w-[160px]">
                  {inquiry.profile?.email || "-"}
                </span>
                <span className="text-muted-foreground flex-1 truncate">
                  {inquiry.description}
                </span>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <Eye className="w-5 h-5 text-muted-foreground" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>פרטי הפנייה</DialogTitle>
                  </DialogHeader>
                  <div className="p-6 space-y-4" dir="rtl">
                    <div className="flex justify-between items-start">
                      <p className="text-sm text-muted-foreground">שם</p>
                      <p className="font-bold text-secondary">{inquiry.profile?.full_name || "לא ידוע"}</p>
                    </div>
                    <div className="flex justify-between items-start">
                      <p className="text-sm text-muted-foreground">טלפון</p>
                      <p className="font-medium">{inquiry.profile?.phone || "-"}</p>
                    </div>
                    <div className="flex justify-between items-start">
                      <p className="text-sm text-muted-foreground">אימייל</p>
                      <p className="font-medium">{inquiry.profile?.email || "-"}</p>
                    </div>
                    <div className="flex justify-between items-start">
                      <p className="text-sm text-muted-foreground">נושא</p>
                      <p className="font-bold text-secondary">{inquiry.subject}</p>
                    </div>
                    <div className="flex justify-between items-start">
                      <p className="text-sm text-muted-foreground">תיאור</p>
                      <p className="font-medium max-w-[70%] text-left">{inquiry.description}</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ))}
        </div>
      </RecentList>

      {/* Recent Issues - תקלות אחרונות */}
      <RecentList
        title="תקלות אחרונות"
        viewAllPath="/admin/support?tab=issues"
        viewAllText="לכל התקלות"
        isEmpty={!recentIssues?.length}
      >
        <div className="space-y-2">
          {recentIssues?.map((issue) => (
            <div
              key={issue.id}
              className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-6 flex-1">
                <span className="font-medium text-secondary min-w-[100px]">
                  {issue.profile?.full_name || "לא ידוע"}
                </span>
                <span className="text-muted-foreground min-w-[150px]">
                  {issue.venues?.address || "-"}
                </span>
                <span className="text-secondary font-medium min-w-[120px]">
                  {issue.venues?.name || "-"}
                </span>
                <span className="text-muted-foreground flex-1">
                  {issue.subject}
                </span>
                <Badge variant={issue.status === "open" ? "destructive" : "secondary"} className="min-w-[60px] justify-center">
                  {issue.status === "open" ? "פתוח" : "סגור"}
                </Badge>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-muted-foreground"
                >
                  מענה
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-muted-foreground"
                  onClick={() => handleCloseTicket(issue.id)}
                >
                  סגירת הפנייה
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Eye className="w-5 h-5 text-muted-foreground" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>פרטי התקלה</DialogTitle>
                    </DialogHeader>
                    <div className="p-6 space-y-4" dir="rtl">
                      <div className="flex justify-between items-start">
                        <p className="text-sm text-muted-foreground">שם הפונה</p>
                        <p className="font-bold text-secondary">{issue.profile?.full_name || "לא ידוע"}</p>
                      </div>
                      <div className="flex justify-between items-start">
                        <p className="text-sm text-muted-foreground">אולם</p>
                        <p className="font-bold text-secondary">{issue.venues?.name}</p>
                      </div>
                      <div className="flex justify-between items-start">
                        <p className="text-sm text-muted-foreground">כתובת</p>
                        <p className="font-medium">{issue.venues?.address}</p>
                      </div>
                      <div className="flex justify-between items-start">
                        <p className="text-sm text-muted-foreground">נושא התקלה</p>
                        <p className="font-bold text-secondary">{issue.subject}</p>
                      </div>
                      <div className="flex justify-between items-start">
                        <p className="text-sm text-muted-foreground">תיאור</p>
                        <p className="font-medium max-w-[70%] text-left">{issue.description}</p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}
        </div>
      </RecentList>

      {/* Tasks - משימות לביצוע */}
      <RecentList
        title="משימות לביצוע"
        viewAllPath="/admin/leads"
        viewAllText="לכל המשימות"
        isEmpty={!recentTasks?.length}
      >
        <div className="space-y-2">
          {recentTasks?.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-6 flex-1">
                <span className="text-muted-foreground flex-1">
                  {task.description}
                </span>
                <span className="font-medium text-secondary min-w-[100px]">
                  {task.profile?.full_name || "לא משויך"}
                </span>
                <span className="text-muted-foreground min-w-[100px]">
                  {task.due_date ? new Date(task.due_date).toLocaleDateString("he-IL") : "-"}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-sidebar-accent border-sidebar-accent hover:bg-sidebar-accent hover:text-white"
                  onClick={() => handleCompleteTask(task.id)}
                >
                  סימון כבוצע
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDeleteTask(task.id)}
                >
                  מחיקה
                </Button>
              </div>
            </div>
          ))}
        </div>
      </RecentList>
    </div>
  );
}
