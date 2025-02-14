import dbConnect from '../../../lib/dbConnect';
import OtherBill from '../../../models/OtherBill';
import { withCors } from '../../../lib/cors';
import {
    startOfMonth, endOfMonth,
    startOfWeek, endOfWeek,
    startOfDay, endOfDay,
    parseISO
} from 'date-fns';

async function handler(req, res) {
    const { method, query } = req;
    await dbConnect();

    if (method === 'GET') {
        try {
            const { restaurantId, date, view } = query;
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

            const bills = await OtherBill.find({
                restaurantId,
                billDate: {
                    $gte: startDate,
                    $lte: endDate
                }
            }).sort({ billDate: -1 });

            // Calculate summary
            const summary = bills.reduce((acc, bill) => {
                acc.totalAmount += bill.amount;
                acc.totalPending += bill.paymentStatus === 'PENDING' ? bill.amount : 0;
                acc.totalPaid += bill.paymentStatus === 'PAID' ? bill.amount : 0;
                acc.totalPartial += bill.paymentStatus === 'PARTIAL' ? bill.amount : 0;
                return acc;
            }, {
                totalAmount: 0,
                totalPending: 0,
                totalPaid: 0,
                totalPartial: 0
            });

            // Group bills by type
            const groupedBills = bills.reduce((acc, bill) => {
                if (!acc[bill.billType]) {
                    acc[bill.billType] = [];
                }
                acc[bill.billType].push(bill);
                return acc;
            }, {});

            res.status(200).json({
                items: bills,
                summary,
                groupedBills,
                period: {
                    startDate,
                    endDate,
                    view
                }
            });

        } catch (error) {
            console.error('Bills API Error:', error);
            res.status(500).json({ message: error.message });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
}

export default withCors(handler);