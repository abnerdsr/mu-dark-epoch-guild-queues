"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, SkipForward, X, Calendar } from "lucide-react"
import { DropParticipant } from "@/lib/supabase"

interface MissedParticipant extends DropParticipant {
    itemName: string
    imageUrl?: string
    action: "skip" | "decline"
}

interface MissedListProps {
    participants: MissedParticipant[]
    className?: string
}

export function MissedList({ participants, className = "" }: MissedListProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString()
    }

    const getDropNumber = (dropEventId: string) => {
        // Group participants by drop event and get the count
        const dropEvents = participants.reduce((acc, p) => {
            acc[p.drop_event_id] = (acc[p.drop_event_id] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        return dropEvents[dropEventId] || 0
    }

    const getActionIcon = (action: "skip" | "decline") => {
        return action === "skip" ? (
            <SkipForward className="w-4 h-4 text-yellow-400" />
        ) : (
            <X className="w-4 h-4 text-red-400" />
        )
    }

    const getActionBadge = (action: "skip" | "decline") => {
        return action === "skip" ? (
            <Badge variant="outline" className="border-yellow-400/50 text-yellow-400">
                Skipped
            </Badge>
        ) : (
            <Badge variant="outline" className="border-red-400/50 text-red-400">
                Declined
            </Badge>
        )
    }

    return (
        <Card className={`mu-border-glow bg-card/50 backdrop-blur-sm ${className}`}>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center text-red-400">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    Missed List
                    <Badge variant="outline" className="ml-2 border-red-400/50 text-red-400">
                        {participants.length}
                    </Badge>
                </CardTitle>
            </CardHeader>

            <CardContent>
                {participants.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400/50" />
                        <p>No participants missed yet</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border/50">
                                    <TableHead className="text-red-400">Name</TableHead>
                                    <TableHead className="text-red-400">Item</TableHead>
                                    <TableHead className="text-red-400">Action</TableHead>
                                    <TableHead className="text-red-400">Drop #</TableHead>
                                    <TableHead className="text-red-400">Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {participants.map((participant, index) => (
                                    <TableRow key={participant.id} className="border-border/30 hover:bg-red-400/5">
                                        <TableCell className="font-medium">
                                            <div className="flex items-center space-x-2">
                                                {getActionIcon(participant.action)}
                                                <span className="text-foreground">{participant.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                {participant.imageUrl ? (
                                                    <img
                                                        src={participant.imageUrl}
                                                        alt={participant.itemName}
                                                        className="w-6 h-6 rounded object-cover border border-mu-electric/30"
                                                    />
                                                ) : (
                                                    <div className="w-6 h-6 rounded bg-mu-electric/10 border border-mu-electric/30 flex items-center justify-center">
                                                        <span className="text-mu-electric text-xs">?</span>
                                                    </div>
                                                )}
                                                <Badge variant="outline" className="border-mu-electric/50 text-mu-electric">
                                                    {participant.itemName}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getActionBadge(participant.action)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="default" className="bg-red-400/20 text-red-400 border-red-400/50">
                                                #{getDropNumber(participant.drop_event_id)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            <div className="flex items-center space-x-1">
                                                <Calendar className="w-3 h-3" />
                                                <span className="text-xs">{formatDate(participant.created_at)}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    )
} 