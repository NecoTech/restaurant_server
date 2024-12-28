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

            // console.log("start date", startDateObj)

            const endDateObj = new Date(endDate || Date.now());
            endDateObj.setHours(23, 59, 59, 999);

            // console.log("End  date", endDateObj)


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
                        googlePayPayments: { $sum: { $cond: [{ $eq: ["$paymentMethod", "googlepay"] }, 1, 0] } }
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

            const formattedData = formatChartData(revenueData, startDateObj, endDateObj);
            const summary = calculateSummary(revenueData);

            res.status(200).json({ chart: formattedData, summary, details: revenueData });
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
    // Generate array of all dates in the range
    const dateRange = eachDayOfInterval({
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

    // Format each date and map revenue data
    dateRange.forEach(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayData = revenueData.find(d => d.date === dateStr);

        // Format the label based on the date
        const label = format(date, 'MMM d');

        result.labels.push(label);
        result.datasets[0].data.push(dayData ? dayData.totalRevenue : 0);
    });

    return result;
}

function calculateSummary(revenueData) {
    const summary = {
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        paymentBreakdown: { counter: 0, googlePay: 0 }
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