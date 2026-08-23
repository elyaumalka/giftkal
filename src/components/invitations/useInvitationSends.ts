import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SendChannel = "email" | "whatsapp";

export type InvitationSend = {
  id: string;
  event_id: string;
  guest_id: string;
  channel: SendChannel;
  status: "sent" | "failed" | "queued";
  recipient: string | null;
  error_message: string | null;
  created_at: string;
};

/**
 * Tracking of invitation sends per guest (channel, time, status).
 */
export function useInvitationSends(eventId?: string) {
  const { data: sends, refetch } = useQuery({
    queryKey: ["invitation-sends", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      if (!eventId) return [] as InvitationSend[];
      const { data } = await supabase
        .from("guest_invitation_sends")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      return (data || []) as InvitationSend[];
    },
  });

  const logSend = async (args: {
    guestId: string;
    channel: SendChannel;
    status?: "sent" | "failed" | "queued";
    recipient?: string | null;
    errorMessage?: string | null;
  }) => {
    if (!eventId) return;
    const status = args.status || "sent";
    await supabase.from("guest_invitation_sends").insert({
      event_id: eventId,
      guest_id: args.guestId,
      channel: args.channel,
      status,
      recipient: args.recipient ?? null,
      error_message: args.errorMessage ?? null,
    });

    if (status === "sent") {
      await supabase
        .from("guests")
        .update({
          invitation_sent: true,
          invitation_sent_at: new Date().toISOString(),
          invitation_last_channel: args.channel,
        })
        .eq("id", args.guestId);
    }

    await refetch();
  };

  const lastSendByGuest = (guestId: string) =>
    (sends || []).find((s) => s.guest_id === guestId) || null;

  const countByChannel = (channel: SendChannel) =>
    (sends || []).filter((s) => s.channel === channel && s.status === "sent").length;

  return { sends: sends || [], refetchSends: refetch, logSend, lastSendByGuest, countByChannel };
}
