"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/auth-provider"
import { Plus, Trash2, ArrowDown, UserCheck, Clock, MoreVertical, X } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Queue {
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

interface QueueCardProps {
  queue: Queue
}

export function QueueCard({ queue }: QueueCardProps) {
  const { user, addPersonToQueue, removePersonFromQueue, moveToEnd, approveRequest, requestToJoinQueue, deleteQueue } =
    useAuth()

  const [newPersonName, setNewPersonName] = useState("")
  const [isAdding, setIsAdding] = useState(false)

  // Separar itens por status
  const approvedItems = queue.items.filter((item) => item.status === "approved").sort((a, b) => a.position - b.position)
  const waitingItems = queue.items.filter((item) => item.status === "waiting").sort((a, b) => a.position - b.position)

  const handleAddPerson = () => {
    if (newPersonName.trim() && user?.role === "master") {
      addPersonToQueue(queue.id, newPersonName.trim())
      setNewPersonName("")
      setIsAdding(false)
    }
  }

  const handleRequestJoin = () => {
    if (user?.role === "user") {
      requestToJoinQueue(queue.id)
      setIsAdding(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "waiting":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Aguardando
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <UserCheck className="h-3 w-3 mr-1" />
            Na Fila
          </Badge>
        )
      default:
        return null
    }
  }

  const canMoveToEnd = (item: any) => {
    return user?.role === "master" && item.status === "approved" && item.position === 1
  }

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">{queue.title}</CardTitle>
            <div className="text-sm text-gray-500">
              {approvedItems.length} na fila • {waitingItems.length} aguardando
            </div>
          </div>

          {user?.role === "master" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => deleteQueue(queue.id)} className="text-red-600 focus:text-red-600">
                  <X className="h-4 w-4 mr-2" />
                  Excluir Fila
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {user?.role === "master" ? (
          // Mostrar abas apenas para admin
          <Tabs defaultValue="queue" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="queue">Na Fila ({approvedItems.length})</TabsTrigger>
              <TabsTrigger value="waiting">Aguardando ({waitingItems.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="queue" className="space-y-2 mt-4">
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {approvedItems.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Fila vazia</p>
                ) : (
                  approvedItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-700">{item.position}º</span>
                          <span className="text-sm text-gray-900">{item.name}</span>
                        </div>
                        <div className="mt-1">{getStatusBadge(item.status)}</div>
                      </div>

                      <div className="flex space-x-1">
                        {canMoveToEnd(item) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => moveToEnd(queue.id, item.id)}
                            className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700"
                            title="Pegou o item (mover para o fim)"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removePersonFromQueue(queue.id, item.id)}
                          className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="waiting" className="space-y-2 mt-4">
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {waitingItems.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Nenhuma solicitação pendente</p>
                ) : (
                  waitingItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg border border-yellow-200"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-900">{item.name}</span>
                        </div>
                        <div className="mt-1">{getStatusBadge(item.status)}</div>
                      </div>

                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => approveRequest(queue.id, item.id)}
                          className="h-7 w-7 p-0 text-green-600 hover:text-green-700"
                          title="Aprovar solicitação"
                        >
                          <UserCheck className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removePersonFromQueue(queue.id, item.id)}
                          className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          // Mostrar apenas lista simples para usuários comuns e não logados
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {approvedItems.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Fila vazia</p>
            ) : (
              approvedItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">{item.position}º</span>
                      <span className="text-sm text-gray-900">{item.name}</span>
                    </div>
                    <div className="mt-1">{getStatusBadge(item.status)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Adicionar pessoa - seção modificada */}
        {user && (
          <div className="border-t pt-4">
            {user.role === "master" ? (
              // Lógica para admin (mantém o comportamento atual)
              !isAdding ? (
                <Button onClick={() => setIsAdding(true)} variant="outline" size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Pessoa
                </Button>
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder="Nome da pessoa"
                    value={newPersonName}
                    onChange={(e) => setNewPersonName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAddPerson()
                      }
                    }}
                  />
                  <div className="flex space-x-2">
                    <Button onClick={handleAddPerson} size="sm" className="flex-1" disabled={!newPersonName.trim()}>
                      Adicionar
                    </Button>
                    <Button
                      onClick={() => {
                        setIsAdding(false)
                        setNewPersonName("")
                      }}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )
            ) : (
              // Lógica simplificada para usuário comum (ação única)
              <Button onClick={handleRequestJoin} variant="outline" size="sm" className="w-full bg-transparent">
                <Plus className="h-4 w-4 mr-2" />
                Solicitar Entrada
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
