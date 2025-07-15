"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { AlertCircle, SkipForward, X, Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { DropParticipant } from "@/lib/supabase"

interface MissedParticipant extends DropParticipant {
    itemName: string
    imageUrl?: string
    action: "skip" | "decline"
}

interface MissedListProps {
    participants: MissedParticipant[]
    className?: string
    onClear?: () => Promise<void>
}

export function MissedList({ participants, className = "", onClear }: MissedListProps) {
    const [currentPage, setCurrentPage] = useState(1)
    const [isClearing, setIsClearing] = useState(false)
    const itemsPerPage = 10

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

    // Calculate pagination
    const totalPages = Math.ceil(participants.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentParticipants = participants.slice(startIndex, endIndex)

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const handleClear = async () => {
        if (!onClear) return

        setIsClearing(true)
        try {
            await onClear()
        } catch (error) {
            console.error("Error clearing missed list:", error)
        } finally {
            setIsClearing(false)
        }
    }

    return (
        <Card className={`mu-border-glow bg-card/50 backdrop-blur-sm ${className}`}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center text-red-400">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        Missed List
                        <Badge variant="outline" className="ml-2 border-red-400/50 text-red-400">
                            {participants.length}
                        </Badge>
                    </CardTitle>
                    {onClear && participants.length > 0 && (
                        <Button
                            onClick={handleClear}
                            disabled={isClearing}
                            variant="outline"
                            size="sm"
                            className="border-red-400/50 hover:border-red-400 hover:bg-red-400/10 text-red-400"
                        >
                            {isClearing ? "Clearing..." : "Clear List"}
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent>
                {participants.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400/50" />
                        <p>No participants missed yet</p>
                    </div>
                ) : (
                    <>
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
                                    {currentParticipants.map((participant, index) => (
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

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-muted-foreground">
                                    Showing {startIndex + 1}-{Math.min(endIndex, participants.length)} of {participants.length} entries
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="border-mu-electric/50 hover:border-mu-electric"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <span className="text-sm text-mu-electric">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="border-mu-electric/50 hover:border-mu-electric"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    )
} 