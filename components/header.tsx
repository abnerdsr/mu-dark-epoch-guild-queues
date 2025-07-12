"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, Plus, Users, LogIn, User, Settings, LogOut } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

interface HeaderProps {
  onOpenCreateQueue: () => void
  onOpenUserManagement: () => void
  onOpenProfile: () => void
}

export function Header({ onOpenCreateQueue, onOpenUserManagement, onOpenProfile }: HeaderProps) {
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
    <header className="bg-card border-b border-border px-4 py-3 mu-border-glow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <img
              src="https://gimages.37games.com/aws_s3/img?s=/platform/one_image/2024/08/172500482028418889.png"
              alt="MU Dark Epoch Logo"
              className="w-16 h-16 object-contain"
            />
            <div>
              <h1 className="text-xl font-bold text-foreground mu-text-glow">MU Dark Epoch</h1>
              <div className="flex items-center space-x-2">
                <p className="text-xs text-mu-electric font-medium">Guild Queue System</p>
                <div className="w-1 h-1 bg-mu-electric rounded-full"></div>
                <p className="text-xs text-mu-gold font-medium">v2.0</p>
              </div>
            </div>
          </div>

          {/* Botão de Refresh - Disponível para todos */}
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            className="flex items-center space-x-2 mu-button-glow"
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
                  <Button variant="outline" size="sm" onClick={onOpenCreateQueue} className="mu-button-glow">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Fila
                  </Button>
                  <Button variant="outline" size="sm" onClick={onOpenUserManagement} className="mu-button-glow">
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
                  className="flex items-center space-x-2 mu-button-glow"
                >
                  <User className="h-4 w-4" />
                  <span>{user.name}</span>
                  <span className="text-xs">▼</span>
                </Button>

                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-card rounded-lg shadow-lg border-border border mu-card-glow z-20">
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false)
                          onOpenProfile()
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground rounded-t-lg"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Editar Perfil
                      </button>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-b-lg"
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
            <Button onClick={openLogin} variant="outline" size="sm" className="mu-button-glow">
              <LogIn className="h-4 w-4 mr-2" />
              Entrar
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
