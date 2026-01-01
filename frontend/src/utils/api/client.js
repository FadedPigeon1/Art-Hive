import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

const client = axios.create({
  baseURL: API_URL,
});

// Add request interceptor for debugging
client.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
client.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("API Response Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default client;
