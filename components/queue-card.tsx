"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth-provider"
import { QueueEditModal } from "@/components/queue-edit-modal"
import { MoreVertical, Plus, UserPlus, Check, X, RotateCcw, Trash2, ArrowUpDown, Edit, Crown } from "lucide-react"

interface QueueCardProps {
  queue: {
    id: string
    title: string
    item_name: string
    image_url?: string
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

    canJoinQueue,
  } = useAuth()

  const [isAddingPerson, setIsAddingPerson] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState("")
  const [showMenu, setShowMenu] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingPosition, setEditingPosition] = useState<{ itemId: string; currentPosition: number } | null>(null)
  const [newPosition, setNewPosition] = useState("")
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Separar itens por status
  const approvedItems = queue.items.filter((item) => item.status === "approved").sort((a, b) => a.position - b.position)
  const waitingItems = queue.items.filter((item) => item.status === "waiting").sort((a, b) => a.position - b.position)

  // Usuários disponíveis para adicionar (que não estão na fila) - incluindo admins
  const availableUsers = users.filter((u) => !queue.items.some((item) => item.requestedBy === u.id))

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
    await deleteQueue(queue.id)
    setShowDeleteConfirm(false)
    setShowMenu(false)
  }



  const handleEditPosition = (itemId: string, currentPosition: number) => {
    setEditingPosition({ itemId, currentPosition })
    setNewPosition(currentPosition.toString())
  }

  const handleSavePosition = async () => {
    if (!editingPosition) return

    const position = Number.parseInt(newPosition)
    if (isNaN(position) || position < 1 || position > approvedItems.length) {
      alert(`Posição deve ser entre 1 e ${approvedItems.length}`)
      return
    }

    setLoading(true)
    await changePosition(queue.id, editingPosition.itemId, position)
    setEditingPosition(null)
    setNewPosition("")
    setLoading(false)
  }

  const handleCancelEditPosition = () => {
    setEditingPosition(null)
    setNewPosition("")
  }

  const canUserJoin = user && canJoinQueue(queue.id)

  return (
    <>
      <Card className="h-fit mu-card-glow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-3">
            {queue.image_url ? (
              <img
                src={queue.image_url}
                alt={queue.item_name}
                className="w-12 h-12 rounded-lg object-cover border border-mu-electric/30"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-mu-electric/10 border border-mu-electric/30 flex items-center justify-center">
                <span className="text-mu-electric text-xs">No Image</span>
              </div>
            )}
            <div>
              <CardTitle className="text-lg text-mu-electric">{queue.item_name}</CardTitle>
              <p className="text-sm text-muted-foreground">{queue.title}</p>
            </div>
          </div>

          {user?.role === "master" && (
            <div className="relative">
              <Button variant="ghost" size="sm" onClick={() => setShowMenu(!showMenu)} className="h-8 w-8 p-0 mu-button-glow">
                <MoreVertical className="h-4 w-4" />
              </Button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-card rounded-lg shadow-lg border-border border mu-card-glow z-20">
                    <button
                      onClick={() => {
                        setIsEditModalOpen(true)
                        setShowMenu(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-primary hover:bg-accent hover:text-accent-foreground rounded-t-lg"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Details
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(true)
                        setShowMenu(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-b-lg"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Queue
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
                  className="w-full mu-button-glow"
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
                          {user.name} (@{user.username}) {user.role === "master" && "👑"}
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
                      className="flex-1 mu-button-glow"
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleAddPerson} disabled={!selectedUserId || loading} className="flex-1 mu-button-glow">
                      {loading ? "Adicionando..." : "Adicionar"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botão para usuário comum e admin */}
          {canUserJoin && (
            <Button onClick={handleRequestJoin} disabled={loading} className="w-full mu-button-glow">
              <Plus className="h-4 w-4 mr-2" />
              {loading ? "Solicitando..." : user?.role === "master" ? "Entrar na Fila" : "Solicitar Entrada"}
            </Button>
          )}

          {/* Abas - só aparecem para admin */}
          {user?.role === "master" ? (
            <Tabs defaultValue="approved" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="approved" className="mu-button-glow">Na Fila ({approvedItems.length})</TabsTrigger>
                <TabsTrigger value="waiting" className="mu-button-glow">Aguardando ({waitingItems.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="approved" className="space-y-2">
                {approvedItems.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Fila vazia</p>
                ) : (
                  approvedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-secondary border border-mu-electric rounded-lg mu-electric-glow"
                    >
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="bg-mu-electric text-mu-dark mu-text-glow">
                          {item.position}º
                        </Badge>
                        <span className="font-medium">{item.name}</span>
                        {users.find((u) => u.id === item.requestedBy)?.role === "master" && (
                          <Crown className="h-4 w-4 text-mu-gold" />
                        )}
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditPosition(item.id, item.position)}
                          className="h-8 w-8 p-0 mu-button-glow"
                          title="Editar posição"
                        >
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                        {item.position === 1 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => moveToEnd(queue.id, item.id)}
                            className="h-8 w-8 p-0 mu-button-glow"
                            title="Pegou o item (mover para o fim)"
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removePersonFromQueue(queue.id, item.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive mu-button-glow hover:bg-destructive/10"
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
                  <p className="text-center text-muted-foreground py-4">Nenhuma solicitação pendente</p>
                ) : (
                  waitingItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-muted border border-mu-bronze rounded-lg mu-electric-glow"
                    >
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="bg-mu-bronze text-mu-dark">
                          Aguardando
                        </Badge>
                        <span className="font-medium">{item.name}</span>
                        {users.find((u) => u.id === item.requestedBy)?.role === "master" && (
                          <Crown className="h-4 w-4 text-mu-gold" />
                        )}
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => approveRequest(queue.id, item.id)}
                          className="h-8 w-8 p-0 text-green-400 hover:text-green-300 mu-button-glow hover:bg-green-400/10"
                          title="Aprovar solicitação"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removePersonFromQueue(queue.id, item.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive mu-button-glow hover:bg-destructive/10"
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
              <h3 className="font-medium text-sm text-foreground mu-text-glow">Pessoas na Fila</h3>
              {approvedItems.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Fila vazia</p>
              ) : (
                approvedItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3 p-2 bg-secondary rounded-lg border border-mu-electric mu-electric-glow">
                    <Badge variant="outline" className="bg-mu-electric text-mu-dark">{item.position}º</Badge>
                    <span className="font-medium">{item.name}</span>
                    {users.find((u) => u.id === item.requestedBy)?.role === "master" && (
                      <Crown className="h-4 w-4 text-mu-gold" />
                    )}
                    {item.requestedBy === user?.id && (
                      <Badge variant="secondary" className="ml-auto bg-mu-gold text-mu-dark">
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

      {/* Modal para editar posição */}
      <Dialog open={!!editingPosition} onOpenChange={handleCancelEditPosition}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Posição na Fila</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-position">Nova Posição</Label>
              <Input
                id="new-position"
                type="number"
                min="1"
                max={approvedItems.length}
                value={newPosition}
                onChange={(e) => setNewPosition(e.target.value)}
                placeholder={`Entre 1 e ${approvedItems.length}`}
              />
              <p className="text-xs text-muted-foreground">
                Posição atual: {editingPosition?.currentPosition}º | Total de pessoas: {approvedItems.length}
              </p>
            </div>

            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelEditPosition}
                className="flex-1 mu-button-glow"
              >
                Cancelar
              </Button>
              <Button onClick={handleSavePosition} disabled={loading} className="flex-1 mu-button-glow">
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação para excluir fila */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-foreground">
              Tem certeza que deseja excluir a fila <strong>"{queue.title}"</strong>?
            </p>
            <p className="text-sm text-destructive">
              Esta ação não pode ser desfeita. Todas as pessoas na fila serão removidas.
            </p>

            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1 mu-button-glow">
                Cancelar
              </Button>
              <Button onClick={handleDeleteQueue} disabled={loading} className="flex-1 bg-destructive hover:bg-destructive/80 text-destructive-foreground">
                {loading ? "Excluindo..." : "Excluir Fila"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Queue Edit Modal */}
      <QueueEditModal
        queue={queue}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </>
  )
}
