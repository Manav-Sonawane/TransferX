import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor ──────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// A single in-flight refresh promise shared by every concurrent 401.
// Without this, each request that 401s at the same time independently calls
// /auth/refresh. The backend rotates refresh tokens on every use and treats a
// second use of an already-rotated token as reuse — wiping ALL of that user's
// sessions. Two requests 401ing together was enough to trigger it.
let refreshPromise = null;

const performRefresh = () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
        {},
        { withCredentials: true }
      )
      .then(({ data }) => {
        const newToken = data.data.accessToken;
        localStorage.setItem('accessToken', newToken);
        return newToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

// ─── Response Interceptor ─────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying, try refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await performRefresh();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (_err) {
        localStorage.removeItem('accessToken');
        return Promise.reject(_err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
