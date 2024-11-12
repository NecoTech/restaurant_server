'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ProtectedRoute = ({ children }) => {
    const router = useRouter();

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                router.push('/login');
            }
        };

        checkAuth();
    }, [router]);

    return <>{children}</>;
};

export default ProtectedRoute;