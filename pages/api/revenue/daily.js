import dbConnect from '../../../lib/dbConnect';
import Order from '../../../models/Order';
import { withCors } from '../../../lib/cors';
import { format, eachDayOfInterval } from 'date-fns';

async function handler(req, res) {
    const { method, query } = req;
    await dbConnect();

    if (method === 'GET') {
        try {
            const { restaurantId, startDate, endDate } = query;

            if (!restaurantId) {
                return res.status(400).json({ message: 'Restaurant ID is required' });
            }

            const startDateObj = new Date(startDate || Date.now() - 7 * 24 * 60 * 60 * 1000);
            startDateObj.setHours(0, 0, 0, 0);

            const endDateObj = new Date(endDate || Date.now());
            endDateObj.setHours(23, 59, 59, 999);

            // Get today's start and end
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);

            // Calculate yesterday's start and end
            const yesterdayStart = new Date(todayStart);
            yesterdayStart.setDate(yesterdayStart.getDate() - 1);
            const yesterdayEnd = new Date(todayEnd);
            yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);

            // Previous day's revenue aggregation
            const previousDayStats = await Order.aggregate([
                {
                    $match: {
                        restaurantId,
                        createdAt: {
                            $gte: yesterdayStart,
                            $lte: yesterdayEnd
                        },
                        paid: true,
                        orderStatus: 'Completed'
                    }
                },
                {
                    $group: {
                        _id: null,
                        previousDayRevenue: { $sum: "$total" },
                        previousDayOrders: { $sum: 1 },
                        previousDayCash: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$paymentMethod", "counter"] },
                                    "$total",
                                    0
                                ]
                            }
                        },
                        previousDayOnline: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$paymentMethod", "googlepay"] },
                                    "$total",
                                    0
                                ]
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        previousDayRevenue: 1,
                        previousDayOrders: 1,
                        previousDayCash: 1,
                        previousDayOnline: 1
                    }
                }
            ]);

            // Today's stats aggregation
            const todayStats = await Order.aggregate([
                {
                    $match: {
                        restaurantId,
                        createdAt: {
                            $gte: todayStart,
                            $lte: todayEnd
                        },
                        paid: true,
                        orderStatus: 'Completed'
                    }
                },
                {
                    $group: {
                        _id: null,
                        todayOrders: { $sum: 1 },
                        todayRevenue: { $sum: "$total" },
                        todayCash: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$paymentMethod", "counter"] },
                                    "$total",
                                    0
                                ]
                            }
                        },
                        todayOnline: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$paymentMethod", "googlepay"] },
                                    "$total",
                                    0
                                ]
                            }
                        },
                        todayCustomers: { $addToSet: "$userId" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        todayOrders: 1,
                        todayRevenue: 1,
                        todayCash: 1,
                        todayOnline: 1,
                        todayCustomers: { $size: "$todayCustomers" }
                    }
                }
            ]);


            // First aggregation for revenue data
            const revenueData = await Order.aggregate([
                {
                    $match: {
                        restaurantId,
                        createdAt: { $gte: startDateObj, $lte: endDateObj },
                        paid: true,
                        orderStatus: 'Completed'
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        totalRevenue: { $sum: "$total" },
                        orderCount: { $sum: 1 },
                        averageOrderValue: { $avg: "$total" },
                        counterPayments: { $sum: { $cond: [{ $eq: ["$paymentMethod", "counter"] }, 1, 0] } },
                        googlePayPayments: { $sum: { $cond: [{ $eq: ["$paymentMethod", "googlepay"] }, 1, 0] } },
                        counterTotal: { $sum: { $cond: [{ $eq: ["$paymentMethod", "counter"] }, "$total", 0] } },
                        googlePayTotal: { $sum: { $cond: [{ $eq: ["$paymentMethod", "googlepay"] }, "$total", 0] } },
                        uniqueCustomers: { $addToSet: "$userId" }
                    }
                },
                { $sort: { "_id": 1 } },
                {
                    $project: {
                        date: "$_id",
                        totalRevenue: 1,
                        orderCount: 1,
                        averageOrderValue: { $round: ["$averageOrderValue", 2] },
                        counterPayments: 1,
                        googlePayPayments: 1,
                        counterTotal: 1,
                        googlePayTotal: 1,
                        uniqueCustomersCount: { $size: "$uniqueCustomers" }
                    }
                }
            ]);

            // Second aggregation for most selling products
            const topProducts = await Order.aggregate([
                {
                    $match: {
                        restaurantId,
                        createdAt: { $gte: todayStart, $lte: todayEnd },
                        paid: true,
                        orderStatus: 'Completed'
                    }
                },
                { $unwind: "$items" },
                {
                    $group: {
                        _id: {
                            productId: "$items.productId",
                            name: "$items.name"
                        },
                        quantity: { $sum: "$items.quantity" },
                        revenue: {
                            $sum: {
                                $multiply: ["$items.quantity", "$items.price"]
                            }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        name: "$_id.name",
                        productId: "$_id.productId",
                        quantity: 1,
                        revenue: 1
                    }
                },
                { $sort: { quantity: -1 } },
                { $limit: 4 }
            ]);

            const totalUniqueCustomers = await Order.aggregate([
                {
                    $match: {
                        restaurantId,
                        createdAt: { $gte: startDateObj, $lte: endDateObj },
                        paid: true,
                        orderStatus: 'Completed'
                    }
                },
                {
                    $group: {
                        _id: null,
                        uniqueCustomers: { $addToSet: "$userId" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        count: { $size: "$uniqueCustomers" }
                    }
                }
            ]);

            const formattedData = formatChartData(revenueData, startDateObj, endDateObj);
            const summary = calculateSummary(revenueData, totalUniqueCustomers[0]?.count || 0);

            const todayData = todayStats[0] || {
                todayOrders: 0,
                todayRevenue: 0,
                todayCash: 0,
                todayOnline: 0,
                todayCustomers: 0
            };
            const previousData = previousDayStats[0] || {
                previousDayRevenue: 0,
                previousDayOrders: 0,
                previousDayCash: 0,
                previousDayOnline: 0
            };

            res.status(200).json({
                chart: formattedData,
                summary,
                today: todayData,
                previous: previousData,
                details: revenueData,
                topProducts
            });
        } catch (error) {
            console.error('Revenue API Error:', error);
            res.status(500).json({ message: error.message });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
}

function formatChartData(revenueData, startDate, endDate) {
    const dateRange = eachDayOfInterval({
        start: startDate,
        end: endDate
    });

    const result = {
        labels: [],
        datasets: [
            {
                // Counter payments
                data: [],
                color: (opacity = 1) => `rgba(255, 182, 193, ${opacity})`, // Light pink for Cash
                label: 'Cash'
            },
            {
                // Google Pay payments
                data: [],
                color: (opacity = 1) => `rgba(255, 75, 145, ${opacity})`, // Darker pink for Online
                label: 'Online'
            }
        ]
    };

    dateRange.forEach(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayData = revenueData.find(d => d.date === dateStr);

        const label = format(date, 'MMM d');
        result.labels.push(label);

        result.datasets[0].data.push(dayData ? dayData.counterTotal : 0);
        result.datasets[1].data.push(dayData ? dayData.googlePayTotal : 0);
    });

    return result;
}

function calculateSummary(revenueData, totalUniqueCustomers) {
    const summary = {
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        uniqueCustomers: totalUniqueCustomers,
        paymentBreakdown: {
            counter: 0,
            googlePay: 0,
            counterTotal: 0,
            googlePayTotal: 0
        }
    };

    if (revenueData.length > 0) {
        revenueData.forEach(day => {
            summary.totalRevenue += day.totalRevenue;
            summary.totalOrders += day.orderCount;
            summary.paymentBreakdown.counter += day.counterPayments;
            summary.paymentBreakdown.googlePay += day.googlePayPayments;
            summary.paymentBreakdown.counterTotal += day.counterTotal;
            summary.paymentBreakdown.googlePayTotal += day.googlePayTotal;
        });
        summary.averageOrderValue = Number((summary.totalRevenue / summary.totalOrders).toFixed(2));
    }

    return summary;
}

export default withCors(handler);