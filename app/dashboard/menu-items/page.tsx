"use client"

import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { DataTable } from "@/components/custom ui/DataTable"
import Loader from "@/components/custom ui/Loader"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { MenuItem, MenuItemColumns } from "@/components/menuItems/MenuItemColumns"
import CreateMenuItemModal from "@/components/menuItems/CreateMenuItemModal"
import DeleteConfirmDialog from "@/components/shared/DeleteConfirmDialog"
import EditMenuItemModal from "@/components/menuItems/EditMenuItemModal"
// import { useToast } from "@/components/ui/use-toast"
import toast from "react-hot-toast";

interface Restaurant {
    _id: string;
    id: string;
    name: string;
}

const MenuItemsPage = () => {
    const [loading, setLoading] = useState(true)
    const [menuItems, setMenuItems] = useState<MenuItem[]>([])
    const [restaurants, setRestaurants] = useState<Restaurant[]>([])
    const [selectedRestaurant, setSelectedRestaurant] = useState<string>('')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null)
    const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null)
    const router = useRouter()
    // const { toast } = useToast()

    // Get admin email from localStorage
    const getAdminEmail = () => {
        if (typeof window !== 'undefined') {
            const admin = localStorage.getItem('adminEmail')
            return admin || ''
        }
        return ''
    }

    const handleEdit = (menuItem: MenuItem) => {
        setSelectedMenuItem(menuItem)
    }
    // Fetch restaurants
    const getRestaurants = async () => {
        try {
            const adminEmail = getAdminEmail()
            if (!adminEmail) {
                router.push('/login')
                return
            }

            const res = await fetch(`/api/restaurants?email=${encodeURIComponent(adminEmail)}`)
            if (!res.ok) throw new Error('Failed to fetch restaurants')

            const data = await res.json()
            setRestaurants(data)
        } catch (err) {
            console.error("[restaurants_GET]", err)
            toast.error("Failed to fetch restaurants")
        }
    }

    // Fetch menu items for selected restaurant
    const getMenuItems = async (restaurantId?: string) => {
        try {
            if (!restaurantId) {
                setMenuItems([])
                return
            }

            const res = await fetch(`/api/menu-items?restaurantId=${restaurantId}`)
            if (!res.ok) throw new Error('Failed to fetch menu items')

            const data = await res.json()
            setMenuItems(data)
        } catch (err) {
            console.error("[menu_items_GET]", err)
            toast.error("Failed to fetch menu items")
        } finally {
            setLoading(false)
        }
    }

    // Initial data fetch
    useEffect(() => {
        getRestaurants()
    }, [])

    // Handle restaurant selection
    const handleRestaurantChange = (value: string) => {
        setSelectedRestaurant(value)
        setLoading(true)
        getMenuItems(value)
    }

    // Handle delete menu item
    const handleDelete = (menuItem: MenuItem) => {
        setItemToDelete(menuItem)
    }

    // Handle confirm delete
    const handleConfirmDelete = async () => {
        if (!itemToDelete) return

        try {
            const res = await fetch(`/api/menu-items/${itemToDelete._id}`, {
                method: 'DELETE',
            })

            if (!res.ok) throw new Error('Failed to delete menu item')

            toast.success("Menu item deleted successfully")

            getMenuItems(selectedRestaurant)
        } catch (error) {
            console.error('Error deleting menu item:', error)
            toast.error("Failed to delete menu item")
        } finally {
            setItemToDelete(null)
        }
    }

    const selectedRestaurantName = restaurants.find(r => r.id === selectedRestaurant)?.name || ''

    return (
        <div className="px-10 py-5">
            <div className="flex justify-between items-center">
                <p className="text-heading2-bold">Menu Items</p>

                <div className="flex items-center gap-4">
                    <Select
                        value={selectedRestaurant}
                        onValueChange={handleRestaurantChange}
                    >
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select Restaurant" />
                        </SelectTrigger>
                        <SelectContent>
                            {restaurants.map((restaurant) => (
                                <SelectItem key={restaurant.id} value={restaurant.id}>
                                    {restaurant.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={!selectedRestaurant}
                    >
                        <Plus size={20} />
                        Add Menu Item
                    </Button>
                </div>
            </div>

            <Separator className="bg-grey-1 my-5" />

            {selectedRestaurant ? (
                loading ? (
                    <Loader />
                ) : (
                    <DataTable
                        columns={MenuItemColumns({
                            onEdit: handleEdit,
                            onDelete: handleDelete
                        })}
                        data={menuItems}
                        searchKey="name"
                    />
                )
            ) : (
                <div className="text-center text-gray-500 mt-10">
                    Please select a restaurant to view its menu items
                </div>
            )}

            {selectedMenuItem && (
                <EditMenuItemModal
                    isOpen={!!selectedMenuItem}
                    onClose={() => setSelectedMenuItem(null)}
                    onSuccess={() => {
                        setSelectedMenuItem(null)
                        getMenuItems(selectedRestaurant)
                    }}
                    menuItem={selectedMenuItem}
                />
            )}

            {showCreateModal && selectedRestaurant && (
                <CreateMenuItemModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false)
                        getMenuItems(selectedRestaurant)
                    }}
                    restaurantId={selectedRestaurant}
                    restaurantName={selectedRestaurantName}
                />
            )}

            {itemToDelete && (
                <DeleteConfirmDialog
                    isOpen={!!itemToDelete}
                    onClose={() => setItemToDelete(null)}
                    onConfirm={handleConfirmDelete}
                    itemName={itemToDelete.name}
                    itemType="menu item"
                />
            )}
        </div>
    )
}

export default MenuItemsPage