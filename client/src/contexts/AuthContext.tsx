import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  loginApi,
  registerApi,
  redirectToGoogleOAuth,
  fetchMe,
  type UserRole,
  storeToken,
  getStoredToken,
  clearToken,
} from '../api/auth';
import { fetchProfile, fetchPreferences } from '../api/app';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  onboardingComplete: boolean;
  setOnboardingComplete: (value: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  /** Given a valid JWT, fetch user profile + preferences and set state */
  const loadUser = useCallback(async (token: string) => {
    const [me, profile, prefs] = await Promise.all([
      fetchMe(token),
      fetchProfile().catch(() => null),
      fetchPreferences().catch(() => null),
    ]);

    setUser({
      id: String(me.id),
      name: me.displayName,
      email: me.email,
      role: me.role,
      avatar: profile?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(me.email)}&background=0e8f8f&color=fff&bold=true&rounded=true&size=128`,
    });
    setOnboardingComplete(prefs?.onboardingComplete ?? false);
  }, []);

  // On mount, restore session from stored JWT
  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      loadUser(token)
        .catch(() => clearToken())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    const response = await loginApi({ email, password });
    storeToken(response.accessToken);
    await loadUser(response.accessToken);
  };

  const signup = async (name: string, email: string, password: string, role: UserRole) => {
    // Register the user, then auto-login
    await registerApi({ email, displayName: name, password, role });
    const response = await loginApi({ email, password });
    storeToken(response.accessToken);
    await loadUser(response.accessToken);
  };

  const loginWithGoogle = async () => {
    // Redirect to Spring Boot's OAuth2 authorization endpoint
    redirectToGoogleOAuth();
  };

  /** Called from the OAuth2 callback page after receiving the token */
  const loginWithToken = useCallback(async (token: string) => {
    storeToken(token);
    await loadUser(token);
  }, [loadUser]);

  const logout = () => {
    clearToken();
    setUser(null);
    setOnboardingComplete(false);
  };

  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    await loadUser(token);
  }, [loadUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        onboardingComplete,
        setOnboardingComplete,
        login,
        signup,
        loginWithGoogle,
        loginWithToken,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
