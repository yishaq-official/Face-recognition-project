// /frontend/src/utils/authUtils.js

const TOKEN_KEY = 'insa_admin_token';

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

/** Attaches Bearer token to any fetch call */
export const authFetch = (url, options = {}) => {
  const token = getToken();
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': options.body instanceof FormData
        ? undefined          // let browser set multipart boundary
        : 'application/json',
      ...options.headers,
    },
  });
};