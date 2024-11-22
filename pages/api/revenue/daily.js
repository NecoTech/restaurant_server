import dbConnect from '../../../lib/dbConnect';
import Order from '../../../models/Order';
import { withCors } from '../../../lib/cors';

async function handler(req, res) {
    const { method, query } = req;
    await dbConnect();

    switch (method) {
        case 'GET':
            try {
                // Get restaurantId from query or header
                const restaurantId = query.restaurantId;
                if (!restaurantId) {
                    return res.status(400).json({ message: 'Restaurant ID is required' });
                }

                // Calculate date 7 days ago
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                sevenDaysAgo.setHours(0, 0, 0, 0);

                // Aggregate orders by date for specific restaurant
                const revenueData = await Order.aggregate([
                    {
                        $match: {
                            restaurantId: restaurantId,
                            createdAt: { $gte: sevenDaysAgo },
                            paid: true,
                            orderStatus: 'Completed'  // Assuming 'completed' is one of your orderStatus values
                        }
                    },
                    {
                        $group: {
                            _id: {
                                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                            },
                            // Sum the total field from your schema
                            totalRevenue: { $sum: "$total" },
                            // Additional metrics
                            orderCount: { $sum: 1 },
                            averageOrderValue: { $avg: "$total" },
                            // Payment method breakdown
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
                    {
                        $sort: { "_id": 1 }
                    },
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

                // Transform data into chart format
                const formattedData = formatChartData(revenueData);

                // Calculate summary statistics
                const summary = calculateSummary(revenueData);

                res.status(200).json({
                    chart: formattedData,
                    summary: summary,
                    details: revenueData // Detailed daily breakdown
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

function formatChartData(revenueData) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const result = {
        labels: [],
        datasets: [{
            data: [],
            color: (opacity = 1) => `rgba(255, 56, 92, ${opacity})`,
            strokeWidth: 2
        }]
    };

    // Generate data for the last 7 days
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // Get day name
        const dayName = days[date.getDay()];

        // Format date string to match MongoDB aggregation format
        const dateStr = date.toISOString().split('T')[0];

        // Find revenue for this date
        const dayData = revenueData.find(d => d.date === dateStr);

        // Add to formatted data
        result.labels.push(dayName);
        result.datasets[0].data.push(dayData ? dayData.totalRevenue : 0);
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
        // Calculate totals
        revenueData.forEach(day => {
            summary.totalRevenue += day.totalRevenue;
            summary.totalOrders += day.orderCount;
            summary.paymentBreakdown.counter += day.counterPayments;
            summary.paymentBreakdown.googlePay += day.googlePayPayments;
        });

        // Calculate averages
        summary.averageOrderValue = Number((summary.totalRevenue / summary.totalOrders).toFixed(2));
    }

    return summary;
}

export default withCors(handler);