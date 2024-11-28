import dbConnect from '../../../lib/dbConnect';
import Order from '../../../models/Order';
import { withCors } from '../../../lib/cors';

async function handler(req, res) {
    const { method, query } = req;
    const { restaurantId, startDate, endDate } = query;

    await dbConnect();

    switch (method) {
        case 'GET':
            try {
                if (!restaurantId || !startDate || !endDate) {
                    return res.status(400).json({
                        message: 'Restaurant ID, start date, and end date are required'
                    });
                }

                const queryStartDate = new Date(startDate);
                const queryEndDate = new Date(endDate);
                queryStartDate.setHours(0, 0, 0, 0);
                queryEndDate.setHours(23, 59, 59, 999);

                const revenueData = await Order.aggregate([
                    {
                        $match: {
                            restaurantId: restaurantId,
                            createdAt: {
                                $gte: queryStartDate,
                                $lte: queryEndDate
                            },
                            paid: true,
                            orderStatus: 'Completed'
                        }
                    },
                    {
                        $group: {
                            _id: {
                                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                            },
                            totalRevenue: { $sum: "$total" },
                            orderCount: { $sum: 1 },
                            averageOrderValue: { $avg: "$total" },
                            counterPayments: {
                                $sum: {
                                    $cond: [{ $eq: ["$paymentMethod", "counter"] }, 1, 0]
                                }
                            },
                            googlePayPayments: {
                                $sum: {
                                    $cond: [{ $eq: ["$paymentMethod", "googlepay"] }, 1, 0]
                                }
                            }
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
                            googlePayPayments: 1
                        }
                    }
                ]);

                const formattedData = formatChartData(revenueData, queryStartDate, queryEndDate);
                const summary = calculateSummary(revenueData);

                res.status(200).json({
                    chart: formattedData,
                    summary: summary,
                    details: revenueData
                });
            } catch (error) {
                console.error('Revenue API Error:', error);
                res.status(500).json({ message: error.message });
            }
            break;
        default:
            res.setHeader('Allow', ['GET']);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
}

function formatChartData(revenueData, startDate, endDate) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result = {
        labels: [],
        datasets: [{
            data: [],
            color: (opacity = 1) => `rgba(255, 56, 92, ${opacity})`,
            strokeWidth: 2
        }]
    };

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dayName = days[currentDate.getDay()];
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayData = revenueData.find(d => d.date === dateStr);

        result.labels.push(dayName);
        result.datasets[0].data.push(dayData ? dayData.totalRevenue : 0);

        currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
}

function calculateSummary(revenueData) {
    const summary = {
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        paymentBreakdown: {
            counter: 0,
            googlePay: 0
        }
    };

    if (revenueData.length > 0) {
        revenueData.forEach(day => {
            summary.totalRevenue += day.totalRevenue;
            summary.totalOrders += day.orderCount;
            summary.paymentBreakdown.counter += day.counterPayments;
            summary.paymentBreakdown.googlePay += day.googlePayPayments;
        });

        summary.averageOrderValue = Number((summary.totalRevenue / summary.totalOrders).toFixed(2));
    }

    return summary;
}

export default withCors(handler);