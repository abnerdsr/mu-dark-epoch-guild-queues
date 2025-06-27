"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, Plus, Users, LogIn, User, Settings, LogOut } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

export function Header() {
  const { user, logout, openLogin, refreshQueues } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshQueues()
    setIsRefreshing(false)
  }

  const handleLogout = () => {
    logout()
    setIsDropdownOpen(false)
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-900">Sistema de Filas</h1>

          {/* Botão de Refresh - Disponível para todos */}
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            className="flex items-center space-x-2 bg-transparent"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? "Atualizando..." : "Atualizar"}</span>
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          {user ? (
            <>
              {user.role === "master" && (
                <>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Fila
                  </Button>
                  <Button variant="outline" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Gerenciar
                  </Button>
                </>
              )}

              {/* Dropdown do Perfil */}
              <div className="relative">
                <Button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <User className="h-4 w-4" />
                  <span>{user.name}</span>
                  <span className="text-xs">▼</span>
                </Button>

                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20">
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false)
                          // Abrir modal de perfil
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Editar Perfil
                      </button>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sair
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <Button onClick={openLogin} variant="outline" size="sm">
              <LogIn className="h-4 w-4 mr-2" />
              Entrar
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
