import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, CreditCard } from "lucide-react";
import NedarimBillingDialog from "@/components/billing/NedarimBillingDialog";

export default function Billing() {
  const [searchQuery, setSearchQuery] = useState("");
  const [billingOpen, setBillingOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<any>(null);

  // Fetch event owners with their events
  const { data: eventOwners } = useQuery({
    queryKey: ["billing-event-owners"],
    queryFn: async () => {
      const { data: events } = await supabase
        .from("events")
        .select("id, event_date, groom_name, bride_name, owner_id, venues (name)")
        .order("event_date", { ascending: false });

      const ownerIds = [...new Set(events?.map((e) => e.owner_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, phone")
        .in("user_id", ownerIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]));

      return events?.map((event) => {
        const profile = profileMap.get(event.owner_id);
        return {
          ...event,
          ownerName: profile?.full_name || `${event.groom_name || ""} & ${event.bride_name || ""}`,
          ownerEmail: profile?.email || "",
          ownerPhone: profile?.phone || "",
        };
      }) || [];
    },
  });

  const filtered = eventOwners?.filter((e) =>
    e.ownerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.venues?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCharge = (owner: any) => {
    setSelectedOwner(owner);
    setBillingOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search */}
      <div className="flex justify-start">
        <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow-sm">
          <Input
            placeholder="חיפוש חופשי"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-right w-32 p-0 h-6 text-sm"
          />
          <Search className="w-4 h-4 text-muted-foreground" />
          <div className="w-px h-4 bg-gray-300" />
          <Filter className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 text-sm font-medium text-muted-foreground text-center">
        <span>תאריך אירוע</span>
        <span>בעל האירוע</span>
        <span>שם האולם</span>
        <span>אירוע</span>
        <span className="w-40"></span>
      </div>

      {/* Rows */}
      <div className="space-y-3">
        {filtered?.map((event) => (
          <div
            key={event.id}
            className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 items-center bg-white rounded-2xl px-6 py-5 shadow-sm"
          >
            <span className="text-center font-medium">
              {new Date(event.event_date).toLocaleDateString("he-IL")}
            </span>
            <span className="text-center font-medium">{event.ownerName}</span>
            <span className="text-center font-medium">{event.venues?.name || "—"}</span>
            <span className="text-center font-medium">
              {event.groom_name && event.bride_name
                ? `${event.groom_name} & ${event.bride_name}`
                : "—"}
            </span>
            <div className="flex justify-end w-40">
              <Button
                onClick={() => handleCharge(event)}
                className="rounded-lg gap-2 px-4"
                variant="gold"
                size="sm"
              >
                <CreditCard className="w-4 h-4" />
                חייב לקוח
              </Button>
            </div>
          </div>
        ))}

        {!filtered?.length && (
          <div className="text-center py-12 text-muted-foreground bg-white rounded-2xl">
            לא נמצאו בעלי אירועים
          </div>
        )}
      </div>

      {/* Billing Dialog */}
      <NedarimBillingDialog
        open={billingOpen}
        onOpenChange={setBillingOpen}
        customerName={selectedOwner?.ownerName || ""}
        customerPhone={selectedOwner?.ownerPhone || ""}
        customerEmail={selectedOwner?.ownerEmail || ""}
        description={`חיוב שירות GiftKal - ${selectedOwner?.groom_name || ""} & ${selectedOwner?.bride_name || ""}`}
        onSuccess={(txId) => {
          console.log("Payment successful:", txId);
          setBillingOpen(false);
        }}
      />
    </div>
  );
}
