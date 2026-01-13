import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Eye, X, Phone, Mail, Calendar, User } from "lucide-react";

export default function VenueLeads() {
  const [selectedLead, setSelectedLead] = useState<any>(null);
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

  const { data: leads } = useQuery({
    queryKey: ["venue-landing-leads", venue?.id],
    enabled: !!venue?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("landing_page_leads")
        .select("*")
        .eq("venue_id", venue!.id)
        .order("created_at", { ascending: false });

      return data || [];
    },
  });

  const updateLeadStatus = useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: string }) => {
      const { error } = await supabase
        .from("landing_page_leads")
        .update({ status })
        .eq("id", leadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venue-landing-leads"] });
      toast({ title: "הסטטוס עודכן בהצלחה" });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-500";
      case "contacted":
        return "bg-yellow-500";
      case "closed":
        return "bg-green-500";
      case "lost":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "new":
        return "חדש";
      case "contacted":
        return "נוצר קשר";
      case "closed":
        return "נסגר";
      case "lost":
        return "אבד";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div />
        <h1 className="text-2xl font-bold text-[#051839]">לידים מדף הנחיתה</h1>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4">
          {/* Table Header */}
          <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-500 mb-4 px-4">
            <span className="text-right">תאריך</span>
            <span className="text-right">שם מלא</span>
            <span className="text-right">טלפון</span>
            <span className="text-right">מייל</span>
            <span className="text-right">תאריך אירוע</span>
            <span className="text-right">סטטוס</span>
          </div>
          
          {/* Table Rows */}
          <div className="space-y-2">
            {leads?.map((lead: any) => (
              <div 
                key={lead.id} 
                className="grid grid-cols-6 gap-4 items-center bg-gray-50 rounded-xl p-4 text-sm cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setSelectedLead(lead)}
              >
                <span className="font-bold text-[#051839]">
                  {new Date(lead.created_at).toLocaleDateString("he-IL")}
                </span>
                <span className="font-bold text-[#051839]">
                  {lead.full_name || "—"}
                </span>
                <span className="font-bold text-[#051839]">
                  {lead.phone || "—"}
                </span>
                <span className="text-[#051839]">
                  {lead.email || "—"}
                </span>
                <span className="text-[#051839]">
                  {lead.event_date ? new Date(lead.event_date).toLocaleDateString("he-IL") : "—"}
                </span>
                <span>
                  <span className={`inline-block px-4 py-2 rounded-full text-white font-medium text-center ${getStatusColor(lead.status)}`}>
                    {getStatusLabel(lead.status)}
                  </span>
                </span>
              </div>
            ))}
            
            {!leads?.length && (
              <div className="text-center py-8 text-gray-500">
                אין לידים עדיין. שתף את הלינק של דף הנחיתה שלך!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lead Details Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="p-0 overflow-hidden rounded-2xl border-0 max-w-md">
          <DialogHeader className="bg-[#051839] text-white p-4 flex flex-row items-center justify-between">
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <Eye className="w-5 h-5" />
              פרטי הליד
            </DialogTitle>
            <button 
              onClick={() => setSelectedLead(null)}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </DialogHeader>
          
          {selectedLead && (
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <Label className="text-gray-500 text-sm">שם מלא</Label>
                    <p className="font-medium text-[#051839]">{selectedLead.full_name}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <Label className="text-gray-500 text-sm">טלפון</Label>
                    <p className="font-medium text-[#051839]">{selectedLead.phone || "—"}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <Label className="text-gray-500 text-sm">מייל</Label>
                    <p className="font-medium text-[#051839]">{selectedLead.email || "—"}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <Label className="text-gray-500 text-sm">תאריך אירוע</Label>
                    <p className="font-medium text-[#051839]">
                      {selectedLead.event_date ? new Date(selectedLead.event_date).toLocaleDateString("he-IL") : "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Label className="text-gray-500 text-sm block mb-2">הערות</Label>
                <Textarea
                  value={selectedLead.notes || ""}
                  onChange={(e) => setSelectedLead({ ...selectedLead, notes: e.target.value })}
                  placeholder="הוסף הערות..."
                  className="rounded-xl border-gray-200 text-right min-h-[80px]"
                />
              </div>

              <div className="pt-4 border-t">
                <Label className="text-gray-500 text-sm block mb-2">שנה סטטוס</Label>
                <div className="flex gap-2 flex-wrap">
                  {["new", "contacted", "closed", "lost"].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        updateLeadStatus.mutate({ leadId: selectedLead.id, status });
                        setSelectedLead({ ...selectedLead, status });
                      }}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedLead.status === status
                          ? `${getStatusColor(status)} text-white`
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {getStatusLabel(status)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}