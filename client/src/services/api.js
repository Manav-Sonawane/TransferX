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

// ─── Response Interceptor ─────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying, try refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = data.data.accessToken;
        localStorage.setItem('accessToken', newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        // Fetch current user to update AuthContext state
        try {
          const { data: userData } = await axios.get(
            `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/me`,
            { withCredentials: true }
          );
          localStorage.setItem('user', JSON.stringify(userData.data.user));
        } catch {
          // ignore user fetch errors during token refresh
        }

        return api(originalRequest);
      } catch (_err) {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(_err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
