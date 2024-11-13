import Order from "..//..//models/Order";
import connectToDB from '..//..//lib/dbConnect';

export const getTotalSales = async () => {
  await connectToDB();
  const orders = await Order.find({ orderStatus: "Completed" }); // Only count completed orders
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((acc, order) => acc + order.total, 0);
  return { totalOrders, totalRevenue };
}

export const getTotalCustomers = async () => {
  await connectToDB();
  const orders = await Order.find();
  // Get unique phone numbers from orders
  const uniqueCustomers = new Set(orders.map(order => order.phonenumber));
  return uniqueCustomers.size;
}

export const getSalesPerMonth = async () => {
  await connectToDB();
  const orders = await Order.find({ orderStatus: "Completed" });

  const salesPerMonth = orders.reduce((acc, order) => {
    const monthIndex = new Date(order.createdAt).getMonth();
    acc[monthIndex] = (acc[monthIndex] || 0) + order.total;
    return acc;
  }, {});

  // Create an array for all months with sales data
  const graphData = Array.from({ length: 12 }, (_, i) => {
    const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(0, i));
    return {
      name: month,
      sales: Number((salesPerMonth[i] || 0).toFixed(2)) // Round to 2 decimal places
    };
  });

  return graphData;
}