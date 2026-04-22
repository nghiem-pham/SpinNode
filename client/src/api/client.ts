import { clearToken, getStoredToken } from "./auth";
import { buildApiUrl } from "../config";

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = "Request failed";

    try {
      const text = await res.text();
      if (text) {
        try {
          const data = JSON.parse(text);
          message = data.error || data.message || message;
        } catch {
          message = text;
        }
      }
    } catch {
      // body unreadable
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

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const headers = new Headers();
  const token = getStoredToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(buildApiUrl(path), { method: "POST", headers, body: formData });
  return parseResponse<T>(res);
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

  const res = await fetch(buildApiUrl(path), {
    ...init,
    headers,
  });

  return parseResponse<T>(res);
}
