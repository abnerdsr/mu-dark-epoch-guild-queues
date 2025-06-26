"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/components/auth-provider"
import { Plus, Trash2, MoreVertical, RotateCcw, Check, X } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface QueueCardProps {
  queue: {
    id: string
    title: string
    items: Array<{
      id: string
      name: string
      position: number
      status: "waiting" | "approved" | "completed"
      requestedBy: string
    }>
  }
}

export function QueueCard({ queue }: QueueCardProps) {
  const {
    user,
    users,
    addPersonToQueue,
    removePersonFromQueue,
    moveToEnd,
    approveRequest,
    requestToJoinQueue,
    deleteQueue,
    canJoinQueue,
  } = useAuth()
  const [newPersonName, setNewPersonName] = useState("")
  const [selectedUserId, setSelectedUserId] = useState("")
  const [isAdding, setIsAdding] = useState(false)

  const approvedItems = queue.items.filter((item) => item.status === "approved").sort((a, b) => a.position - b.position)
  const waitingItems = queue.items.filter((item) => item.status === "waiting").sort((a, b) => a.position - b.position)

  const handleAddPerson = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId) return

    try {
      await addPersonToQueue(queue.id, selectedUserId)
      setSelectedUserId("")
      setIsAdding(false)
    } catch (error) {
      alert("Erro ao adicionar pessoa: " + (error as Error).message)
    }
  }

  const handleRequestJoin = async () => {
    const success = await requestToJoinQueue(queue.id)
    if (!success) {
      alert("Você já está nesta fila ou ocorreu um erro.")
    }
  }

  const handleDeleteQueue = async () => {
    if (confirm(`Tem certeza que deseja excluir a fila "${queue.title}"?`)) {
      await deleteQueue(queue.id)
    }
  }

  // Filtrar usuários disponíveis (que não estão na fila)
  const availableUsers = users.filter(
    (u) => u.role === "user" && !queue.items.some((item) => item.requestedBy === u.id),
  )

  return (
    <Card className="h-fit">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">{queue.title}</CardTitle>
        {user?.role === "master" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDeleteQueue} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Fila
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Botão de solicitação para usuário comum */}
        {user?.role === "user" && (
          <Button
            onClick={handleRequestJoin}
            disabled={!canJoinQueue(queue.id)}
            className="w-full"
            variant={canJoinQueue(queue.id) ? "default" : "secondary"}
          >
            <Plus className="h-4 w-4 mr-2" />
            {canJoinQueue(queue.id) ? "Solicitar Entrada" : "Já está na fila"}
          </Button>
        )}

        {/* Formulário para admin adicionar pessoa */}
        {user?.role === "master" && (
          <div className="space-y-2">
            {!isAdding ? (
              <Button onClick={() => setIsAdding(true)} variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Pessoa
              </Button>
            ) : (
              <form onSubmit={handleAddPerson} className="space-y-2">
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} (@{user.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex space-x-2">
                  <Button type="submit" size="sm" disabled={!selectedUserId}>
                    Adicionar
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Abas para admin */}
        {user?.role === "master" ? (
          <Tabs defaultValue="approved" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="approved">Na Fila ({approvedItems.length})</TabsTrigger>
              <TabsTrigger value="waiting">Aguardando ({waitingItems.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="approved" className="space-y-2">
              {approvedItems.length === 0 ? (
                <p className="text-center text-gray-500 py-4">Fila vazia</p>
              ) : (
                approvedItems.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{index + 1}</Badge>
                      <span>{item.name}</span>
                    </div>
                    <div className="flex space-x-1">
                      {index === 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => moveToEnd(queue.id, item.id)}
                          title="Pegou o item"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removePersonFromQueue(queue.id, item.id)}
                        className="text-red-600"
                        title="Remover"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="waiting" className="space-y-2">
              {waitingItems.length === 0 ? (
                <p className="text-center text-gray-500 py-4">Nenhuma solicitação</p>
              ) : (
                waitingItems.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between p-2 border rounded bg-yellow-50">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-yellow-100">
                        Aguardando
                      </Badge>
                      <span>{item.name}</span>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => approveRequest(queue.id, item.id)}
                        className="text-green-600"
                        title="Aprovar"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removePersonFromQueue(queue.id, item.id)}
                        className="text-red-600"
                        title="Rejeitar"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        ) : (
          /* Lista simples para usuários comuns */
          <div className="space-y-2">
            <h4 className="font-medium">Fila ({approvedItems.length} pessoas)</h4>
            {approvedItems.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Fila vazia</p>
            ) : (
              approvedItems.map((item, index) => (
                <div key={item.id} className="flex items-center space-x-2 p-2 border rounded">
                  <Badge variant="secondary">{index + 1}</Badge>
                  <span>{item.name}</span>
                  {item.requestedBy === user?.id && (
                    <Badge variant="outline" className="ml-auto">
                      Você
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
