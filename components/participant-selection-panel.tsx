"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Users, Search, UserCheck, UserX } from "lucide-react"

interface QueueWithItems {
    id: string
    title: string
    item_name: string
    image_url?: string
    items: Array<{
        id: string
        name: string
        position: number
        status: "waiting" | "approved" | "completed"
        requestedBy: string
    }>
}

interface ParticipantSelectionPanelProps {
    queues: QueueWithItems[]
    dropCounts: Record<string, number>
    onParticipantsSelected: (participants: string[]) => void
    onCancel: () => void
}

export function ParticipantSelectionPanel({
    queues,
    dropCounts,
    onParticipantsSelected,
    onCancel
}: ParticipantSelectionPanelProps) {
    const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set())
    const [searchTerm, setSearchTerm] = useState("")

    // Get all unique users from the selected queues
    const availableUsers = useMemo(() => {
        const userSet = new Set<string>()

        Object.keys(dropCounts).forEach(queueId => {
            const queue = queues.find(q => q.id === queueId)
            if (queue) {
                queue.items
                    .filter(item => item.status === "approved")
                    .forEach(item => userSet.add(item.name))
            }
        })

        return Array.from(userSet).sort()
    }, [queues, dropCounts])

    // Filter users based on search term
    const filteredUsers = availableUsers.filter(user =>
        user.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Initialize with all users selected
    useEffect(() => {
        setSelectedParticipants(new Set(availableUsers))
    }, [availableUsers])

    const handleUserToggle = (userName: string) => {
        setSelectedParticipants(prev => {
            const newSet = new Set(prev)
            if (newSet.has(userName)) {
                newSet.delete(userName)
            } else {
                newSet.add(userName)
            }
            return newSet
        })
    }

    const handleSelectAll = () => {
        setSelectedParticipants(new Set(availableUsers))
    }

    const handleDeselectAll = () => {
        setSelectedParticipants(new Set())
    }

    const handleConfirm = () => {
        onParticipantsSelected(Array.from(selectedParticipants))
    }

    return (
        <Card className="mu-border-glow bg-card/50 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-center text-mu-electric flex items-center justify-center">
                    <Users className="w-6 h-6 mr-2" />
                    Select Participants
                </CardTitle>
                <p className="text-center text-sm text-muted-foreground">
                    Choose which users can participate in the drops. Only selected users will be pulled from queues.
                </p>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Select All/None Buttons */}
                <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSelectAll}
                            className="border-mu-electric/50 hover:border-mu-electric hover:bg-mu-electric/10"
                        >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Select All
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDeselectAll}
                            className="border-red-400/50 hover:border-red-400 hover:bg-red-400/10"
                        >
                            <UserX className="w-4 h-4 mr-1" />
                            Deselect All
                        </Button>
                    </div>
                    <Badge variant="outline" className="border-mu-electric/50 text-mu-electric">
                        {selectedParticipants.size} of {availableUsers.length} selected
                    </Badge>
                </div>

                {/* User List */}
                <ScrollArea className="h-64 rounded-md border border-mu-electric/20">
                    <div className="p-4 space-y-2">
                        {filteredUsers.map(user => (
                            <div
                                key={user}
                                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-mu-electric/5 transition-colors"
                            >
                                <Checkbox
                                    id={user}
                                    checked={selectedParticipants.has(user)}
                                    onCheckedChange={() => handleUserToggle(user)}
                                    className="border-mu-electric/50 data-[state=checked]:bg-mu-electric data-[state=checked]:border-mu-electric"
                                />
                                <label
                                    htmlFor={user}
                                    className="flex-1 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    {user}
                                </label>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                {/* Queue Summary */}
                <div className="border border-mu-electric/20 rounded-lg p-3">
                    <h4 className="font-medium text-sm mb-2">Drop Summary:</h4>
                    <div className="space-y-1">
                        {Object.entries(dropCounts).map(([queueId, count]) => {
                            const queue = queues.find(q => q.id === queueId)
                            return (
                                <div key={queueId} className="flex justify-between text-sm">
                                    <span>{queue?.item_name || 'Unknown'}</span>
                                    <Badge variant="secondary">{count} drops</Badge>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        className="border-red-400/50 hover:border-red-400 hover:bg-red-400/10 text-red-400"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={selectedParticipants.size === 0}
                        className="mu-button-glow"
                    >
                        Start Drops ({selectedParticipants.size} participants)
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
} 