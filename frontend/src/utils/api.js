const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Get auth headers with JWT token.
 */
export function authHeaders(extra = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Accept': 'application/json',
        ...extra,
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

/**
 * Wrapper for fetch with auth. Automatically handles 401 (redirect to login).
 */
export async function apiFetch(path, options = {}) {
    const url = path.startsWith('http') ? path : `${API_BASE}${path}`;

    const config = {
        ...options,
        credentials: 'include',
        headers: authHeaders(options.headers || {}),
    };

    const res = await fetch(url, config);

    // If token expired / invalid, clear and redirect
    if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
        throw new Error('Session expired. Please login again.');
    }

    return res;
}

/**
 * Shorthand for JSON GET.
 */
export async function apiGet(path) {
    const res = await apiFetch(path);
    return res.json();
}

/**
 * Shorthand for JSON POST.
 */
export async function apiPost(path, body) {
    const isFormData = body instanceof FormData;
    const config = {
        method: 'POST',
    };

    if (isFormData) {
        config.body = body;
    } else {
        config.headers = { 'Content-Type': 'application/json' };
        config.body = JSON.stringify(body);
    }

    const res = await apiFetch(path, config);
    return res.json();
}

export default { apiFetch, apiGet, apiPost, authHeaders, API_BASE };
