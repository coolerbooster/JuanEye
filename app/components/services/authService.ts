// src/services/authService.ts

import AsyncStorage from "@react-native-async-storage/async-storage";

// const API_BASE = 'http://167.71.198.130:3001'; // ← adjust to your backend host
const API_BASE = 'http://192.168.50.40:3001'; // ← adjust to your backend host

export interface AuthResponse {
    token?: string;
    userId?: number;
    email?: string;
    message?: string;
    error?: string;
}

export interface ScanStats {
    objectScanCount: number;
    ocrScanCount: number;
}

export interface photoUploadResponse {
    message: string;
    llm_id: number;
    file: string;
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
 * GET /api/user/guardian/all-scans/user
 * Query: ?user_id=<number>
 */
export async function getUserScans(
    userId: number
): Promise<
    (
        | { scanId: number; name: string; text: string; type: 'Object' | 'Text'; createdAt: string }
        | { id: number; conversation_id: string; first_user_message: string; type: 'LLM'; createdAt: string }
        )[]
> {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Authentication expired. Please log in again.');

    const res = await fetch(
        `${API_BASE}/api/user/guardian/all-scans/user?user_id=${userId}`,
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
    return body as (
        | { scanId: number; name: string; text: string; type: 'Object' | 'Text'; createdAt: string }
        | { id: number; conversation_id: string; first_user_message: string; type: 'LLM'; createdAt: string }
        )[];
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

/**
 * GET /api/user/photo-upload
 * POST /api/user/photo-upload
 * Body: { title, description }, File: media (.mp4/.m4a/.mp3)
 */
export async function photoUpload(
    description: string,
    media: { uri: string; name: string; type: string },
    email: string
): Promise<photoUploadResponse> {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Authentication expired. Please log in again.');

    const formData = new FormData();
    formData.append('description', description);
    formData.append('media', {
        uri: media.uri,
        name: media.name,
        type: media.type,
    } as any);
    formData.append('email', email);

    const res = await fetch(`${API_BASE}/api/user/photo-upload`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(
            err.error || err.message || `Failed to create LLM scan (${res.status})`
        );
    }

    const data = await res.json();
    return data as photoUploadResponse;
}


export interface StreamFragment {
    conversationId?: string;
    answer?: string;
    done: boolean;
}

export interface ChatResponse {
    ok: boolean;
    status: number;
    data: {
        conversationId: string;
        answer: string;
    } | null;
}

export function chatWithHistory(
    content: string,
    base64?: string,
    conversationId?: string,
    isStream: boolean = false,
    onFragment?: (frag: StreamFragment) => void
): Promise<ChatResponse> {
    return new Promise(async (resolve, reject) => {
        const token = await AsyncStorage.getItem('token');
        if (!token) return reject(new Error('Authentication expired. Please log in again.'));

        const payload: any = { content, isStream };
        if (conversationId) payload.conversationId = conversationId;
        if (base64)      payload.base64       = base64;

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE}/api/user/llm-ask-question`, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        let buffer = '';
        let lastIndex = 0;           // ← track how many chars we've already read
        let streamingDone = false;

        xhr.onreadystatechange = () => {
            if (xhr.readyState === 2 && xhr.status === 404) {
                reject(new Error(`Chat request failed (${xhr.status})`));
            }
        };

        xhr.onprogress = () => {
            if (!isStream) return;

            // only grab the *new* text since the last event
            const fullText = xhr.responseText;
            const newChunk = fullText.substring(lastIndex);
            lastIndex = fullText.length;

            buffer += newChunk;
            const parts = buffer.split('\n');
            buffer = parts.pop()!;  // leave the trailing incomplete line

            for (const line of parts) {
                if (!line.trim()) continue;
                try {
                    const frag: StreamFragment = JSON.parse(line);
                    onFragment?.(frag);
                    if (frag.done) {
                        streamingDone = true;
                        xhr.abort();
                    }
                } catch {
                    // ignore malformed JSON
                }
            }
        };

        xhr.onload = () => {
            if (isStream) {
                // streaming path ended via onprogress + abort
                return resolve({ ok: true, status: xhr.status, data: null! });
            }
            // non‐streaming: parse entire response
            try {
                const json = JSON.parse(xhr.responseText);
                console.log(json)
                resolve(json as ChatResponse);
            } catch {
                reject(new Error('Invalid JSON response'));
            }
        };

        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(JSON.stringify(payload));
    });
}