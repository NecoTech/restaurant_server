'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface Credentials {
    email: string;
    password: string;
}

interface RegisterCredentials extends Credentials {
    confirmPassword: string;
    name: string;
}

interface AuthResponse {
    success: boolean;
    token?: string;
    message?: string;
}

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [credentials, setCredentials] = useState<Credentials>({
        email: '',
        password: ''
    });
    const [registerCredentials, setRegisterCredentials] = useState<RegisterCredentials>({
        email: '',
        password: '',
        confirmPassword: '',
        name: ''
    });
    const [error, setError] = useState<string>('');
    const router = useRouter();

    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });

            const data: AuthResponse = await res.json();

            if (data.success && data.token) {
                localStorage.setItem('adminToken', data.token)
                localStorage.setItem('adminEmail', credentials.email) // Store admin email
                router.push('/dashboard')
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('An error occurred during login');
        }
    };

    const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        if (registerCredentials.password !== registerCredentials.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: registerCredentials.email,
                    password: registerCredentials.password,
                    name: registerCredentials.name
                }),
            });

            const data: AuthResponse = await res.json();

            if (data.success) {
                setIsLogin(true);
                setError('Account created successfully! Please login.');
                setCredentials({
                    email: registerCredentials.email,
                    password: ''
                });
            } else {
                setError(data.message || 'Registration failed');
            }
        } catch (err) {
            setError('An error occurred during registration');
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                        {isLogin ? 'Admin Login' : 'Create Admin Account'}
                    </h2>
                </div>

                {error && (
                    <div className="mb-4 text-center text-red-500 bg-red-100 p-2 rounded">
                        {error}
                    </div>
                )}

                {isLogin ? (
                    // Login Form
                    <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    className="relative block w-full rounded-t-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                                    placeholder="Email address"
                                    value={credentials.email}
                                    onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="relative block w-full rounded-b-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                                    placeholder="Password"
                                    value={credentials.password}
                                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                            >
                                Sign in
                            </button>
                        </div>
                    </form>
                ) : (
                    // Register Form
                    <form className="mt-8 space-y-6" onSubmit={handleRegister}>
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div>
                                <input
                                    id="register-name"
                                    name="name"
                                    type="text"
                                    required
                                    className="relative block w-full rounded-t-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                                    placeholder="Full Name"
                                    value={registerCredentials.name}
                                    onChange={(e) => setRegisterCredentials({ ...registerCredentials, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <input
                                    id="register-email"
                                    name="email"
                                    type="email"
                                    required
                                    className="relative block w-full border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                                    placeholder="Email address"
                                    value={registerCredentials.email}
                                    onChange={(e) => setRegisterCredentials({ ...registerCredentials, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <input
                                    id="register-password"
                                    name="password"
                                    type="password"
                                    required
                                    className="relative block w-full border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                                    placeholder="Password"
                                    value={registerCredentials.password}
                                    onChange={(e) => setRegisterCredentials({ ...registerCredentials, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <input
                                    id="register-confirm-password"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    className="relative block w-full rounded-b-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                                    placeholder="Confirm Password"
                                    value={registerCredentials.confirmPassword}
                                    onChange={(e) => setRegisterCredentials({ ...registerCredentials, confirmPassword: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                            >
                                Create Account
                            </button>
                        </div>
                    </form>
                )}

                <div className="text-center">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-sm text-blue-600 hover:text-blue-500"
                    >
                        {isLogin ? 'Create new account' : 'Already have an account? Sign in'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;