import dbConnect from '../../../lib/dbConnect';
import Order from '../../../models/Order';
import { withCors } from '../../../lib/cors';
import {
    startOfMonth, endOfMonth, subDays,
    // startOfWeek, endOfWeek,
    startOfDay, endOfDay,
    eachDayOfInterval,
    format, parseISO,
    subMonths
} from 'date-fns';

async function handler(req, res) {
    const { method, query } = req;
    await dbConnect();

    if (method === 'GET') {
        try {
            const { restaurantId, date } = query;
            if (!restaurantId) {
                return res.status(400).json({ message: 'Restaurant ID is required' });
            }

            const selectedDate = date ? parseISO(date) : new Date();
            const monthlyStartDate = subMonths(startOfMonth(selectedDate), 11);
            const monthlyEndDate = endOfMonth(selectedDate);
            const weeklyStartDate = startOfDay(subDays(selectedDate, 6)); // 6 days back + current day = 7 days
            const weeklyEndDate = endOfDay(selectedDate);
            const dailyStartDate = startOfDay(selectedDate);
            const dailyEndDate = endOfDay(selectedDate);

            // Overview Data
            const monthlyOverview = await Order.aggregate([
                {
                    $match: {
                        restaurantId,
                        createdAt: { $gte: monthlyStartDate, $lte: monthlyEndDate },
                        paid: true,
                        orderStatus: 'Completed'
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        totalRevenue: { $sum: "$total" },
                        totalCash: {
                            $sum: {
                                $cond: [{ $eq: ["$paymentMethod", "counter"] }, "$total", 0]
                            }
                        },
                        totalOnline: {
                            $sum: {
                                $cond: [{ $eq: ["$paymentMethod", "googlepay"] }, "$total", 0]
                            }
                        },
                        uniqueCustomers: { $addToSet: "$userId" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalOrders: 1,
                        totalRevenue: { $round: ["$totalRevenue", 2] },
                        totalCash: { $round: ["$totalCash", 2] },
                        totalOnline: { $round: ["$totalOnline", 2] },
                        totalCustomers: { $size: "$uniqueCustomers" }
                    }
                }
            ]);

            const weeklyOverview = await Order.aggregate([
                {
                    $match: {
                        restaurantId,
                        createdAt: { $gte: weeklyStartDate, $lte: weeklyEndDate },
                        paid: true,
                        orderStatus: 'Completed'
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        totalRevenue: { $sum: "$total" },
                        totalCash: {
                            $sum: {
                                $cond: [{ $eq: ["$paymentMethod", "counter"] }, "$total", 0]
                            }
                        },
                        totalOnline: {
                            $sum: {
                                $cond: [{ $eq: ["$paymentMethod", "googlepay"] }, "$total", 0]
                            }
                        },
                        uniqueCustomers: { $addToSet: "$userId" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalOrders: 1,
                        totalRevenue: { $round: ["$totalRevenue", 2] },
                        totalCash: { $round: ["$totalCash", 2] },
                        totalOnline: { $round: ["$totalOnline", 2] },
                        totalCustomers: { $size: "$uniqueCustomers" }
                    }
                }
            ]);

            const dailyOverview = await Order.aggregate([
                {
                    $match: {
                        restaurantId,
                        createdAt: { $gte: dailyStartDate, $lte: dailyEndDate },
                        paid: true,
                        orderStatus: 'Completed'
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        totalRevenue: { $sum: "$total" },
                        totalCash: {
                            $sum: {
                                $cond: [{ $eq: ["$paymentMethod", "counter"] }, "$total", 0]
                            }
                        },
                        totalOnline: {
                            $sum: {
                                $cond: [{ $eq: ["$paymentMethod", "googlepay"] }, "$total", 0]
                            }
                        },
                        uniqueCustomers: { $addToSet: "$userId" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalOrders: 1,
                        totalRevenue: { $round: ["$totalRevenue", 2] },
                        totalCash: { $round: ["$totalCash", 2] },
                        totalOnline: { $round: ["$totalOnline", 2] },
                        totalCustomers: { $size: "$uniqueCustomers" }
                    }
                }
            ]);

            // Monthly Sales Data
            const monthlySalesData = await Order.aggregate([
                {
                    $match: {
                        restaurantId,
                        createdAt: { $gte: monthlyStartDate, $lte: monthlyEndDate },
                        paid: true,
                        orderStatus: 'Completed'
                    }
                },
                {
                    $group: {
                        _id: {
                            month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                            paymentMethod: "$paymentMethod"
                        },
                        total: { $sum: "$total" }
                    }
                }
            ]);

            // Weekly Sales Data
            const weeklySalesData = await Order.aggregate([
                {
                    $match: {
                        restaurantId,
                        createdAt: { $gte: weeklyStartDate, $lte: weeklyEndDate },
                        paid: true,
                        orderStatus: 'Completed'
                    }
                },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                            paymentMethod: "$paymentMethod"
                        },
                        total: { $sum: "$total" }
                    }
                }
            ]);

            // Daily Sales Data
            const dailySalesData = await Order.aggregate([
                {
                    $match: {
                        restaurantId,
                        createdAt: { $gte: dailyStartDate, $lte: dailyEndDate },
                        paid: true,
                        orderStatus: 'Completed'
                    }
                },
                {
                    $addFields: {
                        hour: { $hour: "$createdAt" },
                        timeOfDay: {
                            $switch: {
                                branches: [
                                    { case: { $lt: [{ $hour: "$createdAt" }, 12] }, then: "Morning" },
                                    { case: { $lt: [{ $hour: "$createdAt" }, 17] }, then: "Noon" },
                                    { case: { $gte: [{ $hour: "$createdAt" }, 17] }, then: "Evening" }
                                ],
                                default: "Evening"
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            timeOfDay: "$timeOfDay",
                            paymentMethod: "$paymentMethod"
                        },
                        total: { $sum: "$total" }
                    }
                },
                {
                    $sort: { "_id.timeOfDay": 1 }
                }
            ]);

            // Format data
            const monthlyFormatted = eachDayOfInterval({ start: monthlyStartDate, end: monthlyEndDate })
                .filter(date => date.getDate() === 1)
                .map(date => {
                    const monthKey = format(date, 'yyyy-MM');
                    const monthData = monthlySalesData.filter(s => s._id.month === monthKey);
                    const online = Number((monthData.find(d => d._id.paymentMethod === 'googlepay')?.total || 0).toFixed(2));
                    const cash = Number((monthData.find(d => d._id.paymentMethod === 'counter')?.total || 0).toFixed(2));
                    return {
                        period: format(date, 'MMM'),
                        Online: online,
                        Cash: cash
                    };
                });

            // Format weekly data
            // const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const weeklyFormatted = eachDayOfInterval({ start: weeklyStartDate, end: weeklyEndDate })
                .map(date => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const dayData = weeklySalesData.filter(s => s._id.date === dateStr);
                    const online = Number((dayData.find(d => d._id.paymentMethod === 'googlepay')?.total || 0).toFixed(2));
                    const cash = Number((dayData.find(d => d._id.paymentMethod === 'counter')?.total || 0).toFixed(2));
                    return {
                        period: `${format(date, 'EEE ')}\n${format(date, 'MMM d')}`, // e.g., "Mon\nFeb 5"
                        Online: online,
                        Cash: cash,
                        fullDate: dateStr // Keep full date for reference if needed
                    };
                });

            // Format daily data
            const timePeriodsOrder = ["Morning", "Noon", "Evening"];
            const dailyFormatted = timePeriodsOrder.map(period => {
                const periodData = dailySalesData.filter(d => d._id.timeOfDay === period);
                const online = Number((periodData.find(d => d._id.paymentMethod === 'googlepay')?.total || 0).toFixed(2));
                const cash = Number((periodData.find(d => d._id.paymentMethod === 'counter')?.total || 0).toFixed(2));
                return {
                    period,
                    Online: online,
                    Cash: cash
                };
            });

            // Handle empty overview arrays by providing default values
            const defaultOverview = {
                totalOrders: 0,
                totalRevenue: 0,
                totalCash: 0,
                totalOnline: 0,
                totalCustomers: 0
            };

            res.status(200).json({
                selectedPeriod: 'Monthly',
                selectedDate,
                data: {
                    monthly: monthlyFormatted,
                    weekly: weeklyFormatted,
                    daily: dailyFormatted
                },
                overview: {
                    monthly: monthlyOverview.length > 0 ? monthlyOverview[0] : defaultOverview,
                    weekly: weeklyOverview.length > 0 ? weeklyOverview[0] : defaultOverview,
                    daily: dailyOverview.length > 0 ? dailyOverview[0] : defaultOverview
                }
            });

        } catch (error) {
            console.error('Sales API Error:', error);
            res.status(500).json({ message: error.message });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
}

export default withCors(handler);