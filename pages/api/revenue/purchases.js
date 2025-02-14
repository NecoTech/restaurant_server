import dbConnect from '../../../lib/dbConnect';
import PurchaseBill from '../../../models/PurchaseBill';
import { withCors } from '../../../lib/cors';
import {
    startOfMonth, endOfMonth,
    startOfWeek, endOfWeek,
    startOfDay, endOfDay,
    parseISO,
} from 'date-fns';
import { console } from 'inspector';

async function handler(req, res) {
    const { method, query } = req;
    await dbConnect();

    if (method === 'GET') {
        try {
            const { restaurantId, date, view } = query;
            console.log(restaurantId);
            if (!restaurantId) {
                return res.status(400).json({ message: 'Restaurant ID is required' });
            }

            const selectedDate = date ? parseISO(date) : new Date();
            let startDate, endDate;

            switch (view?.toLowerCase()) {
                case 'monthly':
                    startDate = startOfMonth(selectedDate);
                    endDate = endOfMonth(selectedDate);
                    break;
                case 'weekly':
                    startDate = startOfWeek(selectedDate);
                    endDate = endOfWeek(selectedDate);
                    break;
                default: // daily
                    startDate = startOfDay(selectedDate);
                    endDate = endOfDay(selectedDate);
                    break;
            }

            const purchases = await PurchaseBill.find({
                restaurantId,
                billDate: {
                    $gte: startDate,
                    $lte: endDate
                }
            }).sort({ billDate: -1 });

            // Calculate total amounts
            const summary = purchases.reduce((acc, purchase) => {
                acc.totalAmount += purchase.totalAmount;
                acc.totalTax += purchase.taxAmount;
                acc.finalAmount += purchase.finalAmount;
                return acc;
            }, { totalAmount: 0, totalTax: 0, finalAmount: 0 });

            // Format items for display
            const items = purchases.flatMap(purchase =>
                purchase.items.map(item => ({
                    ...item.toObject(),
                    billNumber: purchase.billNumber,
                    billDate: purchase.billDate,
                    vendorName: purchase.vendorName
                }))
            );

            res.status(200).json({
                summary,
                items,
                period: {
                    startDate,
                    endDate,
                    view
                }
            });

        } catch (error) {
            console.error('Purchase API Error:', error);
            res.status(500).json({ message: error.message });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
}

export default withCors(handler);