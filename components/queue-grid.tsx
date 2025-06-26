"use client"

import type React from "react"

import { useAuth } from "@/components/auth-provider"
import { QueueCard } from "@/components/queue-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Users } from "lucide-react"
import { useState } from "react"
import { UserManagementModal } from "@/components/user-management-modal"

export function QueueGrid() {
  const { user, queues, createQueue } = useAuth()
  const [newQueueTitle, setNewQueueTitle] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false)

  const handleCreateQueue = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQueueTitle.trim()) return

    await createQueue(newQueueTitle.trim())
    setNewQueueTitle("")
    setIsCreating(false)
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        {user?.role === "master" && (
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            {!isCreating ? (
              <>
                <Button onClick={() => setIsCreating(true)} className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Nova Fila</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsUserManagementOpen(true)}
                  className="flex items-center space-x-2"
                >
                  <Users className="h-4 w-4" />
                  <span>Gerenciar Usuários</span>
                </Button>
              </>
            ) : (
              <form onSubmit={handleCreateQueue} className="flex gap-2 w-full">
                <Input
                  value={newQueueTitle}
                  onChange={(e) => setNewQueueTitle(e.target.value)}
                  placeholder="Nome da nova fila"
                  className="flex-1"
                  autoFocus
                />
                <Button type="submit">Criar</Button>
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                  Cancelar
                </Button>
              </form>
            )}
          </div>
        )}

        {queues.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-medium mb-2">Nenhuma fila encontrada</h3>
              <p>
                {user?.role === "master"
                  ? "Crie sua primeira fila clicando no botão acima."
                  : "Aguarde o administrador criar as filas."}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {queues.map((queue) => (
              <QueueCard key={queue.id} queue={queue} />
            ))}
          </div>
        )}
      </div>

      <UserManagementModal isOpen={isUserManagementOpen} onClose={() => setIsUserManagementOpen(false)} />
    </>
  )
}
