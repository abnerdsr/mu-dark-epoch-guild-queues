"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/components/auth-provider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, Plus, Edit, Trash2, Shield, User } from "lucide-react"

interface UserManagementModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UserManagementModal({ isOpen, onClose }: UserManagementModalProps) {
  const { users, createUser, updateUser, updateUserRole, deleteUser } = useAuth()
  const [isCreating, setIsCreating] = useState(false)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    username: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!formData.name.trim() || !formData.username.trim()) {
      setError("Nome e username são obrigatórios")
      return
    }

    if (formData.username.includes(" ")) {
      setError("Username não pode conter espaços")
      return
    }

    setLoading(true)
    const result = await createUser(formData.name.trim(), formData.username.trim())

    if (result) {
      setSuccess("Usuário criado com sucesso! Senha padrão: username")
      setFormData({ name: "", username: "" })
      setIsCreating(false)
      setTimeout(() => setSuccess(""), 3000)
    } else {
      setError("Erro ao criar usuário. Username pode já existir.")
    }
    setLoading(false)
  }

  const handleUpdateUser = async (userId: string) => {
    setError("")
    setSuccess("")

    if (!formData.name.trim() || !formData.username.trim()) {
      setError("Nome e username são obrigatórios")
      return
    }

    if (formData.username.includes(" ")) {
      setError("Username não pode conter espaços")
      return
    }

    setLoading(true)
    const result = await updateUser(userId, formData.name.trim(), formData.username.trim())

    if (result) {
      setSuccess("Usuário atualizado com sucesso!")
      setEditingUser(null)
      setFormData({ name: "", username: "" })
      setTimeout(() => setSuccess(""), 3000)
    } else {
      setError("Erro ao atualizar usuário")
    }
    setLoading(false)
  }

  const handleUpdateRole = async (userId: string, newRole: "master" | "user") => {
    setError("")
    setSuccess("")

    setLoading(true)
    const result = await updateUserRole(userId, newRole)

    if (result) {
      setSuccess(`Permissão alterada para ${newRole === "master" ? "Admin" : "Usuário"}!`)
      setTimeout(() => setSuccess(""), 3000)
    } else {
      setError("Erro ao alterar permissão")
    }
    setLoading(false)
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return

    setError("")
    setSuccess("")

    setLoading(true)
    await deleteUser(userId)
    setSuccess("Usuário excluído com sucesso!")
    setTimeout(() => setSuccess(""), 3000)
    setLoading(false)
  }

  const startEdit = (user: any) => {
    setEditingUser(user.id)
    setFormData({
      name: user.name,
      username: user.username,
    })
    setIsCreating(false)
  }

  const cancelEdit = () => {
    setEditingUser(null)
    setIsCreating(false)
    setFormData({ name: "", username: "" })
    setError("")
  }

  const handleClose = () => {
    cancelEdit()
    setSuccess("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Gerenciar Usuários</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Botão para criar novo usuário */}
          {!isCreating && !editingUser && (
            <Button onClick={() => setIsCreating(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Criar Novo Usuário
            </Button>
          )}

          {/* Formulário de criação/edição */}
          {(isCreating || editingUser) && (
            <form
              onSubmit={
                isCreating
                  ? handleCreateUser
                  : (e) => {
                      e.preventDefault()
                      if (editingUser) handleUpdateUser(editingUser)
                    }
              }
              className="space-y-4 p-4 border rounded-lg bg-gray-50"
            >
              <h3 className="font-medium">{isCreating ? "Criar Novo Usuário" : "Editar Usuário"}</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user-name">Nome Completo</Label>
                  <Input
                    id="user-name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user-username">Username</Label>
                  <Input
                    id="user-username"
                    value={formData.username}
                    onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {isCreating && <p className="text-xs text-gray-500">A senha padrão será o mesmo valor do username</p>}

              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={cancelEdit} className="flex-1 bg-transparent">
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Salvando..." : isCreating ? "Criar" : "Salvar"}
                </Button>
              </div>
            </form>
          )}

          {/* Mensagens de erro e sucesso */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Lista de usuários */}
          <div className="space-y-2">
            <h3 className="font-medium">Usuários Cadastrados</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {user.role === "master" ? (
                        <Shield className="h-4 w-4 text-blue-600" />
                      ) : (
                        <User className="h-4 w-4 text-gray-600" />
                      )}
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-500">@{user.username}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Select para alterar role */}
                    <Select
                      value={user.role}
                      onValueChange={(value: "master" | "user") => handleUpdateRole(user.id, value)}
                      disabled={loading}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Usuário</SelectItem>
                        <SelectItem value="master">Admin</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button onClick={() => startEdit(user)} variant="outline" size="sm" disabled={loading}>
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      onClick={() => handleDeleteUser(user.id)}
                      variant="outline"
                      size="sm"
                      disabled={loading}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
