"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/components/auth-provider"
import { ApiRequestError } from "@/lib/api-client"

/**
 * Troca de senha obrigatória no primeiro login de usuários criados pelo master
 * (senha inicial = username). Não pode ser fechado; a única saída é trocar a
 * senha ou sair da conta.
 */
export function ForcePasswordChangeModal() {
  const { user, changePassword, logout } = useAuth()
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const isOpen = Boolean(user?.mustChangePassword)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres")
      return
    }
    if (password !== confirmation) {
      setError("As senhas não conferem")
      return
    }

    setLoading(true)
    try {
      await changePassword(password)
      setPassword("")
      setConfirmation("")
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Erro ao trocar a senha")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen}>
      <DialogContent
        className="sm:max-w-md mu-card-glow [&>button]:hidden"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="mu-text-glow">Crie sua senha</DialogTitle>
          <DialogDescription>
            Olá, {user?.name}! Sua conta foi criada com uma senha provisória. Escolha uma senha nova para continuar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">Nova senha</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo de 6 caracteres"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirme a nova senha</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex space-x-2">
            <Button type="button" variant="outline" onClick={() => logout()} className="flex-1 mu-button-glow">
              Sair
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 mu-button-glow">
              {loading ? "Salvando..." : "Salvar senha"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
