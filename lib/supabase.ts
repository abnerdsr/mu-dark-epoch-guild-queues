import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cria e exporta uma única instância do cliente
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para o banco de dados
export interface User {
  id: string;
  username: string;
  name: string;
  password: string;
  role: "master" | "user";
  created_at: string;
}

export interface Queue {
  id: string;
  title: string;
  item_name: string;
  image_url?: string;
  created_by: string;
  created_at: string;
}

export interface QueueItem {
  id: string;
  queue_id: string;
  name: string;
  position: number;
  status: "waiting" | "approved" | "completed";
  requested_by: string;
  created_at: string;
}

export interface DropEvent {
  id: string;
  queue_id: string;
  drop_count: number;
  created_at: string;
  created_by: string;
}

export interface DropParticipant {
  id: string;
  drop_event_id: string;
  queue_item_id: string;
  name: string;
  action: "accept" | "skip" | "decline";
  created_at: string;
}
