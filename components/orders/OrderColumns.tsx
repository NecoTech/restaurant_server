"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"

export interface Order {
  _id: string;
  orderNumber: string;
  userId: string;
  items: {
    _id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  tableNumber: number;
  paymentMethod: 'counter' | 'googlepay';
  paid: boolean;
  restaurantId: string;
  restaurantName: string;
  phonenumber: string;
  orderStatus: string;
  createdAt: string;
}

export const OrderColumns: ColumnDef<Order>[] = [
  {
    accessorKey: "orderNumber",
    header: "Order Number"
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
    cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM dd, yyyy HH:mm')
  },
  {
    accessorKey: "restaurantName",
    header: "Restaurant"
  },
  {
    accessorKey: "tableNumber",
    header: "Table"
  },
  {
    accessorKey: "items",
    header: "Items",
    cell: ({ row }) => {
      const items = row.original.items;
      return (
        <div>
          {items.map((item, index) => (
            <div key={item._id} className="text-sm">
              {item.quantity}x {item.name}
              {index < items.length - 1 && ", "}
            </div>
          ))}
        </div>
      );
    }
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
          Total
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.original.total.toString());
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
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
    header: "Payment Status",
    cell: ({ row }) => {
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold
                    ${row.original.paid ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'}`}>
          {row.original.paid ? 'Paid' : 'Unpaid'}
        </span>
      )
    }
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
    id: "actions",
    cell: ({ row }) => {
      const order = row.original;

      const handleDownload = () => {
        generateOrderReport(order);
      };

      return (
        <Button
          onClick={handleDownload}
          variant="ghost"
          className="hover:bg-gray-100"
        >
          <Download className="h-4 w-4" />
        </Button>
      );
    },
  },
];

// Helper function to generate order report
const generateOrderReport = (order: Order) => {
  const report = {
    orderNumber: order.orderNumber,
    date: format(new Date(order.createdAt), 'MMMM dd, yyyy HH:mm'),
    restaurant: order.restaurantName,
    customerPhone: order.phonenumber,
    tableNumber: order.tableNumber,
    items: order.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      total: item.quantity * item.price
    })),
    subtotal: order.subtotal,
    tax: order.tax,
    total: order.total,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paid ? 'Paid' : 'Unpaid',
    orderStatus: order.orderStatus
  };

  // Convert to CSV
  const csv = [
    ['Order Report'],
    ['Order Number:', report.orderNumber],
    ['Date:', report.date],
    ['Restaurant:', report.restaurant],
    ['Customer Phone:', report.customerPhone],
    ['Table Number:', report.tableNumber],
    [''],
    ['Items:'],
    ['Name', 'Quantity', 'Price', 'Total'],
    ...report.items.map(item => [
      item.name,
      item.quantity,
      `$${item.price.toFixed(2)}`,
      `$${item.total.toFixed(2)}`
    ]),
    [''],
    ['Subtotal:', '', '', `$${report.subtotal.toFixed(2)}`],
    ['Tax:', '', '', `$${report.tax.toFixed(2)}`],
    ['Total:', '', '', `$${report.total.toFixed(2)}`],
    [''],
    ['Payment Method:', report.paymentMethod],
    ['Payment Status:', report.paymentStatus],
    ['Order Status:', report.orderStatus]
  ].map(row => row.join(',')).join('\n');

  // Create and download file
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', `order-${report.orderNumber}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};