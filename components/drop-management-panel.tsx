"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropInputPanel } from "@/components/drop-input-panel"
import { NameActionCard } from "@/components/name-action-card"
import { PickedUpList } from "@/components/picked-up-list"
import { MissedList } from "@/components/missed-list"
import { useDrops } from "@/components/drop-provider"
import { useAuth } from "@/components/auth-provider"
import { Zap, RotateCcw, Target, Users } from "lucide-react"

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
        hasActiveDrops
    } = useDrops()

    const [isModalOpen, setIsModalOpen] = useState(false)

    // Only masters can access drop management
    if (user?.role !== "master") {
        return null
    }

    const handleStartDrops = async (dropCounts: Record<string, number>) => {
        await startDrops(dropCounts)
        setIsModalOpen(false)
    }

    const handleResetDrops = () => {
        resetDrops()
        setIsModalOpen(false)
    }

    const totalProgress = getTotalProgress()
    const hasResults = pickedUpList.length > 0 || missedList.length > 0

    return (
        <>
            {/* Drop Management Button */}
            <div className="mb-6 flex justify-center">
                <Button
                    onClick={() => setIsModalOpen(true)}
                    size="lg"
                    className="mu-button-glow text-lg px-8 py-3"
                    disabled={isProcessing}
                >
                    <Zap className="w-5 h-5 mr-2" />
                    {hasActiveDrops() ? "Continue Drop Management" : "Start Drop Management"}
                </Button>
            </div>

            {/* Drop Management Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-center mu-text-glow">
                            <Target className="inline-block w-6 h-6 mr-2 text-mu-electric" />
                            Drop Management System
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Progress Bar (when active) */}
                        {hasActiveDrops() && (
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
                                </CardContent>
                            </Card>
                        )}

                        {/* Current Name Action (when processing) */}
                        {currentDrop && currentDrop.currentItem && (
                            <div className="flex justify-center">
                                <NameActionCard
                                    name={currentDrop.currentItem.name}
                                    itemName={currentDrop.itemName}
                                    imageUrl={currentDrop.imageUrl}
                                    queueId={currentDrop.queueId}
                                    itemId={currentDrop.currentItem.id}
                                    currentIndex={currentDrop.processedCount}
                                    totalCount={currentDrop.totalCount}
                                    onAccept={acceptName}
                                    onSkip={skipName}
                                    onDecline={declineName}
                                    isProcessing={isProcessing}
                                />
                            </div>
                        )}

                        {/* Drop Input Panel (when not processing) */}
                        {!hasActiveDrops() && (
                            <DropInputPanel
                                queues={queues}
                                onStartDrops={handleStartDrops}
                                isProcessing={isProcessing}
                            />
                        )}

                        {/* Results Section */}
                        {hasResults && (
                            <Tabs defaultValue="picked-up" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="picked-up" className="flex items-center space-x-2">
                                        <Users className="w-4 h-4" />
                                        <span>Picked Up</span>
                                        <Badge variant="outline" className="border-green-400/50 text-green-400">
                                            {pickedUpList.length}
                                        </Badge>
                                    </TabsTrigger>
                                    <TabsTrigger value="missed" className="flex items-center space-x-2">
                                        <Users className="w-4 h-4" />
                                        <span>Missed</span>
                                        <Badge variant="outline" className="border-red-400/50 text-red-400">
                                            {missedList.length}
                                        </Badge>
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="picked-up" className="mt-4">
                                    <PickedUpList participants={pickedUpList} />
                                </TabsContent>

                                <TabsContent value="missed" className="mt-4">
                                    <MissedList participants={missedList} />
                                </TabsContent>
                            </Tabs>
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-center space-x-4 pt-4">
                            {hasActiveDrops() && (
                                <Button
                                    onClick={handleResetDrops}
                                    variant="outline"
                                    size="lg"
                                    className="border-red-400/50 hover:border-red-400 hover:bg-red-400/10 text-red-400"
                                >
                                    <RotateCcw className="w-5 h-5 mr-2" />
                                    Reset Drops
                                </Button>
                            )}

                            <Button
                                onClick={() => setIsModalOpen(false)}
                                variant="outline"
                                size="lg"
                                className="border-mu-electric/50 hover:border-mu-electric hover:bg-mu-electric/10 text-mu-electric"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Results Display (outside modal, persistent) */}
            {hasResults && !isModalOpen && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    <PickedUpList participants={pickedUpList} />
                    <MissedList participants={missedList} />
                </div>
            )}
        </>
    )
} 