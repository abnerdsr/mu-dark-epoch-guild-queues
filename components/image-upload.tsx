"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { Upload, X, Image as ImageIcon, Clipboard } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

interface ImageUploadProps {
    currentImageUrl?: string
    onImageChange: (imageUrl: string | null) => void
    className?: string
}

export function ImageUpload({ currentImageUrl, onImageChange, className = "" }: ImageUploadProps) {
    const { user } = useAuth()
    const [isUploading, setIsUploading] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Resize image to 50x50px
    const resizeImage = useCallback((file: File): Promise<Blob> => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')!
            const img = new Image()

            img.onload = () => {
                canvas.width = 50
                canvas.height = 50

                // Draw image to canvas with proper sizing
                ctx.drawImage(img, 0, 0, 50, 50)

                canvas.toBlob((blob) => {
                    resolve(blob!)
                }, 'image/jpeg', 0.9)
            }

            img.src = URL.createObjectURL(file)
        })
    }, [])

    // Upload image via API endpoint
    const uploadImage = useCallback(async (file: File) => {
        if (!user || user.role !== "master") return null

        setIsUploading(true)
        try {
            // Resize image to 50x50px
            const resizedBlob = await resizeImage(file)

            // Create form data
            const formData = new FormData()
            formData.append('file', resizedBlob, 'image.jpg')
            formData.append('userId', user.id)

            // Upload via API
            const response = await fetch('/api/upload-image', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Upload failed')
            }

            const data = await response.json()
            return data.url
        } catch (error: any) {
            console.error('Error uploading image:', {
                message: error?.message || 'Unknown error',
                error: error
            })
            alert(`Failed to upload image: ${error?.message || 'Unknown error'}`)
            return null
        } finally {
            setIsUploading(false)
        }
    }, [user, resizeImage])

    // Remove image via API endpoint
    const removeImage = useCallback(async (imageUrl: string) => {
        if (!user || user.role !== "master") return

        try {
            const response = await fetch(`/api/upload-image?url=${encodeURIComponent(imageUrl)}&userId=${user.id}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Delete failed')
            }
        } catch (error: any) {
            console.error('Error removing image:', {
                message: error?.message || 'Unknown error',
                error: error
            })
        }
    }, [user])

    // Handle file selection
    const handleFileSelect = useCallback(async (files: FileList) => {
        if (!files.length) return

        const file = files[0]

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file')
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be less than 5MB')
            return
        }

        // Remove current image if exists
        if (currentImageUrl) {
            await removeImage(currentImageUrl)
        }

        // Upload new image
        const imageUrl = await uploadImage(file)
        if (imageUrl) {
            onImageChange(imageUrl)
        }
    }, [currentImageUrl, removeImage, uploadImage, onImageChange])

    // Handle clipboard paste
    const handlePaste = useCallback(async (e: ClipboardEvent) => {
        // Allow paste anywhere in the document when the component is mounted
        const clipboardItems = e.clipboardData?.items
        if (!clipboardItems) return

        // Look for image items
        for (let i = 0; i < clipboardItems.length; i++) {
            const item = clipboardItems[i]
            if (item.type.startsWith('image/')) {
                e.preventDefault()
                const file = item.getAsFile()
                if (file) {
                    console.log('Pasted image:', file.name, file.size, file.type)

                    // Validate file size (max 5MB)
                    if (file.size > 5 * 1024 * 1024) {
                        alert('Image size must be less than 5MB')
                        return
                    }

                    // Remove current image if exists
                    if (currentImageUrl) {
                        await removeImage(currentImageUrl)
                    }

                    // Upload new image
                    const imageUrl = await uploadImage(file)
                    if (imageUrl) {
                        onImageChange(imageUrl)
                    }
                }
                break
            }
        }
    }, [currentImageUrl, removeImage, uploadImage, onImageChange])

    // Add paste event listener
    useEffect(() => {
        const handleDocumentPaste = (e: ClipboardEvent) => {
            // Only handle paste if the component is visible and user can upload
            if (user?.role === 'master') {
                handlePaste(e)
            }
        }

        document.addEventListener('paste', handleDocumentPaste)
        return () => document.removeEventListener('paste', handleDocumentPaste)
    }, [handlePaste, user])

    // Handle drag events
    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files)
        }
    }, [handleFileSelect])

    // Handle click to select file
    const handleClick = useCallback(() => {
        fileInputRef.current?.click()
    }, [])

    // Handle remove image
    const handleRemoveImage = useCallback(async () => {
        if (!currentImageUrl) return

        await removeImage(currentImageUrl)
        onImageChange(null)
    }, [currentImageUrl, removeImage, onImageChange])

    return (
        <div className={`space-y-2 ${className}`} ref={containerRef}>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                className="hidden"
            />

            <Card
                className={`relative overflow-hidden transition-colors cursor-pointer ${dragActive ? 'border-mu-electric bg-mu-electric/5' : 'border-border hover:border-mu-electric/50'
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={handleClick}
            >
                <CardContent className="p-4">
                    {currentImageUrl ? (
                        <div className="relative group">
                            <img
                                src={currentImageUrl}
                                alt="Queue item"
                                className="w-12 h-12 mx-auto rounded-lg object-cover border border-mu-electric/30"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleRemoveImage()
                                    }}
                                    className="h-8 w-8 p-0"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-4 text-center">
                            <div className="w-12 h-12 rounded-lg bg-mu-electric/10 border border-mu-electric/30 flex items-center justify-center mb-2">
                                <ImageIcon className="h-6 w-6 text-mu-electric" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {isUploading ? 'Uploading...' : 'Click, drag, or paste image here'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                50x50px • Max 5MB • Ctrl+V to paste
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {currentImageUrl && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="w-full border-red-400/50 hover:border-red-400 hover:bg-red-400/10 text-red-400"
                >
                    <X className="h-4 w-4 mr-2" />
                    Remove Image
                </Button>
            )}
        </div>
    )
} 