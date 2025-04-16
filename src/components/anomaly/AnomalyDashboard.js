import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  Divider,
  CircularProgress,
  MenuItem,
  Grid,
  Alert,
  Tooltip,
  Button,
  IconButton,
  Snackbar,
  Chip,
} from "@mui/material";
import {
  Search,
  WarningAmber,
  Refresh,
  NotificationsActive,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { anomalyService } from "../../services/anomalyService";
import AnomalyCard from "./AnomalyCard";
import AnomalyDetailModal from "./AnomalyDetailModal";
import AnomalyMetrics from "./AnomalyMetrics";
import { useFirebaseUser } from "../../context/ClerkFirebaseBridge";
import AccessibleTextField from "../../components/common/AccessibleTextField";
import { db } from "../../config/firebase";
import { collection, onSnapshot } from "firebase/firestore";

const AnomalyDashboard = ({ categories }) => {
  const {
    currentUser,
    loading: authLoading,
    refreshToken,
    error: authError,
  } = useFirebaseUser();
  const [loading, setLoading] = useState(true);
  const [anomalies, setAnomalies] = useState([]);
  const [filteredAnomalies, setFilteredAnomalies] = useState([]);
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [filterCategory, setFilterCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [newAnomalyCount, setNewAnomalyCount] = useState(0);

  // Use a ref to track if component is mounted
  const isMounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchAnomalies = useCallback(
    async (isManualRefresh = false) => {
      try {
        if (isManualRefresh) {
          setIsRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(""); // Clear any previous errors

        // Add a timeout to avoid hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
          const response = await anomalyService.getUserAnomalies();

          clearTimeout(timeoutId);

          // Important: Check if the response contains the expected data structure
          if (response && typeof response === "object") {
            // Make sure anomalies is an array even if it's null or undefined
            const anomaliesData = Array.isArray(response.anomalies)
              ? response.anomalies
              : [];

            console.log(
              "Received anomalies from API:",
              anomaliesData.length,
              anomaliesData
            );

            // Check if there are any new anomalies to notify the user
            const prevAnomalyIds = anomalies.map(
              (a) => a.id || `${a.amount}-${a.date}`
            );
            const newAnomalies = anomaliesData.filter(
              (a) => !prevAnomalyIds.includes(a.id || `${a.amount}-${a.date}`)
            );

            // Set anomalies state
            setAnomalies(anomaliesData);
            setFilteredAnomalies(anomaliesData);
            setRetryCount(0); // Reset retry count on success

            // Show notification for newly detected anomalies
            if (newAnomalies.length > 0 && !isManualRefresh) {
              setNewAnomalyCount(newAnomalies.length);
              setNotification({
                open: true,
                message: `${newAnomalies.length} unusual transaction${
                  newAnomalies.length === 1 ? "" : "s"
                } detected!`,
                severity: "warning",
              });
            }
          } else {
            setError("Received invalid data format from server");
          }
        } catch (error) {
          clearTimeout(timeoutId);

          // Check if error is due to authentication
          if (
            error.message &&
            (error.message.includes("401") ||
              error.message.includes("authentication") ||
              error.message.includes("token"))
          ) {
            // Try to refresh the token and retry once
            if (refreshToken && retryCount < 2) {
              try {
                await refreshToken(true); // Force refresh the token
                setRetryCount((prev) => prev + 1);
                // Wait a moment before retrying
                setTimeout(() => fetchAnomalies(), 1000);
                return; // Exit early to avoid setting error state
              } catch (refreshError) {
                setError(
                  "Authentication error. Please try logging out and back in."
                );
              }
            } else {
              setError(
                "Authentication error. Please try logging out and back in."
              );
            }
          } else if (error.name === "AbortError") {
            setError(
              "Request timed out. Please check your connection and try again."
            );
          } else {
            setError("Failed to load anomaly data. Please try again later.");
          }
        }
      } catch (error) {
        setError("An unexpected error occurred. Please try again.");
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [refreshToken, retryCount]
  );

  // Initial data fetch with safety timeout
  useEffect(() => {
    const timeout = setTimeout(() => {
      // Add a timeout to ensure we're not stuck in loading
      setLoading(false);
    }, 5000);

    // Fetch anomalies immediately on component mount
    fetchAnomalies();

    return () => clearTimeout(timeout);
  }, [fetchAnomalies]);

  // Set auth error if present
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  // Set up Firebase listener for transactions to auto-refresh anomalies
  useEffect(() => {
    // Only try to set up the listener if we have a user ID
    const userId = currentUser?.uid;
    if (!userId) {
      return;
    }

    // Create a query for the user's transactions
    const transactionsRef = collection(db, "users", userId, "transactions");

    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(
      transactionsRef,
      (snapshot) => {
        // Only trigger refresh if there are actual changes (added/modified/removed)
        if (snapshot.docChanges().length > 0) {
          // Force an immediate update with a small delay to ensure the transaction is fully saved
          setTimeout(() => {
            fetchAnomalies(true); // true indicates this is an auto-refresh
          }, 500);
        }
      },
      (error) => {
        console.error("Error in transaction listener:", error);
      }
    );

    // Clean up the listener when component unmounts
    return () => unsubscribe();
  }, [currentUser, fetchAnomalies]);

  // Handle manual refresh
  const handleRefresh = () => {
    fetchAnomalies(true);
  };

  // Filter anomalies when filter criteria change
  useEffect(() => {
    if (!anomalies.length) return;

    let filtered = [...anomalies];

    // Apply category filter
    if (filterCategory) {
      filtered = filtered.filter(
        (anomaly) =>
          // Fix: Use both category and categoryId for filtering to handle different formats
          anomaly.category === filterCategory ||
          anomaly.categoryId === filterCategory
      );
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (anomaly) =>
          (anomaly.description &&
            anomaly.description.toLowerCase().includes(query)) ||
          (anomaly.categoryName &&
            anomaly.categoryName.toLowerCase().includes(query))
      );
    }

    console.log(
      "Filtered anomalies:",
      filtered.length,
      "from total:",
      anomalies.length
    );

    // Sort anomalies by severity (High > Medium > Low) and then by amount (highest first)
    const severityOrder = { High: 0, Medium: 1, Low: 2 };
    const sortedAnomalies = [...filtered].sort((a, b) => {
      // First by severity
      const severityA = severityOrder[a.severity || "Medium"];
      const severityB = severityOrder[b.severity || "Medium"];
      if (severityA !== severityB) return severityA - severityB;

      // Then by amount (descending)
      const amountA = parseFloat(a.amount || 0);
      const amountB = parseFloat(b.amount || 0);
      return amountB - amountA;
    });

    setFilteredAnomalies(sortedAnomalies);
  }, [anomalies, filterCategory, searchQuery]);

  // Clear all filters
  const clearFilters = () => {
    setFilterCategory("");
    setSearchQuery("");
  };

  // Handle view details
  const handleViewDetails = (anomaly) => {
    setSelectedAnomaly(anomaly);
  };

  // Handle close details modal
  const handleCloseDetails = () => {
    setSelectedAnomaly(null);
  };

  // Handle feedback submitted from the anomaly detail modal
  const handleFeedbackSubmitted = () => {
    // Refresh anomalies after feedback
    fetchAnomalies();
    setNotification({
      open: true,
      message:
        "Thank you for your feedback! We'll use it to improve your experience.",
      severity: "success",
    });
  };

  // Handle closing notification
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // Show auth error if present
  if (error && error.includes("authentication")) {
    return (
      <Box sx={{ p: 3, bgcolor: "#ffebee", borderRadius: 2, mb: 3 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          Authentication error. Please try logging out and back in.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Paper
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          background: "linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)",
        }}
      >
        <Typography variant="body1" sx={{ mb: 2 }}>
          Our machine learning algorithm analyzes your spending patterns to
          identify unusual transactions that deviate from your normal habits.
          This helps you spot potential issues or opportunities to optimize your
          finances.
        </Typography>
      </Paper>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleRefresh}
              id="retry-anomalies-button"
              aria-label="Retry loading anomalies"
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                Detected Anomalies
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                {!loading && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mr: 2 }}
                  >
                    {filteredAnomalies.length}{" "}
                    {filteredAnomalies.length === 1 ? "anomaly" : "anomalies"}{" "}
                    found
                  </Typography>
                )}
                <Tooltip title="Refresh data">
                  <span>
                    {" "}
                    {/* Wrapper to fix the Tooltip disabled button issue */}
                    <IconButton
                      size="small"
                      onClick={handleRefresh}
                      disabled={loading || isRefreshing}
                      id="refresh-anomalies-button"
                      aria-label="Refresh anomalies"
                    >
                      <Refresh
                        sx={{
                          animation: isRefreshing
                            ? "spin 1s linear infinite"
                            : "none",
                          "@keyframes spin": {
                            "0%": { transform: "rotate(0deg)" },
                            "100%": { transform: "rotate(360deg)" },
                          },
                        }}
                      />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
              <AccessibleTextField
                id="anomaly-search"
                name="anomaly-search"
                label="Search"
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ flexGrow: 1 }}
                InputProps={{
                  startAdornment: <Search color="action" sx={{ mr: 1 }} />,
                }}
              />

              <AccessibleTextField
                id="anomaly-category-filter"
                name="anomaly-category-filter"
                label="Category"
                select
                size="small"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </AccessibleTextField>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : filteredAnomalies.length > 0 ? (
              <Box>
                {filteredAnomalies.map((anomaly, index) => (
                  <AnomalyCard
                    key={
                      anomaly.id ||
                      `anomaly-${index}-${anomaly.amount}-${anomaly.date}`
                    }
                    anomaly={anomaly}
                    onViewDetails={handleViewDetails}
                    onFeedbackSubmitted={handleFeedbackSubmitted}
                  />
                ))}
              </Box>
            ) : (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No anomalies found with the current filters
                </Typography>
                {filterCategory || searchQuery ? (
                  <Button
                    variant="text"
                    onClick={clearFilters}
                    id="clear-filters-button"
                    aria-label="Clear filters"
                  >
                    Clear Filters
                  </Button>
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    This means your spending patterns are consistent
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <AnomalyMetrics anomalies={anomalies} />
        </Grid>
      </Grid>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: "100%" }}
          action={
            notification.severity === "warning" && (
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  handleCloseNotification();
                  // Scroll to first anomaly or focus on anomalies section
                  document.getElementById("anomalies-header")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
              >
                View
              </Button>
            )
          }
        >
          {notification.message}
        </Alert>
      </Snackbar>

      {selectedAnomaly && (
        <AnomalyDetailModal
          anomaly={selectedAnomaly}
          open={!!selectedAnomaly}
          onClose={handleCloseDetails}
          onFeedbackSubmitted={handleFeedbackSubmitted}
        />
      )}
    </Box>
  );
};

export default AnomalyDashboard;
