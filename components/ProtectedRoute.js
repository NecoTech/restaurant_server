'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkSubscriptionStatus } from '@/lib/subscription';

const ProtectedRoute = ({ children }) => {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                router.push('/login');
                return;
            }

            try {
                const subscription = await checkSubscriptionStatus();
                if (!subscription?.hasActiveSubscription) {
                    router.push('/subscription');
                    return;
                }
                setIsAuthorized(true);
            } catch (error) {
                console.error('Subscription check failed:', error);
                router.push('/subscription');
            }
        };

        checkAuth();
    }, [router]);

    if (!isAuthorized) return null;
    return <>{children}</>;
};

export default ProtectedRoute;