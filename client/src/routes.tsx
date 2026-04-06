import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Messages } from "./pages/Messages";
import { Notifications } from "./pages/Notifications";
import { Jobs } from "./pages/Jobs";
import { Profile } from "./pages/Profile";
import { Challenges } from "./pages/Challenges";
import { Forums } from "./pages/Forums";
import { OAuth2Success } from "./pages/OAuth2Success";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { MessageWidget } from "./components/MessageWidget";
import { MessageWidgetProvider } from "./contexts/MessageWidgetContext";
import { ConversationsProvider } from "./contexts/ConversationsContext";
import { SearchProvider } from "./contexts/SearchContext";
import { LoadingState } from "./components/ui/loading-state";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingState fullscreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      {children}
      <MessageWidget />
    </>
  );
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingState fullscreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function Root() {
  return (
    <AuthProvider>
      <SearchProvider>
        <ConversationsProvider>
          <MessageWidgetProvider>
            <Outlet />
          </MessageWidgetProvider>
        </ConversationsProvider>
      </SearchProvider>
    </AuthProvider>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <Jobs />
          </ProtectedRoute>
        ),
      },
      {
        path: "login",
        element: (
          <PublicRoute>
            <Login />
          </PublicRoute>
        ),
      },
      {
        path: "signup",
        element: (
          <PublicRoute>
            <Signup />
          </PublicRoute>
        ),
      },
      {
        path: "auth/callback",
        element: <OAuth2Success />,
      },
      {
        path: "messages",
        element: (
          <ProtectedRoute>
            <Messages />
          </ProtectedRoute>
        ),
      },
      {
        path: "notifications",
        element: (
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        ),
      },
      {
        path: "jobs",
        element: (
          <ProtectedRoute>
            <Jobs />
          </ProtectedRoute>
        ),
      },
      {
        path: "challenges",
        element: (
          <ProtectedRoute>
            <Challenges />
          </ProtectedRoute>
        ),
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: "forums",
        element: (
          <ProtectedRoute>
            <Forums />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
