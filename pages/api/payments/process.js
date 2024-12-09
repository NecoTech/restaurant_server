import Stripe from 'stripe';
import { protect } from '../../../middleware/authMiddleware';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await protect(req, res, async () => {
            const { paymentToken, amount, planId } = req.body;

            const charge = await stripe.charges.create({
                amount,
                currency: 'usd',
                source: paymentToken,
                description: `Subscription payment for ${planId} plan`
            });

            res.status(200).json({ success: true, charge });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}