"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { QueueCard } from "@/components/queue-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Users } from "lucide-react"
import { UserManagementModal } from "@/components/user-management-modal"

export function QueueGrid() {
  const { user, queues, createQueue, loading } = useAuth()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [newQueueTitle, setNewQueueTitle] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateQueue = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQueueTitle.trim()) return

    setIsCreating(true)
    await createQueue(newQueueTitle.trim())
    setNewQueueTitle("")
    setIsCreateModalOpen(false)
    setIsCreating(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando filas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header com botões do admin */}
      {user?.role === "master" && (
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Filas</h2>
          <div className="flex space-x-3">
            <Button onClick={() => setIsUserModalOpen(true)} variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Gerenciar Usuários
            </Button>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Fila
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Criar Nova Fila</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateQueue} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="queue-title">Nome da Fila</Label>
                    <Input
                      id="queue-title"
                      value={newQueueTitle}
                      onChange={(e) => setNewQueueTitle(e.target.value)}
                      placeholder="Ex: Fila de Atendimento"
                      required
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isCreating} className="flex-1">
                      {isCreating ? "Criando..." : "Criar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}

      {/* Grid de filas */}
      {queues.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma fila encontrada</h3>
          <p className="text-gray-600 mb-4">
            {user?.role === "master"
              ? "Crie sua primeira fila para começar a gerenciar atendimentos."
              : "Não há filas disponíveis no momento."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {queues.map((queue) => (
            <QueueCard key={queue.id} queue={queue} />
          ))}
        </div>
      )}

      {/* Modal de gerenciamento de usuários */}
      <UserManagementModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} />
    </div>
  )
}
