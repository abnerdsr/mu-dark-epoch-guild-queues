"use client"

import { AuthProvider } from "@/components/auth-provider"
import { Header } from "@/components/header"
import { QueueGrid } from "@/components/queue-grid"
import { LoginModal } from "@/components/login-modal"
import { useAuth } from "@/components/auth-provider"

function AppContent() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando sistema...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <QueueGrid />
      </main>
      <LoginModal />
    </div>
  )
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
