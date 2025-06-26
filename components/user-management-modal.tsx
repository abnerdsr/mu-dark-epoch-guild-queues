"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth-provider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, Edit, Plus, User } from "lucide-react"

interface UserManagementModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UserManagementModal({ isOpen, onClose }: UserManagementModalProps) {
  const { users, createUser, updateUser, deleteUser, refreshUsers } = useAuth()
  const [isCreating, setIsCreating] = useState(false)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: "", username: "" })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      refreshUsers()
    }
  }, [isOpen, refreshUsers])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    if (!formData.name.trim() || !formData.username.trim()) {
      setError("Nome e nome de usuário são obrigatórios")
      setLoading(false)
      return
    }

    if (formData.username.includes(" ")) {
      setError("Nome de usuário não pode conter espaços")
      setLoading(false)
      return
    }

    const result = await createUser(formData.name.trim(), formData.username.trim())
    if (result) {
      setSuccess("Usuário criado com sucesso!")
      setFormData({ name: "", username: "" })
      setIsCreating(false)
      setTimeout(() => setSuccess(""), 3000)
    } else {
      setError("Erro ao criar usuário. Nome de usuário pode já existir.")
    }
    setLoading(false)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    setError("")
    setSuccess("")
    setLoading(true)

    if (!formData.name.trim() || !formData.username.trim()) {
      setError("Nome e nome de usuário são obrigatórios")
      setLoading(false)
      return
    }

    if (formData.username.includes(" ")) {
      setError("Nome de usuário não pode conter espaços")
      setLoading(false)
      return
    }

    const result = await updateUser(editingUser, formData.name.trim(), formData.username.trim())
    if (result) {
      setSuccess("Usuário atualizado com sucesso!")
      setFormData({ name: "", username: "" })
      setEditingUser(null)
      setTimeout(() => setSuccess(""), 3000)
    } else {
      setError("Erro ao atualizar usuário. Nome de usuário pode já existir.")
    }
    setLoading(false)
  }

  const handleDelete = async (userId: string) => {
    if (confirm("Tem certeza que deseja excluir este usuário?")) {
      await deleteUser(userId)
      setSuccess("Usuário excluído com sucesso!")
      setTimeout(() => setSuccess(""), 3000)
    }
  }

  const startEdit = (user: any) => {
    setEditingUser(user.id)
    setFormData({ name: user.name, username: user.username })
    setIsCreating(false)
  }

  const cancelEdit = () => {
    setEditingUser(null)
    setIsCreating(false)
    setFormData({ name: "", username: "" })
    setError("")
  }

  const startCreate = () => {
    setIsCreating(true)
    setEditingUser(null)
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
            <User className="h-5 w-5" />
            <span>Gerenciar Usuários</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Botão Criar Usuário */}
          {!isCreating && !editingUser && (
            <Button onClick={startCreate} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Criar Novo Usuário
            </Button>
          )}

          {/* Formulário de Criação/Edição */}
          {(isCreating || editingUser) && (
            <form onSubmit={isCreating ? handleCreate : handleUpdate} className="space-y-4 p-4 border rounded-lg">
              <h3 className="font-medium">{isCreating ? "Criar Usuário" : "Editar Usuário"}</h3>

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
                <Label htmlFor="user-username">Nome de Usuário</Label>
                <Input
                  id="user-username"
                  value={formData.username}
                  onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                  placeholder="Sem espaços"
                  required
                />
              </div>

              {isCreating && (
                <p className="text-xs text-gray-500">
                  A senha padrão será o nome de usuário. O usuário pode alterá-la depois.
                </p>
              )}

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

          {/* Mensagens */}
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

          {/* Lista de Usuários */}
          <div className="space-y-2">
            <h3 className="font-medium">Usuários Cadastrados</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {users
                .filter((user) => user.role !== "master")
                .map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(user)}
                        disabled={editingUser === user.id}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <Button variant="outline" onClick={handleClose} className="w-full bg-transparent">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
