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
      <div className="min-h-screen bg-gray-50">
        <Header
          onOpenCreateQueue={() => setIsCreateQueueOpen(true)}
          onOpenUserManagement={() => setIsUserManagementOpen(true)}
          onOpenProfile={() => setIsProfileModalOpen(true)}
        />
        <main className="container mx-auto px-4 py-8">
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
