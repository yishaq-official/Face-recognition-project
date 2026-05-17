// /frontend/src/utils/authUtils.js

const TOKEN_KEY = 'faceguard_admin_token';

/** Single source of truth for the backend URL. */
export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

export const setToken   = (token) => localStorage.setItem(TOKEN_KEY, token);
export const getToken   = ()      => localStorage.getItem(TOKEN_KEY);
export const clearToken = ()      => localStorage.removeItem(TOKEN_KEY);

/** Returns the decoded JWT payload, or null if missing/malformed. */
export const getTokenPayload = () => {
  const token = getToken();
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

/** Returns true only if a token exists AND has not expired yet. */
export const isAuthenticated = () => {
  const payload = getTokenPayload();
  return payload ? payload.exp * 1000 > Date.now() : false;
};

/**
 * Returns how many seconds until the token expires.
 * Returns 0 if already expired or no token present.
 */
export const tokenSecondsRemaining = () => {
  const payload = getTokenPayload();
  if (!payload) return 0;
  return Math.max(0, Math.floor((payload.exp * 1000 - Date.now()) / 1000));
};

/**
 * Custom DOM event fired whenever any authFetch call receives a 401.
 * AuthProvider listens for this and triggers logout from one place.
 */
export const AUTH_EXPIRED_EVENT = 'faceguard:auth:expired';

export const emitAuthExpired = () =>
  window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));

/**
 * Attaches Bearer token to any fetch call.
 * - For FormData bodies, Content-Type is omitted so the browser sets the
 *   correct multipart/form-data boundary automatically.
 * - On any 401 response, fires AUTH_EXPIRED_EVENT so AuthProvider can
 *   log the user out and redirect — no per-component handling needed.
 */
export const authFetch = async (url, options = {}) => {
  const token      = getToken();
  const isFormData = options.body instanceof FormData;

  const headers = {
    'Authorization': token ? `Bearer ${token}` : '',
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    // Token is missing, expired, or invalid — trigger global logout
    emitAuthExpired();
  }

  return response;
};
