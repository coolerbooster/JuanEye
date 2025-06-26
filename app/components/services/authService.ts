// src/services/authService.ts
// centralize all auth-related HTTP calls

const API_BASE = 'http://192.168.50.48:3001'; // ← adjust to your backend host

export interface AuthResponse {
    token?: string;
    userId?: number;
    message?: string;
    error?: string;
}

/**
 * POST /api/auth/login
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
}

/**
 * POST /api/auth/signup
 * Now accepts accountType
 */
export async function signup(
    email: string,
    password: string,
    accountType: 'Guardian' | 'User'
): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, accountType }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Signup failed');
    return data;
}

/**
 * POST /api/auth/forgot-password
 */
export async function requestOTP(email: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not send OTP.');
    return data;
}

/**
 * POST /api/auth/reset-password
 */
export async function resetPassword(
    email: string,
    codeValue: string,
    newPassword: string
): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, codeValue, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not reset password.');
    return data;
}
