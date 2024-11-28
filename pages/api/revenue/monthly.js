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

                // Get first day of last 12 months
                const startDate = new Date();
                startDate.setMonth(startDate.getMonth() - 7);
                startDate.setDate(1);
                startDate.setHours(0, 0, 0, 0);

                const revenueData = await Order.aggregate([
                    {
                        $match: {
                            restaurantId: restaurantId,
                            createdAt: { $gte: startDate },
                            paid: true,
                            orderStatus: 'Completed'
                        }
                    },
                    {
                        $group: {
                            _id: {
                                year: { $year: "$createdAt" },
                                month: { $month: "$createdAt" }
                            },
                            totalRevenue: { $sum: "$total" },
                            orderCount: { $sum: 1 },
                            averageOrderValue: { $avg: "$total" },
                            counterPayments: {
                                $sum: { $cond: [{ $eq: ["$paymentMethod", "counter"] }, 1, 0] }
                            },
                            googlePayPayments: {
                                $sum: { $cond: [{ $eq: ["$paymentMethod", "googlepay"] }, 1, 0] }
                            }
                        }
                    },
                    { $sort: { "_id.year": 1, "_id.month": 1 } },
                    {
                        $project: {
                            date: {
                                $dateFromParts: {
                                    year: "$_id.year",
                                    month: "$_id.month",
                                    day: 1
                                }
                            },
                            totalRevenue: 1,
                            orderCount: 1,
                            averageOrderValue: { $round: ["$averageOrderValue", 2] },
                            counterPayments: 1,
                            googlePayPayments: 1
                        }
                    }
                ]);

                const formattedData = formatChartData(revenueData);
                const summary = calculateSummary(revenueData);

                res.status(200).json({
                    chart: formattedData,
                    summary: summary,
                    details: revenueData
                });
            } catch (error) {
                console.error('Monthly Revenue API Error:', error);
                res.status(500).json({ message: error.message });
            }
            break;
        default:
            res.setHeader('Allow', ['GET']);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
}

function formatChartData(revenueData) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
        labels: revenueData.map(data => months[new Date(data.date).getMonth()]),
        datasets: [{
            data: revenueData.map(data => data.totalRevenue),
            color: (opacity = 1) => `rgba(255, 56, 92, ${opacity})`,
            strokeWidth: 2
        }]
    };
}

function calculateSummary(revenueData) {
    return revenueData.reduce((summary, month) => ({
        totalRevenue: summary.totalRevenue + month.totalRevenue,
        totalOrders: summary.totalOrders + month.orderCount,
        averageOrderValue: Number((summary.totalRevenue / summary.totalOrders).toFixed(2)),
        paymentBreakdown: {
            counter: summary.paymentBreakdown.counter + month.counterPayments,
            googlePay: summary.paymentBreakdown.googlePay + month.googlePayPayments
        }
    }), {
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        paymentBreakdown: { counter: 0, googlePay: 0 }
    });
}

export default withCors(handler);