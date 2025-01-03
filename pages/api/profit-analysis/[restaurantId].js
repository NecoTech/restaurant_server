import dbConnect from '../../../lib/dbConnect';
import Order from '../../../models/Order';
import MenuItem from '../../../models/MenuItem';
import { withCors } from '../../../lib/cors';

async function handler(req, res) {
    const {
        query: { restaurantId, startDate, endDate },
        method,
    } = req;

    await dbConnect();

    if (method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }

    try {
        // First, fetch all menu items for this restaurant to get their margins
        const menuItems = await MenuItem.find({ id: restaurantId });
        const menuItemMargins = {};

        // Create a lookup map for menu item margins
        menuItems.forEach(item => {
            menuItemMargins[item.name] = {
                margin: item.margin || 0,
                price: item.price
            };
        });

        // Fetch orders
        const orders = await Order.find({
            restaurantId,
            createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            },
            status: 'completed'
        }).sort({ createdAt: 1 });

        // Calculate daily profits
        const dailyProfits = {};
        let totalProfit = 0;
        let totalRevenue = 0;
        let totalCost = 0;
        let totalMarginPercentage = 0;
        let totalItemsWithMargin = 0;
        let orderCount = 0;

        orders.forEach(order => {
            const date = new Date(order.createdAt).toISOString().split('T')[0];
            const dayProfit = order.items.reduce((acc, orderItem) => {
                const menuItemData = menuItemMargins[orderItem.name];

                if (menuItemData) {
                    const itemMargin = menuItemData.margin;
                    const itemPrice = orderItem.price;
                    const itemProfit = (itemPrice * (itemMargin / 100)) * orderItem.quantity;
                    const itemRevenue = itemPrice * orderItem.quantity;
                    const itemCost = itemRevenue - itemProfit;

                    totalRevenue += itemRevenue;
                    totalCost += itemCost;

                    if (itemMargin > 0) {
                        totalMarginPercentage += itemMargin;
                        totalItemsWithMargin++;
                    }

                    return acc + itemProfit;
                }
                return acc;
            }, 0);

            totalProfit += dayProfit;
            orderCount += 1;

            if (!dailyProfits[date]) {
                dailyProfits[date] = 0;
            }
            dailyProfits[date] += dayProfit;
        });

        // Format data for chart
        const chartData = {
            labels: Object.keys(dailyProfits),
            datasets: [{
                data: Object.values(dailyProfits),
                color: (opacity = 1) => `rgba(5, 150, 105, ${opacity})`,
                strokeWidth: 2
            }]
        };

        const averageMargin = totalItemsWithMargin > 0
            ? totalMarginPercentage / totalItemsWithMargin
            : 0;

        // Calculate additional metrics
        const profitMargin = totalRevenue > 0
            ? (totalProfit / totalRevenue) * 100
            : 0;

        res.status(200).json({
            success: true,
            chartData,
            summary: {
                totalProfit,
                grossRevenue: totalRevenue,
                costOfGoods: totalCost,
                averageMargin,
                profitMargin,
                orderCount,
                totalItems: totalItemsWithMargin
            },
            dailyBreakdown: Object.entries(dailyProfits).map(([date, profit]) => ({
                date,
                profit,
                profitMargin: totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0
            }))
        });
    } catch (error) {
        console.error('Error in profit analysis:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch profit analysis',
            message: error.message
        });
    }
}

export default withCors(handler);