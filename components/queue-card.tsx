"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth-provider"
import {
  MoreVertical,
  UserPlus,
  Check,
  X,
  ArrowDown,
  ArrowUpDown,
  Trash2,
  Edit3,
  Crown,
  AlertTriangle,
} from "lucide-react"
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
    changePosition,
    approveRequest,
    requestToJoinQueue,
    deleteQueue,
    updateQueueTitle,
    canJoinQueue,
  } = useAuth()

  const [isAddingPerson, setIsAddingPerson] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState("")
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState(queue.title)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editingPosition, setEditingPosition] = useState<string | null>(null)
  const [newPosition, setNewPosition] = useState("")

  const approvedItems = queue.items.filter((item) => item.status === "approved").sort((a, b) => a.position - b.position)
  const waitingItems = queue.items.filter((item) => item.status === "waiting")

  const handleAddPerson = async () => {
    if (!selectedUserId) return

    try {
      await addPersonToQueue(queue.id, selectedUserId)
      setIsAddingPerson(false)
      setSelectedUserId("")
    } catch (error) {
      alert("Erro ao adicionar pessoa: " + (error as Error).message)
    }
  }

  const handleJoinQueue = async () => {
    const success = await requestToJoinQueue(queue.id)
    if (!success) {
      alert("Não foi possível entrar na fila")
    }
  }

  const handleSaveTitle = async () => {
    if (editTitle.trim() && editTitle.trim() !== queue.title) {
      await updateQueueTitle(queue.id, editTitle.trim())
    }
    setIsEditingTitle(false)
  }

  const handleCancelEditTitle = () => {
    setEditTitle(queue.title)
    setIsEditingTitle(false)
  }

  const handleDeleteQueue = async () => {
    await deleteQueue(queue.id)
    setShowDeleteConfirm(false)
  }

  const handleChangePosition = async (itemId: string) => {
    const pos = Number.parseInt(newPosition)
    if (pos >= 1 && pos <= approvedItems.length) {
      await changePosition(queue.id, itemId, pos)
      setEditingPosition(null)
      setNewPosition("")
    }
  }

  const getUserById = (userId: string) => {
    return users.find((u) => u.id === userId)
  }

  const availableUsers = users.filter((u) => !queue.items.some((item) => item.requestedBy === u.id))

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex-1">
            {isEditingTitle ? (
              <div className="flex items-center space-x-2">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTitle()
                    if (e.key === "Escape") handleCancelEditTitle()
                  }}
                  className="text-lg font-semibold"
                  autoFocus
                />
                <Button onClick={handleSaveTitle} size="sm" variant="outline">
                  <Check className="h-4 w-4" />
                </Button>
                <Button onClick={handleCancelEditTitle} size="sm" variant="outline">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <CardTitle className="text-lg">{queue.title}</CardTitle>
            )}
          </div>

          {user?.role === "master" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Editar Nome
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowDeleteConfirm(true)} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Fila
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Fila Principal */}
          <div>
            <h4 className="font-medium mb-2 flex items-center">Fila ({approvedItems.length} pessoas)</h4>
            <div className="space-y-2">
              {approvedItems.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhuma pessoa na fila</p>
              ) : (
                approvedItems.map((item, index) => {
                  const itemUser = getUserById(item.requestedBy)
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-2 rounded border ${
                        index === 0 ? "bg-green-50 border-green-200" : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">#{item.position}</span>
                        <span className="flex items-center space-x-1">
                          <span>{item.name}</span>
                          {itemUser?.role === "master" && <Crown className="h-4 w-4 text-yellow-500" title="Admin" />}
                        </span>
                        {index === 0 && (
                          <Badge variant="secondary" className="text-xs">
                            Próximo
                          </Badge>
                        )}
                      </div>

                      {user?.role === "master" && (
                        <div className="flex items-center space-x-1">
                          {/* Botão para editar posição */}
                          {editingPosition === item.id ? (
                            <div className="flex items-center space-x-1">
                              <Input
                                type="number"
                                min="1"
                                max={approvedItems.length}
                                value={newPosition}
                                onChange={(e) => setNewPosition(e.target.value)}
                                className="w-16 h-8 text-xs"
                                placeholder={item.position.toString()}
                              />
                              <Button
                                onClick={() => handleChangePosition(item.id)}
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                onClick={() => {
                                  setEditingPosition(null)
                                  setNewPosition("")
                                }}
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              onClick={() => {
                                setEditingPosition(item.id)
                                setNewPosition(item.position.toString())
                              }}
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0"
                              title="Editar posição"
                            >
                              <ArrowUpDown className="h-3 w-3" />
                            </Button>
                          )}

                          {index === 0 && (
                            <Button
                              onClick={() => moveToEnd(queue.id, item.id)}
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0"
                              title="Pegou o item"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                          )}

                          <Button
                            onClick={() => removePersonFromQueue(queue.id, item.id)}
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            title="Remover da fila"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Solicitações Pendentes */}
          {waitingItems.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 text-orange-600">Aguardando Aprovação ({waitingItems.length})</h4>
              <div className="space-y-2">
                {waitingItems.map((item) => {
                  const itemUser = getUserById(item.requestedBy)
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded border bg-orange-50 border-orange-200"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="flex items-center space-x-1">
                          <span>{item.name}</span>
                          {itemUser?.role === "master" && <Crown className="h-4 w-4 text-yellow-500" title="Admin" />}
                        </span>
                        <Badge variant="outline" className="text-xs text-orange-600">
                          Aguardando
                        </Badge>
                      </div>

                      {user?.role === "master" && (
                        <div className="flex items-center space-x-1">
                          <Button
                            onClick={() => approveRequest(queue.id, item.id)}
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                            title="Aprovar"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            onClick={() => removePersonFromQueue(queue.id, item.id)}
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            title="Rejeitar"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="pt-2 border-t">
            {user?.role === "master" && (
              <>
                {isAddingPerson ? (
                  <div className="space-y-2">
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full p-2 border rounded text-sm"
                    >
                      <option value="">Selecione uma pessoa</option>
                      {availableUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} (@{u.username}) {u.role === "master" ? "👑" : ""}
                        </option>
                      ))}
                    </select>
                    <div className="flex space-x-2">
                      <Button onClick={handleAddPerson} disabled={!selectedUserId} size="sm" className="flex-1">
                        Adicionar
                      </Button>
                      <Button onClick={() => setIsAddingPerson(false)} variant="outline" size="sm" className="flex-1">
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button onClick={() => setIsAddingPerson(true)} variant="outline" size="sm" className="w-full">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Adicionar Pessoa
                  </Button>
                )}
              </>
            )}

            {user && user.role !== "master" && canJoinQueue(queue.id) && (
              <Button onClick={handleJoinQueue} variant="outline" size="sm" className="w-full bg-transparent">
                <UserPlus className="h-4 w-4 mr-2" />
                Solicitar Entrada
              </Button>
            )}

            {user && user.role === "master" && canJoinQueue(queue.id) && (
              <Button onClick={handleJoinQueue} variant="outline" size="sm" className="w-full mt-2 bg-transparent">
                <UserPlus className="h-4 w-4 mr-2" />
                Entrar na Fila
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h2 className="text-lg font-semibold">Confirmar Exclusão</h2>
            </div>

            <p className="text-gray-700 mb-2">Tem certeza que deseja excluir a fila:</p>
            <p className="font-semibold text-gray-900 mb-4">"{queue.title}"</p>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-800 text-sm">
                ⚠️ Esta ação não pode ser desfeita. Todas as pessoas na fila serão removidas.
              </p>
            </div>

            <div className="flex space-x-3">
              <Button onClick={() => setShowDeleteConfirm(false)} variant="outline" className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleDeleteQueue} variant="destructive" className="flex-1">
                Excluir Fila
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
