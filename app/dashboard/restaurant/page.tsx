"use client"

import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { DataTable } from "@/components/custom ui/DataTable"
import Loader from "@/components/custom ui/Loader"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import CreateRestaurantModal from "@/components/restaurant/CreateRestaurantModal"
import EditRestaurantModal from "@/components/restaurant/EditRestaurantModal"
import DeleteConfirmDialog from "@/components/restaurant/DeleteConfirmDialog"
import { Restaurant, RestaurantColumns } from "@/components/restaurant/RestaurantColumns"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast";

const RestaurantPage = () => {
    const [loading, setLoading] = useState(true)
    const [restaurants, setRestaurants] = useState<Restaurant[]>([])
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
    const [restaurantToDelete, setRestaurantToDelete] = useState<Restaurant | null>(null)
    const router = useRouter()


    // Get admin email from localStorage
    const getAdminEmail = () => {
        if (typeof window !== 'undefined') {
            const admin = localStorage.getItem('adminEmail')
            return admin || ''
        }
        return ''
    }

    const getRestaurants = async () => {
        try {
            const adminEmail = getAdminEmail()
            if (!adminEmail) {
                router.push('/login')
                return
            }

            const res = await fetch(`/api/restaurants?email=${encodeURIComponent(adminEmail)}`)
            if (!res.ok) {
                throw new Error('Failed to fetch restaurants')
            }
            const data = await res.json()
            setRestaurants(data)
        } catch (err) {
            console.log("[restaurants_GET]", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        getRestaurants()
    }, [])

    const handleEdit = (restaurant: Restaurant) => {
        setSelectedRestaurant(restaurant)
    }

    const handleDelete = (restaurant: Restaurant) => {
        setRestaurantToDelete(restaurant)
    }

    const handleConfirmDelete = async () => {
        if (!restaurantToDelete) return

        try {
            const res = await fetch(`/api/restaurants/${restaurantToDelete._id}`, {
                method: 'DELETE',
            })

            if (!res.ok) {
                throw new Error('Failed to delete restaurant')
            }

            toast.success(
                `Restaurant deleted" ${restaurantToDelete.name}"has been deleted successfully`
            )

            // Refresh the restaurants list
            getRestaurants()
        } catch (error) {
            console.error('Error deleting restaurant:', error)
            toast.error("Failed to delete restaurant. Please try again.")
        } finally {
            setRestaurantToDelete(null)
        }
    }

    return loading ? <Loader /> : (
        <div className="px-10 py-5">
            <div className="flex justify-between items-center">
                <p className="text-heading2-bold">Restaurants</p>
                <Button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <Plus size={20} />
                    Add New Restaurant
                </Button>
            </div>

            <Separator className="bg-grey-1 my-5" />

            <DataTable
                columns={RestaurantColumns({
                    onEdit: handleEdit,
                    onDelete: handleDelete
                })}
                data={restaurants}
                searchKey="name"
            />

            <CreateRestaurantModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => {
                    setShowCreateModal(false)
                    getRestaurants()
                }}
                adminEmail={getAdminEmail()}
            />

            {selectedRestaurant && (
                <EditRestaurantModal
                    isOpen={!!selectedRestaurant}
                    onClose={() => setSelectedRestaurant(null)}
                    onSuccess={() => {
                        setSelectedRestaurant(null)
                        getRestaurants()
                    }}
                    restaurant={selectedRestaurant}
                />
            )}

            {restaurantToDelete && (
                <DeleteConfirmDialog
                    isOpen={!!restaurantToDelete}
                    onClose={() => setRestaurantToDelete(null)}
                    onConfirm={handleConfirmDelete}
                    restaurantName={restaurantToDelete.name}
                />
            )}
        </div>
    )
}

export const dynamic = "force-dynamic"

export default RestaurantPage