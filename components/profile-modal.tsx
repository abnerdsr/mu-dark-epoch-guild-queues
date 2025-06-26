"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth-provider"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, updateProfile } = useAuth()
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  // Atualizar dados quando o modal abrir ou usuário mudar
  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        name: user.name,
        username: user.username,
        password: "",
      })
    }
  }, [user, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    if (!formData.name.trim()) {
      setError("Nome é obrigatório")
      setLoading(false)
      return
    }

    if (!formData.password) {
      setError("Senha é obrigatória")
      setLoading(false)
      return
    }

    const result = await updateProfile(formData.name.trim(), formData.password)
    if (result) {
      setSuccess("Perfil atualizado com sucesso!")
      setFormData((prev) => ({ ...prev, password: "" }))
      setTimeout(() => {
        onClose()
        setSuccess("")
      }, 2000)
    } else {
      setError("Erro ao atualizar perfil")
    }
    setLoading(false)
  }

  const handleClose = () => {
    setFormData({
      name: user?.name || "",
      username: user?.username || "",
      password: "",
    })
    setError("")
    setSuccess("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Nome Completo</Label>
            <Input
              id="profile-name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-username">Nome de Usuário</Label>
            <Input
              id="profile-username"
              value={formData.username}
              disabled
              className="bg-gray-100 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500">Nome de usuário não pode ser alterado</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-password">Nova Senha</Label>
            <Input
              id="profile-password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Digite sua nova senha"
              required
            />
          </div>

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

          <div className="flex space-x-2">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1 bg-transparent">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
