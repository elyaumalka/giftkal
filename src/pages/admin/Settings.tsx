import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings as SettingsIcon,
  Key,
  Users,
  Plus,
  Trash2,
  Pencil,
  Save,
  Upload,
  X,
  FileText,
  Building2,
  Copy,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import type { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["user_role"];

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // General settings state
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  // API key state
  const [newApiName, setNewApiName] = useState("");
  const [newApiKey, setNewApiKey] = useState("");
  const [newApiKeyPartner, setNewApiKeyPartner] = useState<string>("");
  const [isAddApiKeyOpen, setIsAddApiKeyOpen] = useState(false);

  // Partner management state
  const [isAddPartnerOpen, setIsAddPartnerOpen] = useState(false);
  const [newPartnerName, setNewPartnerName] = useState("");
  const [newPartnerEmail, setNewPartnerEmail] = useState("");
  const [newPartnerWebhookUrl, setNewPartnerWebhookUrl] = useState("");
  const [newPartnerEvents, setNewPartnerEvents] = useState<string[]>(["sale-paid", "payment-account-approved"]);
  const [revealedSecret, setRevealedSecret] = useState<{ id: string; secret: string } | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Edit user state
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserPhone, setEditUserPhone] = useState("");
  const [editUserRole, setEditUserRole] = useState<UserRole | "">("");
  const [editUserPassword, setEditUserPassword] = useState("");

  // Add document state
  const [isAddDocOpen, setIsAddDocOpen] = useState(false);
  const [newDocType, setNewDocType] = useState("");
  const [newDocForType, setNewDocForType] = useState<"venue_owner" | "event_owner">("venue_owner");

  // Fetch system settings
  const { data: settings } = useQuery({
    queryKey: ["system-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("system_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  // Fetch required documents
  const { data: requiredDocs } = useQuery({
    queryKey: ["required-documents"],
    queryFn: async () => {
      const { data } = await supabase
        .from("required_documents")
        .select("*")
        .order("created_at", { ascending: true });
      return data || [];
    },
  });

  // Fetch API keys
  const { data: apiKeys } = useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const { data } = await supabase
        .from("api_keys")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  // Fetch users with roles
  const { data: users } = useQuery({
    queryKey: ["users-with-roles"],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (!profiles) return [];

      const usersWithRoles = await Promise.all(
        profiles.map(async (profile) => {
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.user_id);
          return { ...profile, roles: roles || [] };
        })
      );

      return usersWithRoles;
    },
  });

  useEffect(() => {
    if (settings?.admin_email) {
      setAdminEmail(settings.admin_email);
    }
  }, [settings]);

  const saveSettings = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("system_settings")
        .upsert({
          id: settings?.id || undefined,
          admin_email: adminEmail || settings?.admin_email,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      toast({ title: "ההגדרות נשמרו בהצלחה" });
    },
    onError: (error: any) => {
      toast({ title: "שגיאה בשמירת הגדרות", description: error.message, variant: "destructive" });
    },
  });

  const addApiKey = useMutation({
    mutationFn: async () => {
      const encoder = new TextEncoder();
      const data = encoder.encode(newApiKey);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      const { error } = await supabase.from("api_keys").insert({
        name: newApiName,
        key_hash: keyHash,
        partner_id: newApiKeyPartner || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      setNewApiName("");
      setNewApiKey("");
      setNewApiKeyPartner("");
      setIsAddApiKeyOpen(false);
      toast({ title: "מפתח API נוסף בהצלחה" });
    },
    onError: (error: any) => {
      toast({ title: "שגיאה בהוספת מפתח", description: error.message, variant: "destructive" });
    },
  });

  const deleteApiKey = useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await supabase.from("api_keys").delete().eq("id", keyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast({ title: "מפתח API נמחק" });
    },
    onError: (error: any) => {
      toast({ title: "שגיאה במחיקת מפתח", description: error.message, variant: "destructive" });
    },
  });

  // ─── Partners (Phase D) ──────────────────────────────────────────────────
  const { data: partners } = useQuery({
    queryKey: ["partners"],
    queryFn: async () => {
      const { data } = await (supabase.from as any)("partners")
        .select("*")
        .order("created_at", { ascending: false });
      return (data ?? []) as any[];
    },
  });

  const addPartner = useMutation({
    mutationFn: async () => {
      // Generate a 32-byte HMAC secret so the partner can verify webhook payloads.
      const secretBytes = crypto.getRandomValues(new Uint8Array(32));
      const secret = Array.from(secretBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
      const events = newPartnerEvents;
      const { data, error } = await (supabase.from as any)("partners")
        .insert({
          name: newPartnerName,
          contact_email: newPartnerEmail || null,
          webhook_url: newPartnerWebhookUrl || null,
          webhook_secret: secret,
          webhook_events: events,
        })
        .select("id")
        .single();
      if (error) throw error;
      return { id: data.id, secret };
    },
    onSuccess: ({ id, secret }) => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      setNewPartnerName("");
      setNewPartnerEmail("");
      setNewPartnerWebhookUrl("");
      setNewPartnerEvents(["sale-paid", "seller-approve"]);
      setIsAddPartnerOpen(false);
      // Show the HMAC secret once so the admin can hand it to the partner.
      setRevealedSecret({ id, secret });
      toast({ title: "שותף נוסף ✅", description: "הצג ושמור את הסוד של ה-webhook עכשיו" });
    },
    onError: (error: any) => {
      toast({ title: "שגיאה ביצירת שותף", description: error.message, variant: "destructive" });
    },
  });

  const deletePartner = useMutation({
    mutationFn: async (partnerId: string) => {
      const { error } = await (supabase.from as any)("partners").delete().eq("id", partnerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast({ title: "השותף נמחק" });
    },
    onError: (error: any) => {
      toast({ title: "שגיאה במחיקת שותף", description: error.message, variant: "destructive" });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('manage-user', {
        body: { action: 'delete', userId }
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
      toast({ title: "המשתמש נמחק לגמרי" });
    },
    onError: (error: any) => {
      toast({ title: "שגיאה במחיקת משתמש", description: error.message, variant: "destructive" });
    },
  });

  const updateUser = useMutation({
    mutationFn: async () => {
      if (!selectedUser) return;
      
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: editUserName,
          phone: editUserPhone || null,
        })
        .eq("user_id", selectedUser.user_id);
      
      if (profileError) throw profileError;

      // Update role if changed
      if (editUserRole) {
        await supabase.from("user_roles").delete().eq("user_id", selectedUser.user_id);
        
        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: selectedUser.user_id,
          role: editUserRole,
        });
        
        if (roleError) throw roleError;
      }

      // Update password if provided
      if (editUserPassword && editUserPassword.length >= 6) {
        const { data, error } = await supabase.functions.invoke('manage-user', {
          body: { action: 'updatePassword', userId: selectedUser.user_id, newPassword: editUserPassword }
        });
        if (error) throw error;
        if (!data.success) throw new Error(data.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
      setIsEditUserOpen(false);
      setSelectedUser(null);
      setEditUserPassword("");
      toast({ title: "המשתמש עודכן בהצלחה" });
    },
    onError: (error: any) => {
      toast({ title: "שגיאה בעדכון משתמש", description: error.message, variant: "destructive" });
    },
  });

  const addRequiredDoc = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("required_documents").insert({
        document_type: newDocType,
        for_type: newDocForType,
        is_required: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["required-documents"] });
      setNewDocType("");
      setIsAddDocOpen(false);
      toast({ title: "המסמך נוסף בהצלחה" });
    },
    onError: (error: any) => {
      toast({ title: "שגיאה בהוספת מסמך", description: error.message, variant: "destructive" });
    },
  });

  const deleteRequiredDoc = useMutation({
    mutationFn: async (docId: string) => {
      const { error } = await supabase.from("required_documents").delete().eq("id", docId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["required-documents"] });
      toast({ title: "המסמך נמחק" });
    },
  });

  const openEditUser = (user: any) => {
    setSelectedUser(user);
    setEditUserName(user.full_name);
    setEditUserPhone(user.phone || "");
    setEditUserRole(user.roles?.[0]?.role || "");
    setEditUserPassword("");
    setIsEditUserOpen(true);
  };

  const getUserRole = (roles: any[]) => {
    if (!roles?.length) return "לא מוגדר";
    const role = roles[0]?.role;
    switch (role) {
      case "admin": return "מנהל";
      case "venue_owner": return "בעל אולם";
      case "event_owner": return "בעל אירוע";
      default: return role;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Bar - Tabs */}
      <div className="flex items-center justify-between">
        <div></div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-6 py-2 rounded-full font-medium transition-colors flex items-center gap-2 ${
              activeTab === "users"
                ? "bg-[#1a2942] text-white"
                : "bg-white text-foreground hover:bg-gray-100"
            }`}
          >
            <Users className="w-4 h-4" />
            משתמשים
          </button>
          <button
            onClick={() => setActiveTab("api")}
            className={`px-6 py-2 rounded-full font-medium transition-colors flex items-center gap-2 ${
              activeTab === "api"
                ? "bg-[#1a2942] text-white"
                : "bg-white text-foreground hover:bg-gray-100"
            }`}
          >
            <Key className="w-4 h-4" />
            API
          </button>
          <button
            onClick={() => setActiveTab("partners")}
            className={`px-6 py-2 rounded-full font-medium transition-colors flex items-center gap-2 ${
              activeTab === "partners"
                ? "bg-[#1a2942] text-white"
                : "bg-white text-foreground hover:bg-gray-100"
            }`}
          >
            <Building2 className="w-4 h-4" />
            שותפים
          </button>
          <button
            onClick={() => setActiveTab("general")}
            className={`px-6 py-2 rounded-full font-medium transition-colors flex items-center gap-2 ${
              activeTab === "general"
                ? "bg-[#1a2942] text-white"
                : "bg-white text-foreground hover:bg-gray-100"
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            כלליות
          </button>
        </div>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden" hideCloseButton>
          <div className="bg-[#1a2942] text-white p-4 flex items-center justify-between">
            <button onClick={() => setIsEditUserOpen(false)} className="hover:opacity-80">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold">עריכת משתמש</h2>
            <Pencil className="w-5 h-5" />
          </div>
          <div className="bg-white p-6 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block text-center">שם מלא</Label>
                <Input variant="form" value={editUserName} onChange={(e) => setEditUserName(e.target.value)} className="text-center" />
              </div>
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block text-center">טלפון</Label>
                <Input variant="form" value={editUserPhone} onChange={(e) => setEditUserPhone(e.target.value)} className="text-center" />
              </div>
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block text-center">תפקיד</Label>
                <Select value={editUserRole} onValueChange={(val) => setEditUserRole(val as UserRole)}>
                  <SelectTrigger className="bg-[#f5f5f5] border-0 rounded-xl text-center">
                    <SelectValue placeholder="בחר תפקיד" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">מנהל</SelectItem>
                    <SelectItem value="venue_owner">בעל אולם</SelectItem>
                    <SelectItem value="event_owner">בעל אירוע</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block text-center">סיסמה חדשה (לא חובה)</Label>
                <Input 
                  variant="form" 
                  type="password" 
                  value={editUserPassword} 
                  onChange={(e) => setEditUserPassword(e.target.value)} 
                  placeholder="השאר ריק לשמירת הסיסמה הנוכחית"
                  className="text-center" 
                />
              </div>
              <div></div>
              <div></div>
            </div>
            <Button 
              onClick={() => updateUser.mutate()} 
              disabled={!editUserName || updateUser.isPending} 
              className="w-full bg-[#1a2942] hover:bg-[#243a56] text-white rounded-full py-6 text-lg font-medium flex items-center justify-center gap-2"
            >
              <span>←</span>
              {updateUser.isPending ? "שומר..." : "שמור שינויים"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add API Key Dialog */}
      <Dialog open={isAddApiKeyOpen} onOpenChange={setIsAddApiKeyOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden" hideCloseButton>
          <div className="bg-[#1a2942] text-white p-4 flex items-center justify-between">
            <button onClick={() => setIsAddApiKeyOpen(false)} className="hover:opacity-80">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold">הוספת מפתח API</h2>
            <Plus className="w-5 h-5" />
          </div>
          <div className="bg-white p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block text-center">שם המפתח</Label>
                <Input variant="form" value={newApiName} onChange={(e) => setNewApiName(e.target.value)} className="text-center" />
              </div>
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block text-center">מפתח API</Label>
                <Input variant="form" value={newApiKey} onChange={(e) => setNewApiKey(e.target.value)} className="text-center" />
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm mb-2 block text-center">שיוך לשותף (אופציונלי)</Label>
              <Select value={newApiKeyPartner || "none"} onValueChange={(v) => setNewApiKeyPartner(v === "none" ? "" : v)}>
                <SelectTrigger className="bg-[#f5f5f5] border-0 rounded-xl text-center">
                  <SelectValue placeholder="ללא שיוך — מפתח אדמין כללי" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ללא שיוך — מפתח אדמין כללי (רואה הכל)</SelectItem>
                  {partners?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                מפתח משויך לשותף רואה רק את האירועים והמשתמשים שהשותף יצר בעצמו.
              </p>
            </div>
            <Button
              onClick={() => addApiKey.mutate()}
              disabled={!newApiName || !newApiKey || addApiKey.isPending}
              className="w-full bg-[#1a2942] hover:bg-[#243a56] text-white rounded-full py-6 text-lg font-medium flex items-center justify-center gap-2"
            >
              <span>←</span>
              {addApiKey.isPending ? "מוסיף..." : "הוסף מפתח"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Document Dialog */}
      <Dialog open={isAddDocOpen} onOpenChange={setIsAddDocOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden" hideCloseButton>
          <div className="bg-[#1a2942] text-white p-4 flex items-center justify-between">
            <button onClick={() => setIsAddDocOpen(false)} className="hover:opacity-80">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold">הוספת מסמך חובה</h2>
            <Plus className="w-5 h-5" />
          </div>
          <div className="bg-white p-6 space-y-4">
            <div>
              <Label className="text-muted-foreground text-sm mb-2 block text-center">שם המסמך</Label>
              <Input variant="form" value={newDocType} onChange={(e) => setNewDocType(e.target.value)} className="text-center" />
            </div>
            <div>
              <Label className="text-muted-foreground text-sm mb-2 block text-center">סוג</Label>
              <Select value={newDocForType} onValueChange={(val) => setNewDocForType(val as "venue_owner" | "event_owner")}>
                <SelectTrigger className="bg-[#f5f5f5] border-0 rounded-xl text-center">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="venue_owner">בעלי אולמות</SelectItem>
                  <SelectItem value="event_owner">בעלי אירועים</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={() => addRequiredDoc.mutate()} 
              disabled={!newDocType || addRequiredDoc.isPending} 
              className="w-full bg-[#1a2942] hover:bg-[#243a56] text-white rounded-full py-6 text-lg font-medium flex items-center justify-center gap-2"
            >
              <span>←</span>
              הוסף מסמך
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* General Tab */}
      {activeTab === "general" && (
        <div className="space-y-6">
          {/* General Settings Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-6 text-right">הגדרות כלליות</h2>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block text-center">לוגו המערכת</Label>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-20 h-20 bg-[#f5f5f5] rounded-xl flex items-center justify-center">
                    {settings?.logo_url ? (
                      <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain rounded-xl" />
                    ) : (
                      <Upload className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <button className="text-sm text-[#1a2942] hover:underline">העלאת לוגו</button>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block text-center">סיסמת מנהל ראשי</Label>
                <Input variant="form" type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="••••••••" className="text-center" />
              </div>
              <div>
                <Label className="text-muted-foreground text-sm mb-2 block text-center">כתובת מייל מנהל</Label>
                <Input variant="form" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@example.com" className="text-center" />
              </div>
            </div>
            <div className="mt-6 flex justify-start">
              <Button 
                onClick={() => saveSettings.mutate()} 
                disabled={saveSettings.isPending}
                className="bg-[#1a2942] hover:bg-[#243a56] text-white rounded-full px-8 py-2 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saveSettings.isPending ? "שומר..." : "שמור הגדרות"}
              </Button>
            </div>
          </div>

          {/* Required Documents Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <button 
                onClick={() => setIsAddDocOpen(true)}
                className="w-10 h-10 rounded-full bg-[#1a2942] text-white flex items-center justify-center hover:bg-[#243a56] transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold">מסמכי חובה</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              {/* בעלי אולמות */}
              <div className="bg-[#dbeafe] rounded-2xl p-4">
                <h3 className="font-bold text-lg mb-4 text-right">בעלי אולמות</h3>
                <div className="space-y-2">
                  {requiredDocs?.filter(d => d.for_type === "venue_owner").map(doc => (
                    <div key={doc.id} className="bg-white rounded-xl p-3 flex items-center justify-between">
                      <button onClick={() => deleteRequiredDoc.mutate(doc.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{doc.document_type}</span>
                        <FileText className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                  {!requiredDocs?.filter(d => d.for_type === "venue_owner").length && (
                    <p className="text-center text-muted-foreground py-4">אין מסמכים</p>
                  )}
                </div>
              </div>

              {/* בעלי אירועים */}
              <div className="bg-[#dbeafe] rounded-2xl p-4">
                <h3 className="font-bold text-lg mb-4 text-right">בעלי אירועים</h3>
                <div className="space-y-2">
                  {requiredDocs?.filter(d => d.for_type === "event_owner").map(doc => (
                    <div key={doc.id} className="bg-white rounded-xl p-3 flex items-center justify-between">
                      <button onClick={() => deleteRequiredDoc.mutate(doc.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{doc.document_type}</span>
                        <FileText className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                  {!requiredDocs?.filter(d => d.for_type === "event_owner").length && (
                    <p className="text-center text-muted-foreground py-4">אין מסמכים</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Tab */}
      {activeTab === "api" && (
        <div className="space-y-6">
          {/* Add button */}
          <div className="flex justify-start">
            <button 
              onClick={() => setIsAddApiKeyOpen(true)}
              className="w-10 h-10 rounded-full bg-[#1a2942] text-white flex items-center justify-center hover:bg-[#243a56] transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-[1fr_2fr_1fr_auto] gap-4 px-6 py-3 text-sm font-medium text-muted-foreground text-center">
            <span>שם</span>
            <span>מפתח</span>
            <span>סטטוס</span>
            <span className="w-10"></span>
          </div>

          {/* API Keys Rows */}
          <div className="space-y-3">
            {apiKeys?.map((key) => (
              <div
                key={key.id}
                className="grid grid-cols-[1fr_2fr_1fr_auto] gap-4 items-center bg-white rounded-2xl px-6 py-5 shadow-sm"
              >
                <span className="text-center font-bold">{key.name}</span>
                <span className="text-center font-mono text-sm">{key.key_hash?.slice(0, 30)}...</span>
                <span className="text-center">
                  {key.is_active ? (
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">פעיל</span>
                  ) : (
                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">לא פעיל</span>
                  )}
                </span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>מחיקת מפתח API</AlertDialogTitle>
                      <AlertDialogDescription>
                        האם אתה בטוח שברצונך למחוק את המפתח "{key.name}"? פעולה זו בלתי הפיכה וכל אינטגרציה שמשתמשת במפתח זה תפסיק לעבוד מיידית.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row-reverse gap-2">
                      <AlertDialogCancel>ביטול</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteApiKey.mutate(key.id)}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        מחק מפתח
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
            {!apiKeys?.length && (
              <div className="text-center py-12 text-muted-foreground bg-white rounded-2xl">
                לא נמצאו מפתחות API
              </div>
            )}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="space-y-6">
          {/* Table Header */}
          <div className="grid grid-cols-[auto_1fr_1fr_1.5fr_1fr_auto] gap-4 px-6 py-3 text-sm font-medium text-muted-foreground text-center">
            <span className="w-10"></span>
            <span>שם</span>
            <span>טלפון</span>
            <span>מייל</span>
            <span>תפקיד</span>
            <span className="w-10"></span>
          </div>

          {/* Users Rows */}
          <div className="space-y-3">
            {users?.map((user) => (
              <div
                key={user.id}
                className="grid grid-cols-[auto_1fr_1fr_1.5fr_1fr_auto] gap-4 items-center bg-white rounded-2xl px-6 py-5 shadow-sm"
              >
                <button
                  onClick={() => openEditUser(user)}
                  className="w-10 h-10 rounded-full bg-[#1a2942] text-white flex items-center justify-center hover:bg-[#243a56] transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <span className="text-center font-bold">{user.full_name}</span>
                <span className="text-center font-bold">{user.phone || "—"}</span>
                <span className="text-center font-bold">{user.email}</span>
                <span className="text-center font-bold text-[#1a2942]">{getUserRole(user.roles)}</span>
                <button
                  onClick={() => deleteUser.mutate(user.user_id)}
                  className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {!users?.length && (
              <div className="text-center py-12 text-muted-foreground bg-white rounded-2xl">
                לא נמצאו משתמשים
              </div>
            )}
          </div>
        </div>
      )}

      {/* Partners Tab */}
      {activeTab === "partners" && (
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="max-w-2xl space-y-2">
              <p className="text-sm text-muted-foreground">
                שותף = מערכת חיצונית (למשל ספק אישורי הגעה) שיוצרת אצלך אירועים דרך ה-API.
                לכל שותף — webhook URL מאובטח (HMAC-SHA256), מפתחות API ייעודיים, וגישה רק לאירועים שהוא יצר.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="/docs/partner-api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-[#95742F] hover:underline font-medium"
                >
                  📄 מסמך API לשותפים
                  <span className="text-xs text-muted-foreground ltr">/docs/partner-api</span>
                </a>
                <a
                  href="/docs/partner-api-explorer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-[#95742F] hover:underline font-medium"
                >
                  ▶️ Swagger אינטראקטיבי
                  <span className="text-xs text-muted-foreground ltr">/docs/partner-api-explorer</span>
                </a>
              </div>
            </div>
            <button
              onClick={() => setIsAddPartnerOpen(true)}
              className="w-10 h-10 rounded-full bg-[#1a2942] text-white flex items-center justify-center hover:bg-[#243a56] transition-colors flex-shrink-0"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>


          <div className="grid grid-cols-[1fr_2fr_1.5fr_1fr_auto] gap-4 px-6 py-3 text-sm font-medium text-muted-foreground text-center">
            <span>שם השותף</span>
            <span>Webhook URL</span>
            <span>אירועים</span>
            <span>סטטוס</span>
            <span className="w-10"></span>
          </div>

          <div className="space-y-3">
            {partners?.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-[1fr_2fr_1.5fr_1fr_auto] gap-4 items-center bg-white rounded-2xl px-6 py-5 shadow-sm"
              >
                <div className="text-center">
                  <div className="font-bold">{p.name}</div>
                  {p.contact_email && (
                    <div className="text-xs text-muted-foreground">{p.contact_email}</div>
                  )}
                </div>
                <span className="text-center font-mono text-xs break-all">
                  {p.webhook_url || <span className="text-muted-foreground">—</span>}
                </span>
                <span className="text-center text-xs">
                  {(p.webhook_events ?? []).join(", ") || <span className="text-muted-foreground">—</span>}
                </span>
                <span className="text-center">
                  {p.is_active ? (
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">פעיל</span>
                  ) : (
                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">מושבת</span>
                  )}
                </span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>מחיקת שותף</AlertDialogTitle>
                      <AlertDialogDescription>
                        מחיקת "{p.name}" תמחק גם את כל המפתחות שלו ותוריד לו את האפשרות לגשת. אירועים שכבר יצר נשארים אצלך.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row-reverse gap-2">
                      <AlertDialogCancel>ביטול</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deletePartner.mutate(p.id)}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        מחק שותף
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
            {!partners?.length && (
              <div className="text-center py-12 text-muted-foreground bg-white rounded-2xl">
                אין שותפים. לחץ על + כדי להוסיף את הראשון.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Partner Dialog */}
      <Dialog open={isAddPartnerOpen} onOpenChange={setIsAddPartnerOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden" hideCloseButton>
          <div className="bg-[#1a2942] text-white p-4 flex items-center justify-between">
            <button onClick={() => setIsAddPartnerOpen(false)} className="hover:opacity-80">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold">הוספת שותף חדש</h2>
            <Building2 className="w-5 h-5" />
          </div>
          <div className="bg-white p-6 space-y-4">
            <div>
              <Label className="text-muted-foreground text-sm mb-2 block">שם השותף *</Label>
              <Input value={newPartnerName} onChange={(e) => setNewPartnerName(e.target.value)} placeholder="חברת XYZ אישורי הגעה" />
            </div>
            <div>
              <Label className="text-muted-foreground text-sm mb-2 block">אימייל איש קשר</Label>
              <Input value={newPartnerEmail} onChange={(e) => setNewPartnerEmail(e.target.value)} placeholder="contact@partner.com" />
            </div>
            <div>
              <Label className="text-muted-foreground text-sm mb-2 block">Webhook URL (אופציונלי)</Label>
              <Input value={newPartnerWebhookUrl} onChange={(e) => setNewPartnerWebhookUrl(e.target.value)} placeholder="https://partner.com/webhooks/giftkal" className="ltr text-left" dir="ltr" />
              <p className="text-xs text-muted-foreground mt-1">
                URL שיקבל הודעות. נחתום על ה-payload עם HMAC-SHA256 בכותרת <code>X-Giftkal-Signature</code>.
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm mb-2 block">אירועים לקבלה</Label>
              <div className="border rounded-lg p-3 space-y-2 bg-slate-50">
                {[
                  { id: "sale-paid", label: "תשלום התקבל (sale-paid)" },
                  { id: "sale-failure", label: "תשלום נכשל (sale-failure)" },
                  { id: "refund", label: "החזר (refund)" },
                  { id: "chargeback", label: "Chargeback (chargeback)" },
                  { id: "payment-account-approved", label: "חשבון סליקה אושר (payment-account-approved)" },
                  { id: "withdrawal-complete", label: "משיכה הושלמה (withdrawal-complete)" },
                ].map((ev) => (
                  <label key={ev.id} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={newPartnerEvents.includes(ev.id)}
                      onChange={(e) => {
                        setNewPartnerEvents((prev) =>
                          e.target.checked ? [...prev, ev.id] : prev.filter((x) => x !== ev.id)
                        );
                      }}
                      className="w-4 h-4"
                    />
                    <span>{ev.label}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                השותף יקבל POST חתום ב-HMAC-SHA256 (כותרת <code>X-Giftkal-Signature</code>) עבור כל אירוע שסומן. ה-secret ייווצר אוטומטית ויוצג לך פעם אחת בסיום.
              </p>
            </div>
            <Button
              onClick={() => addPartner.mutate()}
              disabled={!newPartnerName || addPartner.isPending}
              className="w-full bg-[#1a2942] hover:bg-[#243a56] text-white"
            >
              {addPartner.isPending ? "יוצר..." : "צור שותף + secret"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reveal Webhook Secret Modal — shown ONCE after partner creation */}
      <AlertDialog open={!!revealedSecret} onOpenChange={(open) => !open && setRevealedSecret(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>סוד ה-Webhook נוצר</AlertDialogTitle>
            <AlertDialogDescription>
              העתק את הסוד עכשיו והעבר לשותף בערוץ מאובטח. הסוד <strong>לא יוצג שוב</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {revealedSecret && (
            <div className="bg-gray-100 rounded-lg p-4 my-4">
              <div className="font-mono text-xs break-all">{revealedSecret.secret}</div>
              <Button
                size="sm"
                variant="outline"
                className="mt-2 gap-2"
                onClick={() => {
                  navigator.clipboard.writeText(revealedSecret.secret);
                  setCopiedSecret(true);
                  setTimeout(() => setCopiedSecret(false), 2000);
                }}
              >
                {copiedSecret ? <><Check className="w-3 h-3" /> הועתק</> : <><Copy className="w-3 h-3" /> העתק</>}
              </Button>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setRevealedSecret(null)}>שמרתי את הסוד</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
