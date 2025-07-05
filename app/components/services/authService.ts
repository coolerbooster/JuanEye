// src/services/authService.ts

import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = 'http://167.71.198.130:3001'; // ← adjust to your backend host

export interface AuthResponse {
    token?: string;
    userId?: number;
    message?: string;
    error?: string;
}

export interface ScanStats {
    objectScanCount: number;
    ocrScanCount: number;
}
/**
 * POST /api/auth/login
 */
export async function login(
    email: string,
    password: string
): Promise<{ token: string }> {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    // parse the JSON response
    const body = await res.json();
    console.log('authService.login response body:', body);

    // if the HTTP status is not OK, bubble up the error
    if (!res.ok) {
        // your backend might include an error message field
        throw new Error(body.error || body.message || 'Login failed');
    }

    // now extract the token from either shape:
    // 1) body.data.token  or  2) body.token
    const tokenFromData = body.data?.token as string | undefined;
    const tokenDirect = body.token as string | undefined;
    const token = tokenFromData ?? tokenDirect;

    if (!token) {
        throw new Error('Login succeeded but no token returned');
    }

    // Store it for the rest of the app
    await AsyncStorage.setItem('token', token);

    // return the token so screens can use resp.token
    return { token };
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

/**
 * GET /api/user/guardian/bound-users
 */
export async function getBoundUsers(): Promise<
    { user_id: number; email: string }[]
> {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Authentication expired. Please log in again.');

    const res = await fetch(`${API_BASE}/api/user/guardian/bound-users`, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        // HTTP-level error
        throw new Error(`Failed to fetch users (${res.status})`);
    }

    const body = await res.json();

    return body as { user_id: number; email: string }[];
}

/**
 * GET /api/user/scans/user
 * Query: ?user_id=<number>
 */
export async function getUserScans(
    userId: number
): Promise<
    { scanId: number; name: string; text: string; type: string; createdAt: string }[]
> {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Authentication expired. Please log in again.');

    const res = await fetch(
        `${API_BASE}/api/user/scans/user?user_id=${userId}`,
        {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!res.ok) {
        throw new Error(`Failed to fetch scans (${res.status})`);
    }

    const body = await res.json();
    return body as {
        scanId: number;
        name: string;
        text: string;
        type: string;
        createdAt: string;
    }[];
}

/**
 * GET /api/user/dashboard
 */
export async function getDashboard(): Promise<{
    message: string;
    user: {
        user_id: number;
        email: string;
        accountType: string;
        scanCount: number;
        isPremiumUser: boolean;
    };
}> {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Authentication expired. Please log in again.');

    const res = await fetch(`${API_BASE}/api/user/dashboard`, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch dashboard (${res.status})`);
    }

    const data = await res.json();
    return data as {
        message: string;
        user: {
            user_id: number;
            email: string;
            accountType: string;
            scanCount: number;
            isPremiumUser: boolean;
        };
    };
}

/**
 * GET /api/user/profile
 */
export async function getProfile(): Promise<{
    user_id: number;
    email: string;
    accountType: string;
    isPremiumUser: boolean;
    scanCount: number;
    deviceUuid: string;
    phone: string | null;
    createdAt: string;
    updatedAt: string;
}> {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Authentication expired. Please log in again.');

    const res = await fetch(`${API_BASE}/api/user/profile`, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch profile (${res.status})`);
    }

    const data = await res.json();
    return data as {
        user_id: number;
        email: string;
        accountType: string;
        isPremiumUser: boolean;
        scanCount: number;
        deviceUuid: string;
        phone: string | null;
        createdAt: string;
        updatedAt: string;
    };
}

/**
 * POST /api/user/ocr-scans
 */
export async function createOCRScan(
    recognizedText: string,
    text: string
): Promise<{
    message: string;
    scan: {
        scanId: number;
        recognizedText: string;
        text: string;
    };
}> {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Authentication expired. Please log in again.');

    const res = await fetch(`${API_BASE}/api/user/ocr-scans`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ recognizedText, text }),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || err.message || `Failed to create OCR scan (${res.status})`);
    }

    const data = await res.json();
    return data as {
        message: string;
        scan: {
            scanId: number;
            recognizedText: string;
            text: string;
        };
    };
}

/**
 * POST /api/user/object-scans
 */
export async function createObjectScan(
    recognizedObjects: string,
    text: string
): Promise<{
    message: string;
    scan: {
        scanId: number;
        recognizedObjects: string;
        text: string;
    };
}> {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Authentication expired. Please log in again.');

    const res = await fetch(`${API_BASE}/api/user/object-scans`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ recognizedObjects, text }),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || err.message || `Failed to create object scan (${res.status})`);
    }

    const data = await res.json();
    return data as {
        message: string;
        scan: {
            scanId: number;
            recognizedObjects: string;
            text: string;
        };
    };
}

/**
 * GET /api/user/scans
 */
export async function getAllScans(): Promise<
    { scanId: number; name: string; text: string; type: string; createdAt: string }[]
> {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Authentication expired. Please log in again.');

    const res = await fetch(`${API_BASE}/api/user/scans`, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch all scans (${res.status})`);
    }

    const data = await res.json();
    return data as {
        scanId: number;
        name: string;
        text: string;
        type: string;
        createdAt: string;
    }[];
}

/**
 * GET /api/user/scans/:scanId
 */
export async function getScan(
    scanId: number
): Promise<any> {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Authentication expired. Please log in again.');

    const res = await fetch(`${API_BASE}/api/user/scans/${scanId}`, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch scan (${res.status})`);
    }

    return (await res.json()) as any;
}

/**
 * PUT /api/user/scans/:scanId
 */
export async function updateScan(
    scanId: number,
    type: 'Object' | 'Text',
    name: string,
    text: string
): Promise<{ message: string }> {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Authentication expired. Please log in again.');

    const res = await fetch(`${API_BASE}/api/user/scans/${scanId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type, name, text }),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || err.message || `Failed to update scan (${res.status})`);
    }

    return await res.json() as { message: string };
}

/**
 * DELETE /api/user/scans/:scanId
 */
export async function deleteScan(
    scanId: number
): Promise<{ message: string }> {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Authentication expired. Please log in again.');

    const res = await fetch(`${API_BASE}/api/user/scans/${scanId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || err.message || `Failed to delete scan (${res.status})`);
    }

    return await res.json() as { message: string };
}

/**
 * POST /api/user/guardian/bind-request
 */
export async function requestGuardianBind(
    email: string
): Promise<{ message: string }> {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Authentication expired. Please log in again.');

    const res = await fetch(`${API_BASE}/api/user/guardian/bind-request`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || err.message || `Failed to request bind (${res.status})`);
    }

    return await res.json() as { message: string };
}

/**
 * POST /api/user/guardian/bind-confirm
 */
export async function confirmGuardianBind(
    email: string,
    codeValue: string
): Promise<{ message: string }> {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Authentication expired. Please log in again.');

    const res = await fetch(`${API_BASE}/api/user/guardian/bind-confirm`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, codeValue }),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || err.message || `Failed to confirm bind (${res.status})`);
    }

    return await res.json() as { message: string };
}

/**
 * GET /api/user/guardian/scan-stats
 * Optional query params: startDate, endDate in YYYY-MM-DD
 */
export async function getScanStats(
    startDate?: string,
    endDate?: string
): Promise<ScanStats> {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Authentication expired. Please log in again.');

    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate)   params.append('endDate', endDate);

    const url = `${API_BASE}/api/user/guardian/scan-stats${params.toString() ? `?${params}` : ''}`;
    const res = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Failed to fetch scan stats (${res.status})`);
    }

    return (await res.json()) as ScanStats;
}
