import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Eye, X, ArrowLeft, Filter } from "lucide-react";
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

  const { data: venue } = useQuery({
    queryKey: ["venue-info"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("venues")
        .select("id, name")
        .eq("owner_id", user.id)
        .maybeSingle();

      return data;
    },
  });

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

  const getStatusText = (status: string, hasResponse: boolean) => {
    if (status === "closed") return "סגור";
    if (hasResponse) return "התקבלה תשובה";
    switch (status) {
      case "open":
        return "פתוח";
      case "in_progress":
        return "בטיפול";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Row - Tabs and Actions */}
      <div className="flex items-center justify-between">
        {/* Right side - Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("inquiries")}
            className={`px-8 py-3 rounded-full font-medium transition-colors ${
              activeTab === "inquiries"
                ? "bg-[#051839] text-white"
                : "bg-white text-[#051839] border border-gray-200 hover:bg-gray-50"
            }`}
          >
            פניות
          </button>
          <button
            onClick={() => setActiveTab("issues")}
            className={`px-8 py-3 rounded-full font-medium transition-colors ${
              activeTab === "issues"
                ? "bg-[#051839] text-white"
                : "bg-white text-[#051839] border border-gray-200 hover:bg-gray-50"
            }`}
          >
            תקלות
          </button>
        </div>

        {/* Left side - Actions */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowNewTicketDialog(true)}
            className="px-6 py-3 rounded-full bg-[#051839] text-white font-medium hover:bg-[#051839]/90 transition-colors flex items-center gap-2"
          >
            {activeTab === "inquiries" ? "פתיחת פנייה חדשה" : "פתיחת תקלה חדשה"}
            <Plus className="w-4 h-4" />
          </button>
          <button className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4">
          {/* Table Header */}
          <div className={`grid ${activeTab === "inquiries" ? "grid-cols-5" : "grid-cols-5"} gap-4 text-sm font-medium text-gray-500 mb-4 px-4`}>
            <span className="text-right">תאריך הפנייה</span>
            <span className="text-right">סטטוס</span>
            <span className="text-right">{activeTab === "inquiries" ? "מהות הפנייה" : "מהות התקלה"}</span>
            <span className="text-right">{activeTab === "inquiries" ? "מהות הפנייה" : "שם האולם"}</span>
            <span></span>
          </div>
          
          {/* Table Rows */}
          <div className="space-y-2">
            {tickets?.map((ticket: any) => (
              <div 
                key={ticket.id} 
                className="grid grid-cols-5 gap-4 items-center bg-gray-50 rounded-xl p-4 text-sm"
              >
                <span className="font-bold text-[#051839]">
                  {new Date(ticket.created_at).toLocaleDateString("he-IL")}
                </span>
                <span className="font-bold text-[#051839]">
                  {getStatusText(ticket.status, !!ticket.response)}
                </span>
                <span className="text-gray-600 truncate">
                  {ticket.description?.substring(0, 30)}...
                </span>
                <span className={activeTab === "issues" ? "font-bold text-[#95742F]" : "text-gray-600 truncate"}>
                  {activeTab === "issues" ? venue?.name || "—" : ticket.subject}
                </span>
                <span className="flex items-center gap-2 justify-end">
                  <button 
                    onClick={() => setSelectedTicket(ticket)}
                    className="px-4 py-2 rounded-full bg-[#C41E3A] text-white font-medium hover:bg-[#C41E3A]/90 transition-colors flex items-center gap-2"
                  >
                    צפייה בתשובה
                  </button>
                  <button 
                    onClick={() => setSelectedTicket(ticket)}
                    className="w-10 h-10 rounded-full border-2 border-[#C41E3A] flex items-center justify-center text-[#C41E3A] hover:bg-[#C41E3A]/10 transition-colors"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </span>
              </div>
            ))}
            
            {!tickets?.length && (
              <div className="text-center py-8 text-gray-500">
                אין {activeTab === "inquiries" ? "פניות" : "תקלות"} להצגה
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
                <p className="font-medium text-[#051839]">
                  {getStatusText(selectedTicket.status, !!selectedTicket.response)}
                </p>
              </div>
              {selectedTicket.response && (
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <Label className="text-green-700 text-sm font-medium">תשובה</Label>
                  <p className="text-green-800 mt-1">{selectedTicket.response}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
