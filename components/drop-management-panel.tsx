"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropInputPanel } from "@/components/drop-input-panel"
import { ParticipantSelectionPanel } from "@/components/participant-selection-panel"
import { NameActionCard } from "@/components/name-action-card"
import { PickedUpList } from "@/components/picked-up-list"
import { MissedList } from "@/components/missed-list"
import { useDrops } from "@/components/drop-provider"
import { useAuth } from "@/components/auth-provider"
import { Zap, RotateCcw, Target, Users, ArrowLeft, Copy } from "lucide-react"

export function DropManagementPanel() {
    const { user, queues } = useAuth()
    const {
        isProcessing,
        currentDrop,
        pickedUpList,
        missedList,
        startDrops,
        acceptName,
        skipName,
        declineName,
        resetDrops,
        getTotalProgress,
        hasActiveDrops,
        activeDrops,
        copyDropResults,
        clearPickedUpList,
        clearMissedList
    } = useDrops()

    const [selectedDropCounts, setSelectedDropCounts] = useState<Record<string, number>>({})
    const [showParticipantSelection, setShowParticipantSelection] = useState(false)

    // Only masters can access drop management
    if (user?.role !== "master") {
        return null
    }

    const handleDropInputComplete = (dropCounts: Record<string, number>) => {
        setSelectedDropCounts(dropCounts)
        setShowParticipantSelection(true)
    }

    const handleParticipantsSelected = async (participants: string[]) => {
        setShowParticipantSelection(false)
        await startDrops(selectedDropCounts, participants)
    }

    const handleCancelParticipantSelection = () => {
        setShowParticipantSelection(false)
        setSelectedDropCounts({})
    }

    const handleResetDrops = () => {
        resetDrops()
        setSelectedDropCounts({})
        setShowParticipantSelection(false)
    }

    const totalProgress = getTotalProgress()
    const hasResults = pickedUpList.length > 0 || missedList.length > 0

    // Show participant selection
    if (showParticipantSelection) {
        return (
            <div className="space-y-6">
                <ParticipantSelectionPanel
                    queues={queues}
                    dropCounts={selectedDropCounts}
                    onParticipantsSelected={handleParticipantsSelected}
                    onCancel={handleCancelParticipantSelection}
                />

                {/* Always show tables at bottom */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <PickedUpList
                        participants={pickedUpList as any}
                        onClear={clearPickedUpList}
                    />
                    <MissedList
                        participants={missedList as any}
                        onClear={clearMissedList}
                    />
                </div>
            </div>
        )
    }

    // Show input panel when no active drops
    if (!hasActiveDrops()) {
        return (
            <div className="space-y-6">
                <Card className="mu-border-glow bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-center text-mu-electric flex items-center justify-center">
                            <Target className="w-6 h-6 mr-2" />
                            Drop Management System
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DropInputPanel
                            queues={queues}
                            onStartDrops={handleDropInputComplete}
                            isProcessing={isProcessing}
                        />
                    </CardContent>
                </Card>

                {/* Always show tables at bottom */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <PickedUpList
                        participants={pickedUpList as any}
                        onClear={clearPickedUpList}
                    />
                    <MissedList
                        participants={missedList as any}
                        onClear={clearMissedList}
                    />
                </div>
            </div>
        )
    }

    // Show active drop management
    return (
        <div className="space-y-6">
            {/* Header */}
            <Card className="mu-border-glow bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-center text-mu-electric flex items-center justify-center">
                        <Target className="w-6 h-6 mr-2" />
                        Drop Management System
                    </CardTitle>
                </CardHeader>
            </Card>

            {/* Progress Bar */}
            <Card className="mu-border-glow bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-center text-mu-electric">
                        Drop Progress
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Overall Progress</span>
                            <span>{Math.round(totalProgress)}%</span>
                        </div>
                        <Progress value={totalProgress} className="h-3" />
                    </div>

                    {/* Show current drop status */}
                    {currentDrop && (
                        <div className="mt-4 text-center text-sm text-muted-foreground">
                            Processing: {currentDrop.itemName} ({currentDrop.processedCount}/{currentDrop.totalCount})
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Copy Buttons - Between Progress and Drop Cards */}
            {currentDrop && (
                <Card className="mu-border-glow bg-card/50 backdrop-blur-sm">
                    <CardContent className="pt-6">
                        <div className="flex justify-center">
                            <Button
                                onClick={() => copyDropResults(currentDrop.queueId)}
                                variant="outline"
                                className="border-mu-gold/50 hover:border-mu-gold hover:bg-mu-gold/10 text-mu-gold"
                            >
                                <Copy className="w-4 h-4 mr-2" />
                                Copy {currentDrop.itemName}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Current Name Action Cards */}
            {currentDrop && currentDrop.currentItems && currentDrop.currentItems.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentDrop.currentItems.map((item: any, index: number) => (
                        <NameActionCard
                            key={item.id}
                            name={item.name}
                            itemName={currentDrop.itemName}
                            imageUrl={currentDrop.imageUrl}
                            queueId={currentDrop.queueId}
                            itemId={item.id}
                            currentIndex={index}
                            totalCount={currentDrop.currentItems?.length || 1}
                            onAccept={acceptName}
                            onSkip={skipName}
                            onDecline={declineName}
                            isProcessing={isProcessing}
                        />
                    ))}
                </div>
            )}

            {/* Always show tables at bottom */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PickedUpList
                    participants={pickedUpList as any}
                    onClear={clearPickedUpList}
                />
                <MissedList
                    participants={missedList as any}
                    onClear={clearMissedList}
                />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
                <Button
                    onClick={handleResetDrops}
                    variant="outline"
                    size="lg"
                    className="border-red-400/50 hover:border-red-400 hover:bg-red-400/10 text-red-400"
                >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Reset Drops
                </Button>
            </div>
        </div>
    )
} 