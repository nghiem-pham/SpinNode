import { clearToken, getStoredToken } from "./auth";

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = "Request failed";

    try {
      const data = await res.json();
      message = data.error || data.message || message;
    } catch {
      const text = await res.text();
      if (text) {
        message = text;
      }
    }

    if (res.status === 401) {
      clearToken();
    }

    throw new Error(message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getStoredToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(path, {
    ...init,
    headers,
  });

  return parseResponse<T>(res);
}
