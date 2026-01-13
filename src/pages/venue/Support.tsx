import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, MessageSquare, AlertTriangle, Eye, X, ArrowLeft } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function VenueSupport() {
  const [activeTab, setActiveTab] = useState<"inquiries" | "issues">("inquiries");
  const [newSubject, setNewSubject] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [showNewTicketDialog, setShowNewTicketDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
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
      setShowNewTicketDialog(false);
      toast({ title: "הפנייה נשלחה בהצלחה" });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <span className="px-3 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700 border border-yellow-200">פתוח</span>;
      case "in_progress":
        return <span className="px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-700 border border-blue-200">בטיפול</span>;
      case "closed":
        return <span className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-700 border border-green-200">סגור</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#051839]">פניות ותקלות</h1>
          <p className="text-gray-500 mt-1">פתיחת פניות חדשות וצפייה בסטטוס</p>
        </div>
        <button 
          onClick={() => setShowNewTicketDialog(true)}
          className="w-10 h-10 rounded-full bg-[#051839] flex items-center justify-center text-white hover:bg-[#051839]/80 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("inquiries")}
          className={`px-6 py-2 rounded-full font-medium transition-colors flex items-center gap-2 ${
            activeTab === "inquiries"
              ? "bg-[#051839] text-white"
              : "bg-white text-[#051839] hover:bg-gray-100"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          פניות
        </button>
        <button
          onClick={() => setActiveTab("issues")}
          className={`px-6 py-2 rounded-full font-medium transition-colors flex items-center gap-2 ${
            activeTab === "issues"
              ? "bg-[#051839] text-white"
              : "bg-white text-[#051839] hover:bg-gray-100"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          תקלות
        </button>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4">
          {/* Table Header */}
          <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-500 mb-4 px-4">
            <span>תאריך</span>
            <span>נושא</span>
            <span>סטטוס</span>
            <span>צפייה</span>
          </div>
          
          {/* Table Rows */}
          <div className="space-y-2">
            {tickets?.map((ticket: any) => (
              <div 
                key={ticket.id} 
                className="grid grid-cols-4 gap-4 items-center bg-gray-50 rounded-xl p-4 text-sm"
              >
                <span className="text-[#051839]">
                  {new Date(ticket.created_at).toLocaleDateString("he-IL")}
                </span>
                <span className="font-medium text-[#051839]">{ticket.subject}</span>
                <span>{getStatusBadge(ticket.status)}</span>
                <span>
                  <button 
                    onClick={() => setSelectedTicket(ticket)}
                    className="w-8 h-8 rounded-full bg-[#051839] flex items-center justify-center text-white hover:bg-[#051839]/80 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </span>
              </div>
            ))}
            
            {!tickets?.length && (
              <div className="text-center py-8 text-gray-500">
                אין פניות להצגה
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Ticket Dialog */}
      <Dialog open={showNewTicketDialog} onOpenChange={setShowNewTicketDialog}>
        <DialogContent className="p-0 overflow-hidden rounded-2xl border-0 max-w-md">
          <DialogHeader className="bg-[#051839] text-white p-4 flex flex-row items-center justify-between">
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <Plus className="w-5 h-5" />
              {activeTab === "inquiries" ? "פנייה חדשה" : "דיווח על תקלה"}
            </DialogTitle>
            <button 
              onClick={() => setShowNewTicketDialog(false)}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </DialogHeader>
          
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-[#051839] font-medium">נושא</Label>
              <Input
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="נושא הפנייה..."
                className="rounded-xl border-gray-200 text-center"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#051839] font-medium">תיאור</Label>
              <Textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="פרט את הפנייה..."
                rows={4}
                className="rounded-xl border-gray-200"
              />
            </div>
            <button
              onClick={() => createTicket.mutate()}
              disabled={!newSubject.trim() || !newDescription.trim()}
              className="w-full bg-[#051839] hover:bg-[#051839]/90 text-white rounded-xl py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span>שלח</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Ticket Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="p-0 overflow-hidden rounded-2xl border-0 max-w-md">
          <DialogHeader className="bg-[#051839] text-white p-4 flex flex-row items-center justify-between">
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <Eye className="w-5 h-5" />
              פרטי הפנייה
            </DialogTitle>
            <button 
              onClick={() => setSelectedTicket(null)}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="p-6 space-y-4">
              <div>
                <Label className="text-gray-500 text-sm">נושא</Label>
                <p className="font-medium text-[#051839]">{selectedTicket.subject}</p>
              </div>
              <div>
                <Label className="text-gray-500 text-sm">תיאור</Label>
                <p className="text-[#051839]">{selectedTicket.description}</p>
              </div>
              <div>
                <Label className="text-gray-500 text-sm">סטטוס</Label>
                <div className="mt-1">{getStatusBadge(selectedTicket.status)}</div>
              </div>
              {selectedTicket.response && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <Label className="text-gray-500 text-sm">תשובה</Label>
                  <p className="text-[#051839]">{selectedTicket.response}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
