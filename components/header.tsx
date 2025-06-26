"use client"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { Users, LogOut } from "lucide-react"

export function Header() {
  const { user, openLogin, logout } = useAuth()

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Sistema de Filas</h1>
            <p className="text-sm text-gray-500">Gerenciamento inteligente</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.role === "master" ? "Administrador" : "Usuário"}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="flex items-center space-x-1 bg-transparent"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </Button>
            </div>
          ) : (
            <Button onClick={openLogin}>Entrar</Button>
          )}
        </div>
      </div>
    </header>
  )
}
