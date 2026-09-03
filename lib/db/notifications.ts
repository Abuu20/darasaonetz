import { supabase } from "./client";
import type { AppNotification, NotificationType } from "./types";

export const notificationQueries = {
  getForUser: async (userId: string, limit = 50, unreadOnly = false): Promise<AppNotification[]> => {
    let query = supabase
      .from("email_notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (unreadOnly) query = query.eq("is_read", false);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as AppNotification[];
  },

  getUnreadCount: async (userId: string): Promise<number> => {
    const { count, error } = await supabase
      .from("email_notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    if (error) throw error;
    return count ?? 0;
  },

  markAsRead: async (notificationId: string): Promise<true> => {
    const { error } = await supabase
      .from("email_notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", notificationId);
    if (error) throw error;
    return true;
  },

  markAllAsRead: async (userId: string): Promise<true> => {
    const { error } = await supabase
      .from("email_notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("is_read", false);
    if (error) throw error;
    return true;
  },

  delete: async (notificationId: string): Promise<true> => {
    const { error } = await supabase.from("email_notifications").delete().eq("id", notificationId);
    if (error) throw error;
    return true;
  },

  // Calls the same `create_notification` RPC the live app already uses,
  // so notifications trigger whatever email/push side-effects it has wired up.
  create: async (
    userId: string,
    type: NotificationType | string,
    title: string,
    content: string,
    data: Record<string, unknown> | null = null
  ) => {
    const { data: result, error } = await supabase.rpc("create_notification", {
      p_user_id: userId,
      p_type: type,
      p_title: title,
      p_content: content,
      p_data: data,
    });
    if (error) throw error;
    return result;
  },

  // Realtime: fires `onInsert` the moment a new notification row lands for this user.
  subscribe: (userId: string, onInsert: (n: AppNotification) => void) => {
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "email_notifications", filter: `user_id=eq.${userId}` },
        (payload) => onInsert(payload.new as AppNotification)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  },
};
