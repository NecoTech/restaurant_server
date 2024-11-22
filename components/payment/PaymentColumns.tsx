"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Check, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"

export interface Payment {
    _id: string;
    userId: string;
    orderNumber: string;
    total: number;
    phonenumber: string;
    orderStatus: string;
    paymentMethod: 'counter' | 'googlepay';
    paid: boolean;
    restaurantId: string;
    restaurantName: string;
    createdAt: string;
}

interface PaymentColumnsProps {
    onUpdatePaymentStatus: (payment: Payment) => void;
}

export const PaymentColumns = ({ onUpdatePaymentStatus }: PaymentColumnsProps): ColumnDef<Payment>[] => [

    {
        accessorKey: "orderNumber",
        header: "Order Number",
    },
    {
        accessorKey: "createdAt",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="hover:bg-transparent p-0 font-semibold"
                >
                    Order Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            return format(new Date(row.original.createdAt), 'MMM dd, yyyy HH:mm')
        },
        sortingFn: (rowA, rowB) => {
            const dateA = new Date(rowA.original.createdAt).getTime();
            const dateB = new Date(rowB.original.createdAt).getTime();
            return dateA - dateB;
        }
    },
    {
        accessorKey: "restaurantName",
        header: "Restaurant",
    },
    {
        accessorKey: "userId",
        header: "User ID",
    },
    {
        accessorKey: "total",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="hover:bg-transparent p-0 font-semibold"
                >
                    Total Amount
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            return `$${row.original.total.toFixed(2)}`
        },
    },
    {
        accessorKey: "phonenumber",
        header: "Phone Number",
    },
    {
        accessorKey: "orderStatus",
        header: "Status",
        cell: ({ row }) => {
            return (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold
                    ${row.original.orderStatus === 'Completed' ? 'bg-green-100 text-green-800' :
                        row.original.orderStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'}`}>
                    {row.original.orderStatus}
                </span>
            )
        }
    },
    {
        accessorKey: "paymentMethod",
        header: "Payment Method",
        cell: ({ row }) => {
            return (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold
                    ${row.original.paymentMethod === 'counter' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'}`}>
                    {row.original.paymentMethod === 'counter' ? 'Counter' : 'Google Pay'}
                </span>
            )
        }
    },
    {
        accessorKey: "paid",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="hover:bg-transparent p-0 font-semibold"
                >
                    Payment Status
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const payment = row.original;

            if (payment.paid) {
                return (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        Paid
                    </span>
                );
            }

            return (
                <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                        Unpaid
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUpdatePaymentStatus(payment)}
                        className="ml-2 h-8 hover:bg-green-100"
                    >
                        <Check className="h-4 w-4 text-green-600" />
                    </Button>
                </div>
            );
        },
        sortingFn: (rowA, rowB) => {
            return rowA.original.paid === rowB.original.paid ? 0 : rowA.original.paid ? -1 : 1;
        }
    }
];