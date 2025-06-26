// services/authService.ts
import { API_URL } from "./config";

export interface LoginResponse { token: string; }
export async function login(
    email: string,
    password: string
): Promise<LoginResponse> {
    const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || "Login failed");
    }

    return res.json();
}

export interface SignupResponse {
    message: string;
    userId: number;
    token: string;
}
export async function signup(
    email: string,
    password: string
): Promise<SignupResponse> {
    const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || "Signup failed");
    }

    return res.json();
}

export interface ForgotPasswordResponse {
    message: string;
}
export async function forgotPassword(
    email: string
): Promise<ForgotPasswordResponse> {
    const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || "Forgot password failed");
    }

    return res.json();
}

export interface ResetPasswordResponse {
    message: string;
}
export async function resetPassword(
    email: string,
    codeValue: string,
    newPassword: string
): Promise<ResetPasswordResponse> {
    const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, codeValue, newPassword }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || "Reset password failed");
    }

    return res.json();
}
