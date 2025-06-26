"use client"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { LogOut, User, Settings, ChevronDown } from "lucide-react"
import { ProfileModal } from "@/components/profile-modal"
import { useState } from "react"

export function Header() {
  const { user, logout, openLogin } = useAuth()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleLogout = () => {
    setIsDropdownOpen(false)
    logout()
  }

  const handleEditProfile = () => {
    setIsDropdownOpen(false)
    setIsProfileOpen(true)
  }

  return (
    <>
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Sistema de Filas</h1>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <User className="h-4 w-4" />
                  <span>{user.name}</span>
                  {user.role === "master" && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Admin</span>
                  )}
                  <ChevronDown className="h-4 w-4" />
                </Button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      <button
                        onClick={handleEditProfile}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Settings className="h-4 w-4 mr-2" />
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
                )}

                {/* Overlay para fechar dropdown quando clicar fora */}
                {isDropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />}
              </div>
            ) : (
              <Button onClick={openLogin}>Entrar</Button>
            )}
          </div>
        </div>
      </header>

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  )
}
