import { apiRequest } from "./client";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  displayName: string;
  password: string;
  role: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  role: UserRole;
}

export type UserRole = "JOB_SEEKER" | "RECRUITER";

export interface UserResponse {
  id: number;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

const TOKEN_KEY = "access_token";

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export async function loginApi(data: LoginRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function registerApi(data: RegisterRequest): Promise<void> {
  await apiRequest<void>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Fetch current user info using the stored JWT */
export async function fetchMe(token: string): Promise<UserResponse> {
  return apiRequest<UserResponse>("/api/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function redirectToGoogleOAuth(): void {
  // Redirect to Spring Boot's OAuth2 authorization endpoint
  // In dev, Vite proxy forwards this to localhost:8080
  // In production, use the full backend URL
  window.location.href = "http://localhost:8080/oauth2/authorization/google";
}
