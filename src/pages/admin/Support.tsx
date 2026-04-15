import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Search,
  Eye,
  Filter,
  X,
  Send,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

export default function Support() {
  const [activeTab, setActiveTab] = useState<"inquiries" | "issues">("inquiries");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isRespondOpen, setIsRespondOpen] = useState(false);
  const [response, setResponse] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tickets with user profiles
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
      
      if (!data) return [];

      // Get user profiles for each ticket
      const userIds = data.map(t => t.user_id).filter(Boolean);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone, email")
        .in("user_id", userIds);

      return data.map(ticket => ({
        ...ticket,
        profile: profiles?.find(p => p.user_id === ticket.user_id)
      }));
    },
  });

  const filteredTickets = tickets?.filter((ticket) => {
    const matchesSearch = ticket.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.venues?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || ticket.status === filterStatus;
    const cDate = ticket.created_at?.split("T")[0] || "";
    const matchesDate = (!filterDateFrom || cDate >= filterDateFrom) && (!filterDateTo || cDate <= filterDateTo);
    return matchesSearch && matchesStatus && matchesDate;
  });

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
      setIsRespondOpen(false);
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

  const openViewTicket = (ticket: any) => {
    setSelectedTicket(ticket);
    setIsViewOpen(true);
  };

  const openRespondTicket = (ticket: any) => {
    setSelectedTicket(ticket);
    setResponse(ticket.response || "");
    setIsRespondOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Bar - Tabs on right, search/filter on left */}
      <div className="flex items-center justify-between">
        {/* Left - Search and Filter */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`rounded-full p-2 shadow-sm transition-colors ${showFilters ? "bg-[#1a2942] text-white" : "bg-white"}`}
          >
            <Filter className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow-sm">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש חופשי"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-right w-32 p-0 h-6 text-sm"
            />
          </div>
        </div>

        {/* Right - Tabs */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab("issues")}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${
              activeTab === "issues"
                ? "bg-[#1a2942] text-white"
                : "bg-white text-foreground hover:bg-gray-100"
            }`}
          >
            תקלות
          </button>
          <button
            onClick={() => setActiveTab("inquiries")}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${
              activeTab === "inquiries"
                ? "bg-[#1a2942] text-white"
                : "bg-white text-foreground hover:bg-gray-100"
            }`}
          >
            פניות
          </button>
        </div>
      </div>

      {/* View Ticket Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden" hideCloseButton>
          <div className="bg-[#1a2942] text-white p-4 flex items-center justify-between">
            <button onClick={() => setIsViewOpen(false)} className="hover:opacity-80">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold">פרטי הפנייה</h2>
            <Eye className="w-5 h-5" />
          </div>
          {selectedTicket && (
            <div className="bg-white p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm mb-2 block text-center">שם הפונה</Label>
                  <p className="text-center font-bold">{selectedTicket.profile?.full_name || "לא ידוע"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm mb-2 block text-center">נושא</Label>
                  <p className="text-center font-bold">{selectedTicket.subject}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block text-center">תיאור הפנייה</Label>
                <div className="bg-[#f5f5f5] rounded-xl p-4 text-center">
                  {selectedTicket.description}
                </div>
              </div>
              {selectedTicket.response && (
                <div>
                  <Label className="text-muted-foreground text-sm mb-2 block text-center">תשובה</Label>
                  <div className="bg-[#dbeafe] rounded-xl p-4 text-center">
                    {selectedTicket.response}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Respond Dialog */}
      <Dialog open={isRespondOpen} onOpenChange={setIsRespondOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden" hideCloseButton>
          <div className="bg-[#1a2942] text-white p-4 flex items-center justify-between">
            <button onClick={() => setIsRespondOpen(false)} className="hover:opacity-80">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold">מענה לפנייה</h2>
            <Send className="w-5 h-5" />
          </div>
          {selectedTicket && (
            <div className="bg-white p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm mb-2 block text-center">שם הפונה</Label>
                  <p className="text-center font-bold">{selectedTicket.profile?.full_name || "לא ידוע"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm mb-2 block text-center">נושא</Label>
                  <p className="text-center font-bold">{selectedTicket.subject}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block text-center">תיאור הפנייה</Label>
                <div className="bg-[#f5f5f5] rounded-xl p-4 text-center">
                  {selectedTicket.description}
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block text-center">תשובה</Label>
                <Textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="הקלד תשובה..."
                  rows={4}
                  className="bg-[#f5f5f5] border-0 rounded-xl text-center"
                />
              </div>
              <Button 
                onClick={() => respondToTicket.mutate({ ticketId: selectedTicket.id, responseText: response })}
                disabled={!response.trim() || respondToTicket.isPending}
                className="w-full bg-[#1a2942] hover:bg-[#243a56] text-white rounded-full py-6 text-lg font-medium flex items-center justify-center gap-2"
              >
                <span>←</span>
                {respondToTicket.isPending ? "שולח..." : "שלח תשובה"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Inquiries Tab Content */}
      {activeTab === "inquiries" && (
        <>
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_1fr_1.5fr_2fr_auto] gap-4 px-6 py-3 text-sm font-medium text-muted-foreground text-center">
            <span>שם הפונה</span>
            <span>טלפון</span>
            <span>כתובת מייל</span>
            <span>מהות הפנייה</span>
            <span className="w-10"></span>
          </div>

          {/* Inquiry Rows */}
          <div className="space-y-3">
            {filteredTickets?.map((ticket) => (
              <div
                key={ticket.id}
                className="grid grid-cols-[1fr_1fr_1.5fr_2fr_auto] gap-4 items-center bg-white rounded-2xl px-6 py-5 shadow-sm"
              >
                <span className="text-center font-bold">
                  {ticket.profile?.full_name || "לא ידוע"}
                </span>
                <span className="text-center font-bold">
                  {ticket.profile?.phone || "—"}
                </span>
                <span className="text-center font-bold">
                  {ticket.profile?.email || "—"}
                </span>
                <span className="text-center text-muted-foreground truncate">
                  {ticket.subject}
                </span>
                <button
                  onClick={() => openViewTicket(ticket)}
                  className="w-10 h-10 rounded-full bg-[#1a2942] text-white flex items-center justify-center hover:bg-[#243a56] transition-colors"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>
            ))}

            {!filteredTickets?.length && (
              <div className="text-center py-12 text-muted-foreground bg-white rounded-2xl">
                לא נמצאו פניות
              </div>
            )}
          </div>
        </>
      )}

      {/* Issues Tab Content */}
      {activeTab === "issues" && (
        <>
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_1fr_1fr_1.5fr_auto_auto_auto] gap-4 px-6 py-3 text-sm font-medium text-muted-foreground text-center">
            <span>שם הלקוח</span>
            <span>שם האולם</span>
            <span>שם האולם</span>
            <span>מהות התקלה</span>
            <span className="w-20"></span>
            <span className="w-24"></span>
            <span className="w-10"></span>
          </div>

          {/* Issue Rows */}
          <div className="space-y-3">
            {filteredTickets?.map((ticket) => (
              <div
                key={ticket.id}
                className="grid grid-cols-[1fr_1fr_1fr_1.5fr_auto_auto_auto] gap-4 items-center bg-white rounded-2xl px-6 py-5 shadow-sm"
              >
                <span className="text-center font-bold">
                  {ticket.profile?.full_name || "לא ידוע"}
                </span>
                <span className="text-center font-bold">
                  {ticket.venues?.address || "—"}
                </span>
                <span className="text-center font-bold text-[#c9a54e]">
                  {ticket.venues?.name || "—"}
                </span>
                <span className="text-center text-muted-foreground truncate">
                  {ticket.subject}
                </span>
                <button
                  onClick={() => openRespondTicket(ticket)}
                  className="px-4 py-2 rounded-full bg-[#c9a54e] text-white font-medium hover:bg-[#b8943d] transition-colors"
                >
                  מענה
                </button>
                <button
                  onClick={() => closeTicket.mutate(ticket.id)}
                  className="px-4 py-2 rounded-full bg-[#1a2942] text-white font-medium hover:bg-[#243a56] transition-colors"
                >
                  סגירת הפנייה
                </button>
                <button
                  onClick={() => openViewTicket(ticket)}
                  className="w-10 h-10 rounded-full bg-[#1a2942] text-white flex items-center justify-center hover:bg-[#243a56] transition-colors"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>
            ))}

            {!filteredTickets?.length && (
              <div className="text-center py-12 text-muted-foreground bg-white rounded-2xl">
                לא נמצאו תקלות
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
