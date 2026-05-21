"use client";
import envConfig from "@/config";

type HttpOptions = {
  headers?: Record<string, string>;
  contentType?: string;
  timeoutMs?: number;
};

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type RequestData = FormData | Record<string, unknown> | string | null | undefined;

class HttpClient {
  private baseUrl: string;
  private readonly defaultTimeoutMs = 45000;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || envConfig.NEXT_PUBLIC_API_ENDPOINT;
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

    // Identify this request as coming from the user-facing client app.
    // Backend uses this to scope cookie operations (login/logout/refresh)
    // to the user session only, without affecting the admin session.
    headers["X-Client-Type"] = "user";

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
      credentials: "include",
    };

    if (data !== undefined && data !== null && method !== "GET") {
      config.body = data instanceof FormData ? data : JSON.stringify(data);
    }

    const controller = new AbortController();
    const timeoutMs = options?.timeoutMs ?? this.defaultTimeoutMs;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
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
        throw new Error("Yêu cầu quá thời gian xử lý. Vui lòng thử lại.");
      }
      if (process.env.NODE_ENV === 'development') {
        console.error('[API] Network error:', networkError);
      }
      throw networkError;
    } finally {
      clearTimeout(timeoutId);
    }

    // Automatic silent token refresh on 401
    if (response.status === 401) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        // Recreate signal for the retry
        const retryController = new AbortController();
        const retryTimeout = setTimeout(() => retryController.abort(), timeoutMs);
        try {
          response = await fetch(url, { ...config, signal: retryController.signal });
        } finally {
          clearTimeout(retryTimeout);
        }
      }
    }

    if (!response.ok) {
      let errorMsg = `HTTP Error: ${response.status}`;
      try {
        const errorText = await response.text();
        if (errorText) {
          const error = JSON.parse(errorText);
          errorMsg = error.message || errorMsg;
        }
      } catch {
        // ignore parse errors on error responses
      }
      throw new Error(errorMsg);
    }

    if (response.status === 204) {
      return {} as T;
    }

    const rawResponse = await response.text();
    if (!rawResponse) {
      return {} as T;
    }

    try {
      return JSON.parse(rawResponse) as T;
    } catch (e) {
      console.error("Failed to parse response as JSON:", e);
      throw new Error("Phản hồi từ máy chủ không hợp lệ");
    }
  }

  get<T>(endpoint: string, options?: HttpOptions): Promise<T> {
    return this.request("GET", endpoint, undefined, options);
  }

  /**
   * Silently calls /auth/api/refresh to rotate tokens via HttpOnly cookies.
   * Returns true if the refresh was successful.
   */
  private async tryRefreshToken(): Promise<boolean> {
    try {
      const normalizedBase = this.baseUrl.endsWith("/")
        ? this.baseUrl.slice(0, -1)
        : this.baseUrl;
      const res = await fetch(`${normalizedBase}/auth/api/refresh`, {
        method: "POST",
        credentials: "include",
      });
      return res.ok;
    } catch {
      return false;
    }
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