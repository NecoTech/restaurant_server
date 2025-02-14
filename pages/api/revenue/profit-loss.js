import dbConnect from '../../../lib/dbConnect';
import Order from '../../../models/Order';
import OtherBill from '../../../models/OtherBill';
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

            // Get data for monthly view (last 12 months)
            const monthlyStartDate = subMonths(startOfMonth(selectedDate), 11);
            const monthlyEndDate = endOfMonth(selectedDate);

            // Get data for weekly view (current week)
            const weeklyStartDate = startOfDay(subDays(selectedDate, 6)); // 6 days back + current day = 7 days
            const weeklyEndDate = endOfDay(selectedDate);

            // Get data for daily view (current day)
            const dailyStartDate = startOfDay(selectedDate);
            const dailyEndDate = endOfDay(selectedDate);

            // Get monthly sales data
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
                        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                        sales: { $sum: "$total" }
                    }
                }
            ]);

            // Get monthly expense data
            const monthlyExpenseData = await OtherBill.aggregate([
                {
                    $match: {
                        restaurantId,
                        billDate: { $gte: monthlyStartDate, $lte: monthlyEndDate },
                        paymentStatus: { $in: ['PAID', 'PARTIAL'] }
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m", date: "$billDate" } },
                        expense: { $sum: "$amount" }
                    }
                }
            ]);

            // Get weekly data
            const [weeklySales, weeklyExpenses] = await Promise.all([
                Order.aggregate([
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
                            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                            sales: { $sum: "$total" }
                        }
                    }
                ]),
                OtherBill.aggregate([
                    {
                        $match: {
                            restaurantId,
                            billDate: { $gte: weeklyStartDate, $lte: weeklyEndDate },
                            paymentStatus: { $in: ['PAID', 'PARTIAL'] }
                        }
                    },
                    {
                        $group: {
                            _id: { $dateToString: { format: "%Y-%m-%d", date: "$billDate" } },
                            expense: { $sum: "$amount" }
                        }
                    }
                ])
            ]);

            // Get daily data
            const dailyData = await Promise.all([
                Order.aggregate([
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
                            sales: { $sum: "$total" }
                        }
                    }
                ]),
                OtherBill.aggregate([
                    {
                        $match: {
                            restaurantId,
                            billDate: { $gte: dailyStartDate, $lte: dailyEndDate },
                            paymentStatus: { $in: ['PAID', 'PARTIAL'] }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            expense: { $sum: "$amount" }
                        }
                    }
                ])
            ]);

            // Format monthly data
            const monthlyFormatted = eachDayOfInterval({ start: monthlyStartDate, end: monthlyEndDate })
                .filter(date => date.getDate() === 1) // Get first day of each month
                .map(date => {
                    const monthKey = format(date, 'yyyy-MM');
                    const salesEntry = monthlySalesData.find(s => s._id === monthKey) || { sales: 0 };
                    const expenseEntry = monthlyExpenseData.find(e => e._id === monthKey) || { expense: 0 };

                    const sales = Number((salesEntry.sales || 0).toFixed(2));
                    const expense = Number((expenseEntry.expense || 0).toFixed(2));
                    const profit = Number((sales - expense).toFixed(2));

                    return {
                        period: format(date, 'MMM'),
                        sales,
                        expense,
                        profit
                    };
                });

            // Format weekly data
            // const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const weeklyFormatted = eachDayOfInterval({ start: weeklyStartDate, end: weeklyEndDate })
                .map(date => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const salesEntry = weeklySales.find(s => s._id === dateStr) || { sales: 0 };
                    const expenseEntry = weeklyExpenses.find(e => e._id === dateStr) || { expense: 0 };

                    const sales = Number((salesEntry.sales || 0).toFixed(2));
                    const expense = Number((expenseEntry.expense || 0).toFixed(2));
                    const profit = Number((sales - expense).toFixed(2));

                    return {
                        period: `${format(date, 'EEE ')}\n${format(date, 'MMM d')}`,
                        sales,
                        expense,
                        profit,
                        fullDate: dateStr
                    };
                });

            // Format daily data
            const dailySales = Number((dailyData[0][0]?.sales || 0).toFixed(2));
            const dailyExpense = Number((dailyData[1][0]?.expense || 0).toFixed(2));
            const dailyFormatted = [{
                period: "Today",
                sales: dailySales,
                expense: dailyExpense,
                profit: Number((dailySales - dailyExpense).toFixed(2))
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
            console.error('Profit/Loss API Error:', error);
            res.status(500).json({ message: error.message });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
}

export default withCors(handler);