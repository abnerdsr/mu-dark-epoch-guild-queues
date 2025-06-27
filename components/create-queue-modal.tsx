"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/components/auth-provider"

interface CreateQueueModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateQueueModal({ isOpen, onClose }: CreateQueueModalProps) {
  const { createQueue } = useAuth()
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!title.trim()) {
      setError("Título da fila é obrigatório")
      setLoading(false)
      return
    }

    try {
      await createQueue(title.trim())
      setTitle("")
      onClose()
    } catch (error) {
      setError("Erro ao criar fila")
    }

    setLoading(false)
  }

  const resetForm = () => {
    setTitle("")
    setError("")
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Nova Fila</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="queue-title">Título da Fila</Label>
            <Input
              id="queue-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Digite o título da fila"
              required
              autoFocus
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex space-x-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Criando..." : "Criar Fila"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
