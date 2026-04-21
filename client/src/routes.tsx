import { createBrowserRouter, Navigate, Outlet, useLocation, redirect } from "react-router";
import { Landing } from "./pages/Landing";
import { Onboarding } from "./pages/Onboarding";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { Applications } from "./pages/Applications";
import { Jobs } from "./pages/Jobs";
import { Profile } from "./pages/Profile";
import { Challenges } from "./pages/Challenges";
import { Forums } from "./pages/Forums";
import { ThreadDetail } from "./pages/ThreadDetail";
import { PublicProfile } from "./pages/PublicProfile";
import { OAuth2Success } from "./pages/OAuth2Success";
import { RecruiterJobs } from "./pages/RecruiterJobs";
import { TalentPool } from "./pages/TalentPool";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { MessageWidget } from "./components/MessageWidget";
import { MessageWidgetProvider } from "./contexts/MessageWidgetContext";
import { ConversationsProvider } from "./contexts/ConversationsContext";
import { SearchProvider } from "./contexts/SearchContext";
import { LoadingState } from "./components/ui/loading-state";
import { ThemeProvider } from "./contexts/ThemeContext";

function ProtectedRoute({ children, skipOnboardingCheck = false }: { children: React.ReactNode; skipOnboardingCheck?: boolean }) {
  const { isAuthenticated, loading, onboardingComplete } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingState fullscreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to onboarding if not yet completed (skip check on the onboarding page itself)
  if (!skipOnboardingCheck && !onboardingComplete && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <>
      {children}
      <MessageWidget />
    </>
  );
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <LoadingState fullscreen />;
  }

  if (isAuthenticated) {
    return <Navigate to={user?.role === 'RECRUITER' ? '/recruiter/jobs' : '/jobs'} replace />;
  }

  return <>{children}</>;
}

function Root() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SearchProvider>
          <ConversationsProvider>
            <MessageWidgetProvider>
              <Outlet />
            </MessageWidgetProvider>
          </ConversationsProvider>
        </SearchProvider>
      </AuthProvider>
    </ThemeProvider>
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
          <PublicRoute>
            <Landing />
          </PublicRoute>
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
        path: "onboarding",
        element: (
          <ProtectedRoute skipOnboardingCheck>
            <Onboarding />
          </ProtectedRoute>
        ),
      },
      {
        path: "applications",
        element: (
          <ProtectedRoute>
            <Applications />
          </ProtectedRoute>
        ),
      },
      {
        path: "messages",
        loader: () => redirect("/applications"),
        element: null,
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
      {
        path: "forums/threads/:threadId",
        element: (
          <ProtectedRoute>
            <ThreadDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: "people",
        loader: () => redirect("/forums"),
        element: null,
      },
      {
        path: "recruiter/jobs",
        element: (
          <ProtectedRoute>
            <RecruiterJobs />
          </ProtectedRoute>
        ),
      },
      {
        path: "recruiter/talent",
        element: (
          <ProtectedRoute>
            <TalentPool />
          </ProtectedRoute>
        ),
      },
      {
        path: "profile/:userId",
        element: (
          <ProtectedRoute>
            <PublicProfile />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
