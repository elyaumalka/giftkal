import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Filter,
  MessageSquare,
  ClipboardList,
  X,
  User,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

export default function Leads() {
  const [activeTab, setActiveTab] = useState("venue_owner");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isEditLeadOpen, setIsEditLeadOpen] = useState(false);
  const [isViewLeadOpen, setIsViewLeadOpen] = useState(false);
  
  // New lead form state
  const [newLeadFullName, setNewLeadFullName] = useState("");
  const [newLeadPhone, setNewLeadPhone] = useState("");
  const [newLeadEmail, setNewLeadEmail] = useState("");
  const [newLeadVenueName, setNewLeadVenueName] = useState("");
  const [newLeadVenueAddress, setNewLeadVenueAddress] = useState("");
  const [newLeadVenueCount, setNewLeadVenueCount] = useState("1");
  const [newLeadStatus, setNewLeadStatus] = useState("new");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch leads
  const { data: leads, refetch } = useQuery({
    queryKey: ["leads", activeTab],
    queryFn: async () => {
      const { data } = await supabase
        .from("leads")
        .select(`
          *,
          tasks (id, description, is_completed, due_date, created_at),
          notes (id, content, is_completed, created_at)
        `)
        .eq("lead_type", activeTab)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const filteredLeads = leads?.filter((lead) =>
    lead.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.venue_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetLeadForm = () => {
    setNewLeadFullName("");
    setNewLeadPhone("");
    setNewLeadEmail("");
    setNewLeadVenueName("");
    setNewLeadVenueAddress("");
    setNewLeadVenueCount("1");
    setNewLeadStatus("new");
    setSelectedLead(null);
  };

  const openEditLead = (lead: any) => {
    setSelectedLead(lead);
    setNewLeadFullName(lead.full_name);
    setNewLeadPhone(lead.phone || "");
    setNewLeadEmail(lead.email || "");
    setNewLeadVenueName(lead.venue_name || "");
    setNewLeadVenueAddress(lead.venue_address || "");
    setNewLeadVenueCount(lead.venue_count?.toString() || "1");
    setNewLeadStatus(lead.status || "new");
    setIsEditLeadOpen(true);
  };

  const addLead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("leads").insert({
        full_name: newLeadFullName,
        phone: newLeadPhone || null,
        email: newLeadEmail || null,
        lead_type: activeTab,
        venue_name: activeTab === "venue_owner" ? newLeadVenueName : null,
        venue_address: activeTab === "venue_owner" ? newLeadVenueAddress : null,
        venue_count: activeTab === "venue_owner" ? parseInt(newLeadVenueCount) : null,
        status: newLeadStatus,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setIsAddLeadOpen(false);
      resetLeadForm();
      toast({ title: "הליד נוסף בהצלחה" });
    },
    onError: (error: any) => {
      toast({ title: "שגיאה בהוספת ליד", description: error.message, variant: "destructive" });
    },
  });

  const updateLead = useMutation({
    mutationFn: async () => {
      if (!selectedLead) return;
      const { error } = await supabase.from("leads").update({
        full_name: newLeadFullName,
        phone: newLeadPhone || null,
        email: newLeadEmail || null,
        venue_name: activeTab === "venue_owner" ? newLeadVenueName : null,
        venue_address: activeTab === "venue_owner" ? newLeadVenueAddress : null,
        venue_count: activeTab === "venue_owner" ? parseInt(newLeadVenueCount) : null,
        status: newLeadStatus,
      }).eq("id", selectedLead.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setIsEditLeadOpen(false);
      resetLeadForm();
      toast({ title: "הליד עודכן בהצלחה" });
    },
    onError: (error: any) => {
      toast({ title: "שגיאה בעדכון ליד", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Bar - Tabs on right, search/filter/plus on left */}
      <div className="flex items-center justify-between">
        {/* Left - Search, Filter, Plus */}
        <div className="flex items-center gap-2">
          <button className="bg-white rounded-full p-2 shadow-sm">
            <Filter className="w-4 h-4 text-muted-foreground" />
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
          <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
            <DialogTrigger asChild>
              <button className="w-10 h-10 rounded-full bg-[#1a2942] text-white flex items-center justify-center hover:bg-[#243a56] transition-colors">
                <Plus className="w-5 h-5" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl p-0 overflow-hidden" hideCloseButton>
              <div className="bg-[#1a2942] text-white p-4 flex items-center justify-between">
                <button onClick={() => setIsAddLeadOpen(false)} className="hover:opacity-80">
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-semibold">הוספת ליד חדש</h2>
                <Plus className="w-5 h-5" />
              </div>
              <div className="bg-white p-6 space-y-6">
                {/* Row 1: Name, Phone, Email */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm mb-2 block text-center">שם הליד</Label>
                    <Input variant="form" value={newLeadFullName} onChange={(e) => setNewLeadFullName(e.target.value)} className="text-center" />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm mb-2 block text-center">טלפון</Label>
                    <Input variant="form" value={newLeadPhone} onChange={(e) => setNewLeadPhone(e.target.value)} className="text-center" />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm mb-2 block text-center">כתובת מייל</Label>
                    <Input variant="form" type="email" value={newLeadEmail} onChange={(e) => setNewLeadEmail(e.target.value)} className="text-center" />
                  </div>
                </div>

                {activeTab === "venue_owner" && (
                  <>
                    {/* Row 2: Venue Name, Address, Count */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-muted-foreground text-sm mb-2 block text-center">שם האולם</Label>
                        <Input variant="form" value={newLeadVenueName} onChange={(e) => setNewLeadVenueName(e.target.value)} className="text-center text-[#c9a54e] font-bold" />
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm mb-2 block text-center">כתובת האולם</Label>
                        <Input variant="form" value={newLeadVenueAddress} onChange={(e) => setNewLeadVenueAddress(e.target.value)} className="text-center" />
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm mb-2 block text-center">כמות אולמות</Label>
                        <Input variant="form" type="number" value={newLeadVenueCount} onChange={(e) => setNewLeadVenueCount(e.target.value)} className="text-center" />
                      </div>
                    </div>
                  </>
                )}

                {/* Row 3: Status */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm mb-2 block text-center">סטטוס</Label>
                    <Select value={newLeadStatus} onValueChange={setNewLeadStatus}>
                      <SelectTrigger className="bg-[#f5f5f5] border-0 rounded-xl text-center">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">חדש</SelectItem>
                        <SelectItem value="contacted">נוצר קשר</SelectItem>
                        <SelectItem value="qualified">מתאים</SelectItem>
                        <SelectItem value="converted">הומר ללקוח</SelectItem>
                        <SelectItem value="lost">אבוד</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div></div>
                  <div></div>
                </div>

                <Button 
                  onClick={() => addLead.mutate()} 
                  disabled={!newLeadFullName || addLead.isPending} 
                  className="w-full bg-[#1a2942] hover:bg-[#243a56] text-white rounded-full py-6 text-lg font-medium flex items-center justify-center gap-2"
                >
                  <span>←</span>
                  {addLead.isPending ? "מוסיף..." : "הוספת ליד חדש"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Right - Tabs */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab("event_owner")}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${
              activeTab === "event_owner"
                ? "bg-[#1a2942] text-white"
                : "bg-white text-foreground hover:bg-gray-100"
            }`}
          >
            בעלי אירועים
          </button>
          <button
            onClick={() => setActiveTab("venue_owner")}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${
              activeTab === "venue_owner"
                ? "bg-[#1a2942] text-white"
                : "bg-white text-foreground hover:bg-gray-100"
            }`}
          >
            בעלי אולמות
          </button>
        </div>
      </div>

      {/* Edit Lead Dialog */}
      <Dialog open={isEditLeadOpen} onOpenChange={setIsEditLeadOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden" hideCloseButton>
          <div className="bg-[#1a2942] text-white p-4 flex items-center justify-between">
            <button onClick={() => setIsEditLeadOpen(false)} className="hover:opacity-80">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold">עריכת ליד</h2>
            <Pencil className="w-5 h-5" />
          </div>
          <div className="bg-white p-6 space-y-6">
            {/* Row 1: Name, Phone, Email */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block text-center">שם הליד</Label>
                <Input variant="form" value={newLeadFullName} onChange={(e) => setNewLeadFullName(e.target.value)} className="text-center" />
              </div>
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block text-center">טלפון</Label>
                <Input variant="form" value={newLeadPhone} onChange={(e) => setNewLeadPhone(e.target.value)} className="text-center" />
              </div>
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block text-center">כתובת מייל</Label>
                <Input variant="form" type="email" value={newLeadEmail} onChange={(e) => setNewLeadEmail(e.target.value)} className="text-center" />
              </div>
            </div>

            {selectedLead?.lead_type === "venue_owner" && (
              <>
                {/* Row 2: Venue Name, Address, Count */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm mb-2 block text-center">שם האולם</Label>
                    <Input variant="form" value={newLeadVenueName} onChange={(e) => setNewLeadVenueName(e.target.value)} className="text-center text-[#c9a54e] font-bold" />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm mb-2 block text-center">כתובת האולם</Label>
                    <Input variant="form" value={newLeadVenueAddress} onChange={(e) => setNewLeadVenueAddress(e.target.value)} className="text-center" />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm mb-2 block text-center">כמות אולמות</Label>
                    <Input variant="form" type="number" value={newLeadVenueCount} onChange={(e) => setNewLeadVenueCount(e.target.value)} className="text-center" />
                  </div>
                </div>
              </>
            )}

            {/* Row 3: Status */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block text-center">סטטוס</Label>
                <Select value={newLeadStatus} onValueChange={setNewLeadStatus}>
                  <SelectTrigger className="bg-[#f5f5f5] border-0 rounded-xl text-center">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">חדש</SelectItem>
                    <SelectItem value="contacted">נוצר קשר</SelectItem>
                    <SelectItem value="qualified">מתאים</SelectItem>
                    <SelectItem value="converted">הומר ללקוח</SelectItem>
                    <SelectItem value="lost">אבוד</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div></div>
              <div></div>
            </div>

            <Button 
              onClick={() => updateLead.mutate()} 
              disabled={!newLeadFullName || updateLead.isPending} 
              className="w-full bg-[#1a2942] hover:bg-[#243a56] text-white rounded-full py-6 text-lg font-medium flex items-center justify-center gap-2"
            >
              <span>←</span>
              {updateLead.isPending ? "שומר..." : "שמור שינויים"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Lead Dialog */}
      <Dialog open={isViewLeadOpen} onOpenChange={setIsViewLeadOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden" hideCloseButton>
          {selectedLead && (
            <LeadDetailsPopup
              lead={leads?.find(l => l.id === selectedLead.id) || selectedLead}
              onClose={() => setIsViewLeadOpen(false)}
              onRefresh={() => refetch()}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Table Header - Right to Left: Edit, Name, Phone, Email, Venue, Notes count, Tasks count, View */}
      <div className="grid grid-cols-[auto_1fr_1fr_1.5fr_1fr_auto_auto_auto] gap-4 px-6 py-3 text-sm font-medium text-muted-foreground text-center">
        <span className="w-10"></span>
        <span>שם הליד</span>
        <span>טלפון</span>
        <span>כתובת מייל</span>
        <span>שם האולם</span>
        <span className="w-16"></span>
        <span className="w-16"></span>
        <span className="w-10"></span>
      </div>

      {/* Lead Rows */}
      <div className="space-y-3">
        {filteredLeads?.map((lead) => (
          <div
            key={lead.id}
            className="grid grid-cols-[auto_auto_1fr_1fr_1.5fr_1fr_auto_auto_auto] gap-4 items-center bg-white rounded-2xl px-6 py-5 shadow-sm"
          >
            {/* עריכה - first on right */}
            <button
              onClick={() => openEditLead(lead)}
              className="w-10 h-10 rounded-full bg-[#1a2942] text-white flex items-center justify-center hover:bg-[#243a56] transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>

            {/* שם הליד */}
            <span className="text-center font-bold">
              {lead.full_name}
            </span>
            
            {/* טלפון */}
            <span className="text-center font-bold">
              {lead.phone || "—"}
            </span>
            
            {/* כתובת מייל */}
            <span className="text-center font-bold">
              {lead.email || "—"}
            </span>
            
            {/* שם האולם */}
            <span className="text-center font-bold text-[#c9a54e]">
              {lead.venue_name || "—"}
            </span>

            {/* הערות */}
            <div className="flex items-center gap-1 w-16 justify-center">
              <span className="font-bold">{lead.notes?.filter((n: any) => !n.is_completed).length || 0}</span>
              <ClipboardList className="w-5 h-5 text-muted-foreground" />
            </div>

            {/* משימות */}
            <div className="flex items-center gap-1 w-16 justify-center">
              <span className="font-bold">{lead.tasks?.filter((t: any) => !t.is_completed).length || 0}</span>
              <MessageSquare className="w-5 h-5 text-muted-foreground" />
            </div>

            {/* צפייה - last on left */}
            <button
              onClick={() => {
                setSelectedLead(lead);
                setIsViewLeadOpen(true);
              }}
              className="w-10 h-10 rounded-full bg-[#1a2942] text-white flex items-center justify-center hover:bg-[#243a56] transition-colors"
            >
              <Eye className="w-5 h-5" />
            </button>
          </div>
        ))}

        {!filteredLeads?.length && (
          <div className="text-center py-12 text-muted-foreground bg-white rounded-2xl">
            לא נמצאו לידים
          </div>
        )}
      </div>
    </div>
  );
}

interface LeadDetailsPopupProps {
  lead: any;
  onClose: () => void;
  onRefresh: () => void;
}

function LeadDetailsPopup({ lead, onClose, onRefresh }: LeadDetailsPopupProps) {
  const [newTask, setNewTask] = useState("");
  const [newTaskDate, setNewTaskDate] = useState("");
  const [newTaskTime, setNewTaskTime] = useState("");
  const [newNote, setNewNote] = useState("");
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addTask = useMutation({
    mutationFn: async () => {
      const dueDate = newTaskDate || null;
      const { error } = await supabase.from("tasks").insert({
        lead_id: lead.id,
        description: newTask + (newTaskTime ? ` (${newTaskTime})` : ""),
        due_date: dueDate,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setNewTask("");
      setNewTaskDate("");
      setNewTaskTime("");
      setIsAddTaskOpen(false);
      toast({ title: "המשימה נוספה בהצלחה" });
      onRefresh();
    },
  });

  const addNote = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notes").insert({
        lead_id: lead.id,
        content: newNote,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setNewNote("");
      setIsAddNoteOpen(false);
      toast({ title: "ההערה נוספה בהצלחה" });
      onRefresh();
    },
  });

  const toggleTask = useMutation({
    mutationFn: async ({ taskId, currentState }: { taskId: string; currentState: boolean }) => {
      const { error } = await supabase
        .from("tasks")
        .update({ is_completed: !currentState })
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      onRefresh();
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      onRefresh();
    },
  });

  const toggleNote = useMutation({
    mutationFn: async ({ noteId, currentState }: { noteId: string; currentState: boolean }) => {
      const { error } = await supabase
        .from("notes")
        .update({ is_completed: !currentState })
        .eq("id", noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      onRefresh();
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase.from("notes").delete().eq("id", noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      onRefresh();
    },
  });

  const allTasks = lead.tasks || [];
  const allNotes = lead.notes || [];
  const openTasksCount = allTasks.filter((t: any) => !t.is_completed).length;
  const openNotesCount = allNotes.filter((n: any) => !n.is_completed).length;

  return (
    <div className="bg-[#e5e5e5] min-h-[500px]">
      {/* Dark Header - Title on LEFT, buttons + X on RIGHT */}
      <div className="bg-[#1a2942] text-white px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold">פרטי ליד</span>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddTaskOpen(true)}
            className="bg-transparent border-white text-white hover:bg-white hover:text-[#1a2942] rounded-full px-4"
          >
            הוספת משימה
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddNoteOpen(true)}
            className="bg-transparent border-white text-white hover:bg-white hover:text-[#1a2942] rounded-full px-4"
          >
            הוספת הערה
          </Button>
          <button onClick={onClose} className="hover:opacity-80">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Lead Info Row - Avatar+Name on LEFT, then fields going RIGHT: Phone, Email, Venue, Address, Count */}
      <div className="bg-white mx-6 mt-6 rounded-2xl px-6 py-4 flex items-center gap-8">
        <div className="w-12 h-12 rounded-full bg-[#e5e5e5] flex items-center justify-center">
          <User className="w-6 h-6 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">שם הליד</p>
          <p className="font-bold text-lg">{lead.full_name}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">טלפון</p>
          <p className="font-bold">{lead.phone || "—"}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">כתובת מייל</p>
          <p className="font-bold">{lead.email || "—"}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">שם האולם</p>
          <p className="font-bold text-[#c9a54e]">{lead.venue_name || "—"}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">כתובת האולם</p>
          <p className="font-bold">{lead.venue_address || "—"}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">כמות אולמות</p>
          <p className="font-bold">{lead.venue_count || 1}</p>
        </div>
      </div>

      {/* Two Columns - Tasks and Notes */}
      <div className="grid grid-cols-2 gap-6 p-6">
        {/* משימות לביצוע */}
        <div className="bg-[#dbeafe] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-lg">משימות לביצוע</span>
            <span className="font-bold text-xl">{openTasksCount}</span>
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {allTasks.map((task: any) => (
              <div key={task.id} className={`bg-white rounded-xl p-4 space-y-2 ${task.is_completed ? "opacity-60" : ""}`}>
                <div className="flex items-center justify-between">
                  <p className={`font-bold text-sm ${task.is_completed ? "line-through text-green-600" : ""}`}>
                    {new Date(task.created_at).toLocaleDateString("he-IL")}
                  </p>
                  <div className="flex items-center gap-2">
                    {task.is_completed && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">בוצע ✓</span>}
                    <p className="text-sm text-muted-foreground">מהות המשימה</p>
                  </div>
                </div>
                {task.due_date && (
                  <p className="text-xs text-muted-foreground">
                    תאריך יעד: {new Date(task.due_date).toLocaleDateString("he-IL")}
                  </p>
                )}
                <p className={`text-sm ${task.is_completed ? "line-through" : ""}`}>{task.description}</p>
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => deleteTask.mutate(task.id)}
                    className="bg-[#d64550] hover:bg-[#c13a44] text-white rounded-full px-4"
                  >
                    מחיקה
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleTask.mutate({ taskId: task.id, currentState: !!task.is_completed })}
                    className={`rounded-full px-4 ${task.is_completed ? "border-green-600 text-green-600" : "border-[#1a2942] text-[#1a2942]"}`}
                  >
                    {task.is_completed ? "בטל סימון" : "סימון כבוצע"}
                  </Button>
                </div>
              </div>
            ))}
            {!allTasks.length && (
              <p className="text-center text-muted-foreground py-4">אין משימות</p>
            )}
          </div>
        </div>

        {/* הערות */}
        <div className="bg-[#dbeafe] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-lg">הערות</span>
            <span className="font-bold text-xl">{openNotesCount}</span>
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {allNotes.map((note: any) => (
              <div key={note.id} className={`bg-white rounded-xl p-4 space-y-2 ${note.is_completed ? "opacity-60" : ""}`}>
                <div className="flex items-center justify-between">
                  <p className={`font-bold text-sm ${note.is_completed ? "line-through text-green-600" : ""}`}>
                    {new Date(note.created_at).toLocaleDateString("he-IL")}
                  </p>
                  {note.is_completed && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">בוצע ✓</span>}
                </div>
                <p className={`text-sm ${note.is_completed ? "line-through" : ""}`}>{note.content}</p>
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => deleteNote.mutate(note.id)}
                    className="bg-[#d64550] hover:bg-[#c13a44] text-white rounded-full px-4"
                  >
                    מחיקה
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleNote.mutate({ noteId: note.id, currentState: !!note.is_completed })}
                    className={`rounded-full px-4 ${note.is_completed ? "border-green-600 text-green-600" : "border-[#1a2942] text-[#1a2942]"}`}
                  >
                    {note.is_completed ? "בטל סימון" : "סימון כבוצע"}
                  </Button>
                </div>
              </div>
            ))}
            {!allNotes.length && (
              <p className="text-center text-muted-foreground py-4">אין הערות</p>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden" hideCloseButton>
          <div className="bg-[#1a2942] text-white p-4 flex items-center justify-between">
            <button onClick={() => setIsAddTaskOpen(false)} className="hover:opacity-80">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold">הוספת משימה</h2>
            <Plus className="w-5 h-5" />
          </div>
          <div className="bg-white p-6 space-y-4">
            <div>
              <Label className="text-muted-foreground text-sm mb-2 block text-center">תיאור המשימה</Label>
              <Input
                variant="form"
                placeholder="תיאור המשימה..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                className="text-center"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block text-center">תאריך יעד</Label>
                <Input
                  type="date"
                  variant="form"
                  value={newTaskDate}
                  onChange={(e) => setNewTaskDate(e.target.value)}
                  className="text-center"
                />
              </div>
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block text-center">שעה</Label>
                <Input
                  type="time"
                  variant="form"
                  value={newTaskTime}
                  onChange={(e) => setNewTaskTime(e.target.value)}
                  className="text-center"
                />
              </div>
            </div>
            <Button 
              onClick={() => addTask.mutate()} 
              disabled={!newTask.trim()} 
              className="w-full bg-[#1a2942] hover:bg-[#243a56] text-white rounded-full py-6 text-lg font-medium flex items-center justify-center gap-2"
            >
              <span>←</span>
              הוסף משימה
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden" hideCloseButton>
          <div className="bg-[#1a2942] text-white p-4 flex items-center justify-between">
            <button onClick={() => setIsAddNoteOpen(false)} className="hover:opacity-80">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold">הוספת הערה</h2>
            <Plus className="w-5 h-5" />
          </div>
          <div className="bg-white p-6 space-y-4">
            <div>
              <Label className="text-muted-foreground text-sm mb-2 block text-center">תוכן ההערה</Label>
              <Input
                variant="form"
                placeholder="תוכן ההערה..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="text-center"
              />
            </div>
            <Button 
              onClick={() => addNote.mutate()} 
              disabled={!newNote.trim()} 
              className="w-full bg-[#1a2942] hover:bg-[#243a56] text-white rounded-full py-6 text-lg font-medium flex items-center justify-center gap-2"
            >
              <span>←</span>
              הוסף הערה
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
