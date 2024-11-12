"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload } from "lucide-react"

interface CreateRestaurantModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    adminEmail: string;
}

const CreateRestaurantModal = ({
    isOpen,
    onClose,
    onSuccess,
    adminEmail
}: CreateRestaurantModalProps) => {
    const [loading, setLoading] = useState(false)
    const [idError, setIdError] = useState('')
    const [formData, setFormData] = useState({
        id: "",
        name: "",
        ownerEmail: adminEmail,
    })
    const [selectedImage, setSelectedImage] = useState<{
        file: File | null;
        preview: string;
    }>({
        file: null,
        preview: ""
    })

    // Reset form and error state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setFormData({
                id: "",
                name: "",
                ownerEmail: adminEmail,
            })
            setSelectedImage({ file: null, preview: "" })
            setIdError('')
        }
    }, [isOpen, adminEmail])

    const checkRestaurantId = async (id: string) => {
        try {
            const res = await fetch(`/api/restaurants/check-id?id=${encodeURIComponent(id)}`)
            const data = await res.json()
            if (data.exists) {
                setIdError('This restaurant ID already exists. Please choose another.')
                return true
            }
            setIdError('')
            return false
        } catch (error) {
            console.error('Error checking restaurant ID:', error)
            return false
        }
    }

    const handleIdChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newId = e.target.value
        setFormData(prev => ({ ...prev, id: newId }))

        if (newId.trim()) {
            await checkRestaurantId(newId)
        } else {
            setIdError('')
        }
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()

            reader.onloadend = () => {
                setSelectedImage({
                    file,
                    preview: reader.result as string
                })
            }

            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Check for ID existence before submitting
        if (await checkRestaurantId(formData.id)) {
            return // Stop if ID exists
        }

        try {
            setLoading(true)

            if (!selectedImage.file) {
                throw new Error('Please select an image')
            }

            const formDataToSend = new FormData()
            formDataToSend.append('id', formData.id)
            formDataToSend.append('name', formData.name)
            formDataToSend.append('ownerEmail', formData.ownerEmail)
            formDataToSend.append('image', selectedImage.file)

            const response = await fetch('/api/restaurants', {
                method: 'POST',
                body: formDataToSend,
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to create restaurant')
            }

            onSuccess()
        } catch (error) {
            console.error('Error creating restaurant:', error)
            if (error instanceof Error && error.message.includes('ID already exists')) {
                setIdError('This restaurant ID already exists. Please choose another.')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-white dark:bg-gray-800 sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-gray-900 dark:text-white">
                        Create New Restaurant
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="id" className="text-gray-900 dark:text-white">
                                Restaurant ID
                            </Label>
                            <Input
                                id="id"
                                value={formData.id}
                                onChange={handleIdChange}
                                placeholder="Enter restaurant ID"
                                required
                                className={`mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                  ${idError ? 'border-red-500 focus:border-red-500' : ''}`}
                            />
                            {idError && (
                                <p className="mt-1 text-sm text-red-500">
                                    {idError}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="name" className="text-gray-900 dark:text-white">
                                Restaurant Name
                            </Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter restaurant name"
                                required
                                className="mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>

                        <div>
                            <Label className="text-gray-900 dark:text-white">Banner Image</Label>
                            <div className="mt-2 flex flex-col items-center gap-4">
                                <label
                                    htmlFor="image-upload"
                                    className="flex flex-col items-center justify-center w-full h-32 
                    border-2 border-dashed border-gray-300 dark:border-gray-600 
                    rounded-lg cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 
                    bg-gray-50 dark:bg-gray-700 transition-colors"
                                >
                                    {selectedImage.preview ? (
                                        <div className="relative w-full h-full">
                                            {/* eslint-disable-next-line */}
                                            <img
                                                src={selectedImage.preview}
                                                alt="Preview"
                                                className="object-cover rounded-lg w-full h-full"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full">
                                            <Upload className="h-10 w-10 text-gray-400 dark:text-gray-300" />
                                            <p className="text-sm text-gray-500 dark:text-gray-300">
                                                Click to upload banner image
                                            </p>
                                        </div>
                                    )}
                                </label>
                                <input
                                    id="image-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || !!idError}
                            className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                        >
                            {loading ? "Creating..." : "Create Restaurant"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default CreateRestaurantModal