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
    dropEventId: string
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
    currentItems: Array<{
        id: string
        name: string
        position: number
        requestedBy: string
    }>
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
    isLoadingData: boolean
    activeDrops: ActiveDrop[]
    currentDrop: ActiveDrop | null
    pickedUpList: Array<DropParticipant & { itemName: string; imageUrl?: string; action: "accept" }>
    missedList: Array<DropParticipant & { itemName: string; imageUrl?: string; action: "skip" | "decline" }>
    participantList: string[]

    // Actions
    startDrops: (dropCounts: Record<string, number>, participants: string[]) => Promise<void>
    acceptName: (queueId: string, itemId: string, name: string) => Promise<void>
    skipName: (queueId: string, itemId: string, name: string) => Promise<void>
    declineName: (queueId: string, itemId: string, name: string) => Promise<void>
    resetDrops: () => void
    getTotalProgress: () => number
    hasActiveDrops: () => boolean
    copyDropResults: (queueId: string) => Promise<void>
    clearPickedUpList: () => Promise<void>
    clearMissedList: () => Promise<void>
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
    const [isLoadingData, setIsLoadingData] = useState(true)
    const [activeDrops, setActiveDrops] = useState<ActiveDrop[]>([])
    const [currentDrop, setCurrentDrop] = useState<ActiveDrop | null>(null)
    const [pickedUpList, setPickedUpList] = useState<Array<DropParticipant & { itemName: string; imageUrl?: string; action: "accept" }>>([])
    const [missedList, setMissedList] = useState<Array<DropParticipant & { itemName: string; imageUrl?: string; action: "skip" | "decline" }>>([])
    const [currentDropEventId, setCurrentDropEventId] = useState<string | null>(null)
    const [participantList, setParticipantList] = useState<string[]>([])

    // Load existing drop data on component mount
    useEffect(() => {
        const loadExistingDropData = async () => {
            if (!user || !queues.length) {
                setIsLoadingData(false)
                return
            }

            try {
                // Load recent drop events (last 24 hours)
                const twentyFourHoursAgo = new Date()
                twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

                const { data: dropEvents, error: eventsError } = await supabase
                    .from("drop_events")
                    .select("*")
                    .gte("created_at", twentyFourHoursAgo.toISOString())
                    .order("created_at", { ascending: false })

                if (eventsError) throw eventsError

                if (dropEvents && dropEvents.length > 0) {
                    // Load all participants for these drop events
                    const dropEventIds = dropEvents.map(event => event.id)

                    const { data: participants, error: participantsError } = await supabase
                        .from("drop_participants")
                        .select("*")
                        .in("drop_event_id", dropEventIds)
                        .order("created_at", { ascending: false })

                    if (participantsError) throw participantsError

                    if (participants && participants.length > 0) {
                        // Separate picked up and missed participants
                        const pickedUp: Array<DropParticipant & { itemName: string; imageUrl?: string; action: "accept" }> = []
                        const missed: Array<DropParticipant & { itemName: string; imageUrl?: string; action: "skip" | "decline" }> = []

                        participants.forEach(participant => {
                            // Find the queue for this participant
                            const dropEvent = dropEvents.find(event => event.id === participant.drop_event_id)
                            const queue = queues.find(q => q.id === dropEvent?.queue_id)

                            const enrichedParticipant = {
                                ...participant,
                                itemName: queue?.item_name || "Unknown Item",
                                imageUrl: queue?.image_url
                            }

                            if (participant.action === "accept") {
                                pickedUp.push(enrichedParticipant as any)
                            } else if (participant.action === "skip" || participant.action === "decline") {
                                missed.push(enrichedParticipant as any)
                            }
                        })

                        setPickedUpList(pickedUp)
                        setMissedList(missed)
                    }
                }
            } catch (error) {
                console.error("Error loading existing drop data:", error)
            } finally {
                setIsLoadingData(false)
            }
        }

        loadExistingDropData()
    }, [user, queues])

    // Initialize drop process
    const startDrops = async (dropCounts: Record<string, number>, participants: string[]) => {
        if (!user || user.role !== "master") return

        setIsProcessing(true)
        setParticipantList(participants)

        try {
            const drops: ActiveDrop[] = []

            // Create drop events and prepare active drops
            for (const [queueId, count] of Object.entries(dropCounts)) {
                const queue = queues.find(q => q.id === queueId)
                if (!queue) continue

                const approvedItems = queue.items
                    .filter(item => item.status === "approved")
                    .sort((a, b) => a.position - b.position)

                if (approvedItems.length === 0) continue

                // Filter items to only include participants, then take required count
                const participantItems = approvedItems.filter(item => participants.includes(item.name))
                const itemsToProcess = participantItems.slice(0, count)

                // If we don't have enough participants, we'll need to pull more during processing
                if (itemsToProcess.length < count) {
                    console.warn(`Not enough participants for ${queue.item_name}: need ${count}, have ${itemsToProcess.length}`)
                }

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
                    dropEventId: dropEvent.id,
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
                    currentItems: itemsToProcess.map(item => ({
                        id: item.id,
                        name: item.name,
                        position: item.position,
                        requestedBy: item.requestedBy
                    })),
                    currentItem: itemsToProcess[0] ? {
                        id: itemsToProcess[0].id,
                        name: itemsToProcess[0].name,
                        position: itemsToProcess[0].position,
                        requestedBy: itemsToProcess[0].requestedBy
                    } : null
                })

                setCurrentDropEventId(dropEvent.id)
            }

            // Auto-filter non-participants by moving them to end and pulling next participants
            await filterNonParticipants(drops, participants)

            setActiveDrops(drops)
            setCurrentDrop(drops[0] || null)

        } catch (error) {
            console.error("Error starting drops:", error)
        } finally {
            setIsProcessing(false)
        }
    }

    // Filter out non-participants and pull next participants
    const filterNonParticipants = async (drops: ActiveDrop[], participants: string[]) => {
        for (const drop of drops) {
            const queue = queues.find(q => q.id === drop.queueId)
            if (!queue) continue

            // Find items that are not participants
            const nonParticipantItems = drop.currentItems.filter(item => !participants.includes(item.name))

            // Move non-participants to end and pull next participants
            for (const item of nonParticipantItems) {
                try {
                    // Move to end of queue
                    await moveToEnd(drop.queueId, item.id)

                    // Find next participant in queue
                    const nextParticipant = queue.items
                        .filter(qItem =>
                            qItem.status === "approved" &&
                            participants.includes(qItem.name) &&
                            !drop.currentItems.some(currentItem => currentItem.id === qItem.id)
                        )
                        .sort((a, b) => a.position - b.position)[0]

                    if (nextParticipant) {
                        // Replace non-participant with next participant
                        const itemIndex = drop.currentItems.findIndex(i => i.id === item.id)
                        if (itemIndex !== -1) {
                            drop.currentItems[itemIndex] = {
                                id: nextParticipant.id,
                                name: nextParticipant.name,
                                position: nextParticipant.position,
                                requestedBy: nextParticipant.requestedBy
                            }
                        }
                    } else {
                        // No more participants available, remove the item
                        drop.currentItems = drop.currentItems.filter(i => i.id !== item.id)
                    }
                } catch (error) {
                    console.error("Error filtering non-participant:", error)
                }
            }
        }
    }

    // Process next item in drop sequence
    const processNextItem = async (queueId: string, pullReplacement: boolean, itemId: string) => {
        setActiveDrops(prev => {
            const updated = prev.map(drop => {
                if (drop.queueId === queueId) {
                    // Remove the processed item from currentItems
                    const updatedCurrentItems = drop.currentItems.filter(item => item.id !== itemId)
                    const processed = drop.processedCount + 1

                    // If we need a replacement and have more items in remaining, pull next participant
                    let newCurrentItems = [...updatedCurrentItems]
                    if (pullReplacement && drop.remainingItems.length > processed) {
                        // Find next participant in remaining items
                        const nextParticipant = drop.remainingItems
                            .filter(item =>
                                participantList.includes(item.name) &&
                                !newCurrentItems.some(currentItem => currentItem.id === item.id)
                            )
                            .sort((a, b) => a.position - b.position)[0]

                        if (nextParticipant) {
                            newCurrentItems.push(nextParticipant)
                        }
                    }

                    return {
                        ...drop,
                        currentItems: newCurrentItems,
                        processedCount: processed,
                        currentItem: newCurrentItems[0] || null
                    }
                }
                return drop
            })

            // Update current drop immediately after processing
            const updatedCurrentDrop = updated.find(drop => drop.queueId === queueId)
            if (updatedCurrentDrop && updatedCurrentDrop.currentItems.length > 0) {
                setCurrentDrop(updatedCurrentDrop)
            } else {
                // Find next active drop or complete
                const nextDrop = updated.find(drop => drop.currentItems.length > 0)
                setCurrentDrop(nextDrop || null)

                // If no more active drops, complete the process
                if (!nextDrop) {
                    setCurrentDropEventId(null)
                }
            }

            return updated
        })
    }

    // Handle accept action
    const acceptName = async (queueId: string, itemId: string, name: string) => {
        const drop = activeDrops.find(d => d.queueId === queueId)
        if (!drop) return

        setIsProcessing(true)
        try {
            // Add to picked up list in database
            const { data: participant, error } = await supabase
                .from("drop_participants")
                .insert([{
                    drop_event_id: drop.dropEventId,
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

            // Remove this item from processing (no replacement for accept)
            await processNextItem(queueId, false, itemId)

        } catch (error) {
            console.error("Error accepting name:", error)
        } finally {
            setIsProcessing(false)
        }
    }

    // Handle skip action
    const skipName = async (queueId: string, itemId: string, name: string) => {
        const drop = activeDrops.find(d => d.queueId === queueId)
        if (!drop) return

        setIsProcessing(true)
        try {
            // Add to missed list in database
            const { data: participant, error } = await supabase
                .from("drop_participants")
                .insert([{
                    drop_event_id: drop.dropEventId,
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

            // Remove this item and pull replacement
            await processNextItem(queueId, true, itemId)

        } catch (error) {
            console.error("Error skipping name:", error)
        } finally {
            setIsProcessing(false)
        }
    }

    // Handle decline action
    const declineName = async (queueId: string, itemId: string, name: string) => {
        const drop = activeDrops.find(d => d.queueId === queueId)
        if (!drop) return

        setIsProcessing(true)
        try {
            // Add to missed list in database
            const { data: participant, error } = await supabase
                .from("drop_participants")
                .insert([{
                    drop_event_id: drop.dropEventId,
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

            // Remove this item (no replacement for decline)
            await processNextItem(queueId, false, itemId)

        } catch (error) {
            console.error("Error declining name:", error)
        } finally {
            setIsProcessing(false)
        }
    }

    // Reset drops
    const resetDrops = () => {
        setActiveDrops([])
        setCurrentDrop(null)
        setCurrentDropEventId(null)
        setParticipantList([])
        // Don't clear picked up and missed lists - they should persist
        // If user wants to clear them, they can use the clear buttons
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

    // Copy drop results to clipboard
    const copyDropResults = async (queueId: string) => {
        const drop = activeDrops.find(d => d.queueId === queueId)
        if (!drop) return

        // Get current participants being processed for this drop
        const currentParticipants = drop.currentItems.map(item => item.name)

        if (currentParticipants.length === 0) return

        const itemName = drop.itemName
        const copyText = `${itemName}: ${currentParticipants.join(', ')}`

        try {
            await navigator.clipboard.writeText(copyText)
            console.log('Copied to clipboard:', copyText)
        } catch (error) {
            console.error('Failed to copy to clipboard:', error)
        }
    }

    // Clear picked up list
    const clearPickedUpList = async () => {
        setIsProcessing(true)
        try {
            // Clear all "accept" participants from recent drop events (last 24 hours)
            const twentyFourHoursAgo = new Date()
            twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

            const { data: dropEvents, error: eventsError } = await supabase
                .from("drop_events")
                .select("id")
                .gte("created_at", twentyFourHoursAgo.toISOString())

            if (eventsError) throw eventsError

            if (dropEvents && dropEvents.length > 0) {
                const dropEventIds = dropEvents.map(event => event.id)

                const { error } = await supabase
                    .from("drop_participants")
                    .delete()
                    .in("drop_event_id", dropEventIds)
                    .eq("action", "accept")

                if (error) throw error
            }

            setPickedUpList([])
        } catch (error) {
            console.error("Error clearing picked up list:", error)
        } finally {
            setIsProcessing(false)
        }
    }

    // Clear missed list
    const clearMissedList = async () => {
        setIsProcessing(true)
        try {
            // Clear all "skip" and "decline" participants from recent drop events (last 24 hours)
            const twentyFourHoursAgo = new Date()
            twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

            const { data: dropEvents, error: eventsError } = await supabase
                .from("drop_events")
                .select("id")
                .gte("created_at", twentyFourHoursAgo.toISOString())

            if (eventsError) throw eventsError

            if (dropEvents && dropEvents.length > 0) {
                const dropEventIds = dropEvents.map(event => event.id)

                const { error } = await supabase
                    .from("drop_participants")
                    .delete()
                    .in("drop_event_id", dropEventIds)
                    .in("action", ["skip", "decline"])

                if (error) throw error
            }

            setMissedList([])
        } catch (error) {
            console.error("Error clearing missed list:", error)
        } finally {
            setIsProcessing(false)
        }
    }

    const contextValue: DropContextType = {
        isProcessing,
        isLoadingData,
        activeDrops,
        currentDrop,
        pickedUpList,
        missedList,
        participantList,
        startDrops,
        acceptName,
        skipName,
        declineName,
        resetDrops,
        getTotalProgress,
        hasActiveDrops,
        copyDropResults,
        clearPickedUpList,
        clearMissedList
    }

    return (
        <DropContext.Provider value={contextValue}>
            {children}
        </DropContext.Provider>
    )
} 