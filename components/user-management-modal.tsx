"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth-provider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Trash2, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface UserManagementModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UserManagementModal({ isOpen, onClose }: UserManagementModalProps) {
  const { users, createUser, updateUser, deleteUser } = useAuth()
  const [isCreating, setIsCreating] = useState(false)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: "", username: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const validateUsername = (username: string) => {
    if (username.includes(" ")) {
      return "Nome de usuário não pode conter espaços"
    }
    if (username.length < 3) {
      return "Nome de usuário deve ter pelo menos 3 caracteres"
    }
    return ""
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!formData.name || !formData.username) {
      setError("Todos os campos são obrigatórios")
      setLoading(false)
      return
    }

    const usernameError = validateUsername(formData.username)
    if (usernameError) {
      setError(usernameError)
      setLoading(false)
      return
    }

    const success = await createUser(formData.name, formData.username)
    if (success) {
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
    setLoading(true)

    if (!formData.name || !formData.username) {
      setError("Todos os campos são obrigatórios")
      setLoading(false)
      return
    }

    const usernameError = validateUsername(formData.username)
    if (usernameError) {
      setError(usernameError)
      setLoading(false)
      return
    }

    const success = await updateUser(editingUser, formData.name, formData.username)
    if (success) {
      setEditingUser(null)
      setFormData({ name: "", username: "" })
    } else {
      setError("Erro ao atualizar usuário. Nome de usuário pode já existir.")
    }
    setLoading(false)
  }

  const handleDelete = async (userId: string) => {
    if (confirm("Tem certeza que deseja excluir este usuário?")) {
      await deleteUser(userId)
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

  const regularUsers = users.filter((user) => user.role !== "master")

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Usuários</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Formulário de Criação/Edição */}
          {(isCreating || editingUser) && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-medium mb-3">{isCreating ? "Criar Novo Usuário" : "Editar Usuário"}</h3>
              <form onSubmit={isCreating ? handleCreate : handleUpdate} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="user-name">Nome Completo</Label>
                    <Input
                      id="user-name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: João Silva"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="user-username">Nome de Usuário</Label>
                    <Input
                      id="user-username"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, username: e.target.value.toLowerCase().trim() }))
                      }
                      placeholder="Ex: joaosilva"
                      required
                    />
                  </div>
                </div>

                {isCreating && (
                  <p className="text-sm text-gray-600">
                    A senha padrão será o próprio nome de usuário. O usuário pode alterá-la depois.
                  </p>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex space-x-2">
                  <Button type="button" variant="outline" onClick={cancelEdit}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Salvando..." : isCreating ? "Criar" : "Atualizar"}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Botão Criar Novo */}
          {!isCreating && !editingUser && (
            <Button
              onClick={() => {
                setIsCreating(true)
                setFormData({ name: "", username: "" })
                setError("")
              }}
              className="mb-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          )}

          {/* Tabela de Usuários */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regularUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                      Nenhum usuário cadastrado
                    </TableCell>
                  </TableRow>
                ) : (
                  regularUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>@{user.username}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">Usuário</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => startEdit(user)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(user.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
