"use client"

import { useState, useEffect } from "react"
import { Download } from "lucide-react"
import { DataTable } from "@/components/custom ui/DataTable"
import Loader from "@/components/custom ui/Loader"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { ColumnDef } from "@tanstack/react-table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useRouter } from "next/navigation"

interface Order {
  _id: string
  orderId: string
  restaurantId: string
  restaurantName: string
  customerName: string
  customerEmail: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  totalAmount: number
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  orderDate: string
  deliveryAddress: string
}

interface Restaurant {
  _id: string
  id: string
  name: string
}

const OrdersPage = () => {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("all")
  const router = useRouter()

  const OrderColumns: ColumnDef<Order>[] = [
    {
      accessorKey: "orderId",
      header: "Order ID"
    },
    {
      accessorKey: "restaurantName",
      header: "Restaurant"
    },
    {
      accessorKey: "customerName",
      header: "Customer Name"
    },
    {
      accessorKey: "totalAmount",
      header: "Total Amount",
      cell: ({ row }) => (
        <div>${row.getValue<number>("totalAmount").toFixed(2)}</div>
      )
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <div className={`capitalize font-medium ${getStatusColor(row.getValue<Order["status"]>("status"))}`}>
          {row.getValue<Order["status"]>("status")}
        </div>
      )
    },
    {
      accessorKey: "orderDate",
      header: "Order Date",
      cell: ({ row }) => (
        <div>{new Date(row.getValue<string>("orderDate")).toLocaleString()}</div>
      )
    }
  ]

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "text-yellow-600",
      preparing: "text-blue-600",
      ready: "text-green-600",
      delivered: "text-gray-600",
      cancelled: "text-red-600"
    }
    return colors[status as keyof typeof colors] || "text-gray-600"
  }

  const getAdminEmail = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('adminEmail') || ''
    }
    return ''
  }

  const fetchRestaurants = async () => {
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
    }
  }

  const fetchOrders = async (restaurantId?: string) => {
    try {
      const adminEmail = getAdminEmail()
      if (!adminEmail) {
        router.push('/login')
        return
      }

      let url = `/api/orders?adminEmail=${encodeURIComponent(adminEmail)}`
      if (restaurantId && restaurantId !== 'all') {
        url += `&restaurantId=${encodeURIComponent(restaurantId)}`
      }

      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch orders')
      const data = await res.json()
      setOrders(data)
    } catch (err) {
      console.error("[orders_GET]", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRestaurants()
    fetchOrders()
  }, [])

  const handleRestaurantChange = (value: string) => {
    setSelectedRestaurant(value)
    fetchOrders(value)
  }

  const generateOrderReport = () => {
    // Filter orders if restaurant is selected
    const ordersToExport = selectedRestaurant !== 'all'
      ? orders.filter(order => order.restaurantId === selectedRestaurant)
      : orders

    // Create CSV content
    const headers = [
      "Order ID",
      "Restaurant",
      "Customer Name",
      "Customer Email",
      "Items",
      "Total Amount",
      "Status",
      "Order Date",
      "Delivery Address"
    ]

    const csvContent = [
      headers.join(","),
      ...ordersToExport.map(order => [
        order.orderId,
        `"${order.restaurantName}"`,
        `"${order.customerName}"`,
        order.customerEmail,
        `"${order.items.map(item => `${item.quantity}x ${item.name}`).join('; ')}"`,
        order.totalAmount,
        order.status,
        new Date(order.orderDate).toLocaleString(),
        `"${order.deliveryAddress}"`
      ].join(","))
    ].join("\n")

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders-report-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const getOrderStats = () => {
    const filteredOrders = selectedRestaurant !== 'all'
      ? orders.filter(order => order.restaurantId === selectedRestaurant)
      : orders

    return {
      total: filteredOrders.length,
      pending: filteredOrders.filter(o => o.status === 'pending').length,
      preparing: filteredOrders.filter(o => o.status === 'preparing').length,
      ready: filteredOrders.filter(o => o.status === 'ready').length,
      delivered: filteredOrders.filter(o => o.status === 'delivered').length,
      cancelled: filteredOrders.filter(o => o.status === 'cancelled').length,
      totalRevenue: filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0)
    }
  }

  return loading ? <Loader /> : (
    <div className="px-10 py-5">
      <div className="flex justify-between items-center">
        <p className="text-heading2-bold">Orders</p>
        <div className="flex gap-4">
          <Select value={selectedRestaurant} onValueChange={handleRestaurantChange}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Filter by Restaurant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Restaurants</SelectItem>
              {restaurants.map((restaurant) => (
                <SelectItem key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={generateOrderReport}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <Download size={20} />
            Download Report
          </Button>
        </div>
      </div>

      <Separator className="bg-grey-1 my-5" />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getOrderStats().total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getOrderStats().pending + getOrderStats().preparing}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getOrderStats().delivered}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${getOrderStats().totalRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={OrderColumns}
        data={orders}
        searchKey="orderId"
      />
    </div>
  )
}

export const dynamic = "force-dynamic"

export default OrdersPage