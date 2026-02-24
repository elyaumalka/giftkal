import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, Users, UserCheck, UserX, Clock, Copy, Baby, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type RsvpFilter = "all" | "approved" | "declined" | "pending";

export default function RSVP() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<RsvpFilter>("all");
  const { toast } = useToast();

  const { data: eventData } = useQuery({
    queryKey: ["rsvp-event-data"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("events")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: guests = [], isLoading } = useQuery({
    queryKey: ["rsvp-guests", eventData?.id],
    queryFn: async () => {
      if (!eventData?.id) return [];
      const { data } = await supabase
        .from("guests")
        .select("*")
        .eq("event_id", eventData.id)
        .order("full_name");
      return data || [];
    },
    enabled: !!eventData?.id,
  });

  const stats = useMemo(() => {
    const total = guests.length;
    const confirmed = guests.filter((g: any) => g.rsvp_status === "confirmed" || g.rsvp_status === "approved");
    const approvedGuests = confirmed.reduce((sum: number, g: any) => sum + (g.number_of_guests || 1), 0);
    const childrenTotal = confirmed.reduce((sum: number, g: any) => sum + ((g as any).children_count || 0), 0);
    const declined = guests.filter((g: any) => g.rsvp_status === "declined").length;
    const pending = guests.filter((g: any) => g.rsvp_status === "pending" || g.rsvp_status === "maybe").length;
    const approvedCount = confirmed.length;
    return { total, approved: approvedGuests, declined, pending, approvedCount, childrenTotal };
  }, [guests]);

  const filteredGuests = useMemo(() => {
    let list = guests;
    if (filter === "approved") {
      list = list.filter((g: any) => g.rsvp_status === "approved" || g.rsvp_status === "confirmed");
    } else if (filter === "pending") {
      list = list.filter((g: any) => g.rsvp_status === "pending" || g.rsvp_status === "maybe");
    } else if (filter !== "all") {
      list = list.filter((g: any) => g.rsvp_status === filter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((g: any) =>
        g.full_name?.toLowerCase().includes(q) ||
        g.phone?.includes(q) ||
        g.email?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [guests, filter, searchQuery]);

  const statusLabel = (status: string) => {
    switch (status) {
      case "approved":
      case "confirmed": return "אישר הגעה";
      case "declined": return "לא מגיע";
      case "maybe": return "עוד לא יודע";
      default: return "ממתין";
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "approved":
      case "confirmed": return "bg-[#22C55E] text-white";
      case "declined": return "bg-[#C41E3A] text-white";
      case "maybe": return "bg-[#F59E0B] text-white";
      default: return "bg-gray-200 text-gray-700";
    }
  };

  const statCards = [
    { label: "סה״כ מוזמנים", value: stats.total, icon: Users, color: "bg-[#051839]" },
    { label: "אישרו הגעה", value: `${stats.approvedCount} (${stats.approved} אורחים)`, icon: UserCheck, color: "bg-[#22C55E]" },
    { label: "ילדים", value: stats.childrenTotal, icon: Baby, color: "bg-[#C4A35A]" },
    { label: "לא מגיעים", value: stats.declined, icon: UserX, color: "bg-[#C41E3A]" },
    { label: "ממתינים", value: stats.pending, icon: Clock, color: "bg-[#F59E0B]" },
  ];

  const filterButtons: { label: string; value: RsvpFilter }[] = [
    { label: "הכל", value: "all" },
    { label: "אישרו", value: "approved" },
    { label: "לא מגיעים", value: "declined" },
    { label: "ממתינים", value: "pending" },
  ];

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white", card.color)}>
              <card.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-xl font-bold text-[#051839]">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="חיפוש לפי שם, טלפון או מייל..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 rounded-full border-gray-200"
          />
        </div>
        <div className="flex gap-2">
          {filterButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setFilter(btn.value)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                filter === btn.value
                  ? "bg-[#051839] text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              )}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">אחוז אישורים</span>
          <span className="text-sm font-bold text-[#051839]">
            {stats.approvedCount} מתוך {stats.total} ({stats.total > 0 ? Math.round((stats.approvedCount / stats.total) * 100) : 0}%)
          </span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-l from-[#22C55E] to-[#16A34A] rounded-full transition-all duration-500"
            style={{ width: `${stats.total > 0 ? (stats.approvedCount / stats.total) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Guests Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4">
          {/* Header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_0.8fr_0.8fr_0.6fr_auto] gap-3 text-sm font-medium text-gray-500 mb-4 px-4">
            <span>שם מלא</span>
            <span>טלפון</span>
            <span>קרבה</span>
            <span>אורחים</span>
            <span>ילדים</span>
            <span>סטטוס</span>
            <span className="w-10">קישור</span>
          </div>

          {/* Rows */}
          <div className="space-y-2">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">טוען נתונים...</div>
            ) : filteredGuests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery || filter !== "all" ? "לא נמצאו תוצאות" : "אין מוזמנים עדיין"}
              </div>
            ) : (
              filteredGuests.map((guest: any) => (
                <div
                  key={guest.id}
                  className="grid grid-cols-[2fr_1fr_1fr_0.8fr_0.8fr_0.6fr_auto] gap-3 items-center bg-gray-50 rounded-xl p-4 text-sm hover:bg-gray-100 transition-colors"
                >
                  <span className="font-bold text-[#051839]">{guest.full_name}</span>
                  <span className="text-[#051839]">{guest.phone || "—"}</span>
                  <span className="text-[#051839]">{guest.relationship || "—"}</span>
                  <span className="font-bold text-[#051839]">{guest.number_of_guests || 1}</span>
                  <span className="text-[#051839]">{guest.children_count || 0}</span>
                  <span>
                    <span className={cn("inline-block px-3 py-1 rounded-full text-xs font-medium", statusColor(guest.rsvp_status))}>
                      {statusLabel(guest.rsvp_status)}
                    </span>
                  </span>
                  <div className="w-10">
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/rsvp/${eventData?.id}/${guest.id}`;
                        navigator.clipboard.writeText(url);
                        toast({ title: "קישור RSVP הועתק!" });
                      }}
                      className="text-[#C4A35A] hover:text-[#95742F] transition-colors"
                      title="העתק קישור RSVP"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
