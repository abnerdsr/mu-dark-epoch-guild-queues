"use client"

import { AuthProvider } from "@/components/auth-provider"
import { Header } from "@/components/header"
import { QueueGrid } from "@/components/queue-grid"
import { LoginModal } from "@/components/login-modal"

export default function Home() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <QueueGrid />
        <LoginModal />
      </div>
    </AuthProvider>
  )
}
