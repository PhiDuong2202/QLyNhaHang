import axios from "axios";

const rawApiUrl = import.meta.env.VITE_API_URL || "https://qlynhahang.onrender.com/api";
const apiURL = rawApiUrl.endsWith("/api") ? rawApiUrl : `${rawApiUrl.replace(/\/$/, "")}/api`;

const axiosClient = axios.create({
  baseURL: apiURL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosClient;
