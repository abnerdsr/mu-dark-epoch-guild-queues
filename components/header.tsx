"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"
import { ProfileModal } from "@/components/profile-modal"
import { UserManagementModal } from "@/components/user-management-modal"
import { ChevronDown, User, LogOut, Users, Plus } from "lucide-react"

export function Header() {
  const { user, openLogin, logout } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false)
  const [isCreateQueueModalOpen, setIsCreateQueueModalOpen] = useState(false)

  const handleLogout = () => {
    logout()
    setIsDropdownOpen(false)
  }

  const handleEditProfile = () => {
    setIsProfileModalOpen(true)
    setIsDropdownOpen(false)
  }

  const handleUserManagement = () => {
    setIsUserManagementOpen(true)
    setIsDropdownOpen(false)
  }

  return (
    <>
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo e Nome */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Sistema de Filas</h1>
          </div>

          {/* Botões do Admin e Login */}
          <div className="flex items-center space-x-3">
            {user?.role === "master" && (
              <>
                <Button onClick={() => setIsCreateQueueModalOpen(true)} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Fila
                </Button>
                <Button onClick={handleUserManagement} variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Gerenciar Usuários
                </Button>
              </>
            )}

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{user.name}</span>
                    {user.role === "master" && <Badge variant="secondary">Admin</Badge>}
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <>
                    {/* Overlay para fechar o dropdown */}
                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />

                    {/* Menu Dropdown */}
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20">
                      <div className="py-1">
                        <button
                          onClick={handleEditProfile}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <User className="h-4 w-4 mr-2" />
                          Editar Perfil
                        </button>
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Sair
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Button onClick={openLogin}>Entrar</Button>
            )}
          </div>
        </div>
      </header>

      {/* Modais */}
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
      <UserManagementModal isOpen={isUserManagementOpen} onClose={() => setIsUserManagementOpen(false)} />

      {/* Modal de Criar Fila */}
      {isCreateQueueModalOpen && <CreateQueueModal onClose={() => setIsCreateQueueModalOpen(false)} />}
    </>
  )
}

// Componente para criar nova fila
function CreateQueueModal({ onClose }: { onClose: () => void }) {
  const { createQueue } = useAuth()
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    await createQueue(title.trim())
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Nova Fila</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="queue-title" className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Fila
            </label>
            <input
              id="queue-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Fila de Atendimento"
              required
            />
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Criando..." : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
