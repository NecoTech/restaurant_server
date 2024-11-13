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
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Upload } from "lucide-react"
import { MenuItem } from "./MenuItemColumns"
import CategoryInput from './CategoryInput';

interface EditMenuItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    menuItem: MenuItem;
}

const CATEGORIES = [
    "Appetizers",
    "Main Course",
    "Desserts",
    "Beverages",
    "Sides",
    "Specials"
];

const EditMenuItemModal = ({
    isOpen,
    onClose,
    onSuccess,
    menuItem
}: EditMenuItemModalProps) => {
    const [loading, setLoading] = useState(false)
    const [categories, setCategories] = useState<string[]>([
        "Appetizers",
        "Main Course",
        "Desserts",
        "Beverages",
        "Sides",
        "Specials"
    ]);
    const [selectedImage, setSelectedImage] = useState<{
        file: File | null;
        preview: string;
    }>({
        file: null,
        preview: menuItem.image || ""
    })
    const [formData, setFormData] = useState({
        name: menuItem.name,
        description: menuItem.description,
        price: menuItem.price.toString(),
        category: menuItem.category,
    })

    const handleAddCategory = (newCategory: string) => {
        setCategories(prev => [...prev, newCategory]);
    };

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const response = await fetch(`/api/categories?restaurantId=${menuItem.id}`);
                if (response.ok) {
                    const data = await response.json();
                    setCategories(prevCategories => {
                        const newCategories = data.filter((cat: string) => !prevCategories.includes(cat));
                        return [...prevCategories, ...newCategories];
                    });
                }
            } catch (error) {
                console.error('Error loading categories:', error);
            }
        };
        loadCategories();
    }, [menuItem.id]);

    useEffect(() => {
        setFormData({
            name: menuItem.name,
            description: menuItem.description,
            price: menuItem.price.toString(),
            category: menuItem.category,
        })
        setSelectedImage({
            file: null,
            preview: menuItem.image || ""
        })
    }, [menuItem])

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

            const formDataToSend = new FormData()
            formDataToSend.append('name', formData.name)
            formDataToSend.append('description', formData.description)
            formDataToSend.append('price', formData.price)
            formDataToSend.append('category', formData.category)

            if (selectedImage.file) {
                formDataToSend.append('image', selectedImage.file)
            }

            const response = await fetch(`/api/menu-items/${menuItem._id}`, {
                method: 'PUT',
                body: formDataToSend,
            })

            if (!response.ok) {
                throw new Error('Failed to update menu item')
            }

            onSuccess()
        } catch (error) {
            console.error('Error updating menu item:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-white dark:bg-white max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-gray-900">
                        Edit Menu Item
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="name" className="text-gray-900">
                                    Item Name
                                </Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter item name"
                                    required
                                    className="mt-1 bg-white text-gray-900"
                                />
                            </div>

                            <div>
                                <Label htmlFor="price" className="text-gray-900">
                                    Price
                                </Label>
                                <Input
                                    id="price"
                                    type="number"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="Enter price"
                                    required
                                    className="mt-1 bg-white text-gray-900"
                                />
                            </div>

                            <div>
                                <Label htmlFor="category" className="text-gray-900">
                                    Category
                                </Label>
                                <CategoryInput
                                    value={formData.category}
                                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                                    categories={categories}
                                    onAddCategory={handleAddCategory}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="description" className="text-gray-900">
                                    Description
                                </Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Enter item description"
                                    required
                                    className="mt-1 bg-white text-gray-900 h-32"
                                />
                            </div>

                            <div>
                                <Label className="text-gray-900">Item Image</Label>
                                <div className="mt-2">
                                    <label
                                        htmlFor="image-upload"
                                        className="flex flex-col items-center justify-center w-full h-32 
                                            border-2 border-dashed border-gray-300 
                                            rounded-lg cursor-pointer hover:border-gray-400 
                                            bg-gray-50 transition-colors"
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
                                                <Upload className="h-10 w-10 text-gray-400" />
                                                <p className="text-sm text-gray-500">
                                                    Click to update item image
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
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="text-gray-700 border-gray-300"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                            {loading ? "Updating..." : "Update Item"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default EditMenuItemModal;