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
  Plus,
  Search,
  Eye,
  Pencil,
  Building2,
  Users,
  Filter,
  CheckCircle,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function Leads() {
  const [activeTab, setActiveTab] = useState("venue_owner");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [newTask, setNewTask] = useState("");
  const [newNote, setNewNote] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch leads
  const { data: leads } = useQuery({
    queryKey: ["leads", activeTab],
    queryFn: async () => {
      const { data } = await supabase
        .from("leads")
        .select(`
          *,
          tasks (id, description, is_completed, due_date),
          notes (id, content, is_completed)
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

  const addTask = useMutation({
    mutationFn: async ({ leadId, description }: { leadId: string; description: string }) => {
      const { error } = await supabase.from("tasks").insert({
        lead_id: leadId,
        description,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setNewTask("");
      toast({ title: "המשימה נוספה בהצלחה" });
    },
  });

  const addNote = useMutation({
    mutationFn: async ({ leadId, content }: { leadId: string; content: string }) => {
      const { error } = await supabase.from("notes").insert({
        lead_id: leadId,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setNewNote("");
      toast({ title: "ההערה נוספה בהצלחה" });
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
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
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
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase.from("notes").delete().eq("id", noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">לידים</h1>
          <p className="text-muted-foreground mt-1">ניהול לידים פוטנציאליים</p>
        </div>
        <Button variant="gold">
          <Plus className="w-4 h-4 ml-2" />
          הוספת ליד
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש ליד..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 ml-2" />
          פילטרים
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="venue_owner" className="gap-2">
            <Building2 className="w-4 h-4" />
            בעלי אולמות
          </TabsTrigger>
          <TabsTrigger value="event_owner" className="gap-2">
            <Users className="w-4 h-4" />
            בעלי אירועים
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="bg-card rounded-xl shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>פעולות</TableHead>
                  <TableHead>שם הליד</TableHead>
                  <TableHead>טלפון</TableHead>
                  <TableHead>מייל</TableHead>
                  <TableHead>שם האולם</TableHead>
                  {activeTab === "venue_owner" && <TableHead>כתובת</TableHead>}
                  {activeTab === "venue_owner" && <TableHead>מס' אולמות</TableHead>}
                  <TableHead>משימות</TableHead>
                  <TableHead>הערות</TableHead>
                  <TableHead>צפייה</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads?.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{lead.full_name}</TableCell>
                    <TableCell>{lead.phone || "—"}</TableCell>
                    <TableCell>{lead.email || "—"}</TableCell>
                    <TableCell>{lead.venue_name || "—"}</TableCell>
                    {activeTab === "venue_owner" && (
                      <TableCell>{lead.venue_address || "—"}</TableCell>
                    )}
                    {activeTab === "venue_owner" && (
                      <TableCell>{lead.venue_count || 1}</TableCell>
                    )}
                    <TableCell>{lead.tasks?.filter((t: any) => !t.is_completed).length || 0}</TableCell>
                    <TableCell>{lead.notes?.filter((n: any) => !n.is_completed).length || 0}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedLead(lead)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>פרטי ליד - {lead.full_name}</DialogTitle>
                          </DialogHeader>
                          <LeadDetails
                            lead={lead}
                            newTask={newTask}
                            setNewTask={setNewTask}
                            newNote={newNote}
                            setNewNote={setNewNote}
                            onAddTask={() => addTask.mutate({ leadId: lead.id, description: newTask })}
                            onAddNote={() => addNote.mutate({ leadId: lead.id, content: newNote })}
                            onCompleteTask={(id) => completeTask.mutate(id)}
                            onDeleteTask={(id) => deleteTask.mutate(id)}
                            onCompleteNote={(id) => completeNote.mutate(id)}
                            onDeleteNote={(id) => deleteNote.mutate(id)}
                          />
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
                {!filteredLeads?.length && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      לא נמצאו לידים
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

interface LeadDetailsProps {
  lead: any;
  newTask: string;
  setNewTask: (val: string) => void;
  newNote: string;
  setNewNote: (val: string) => void;
  onAddTask: () => void;
  onAddNote: () => void;
  onCompleteTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onCompleteNote: (id: string) => void;
  onDeleteNote: (id: string) => void;
}

function LeadDetails({
  lead,
  newTask,
  setNewTask,
  newNote,
  setNewNote,
  onAddTask,
  onAddNote,
  onCompleteTask,
  onDeleteTask,
  onCompleteNote,
  onDeleteNote,
}: LeadDetailsProps) {
  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-muted-foreground">שם</Label>
          <p className="font-medium">{lead.full_name}</p>
        </div>
        <div>
          <Label className="text-muted-foreground">טלפון</Label>
          <p className="font-medium">{lead.phone || "—"}</p>
        </div>
        <div>
          <Label className="text-muted-foreground">מייל</Label>
          <p className="font-medium">{lead.email || "—"}</p>
        </div>
        <div>
          <Label className="text-muted-foreground">שם האולם</Label>
          <p className="font-medium">{lead.venue_name || "—"}</p>
        </div>
        {lead.venue_address && (
          <div>
            <Label className="text-muted-foreground">כתובת האולם</Label>
            <p className="font-medium">{lead.venue_address}</p>
          </div>
        )}
        {lead.venue_count && (
          <div>
            <Label className="text-muted-foreground">מספר אולמות</Label>
            <p className="font-medium">{lead.venue_count}</p>
          </div>
        )}
      </div>

      {/* Tasks */}
      <div>
        <Label className="text-lg font-semibold mb-3 block">משימות לביצוע</Label>
        <div className="space-y-2 mb-4">
          {lead.tasks?.filter((t: any) => !t.is_completed).map((task: any) => (
            <div key={task.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span>{task.description}</span>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => onCompleteTask(task.id)}>
                  <CheckCircle className="w-4 h-4 text-success" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDeleteTask(task.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          {!lead.tasks?.filter((t: any) => !t.is_completed).length && (
            <p className="text-muted-foreground text-sm">אין משימות פתוחות</p>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="הוסף משימה חדשה..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
          />
          <Button onClick={onAddTask} disabled={!newTask.trim()}>
            הוסף
          </Button>
        </div>
      </div>

      {/* Notes */}
      <div>
        <Label className="text-lg font-semibold mb-3 block">הערות</Label>
        <div className="space-y-2 mb-4">
          {lead.notes?.filter((n: any) => !n.is_completed).map((note: any) => (
            <div key={note.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span>{note.content}</span>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => onCompleteNote(note.id)}>
                  <CheckCircle className="w-4 h-4 text-success" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDeleteNote(note.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          {!lead.notes?.filter((n: any) => !n.is_completed).length && (
            <p className="text-muted-foreground text-sm">אין הערות</p>
          )}
        </div>
        <div className="flex gap-2">
          <Textarea
            placeholder="הוסף הערה חדשה..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={2}
          />
          <Button onClick={onAddNote} disabled={!newNote.trim()}>
            הוסף
          </Button>
        </div>
      </div>
    </div>
  );
}
