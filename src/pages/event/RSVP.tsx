import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, Users, UserCheck, UserX, Clock, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

type RsvpFilter = "all" | "approved" | "declined" | "pending";

export default function RSVP() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<RsvpFilter>("all");

  const { data: guests = [], isLoading } = useQuery({
    queryKey: ["rsvp-guests"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: event } = await supabase
        .from("events")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!event) return [];

      const { data } = await supabase
        .from("guests")
        .select("*")
        .eq("event_id", event.id)
        .order("full_name");

      return data || [];
    },
  });

  const stats = useMemo(() => {
    const total = guests.length;
    const approved = guests.filter((g: any) => g.rsvp_status === "approved").reduce((sum: number, g: any) => sum + (g.number_of_guests || 1), 0);
    const declined = guests.filter((g: any) => g.rsvp_status === "declined").length;
    const pending = guests.filter((g: any) => g.rsvp_status === "pending").length;
    const approvedCount = guests.filter((g: any) => g.rsvp_status === "approved").length;
    return { total, approved, declined, pending, approvedCount };
  }, [guests]);

  const filteredGuests = useMemo(() => {
    let list = guests;
    if (filter !== "all") {
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
      case "approved": return "אישר הגעה";
      case "declined": return "לא מגיע";
      default: return "ממתין";
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-[#22C55E] text-white";
      case "declined": return "bg-[#C41E3A] text-white";
      default: return "bg-gray-200 text-gray-700";
    }
  };

  const statCards = [
    { label: "סה״כ מוזמנים", value: stats.total, icon: Users, color: "bg-[#051839]" },
    { label: "אישרו הגעה", value: `${stats.approvedCount} (${stats.approved} אורחים)`, icon: UserCheck, color: "bg-[#22C55E]" },
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-500 mb-4 px-4">
            <span className="text-right">שם מלא</span>
            <span className="text-right">טלפון</span>
            <span className="text-right">מייל</span>
            <span className="text-right">קרבה</span>
            <span className="text-right">מספר אורחים</span>
            <span className="text-right">סטטוס</span>
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
                  className="grid grid-cols-6 gap-4 items-center bg-gray-50 rounded-xl p-4 text-sm hover:bg-gray-100 transition-colors"
                >
                  <span className="font-bold text-[#051839]">{guest.full_name}</span>
                  <span className="text-[#051839]">{guest.phone || "—"}</span>
                  <span className="text-[#051839] truncate">{guest.email || "—"}</span>
                  <span className="text-[#051839]">{guest.relationship || "—"}</span>
                  <span className="font-bold text-[#051839]">{guest.number_of_guests || 1}</span>
                  <span>
                    <span className={cn("inline-block px-4 py-1.5 rounded-full text-xs font-medium", statusColor(guest.rsvp_status))}>
                      {statusLabel(guest.rsvp_status)}
                    </span>
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
