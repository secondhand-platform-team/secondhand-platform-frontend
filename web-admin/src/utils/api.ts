import envConfig from "../config";

type HttpOptions = {
  headers?: Record<string, string>;
  contentType?: string;
};

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

// Map service name → Kong gateway prefix
const SERVICE_PREFIX: Record<string, string> = {
  auth: "/auth",
  core: "/core",
  order: "/order",
  chat: "/chat",
};

class HttpClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || envConfig.API_ENDPOINT;
  }

  private buildHeaders(options?: HttpOptions, data?: any): Record<string, string> {
    const headers: Record<string, string> = {};

    if (!(data instanceof FormData)) {
      headers["Content-Type"] = options?.contentType || "application/json";
    }

    // Tokens are stored in HttpOnly cookies — browser sends them automatically.
    // Do NOT read from localStorage or set Authorization header.

    if (options?.headers) {
      // Strip internal X-Service header before sending
      const { "X-Service": _service, ...rest } = options.headers;
      Object.assign(headers, rest);
    }

    return headers;
  }

  private async request<T>(
    method: HttpMethod,
    endpoint: string,
    data?: any,
    options?: HttpOptions
  ) {
    // Determine service prefix from X-Service header
    const service = options?.headers?.["X-Service"];
    const prefix = service ? SERVICE_PREFIX[service] || "" : "/auth";

    const url = endpoint.startsWith("http")
      ? endpoint
      : `${this.baseUrl}${prefix}/api${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    const headers = this.buildHeaders(options, data);
    const config: RequestInit = {
      method,
      headers,
      credentials: "include", // Always send HttpOnly cookies
    };

    if (data && method !== "GET") {
      config.body = data instanceof FormData ? data : JSON.stringify(data);
    }

    let response: Response = await fetch(url, config);

    // Automatic silent token refresh on 401
    if (response.status === 401) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        // Retry original request — cookies are updated by the refresh endpoint
        response = await fetch(url, config);
      }
    }

    if (!response.ok) {
      try {
        const error = await response.json();
        throw new Error(error.message || `HTTP Error: ${response.status}`);
      } catch (e) {
        const errorMsg =
          e instanceof Error ? e.message : `HTTP Error: ${response.status}`;
        throw new Error(errorMsg);
      }
    }

    if (response.status === 204) return {} as T;

    try {
      return await response.json();
    } catch (e) {
      console.error("Failed to parse response as JSON:", e);
      throw new Error("Invalid response format from server");
    }
  }

  /**
   * Calls /api/refresh to silently rotate tokens.
   * Returns true if successful.
   */
  private async tryRefreshToken(): Promise<boolean> {
    try {
      const refreshUrl = `${this.baseUrl}/auth/api/refresh`;
      const res = await fetch(refreshUrl, {
        method: "POST",
        credentials: "include",
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  get<T = any>(endpoint: string, options?: HttpOptions) {
    return this.request<T>("GET", endpoint, undefined, options);
  }

  post<T = any>(endpoint: string, data?: any, options?: HttpOptions) {
    return this.request<T>("POST", endpoint, data, options);
  }

  put<T = any>(endpoint: string, data?: any, options?: HttpOptions) {
    return this.request<T>("PUT", endpoint, data, options);
  }

  delete<T = any>(endpoint: string, data?: any, options?: HttpOptions) {
    return this.request<T>("DELETE", endpoint, data, options);
  }

  patch<T = any>(endpoint: string, data?: any, options?: HttpOptions) {
    return this.request<T>("PATCH", endpoint, data, options);
  }
}

// Export instance mặc định
const http = new HttpClient();
export default http;

// Export class để có thể tạo instance mới với baseUrl khác
export { HttpClient };