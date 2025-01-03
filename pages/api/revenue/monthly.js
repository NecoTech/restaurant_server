import dbConnect from '../../../lib/dbConnect';
import Order from '../../../models/Order';
import { withCors } from '../../../lib/cors';
import { format, startOfYear, endOfYear, eachMonthOfInterval } from 'date-fns';

async function handler(req, res) {
    const { method, query } = req;
    await dbConnect();

    if (method === 'GET') {
        try {
            const { restaurantId } = query;

            if (!restaurantId) {
                return res.status(400).json({ message: 'Restaurant ID is required' });
            }

            // Get data for the current year by default
            const startDate = startOfYear(new Date());
            const endDate = endOfYear(new Date());

            const monthlyRevenue = await Order.aggregate([
                {
                    $match: {
                        restaurantId,
                        createdAt: { $gte: startDate, $lte: endDate },
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
                        averageOrderValue: { $avg: "$total" }
                    }
                },
                { $sort: { "_id.year": 1, "_id.month": 1 } },
                {
                    $project: {
                        monthYear: {
                            $concat: [
                                { $toString: "$_id.year" },
                                "-",
                                {
                                    $cond: [
                                        { $lt: ["$_id.month", 10] },
                                        { $concat: ["0", { $toString: "$_id.month" }] },
                                        { $toString: "$_id.month" }
                                    ]
                                }
                            ]
                        },
                        totalRevenue: 1,
                        orderCount: 1,
                        averageOrderValue: { $round: ["$averageOrderValue", 2] }
                    }
                }
            ]);

            const formattedData = formatChartData(monthlyRevenue, startDate, endDate);
            const summary = calculateSummary(monthlyRevenue);

            res.status(200).json({ chart: formattedData, summary });
        } catch (error) {
            console.error('Monthly Revenue API Error:', error);
            res.status(500).json({ message: error.message });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
}

function formatChartData(revenueData, startDate, endDate) {
    // Generate array of all months in the range
    const monthRange = eachMonthOfInterval({
        start: startDate,
        end: endDate
    });

    const result = {
        labels: [],
        datasets: [{
            data: [],
            color: (opacity = 1) => `rgba(255, 56, 92, ${opacity})`,
            strokeWidth: 2
        }]
    };

    // Format each month and map revenue data
    monthRange.forEach(date => {
        const monthStr = format(date, 'yyyy-MM');
        const monthData = revenueData.find(d => d.monthYear === monthStr);

        // Format the label to show month name
        const label = format(date, 'MMM yyyy');

        result.labels.push(label);
        result.datasets[0].data.push(monthData ? monthData.totalRevenue : 0);
    });

    return result;
}

function calculateSummary(revenueData) {
    if (!revenueData.length) {
        return {
            highestMonth: { month: 'N/A', revenue: 0 },
            averageRevenue: 0,
            totalRevenue: 0,
            totalOrders: 0
        };
    }

    let highestMonth = revenueData.reduce((max, month) =>
        month.totalRevenue > max.totalRevenue ? month : max
        , revenueData[0]);

    const totalRevenue = revenueData.reduce((sum, month) => sum + month.totalRevenue, 0);
    const totalOrders = revenueData.reduce((sum, month) => sum + month.orderCount, 0);

    return {
        highestMonth: {
            month: format(new Date(highestMonth.monthYear), 'MMMM yyyy'),
            revenue: highestMonth.totalRevenue
        },
        averageRevenue: totalRevenue / revenueData.length,
        totalRevenue,
        totalOrders
    };
}

export default withCors(handler);