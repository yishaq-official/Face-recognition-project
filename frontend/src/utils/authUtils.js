// /frontend/src/utils/authUtils.js

const TOKEN_KEY = 'insa_admin_token';

/** Single source of truth for the backend URL.
 *  Set VITE_API_BASE_URL in a .env file to override for production. */
export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

export const setToken   = (token) => localStorage.setItem(TOKEN_KEY, token);
export const getToken   = ()      => localStorage.getItem(TOKEN_KEY);
export const clearToken = ()      => localStorage.removeItem(TOKEN_KEY);

export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;

  // Decode the JWT payload (no signature verification — server does that)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // Check expiry (exp is in seconds)
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

/** Attaches Bearer token to any fetch call.
 *  For FormData bodies, Content-Type is intentionally omitted so the
 *  browser sets the correct multipart/form-data boundary automatically. */
export const authFetch = (url, options = {}) => {
  const token      = getToken();
  const isFormData = options.body instanceof FormData;

  const headers = {
    'Authorization': token ? `Bearer ${token}` : '',
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers,
  };

  return fetch(url, { ...options, headers });
};