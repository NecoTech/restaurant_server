"use client"

import { useState, useEffect } from "react"
import { DataTable } from "@/components/custom ui/DataTable"
import Loader from "@/components/custom ui/Loader"
import { Separator } from "@/components/ui/separator"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Payment, PaymentColumns } from "@/components/payment/PaymentColumns"
// import { useToast } from "@/components/ui/use-toast"
import toast from "react-hot-toast";

interface Restaurant {
    _id: string;
    id: string;
    name: string;
}

interface PaymentStats {
    totalPayments: number;
    paidPayments: number;
    unpaidPayments: number;
    totalAmount: number;
    paidAmount: number;
    unpaidAmount: number;
}

const PaymentsPage = () => {
    const [loading, setLoading] = useState(true)
    const [payments, setPayments] = useState<Payment[]>([])
    const [restaurants, setRestaurants] = useState<Restaurant[]>([])
    const [selectedRestaurant, setSelectedRestaurant] = useState<string>('all')
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all')
    const [paymentToUpdate, setPaymentToUpdate] = useState<Payment | null>(null);
    const [stats, setStats] = useState<PaymentStats>({
        totalPayments: 0,
        paidPayments: 0,
        unpaidPayments: 0,
        totalAmount: 0,
        paidAmount: 0,
        unpaidAmount: 0,
    })



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
    const handleUpdatePaymentStatus = (payment: Payment) => {
        setPaymentToUpdate(payment);
    };


    const handleConfirmUpdate = async () => {
        if (!paymentToUpdate) return;

        try {
            const response = await fetch(`/api/payments/${paymentToUpdate._id}/mark-paid`, {
                method: 'PATCH',
            });

            if (!response.ok) {
                throw new Error('Failed to update payment status');
            }

            toast.success("Payment status updated successfully");

            // Refresh payments list
            getPayments(selectedRestaurant, selectedPaymentMethod);
        } catch (error) {
            console.error('Error updating payment status:', error);
            toast.error("Failed to update payment status");
        } finally {
            setPaymentToUpdate(null);
        }
    };

    // Get restaurants
    const getRestaurants = async () => {
        try {
            const adminEmail = getAdminEmail();
            if (!adminEmail) {
                router.push('/login');
                return;
            }

            const res = await fetch(`/api/restaurants?email=${encodeURIComponent(adminEmail)}`);
            if (!res.ok) throw new Error('Failed to fetch restaurants');

            const data = await res.json();
            setRestaurants(data);
        } catch (err) {
            console.error("[restaurants_GET]", err);
            toast.error("Failed to fetch restaurants")
        }
    };


    // Calculate payment statistics
    const calculateStats = (payments: Payment[]) => {
        const stats: PaymentStats = {
            totalPayments: payments.length,
            paidPayments: payments.filter(p => p.paid).length,
            unpaidPayments: payments.filter(p => !p.paid).length,
            totalAmount: payments.reduce((sum, p) => sum + p.total, 0),
            paidAmount: payments.filter(p => p.paid).reduce((sum, p) => sum + p.total, 0),
            unpaidAmount: payments.filter(p => !p.paid).reduce((sum, p) => sum + p.total, 0),
        }
        setStats(stats)
    }

    // Get payments
    const getPayments = async (restaurantId?: string, paymentMethod: string = 'all') => {
        try {
            const adminEmail = getAdminEmail();
            if (!adminEmail) {
                router.push('/login');
                return;
            }

            let url = `/api/payments?ownerEmail=${encodeURIComponent(adminEmail)}&`;
            if (restaurantId && restaurantId !== 'all') {
                url += `restaurantId=${restaurantId}&`;
            }
            if (paymentMethod !== 'all') {
                url += `paymentMethod=${paymentMethod}`;
            }

            const res = await fetch(url);
            if (!res.ok) {
                throw new Error('Failed to fetch payments');
            }

            const data = await res.json();
            setPayments(data);
            calculateStats(data);
        } catch (err) {
            console.error("[payments_GET]", err);
            toast.error("Failed to fetch payments");
        } finally {
            setLoading(false);
        }
    };

    // Initial data fetch
    useEffect(() => {
        const adminEmail = getAdminEmail();
        if (!adminEmail) {
            router.push('/login');
            return;
        }
        getRestaurants();
        getPayments();
    }, []);

    // Handle restaurant selection
    const handleRestaurantChange = (value: string) => {
        setSelectedRestaurant(value);
        setLoading(true);
        getPayments(value === 'all' ? undefined : value, selectedPaymentMethod);
    };

    // Handle payment method selection
    const handlePaymentMethodChange = (value: string) => {
        setSelectedPaymentMethod(value)
        setLoading(true)
        getPayments(selectedRestaurant, value)
    }

    return (
        <div className="px-10 py-5">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Payments</h1>

                <div className="flex items-center gap-4">
                    <Select
                        value={selectedRestaurant}
                        onValueChange={handleRestaurantChange}
                    >
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select Restaurant" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                            <SelectItem value="all">All Restaurants</SelectItem>
                            {restaurants.map((restaurant) => (
                                <SelectItem
                                    key={restaurant.id}
                                    value={restaurant.id || 'default'}
                                >
                                    {restaurant.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={selectedPaymentMethod}
                        onValueChange={handlePaymentMethodChange}
                    >
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Payment Method" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                            <SelectItem value="all">All Methods</SelectItem>
                            <SelectItem value="counter">Counter</SelectItem>
                            <SelectItem value="googlepay">Google Pay</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6 my-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Payments
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.totalAmount.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.totalPayments} payments total
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Paid Amount
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            ${stats.paidAmount.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.paidPayments} payments
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Unpaid Amount
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            ${stats.unpaidAmount.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.unpaidPayments} payments
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Separator className="my-6" />

            {loading ? (
                <Loader />
            ) : (
                <DataTable
                    columns={PaymentColumns({ onUpdatePaymentStatus: handleUpdatePaymentStatus })}
                    data={payments.sort((a, b) => {
                        // Sort by order status (Completed first)
                        if (a.orderStatus === 'Completed' && b.orderStatus !== 'Completed') return -1;
                        if (a.orderStatus !== 'Completed' && b.orderStatus === 'Completed') return 1;

                        // Then sort by date (newest first)
                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    })}
                    searchKey="orderNumber"
                />
            )}

            <AlertDialog open={!!paymentToUpdate} onOpenChange={() => setPaymentToUpdate(null)}>
                <AlertDialogContent className="bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Payment Update</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to mark this payment as paid?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => setPaymentToUpdate(null)}
                            className="bg-gray-100 hover:bg-gray-200"
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmUpdate}
                            className="bg-green-600 text-white hover:bg-green-700"
                        >
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default PaymentsPage;