import React, { useState } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"

interface CategoryInputProps {
    value: string;
    onValueChange: (value: string) => void;
    categories: string[];
    onAddCategory: (category: string) => void;
}

const CategoryInput: React.FC<CategoryInputProps> = ({
    value,
    onValueChange,
    categories,
    onAddCategory
}) => {
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [newCategory, setNewCategory] = useState('');

    const handleAddCustomCategory = () => {
        if (newCategory.trim()) {
            onAddCategory(newCategory.trim());
            onValueChange(newCategory.trim());
            setNewCategory('');
            setShowCustomInput(false);
        }
    };

    return (
        <div className="space-y-2">
            {!showCustomInput ? (
                <div className="flex items-center gap-2">
                    <Select
                        value={value}
                        onValueChange={onValueChange}
                    >
                        <SelectTrigger className="w-full bg-white text-gray-900 border border-gray-300 focus:ring-2 focus:ring-blue-500">
                            <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg">
                            {categories.map((category) => (
                                <SelectItem
                                    key={category}
                                    value={category}
                                    className="hover:bg-gray-100 cursor-pointer text-gray-900"
                                >
                                    {category}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCustomInput(true)}
                        className="flex items-center gap-1 bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    >
                        <Plus className="h-4 w-4" />
                        Add New
                    </Button>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <Input
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="Enter new category"
                        className="bg-white text-gray-900 border-gray-300 focus:ring-2 focus:ring-blue-500"
                    />
                    <Button
                        type="button"
                        onClick={handleAddCustomCategory}
                        disabled={!newCategory.trim()}
                        className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                        Add
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCustomInput(false)}
                        className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    >
                        Cancel
                    </Button>
                </div>
            )}
        </div>
    );
};

export default CategoryInput;