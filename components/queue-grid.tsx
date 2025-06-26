"use client"

import { useAuth } from "@/components/auth-provider"
import { QueueCard } from "@/components/queue-card"

// Adicionar estado e função para criar nova fila
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"

export function QueueGrid() {
  const { queues, user, createQueue } = useAuth()
  const [isCreating, setIsCreating] = useState(false)
  const [newQueueTitle, setNewQueueTitle] = useState("")

  const handleCreateQueue = () => {
    if (newQueueTitle.trim()) {
      createQueue(newQueueTitle.trim())
      setNewQueueTitle("")
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Botão para criar nova fila - só para admin */}
      {user?.role === "master" && (
        <div className="flex justify-end">
          {!isCreating ? (
            <Button onClick={() => setIsCreating(true)} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Nova Fila</span>
            </Button>
          ) : (
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Nome da fila"
                value={newQueueTitle}
                onChange={(e) => setNewQueueTitle(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleCreateQueue()
                  }
                }}
                className="w-64"
              />
              <Button onClick={handleCreateQueue}>Criar</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreating(false)
                  setNewQueueTitle("")
                }}
              >
                Cancelar
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {queues.map((queue) => (
          <QueueCard key={queue.id} queue={queue} />
        ))}
      </div>
    </div>
  )
}
