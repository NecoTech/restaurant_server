import { getSession } from 'next-auth/react';

export function withSubscription(handler) {
    return async (req, res) => {
        try {
            const session = await getSession({ req });
            if (!session) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const verifyResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/verify?userId=${session.user.id}`
            );

            const { hasActiveSubscription } = await verifyResponse.json();
            if (!hasActiveSubscription) {
                return res.status(403).json({ error: 'Subscription required' });
            }

            return handler(req, res);
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    };
}
