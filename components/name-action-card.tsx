"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, SkipForward, X, User, Clock } from "lucide-react"

interface NameActionCardProps {
    name: string
    itemName: string
    imageUrl?: string
    queueId: string
    itemId: string
    currentIndex: number
    totalCount: number
    onAccept: (queueId: string, itemId: string, name: string) => void
    onSkip: (queueId: string, itemId: string, name: string) => void
    onDecline: (queueId: string, itemId: string, name: string) => void
    isProcessing: boolean
}

export function NameActionCard({
    name,
    itemName,
    imageUrl,
    queueId,
    itemId,
    currentIndex,
    totalCount,
    onAccept,
    onSkip,
    onDecline,
    isProcessing
}: NameActionCardProps) {
    return (
        <Card className="mx-auto max-w-md mu-electric-glow-strong bg-card/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-3">
                <div className="flex items-center justify-center space-x-2 mb-4">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={itemName}
                            className="w-12 h-12 rounded-lg object-cover border border-mu-electric/30"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-lg bg-mu-electric/10 border border-mu-electric/30 flex items-center justify-center">
                            <span className="text-mu-electric text-xs">No Image</span>
                        </div>
                    )}
                    <div className="flex flex-col items-center space-y-1">
                        <Badge variant="outline" className="border-mu-electric text-mu-electric">
                            {itemName}
                        </Badge>
                        <Badge variant="secondary">
                            {currentIndex + 1} of {totalCount}
                        </Badge>
                    </div>
                </div>
                <CardTitle className="text-2xl font-bold text-foreground mu-text-glow">
                    <User className="inline-block w-6 h-6 mr-2 text-mu-electric" />
                    {name}
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Action Buttons */}
                <div className="space-y-3">
                    <Button
                        onClick={() => onAccept(queueId, itemId, name)}
                        disabled={isProcessing}
                        size="lg"
                        className="w-full mu-button-glow text-lg font-semibold"
                    >
                        <Check className="w-5 h-5 mr-2" />
                        Accept
                    </Button>

                    <Button
                        onClick={() => onSkip(queueId, itemId, name)}
                        disabled={isProcessing}
                        variant="outline"
                        size="lg"
                        className="w-full border-mu-electric/50 hover:border-mu-electric hover:bg-mu-electric/10 text-mu-electric"
                    >
                        <SkipForward className="w-5 h-5 mr-2" />
                        Skip
                    </Button>

                    <Button
                        onClick={() => onDecline(queueId, itemId, name)}
                        disabled={isProcessing}
                        variant="outline"
                        size="lg"
                        className="w-full border-red-500/50 hover:border-red-500 hover:bg-red-500/10 text-red-400"
                    >
                        <X className="w-5 h-5 mr-2" />
                        Decline
                    </Button>
                </div>

                {/* Action Descriptions */}
                <div className="text-xs text-muted-foreground space-y-1">
                    <p><strong className="text-green-400">Accept:</strong> Add to picked up list, move to end of queue</p>
                    <p><strong className="text-mu-electric">Skip:</strong> Add to missed list, move to end of queue, pull next name</p>
                    <p><strong className="text-red-400">Decline:</strong> Add to missed list, move to end of queue, no replacement</p>
                </div>

                {isProcessing && (
                    <div className="flex items-center justify-center space-x-2 text-mu-electric">
                        <Clock className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Processing...</span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
} 