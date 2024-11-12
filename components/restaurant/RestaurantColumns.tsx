"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface Restaurant {
    _id: string;
    id: string;
    name: string;
    bannerImage: string;
    ownerEmail: string;
}

interface RestaurantColumnsProps {
    onEdit: (restaurant: Restaurant) => void;
    onDelete: (restaurant: Restaurant) => void;
}

export const RestaurantColumns = ({ onEdit, onDelete }: RestaurantColumnsProps): ColumnDef<Restaurant>[] => [
    {
        accessorKey: "id",
        header: "Restaurant ID",
    },
    {
        accessorKey: "name",
        header: "Restaurant Name",
    },
    {
        accessorKey: "bannerImage",
        header: "Banner Image",
        cell: ({ row }) => (
            <div className="relative h-20 w-40">
                {row.original.bannerImage && (
                    // eslint-disable-next-line
                    <img
                        src={row.original.bannerImage}
                        alt={row.original.name}
                        className="object-cover rounded-md w-full h-full"
                    />
                )}
            </div>
        )
    },
    {
        accessorKey: "ownerEmail",
        header: "Owner Email",
    },
    {
        header: "Action",
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