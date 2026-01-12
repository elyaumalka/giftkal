import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Search,
  Eye,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Send,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function Support() {
  const [activeTab, setActiveTab] = useState("issues");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [response, setResponse] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tickets
  const { data: tickets } = useQuery({
    queryKey: ["support-tickets", activeTab],
    queryFn: async () => {
      const { data } = await supabase
        .from("support_tickets")
        .select(`
          *,
          venues (name, address)
        `)
        .eq("ticket_type", activeTab === "issues" ? "issue" : "inquiry")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const filteredTickets = tickets?.filter((ticket) =>
    ticket.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const respondToTicket = useMutation({
    mutationFn: async ({ ticketId, responseText }: { ticketId: string; responseText: string }) => {
      const { error } = await supabase
        .from("support_tickets")
        .update({ response: responseText, status: "in_progress" })
        .eq("id", ticketId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      setResponse("");
      toast({ title: "התשובה נשלחה בהצלחה" });
    },
  });

  const closeTicket = useMutation({
    mutationFn: async (ticketId: string) => {
      const { error } = await supabase
        .from("support_tickets")
        .update({ status: "closed" })
        .eq("id", ticketId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      toast({ title: "הפנייה נסגרה" });
    },
  });

  const deleteTicket = useMutation({
    mutationFn: async (ticketId: string) => {
      const { error } = await supabase
        .from("support_tickets")
        .delete()
        .eq("id", ticketId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      toast({ title: "הפנייה נמחקה" });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <span className="badge-warning px-2 py-1 rounded text-xs">פתוח</span>;
      case "in_progress":
        return <span className="badge-success px-2 py-1 rounded text-xs bg-blue-100 text-blue-700 border border-blue-200">בטיפול</span>;
      case "closed":
        return <span className="badge-success px-2 py-1 rounded text-xs">סגור</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">פניות ותקלות</h1>
          <p className="text-muted-foreground mt-1">ניהול פניות ותקלות לקוחות</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש פנייה..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="issues" className="gap-2">
            <AlertTriangle className="w-4 h-4" />
            תקלות
          </TabsTrigger>
          <TabsTrigger value="inquiries" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            פניות
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="bg-card rounded-xl shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>שם הלקוח</TableHead>
                  {activeTab === "issues" && <TableHead>שם האולם</TableHead>}
                  {activeTab === "issues" && <TableHead>כתובת</TableHead>}
                  {activeTab === "inquiries" && <TableHead>טלפון</TableHead>}
                  {activeTab === "inquiries" && <TableHead>מייל</TableHead>}
                  <TableHead>מהות הפנייה</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets?.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">
                      {ticket.profiles?.full_name || "—"}
                    </TableCell>
                    {activeTab === "issues" && (
                      <>
                        <TableCell>{ticket.venues?.name || "—"}</TableCell>
                        <TableCell>{ticket.venues?.address || "—"}</TableCell>
                      </>
                    )}
                    {activeTab === "inquiries" && (
                      <>
                        <TableCell>{ticket.profiles?.phone || "—"}</TableCell>
                        <TableCell>{ticket.profiles?.email || "—"}</TableCell>
                      </>
                    )}
                    <TableCell className="max-w-xs truncate">{ticket.subject}</TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedTicket(ticket)}
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>מענה לפנייה</DialogTitle>
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
                              {ticket.response && (
                                <div className="p-4 bg-muted rounded-lg">
                                  <Label className="text-muted-foreground">תשובה קודמת</Label>
                                  <p>{ticket.response}</p>
                                </div>
                              )}
                              <div>
                                <Label>תשובה</Label>
                                <Textarea
                                  value={response}
                                  onChange={(e) => setResponse(e.target.value)}
                                  placeholder="הקלד תשובה..."
                                  rows={4}
                                />
                              </div>
                              <Button
                                onClick={() => respondToTicket.mutate({ ticketId: ticket.id, responseText: response })}
                                disabled={!response.trim()}
                              >
                                <Send className="w-4 h-4 ml-2" />
                                שלח תשובה
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => closeTicket.mutate(ticket.id)}
                        >
                          <CheckCircle className="w-4 h-4 text-success" />
                        </Button>
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
                        {activeTab === "inquiries" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteTicket.mutate(ticket.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!filteredTickets?.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      לא נמצאו פניות
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
