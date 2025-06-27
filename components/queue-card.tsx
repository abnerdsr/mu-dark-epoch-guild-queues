"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"
import { Users, UserPlus, Trash2, Check, X, ArrowDown, ArrowUpDown, Clock } from "lucide-react"

interface QueueWithItems {
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
  queue: QueueWithItems
}

export function QueueCard({ queue }: QueueCardProps) {
  const {
    user,
    users,
    addPersonToQueue,
    removePersonFromQueue,
    moveToEnd,
    changePosition,
    approveRequest,
    requestToJoinQueue,
    deleteQueue,
    canJoinQueue,
  } = useAuth()

  const [isAddPersonModalOpen, setIsAddPersonModalOpen] = useState(false)
  const [isPositionModalOpen, setIsPositionModalOpen] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState<string>("")
  const [newPosition, setNewPosition] = useState<number>(1)
  const [loading, setLoading] = useState(false)

  // Separar itens aprovados e pendentes
  const approvedItems = queue.items.filter((item) => item.status === "approved").sort((a, b) => a.position - b.position)

  const pendingItems = queue.items.filter((item) => item.status === "waiting")

  const handleAddPerson = async (userId: string) => {
    try {
      setLoading(true)
      await addPersonToQueue(queue.id, userId)
      setIsAddPersonModalOpen(false)
    } catch (error) {
      console.error("Erro ao adicionar pessoa:", error)
      alert("Erro ao adicionar pessoa à fila")
    } finally {
      setLoading(false)
    }
  }

  const handleRequestJoin = async () => {
    const success = await requestToJoinQueue(queue.id)
    if (!success) {
      alert("Não foi possível solicitar entrada na fila")
    }
  }

  const handleChangePosition = async () => {
    if (!selectedItemId || newPosition < 1 || newPosition > approvedItems.length) return

    try {
      setLoading(true)
      await changePosition(queue.id, selectedItemId, newPosition)
      setIsPositionModalOpen(false)
      setSelectedItemId("")
      setNewPosition(1)
    } catch (error) {
      console.error("Erro ao alterar posição:", error)
      alert("Erro ao alterar posição")
    } finally {
      setLoading(false)
    }
  }

  const openPositionModal = (itemId: string, currentPosition: number) => {
    setSelectedItemId(itemId)
    setNewPosition(currentPosition)
    setIsPositionModalOpen(true)
  }

  return (
    <>
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{queue.title}</CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="flex items-center space-x-1">
                <Users className="h-3 w-3" />
                <span>{approvedItems.length}</span>
              </Badge>
              {user?.role === "master" && (
                <Button
                  onClick={() => deleteQueue(queue.id)}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Fila Principal */}
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center">
              <Users className="h-4 w-4 mr-1" />
              Fila ({approvedItems.length})
            </h4>

            {approvedItems.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
                Fila vazia
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {approvedItems.map((item, index) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-2 rounded-lg border ${
                      index === 0 ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">{index + 1}º</span>
                      <span className="text-sm">{item.name}</span>
                      {index === 0 && (
                        <Badge variant="secondary" className="text-xs">
                          Próximo
                        </Badge>
                      )}
                    </div>

                    {user?.role === "master" && (
                      <div className="flex items-center space-x-1">
                        {/* Botão de Editar Posição */}
                        <Button
                          onClick={() => openPositionModal(item.id, item.position)}
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>

                        {/* Botão "Pegou o item" - apenas para o primeiro */}
                        {index === 0 && (
                          <Button
                            onClick={() => moveToEnd(queue.id, item.id)}
                            variant="ghost"
                            size="sm"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        )}

                        {/* Botão Remover */}
                        <Button
                          onClick={() => removePersonFromQueue(queue.id, item.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Solicitações Pendentes */}
          {pendingItems.length > 0 && (
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Aguardando Aprovação ({pendingItems.length})
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {pendingItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 bg-yellow-50 border border-yellow-200 rounded-lg"
                  >
                    <span className="text-sm">{item.name}</span>
                    {user?.role === "master" && (
                      <div className="flex items-center space-x-1">
                        <Button
                          onClick={() => approveRequest(queue.id, item.id)}
                          variant="ghost"
                          size="sm"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={() => removePersonFromQueue(queue.id, item.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="pt-2 border-t">
            {user?.role === "master" ? (
              <Button onClick={() => setIsAddPersonModalOpen(true)} variant="outline" className="w-full">
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar Pessoa
              </Button>
            ) : user?.role === "user" && canJoinQueue(queue.id) ? (
              <Button onClick={handleRequestJoin} variant="outline" className="w-full bg-transparent">
                <UserPlus className="h-4 w-4 mr-2" />
                Solicitar Entrada
              </Button>
            ) : user?.role === "user" ? (
              <Button variant="outline" disabled className="w-full bg-transparent">
                Já está na fila
              </Button>
            ) : (
              <Button variant="outline" disabled className="w-full bg-transparent">
                Faça login para entrar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal para Adicionar Pessoa */}
      {isAddPersonModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Adicionar Pessoa à Fila</h3>
            <div className="space-y-2 mb-4">
              {users
                .filter((u) => u.role === "user")
                .map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleAddPerson(user.id)}
                    disabled={loading}
                    className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
                  >
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-gray-500">@{user.username}</div>
                  </button>
                ))}
            </div>
            <Button onClick={() => setIsAddPersonModalOpen(false)} variant="outline" className="w-full">
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Modal para Alterar Posição */}
      {isPositionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Alterar Posição</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nova Posição (1 a {approvedItems.length})
                </label>
                <input
                  type="number"
                  min="1"
                  max={approvedItems.length}
                  value={newPosition}
                  onChange={(e) => setNewPosition(Number.parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Posição atual: {approvedItems.find((item) => item.id === selectedItemId)?.position}
                </p>
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={() => {
                    setIsPositionModalOpen(false)
                    setSelectedItemId("")
                    setNewPosition(1)
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleChangePosition}
                  disabled={loading || newPosition < 1 || newPosition > approvedItems.length}
                  className="flex-1"
                >
                  {loading ? "Alterando..." : "Alterar"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
