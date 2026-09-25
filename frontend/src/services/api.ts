import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// ── In-Memory Client Cache for Static Catalogs ──
interface CacheEntry {
  data: any;
  headers: any;
  status: number;
  timestamp: number;
}
const memoryCache = new Map<string, CacheEntry>();

// Endpoints suitable for short client-side memoization (ms)
const CACHEABLE_ROUTES: { prefix: string; ttl: number }[] = [
  { prefix: "/turfs/facilities/", ttl: 120_000 }, // 2 min
  { prefix: "/turfs/", ttl: 45_000 },             // 45 sec (catalog only, not availability/schedule)
  { prefix: "/auth/settings/", ttl: 60_000 },     // 1 min
];

export const clearApiCache = (filter?: string) => {
  if (!filter) {
    memoryCache.clear();
  } else {
    for (const key of memoryCache.keys()) {
      if (key.includes(filter)) {
        memoryCache.delete(key);
      }
    }
  }
};

// Add Bearer token to outgoing requests and serve cached GETs if fresh
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ft_access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Invalidate cache on mutations
  if (config.method && !["get", "head", "options"].includes(config.method.toLowerCase())) {
    clearApiCache();
  }

  // If GET and cached fresh, return from memory cache immediately (0ms network bypass)
  if (config.method?.toLowerCase() === "get") {
    const url = config.url || "";
    const cached = memoryCache.get(url);
    if (cached && Date.now() < cached.timestamp) {
      config.adapter = async () => ({
        data: cached.data,
        status: cached.status,
        statusText: "OK",
        headers: cached.headers,
        config,
      });
    }
  }

  return config;
});

// Cache interceptor on response
api.interceptors.response.use(
  (response) => {
    const url = response.config.url || "";
    // Only cache pure catalog GET requests (exclude /schedule/ or /availability/ or query-heavy dynamic routes)
    if (
      response.config.method?.toLowerCase() === "get" &&
      !url.includes("/schedule/") &&
      !url.includes("/availability/") &&
      !url.includes("/lock/")
    ) {
      const match = CACHEABLE_ROUTES.find((r) => url === r.prefix || url.startsWith(r.prefix));
      if (match) {
        memoryCache.set(url, {
          data: response.data,
          headers: response.headers,
          status: response.status,
          timestamp: Date.now() + match.ttl,
        });
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    // Don't attempt to refresh if the failed request was the login/refresh endpoint itself
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("ft_refresh_token");
      if (refreshToken) {
        try {
          const baseURL = api.defaults.baseURL || "/api";
          const res = await axios.post(`${baseURL}/auth/refresh/`, {
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
          window.dispatchEvent(new CustomEvent("ft_auth_unauthorized"));
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
