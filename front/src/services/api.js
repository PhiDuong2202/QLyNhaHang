import axios from "axios";

const rawApiUrl = import.meta.env.VITE_API_URL || "https://qlynhahang.onrender.com/api";
const apiURL = rawApiUrl.endsWith("/api") ? rawApiUrl : `${rawApiUrl.replace(/\/$/, "")}/api`;

const api = axios.create({
  baseURL: apiURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Export the base storage URL for use in image URLs throughout the app
const host = apiURL.replace(/\/api\/?$/, "");
export const STORAGE_BASE_URL = `${host}/storage`;

const CACHE_TTL_MS = 60 * 1000;
const responseCache = new Map();

const buildCacheKey = (config) => {
  const base = config.baseURL || "";
  const url = config.url || "";
  const params = config.params ? JSON.stringify(config.params) : "";
  return `${base}${url}?${params}`;
};

const readCachedData = ({ url, params, maxAge = CACHE_TTL_MS }) => {
  const key = buildCacheKey({
    baseURL: api.defaults.baseURL,
    url,
    params,
  });
  const cached = responseCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > maxAge) return null;
  return cached.data;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const method = config.method?.toLowerCase();
  const isSyncRoute = config.url?.includes("sync");
  if (method === "get" && !config.skipCache && !isSyncRoute) {
    const key = buildCacheKey(config);
    const cached = responseCache.get(key);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      config.adapter = async () => ({
        data: cached.data,
        status: 200,
        statusText: "OK",
        headers: {},
        config,
        request: { fromCache: true },
      });
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    const method = response.config?.method?.toLowerCase();
    const isSyncRoute = response.config?.url?.includes("sync");

    if (method === "get" && !response.config?.skipCache && !isSyncRoute) {
      const key = buildCacheKey(response.config);
      responseCache.set(key, {
        data: response.data,
        timestamp: Date.now(),
      });
    }

    if (["post", "put", "patch", "delete"].includes(method)) {
      responseCache.clear();
    }

    return response;
  },
  (error) => {
    const config = error.config;
    const method = config?.method?.toLowerCase();
    const isSyncRoute = config?.url?.includes("sync");

    if (method === "get" && config && !config.skipCache && !isSyncRoute) {
      const key = buildCacheKey(config);
      const cached = responseCache.get(key);

      if (cached) {
        return Promise.resolve({
          data: cached.data,
          status: 200,
          statusText: "OK",
          headers: {},
          config,
          request: { fromCache: true, fallback: true },
        });
      }
    }

    return Promise.reject(error);
  }
);

api.prefetchAdminData = () => {
  const endpoints = [
    "/orders",
    "/payments",
    "/products",
    "/categories",
    "/tables",
    "/reviews",
  ];

  return Promise.allSettled(
    endpoints.map((endpoint) => api.get(endpoint, { skipCache: false }))
  );
};

api.prefetchStaffData = () => {
  const endpoints = ["/products", "/tables", "/categories", "/orders"];
  return Promise.allSettled(
    endpoints.map((endpoint) => api.get(endpoint, { skipCache: false }))
  );
};

api.readCachedData = readCachedData;

export default api;
