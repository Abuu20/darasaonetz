import { supabase } from "./client";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string | null;
  message: string;
  created_at: string;
  read_at: string | null;
}

export const contactMessageQueries = {
  getAll: async (): Promise<ContactMessage[]> => {
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as ContactMessage[];
  },

  markAsRead: async (id: string): Promise<true> => {
    const { error } = await supabase
      .from("contact_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    return true;
  },
};
