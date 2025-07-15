"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Minus, Plus, Zap } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

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

interface DropInputPanelProps {
    queues: QueueWithItems[]
    onStartDrops: (dropCounts: Record<string, number>) => void
    isProcessing: boolean
}

export function DropInputPanel({ queues, onStartDrops, isProcessing }: DropInputPanelProps) {
    const { user } = useAuth()
    const [dropCounts, setDropCounts] = useState<Record<string, number>>({})

    // Initialize drop counts for all queues
    const getDropCount = (queueId: string) => dropCounts[queueId] || 0

    const updateDropCount = (queueId: string, newCount: number) => {
        const clampedCount = Math.max(0, newCount)
        setDropCounts(prev => ({
            ...prev,
            [queueId]: clampedCount
        }))
    }

    const getTotalDrops = () => Object.values(dropCounts).reduce((sum, count) => sum + count, 0)

    const handleStartDrops = () => {
        const validDropCounts = Object.entries(dropCounts).reduce((acc, [queueId, count]) => {
            if (count > 0) {
                acc[queueId] = count
            }
            return acc
        }, {} as Record<string, number>)

        if (Object.keys(validDropCounts).length > 0) {
            onStartDrops(validDropCounts)
        }
    }

    // Only masters can initiate drops
    if (user?.role !== "master") {
        return null
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground mb-2 mu-text-glow">
                    <Zap className="inline-block w-6 h-6 mr-2 text-mu-electric" />
                    Drop Management
                </h2>
                <p className="text-muted-foreground">
                    Set the number of drops for each queue (0-5)
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {queues.map((queue) => {
                    const approvedCount = queue.items.filter(item => item.status === "approved").length
                    const dropCount = getDropCount(queue.id)

                    return (
                        <Card key={queue.id} className="mu-border-glow bg-card/50 backdrop-blur-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        {queue.image_url ? (
                                            <img
                                                src={queue.image_url}
                                                alt={queue.item_name}
                                                className="w-12 h-12 rounded-lg object-cover border border-mu-electric/30"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-mu-electric/10 border border-mu-electric/30 flex items-center justify-center">
                                                <span className="text-mu-electric text-xs">No Image</span>
                                            </div>
                                        )}
                                        <span className="text-mu-electric truncate">{queue.item_name}</span>
                                    </div>
                                    <Badge variant="secondary" className="ml-2">
                                        {approvedCount} members
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-center space-x-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => updateDropCount(queue.id, dropCount - 1)}
                                        disabled={dropCount <= 0 || isProcessing}
                                        className="h-8 w-8 p-0 border-mu-electric/50 hover:border-mu-electric hover:bg-mu-electric/10"
                                    >
                                        <Minus className="h-4 w-4" />
                                    </Button>

                                    <div className="flex items-center justify-center">
                                        <span className="text-2xl font-bold text-mu-electric w-8 text-center">
                                            {dropCount}
                                        </span>
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => updateDropCount(queue.id, dropCount + 1)}
                                        disabled={approvedCount === 0 || isProcessing}
                                        className="h-8 w-8 p-0 border-mu-electric/50 hover:border-mu-electric hover:bg-mu-electric/10"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>

                                {dropCount > 0 && (
                                    <div className="text-center">
                                        <Badge variant="default" className="bg-mu-electric text-mu-dark">
                                            {dropCount} drop{dropCount !== 1 ? 's' : ''} selected
                                        </Badge>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {queues.length === 0 && (
                <Card className="text-center py-8">
                    <CardContent>
                        <p className="text-muted-foreground">No queues available</p>
                    </CardContent>
                </Card>
            )}

            <div className="flex justify-center pt-6">
                <Button
                    onClick={handleStartDrops}
                    disabled={getTotalDrops() === 0 || isProcessing}
                    size="lg"
                    className="mu-button-glow text-lg px-8 py-3"
                >
                    <Zap className="w-5 h-5 mr-2" />
                    {isProcessing ? "Processing..." : `Start ${getTotalDrops()} Drop${getTotalDrops() !== 1 ? 's' : ''}`}
                </Button>
            </div>
        </div>
    )
} 