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
  Settings as SettingsIcon,
  Key,
  Users,
  Plus,
  Trash2,
  Pencil,
  Save,
  Upload,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const saveSettings = useMutation({
    mutationFn: async () => {
      // Update or insert settings
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
  });

  const addApiKey = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("api_keys").insert({
        name: newApiName,
        key_hash: newApiKey, // In production, hash this!
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      setNewApiName("");
      setNewApiKey("");
      toast({ title: "מפתח API נוסף בהצלחה" });
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
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      // Delete user role and profile (cascade will handle auth.users)
      const { error } = await supabase.from("profiles").delete().eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
      toast({ title: "המשתמש נמחק" });
    },
  });

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
      <div>
        <h1 className="text-3xl font-bold">הגדרות</h1>
        <p className="text-muted-foreground mt-1">ניהול הגדרות המערכת</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="general" className="gap-2">
            <SettingsIcon className="w-4 h-4" />
            כלליות
          </TabsTrigger>
          <TabsTrigger value="api" className="gap-2">
            <Key className="w-4 h-4" />
            API
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            משתמשים
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>הגדרות כלליות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>כתובת מייל מנהל</Label>
                  <Input
                    value={adminEmail || settings?.admin_email || ""}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@example.com"
                  />
                </div>
                <div>
                  <Label>סיסמת מנהל ראשי</Label>
                  <Input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div>
                <Label>לוגו המערכת</Label>
                <div className="mt-2 flex items-center gap-4">
                  <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                    {settings?.logo_url ? (
                      <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain rounded-lg" />
                    ) : (
                      <Upload className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <Button variant="outline">
                    <Upload className="w-4 h-4 ml-2" />
                    העלאת לוגו
                  </Button>
                </div>
              </div>
              <Button onClick={() => saveSettings.mutate()}>
                <Save className="w-4 h-4 ml-2" />
                שמור הגדרות
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>מסמכי חובה</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="font-semibold">בעלי אולמות</Label>
                  <div className="mt-2 space-y-2">
                    {requiredDocs?.filter(d => d.for_type === "venue_owner").map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                        <span>{doc.document_type}</span>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 ml-2" />
                      הוסף מסמך
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="font-semibold">בעלי אירועים</Label>
                  <div className="mt-2 space-y-2">
                    {requiredDocs?.filter(d => d.for_type === "event_owner").map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                        <span>{doc.document_type}</span>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 ml-2" />
                      הוסף מסמך
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>מפתחות API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="שם המפתח"
                  value={newApiName}
                  onChange={(e) => setNewApiName(e.target.value)}
                />
                <Input
                  placeholder="מפתח API"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                />
                <Button onClick={() => addApiKey.mutate()} disabled={!newApiName || !newApiKey}>
                  <Plus className="w-4 h-4 ml-2" />
                  הוסף
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>שם</TableHead>
                    <TableHead>מפתח</TableHead>
                    <TableHead>סטטוס</TableHead>
                    <TableHead>פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys?.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.name}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {key.key_hash?.slice(0, 20)}...
                      </TableCell>
                      <TableCell>
                        {key.is_active ? (
                          <span className="badge-success px-2 py-1 rounded text-xs">פעיל</span>
                        ) : (
                          <span className="badge-error px-2 py-1 rounded text-xs">לא פעיל</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteApiKey.mutate(key.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!apiKeys?.length && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        לא נמצאו מפתחות API
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>ניהול משתמשים</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>שם</TableHead>
                    <TableHead>מייל</TableHead>
                    <TableHead>סוג</TableHead>
                    <TableHead>פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>לא מוגדר</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteUser.mutate(user.user_id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!users?.length && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        לא נמצאו משתמשים
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
