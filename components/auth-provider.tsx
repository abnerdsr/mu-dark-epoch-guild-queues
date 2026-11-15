"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { api, ApiRequestError } from "@/lib/api-client"
import type { AuthUser, ListedUser, QueueWithItems } from "@/lib/types"

// Estado global do app. Todas as operações passam pelas rotas em app/api,
// que validam a sessão (cookie httpOnly) e as permissões no servidor.

interface AuthContextType {
  user: AuthUser | null
  queues: QueueWithItems[]
  users: ListedUser[]
  isLoginOpen: boolean
  loading: boolean
  login: (username: string, password: string) => Promise<boolean>
  signup: (name: string, username: string, password: string) => Promise<string | null>
  logout: () => Promise<void>
  openLogin: () => void
  closeLogin: () => void
  changePassword: (newPassword: string) => Promise<void>
  addPersonToQueue: (queueId: string, userId: string) => Promise<void>
  removePersonFromQueue: (queueId: string, itemId: string) => Promise<void>
  moveToEnd: (queueId: string, itemId: string) => Promise<void>
  changePosition: (queueId: string, itemId: string, newPosition: number) => Promise<void>
  approveRequest: (queueId: string, itemId: string) => Promise<void>
  requestToJoinQueue: (queueId: string) => Promise<boolean>
  createQueue: (title: string) => Promise<void>
  deleteQueue: (queueId: string) => Promise<void>
  updateQueueTitle: (queueId: string, newTitle: string) => Promise<void>
  updateQueueDetails: (
    queueId: string,
    details: { title?: string; item_name?: string; image_url?: string | null }
  ) => Promise<void>
  refreshQueues: () => Promise<void>
  refreshUsers: () => Promise<void>
  updateProfile: (name: string, password: string) => Promise<boolean>
  createUser: (name: string, username: string) => Promise<boolean>
  updateUser: (userId: string, name: string, username: string) => Promise<boolean>
  updateUserRole: (userId: string, role: "master" | "user") => Promise<boolean>
  deleteUser: (userId: string) => Promise<void>
  canJoinQueue: (queueId: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [queues, setQueues] = useState<QueueWithItems[]>([])
  const [users, setUsers] = useState<ListedUser[]>([])
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const refreshQueues = useCallback(async () => {
    try {
      const data = await api<{ queues: QueueWithItems[] }>("GET", "/api/queues")
      setQueues(data.queues)
    } catch (error) {
      console.error("Erro ao carregar filas:", error)
    }
  }, [])

  const refreshUsers = useCallback(async () => {
    try {
      const data = await api<{ users: ListedUser[] }>("GET", "/api/users")
      setUsers(data.users)
    } catch (error) {
      console.error("Erro ao carregar usuários:", error)
    }
  }, [])

  useEffect(() => {
    const initialize = async () => {
      // Sessão antiga (inseguro) ficava no localStorage; não é mais usada.
      try {
        localStorage.removeItem("currentUser")
      } catch {}

      try {
        const [me] = await Promise.all([
          api<{ user: AuthUser | null }>("GET", "/api/auth/me"),
          refreshQueues(),
          refreshUsers(),
        ])
        setUser(me.user)
      } catch (error) {
        console.error("Erro ao inicializar:", error)
      } finally {
        setLoading(false)
      }
    }
    initialize()
  }, [refreshQueues, refreshUsers])

  /** Trata erros comuns de sessão vindos da API. */
  const handleApiError = (error: unknown, context: string) => {
    if (error instanceof ApiRequestError) {
      if (error.code === "UNAUTHORIZED") {
        setUser(null)
        setIsLoginOpen(true)
      } else if (error.code === "PASSWORD_CHANGE_REQUIRED") {
        setUser((current) => (current ? { ...current, mustChangePassword: true } : current))
      }
    }
    console.error(`${context}:`, error)
  }

  /** Executa uma ação e recarrega as filas. Erros são registrados e (opcionalmente) repassados. */
  const runQueueAction = async (context: string, action: () => Promise<unknown>, rethrow = false) => {
    try {
      await action()
      await refreshQueues()
    } catch (error) {
      handleApiError(error, context)
      if (rethrow) throw error
    }
  }

  const afterLogin = async (authUser: AuthUser) => {
    setUser(authUser)
    setIsLoginOpen(false)
    await Promise.all([refreshQueues(), refreshUsers()])
  }

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const data = await api<{ user: AuthUser }>("POST", "/api/auth/login", { username, password })
      await afterLogin(data.user)
      return true
    } catch (error) {
      console.error("Erro no login:", error)
      return false
    }
  }

  /** Retorna null em caso de sucesso ou a mensagem de erro. */
  const signup = async (name: string, username: string, password: string): Promise<string | null> => {
    try {
      const data = await api<{ user: AuthUser }>("POST", "/api/auth/signup", { name, username, password })
      await afterLogin(data.user)
      return null
    } catch (error) {
      console.error("Erro no cadastro:", error)
      return error instanceof ApiRequestError ? error.message : "Erro ao criar conta"
    }
  }

  const logout = async () => {
    try {
      await api("POST", "/api/auth/logout")
    } catch (error) {
      console.error("Erro ao sair:", error)
    }
    setUser(null)
    await refreshUsers()
  }

  const changePassword = async (newPassword: string) => {
    const data = await api<{ user: AuthUser }>("POST", "/api/auth/password", { newPassword })
    setUser(data.user)
    await refreshUsers()
  }

  const openLogin = () => setIsLoginOpen(true)
  const closeLogin = () => setIsLoginOpen(false)

  const addPersonToQueue = (queueId: string, userId: string) =>
    runQueueAction("Erro ao adicionar pessoa", () => api("POST", `/api/queues/${queueId}/items`, { userId }), true)

  const removePersonFromQueue = (queueId: string, itemId: string) =>
    runQueueAction("Erro ao remover pessoa", () => api("DELETE", `/api/queues/${queueId}/items/${itemId}`))

  const moveToEnd = (queueId: string, itemId: string) =>
    runQueueAction("Erro ao mover para o fim", () =>
      api("PATCH", `/api/queues/${queueId}/items/${itemId}`, { action: "move-to-end" })
    )

  const changePosition = (queueId: string, itemId: string, newPosition: number) =>
    runQueueAction("Erro ao alterar posição", () =>
      api("PATCH", `/api/queues/${queueId}/items/${itemId}`, { action: "change-position", position: newPosition })
    )

  const approveRequest = (queueId: string, itemId: string) =>
    runQueueAction("Erro ao aprovar solicitação", () =>
      api("PATCH", `/api/queues/${queueId}/items/${itemId}`, { action: "approve" })
    )

  const canJoinQueue = (queueId: string): boolean => {
    if (!user) return false
    const queue = queues.find((q) => q.id === queueId)
    if (!queue) return false
    return !queue.items.some((item) => item.requestedBy === user.id)
  }

  const requestToJoinQueue = async (queueId: string): Promise<boolean> => {
    if (!user || !canJoinQueue(queueId)) return false
    try {
      await api("POST", `/api/queues/${queueId}/join`)
      await refreshQueues()
      return true
    } catch (error) {
      handleApiError(error, "Erro ao solicitar entrada")
      return false
    }
  }

  const createQueue = (title: string) =>
    runQueueAction("Erro ao criar fila", () => api("POST", "/api/queues", { title }))

  const deleteQueue = (queueId: string) =>
    runQueueAction("Erro ao deletar fila", () => api("DELETE", `/api/queues/${queueId}`))

  const updateQueueTitle = (queueId: string, newTitle: string) =>
    runQueueAction("Erro ao atualizar título da fila", () =>
      api("PATCH", `/api/queues/${queueId}`, { title: newTitle })
    )

  const updateQueueDetails = (
    queueId: string,
    details: { title?: string; item_name?: string; image_url?: string | null }
  ) =>
    runQueueAction(
      "Erro ao atualizar detalhes da fila",
      () => api("PATCH", `/api/queues/${queueId}`, details),
      true
    )

  const updateProfile = async (name: string, password: string): Promise<boolean> => {
    try {
      const data = await api<{ user: AuthUser }>("PATCH", "/api/profile", { name, password: password || undefined })
      setUser(data.user)
      await refreshUsers()
      return true
    } catch (error) {
      handleApiError(error, "Erro ao atualizar perfil")
      return false
    }
  }

  /** Executa uma ação de gerenciamento de usuários e recarrega a lista. */
  const runUserAction = async (context: string, action: () => Promise<unknown>): Promise<boolean> => {
    try {
      await action()
      await refreshUsers()
      return true
    } catch (error) {
      handleApiError(error, context)
      return false
    }
  }

  const createUser = (name: string, username: string) =>
    runUserAction("Erro ao criar usuário", () => api("POST", "/api/users", { name, username }))

  const updateUser = (userId: string, name: string, username: string) =>
    runUserAction("Erro ao atualizar usuário", () => api("PATCH", `/api/users/${userId}`, { name, username }))

  const updateUserRole = (userId: string, role: "master" | "user") =>
    runUserAction("Erro ao atualizar role do usuário", () => api("PATCH", `/api/users/${userId}`, { role }))

  const deleteUser = async (userId: string) => {
    await runUserAction("Erro ao deletar usuário", () => api("DELETE", `/api/users/${userId}`))
    await refreshQueues()
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
        changePassword,
        addPersonToQueue,
        removePersonFromQueue,
        moveToEnd,
        changePosition,
        approveRequest,
        requestToJoinQueue,
        createQueue,
        deleteQueue,
        updateQueueTitle,
        updateQueueDetails,
        refreshQueues,
        refreshUsers,
        updateProfile,
        createUser,
        updateUser,
        updateUserRole,
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
