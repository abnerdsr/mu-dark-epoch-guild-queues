"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/components/auth-provider"
import { Plus, UserPlus, UserMinus, RotateCcw, Check, MoreVertical, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

  const [selectedUserId, setSelectedUserId] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState("")

  // Separar itens por status
  const approvedItems = queue.items.filter((item) => item.status === "approved").sort((a, b) => a.position - b.position)
  const waitingItems = queue.items.filter((item) => item.status === "waiting").sort((a, b) => a.position - b.position)

  // Usuários disponíveis para adicionar (que não estão na fila)
  const availableUsers = users.filter(
    (u) => u.role === "user" && !queue.items.some((item) => item.requestedBy === u.id),
  )

  const handleAddPerson = async () => {
    if (!selectedUserId) return

    setError("")
    setIsAdding(true)
    try {
      await addPersonToQueue(queue.id, selectedUserId)
      setSelectedUserId("")
    } catch (error) {
      setError("Erro ao adicionar pessoa à fila")
    }
    setIsAdding(false)
  }

  const handleRequestJoin = async () => {
    const success = await requestToJoinQueue(queue.id)
    if (!success) {
      setError("Não foi possível solicitar entrada na fila")
    }
  }

  const handleDeleteQueue = async () => {
    if (confirm(`Tem certeza que deseja excluir a fila "${queue.title}"?`)) {
      await deleteQueue(queue.id)
    }
  }

  const canUserJoin = user?.role === "user" && canJoinQueue(queue.id)

  return (
    <Card className="h-fit">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">{queue.title}</CardTitle>
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
        {/* Botão para usuário comum solicitar entrada */}
        {canUserJoin && (
          <Button onClick={handleRequestJoin} className="w-full" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Solicitar Entrada
          </Button>
        )}

        {/* Formulário para admin adicionar pessoa */}
        {user?.role === "master" && (
          <div className="space-y-3">
            <div className="flex space-x-2">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecionar usuário" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.length === 0 ? (
                    <SelectItem value="" disabled>
                      Nenhum usuário disponível
                    </SelectItem>
                  ) : (
                    availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} (@{user.username})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button onClick={handleAddPerson} disabled={!selectedUserId || isAdding} size="sm" className="shrink-0">
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Abas para admin, lista simples para usuários */}
        {user?.role === "master" ? (
          <Tabs defaultValue="approved" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="approved">Na Fila ({approvedItems.length})</TabsTrigger>
              <TabsTrigger value="waiting">Aguardando ({waitingItems.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="approved" className="space-y-2">
              {approvedItems.length === 0 ? (
                <p className="text-center text-gray-500 py-4 text-sm">Fila vazia</p>
              ) : (
                approvedItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-sm w-6">{item.position}º</span>
                      <span className="text-sm">{item.name}</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Aprovado
                      </Badge>
                    </div>
                    <div className="flex space-x-1">
                      {item.position === 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveToEnd(queue.id, item.id)}
                          title="Pegou o item"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePersonFromQueue(queue.id, item.id)}
                        title="Remover"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="waiting" className="space-y-2">
              {waitingItems.length === 0 ? (
                <p className="text-center text-gray-500 py-4 text-sm">Nenhuma solicitação pendente</p>
              ) : (
                waitingItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-sm w-6">{item.position}º</span>
                      <span className="text-sm">{item.name}</span>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        Aguardando
                      </Badge>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => approveRequest(queue.id, item.id)}
                        title="Aprovar"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePersonFromQueue(queue.id, item.id)}
                        title="Remover"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        ) : (
          // Lista simples para usuários comuns e não logados
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700 mb-2">Fila ({approvedItems.length} pessoas)</h4>
            {approvedItems.length === 0 ? (
              <p className="text-center text-gray-500 py-4 text-sm">Fila vazia</p>
            ) : (
              approvedItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                  <span className="font-medium text-sm w-6">{item.position}º</span>
                  <span className="text-sm">{item.name}</span>
                  {user && item.requestedBy === user.id && (
                    <Badge variant="secondary" className="ml-auto">
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
