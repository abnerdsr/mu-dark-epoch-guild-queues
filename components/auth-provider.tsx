"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import { hashPassword, verifyPassword } from "@/lib/password-utils"

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
  users: AuthUser[]
  isLoginOpen: boolean
  loading: boolean
  login: (username: string, password: string) => Promise<boolean>
  signup: (name: string, username: string, password: string) => Promise<boolean>
  logout: () => void
  openLogin: () => void
  closeLogin: () => void
  addPersonToQueue: (queueId: string, userId: string) => Promise<void>
  removePersonFromQueue: (queueId: string, itemId: string) => Promise<void>
  moveToEnd: (queueId: string, itemId: string) => Promise<void>
  approveRequest: (queueId: string, itemId: string) => Promise<void>
  requestToJoinQueue: (queueId: string) => Promise<boolean>
  createQueue: (title: string) => Promise<void>
  deleteQueue: (queueId: string) => Promise<void>
  refreshQueues: () => Promise<void>
  refreshUsers: () => Promise<void>
  updateProfile: (name: string, password: string) => Promise<boolean>
  createUser: (name: string, username: string) => Promise<boolean>
  updateUser: (userId: string, name: string, username: string) => Promise<boolean>
  deleteUser: (userId: string) => Promise<void>
  canJoinQueue: (queueId: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [queues, setQueues] = useState<QueueWithItems[]>([])
  const [users, setUsers] = useState<AuthUser[]>([])
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
      await refreshUsers()
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

  const refreshUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, username, name, role, created_at")
        .order("created_at", { ascending: true })

      if (error) throw error

      const usersData: AuthUser[] = (data || []).map((user) => ({
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
      }))

      setUsers(usersData)
    } catch (error) {
      console.error("Erro ao carregar usuários:", error)
    }
  }

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.from("users").select("*").eq("username", username).single()

      if (error || !data) {
        return false
      }

      // Verificar senha com hash
      if (!verifyPassword(password, data.password)) {
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
      await refreshUsers()
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

      const hashedPassword = hashPassword(password)

      const { data, error } = await supabase
        .from("users")
        .insert([
          {
            name,
            username,
            password: hashedPassword,
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
      await refreshUsers()
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

  const addPersonToQueue = async (queueId: string, userId: string) => {
    if (user?.role !== "master") return

    try {
      // Verificar se a pessoa já está na fila
      const { data: existingItem } = await supabase
        .from("queue_items")
        .select("id")
        .eq("queue_id", queueId)
        .eq("requested_by", userId)
        .single()

      if (existingItem) {
        throw new Error("Pessoa já está nesta fila")
      }

      // Buscar dados do usuário
      const { data: userData } = await supabase.from("users").select("name").eq("id", userId).single()

      if (!userData) throw new Error("Usuário não encontrado")

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
          name: userData.name,
          position: nextPosition,
          status: "approved",
          requested_by: userId,
        },
      ])

      if (error) throw error
      await refreshQueues()
    } catch (error) {
      console.error("Erro ao adicionar pessoa:", error)
      throw error
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

      // Buscar todos os itens posteriores para reordenar
      const { data: itemsToUpdate } = await supabase
        .from("queue_items")
        .select("id, position")
        .eq("queue_id", queueId)
        .gt("position", itemToRemove.position)

      if (itemsToUpdate) {
        for (const item of itemsToUpdate) {
          await supabase
            .from("queue_items")
            .update({ position: item.position - 1 })
            .eq("id", item.id)
        }
      }

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

      // Buscar todos os outros itens para reordenar
      const { data: otherItems } = await supabase
        .from("queue_items")
        .select("id, position")
        .eq("queue_id", queueId)
        .gt("position", 1)

      // Mover todos os outros itens uma posição para frente
      if (otherItems) {
        for (const item of otherItems) {
          await supabase
            .from("queue_items")
            .update({ position: item.position - 1 })
            .eq("id", item.id)
        }
      }

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

  const canJoinQueue = (queueId: string): boolean => {
    if (!user || user.role !== "user") return false

    // Verificar se o usuário já está em alguma fila desta queue
    const queue = queues.find((q) => q.id === queueId)
    if (!queue) return false

    return !queue.items.some((item) => item.requestedBy === user.id)
  }

  const requestToJoinQueue = async (queueId: string): Promise<boolean> => {
    if (!user || user.role !== "user") return false

    try {
      // Verificar se já está na fila
      if (!canJoinQueue(queueId)) {
        return false
      }

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
      return true
    } catch (error) {
      console.error("Erro ao solicitar entrada:", error)
      return false
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

  const updateProfile = async (name: string, password: string): Promise<boolean> => {
    if (!user) return false

    try {
      const hashedPassword = hashPassword(password)
      const { error } = await supabase.from("users").update({ name, password: hashedPassword }).eq("id", user.id)

      if (error) throw error

      // Atualizar usuário local
      const updatedUser = { ...user, name }
      setUser(updatedUser)
      localStorage.setItem("currentUser", JSON.stringify(updatedUser))

      await refreshUsers()
      return true
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error)
      return false
    }
  }

  const createUser = async (name: string, username: string): Promise<boolean> => {
    if (user?.role !== "master") return false

    try {
      const hashedPassword = hashPassword(username) // Senha padrão é o username
      const { error } = await supabase.from("users").insert([
        {
          name,
          username,
          password: hashedPassword,
          role: "user",
        },
      ])

      if (error) throw error
      await refreshUsers()
      return true
    } catch (error) {
      console.error("Erro ao criar usuário:", error)
      return false
    }
  }

  const updateUser = async (userId: string, name: string, username: string): Promise<boolean> => {
    if (user?.role !== "master") return false

    try {
      const { error } = await supabase.from("users").update({ name, username }).eq("id", userId)

      if (error) throw error
      await refreshUsers()
      return true
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error)
      return false
    }
  }

  const deleteUser = async (userId: string) => {
    if (user?.role !== "master") return

    try {
      const { error } = await supabase.from("users").delete().eq("id", userId)

      if (error) throw error
      await refreshUsers()
    } catch (error) {
      console.error("Erro ao deletar usuário:", error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        queues,
        users,
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
        refreshUsers,
        updateProfile,
        createUser,
        updateUser,
        deleteUser,
        canJoinQueue,
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
