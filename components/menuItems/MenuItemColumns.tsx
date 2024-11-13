"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface MenuItem {
    _id: string;
    name: string;
    price: number;
    category: string;
    image: string;
    description: string;
    id: string;
}

interface MenuItemColumnsProps {
    onEdit: (menuItem: MenuItem) => void;
    onDelete: (menuItem: MenuItem) => void;
}

export const MenuItemColumns = ({ onEdit, onDelete }: MenuItemColumnsProps): ColumnDef<MenuItem>[] => [
    {
        accessorKey: "name",
        header: "Name",
    },
    {
        accessorKey: "description",
        header: "Description",
    },
    {
        accessorKey: "price",
        header: "Price",
        cell: ({ row }) => {
            return `$${row.original.price.toFixed(2)}`
        }
    },
    {
        accessorKey: "category",
        header: "Category",
    },
    {
        accessorKey: "image",
        header: "Image",
        cell: ({ row }) => (
            <div className="relative h-20 w-40">
                {row.original.image && (
                    // eslint-disable-next-line
                    <img
                        src={row.original.image}
                        alt={row.original.name}
                        className="object-cover rounded-md w-full h-full"
                    />
                )}
            </div>
        )
    },
    {
        id: "actions",
        cell: ({ row }) => (
            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    onClick={() => onEdit(row.original)}
                    className="hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                    <Edit className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    onClick={() => onDelete(row.original)}
                    className="hover:bg-red-100 dark:hover:bg-red-900"
                >
                    <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
            </div>
        )
    }
];