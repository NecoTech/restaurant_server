"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload } from "lucide-react"
import { Restaurant } from "./RestaurantColumns"

interface EditRestaurantModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    restaurant: Restaurant | null;
}

const EditRestaurantModal = ({
    isOpen,
    onClose,
    onSuccess,
    restaurant
}: EditRestaurantModalProps) => {
    const [loading, setLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<{
        file: File | null;
        preview: string;
    }>({
        file: null,
        preview: restaurant?.bannerImage || ""
    });

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
        try {
            setLoading(true)

            if (!selectedImage.file) {
                throw new Error('Please select a new image')
            }

            const formData = new FormData()
            formData.append('image', selectedImage.file)

            const response = await fetch(`/api/restaurants/${restaurant?._id}/update-image`, {
                method: 'PATCH',
                body: formData,
            })

            if (!response.ok) {
                throw new Error('Failed to update restaurant image')
            }

            onSuccess()
        } catch (error) {
            console.error('Error updating restaurant:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-white dark:bg-gray-800 sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-gray-900 dark:text-white">
                        Update Restaurant Banner Image
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
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
                                            Click to upload new banner image
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
                            disabled={loading}
                            className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                        >
                            {loading ? "Updating..." : "Update Image"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default EditRestaurantModal