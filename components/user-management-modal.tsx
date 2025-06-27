"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"
import { Trash2, Shield, User, Crown } from "lucide-react"

interface UserManagementModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UserManagementModal({ isOpen, onClose }: UserManagementModalProps) {
  const { users, createUser, updateUser, updateUserRole, deleteUser } = useAuth()
  const [newUser, setNewUser] = useState({ name: "", username: "" })
  const [editingUser, setEditingUser] = useState<{ id: string; name: string; username: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!newUser.name.trim() || !newUser.username.trim()) {
      setError("Nome e username são obrigatórios")
      setLoading(false)
      return
    }

    if (newUser.username.includes(" ")) {
      setError("Username não pode conter espaços")
      setLoading(false)
      return
    }

    const success = await createUser(newUser.name.trim(), newUser.username.trim())
    if (success) {
      setNewUser({ name: "", username: "" })
    } else {
      setError("Erro ao criar usuário. Username pode já estar em uso.")
    }

    setLoading(false)
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    setLoading(true)
    setError("")

    if (!editingUser.name.trim() || !editingUser.username.trim()) {
      setError("Nome e username são obrigatórios")
      setLoading(false)
      return
    }

    if (editingUser.username.includes(" ")) {
      setError("Username não pode conter espaços")
      setLoading(false)
      return
    }

    const success = await updateUser(editingUser.id, editingUser.name.trim(), editingUser.username.trim())
    if (success) {
      setEditingUser(null)
    } else {
      setError("Erro ao atualizar usuário")
    }

    setLoading(false)
  }

  const handleRoleChange = async (userId: string, newRole: "master" | "user") => {
    setLoading(true)
    const success = await updateUserRole(userId, newRole)
    if (!success) {
      setError("Erro ao alterar permissão")
    }
    setLoading(false)
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (confirm(`Tem certeza que deseja excluir o usuário "${userName}"?`)) {
      setLoading(true)
      await deleteUser(userId)
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Usuários</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Criar Novo Usuário */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-3">Criar Novo Usuário</h3>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="new-name">Nome Completo</Label>
                  <Input
                    id="new-name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <Label htmlFor="new-username">Username</Label>
                  <Input
                    id="new-username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    placeholder="Username (sem espaços)"
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading} size="sm">
                {loading ? "Criando..." : "Criar Usuário"}
              </Button>
            </form>
            <p className="text-xs text-gray-500 mt-2">A senha padrão será o próprio username</p>
          </div>

          {/* Lista de Usuários */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-3">Usuários Existentes</h3>
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  {editingUser?.id === user.id ? (
                    <div className="flex-1 grid grid-cols-2 gap-2 mr-3">
                      <Input
                        value={editingUser.name}
                        onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                        placeholder="Nome"
                      />
                      <Input
                        value={editingUser.username}
                        onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                        placeholder="Username"
                      />
                    </div>
                  ) : (
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{user.name}</span>
                        <Badge variant={user.role === "master" ? "default" : "secondary"}>
                          {user.role === "master" ? (
                            <>
                              <Crown className="h-3 w-3 mr-1" />
                              Admin
                            </>
                          ) : (
                            <>
                              <User className="h-3 w-3 mr-1" />
                              Usuário
                            </>
                          )}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    {editingUser?.id === user.id ? (
                      <>
                        <Button onClick={handleUpdateUser} disabled={loading} size="sm" variant="outline">
                          Salvar
                        </Button>
                        <Button onClick={() => setEditingUser(null)} size="sm" variant="outline">
                          Cancelar
                        </Button>
                      </>
                    ) : (
                      <>
                        {/* Alterar Role */}
                        <Select
                          value={user.role}
                          onValueChange={(value: "master" | "user") => handleRoleChange(user.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-2" />
                                Usuário
                              </div>
                            </SelectItem>
                            <SelectItem value="master">
                              <div className="flex items-center">
                                <Crown className="h-4 w-4 mr-2" />
                                Admin
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Editar */}
                        <Button
                          onClick={() =>
                            setEditingUser({
                              id: user.id,
                              name: user.name,
                              username: user.username,
                            })
                          }
                          size="sm"
                          variant="outline"
                        >
                          <Shield className="h-4 w-4" />
                        </Button>

                        {/* Excluir */}
                        <Button
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
