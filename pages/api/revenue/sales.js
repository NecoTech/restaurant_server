import dbConnect from '../../../lib/dbConnect';
import Order from '../../../models/Order';
import { withCors } from '../../../lib/cors';
import {
    startOfMonth, endOfMonth,
    startOfWeek, endOfWeek,
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

            // Get data for monthly view (last 12 months)
            const monthlyStartDate = subMonths(startOfMonth(selectedDate), 11);
            const monthlyEndDate = endOfMonth(selectedDate);

            // Get data for weekly view (current week)
            const weeklyStartDate = startOfWeek(selectedDate);
            const weeklyEndDate = endOfWeek(selectedDate);

            // Get data for daily view (current day)
            const dailyStartDate = startOfDay(selectedDate);
            const dailyEndDate = endOfDay(selectedDate);

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
                            dayOfWeek: { $dateToString: { format: "%u", date: "$createdAt" } },
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
                    $group: {
                        _id: {
                            paymentMethod: "$paymentMethod"
                        },
                        total: { $sum: "$total" }
                    }
                }
            ]);

            // Format monthly data
            const monthlyFormatted = eachDayOfInterval({ start: monthlyStartDate, end: monthlyEndDate })
                .filter(date => date.getDate() === 1) // Get first day of each month
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
            const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const weeklyFormatted = weekDays.map((day, index) => {
                const dayNum = (index + 1).toString();
                const dayData = weeklySalesData.filter(s => s._id.dayOfWeek === dayNum);

                const online = Number((dayData.find(d => d._id.paymentMethod === 'googlepay')?.total || 0).toFixed(2));
                const cash = Number((dayData.find(d => d._id.paymentMethod === 'counter')?.total || 0).toFixed(2));

                return {
                    period: day,
                    Online: online,
                    Cash: cash
                };
            });

            // Format daily data
            const online = Number((dailySalesData.find(d => d._id.paymentMethod === 'googlepay')?.total || 0).toFixed(2));
            const cash = Number((dailySalesData.find(d => d._id.paymentMethod === 'counter')?.total || 0).toFixed(2));

            const dailyFormatted = [{
                period: "Today",
                Online: online,
                Cash: cash
            }];

            res.status(200).json({
                selectedPeriod: 'Monthly',
                selectedDate,
                data: {
                    monthly: monthlyFormatted,
                    weekly: weeklyFormatted,
                    daily: dailyFormatted
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