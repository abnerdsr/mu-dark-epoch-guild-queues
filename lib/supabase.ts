import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para o banco de dados
export interface User {
  id: string
  username: string
  name: string
  password: string
  role: "master" | "user"
  created_at: string
}

export interface Queue {
  id: string
  title: string
  created_by: string
  created_at: string
}

export interface QueueItem {
  id: string
  queue_id: string
  name: string
  position: number
  status: "waiting" | "approved" | "completed"
  requested_by: string
  created_at: string
}
