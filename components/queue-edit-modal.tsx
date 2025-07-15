"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ImageUpload } from "@/components/image-upload"
import { useAuth } from "@/components/auth-provider"
import { Edit, Save, X } from "lucide-react"

interface QueueEditModalProps {
    queue: {
        id: string
        title: string
        item_name: string
        image_url?: string
    }
    isOpen: boolean
    onClose: () => void
}

export function QueueEditModal({ queue, isOpen, onClose }: QueueEditModalProps) {
    const { user, updateQueueDetails } = useAuth()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: queue.title,
        item_name: queue.item_name,
        image_url: queue.image_url || null
    })

    // Update form data when queue changes
    useEffect(() => {
        setFormData({
            title: queue.title,
            item_name: queue.item_name,
            image_url: queue.image_url || null
        })
    }, [queue])

    // Check if form has changes
    const hasChanges = () => {
        return (
            formData.title !== queue.title ||
            formData.item_name !== queue.item_name ||
            formData.image_url !== (queue.image_url || null)
        )
    }

    // Handle form submission
    const handleSave = async () => {
        if (!user || user.role !== "master") return

        if (!formData.title.trim()) {
            alert("Queue name is required")
            return
        }

        if (!formData.item_name.trim()) {
            alert("Item name is required")
            return
        }

        setLoading(true)
        try {
            const updates: any = {}

            if (formData.title !== queue.title) {
                updates.title = formData.title.trim()
            }

            if (formData.item_name !== queue.item_name) {
                updates.item_name = formData.item_name.trim()
            }

            if (formData.image_url !== (queue.image_url || null)) {
                updates.image_url = formData.image_url
            }

            if (Object.keys(updates).length > 0) {
                await updateQueueDetails(queue.id, updates)
            }

            onClose()
        } catch (error) {
            console.error("Error updating queue:", error)
            alert("Failed to update queue details")
        } finally {
            setLoading(false)
        }
    }

    // Handle cancel
    const handleCancel = () => {
        setFormData({
            title: queue.title,
            item_name: queue.item_name,
            image_url: queue.image_url || null
        })
        onClose()
    }

    // Handle image change
    const handleImageChange = (imageUrl: string | null) => {
        setFormData(prev => ({ ...prev, image_url: imageUrl }))
    }

    // Only masters can edit
    if (!user || user.role !== "master") {
        return null
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center text-mu-electric">
                        <Edit className="w-5 h-5 mr-2" />
                        Edit Queue Details
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Queue Name */}
                    <div className="space-y-2">
                        <Label htmlFor="queue-name" className="text-sm font-medium">
                            Queue Name
                        </Label>
                        <Input
                            id="queue-name"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Enter queue name"
                            className="border-mu-electric/30 focus:border-mu-electric"
                        />
                    </div>

                    {/* Item Name */}
                    <div className="space-y-2">
                        <Label htmlFor="item-name" className="text-sm font-medium">
                            Item Name
                        </Label>
                        <Input
                            id="item-name"
                            value={formData.item_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, item_name: e.target.value }))}
                            placeholder="Enter item name"
                            className="border-mu-electric/30 focus:border-mu-electric"
                        />
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            Item Image (Optional)
                        </Label>
                        <ImageUpload
                            currentImageUrl={formData.image_url || undefined}
                            onImageChange={handleImageChange}
                        />
                    </div>

                    {/* Preview */}
                    <div className="p-4 bg-mu-electric/5 rounded-lg border border-mu-electric/20">
                        <Label className="text-sm font-medium text-mu-electric mb-2 block">
                            Preview
                        </Label>
                        <div className="flex items-center space-x-3">
                            {formData.image_url ? (
                                <img
                                    src={formData.image_url}
                                    alt={formData.item_name}
                                    className="w-12 h-12 rounded-lg object-cover border border-mu-electric/30"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-lg bg-mu-electric/10 border border-mu-electric/30 flex items-center justify-center">
                                    <span className="text-mu-electric text-xs">No Image</span>
                                </div>
                            )}
                            <div>
                                <p className="font-medium text-mu-electric">{formData.item_name || "Item Name"}</p>
                                <p className="text-sm text-muted-foreground">{formData.title || "Queue Name"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                            className="flex-1 border-mu-electric/30 hover:border-mu-electric hover:bg-mu-electric/10"
                        >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={loading || !hasChanges()}
                            className="flex-1 mu-button-glow"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
} 