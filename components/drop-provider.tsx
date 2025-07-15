"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth-provider"

interface DropEvent {
    id: string
    queueId: string
    dropCount: number
    createdAt: string
    createdBy: string
}

interface DropParticipant {
    id: string
    dropEventId: string
    queueItemId: string
    name: string
    action: "accept" | "skip" | "decline"
    createdAt: string
}

interface ActiveDrop {
    queueId: string
    itemName: string
    imageUrl?: string
    remainingItems: Array<{
        id: string
        name: string
        position: number
        requestedBy: string
    }>
    processedCount: number
    totalCount: number
    currentItem: {
        id: string
        name: string
        position: number
        requestedBy: string
    } | null
}

interface DropContextType {
    // State
    isProcessing: boolean
    activeDrops: ActiveDrop[]
    currentDrop: ActiveDrop | null
    pickedUpList: Array<DropParticipant & { itemName: string; imageUrl?: string; action: "accept" }>
    missedList: Array<DropParticipant & { itemName: string; imageUrl?: string; action: "skip" | "decline" }>

    // Actions
    startDrops: (dropCounts: Record<string, number>) => Promise<void>
    acceptName: (queueId: string, itemId: string, name: string) => Promise<void>
    skipName: (queueId: string, itemId: string, name: string) => Promise<void>
    declineName: (queueId: string, itemId: string, name: string) => Promise<void>
    resetDrops: () => void

    // Getters
    getTotalProgress: () => number
    hasActiveDrops: () => boolean
}

const DropContext = createContext<DropContextType | undefined>(undefined)

export function useDrops() {
    const context = useContext(DropContext)
    if (context === undefined) {
        throw new Error("useDrops must be used within a DropProvider")
    }
    return context
}

interface DropProviderProps {
    children: ReactNode
}

export function DropProvider({ children }: DropProviderProps) {
    const { user, queues, moveToEnd } = useAuth()
    const [isProcessing, setIsProcessing] = useState(false)
    const [activeDrops, setActiveDrops] = useState<ActiveDrop[]>([])
    const [currentDrop, setCurrentDrop] = useState<ActiveDrop | null>(null)
    const [pickedUpList, setPickedUpList] = useState<Array<DropParticipant & { itemName: string; imageUrl?: string; action: "accept" }>>([])
    const [missedList, setMissedList] = useState<Array<DropParticipant & { itemName: string; imageUrl?: string; action: "skip" | "decline" }>>([])
    const [currentDropEventId, setCurrentDropEventId] = useState<string | null>(null)

    // Initialize drop process
    const startDrops = async (dropCounts: Record<string, number>) => {
        if (!user || user.role !== "master") return

        setIsProcessing(true)
        try {
            const drops: ActiveDrop[] = []

            // Create drop events and prepare active drops
            for (const [queueId, count] of Object.entries(dropCounts)) {
                const queue = queues.find(q => q.id === queueId)
                if (!queue) continue

                const approvedItems = queue.items
                    .filter(item => item.status === "approved")
                    .sort((a, b) => a.position - b.position)
                    .slice(0, count)

                if (approvedItems.length === 0) continue

                // Create drop event in database
                const { data: dropEvent, error } = await supabase
                    .from("drop_events")
                    .insert([{
                        queue_id: queueId,
                        drop_count: count,
                        created_by: user.id
                    }])
                    .select()
                    .single()

                if (error) throw error

                drops.push({
                    queueId,
                    itemName: queue.item_name,
                    imageUrl: queue.image_url,
                    remainingItems: approvedItems.map(item => ({
                        id: item.id,
                        name: item.name,
                        position: item.position,
                        requestedBy: item.requestedBy
                    })),
                    processedCount: 0,
                    totalCount: count,
                    currentItem: approvedItems[0] ? {
                        id: approvedItems[0].id,
                        name: approvedItems[0].name,
                        position: approvedItems[0].position,
                        requestedBy: approvedItems[0].requestedBy
                    } : null
                })

                setCurrentDropEventId(dropEvent.id)
            }

            setActiveDrops(drops)
            setCurrentDrop(drops[0] || null)

        } catch (error) {
            console.error("Error starting drops:", error)
        } finally {
            setIsProcessing(false)
        }
    }

    // Handle accept action
    const acceptName = async (queueId: string, itemId: string, name: string) => {
        if (!currentDropEventId) return

        setIsProcessing(true)
        try {
            // Add to picked up list in database
            const { data: participant, error } = await supabase
                .from("drop_participants")
                .insert([{
                    drop_event_id: currentDropEventId,
                    queue_item_id: itemId,
                    name,
                    action: "accept"
                }])
                .select()
                .single()

            if (error) throw error

            // Move to end of queue
            await moveToEnd(queueId, itemId)

            // Update local state
            const queue = queues.find(q => q.id === queueId)
            setPickedUpList(prev => [...prev, {
                ...participant,
                itemName: queue?.item_name || "Unknown Item",
                imageUrl: queue?.image_url
            }])

            // Process next item
            await processNextItem(queueId, false)

        } catch (error) {
            console.error("Error accepting name:", error)
        } finally {
            setIsProcessing(false)
        }
    }

    // Handle skip action
    const skipName = async (queueId: string, itemId: string, name: string) => {
        if (!currentDropEventId) return

        setIsProcessing(true)
        try {
            // Add to missed list in database
            const { data: participant, error } = await supabase
                .from("drop_participants")
                .insert([{
                    drop_event_id: currentDropEventId,
                    queue_item_id: itemId,
                    name,
                    action: "skip"
                }])
                .select()
                .single()

            if (error) throw error

            // Move to end of queue
            await moveToEnd(queueId, itemId)

            // Update local state
            const queue = queues.find(q => q.id === queueId)
            setMissedList(prev => [...prev, {
                ...participant,
                itemName: queue?.item_name || "Unknown Item",
                imageUrl: queue?.image_url
            }])

            // Process next item (pull another name)
            await processNextItem(queueId, true)

        } catch (error) {
            console.error("Error skipping name:", error)
        } finally {
            setIsProcessing(false)
        }
    }

    // Handle decline action
    const declineName = async (queueId: string, itemId: string, name: string) => {
        if (!currentDropEventId) return

        setIsProcessing(true)
        try {
            // Add to missed list in database
            const { data: participant, error } = await supabase
                .from("drop_participants")
                .insert([{
                    drop_event_id: currentDropEventId,
                    queue_item_id: itemId,
                    name,
                    action: "decline"
                }])
                .select()
                .single()

            if (error) throw error

            // Move to end of queue
            await moveToEnd(queueId, itemId)

            // Update local state
            const queue = queues.find(q => q.id === queueId)
            setMissedList(prev => [...prev, {
                ...participant,
                itemName: queue?.item_name || "Unknown Item",
                imageUrl: queue?.image_url
            }])

            // Process next item (NO replacement for decline)
            await processNextItem(queueId, false)

        } catch (error) {
            console.error("Error declining name:", error)
        } finally {
            setIsProcessing(false)
        }
    }

    // Process next item in drop sequence
    const processNextItem = async (queueId: string, pullReplacement: boolean) => {
        setActiveDrops(prev => {
            const updated = prev.map(drop => {
                if (drop.queueId === queueId) {
                    const remaining = drop.remainingItems.slice(1)
                    const processed = drop.processedCount + 1

                    // If we need a replacement and have more items, pull next
                    let nextItem = null
                    if (pullReplacement && remaining.length > 0) {
                        nextItem = remaining[0]
                    }

                    return {
                        ...drop,
                        remainingItems: remaining,
                        processedCount: processed,
                        currentItem: nextItem
                    }
                }
                return drop
            })

            // Find next active drop or complete
            const nextDrop = updated.find(drop => drop.currentItem !== null)
            setCurrentDrop(nextDrop || null)

            // If no more active drops, complete the process
            if (!nextDrop) {
                setCurrentDropEventId(null)
            }

            return updated
        })
    }

    // Reset drops
    const resetDrops = () => {
        setActiveDrops([])
        setCurrentDrop(null)
        setPickedUpList([])
        setMissedList([])
        setCurrentDropEventId(null)
        setIsProcessing(false)
    }

    // Get total progress
    const getTotalProgress = () => {
        const totalItems = activeDrops.reduce((sum, drop) => sum + drop.totalCount, 0)
        const processedItems = activeDrops.reduce((sum, drop) => sum + drop.processedCount, 0)
        return totalItems > 0 ? (processedItems / totalItems) * 100 : 0
    }

    // Check if has active drops
    const hasActiveDrops = () => {
        return activeDrops.length > 0 && currentDrop !== null
    }

    const contextValue: DropContextType = {
        isProcessing,
        activeDrops,
        currentDrop,
        pickedUpList,
        missedList,
        startDrops,
        acceptName,
        skipName,
        declineName,
        resetDrops,
        getTotalProgress,
        hasActiveDrops
    }

    return (
        <DropContext.Provider value={contextValue}>
            {children}
        </DropContext.Provider>
    )
} 