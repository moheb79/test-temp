import axios, { AxiosError } from "axios";
import { getServerSession } from "next-auth";
import { getSession } from "next-auth/react";

import { getAcceptLanguage } from "@/locales/server";

async function getAuthorizationHeader() {
  if (typeof window === "undefined") {
    const session = await getServerSession();
    return `Bearer ${session?.user.token}`;
  } else {
    const session = await getSession();
    return `Bearer ${session?.user.token}`;
  }
}

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_BASE_URL,
  timeout: 5000,
  headers: { "Content-Type": "application/json" }
});

axiosInstance.interceptors.request.use(
  async function (config) {
    const acceptLanguage = getAcceptLanguage();
    config.headers["Accept-Language"] = acceptLanguage;
    const authorizationHeader = await getAuthorizationHeader();
    config.headers.Authorization = authorizationHeader;
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  function (response) {
    return response;
  },
  async function (error: AxiosError) {
    if (error.response?.status === 401) {
      try {
        const newAuthorizationHeader = await getAuthorizationHeader();
        error.request.config.headers.Authorization = newAuthorizationHeader;
        return axiosInstance.request(error.request.config);
      } catch (tokenRefreshError) {
        console.error("Token refresh failed:", tokenRefreshError);
        return Promise.reject(tokenRefreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
