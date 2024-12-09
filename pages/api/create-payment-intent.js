const Stripe = require('stripe');

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16' // Use latest API version
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { price, customerEmail } = req.body;

        const customer = await stripe.customers.create();
        const ephemeralKey = await stripe.ephemeralKeys.create(
            { customer: customer.id },
            { apiVersion: '2024-06-20' }
        );
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(price * 100),
            currency: 'cad',
            customer: customer.id,
            description: "Subscription Amount of " + customerEmail,

            // In the latest version of the API, specifying the `automatic_payment_methods` parameter
            // is optional because Stripe enables its functionality by default.
            automatic_payment_methods: {
                enabled: true,
            },
        });

        res.json({
            paymentIntent: paymentIntent.client_secret,
            ephemeralKey: ephemeralKey.secret,
            customer: customer.id,
            publishableKey: 'pk_test_51PvN6URoJOomwVMlAgoueDlCcPK7xL3ntbm7OWCO6q30UVgSVnURF9TFe059jcExl6IcAi6Kg97OBXrsMFEB0H4400xoOqycSI'
        });


    } catch (error) {
        console.error('Stripe error:', error);
        res.status(500).json({ message: error.message });
    }
}