"use client";
import envConfig from "@/config";
import Cookies from "js-cookie";

type HttpOptions = {
  headers?: Record<string, string>;
  contentType?: string;
};

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type RequestData = FormData | Record<string, unknown> | string | null | undefined;

class HttpClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || envConfig.NEXT_PUBLIC_API_ENDPOINT;
    // Load token from cookie on init
    this.accessToken = Cookies.get("accessToken") || null;
  }

  setAccessToken(token: string | null): void {
    this.accessToken = token;
    if (token) {
      Cookies.set("accessToken", token, {
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: 7,
      });
    } else {
      Cookies.remove("accessToken");
    }
  }

  private getAccessToken(): string | null {
    // Priority: Memory -> Cookie
    return this.accessToken || Cookies.get("accessToken") || null;
  }

  private buildHeaders(
    options?: HttpOptions,
    data?: RequestData
  ): Record<string, string> {
    const headers: Record<string, string> = {};

    // Nếu data là FormData, không set Content-Type (browser tự động set với boundary)
    if (!(data instanceof FormData)) {
      headers["Content-Type"] = options?.contentType || "application/json";
    }

    // Thêm access token vào header nếu có
    const accessToken = this.getAccessToken();
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    // Merge với headers tùy chỉnh
    if (options?.headers) {
      Object.assign(headers, options.headers);
    }

    return headers;
  }

  private async request<T>(
    method: HttpMethod,
    endpoint: string,
    data?: RequestData,
    options?: HttpOptions
  ): Promise<T> {
    const normalizedBaseUrl = this.baseUrl.endsWith("/")
      ? this.baseUrl.slice(0, -1)
      : this.baseUrl;

    const url = endpoint.startsWith("http")
      ? endpoint
      : `${normalizedBaseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    const headers = this.buildHeaders(options, data);

    const config: RequestInit = {
      method,
      headers,
    };

    if (data !== undefined && data !== null && method !== "GET") {
      config.body = data instanceof FormData ? data : JSON.stringify(data);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    config.signal = controller.signal;

    if (process.env.NODE_ENV === 'development') {
      console.log('[API] Fetching:', method, url);
    }

    let response: Response;
    try {
      response = await fetch(url, config);
    } catch (networkError) {
      if (networkError instanceof Error && networkError.name === 'AbortError') {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[API] Request timed out:', url);
        }
        throw new Error("Request timed out. Please try again.");
      }
      if (process.env.NODE_ENV === 'development') {
        console.error('[API] Network error:', networkError);
      }
      throw networkError;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      if (response.status === 401) {
        this.setAccessToken(null);
      }
      try {
        const error = await response.json();
        throw new Error(error.message || `HTTP Error: ${response.status}`);
      } catch (e) {
        const errorMsg =
          e instanceof Error ? e.message : `HTTP Error: ${response.status}`;
        throw new Error(errorMsg);
      }
    }

    try {
      return await response.json();
    } catch (e) {
      console.error("Failed to parse response as JSON:", e);
      throw new Error("Invalid response format from server");
    }
  }

  get<T>(endpoint: string, options?: HttpOptions): Promise<T> {
    return this.request("GET", endpoint, undefined, options);
  }

  post<T>(endpoint: string, data?: RequestData, options?: HttpOptions): Promise<T> {
    return this.request("POST", endpoint, data, options);
  }

  put<T>(endpoint: string, data?: RequestData, options?: HttpOptions): Promise<T> {
    return this.request("PUT", endpoint, data, options);
  }

  delete<T>(endpoint: string, data?: RequestData, options?: HttpOptions): Promise<T> {
    return this.request("DELETE", endpoint, data, options);
  }

  patch<T>(endpoint: string, data?: RequestData, options?: HttpOptions): Promise<T> {
    return this.request("PATCH", endpoint, data, options);
  }
}

const http = new HttpClient();
export default http;

export { HttpClient };