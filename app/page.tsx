"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { QueueGrid } from "@/components/queue-grid"
import { LoginModal } from "@/components/login-modal"
import { ProfileModal } from "@/components/profile-modal"
import { UserManagementModal } from "@/components/user-management-modal"
import { AuthProvider } from "@/components/auth-provider"
import { CreateQueueModal } from "@/components/create-queue-modal"

export default function Home() {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false)
  const [isCreateQueueOpen, setIsCreateQueueOpen] = useState(false)

  return (
    <AuthProvider>
      <div className="min-h-screen bg-background relative">
        {/* Subtle background effects */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-mu-electric/10 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-48 h-48 bg-gradient-to-bl from-mu-gold/8 to-transparent rounded-full blur-2xl"></div>
        </div>

        <Header
          onOpenCreateQueue={() => setIsCreateQueueOpen(true)}
          onOpenUserManagement={() => setIsUserManagementOpen(true)}
          onOpenProfile={() => setIsProfileModalOpen(true)}
        />
        <main className="container mx-auto px-4 py-8 relative z-10">
          <QueueGrid />
        </main>

        <LoginModal />
        <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
        <UserManagementModal isOpen={isUserManagementOpen} onClose={() => setIsUserManagementOpen(false)} />
        <CreateQueueModal isOpen={isCreateQueueOpen} onClose={() => setIsCreateQueueOpen(false)} />
      </div>
    </AuthProvider>
  )
}
