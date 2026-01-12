import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentList } from "@/components/dashboard/RecentList";
import { Button } from "@/components/ui/button";
import {
  UserPlus,
  Building2,
  Users,
  CreditCard,
  ClipboardList,
  Eye,
  CheckCircle,
  XCircle,
  MessageSquare,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AdminDashboard() {
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

  // Fetch recent issues
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
        .select(`
          *,
          leads (full_name)
        `)
        .eq("is_completed", false)
        .order("created_at", { ascending: false })
        .limit(3);
      return data || [];
    },
  });

  const handleCompleteTask = async (taskId: string) => {
    await supabase.from("tasks").update({ is_completed: true }).eq("id", taskId);
  };

  const handleDeleteTask = async (taskId: string) => {
    await supabase.from("tasks").delete().eq("id", taskId);
  };

  const handleCloseTicket = async (ticketId: string) => {
    await supabase.from("support_tickets").update({ status: "closed" }).eq("id", ticketId);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">דשבורד</h1>
        <p className="text-muted-foreground mt-1">סקירה כללית של המערכת</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="סך לידים"
          value={stats?.leads || 0}
          icon={UserPlus}
          variant="gold"
        />
        <StatCard
          title="אולמות במערכת"
          value={stats?.venues || 0}
          icon={Building2}
        />
        <StatCard
          title="בעלי אירועים"
          value={stats?.events || 0}
          icon={Users}
        />
        <StatCard
          title="עסקאות במערכת"
          value={stats?.transactions || 0}
          icon={CreditCard}
          variant="success"
        />
        <StatCard
          title="משימות פתוחות"
          value={stats?.openTasks || 0}
          icon={ClipboardList}
          variant="warning"
        />
      </div>

      {/* Recent Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Inquiries */}
        <RecentList
          title="פניות אחרונות"
          viewAllPath="/admin/support"
          isEmpty={!recentInquiries?.length}
        >
          <div className="space-y-3">
            {recentInquiries?.map((inquiry) => (
              <div
                key={inquiry.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{inquiry.subject}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {inquiry.description}
                  </p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Eye className="w-4 h-4" />
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
                      <div>
                        <p className="text-sm text-muted-foreground">סטטוס</p>
                        <p className={inquiry.status === "open" ? "text-warning" : "text-success"}>
                          {inquiry.status === "open" ? "פתוח" : inquiry.status === "closed" ? "סגור" : "בטיפול"}
                        </p>
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
          isEmpty={!recentIssues?.length}
        >
          <div className="space-y-3">
            {recentIssues?.map((issue) => (
              <div
                key={issue.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{issue.subject}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {issue.venues?.name} - {issue.venues?.address}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="text-success" onClick={() => handleCloseTicket(issue.id)}>
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>פרטי התקלה</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground">נושא</p>
                          <p className="font-medium">{issue.subject}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">אולם</p>
                          <p>{issue.venues?.name}</p>
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

        {/* Recent Tasks */}
        <RecentList
          title="משימות לביצוע"
          viewAllPath="/admin/leads"
          isEmpty={!recentTasks?.length}
        >
          <div className="space-y-3">
            {recentTasks?.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{task.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {task.leads?.full_name || "ללא ליד מקושר"}
                    {task.due_date && ` • ${new Date(task.due_date).toLocaleDateString("he-IL")}`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-success"
                    onClick={() => handleCompleteTask(task.id)}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </RecentList>
      </div>
    </div>
  );
}
