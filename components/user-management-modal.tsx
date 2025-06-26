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
import { Badge } from "@/components/ui/badge"

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
      setError("Todos os campos são obrigatórios")
      setLoading(false)
      return
    }

    if (formData.username.includes(" ")) {
      setError("Nome de usuário não pode conter espaços")
      setLoading(false)
      return
    }

    const success = await createUser(formData.name.trim(), formData.username.trim())
    if (success) {
      setSuccess("Usuário criado com sucesso! Senha padrão: " + formData.username)
      setFormData({ name: "", username: "" })
      setIsCreating(false)
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
      setError("Todos os campos são obrigatórios")
      setLoading(false)
      return
    }

    if (formData.username.includes(" ")) {
      setError("Nome de usuário não pode conter espaços")
      setLoading(false)
      return
    }

    const success = await updateUser(editingUser, formData.name.trim(), formData.username.trim())
    if (success) {
      setSuccess("Usuário atualizado com sucesso!")
      setFormData({ name: "", username: "" })
      setEditingUser(null)
    } else {
      setError("Erro ao atualizar usuário. Nome de usuário pode já existir.")
    }
    setLoading(false)
  }

  const handleDelete = async (userId: string) => {
    if (confirm("Tem certeza que deseja excluir este usuário?")) {
      await deleteUser(userId)
      setSuccess("Usuário excluído com sucesso!")
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

  const handleClose = () => {
    cancelEdit()
    setSuccess("")
    onClose()
  }

  const regularUsers = users.filter((user) => user.role === "user")

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Usuários</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Botão para criar novo usuário */}
          {!isCreating && !editingUser && (
            <Button onClick={() => setIsCreating(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          )}

          {/* Formulário de criação/edição */}
          {(isCreating || editingUser) && (
            <form onSubmit={isCreating ? handleCreate : handleUpdate} className="space-y-4 p-4 border rounded-lg">
              <h3 className="font-medium">{isCreating ? "Criar Usuário" : "Editar Usuário"}</h3>

              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: João Silva"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Nome de Usuário</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value.toLowerCase().trim() }))}
                  placeholder="Ex: joaosilva (sem espaços)"
                  required
                />
              </div>

              {isCreating && (
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  <p>
                    <strong>Senha padrão:</strong> Será o mesmo que o nome de usuário
                  </p>
                  <p>O usuário poderá alterar a senha após o primeiro login</p>
                </div>
              )}

              <div className="flex space-x-2">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Salvando..." : isCreating ? "Criar" : "Salvar"}
                </Button>
                <Button type="button" variant="outline" onClick={cancelEdit} className="flex-1 bg-transparent">
                  Cancelar
                </Button>
              </div>
            </form>
          )}

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
            <h3 className="font-medium">Usuários Cadastrados ({regularUsers.length})</h3>

            {regularUsers.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Nenhum usuário cadastrado</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {regularUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <User className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-500">@{user.username}</p>
                      </div>
                      <Badge variant="secondary">Usuário</Badge>
                    </div>

                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(user)}
                        className="h-8 w-8 p-0"
                        title="Editar usuário"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(user.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        title="Excluir usuário"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
