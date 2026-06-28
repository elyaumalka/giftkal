import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, User, X, Upload, Loader2, FileCheck, Send, Eye, AlertCircle, Trash2, Wallet, ArrowDownToLine } from "lucide-react";
import { formatILS } from "@/lib/fees";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { DialogClose } from "@radix-ui/react-dialog";

interface EventDetailsDialogProps {
  event: any;
  onClose: () => void;
}

export function EventDetailsDialog({ event, onClose }: EventDetailsDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newDocName, setNewDocName] = useState("");
  const [newDocRequired, setNewDocRequired] = useState("true");
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [newDeviceSerial, setNewDeviceSerial] = useState("");
  const [localPaymentCompleted, setLocalPaymentCompleted] = useState(event.payment_completed);
  const [localDeviceReturned, setLocalDeviceReturned] = useState(event.device_returned);
  const [localBudgetEnabled, setLocalBudgetEnabled] = useState(event.budget_enabled ?? false);
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [approvingKyc, setApprovingKyc] = useState(false);
  const [rejectingKyc, setRejectingKyc] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [approvingSeller, setApprovingSeller] = useState(false);
  const [hfApiKeyInput, setHfApiKeyInput] = useState(event.hf_api_key || "");
  // Phase C wallet ops state
  const [sweepAmount, setSweepAmount] = useState("");
  const [sweepNote, setSweepNote] = useState("");
  const [sweepingCommission, setSweepingCommission] = useState(false);
  const [withdrawingBalance, setWithdrawingBalance] = useState(false);

  /**
   * Pull the wallet totals for this event:
   *   - sum of fee_amount on completed transactions = total commission collected
   *   - sum of amount on completed/submitted transfers = commission swept so far
   *   - pending = collected - swept
   * Also surface recent transfers + payouts as a short log.
   */
  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ['event-wallet', event.id],
    enabled: Boolean(event.seller_payme_id && event.payment_setup_status === 'approved'),
    queryFn: async () => {
      const [txRes, transfersRes, payoutsRes] = await Promise.all([
        supabase
          .from('transactions')
          .select('amount, gift_amount, fee_amount, payment_status')
          .eq('event_id', event.id)
          .eq('payment_status', 'completed'),
        supabase
          .from('platform_commission_transfers')
          .select('id, amount, status, submitted_at, completed_at')
          .eq('event_id', event.id)
          .order('submitted_at', { ascending: false }),
        supabase
          .from('payouts')
          .select('id, amount, status, submitted_at, completed_at')
          .eq('event_id', event.id)
          .order('submitted_at', { ascending: false }),
      ]);

      const completedTx = txRes.data ?? [];
      const transfers = transfersRes.data ?? [];
      const payouts = payoutsRes.data ?? [];

      // Defensive: rows pre-dating gross-up have fee_amount = NULL.
      const collected = completedTx.reduce(
        (sum, t: any) => sum + (Number(t.fee_amount) || 0),
        0,
      );
      // Only count transfers that aren't cancelled/failed toward "swept so far".
      const swept = transfers
        .filter((t: any) => t.status === 'completed' || t.status === 'submitted')
        .reduce((sum, t: any) => sum + (Number(t.amount) || 0), 0);
      const pending = Math.max(0, +(collected - swept).toFixed(2));

      const grossGifts = completedTx.reduce(
        (sum, t: any) => sum + (Number(t.gift_amount) || Number(t.amount) || 0),
        0,
      );
      const grossCharged = completedTx.reduce(
        (sum, t: any) => sum + (Number(t.amount) || 0),
        0,
      );

      return { collected, swept, pending, grossGifts, grossCharged, transfers, payouts };
    },
  });

  // Auto-fill the sweep amount with the pending commission whenever the wallet
  // data refreshes — unless the admin has already typed something custom.
  if (walletData && !sweepAmount && walletData.pending > 0) {
    // Defer to next tick to avoid React warning about setState during render.
    queueMicrotask(() => setSweepAmount(String(walletData.pending)));
  }

  const sweepCommission = async () => {
    const amount = Number(sweepAmount);
    if (!amount || amount <= 0) {
      toast({ title: "סכום לא תקין", description: "הזן סכום חיובי להעברה", variant: "destructive" });
      return;
    }
    setSweepingCommission(true);
    try {
      const { data, error } = await supabase.functions.invoke('payme-generate-transfer', {
        body: { eventId: event.id, amount, productName: sweepNote || undefined },
      });
      if (error) throw new Error(error.message || 'שגיאה');
      if (!data?.success) throw new Error(data?.error || data?.details || 'שגיאה');
      toast({ title: `הועברו ${formatILS(amount)} לארנק giftkal ✅` });
      setSweepAmount("");
      setSweepNote("");
      queryClient.invalidateQueries({ queryKey: ['event-owners'] });
      queryClient.invalidateQueries({ queryKey: ['event-wallet', event.id] });
    } catch (err: any) {
      toast({ title: "שגיאה בהעברה", description: err.message, variant: "destructive" });
    } finally {
      setSweepingCommission(false);
    }
  };

  const triggerWithdrawal = async () => {
    if (!confirm('האם להעביר את היתרה לחשבון הבנק של בעל האירוע?')) return;
    setWithdrawingBalance(true);
    try {
      const { data, error } = await supabase.functions.invoke('payme-withdraw-balance', {
        body: { eventId: event.id },
      });
      if (error) throw new Error(error.message || 'שגיאה');
      if (!data?.success) throw new Error(data?.error || data?.details || 'שגיאה');
      toast({
        title: "בקשת המשיכה נשלחה ל-PayMe ✅",
        description: data?.message || "הכסף יועבר תוך ימי עסקים",
      });
      queryClient.invalidateQueries({ queryKey: ['event-owners'] });
      queryClient.invalidateQueries({ queryKey: ['event-wallet', event.id] });
    } catch (err: any) {
      toast({ title: "שגיאה במשיכה", description: err.message, variant: "destructive" });
    } finally {
      setWithdrawingBalance(false);
    }
  };
  const [savingHfKey, setSavingHfKey] = useState(false);

  const saveHfApiKey = async () => {
    setSavingHfKey(true);
    try {
      const { error } = await supabase
        .from("events")
        .update({ hf_api_key: hfApiKeyInput.trim() || null })
        .eq("id", event.id);
      if (error) throw error;
      toast({ title: "מפתח Hosted Fields נשמר בהצלחה ✅" });
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
    } catch (err: any) {
      toast({ title: "שגיאה בשמירה", description: err.message, variant: "destructive" });
    } finally {
      setSavingHfKey(false);
    }
  };
  
  // Fetch owner profile
  const { data: ownerProfile } = useQuery({
    queryKey: ["event-owner-profile", event.owner_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", event.owner_id)
        .single();
      return data;
    },
    enabled: !!event.owner_id,
  });

  // Fetch required documents for this event
  const { data: requiredDocs, refetch: refetchDocs } = useQuery({
    queryKey: ["required-documents-event"],
    queryFn: async () => {
      const { data } = await supabase
        .from("required_documents")
        .select("*")
        .eq("for_type", "event_owner")
        .order("created_at", { ascending: true });
      return data || [];
    },
  });

  // Fetch uploaded documents for this event
  const { data: uploadedDocs } = useQuery({
    queryKey: ["event-documents", event.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("documents")
        .select("*")
        .eq("event_id", event.id);
      return data || [];
    },
  });

  // Fetch devices linked to the venue
  const { data: devices, refetch: refetchDevices } = useQuery({
    queryKey: ["venue-devices", event.venue_id],
    queryFn: async () => {
      if (!event.venue_id) return [];
      const { data } = await supabase
        .from("devices")
        .select("*")
        .eq("venue_id", event.venue_id);
      return data || [];
    },
    enabled: !!event.venue_id,
  });

  // Add required document
  const addRequiredDoc = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("required_documents").insert({
        document_type: newDocName,
        for_type: "event_owner",
        is_required: newDocRequired === "true",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      refetchDocs();
      queryClient.invalidateQueries({ queryKey: ["events-list"] });
      setNewDocName("");
      toast({ title: "מסמך נדרש נוסף בהצלחה" });
    },
    onError: (error: any) => {
      toast({ title: "שגיאה בהוספת מסמך", description: error.message, variant: "destructive" });
    },
  });

  // Delete required document
  const deleteRequiredDoc = useMutation({
    mutationFn: async (docId: string) => {
      const { error } = await supabase.from("required_documents").delete().eq("id", docId);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchDocs();
      queryClient.invalidateQueries({ queryKey: ["events-list"] });
      toast({ title: "מסמך נדרש נמחק" });
    },
  });

  // Add device
  const addDevice = useMutation({
    mutationFn: async () => {
      if (!event.venue_id) throw new Error("אין אולם מקושר לאירוע");
      const { error } = await supabase.from("devices").insert({
        name: newDeviceName,
        serial_number: newDeviceSerial,
        venue_id: event.venue_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      refetchDevices();
      setNewDeviceName("");
      setNewDeviceSerial("");
      setIsAddDeviceOpen(false);
      toast({ title: "מכשיר נוסף בהצלחה" });
    },
    onError: (error: any) => {
      toast({ title: "שגיאה בהוספת מכשיר", description: error.message, variant: "destructive" });
    },
  });

  // Toggle payment status
  const togglePayment = useMutation({
    mutationFn: async () => {
      const newStatus = !localPaymentCompleted;
      const { error } = await supabase
        .from("events")
        .update({ payment_completed: newStatus })
        .eq("id", event.id);
      if (error) throw error;
      return newStatus;
    },
    onSuccess: (newStatus) => {
      setLocalPaymentCompleted(newStatus);
      queryClient.invalidateQueries({ queryKey: ["events-list"] });
      toast({ title: newStatus ? "סומן כשולם" : "סומן כלא שולם" });
    },
  });

  // Toggle device returned
  const toggleDeviceReturned = useMutation({
    mutationFn: async () => {
      const newStatus = !localDeviceReturned;
      const { error } = await supabase
        .from("events")
        .update({ device_returned: newStatus })
        .eq("id", event.id);
      if (error) throw error;
      return newStatus;
    },
    onSuccess: (newStatus) => {
      setLocalDeviceReturned(newStatus);
      queryClient.invalidateQueries({ queryKey: ["events-list"] });
      toast({ title: newStatus ? "סומן כהוחזר" : "סומן כלא הוחזר" });
    },
  });

  // Toggle budget enabled
  const toggleBudget = useMutation({
    mutationFn: async () => {
      const newStatus = !localBudgetEnabled;
      const { error } = await supabase
        .from("events")
        .update({ budget_enabled: newStatus })
        .eq("id", event.id);
      if (error) throw error;
      return newStatus;
    },
    onSuccess: (newStatus) => {
      setLocalBudgetEnabled(newStatus);
      queryClient.invalidateQueries({ queryKey: ["events-list"] });
      toast({ title: newStatus ? "ניהול תקציב הופעל" : "ניהול תקציב כובה" });
    },
  });

  const handleFileUpload = async (file: File, docType: string) => {
    setUploadingDocType(docType);
    try {
      // Sanitize filename - remove Hebrew chars
      const ext = file.name.split('.').pop() || 'pdf';
      const sanitizedName = `${event.id}/${docType.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(sanitizedName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(sanitizedName);

      const { data: { user } } = await supabase.auth.getUser();

      const { error: dbError } = await supabase.from('documents').insert({
        event_id: event.id,
        user_id: user?.id || event.owner_id,
        document_type: docType,
        file_name: file.name,
        file_url: urlData.publicUrl,
      });

      if (dbError) throw dbError;

      queryClient.invalidateQueries({ queryKey: ["event-documents", event.id] });
      queryClient.invalidateQueries({ queryKey: ["events-list"] });
      toast({ title: "המסמך הועלה בהצלחה" });
    } catch (error: any) {
      toast({ title: "שגיאה בהעלאת מסמך", description: error.message, variant: "destructive" });
    } finally {
      setUploadingDocType(null);
    }
  };

  const uploadedDocTypes = uploadedDocs?.map((d: any) => d.document_type) || [];

  const setupData = event.payment_setup_data as any;
  const hasSocialIdFile = !!setupData?.socialIdFile;
  const hasBankApprovalFile = !!setupData?.bankApprovalFile;
  const hasAnyKycFile = hasSocialIdFile || hasBankApprovalFile;
  const kycStatus = event.kyc_docs_status;

  const handleApproveKyc = async () => {
    setApprovingKyc(true);
    try {
      if (!event.seller_payme_id) {
        toast({ title: "שגיאה", description: "אין חשבון סליקה פעיל לאירוע זה", variant: "destructive" });
        return;
      }

      const filesToUpload: Array<{ base64: string; name: string; mimeType: string; type: number }> = [];
      if (setupData?.socialIdFile?.base64) {
        filesToUpload.push({ ...setupData.socialIdFile, type: 1 });
      }
      if (setupData?.bankApprovalFile?.base64) {
        filesToUpload.push({ ...setupData.bankApprovalFile, type: 2 });
      }

      if (filesToUpload.length === 0) {
        toast({ title: "שגיאה", description: "אין מסמכים לשליחה", variant: "destructive" });
        return;
      }

      const { data, error } = await supabase.functions.invoke('payme-upload-seller-files', {
        body: {
          seller_payme_id: event.seller_payme_id,
          files: filesToUpload,
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Upload failed');

      // Update kyc status and clear files from setup data
      const cleanedSetupData = { ...setupData };
      delete cleanedSetupData.socialIdFile;
      delete cleanedSetupData.bankApprovalFile;

      await supabase.from('events').update({
        kyc_docs_status: 'approved',
        payment_setup_data: cleanedSetupData,
      }).eq('id', event.id);

      queryClient.invalidateQueries({ queryKey: ["events-list"] });
      queryClient.invalidateQueries({ queryKey: ["event-payme", event.id] });
      toast({ title: "המסמכים נשלחו בהצלחה ל-PayMe ✅" });
    } catch (error: any) {
      toast({ title: "שגיאה בשליחת המסמכים", description: error.message, variant: "destructive" });
    } finally {
      setApprovingKyc(false);
    }
  };

  const handleApproveSeller = async () => {
    setApprovingSeller(true);
    try {
      if (!setupData) throw new Error('אין נתוני הקמה');
      const response = await supabase.functions.invoke('payme-create-seller', {
        body: { eventId: event.id, ...setupData, gender: 0 },
      });
      if (response.error) throw new Error(response.error.message);
      if (!response.data?.success) throw new Error(response.data?.error || 'שגיאה');
      await supabase.from('events').update({ payment_setup_status: 'approved' } as any).eq('id', event.id);
      queryClient.invalidateQueries({ queryKey: ['event-owners'] });
      queryClient.invalidateQueries({ queryKey: ['events-list'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approval-count'] });
      toast({ title: "חשבון סליקה הוקם בהצלחה ב-PayMe ✅" });
      onClose();
    } catch (err: any) {
      toast({ title: "שגיאה ביצירת חשבון סליקה", description: err.message, variant: "destructive" });
    } finally {
      setApprovingSeller(false);
    }
  };

  const handleRejectSeller = async () => {
    try {
      await supabase.from('events').update({ payment_setup_status: 'rejected' } as any).eq('id', event.id);
      queryClient.invalidateQueries({ queryKey: ['event-owners'] });
      queryClient.invalidateQueries({ queryKey: ['events-list'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approval-count'] });
      toast({ title: "הבקשה נדחתה" });
      onClose();
    } catch (err: any) {
      toast({ title: "שגיאה", description: err.message, variant: "destructive" });
    }
  };

  const BANKS: Record<string, string> = {
    '4': 'בנק יהב', '9': 'בנק הדואר', '10': 'בנק לאומי', '11': 'בנק דיסקונט',
    '12': 'בנק הפועלים', '13': 'בנק אגוד', '14': 'בנק אוצר החייל', '17': 'מרכנתיל דיסקונט',
    '20': 'בנק מזרחי טפחות', '31': 'בנק הבינלאומי', '46': 'בנק מסד', '52': 'פועלי אגודת ישראל', '54': 'בנק ירושלים',
  };
  const isPendingSellerApproval = event.payment_setup_status === 'pending_approval' && !event.seller_payme_id && setupData;

  return (
    <div className="flex flex-col max-h-[85vh]" dir="rtl">
      {/* Header - Title on RIGHT, buttons on LEFT */}
      <div className="bg-secondary text-white p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">פרטי לקוח</h2>
        <div className="flex items-center gap-3">
          {/* Budget Toggle Button */}
          <Button
            onClick={() => toggleBudget.mutate()}
            className={`${
              localBudgetEnabled 
                ? "bg-purple-500 hover:bg-purple-600" 
                : "bg-gray-500 hover:bg-gray-600"
            } text-white rounded-full px-6`}
            disabled={toggleBudget.isPending}
          >
            {localBudgetEnabled ? "תקציב פעיל" : "הפעל תקציב"}
          </Button>

          {/* Payment Toggle Button */}
          <Button
            onClick={() => togglePayment.mutate()}
            className={`${
              localPaymentCompleted 
                ? "bg-blue-500 hover:bg-blue-600" 
                : "bg-green-500 hover:bg-green-600"
            } text-white rounded-full px-6`}
            disabled={togglePayment.isPending}
          >
            {localPaymentCompleted ? "שולם" : "סמן כשולם"}
          </Button>
          
          {/* Add Device Button */}
          <Dialog open={isAddDeviceOpen} onOpenChange={setIsAddDeviceOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-secondary border border-white text-white hover:bg-white/10 rounded-full px-6"
              >
                הוספת מכשיר
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>הוספת מכשיר חדש</DialogTitle>
              </DialogHeader>
              <div className="p-6 space-y-4">
                <div>
                  <Label className="text-muted-foreground text-sm mb-2 block">שם המכשיר</Label>
                  <Input 
                    variant="form" 
                    value={newDeviceName} 
                    onChange={(e) => setNewDeviceName(e.target.value)}
                    placeholder="טאבלט גלאקסי S10"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm mb-2 block">מספר סריאלי</Label>
                  <Input 
                    variant="form" 
                    value={newDeviceSerial} 
                    onChange={(e) => setNewDeviceSerial(e.target.value)}
                    placeholder="1234567890"
                  />
                </div>
                <Button 
                  onClick={() => addDevice.mutate()} 
                  disabled={!newDeviceName || !newDeviceSerial || addDevice.isPending}
                  className="w-full rounded-full bg-secondary hover:bg-secondary/90"
                >
                  {addDevice.isPending ? "מוסיף..." : "הוסף מכשיר"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </DialogClose>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 overflow-y-auto bg-background">
        {/* Customer Info Row - gray background */}
        <div className="bg-muted rounded-2xl p-4 flex items-center gap-6 mb-6">
          {/* Avatar */}
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0 border">
            <User className="w-6 h-6 text-secondary" />
          </div>
          
          {/* Info fields from right to left */}
          <div className="text-right">
            <p className="text-xs text-muted-foreground">שם הלקוח</p>
            <p className="font-semibold text-secondary text-sm">{ownerProfile?.full_name || event.ownerName || "—"}</p>
          </div>
          
          <div className="text-right">
            <p className="text-xs text-muted-foreground">טלפון</p>
            <p className="font-medium text-secondary text-sm">{ownerProfile?.phone || "—"}</p>
          </div>
          
          <div className="text-right">
            <p className="text-xs text-muted-foreground">כתובת מייל</p>
            <p className="font-medium text-secondary text-sm">{ownerProfile?.email || "—"}</p>
          </div>
          
          <div className="text-right">
            <p className="text-xs text-muted-foreground">שם האולם</p>
            <p className="font-medium text-secondary text-sm">{event.venues?.name || "—"}</p>
          </div>
          
          <div className="text-right">
            <p className="text-xs text-muted-foreground">כתובת האולם</p>
            <p className="font-medium text-secondary text-sm">{event.venues?.address || "—"}</p>
          </div>
          
          <div className="text-right">
            <p className="text-xs text-muted-foreground">תאריך אירוע</p>
            <p className="font-medium text-secondary text-sm">{new Date(event.event_date).toLocaleDateString("he-IL")}</p>
          </div>
        </div>

        {/* Main Content Grid - RIGHT: devices, LEFT: documents */}
        <div className="grid grid-cols-2 gap-6">
          {/* RIGHT Column - Devices */}
          <div className="space-y-4">
            {/* Devices Header - title RIGHT, count LEFT */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-secondary">מכשירים מקושרים</h3>
              <span className="text-2xl font-bold text-secondary">{devices?.length || 0}</span>
            </div>

            {/* Device Cards */}
            <div className="grid grid-cols-2 gap-3">
              {devices?.map((device: any) => (
                <div
                  key={device.id}
                  className="bg-white rounded-xl p-4 flex flex-col items-center gap-2 border shadow-sm"
                >
                  <p className="text-sm font-semibold text-secondary">{device.name}</p>
                  <p className="text-xs text-muted-foreground">סריאלי: {device.serial_number}</p>
                  <Button
                    size="sm"
                    className={`w-full rounded-lg text-xs ${
                      localDeviceReturned
                        ? "bg-yellow-500 hover:bg-yellow-600"
                        : "bg-green-500 hover:bg-green-600"
                    } text-white`}
                    onClick={() => toggleDeviceReturned.mutate()}
                  >
                    {localDeviceReturned ? "הוחזר" : "סמן כהוחזר"}
                  </Button>
                </div>
              ))}
              {!devices?.length && (
                <div className="col-span-2 text-center text-muted-foreground py-4">
                  אין מכשירים מקושרים
                </div>
              )}
            </div>

            {/* Rental Cost Card - dark blue */}
            <div className="bg-secondary rounded-2xl p-6 flex items-center justify-between mt-4">
              <p className="text-2xl font-bold text-white">₪ {event.device_rental_cost?.toLocaleString() || 0}</p>
              <h3 className="text-lg font-semibold text-white">עלות השכרה</h3>
            </div>
          </div>

          {/* LEFT Column - Documents */}
          <div className="space-y-4">
            {/* Add Document Row - name first, then required/not, then + button */}
            <div className="flex items-center gap-3">
              <Input
                placeholder="שם המסמך"
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
                className="h-10 rounded-xl bg-white border text-right flex-1"
              />
              <Select value={newDocRequired} onValueChange={setNewDocRequired}>
                <SelectTrigger className="w-32 h-10 rounded-xl bg-white border text-right">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">חובה</SelectItem>
                  <SelectItem value="false">לא חובה</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="icon"
                className="rounded-full bg-white hover:bg-muted text-secondary shrink-0 border shadow-sm"
                onClick={() => newDocName && addRequiredDoc.mutate()}
                disabled={!newDocName || addRequiredDoc.isPending}
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>

            {/* Required Documents Grid - 3 columns */}
            <div className="grid grid-cols-3 gap-3">
              {requiredDocs?.map((doc: any) => {
                const isUploaded = uploadedDocTypes.includes(doc.document_type);
                const uploadedDoc = uploadedDocs?.find((d: any) => d.document_type === doc.document_type);
                
                return (
                  <div
                    key={doc.id}
                    className="bg-white rounded-xl p-4 flex flex-col items-center gap-2 border shadow-sm min-h-[120px]"
                  >
                    <p className="text-sm font-medium text-secondary text-center">{doc.document_type}</p>
                    {isUploaded ? (
                      <>
                        <Button
                          size="sm"
                          className="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs"
                          onClick={() => uploadedDoc?.file_url && window.open(uploadedDoc.file_url, '_blank')}
                        >
                          צפייה במסמך
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="w-full rounded-lg text-xs bg-red-500 hover:bg-red-600"
                          onClick={() => deleteRequiredDoc.mutate(doc.id)}
                        >
                          מחיקה
                        </Button>
                      </>
                    ) : (
                      <>
                        <input
                          type="file"
                          className="hidden"
                          ref={fileInputRef}
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && uploadingDocType) {
                              handleFileUpload(file, uploadingDocType);
                            }
                            e.target.value = '';
                          }}
                        />
                        <button
                          type="button"
                          className="w-full flex-1 border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center min-h-[60px] hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => {
                            setUploadingDocType(doc.document_type);
                            fileInputRef.current?.click();
                          }}
                          disabled={uploadingDocType === doc.document_type}
                        >
                          {uploadingDocType === doc.document_type ? (
                            <Loader2 className="w-5 h-5 text-primary animate-spin" />
                          ) : (
                            <>
                              <Upload className="w-5 h-5 text-muted-foreground/50" />
                              <span className="text-xs text-muted-foreground/50 mt-1">העלאה</span>
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
              
              {/* Empty placeholder cards if less than 6 docs */}
              {Array.from({ length: Math.max(0, 6 - (requiredDocs?.length || 0)) }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="bg-white rounded-xl p-4 flex flex-col items-center justify-center gap-2 border shadow-sm min-h-[120px]"
                >
                  <div className="w-full flex-1 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center">
                    <Plus className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pending Seller Approval Section - PayMe Setup Details */}
        {isPendingSellerApproval && (
          <div className="mt-6 bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-amber-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                בקשת הקמת חשבון סליקה — ממתין לאישור
              </h3>
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-amber-500 text-white">
                ממתין לאישורך
              </span>
            </div>

            {/* Personal Details */}
            <div className="bg-white rounded-xl p-4 border shadow-sm">
              <h4 className="text-sm font-bold text-secondary mb-3">פרטים אישיים</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">שם פרטי</p>
                  <p className="font-medium">{setupData.firstName || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">שם משפחה</p>
                  <p className="font-medium">{setupData.lastName || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">תעודת זהות</p>
                  <p className="font-medium font-mono">{setupData.socialId || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">תאריך לידה</p>
                  <p className="font-medium">{setupData.birthdate || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">תאריך הנפקת ת.ז.</p>
                  <p className="font-medium">{setupData.socialIdDate || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">טלפון</p>
                  <p className="font-medium font-mono">{setupData.phone || '—'}</p>
                </div>
                <div className="col-span-3">
                  <p className="text-xs text-muted-foreground">כתובת מייל</p>
                  <p className="font-medium">{setupData.email || '—'}</p>
                </div>
              </div>
            </div>

            {/* Business Details */}
            <div className="bg-white rounded-xl p-4 border shadow-sm">
              <h4 className="text-sm font-bold text-secondary mb-3">פרטי עסק</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">שם העסק</p>
                  <p className="font-medium">{setupData.merchantName || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">שם העסק (אנגלית)</p>
                  <p className="font-medium">{setupData.merchantNameEn || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">סוג עסק</p>
                  <p className="font-medium">
                    {setupData.incType === 0 ? 'עוסק פטור' : setupData.incType === 1 ? 'עוסק מורשה' : setupData.incType === 2 ? 'חברה בע"מ' : setupData.incType === 3 ? 'מלכ"ר' : '—'}
                  </p>
                </div>
                {setupData.incCode && (
                  <div>
                    <p className="text-xs text-muted-foreground">ח.פ. / מספר עוסק</p>
                    <p className="font-medium font-mono">{setupData.incCode}</p>
                  </div>
                )}
                {setupData.siteUrl && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">כתובת אתר</p>
                    <p className="font-medium text-blue-600 break-all">{setupData.siteUrl}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="bg-white rounded-xl p-4 border shadow-sm">
              <h4 className="text-sm font-bold text-secondary mb-3">כתובת</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">עיר</p>
                  <p className="font-medium">{setupData.city || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">רחוב</p>
                  <p className="font-medium">{setupData.street || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">מספר בית</p>
                  <p className="font-medium">{setupData.streetNumber || '—'}</p>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="bg-white rounded-xl p-4 border shadow-sm">
              <h4 className="text-sm font-bold text-secondary mb-3">פרטי חשבון בנק</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">בנק</p>
                  <p className="font-medium">{BANKS[String(setupData.bankCode)] || `בנק ${setupData.bankCode}` || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">סניף</p>
                  <p className="font-medium font-mono">{setupData.bankBranch || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">מספר חשבון</p>
                  <p className="font-medium font-mono">{setupData.bankAccountNumber || '—'}</p>
                </div>
              </div>
            </div>

            {/* KYC Files for review */}
            <div className="bg-white rounded-xl p-4 border shadow-sm">
              <h4 className="text-sm font-bold text-secondary mb-3">מסמכי זיהוי (KYC)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-3">
                  <p className="text-sm font-medium text-secondary mb-2">צילום תעודת זהות</p>
                  {hasSocialIdFile ? (
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-muted-foreground truncate flex-1">{setupData.socialIdFile.name}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={() => {
                          const blob = new Blob(
                            [Uint8Array.from(atob(setupData.socialIdFile.base64), c => c.charCodeAt(0))],
                            { type: setupData.socialIdFile.mimeType }
                          );
                          window.open(URL.createObjectURL(blob), '_blank');
                        }}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        צפייה
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      <span className="text-xs">לא הועלה</span>
                    </div>
                  )}
                </div>
                <div className="border rounded-lg p-3">
                  <p className="text-sm font-medium text-secondary mb-2">אישור ניהול חשבון בנק</p>
                  {hasBankApprovalFile ? (
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-muted-foreground truncate flex-1">{setupData.bankApprovalFile.name}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={() => {
                          const blob = new Blob(
                            [Uint8Array.from(atob(setupData.bankApprovalFile.base64), c => c.charCodeAt(0))],
                            { type: setupData.bankApprovalFile.mimeType }
                          );
                          window.open(URL.createObjectURL(blob), '_blank');
                        }}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        צפייה
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      <span className="text-xs">לא הועלה</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Approve / Reject Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleApproveSeller}
                disabled={approvingSeller}
                className="flex-1 rounded-full bg-green-600 hover:bg-green-700 text-white gap-2 h-11"
              >
                {approvingSeller ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />שולח ל-PayMe ויוצר חשבון...</>
                ) : (
                  <><Send className="w-4 h-4" />אשר והקם חשבון סליקה ב-PayMe</>
                )}
              </Button>
              <Button
                variant="destructive"
                className="rounded-full gap-2 h-11"
                disabled={approvingSeller}
                onClick={() => {
                  if (confirm('האם לדחות את הבקשה? בעל האירוע יצטרך להזין את הפרטים מחדש.')) {
                    handleRejectSeller();
                  }
                }}
              >
                <X className="w-4 h-4" />
                דחה בקשה
              </Button>
            </div>
          </div>
        )}

        {/* PayMe Hosted Fields API Key (uuid) */}
        {event.seller_payme_id && (
          <div className="mt-6 bg-muted rounded-2xl p-4 space-y-3">
            <h3 className="text-lg font-semibold text-secondary">מפתח PayMe Hosted Fields</h3>
            <p className="text-xs text-muted-foreground">
              ה-uuid המתקבל בתגובת PayMe (Public Key). נדרש לטעינת iframe חיצוני (נדרים פלוס וכו'). אם חסר — קבל אותו מ-PayMe והכנס כאן.
            </p>
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Seller ID:</span> <code className="ltr">{event.seller_payme_id}</code>
            </div>
            <div className="flex gap-2">
              <Input
                value={hfApiKeyInput}
                onChange={(e) => setHfApiKeyInput(e.target.value)}
                placeholder="הדבק כאן את ה-uuid של PayMe"
                className="ltr text-left"
                dir="ltr"
              />
              <Button onClick={saveHfApiKey} disabled={savingHfKey || hfApiKeyInput === (event.hf_api_key || "")}>
                {savingHfKey ? <Loader2 className="w-4 h-4 animate-spin" /> : "שמור"}
              </Button>
            </div>
          </div>
        )}

        {/* PayMe wallet operations — only visible once PayMe has actually approved the seller */}
        {event.seller_payme_id && event.payment_setup_status === 'approved' && (
          <div className="mt-6 bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200 rounded-2xl p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-amber-700" />
              <h3 className="text-lg font-semibold text-amber-900">פעולות ארנק PayMe</h3>
            </div>

            {/* Wallet status summary */}
            {walletLoading ? (
              <div className="text-xs text-amber-800/70 flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" /> טוען נתוני ארנק...
              </div>
            ) : walletData ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white/70 rounded-lg p-2">
                  <div className="text-amber-800/60">סה"כ עמלות שנגבו</div>
                  <div className="font-bold text-amber-900 text-base">{formatILS(walletData.collected)}</div>
                </div>
                <div className="bg-white/70 rounded-lg p-2">
                  <div className="text-amber-800/60">הועבר ל-giftkal</div>
                  <div className="font-bold text-amber-900 text-base">{formatILS(walletData.swept)}</div>
                </div>
                <div className="bg-white/70 rounded-lg p-2 border-2 border-amber-500">
                  <div className="text-amber-800/60">זמין להעברה</div>
                  <div className="font-bold text-amber-900 text-base">{formatILS(walletData.pending)}</div>
                </div>
                <div className="bg-white/70 rounded-lg p-2">
                  <div className="text-amber-800/60">סה"כ מתנות שניתנו</div>
                  <div className="font-bold text-amber-900 text-base">{formatILS(walletData.grossGifts)}</div>
                </div>
              </div>
            ) : null}

            {/* Sweep commission: move giftkal's cut from event-owner wallet → master wallet */}
            <div className="bg-white/70 rounded-xl p-3 space-y-2">
              <div className="text-sm font-medium text-amber-900">העברת עמלת giftkal</div>
              <p className="text-xs text-amber-800/70">
                העברה wallet → wallet מארנק בעל האירוע אל ארנק giftkal. הסכום ממולא אוטומטית לפי העמלות שנותרו להעברה.
              </p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="סכום בש״ח"
                  value={sweepAmount}
                  onChange={(e) => setSweepAmount(e.target.value)}
                />
                <Input
                  placeholder="הערה (אופציונלי)"
                  value={sweepNote}
                  onChange={(e) => setSweepNote(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={sweepCommission} disabled={sweepingCommission || !sweepAmount}>
                  {sweepingCommission ? <Loader2 className="w-4 h-4 animate-spin" /> : "העבר"}
                </Button>
              </div>
            </div>

            {/* Trigger payout to bank */}
            <div className="bg-white/70 rounded-xl p-3 space-y-2">
              <div className="text-sm font-medium text-amber-900 flex items-center gap-2">
                <ArrowDownToLine className="w-4 h-4" />
                העברה לחשבון הבנק של בעל האירוע
              </div>
              <p className="text-xs text-amber-800/70">
                מבצע <code className="text-[10px]">withdraw-balance</code> ב-PayMe. הסכום יילקח מארנק הסולק לחשבון הבנק שלו (כפוף ל-6 ימי hold של PayMe על כרטיסים ישראליים).
              </p>
              <Button
                variant="default"
                onClick={triggerWithdrawal}
                disabled={withdrawingBalance}
                className="bg-amber-700 hover:bg-amber-800 text-white"
              >
                {withdrawingBalance ? <Loader2 className="w-4 h-4 animate-spin" /> : "העבר את היתרה לבנק"}
              </Button>
            </div>

            {/* Recent history — last 5 of each */}
            {walletData && (walletData.transfers.length > 0 || walletData.payouts.length > 0) && (
              <details className="bg-white/50 rounded-xl p-3">
                <summary className="text-sm font-medium text-amber-900 cursor-pointer select-none">
                  היסטוריה ({walletData.transfers.length + walletData.payouts.length})
                </summary>
                <div className="mt-3 space-y-2 text-xs">
                  {walletData.transfers.slice(0, 5).map((t: any) => (
                    <div key={t.id} className="flex justify-between items-center bg-white/70 rounded px-2 py-1">
                      <span className="text-amber-900">העברה ל-giftkal · {formatILS(Number(t.amount) || 0)}</span>
                      <span className={
                        t.status === 'completed' ? 'text-green-700' :
                        t.status === 'failed' ? 'text-red-700' :
                        'text-amber-700'
                      }>{t.status}</span>
                    </div>
                  ))}
                  {walletData.payouts.slice(0, 5).map((p: any) => (
                    <div key={p.id} className="flex justify-between items-center bg-white/70 rounded px-2 py-1">
                      <span className="text-amber-900">משיכה לבנק · {p.amount ? formatILS(Number(p.amount)) : 'יתרה מלאה'}</span>
                      <span className={
                        p.status === 'completed' ? 'text-green-700' :
                        p.status === 'failed' ? 'text-red-700' :
                        'text-amber-700'
                      }>{p.status}</span>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

        {/* KYC Documents Section */}
        {event.seller_payme_id && (
          <div className="mt-6 bg-muted rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-secondary flex items-center gap-2">
                <FileCheck className="w-5 h-5" />
                מסמכי סליקה (KYC)
              </h3>
              {kycStatus === 'approved' ? (
                <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-green-500 text-white">
                  הושלמו בהצלחה ✅
                </span>
              ) : kycStatus === 'rejected' ? (
                <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-red-500 text-white">
                  נדחו — ממתין להעלאה מחדש
                </span>
              ) : kycStatus === 'pending' || hasAnyKycFile ? (
                <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-amber-500 text-white">
                  ממתין לאישור
                </span>
              ) : (
                <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-red-500 text-white">
                  חסרים מסמכים
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Social ID File */}
              <div className="bg-white rounded-xl p-4 border shadow-sm">
                <p className="text-sm font-medium text-secondary mb-2">צילום תעודת זהות</p>
                {hasSocialIdFile ? (
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-muted-foreground truncate">{setupData.socialIdFile.name}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                      onClick={() => {
                        const blob = new Blob(
                          [Uint8Array.from(atob(setupData.socialIdFile.base64), c => c.charCodeAt(0))],
                          { type: setupData.socialIdFile.mimeType }
                        );
                        window.open(URL.createObjectURL(blob), '_blank');
                      }}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      צפייה
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-xs">לא הועלה</span>
                  </div>
                )}
              </div>

              {/* Bank Approval File */}
              <div className="bg-white rounded-xl p-4 border shadow-sm">
                <p className="text-sm font-medium text-secondary mb-2">אישור ניהול חשבון בנק</p>
                {hasBankApprovalFile ? (
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-muted-foreground truncate">{setupData.bankApprovalFile.name}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                      onClick={() => {
                        const blob = new Blob(
                          [Uint8Array.from(atob(setupData.bankApprovalFile.base64), c => c.charCodeAt(0))],
                          { type: setupData.bankApprovalFile.mimeType }
                        );
                        window.open(URL.createObjectURL(blob), '_blank');
                      }}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      צפייה
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-xs">לא הועלה</span>
                  </div>
                )}
              </div>
            </div>

            {/* Approve & Reject Buttons */}
            {hasAnyKycFile && kycStatus !== 'approved' && (
              <div className="space-y-3">
                {showRejectForm ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-medium text-red-800">סיבת הדחייה:</p>
                    <Textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="הסבר לבעל האירוע למה המסמכים לא התקבלו..."
                      className="text-sm"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={async () => {
                          if (!rejectReason.trim()) {
                            toast({ title: "יש להזין סיבת דחייה", variant: "destructive" });
                            return;
                          }
                          setRejectingKyc(true);
                          try {
                            const cleanedSetupData = { ...setupData };
                            delete cleanedSetupData.socialIdFile;
                            delete cleanedSetupData.bankApprovalFile;
                            cleanedSetupData.kyc_rejection_reason = rejectReason.trim();

                            await supabase.from('events').update({
                              kyc_docs_status: 'rejected',
                              payment_setup_data: cleanedSetupData,
                            }).eq('id', event.id);

                            queryClient.invalidateQueries({ queryKey: ["events-list"] });
                            queryClient.invalidateQueries({ queryKey: ["event-payme", event.id] });
                            toast({ title: "המסמכים נדחו והמשתמש יתבקש להעלות מחדש" });
                            setShowRejectForm(false);
                            setRejectReason("");
                          } catch (error: any) {
                            toast({ title: "שגיאה", description: error.message, variant: "destructive" });
                          } finally {
                            setRejectingKyc(false);
                          }
                        }}
                        disabled={rejectingKyc || !rejectReason.trim()}
                        className="flex-1 rounded-full bg-red-600 hover:bg-red-700 text-white gap-2"
                      >
                        {rejectingKyc ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        אשר דחייה
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-full"
                        onClick={() => { setShowRejectForm(false); setRejectReason(""); }}
                      >
                        ביטול
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleApproveKyc}
                      disabled={approvingKyc}
                      className="flex-1 rounded-full bg-green-600 hover:bg-green-700 text-white gap-2"
                    >
                      {approvingKyc ? (
                        <><Loader2 className="w-4 h-4 animate-spin" />שולח מסמכים ל-PayMe...</>
                      ) : (
                        <><Send className="w-4 h-4" />אשר ושלח מסמכים ל-PayMe</>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      className="rounded-full gap-2"
                      onClick={() => setShowRejectForm(true)}
                    >
                      <Trash2 className="w-4 h-4" />
                      דחה מסמכים
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Show rejection reason if already rejected */}
            {kycStatus === 'rejected' && setupData?.kyc_rejection_reason && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm font-medium text-red-800 mb-1">סיבת דחייה אחרונה:</p>
                <p className="text-sm text-red-700">{setupData.kyc_rejection_reason}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
