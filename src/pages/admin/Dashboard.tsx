import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentList } from "@/components/dashboard/RecentList";
import { Button } from "@/components/ui/button";
import { Eye, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

// Import icons
import LeadsIcon from "@/assets/icons/Leads.svg";
import EventOwnersIcon from "@/assets/icons/EventOwners.svg";
import CustomersIcon from "@/assets/icons/Customers.svg";
import TransactionsIcon from "@/assets/icons/Transactions.svg";
import ToolsIcon from "@/assets/icons/Tools.svg";

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

  // Fetch recent inquiries
  const { data: recentInquiries } = useQuery({
    queryKey: ["recent-inquiries"],
    queryFn: async () => {
      const { data } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("ticket_type", "inquiry")
        .order("created_at", { ascending: false })
        .limit(3);
      return data || [];
    },
  });

  // Fetch recent issues with venue data
  const { data: recentIssues } = useQuery({
    queryKey: ["recent-issues"],
    queryFn: async () => {
      const { data } = await supabase
        .from("support_tickets")
        .select(`
          *,
          venues (name, address)
        `)
        .eq("ticket_type", "issue")
        .order("created_at", { ascending: false })
        .limit(3);
      return data || [];
    },
  });

  // Fetch recent tasks
  const { data: recentTasks } = useQuery({
    queryKey: ["recent-tasks"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("is_completed", false)
        .order("created_at", { ascending: false })
        .limit(3);
      return data || [];
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
    queryClient.invalidateQueries({ queryKey: ["recent-inquiries"] });
    queryClient.invalidateQueries({ queryKey: ["recent-issues"] });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="לידים"
          value={stats?.leads || 0}
          icon={LeadsIcon}
        />
        <StatCard
          title="אולמות אירועים"
          value={stats?.venues || 0}
          icon={EventOwnersIcon}
        />
        <StatCard
          title="בעלי אירועים"
          value={stats?.events || 0}
          icon={EventOwnersIcon}
        />
        <StatCard
          title="עסקאות"
          value={stats?.transactions || 0}
          icon={TransactionsIcon}
        />
        <StatCard
          title="משימות פתוחות"
          value={stats?.openTasks || 0}
          icon={ToolsIcon}
        />
      </div>

      {/* Recent Inquiries */}
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
              <div className="flex items-center gap-8 flex-1">
                <span className="font-medium text-secondary min-w-[120px]">
                  {inquiry.subject}
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
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>פרטי הפנייה</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">נושא</p>
                      <p className="font-medium">{inquiry.subject}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">תיאור</p>
                      <p>{inquiry.description}</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ))}
        </div>
      </RecentList>

      {/* Recent Issues */}
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
                  {issue.subject}
                </span>
                <span className="text-muted-foreground min-w-[150px]">
                  {issue.venues?.address || "-"}
                </span>
                <span className="text-secondary font-medium min-w-[120px]">
                  {issue.venues?.name || "-"}
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
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>פרטי התקלה</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">אולם</p>
                        <p className="font-medium">{issue.venues?.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">כתובת</p>
                        <p>{issue.venues?.address}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">תיאור</p>
                        <p>{issue.description}</p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}
        </div>
      </RecentList>

      {/* Tasks */}
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
