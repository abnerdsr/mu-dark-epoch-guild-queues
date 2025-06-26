"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/components/auth-provider"
import { MoreVertical, Plus, UserPlus, Check, X, RotateCcw, Trash2 } from "lucide-react"

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

  const [isAddingPerson, setIsAddingPerson] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState("")
  const [showMenu, setShowMenu] = useState(false)
  const [loading, setLoading] = useState(false)

  // Separar itens por status
  const approvedItems = queue.items.filter((item) => item.status === "approved").sort((a, b) => a.position - b.position)
  const waitingItems = queue.items.filter((item) => item.status === "waiting").sort((a, b) => a.position - b.position)

  // Usuários disponíveis para adicionar (que não estão na fila)
  const availableUsers = users.filter(
    (u) => u.role !== "master" && !queue.items.some((item) => item.requestedBy === u.id),
  )

  const handleAddPerson = async () => {
    if (!selectedUserId) return

    setLoading(true)
    try {
      await addPersonToQueue(queue.id, selectedUserId)
      setSelectedUserId("")
      setIsAddingPerson(false)
    } catch (error) {
      console.error("Erro ao adicionar pessoa:", error)
    }
    setLoading(false)
  }

  const handleRequestJoin = async () => {
    setLoading(true)
    await requestToJoinQueue(queue.id)
    setLoading(false)
  }

  const handleDeleteQueue = async () => {
    if (confirm(`Tem certeza que deseja excluir a fila "${queue.title}"?`)) {
      await deleteQueue(queue.id)
    }
    setShowMenu(false)
  }

  const canUserJoin = user?.role === "user" && canJoinQueue(queue.id)

  return (
    <Card className="h-fit">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">{queue.title}</CardTitle>

        {user?.role === "master" && (
          <div className="relative">
            <Button variant="ghost" size="sm" onClick={() => setShowMenu(!showMenu)} className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20">
                  <button
                    onClick={handleDeleteQueue}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Fila
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Botões de Ação */}
        {user?.role === "master" && (
          <div className="space-y-2">
            {!isAddingPerson ? (
              <Button
                onClick={() => setIsAddingPerson(true)}
                variant="outline"
                className="w-full"
                disabled={availableUsers.length === 0}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {availableUsers.length === 0 ? "Nenhum usuário disponível" : "Adicionar Pessoa"}
              </Button>
            ) : (
              <div className="space-y-2">
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um usuário" />
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
                  <Button
                    onClick={() => {
                      setIsAddingPerson(false)
                      setSelectedUserId("")
                    }}
                    variant="outline"
                    className="flex-1 bg-transparent"
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleAddPerson} disabled={!selectedUserId || loading} className="flex-1">
                    {loading ? "Adicionando..." : "Adicionar"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botão para usuário comum */}
        {canUserJoin && (
          <Button onClick={handleRequestJoin} disabled={loading} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            {loading ? "Solicitando..." : "Solicitar Entrada"}
          </Button>
        )}

        {/* Abas - só aparecem para admin */}
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
                approvedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        {item.position}º
                      </Badge>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <div className="flex space-x-1">
                      {item.position === 1 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => moveToEnd(queue.id, item.id)}
                          className="h-8 w-8 p-0"
                          title="Pegou o item (mover para o fim)"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removePersonFromQueue(queue.id, item.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        title="Remover da fila"
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
                <p className="text-center text-gray-500 py-4">Nenhuma solicitação pendente</p>
              ) : (
                waitingItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                        Aguardando
                      </Badge>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => approveRequest(queue.id, item.id)}
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                        title="Aprovar solicitação"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removePersonFromQueue(queue.id, item.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        title="Rejeitar solicitação"
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
          // Visualização simples para usuários comuns
          <div className="space-y-2">
            <h3 className="font-medium text-sm text-gray-700">Pessoas na Fila</h3>
            {approvedItems.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Fila vazia</p>
            ) : (
              approvedItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                  <Badge variant="outline">{item.position}º</Badge>
                  <span className="font-medium">{item.name}</span>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
