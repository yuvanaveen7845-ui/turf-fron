import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add Bearer token to outgoing requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ft_access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept 401 responses and try refreshing token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("ft_refresh_token");
      if (refreshToken) {
        try {
          const baseUrl = api.defaults.baseURL || "";
          const refreshEndpoint = baseUrl.endsWith("/") ? `${baseUrl}auth/refresh/` : `${baseUrl}/auth/refresh/`;
          const res = await axios.post(refreshEndpoint, {
            refresh: refreshToken,
          });
          const newAccess = res.data.access;
          localStorage.setItem("ft_access_token", newAccess);
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem("ft_access_token");
          localStorage.removeItem("ft_refresh_token");
          localStorage.removeItem("ft_user");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
