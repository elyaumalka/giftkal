import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, MessageSquare, AlertTriangle, Eye } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function VenueSupport() {
  const [activeTab, setActiveTab] = useState("inquiries");
  const [newSubject, setNewSubject] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tickets } = useQuery({
    queryKey: ["venue-tickets", activeTab],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user.id)
        .eq("ticket_type", activeTab === "inquiries" ? "inquiry" : "issue")
        .order("created_at", { ascending: false });

      return data || [];
    },
  });

  const createTicket = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: venue } = await supabase
        .from("venues")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      const { error } = await supabase.from("support_tickets").insert({
        user_id: user.id,
        venue_id: venue?.id,
        ticket_type: activeTab === "inquiries" ? "inquiry" : "issue",
        subject: newSubject,
        description: newDescription,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venue-tickets"] });
      setNewSubject("");
      setNewDescription("");
      toast({ title: "הפנייה נשלחה בהצלחה" });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <span className="badge-warning px-2 py-1 rounded text-xs">פתוח</span>;
      case "in_progress":
        return <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700 border border-blue-200">בטיפול</span>;
      case "closed":
        return <span className="badge-success px-2 py-1 rounded text-xs">סגור</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">פניות ותקלות</h1>
        <p className="text-muted-foreground mt-1">פתיחת פניות חדשות וצפייה בסטטוס</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="inquiries" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            פניות
          </TabsTrigger>
          <TabsTrigger value="issues" className="gap-2">
            <AlertTriangle className="w-4 h-4" />
            תקלות
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 space-y-6">
          {/* New ticket form */}
          <div className="bg-card rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-semibold">
              {activeTab === "inquiries" ? "פנייה חדשה" : "דיווח על תקלה"}
            </h3>
            <div>
              <Label>נושא</Label>
              <Input
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="נושא הפנייה..."
              />
            </div>
            <div>
              <Label>תיאור</Label>
              <Textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="פרט את הפנייה..."
                rows={4}
              />
            </div>
            <Button
              variant="gold"
              onClick={() => createTicket.mutate()}
              disabled={!newSubject.trim() || !newDescription.trim()}
            >
              <Plus className="w-4 h-4 ml-2" />
              שלח
            </Button>
          </div>

          {/* Tickets table */}
          <div className="bg-card rounded-xl shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>תאריך</TableHead>
                  <TableHead>נושא</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>צפייה</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets?.map((ticket: any) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      {new Date(ticket.created_at).toLocaleDateString("he-IL")}
                    </TableCell>
                    <TableCell className="font-medium">{ticket.subject}</TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell>
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
                              <Label className="text-muted-foreground">נושא</Label>
                              <p className="font-medium">{ticket.subject}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">תיאור</Label>
                              <p>{ticket.description}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">סטטוס</Label>
                              <p>{getStatusBadge(ticket.status)}</p>
                            </div>
                            {ticket.response && (
                              <div className="p-4 bg-muted rounded-lg">
                                <Label className="text-muted-foreground">תשובה</Label>
                                <p>{ticket.response}</p>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
                {!tickets?.length && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      אין פניות להצגה
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
