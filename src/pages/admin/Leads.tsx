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
            <DialogContent className="max-w-lg">
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-center">הוספת ליד חדש</h2>
                <div>
                  <Label>שם מלא *</Label>
                  <Input value={newLeadFullName} onChange={(e) => setNewLeadFullName(e.target.value)} placeholder="שם הליד" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>טלפון</Label>
                    <Input value={newLeadPhone} onChange={(e) => setNewLeadPhone(e.target.value)} placeholder="050-1234567" />
                  </div>
                  <div>
                    <Label>מייל</Label>
                    <Input type="email" value={newLeadEmail} onChange={(e) => setNewLeadEmail(e.target.value)} placeholder="email@example.com" />
                  </div>
                </div>
                {activeTab === "venue_owner" && (
                  <>
                    <div>
                      <Label>שם האולם</Label>
                      <Input value={newLeadVenueName} onChange={(e) => setNewLeadVenueName(e.target.value)} placeholder="שם האולם" />
                    </div>
                    <div>
                      <Label>כתובת האולם</Label>
                      <Input value={newLeadVenueAddress} onChange={(e) => setNewLeadVenueAddress(e.target.value)} placeholder="כתובת" />
                    </div>
                    <div>
                      <Label>מספר אולמות</Label>
                      <Input type="number" value={newLeadVenueCount} onChange={(e) => setNewLeadVenueCount(e.target.value)} placeholder="1" />
                    </div>
                  </>
                )}
                <div>
                  <Label>סטטוס</Label>
                  <Select value={newLeadStatus} onValueChange={setNewLeadStatus}>
                    <SelectTrigger>
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
                <Button onClick={() => addLead.mutate()} disabled={!newLeadFullName || addLead.isPending} className="w-full">
                  {addLead.isPending ? "מוסיף..." : "הוסף ליד"}
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
                ? "bg-[#c9a54e] text-white"
                : "bg-white text-foreground hover:bg-gray-100"
            }`}
          >
            בעלי אירועים
          </button>
          <button
            onClick={() => setActiveTab("venue_owner")}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${
              activeTab === "venue_owner"
                ? "bg-[#c9a54e] text-white"
                : "bg-white text-foreground hover:bg-gray-100"
            }`}
          >
            בעלי אולמות
          </button>
        </div>
      </div>

      {/* Edit Lead Dialog */}
      <Dialog open={isEditLeadOpen} onOpenChange={setIsEditLeadOpen}>
        <DialogContent className="max-w-lg">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-center">עריכת ליד</h2>
            <div>
              <Label>שם מלא *</Label>
              <Input value={newLeadFullName} onChange={(e) => setNewLeadFullName(e.target.value)} placeholder="שם הליד" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>טלפון</Label>
                <Input value={newLeadPhone} onChange={(e) => setNewLeadPhone(e.target.value)} placeholder="050-1234567" />
              </div>
              <div>
                <Label>מייל</Label>
                <Input type="email" value={newLeadEmail} onChange={(e) => setNewLeadEmail(e.target.value)} placeholder="email@example.com" />
              </div>
            </div>
            {selectedLead?.lead_type === "venue_owner" && (
              <>
                <div>
                  <Label>שם האולם</Label>
                  <Input value={newLeadVenueName} onChange={(e) => setNewLeadVenueName(e.target.value)} placeholder="שם האולם" />
                </div>
                <div>
                  <Label>כתובת האולם</Label>
                  <Input value={newLeadVenueAddress} onChange={(e) => setNewLeadVenueAddress(e.target.value)} placeholder="כתובת" />
                </div>
                <div>
                  <Label>מספר אולמות</Label>
                  <Input type="number" value={newLeadVenueCount} onChange={(e) => setNewLeadVenueCount(e.target.value)} placeholder="1" />
                </div>
              </>
            )}
            <div>
              <Label>סטטוס</Label>
              <Select value={newLeadStatus} onValueChange={setNewLeadStatus}>
                <SelectTrigger>
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
            <Button onClick={() => updateLead.mutate()} disabled={!newLeadFullName || updateLead.isPending} className="w-full">
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
              lead={selectedLead}
              onClose={() => setIsViewLeadOpen(false)}
              onRefresh={() => refetch()}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Table Header - Right to Left */}
      <div className="grid grid-cols-[1fr_1fr_1.5fr_1fr_auto_auto_auto_auto] gap-4 px-6 py-3 text-sm font-medium text-muted-foreground text-center">
        <span>שם הליד</span>
        <span>טלפון</span>
        <span>כתובת מייל</span>
        <span>שם האולם</span>
        <span className="w-10"></span>
        <span className="w-16"></span>
        <span className="w-16"></span>
        <span className="w-10"></span>
      </div>

      {/* Lead Rows */}
      <div className="space-y-3">
        {filteredLeads?.map((lead) => (
          <div
            key={lead.id}
            className="grid grid-cols-[1fr_1fr_1.5fr_1fr_auto_auto_auto_auto] gap-4 items-center bg-white rounded-2xl px-6 py-5 shadow-sm"
          >
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

            {/* עריכה */}
            <button
              onClick={() => openEditLead(lead)}
              className="w-10 h-10 rounded-full border-2 border-[#1a2942] flex items-center justify-center hover:bg-[#1a2942] hover:text-white transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>

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

            {/* צפייה */}
            <button
              onClick={() => {
                setSelectedLead(lead);
                setIsViewLeadOpen(true);
              }}
              className="w-10 h-10 rounded-full border-2 border-[#1a2942] flex items-center justify-center hover:bg-[#1a2942] hover:text-white transition-colors"
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
  const [newNote, setNewNote] = useState("");
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addTask = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("tasks").insert({
        lead_id: lead.id,
        description: newTask,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setNewTask("");
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

  const completeTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from("tasks")
        .update({ is_completed: true })
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

  const completeNote = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from("notes")
        .update({ is_completed: true })
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

  const openTasks = lead.tasks?.filter((t: any) => !t.is_completed) || [];
  const openNotes = lead.notes?.filter((n: any) => !n.is_completed) || [];

  return (
    <div className="bg-[#e5e5e5] min-h-[500px]">
      {/* Dark Header */}
      <div className="bg-[#1a2942] text-white px-6 py-4 flex items-center justify-between">
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
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold">פרטי ליד</span>
          <button onClick={onClose} className="hover:opacity-80">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Lead Info Row */}
      <div className="bg-white mx-6 mt-6 rounded-2xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">כמות אולמות</p>
            <p className="font-bold">{lead.venue_count || 1}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">כתובת האולם</p>
            <p className="font-bold">{lead.venue_address || "—"}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">שם האולם</p>
            <p className="font-bold text-[#c9a54e]">{lead.venue_name || "—"}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">כתובת מייל</p>
            <p className="font-bold">{lead.email || "—"}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">טלפון</p>
            <p className="font-bold">{lead.phone || "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-left">
            <p className="text-sm text-muted-foreground">שם הליד</p>
            <p className="font-bold text-lg">{lead.full_name}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#e5e5e5] flex items-center justify-center">
            <User className="w-6 h-6 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Two Columns - Tasks and Notes */}
      <div className="grid grid-cols-2 gap-6 p-6">
        {/* משימות לביצוע */}
        <div className="bg-[#dbeafe] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-lg">משימות לביצוע</span>
            <span className="font-bold text-xl">{openTasks.length}</span>
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {openTasks.map((task: any) => (
              <div key={task.id} className="bg-white rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm">
                    {new Date(task.created_at).toLocaleDateString("he-IL")}
                  </p>
                  <p className="text-sm text-muted-foreground">מהות המשימה</p>
                </div>
                <p className="text-sm">{task.description}</p>
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
                    onClick={() => completeTask.mutate(task.id)}
                    className="rounded-full px-4 border-[#1a2942] text-[#1a2942]"
                  >
                    סימון כבוצע
                  </Button>
                </div>
              </div>
            ))}
            {!openTasks.length && (
              <p className="text-center text-muted-foreground py-4">אין משימות פתוחות</p>
            )}
          </div>
        </div>

        {/* הערות */}
        <div className="bg-[#dbeafe] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-lg">הערות</span>
            <span className="font-bold text-xl">{openNotes.length}</span>
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {openNotes.map((note: any) => (
              <div key={note.id} className="bg-white rounded-xl p-4 space-y-2">
                <p className="font-bold text-sm">
                  {new Date(note.created_at).toLocaleDateString("he-IL")}
                </p>
                <p className="text-sm">{note.content}</p>
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
                    onClick={() => completeNote.mutate(note.id)}
                    className="rounded-full px-4 border-[#1a2942] text-[#1a2942]"
                  >
                    סימון כבוצע
                  </Button>
                </div>
              </div>
            ))}
            {!openNotes.length && (
              <p className="text-center text-muted-foreground py-4">אין הערות</p>
            )}
          </div>
        </div>
      </div>

      {/* Add Task Dialog */}
      <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
        <DialogContent>
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-center">הוספת משימה</h2>
            <Input
              placeholder="תיאור המשימה..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
            />
            <Button onClick={() => addTask.mutate()} disabled={!newTask.trim()} className="w-full">
              הוסף משימה
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen}>
        <DialogContent>
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-center">הוספת הערה</h2>
            <Input
              placeholder="תוכן ההערה..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            />
            <Button onClick={() => addNote.mutate()} disabled={!newNote.trim()} className="w-full">
              הוסף הערה
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
