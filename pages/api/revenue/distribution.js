import dbConnect from '../../../lib/dbConnect';
import Order from '../../../models/Order';
import { withCors } from '../../../lib/cors';

async function handler(req, res) {
    const { method, query } = req;
    const { restaurantId } = query;

    await dbConnect();

    switch (method) {
        case 'GET':
            try {
                if (!restaurantId) {
                    return res.status(400).json({ message: 'Restaurant ID is required' });
                }

                // Get current date
                const today = new Date();
                const startOfDay = new Date(today.setHours(0, 0, 0, 0));
                const endOfDay = new Date(today.setHours(23, 59, 59, 999));

                const hourlyDistribution = await Order.aggregate([
                    {
                        $match: {
                            restaurantId: restaurantId,
                            createdAt: {
                                $gte: startOfDay,
                                $lte: endOfDay
                            },
                            orderStatus: { $ne: 'Cancelled' },
                            paid: true
                        }
                    },
                    {
                        $group: {
                            _id: { $hour: "$createdAt" },
                            totalRevenue: { $sum: "$total" },
                            orderCount: { $sum: 1 },
                            averageOrderValue: { $avg: "$total" },
                            orders: {
                                $push: {
                                    createdAt: "$createdAt",
                                    total: "$total"
                                }
                            }
                        }
                    },
                    {
                        $sort: { "_id": 1 }
                    },
                    {
                        $project: {
                            hour: "$_id",
                            totalRevenue: { $round: ["$totalRevenue", 2] },
                            orderCount: 1,
                            averageOrderValue: { $round: ["$averageOrderValue", 2] },
                            orders: 1,
                            _id: 0
                        }
                    }
                ]);

                // Fill in missing hours with 0 revenue
                const filledDistribution = Array.from({ length: 24 }, (_, i) => {
                    const existingHour = hourlyDistribution.find(h => h.hour === i);
                    return {
                        hour: i,
                        totalRevenue: existingHour ? existingHour.totalRevenue : 0,
                        orderCount: existingHour ? existingHour.orderCount : 0,
                        averageOrderValue: existingHour ? existingHour.averageOrderValue : 0,
                        orders: existingHour ? existingHour.orders.sort((a, b) =>
                            new Date(b.createdAt) - new Date(a.createdAt)
                        ) : [],
                        lastOrderTime: existingHour && existingHour.orders.length > 0
                            ? existingHour.orders.reduce((latest, order) =>
                                new Date(order.createdAt) > new Date(latest) ? order.createdAt : latest,
                                existingHour.orders[0].createdAt
                            )
                            : null
                    };
                });

                // Calculate summary statistics
                const summary = {
                    totalDailyRevenue: filledDistribution.reduce((sum, hour) => sum + hour.totalRevenue, 0),
                    totalOrders: filledDistribution.reduce((sum, hour) => sum + hour.orderCount, 0),
                    peakHour: filledDistribution.reduce((max, hour) =>
                        hour.totalRevenue > (max.totalRevenue || 0) ? {
                            ...hour,
                            lastOrderTime: hour.lastOrderTime
                        } : max,
                        { totalRevenue: 0 }
                    ),
                    averageHourlyRevenue: filledDistribution.reduce((sum, hour) =>
                        sum + hour.totalRevenue, 0) / 24
                };

                res.status(200).json({
                    hourlyData: filledDistribution,
                    summary: summary,
                    metadata: {
                        queryPeriod: {
                            start: startOfDay,
                            end: endOfDay
                        }
                    }
                });
            } catch (error) {
                console.error('Daily Distribution API Error:', error);
                res.status(500).json({ message: error.message });
            }
            break;
        default:
            res.setHeader('Allow', ['GET']);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
}

export default withCors(handler);