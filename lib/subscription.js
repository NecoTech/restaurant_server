export async function checkSubscriptionStatus() {
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch('/api/subscriptions/verify', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Subscription verification failed');
        return response.json();
    } catch (error) {
        console.error('Subscription check error:', error);
        return { hasActiveSubscription: false };
    }
}