import React, { useEffect, Suspense, lazy } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { AnimatePresence } from "framer-motion";
import { Box, CircularProgress, Typography } from "@mui/material";
import Navbar from "./components/navbar";
import Home from "./pages/home";
import ClerkPrivateRoute from "./components/ClerkPrivateRoute";
import PageTransition from "./components/PageTransition";
import { fixLabelIdRelationships } from "./utils/labelFix";
import { CurrencyProvider } from "./contexts/CurrencyContext";
// Lazy load component to improve initial load time
const Dashboard = lazy(() => import("./pages/dashboard"));
const ExpensePage = lazy(() => import("./pages/expensePage"));
const AnomalyPage = lazy(() => import("./pages/anomalyPage"));

// Loading fallback
const LoadingFallback = () => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "80vh",
    }}
  >
    <CircularProgress size={40} />
    <Typography variant="body1" sx={{ mt: 2 }}>
      Loading...
    </Typography>
  </Box>
);

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, textAlign: "center", mt: 8 }}>
          <Typography variant="h5" color="error" gutterBottom>
            Something went wrong
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {this.state.error?.message || "An unexpected error occurred."}
          </Typography>
          <Typography variant="body2">
            Try refreshing the page or going back to the dashboard.
          </Typography>
        </Box>
      );
    }

    return this.props.children;
  }
}

function App() {
  const location = useLocation();
  const { isSignedIn, isLoaded } = useAuth();

  // Apply the accessibility fixes
  useEffect(() => {
    // Apply accessibility fix
    const cleanup = fixLabelIdRelationships();

    return () => {
      cleanup();
    };
  }, []);

  // Show navbar ONLY on the home page
  const showNavbar = location.pathname === "/";

  // Function to handle homepage access based on auth state
  const renderHomePage = () => {
    // If auth state is still loading, show loading or home page
    if (!isLoaded) {
      return <Home />;
    }

    // If user is signed in and tries to access home page, allow it
    // This lets them use the back button from dashboard to return to home
    return <Home />;
  };

  return (
    <ErrorBoundary>
      <CurrencyProvider>
        {showNavbar && <Navbar />}

        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={<PageTransition>{renderHomePage()}</PageTransition>}
            />

            {/* Dashboard and protected routes */}
            <Route
              path="/dashboard"
              element={
                <ClerkPrivateRoute>
                  <PageTransition>
                    <Suspense fallback={<LoadingFallback />}>
                      <Dashboard activeView="overview" />
                    </Suspense>
                  </PageTransition>
                </ClerkPrivateRoute>
              }
            />

            <Route
              path="/expenses"
              element={
                <ClerkPrivateRoute>
                  <PageTransition>
                    <Suspense fallback={<LoadingFallback />}>
                      <ExpensePage />
                    </Suspense>
                  </PageTransition>
                </ClerkPrivateRoute>
              }
            />

            <Route
              path="/anomalies"
              element={
                <ClerkPrivateRoute>
                  <PageTransition>
                    <Suspense fallback={<LoadingFallback />}>
                      <AnomalyPage />
                    </Suspense>
                  </PageTransition>
                </ClerkPrivateRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ClerkPrivateRoute>
                  <PageTransition>
                    <Suspense fallback={<LoadingFallback />}>
                      <Dashboard activeView="settings" />
                    </Suspense>
                  </PageTransition>
                </ClerkPrivateRoute>
              }
            />

            <Route
              path="/credit-score"
              element={
                <ClerkPrivateRoute>
                  <PageTransition>
                    <Suspense fallback={<LoadingFallback />}>
                      <Dashboard activeView="creditscore" />
                    </Suspense>
                  </PageTransition>
                </ClerkPrivateRoute>
              }
            />

            {/* Redirect any unmatched routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </CurrencyProvider>
    </ErrorBoundary>
  );
}

export default App;
