import React, { useState } from "react";
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Divider,
  Chip,
  TextField,
  FormControlLabel,
  Switch,
  Stack,
  Alert,
  Snackbar,
  Button,
  AlertTitle,
} from "@mui/material";
import {
  Close,
  CalendarToday,
  LocalAtm,
  Category,
  Warning,
  CheckCircleOutline,
  NotificationsActive,
  TrendingDown,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import {
  AccessibleDialog,
  AccessibleButton,
  AccessibleIconButton,
  AccessibleSwitch,
} from "../../utils/accessibilityHelpers";
import { useCurrency } from "../../contexts/CurrencyContext";

const AnomalyDetailModal = ({
  open,
  anomaly,
  onClose,
  onFeedbackSubmitted,
}) => {
  if (!anomaly) return null;

  // States for user feedback
  const [isNormalSpending, setIsNormalSpending] = useState(false);
  const [setAlert, setSetAlert] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const { formatAmount, symbol } = useCurrency();
  const amount = parseFloat(anomaly.amount);

  // Handle both date formats - ISO string or Firestore timestamp
  const formattedDate = anomaly.date
    ? typeof anomaly.date === "string"
      ? new Date(anomaly.date).toLocaleDateString()
      : new Date(anomaly.date.seconds * 1000).toLocaleDateString()
    : "Unknown date";

  // Use categoryName if available, otherwise use category field
  const displayCategory =
    anomaly.categoryName ||
    (anomaly.category
      ? anomaly.category.charAt(0).toUpperCase() + anomaly.category.slice(1)
      : "Unknown Category");

  // Format anomaly score for display (0-100% unusual)
  const getAnomalyPercentage = (score) => {
    // Default value if score is not available
    if (score === undefined || score === null) return 70;

    // Convert score to a percentage (scores are typically -1 to 0 for anomalies)
    return Math.min(100, Math.round(Math.abs(score) * 100));
  };

  // When user toggles "normal spending" switch
  const handleNormalSpendingChange = (event) => {
    setIsNormalSpending(event.target.checked);
  };

  // When user toggles "set alert" switch
  const handleSetAlertChange = (event) => {
    setSetAlert(event.target.checked);
    // Default threshold to current amount rounded down to nearest 10
    if (event.target.checked && !alertThreshold) {
      const suggestedThreshold = Math.floor(amount / 10) * 10;
      setAlertThreshold(suggestedThreshold.toString());
    }
  };

  // Handle alert threshold input change
  const handleAlertThresholdChange = (event) => {
    // Only allow numeric input
    const value = event.target.value;
    if (value === "" || /^\d+(\.\d{0,2})?$/.test(value)) {
      setAlertThreshold(value);
    }
  };

  // Submit user feedback
  const handleSubmitFeedback = async () => {
    if (submitting) return;

    setSubmitting(true);
    try {
      const categoryId = anomaly.category || "unknown";

      // Use dynamic import to avoid circular dependency
      const { anomalyService } = await import("../../services/anomalyService");

      const feedback = {
        transaction_id: anomaly.id || "",
        is_normal: isNormalSpending,
        anomaly_amount: amount,
        category: categoryId,
        set_alert: setAlert,
        alert_threshold: setAlert ? parseFloat(alertThreshold) : null,
      };

      const response = await anomalyService.submitFeedback(feedback);

      if (response.success) {
        setFeedbackSubmitted(true);
        setNotification({
          open: true,
          message: "Thank you for your feedback!",
          severity: "success",
        });

        // Call the callback if provided
        if (onFeedbackSubmitted) {
          onFeedbackSubmitted();
        }
      } else {
        setNotification({
          open: true,
          message: "Failed to submit feedback. Please try again.",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setNotification({
        open: true,
        message: "An error occurred. Please try again.",
        severity: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Close notification
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <AccessibleDialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      id={`anomaly-detail-${anomaly.id}`}
      title="Anomaly Details"
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">Anomaly Details</Typography>
          <AccessibleIconButton
            onClick={onClose}
            size="small"
            id="close-anomaly-details"
            label="Close anomaly details"
          >
            <Close />
          </AccessibleIconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Notification */}
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
          >
            {notification.message}
          </Alert>
        </Snackbar>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 500, mb: 1 }}>
            {anomaly.description || "Unusual Transaction"}
          </Typography>
          {anomaly.isAlert ? (
            <Chip
              color="warning"
              icon={<NotificationsActive />}
              label="Alert Triggered"
              size="small"
            />
          ) : (
            <Chip
              color="error"
              icon={<Warning />}
              label="Unusual Transaction"
              size="small"
            />
          )}
        </Box>

        <Box
          sx={{
            p: 2,
            bgcolor: "#f5f5f5",
            borderRadius: 1,
            mb: 3,
          }}
        >
          <Typography variant="body1">
            {anomaly.reason ||
              "This transaction deviates significantly from your normal spending patterns."}
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 2,
            mb: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <LocalAtm sx={{ mr: 1, color: "error.main" }} />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Amount
              </Typography>
              <Typography variant="h6" color="error.main">
                {formatAmount(amount)}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center" }}>
            <CalendarToday sx={{ mr: 1, color: "primary.main" }} />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Date
              </Typography>
              <Typography variant="h6">{formattedDate}</Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Category sx={{ mr: 1, color: "primary.main" }} />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Category
              </Typography>
              <Typography variant="h6">{displayCategory}</Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center" }}>
            <TrendingDown sx={{ mr: 1, color: "warning.main" }} />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Anomaly Score
              </Typography>
              <Typography variant="h6">
                {getAnomalyPercentage(anomaly.anomalyScore)}% unusual
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* User Feedback Section */}
        {!feedbackSubmitted ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Box
              sx={{
                bgcolor: "#f0f7ff",
                p: 2.5,
                borderRadius: 2,
                mb: 3,
                border: "1px solid #e0e9f7",
              }}
            >
              <Typography
                variant="h6"
                sx={{ mb: 2.5, color: "#1976d2", fontWeight: 500 }}
              >
                Is this part of your usual spending pattern?
              </Typography>

              <Box sx={{ ml: 1 }}>
                <FormControlLabel
                  control={
                    <AccessibleSwitch
                      checked={isNormalSpending}
                      onChange={handleNormalSpendingChange}
                      color="primary"
                      id="normal-spending-switch"
                      label=""
                    />
                  }
                  label={
                    <Typography fontWeight="medium">
                      Yes, this is normal for me
                    </Typography>
                  }
                  sx={{ mb: 1 }}
                />
              </Box>

              {!isNormalSpending && (
                <Box
                  sx={{ mt: 2, ml: 1, borderTop: "1px solid #e0e9f7", pt: 2 }}
                >
                  <FormControlLabel
                    control={
                      <AccessibleSwitch
                        checked={setAlert}
                        onChange={handleSetAlertChange}
                        color="warning"
                        id="set-alert-switch"
                        label=""
                      />
                    }
                    label={
                      <Typography fontWeight="medium">
                        Set a spending alert for this category
                      </Typography>
                    }
                  />

                  {setAlert && (
                    <Box sx={{ mt: 1, ml: 4, mr: 2 }}>
                      <TextField
                        label="Alert threshold"
                        variant="outlined"
                        fullWidth
                        size="small"
                        value={alertThreshold}
                        onChange={handleAlertThresholdChange}
                        placeholder="Enter amount"
                        InputProps={{
                          startAdornment: symbol,
                        }}
                        id="alert-threshold-input"
                      />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 0.5, display: "block" }}
                      >
                        You'll be alerted when transactions in this category
                        exceed this amount
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Alert
              icon={<CheckCircleOutline />}
              severity="success"
              sx={{
                mb: 3,
                px: 2,
                py: 1.5,
                borderRadius: 2,
                "& .MuiAlert-icon": { alignItems: "center" },
              }}
            >
              <AlertTitle>
                <Typography fontWeight="medium">
                  Feedback submitted successfully
                </Typography>
              </AlertTitle>
              Thanks for helping us improve our anomaly detection!
            </Alert>
          </motion.div>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
        {!feedbackSubmitted && (
          <Button
            onClick={handleSubmitFeedback}
            variant="contained"
            color="primary"
            disabled={submitting || (!isNormalSpending && !setAlert)}
            id="submit-feedback-button"
            aria-label="Submit feedback"
          >
            Submit Feedback
          </Button>
        )}
        <AccessibleButton
          onClick={onClose}
          id="close-anomaly-button"
          label="Close anomaly details"
          variant={feedbackSubmitted ? "contained" : "outlined"}
        >
          {feedbackSubmitted ? "Done" : "Close"}
        </AccessibleButton>
      </DialogActions>
    </AccessibleDialog>
  );
};

export default AnomalyDetailModal;
