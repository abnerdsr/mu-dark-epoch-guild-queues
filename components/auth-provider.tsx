"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"

interface AuthUser {
  id: string
  name: string
  username: string
  role: "master" | "user"
}

interface QueueWithItems {
  id: string
  title: string
  items: Array<{
    id: string
    name: string
    position: number
    status: "waiting" | "approved" | "completed"
    requestedBy: string
  }>
}

interface AuthContextType {
  user: AuthUser | null
  queues: QueueWithItems[]
  isLoginOpen: boolean
  loading: boolean
  login: (username: string, password: string) => Promise<boolean>
  signup: (name: string, username: string, password: string) => Promise<boolean>
  logout: () => void
  openLogin: () => void
  closeLogin: () => void
  addPersonToQueue: (queueId: string, name: string) => Promise<void>
  removePersonFromQueue: (queueId: string, itemId: string) => Promise<void>
  moveToEnd: (queueId: string, itemId: string) => Promise<void>
  approveRequest: (queueId: string, itemId: string) => Promise<void>
  requestToJoinQueue: (queueId: string) => Promise<void>
  createQueue: (title: string) => Promise<void>
  deleteQueue: (queueId: string) => Promise<void>
  refreshQueues: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [queues, setQueues] = useState<QueueWithItems[]>([])
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      const savedUser = localStorage.getItem("currentUser")
      if (savedUser) {
        const userData = JSON.parse(savedUser)
        setUser(userData)
      }
      await refreshQueues()
    } catch (error) {
      console.error("Erro ao inicializar:", error)
    } finally {
      setLoading(false)
    }
  }

  const refreshQueues = async () => {
    try {
      // Buscar filas
      const { data: queuesData, error: queuesError } = await supabase
        .from("queues")
        .select("*")
        .order("created_at", { ascending: true })

      if (queuesError) throw queuesError

      // Buscar itens das filas
      const { data: itemsData, error: itemsError } = await supabase
        .from("queue_items")
        .select("*")
        .order("position", { ascending: true })

      if (itemsError) throw itemsError

      // Combinar dados
      const queuesWithItems: QueueWithItems[] = (queuesData || []).map((queue) => ({
        id: queue.id,
        title: queue.title,
        items: (itemsData || [])
          .filter((item) => item.queue_id === queue.id)
          .map((item) => ({
            id: item.id,
            name: item.name,
            position: item.position,
            status: item.status,
            requestedBy: item.requested_by,
          })),
      }))

      setQueues(queuesWithItems)
    } catch (error) {
      console.error("Erro ao carregar filas:", error)
    }
  }

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .eq("password", password)
        .single()

      if (error || !data) {
        return false
      }

      const authUser: AuthUser = {
        id: data.id,
        name: data.name,
        username: data.username,
        role: data.role,
      }

      setUser(authUser)
      localStorage.setItem("currentUser", JSON.stringify(authUser))
      setIsLoginOpen(false)
      await refreshQueues()
      return true
    } catch (error) {
      console.error("Erro no login:", error)
      return false
    }
  }

  const signup = async (name: string, username: string, password: string): Promise<boolean> => {
    try {
      // Validar username (sem espaços)
      if (username.includes(" ")) {
        return false
      }

      const { data, error } = await supabase
        .from("users")
        .insert([
          {
            name,
            username,
            password,
            role: "user",
          },
        ])
        .select()
        .single()

      if (error) {
        return false
      }

      const authUser: AuthUser = {
        id: data.id,
        name: data.name,
        username: data.username,
        role: data.role,
      }

      setUser(authUser)
      localStorage.setItem("currentUser", JSON.stringify(authUser))
      setIsLoginOpen(false)
      await refreshQueues()
      return true
    } catch (error) {
      console.error("Erro no cadastro:", error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("currentUser")
  }

  const openLogin = () => setIsLoginOpen(true)
  const closeLogin = () => setIsLoginOpen(false)

  const addPersonToQueue = async (queueId: string, name: string) => {
    if (user?.role !== "master") return

    try {
      // Buscar próxima posição
      const { data: items } = await supabase
        .from("queue_items")
        .select("position")
        .eq("queue_id", queueId)
        .order("position", { ascending: false })
        .limit(1)

      const nextPosition = items && items.length > 0 ? items[0].position + 1 : 1

      const { error } = await supabase.from("queue_items").insert([
        {
          queue_id: queueId,
          name,
          position: nextPosition,
          status: "approved",
          requested_by: user.id,
        },
      ])

      if (error) throw error
      await refreshQueues()
    } catch (error) {
      console.error("Erro ao adicionar pessoa:", error)
    }
  }

  const removePersonFromQueue = async (queueId: string, itemId: string) => {
    if (user?.role !== "master") return

    try {
      // Buscar item a ser removido
      const { data: itemToRemove } = await supabase.from("queue_items").select("position").eq("id", itemId).single()

      if (!itemToRemove) return

      // Remover item
      const { error: deleteError } = await supabase.from("queue_items").delete().eq("id", itemId)

      if (deleteError) throw deleteError

      // Reajustar posições dos itens posteriores
      const { error: updateError } = await supabase
        .from("queue_items")
        .update({ position: supabase.sql`position - 1` })
        .eq("queue_id", queueId)
        .gt("position", itemToRemove.position)

      if (updateError) throw updateError
      await refreshQueues()
    } catch (error) {
      console.error("Erro ao remover pessoa:", error)
    }
  }

  const moveToEnd = async (queueId: string, itemId: string) => {
    if (user?.role !== "master") return

    try {
      // Buscar item atual
      const { data: currentItem } = await supabase.from("queue_items").select("*").eq("id", itemId).single()

      if (!currentItem || currentItem.position !== 1) return

      // Buscar maior posição na fila
      const { data: maxPositionData } = await supabase
        .from("queue_items")
        .select("position")
        .eq("queue_id", queueId)
        .order("position", { ascending: false })
        .limit(1)

      const maxPosition = maxPositionData?.[0]?.position || 1

      // Mover todos os outros itens uma posição para frente
      const { error: updateError } = await supabase
        .from("queue_items")
        .update({ position: supabase.sql`position - 1` })
        .eq("queue_id", queueId)
        .gt("position", 1)

      if (updateError) throw updateError

      // Mover o item atual para o fim
      const { error: moveError } = await supabase.from("queue_items").update({ position: maxPosition }).eq("id", itemId)

      if (moveError) throw moveError
      await refreshQueues()
    } catch (error) {
      console.error("Erro ao mover para o fim:", error)
    }
  }

  const approveRequest = async (queueId: string, itemId: string) => {
    if (user?.role !== "master") return

    try {
      const { error } = await supabase.from("queue_items").update({ status: "approved" }).eq("id", itemId)

      if (error) throw error
      await refreshQueues()
    } catch (error) {
      console.error("Erro ao aprovar solicitação:", error)
    }
  }

  const requestToJoinQueue = async (queueId: string) => {
    if (!user || user.role !== "user") return

    try {
      // Buscar próxima posição
      const { data: items } = await supabase
        .from("queue_items")
        .select("position")
        .eq("queue_id", queueId)
        .order("position", { ascending: false })
        .limit(1)

      const nextPosition = items && items.length > 0 ? items[0].position + 1 : 1

      const { error } = await supabase.from("queue_items").insert([
        {
          queue_id: queueId,
          name: user.name,
          position: nextPosition,
          status: "waiting",
          requested_by: user.id,
        },
      ])

      if (error) throw error
      await refreshQueues()
    } catch (error) {
      console.error("Erro ao solicitar entrada:", error)
    }
  }

  const createQueue = async (title: string) => {
    if (user?.role !== "master") return

    try {
      const { error } = await supabase.from("queues").insert([
        {
          title,
          created_by: user.id,
        },
      ])

      if (error) throw error
      await refreshQueues()
    } catch (error) {
      console.error("Erro ao criar fila:", error)
    }
  }

  const deleteQueue = async (queueId: string) => {
    if (user?.role !== "master") return

    try {
      const { error } = await supabase.from("queues").delete().eq("id", queueId)

      if (error) throw error
      await refreshQueues()
    } catch (error) {
      console.error("Erro ao deletar fila:", error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        queues,
        isLoginOpen,
        loading,
        login,
        signup,
        logout,
        openLogin,
        closeLogin,
        addPersonToQueue,
        removePersonFromQueue,
        moveToEnd,
        approveRequest,
        requestToJoinQueue,
        createQueue,
        deleteQueue,
        refreshQueues,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
