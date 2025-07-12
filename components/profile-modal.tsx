"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/components/auth-provider"
import { Eye, EyeOff } from "lucide-react"

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, updateProfile } = useAuth()
  const [name, setName] = useState(user?.name || "")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    if (!name.trim()) {
      setError("Nome é obrigatório")
      setLoading(false)
      return
    }

    if (!password.trim()) {
      setError("Senha é obrigatória")
      setLoading(false)
      return
    }

    const success = await updateProfile(name.trim(), password)
    if (success) {
      setSuccess(true)
      setPassword("")
      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 2000)
    } else {
      setError("Erro ao atualizar perfil")
    }

    setLoading(false)
  }

  const resetForm = () => {
    setName(user?.name || "")
    setPassword("")
    setError("")
    setSuccess(false)
    setShowPassword(false)
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
          resetForm()
        }
      }}
    >
      <DialogContent className="sm:max-w-md mu-card-glow">
        <DialogHeader>
          <DialogTitle className="mu-text-glow">Editar Perfil</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Nome Completo</Label>
            <Input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite seu nome completo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-username">Username</Label>
            <Input id="profile-username" type="text" value={user?.username || ""} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">Username não pode ser alterado</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-password">Nova Senha</Label>
            <div className="relative">
              <Input
                id="profile-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite uma nova senha"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground hover:text-foreground mu-button-glow"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-400">Perfil atualizado com sucesso!</p>}

          <div className="flex space-x-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 mu-button-glow">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 mu-button-glow">
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
