import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Divider,
  ButtonGroup,
  CircularProgress,
} from "@mui/material";
import {
  WarningAmber,
  CalendarToday,
  LocalAtm,
  CheckCircle,
  Cancel,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { AccessibleButton } from "../../utils/accessibilityHelpers";
import { useCurrency } from "../../contexts/CurrencyContext";

const AnomalyCard = ({ anomaly, onViewDetails, onFeedbackSubmitted }) => {
  const [normalFeedbackSubmitting, setNormalFeedbackSubmitting] =
    useState(false);
  const [abnormalFeedbackSubmitting, setAbnormalFeedbackSubmitting] =
    useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const { formatAmount } = useCurrency();
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

  // Map severity to colors and labels
  const getSeverityDisplay = (severityLevel) => {
    switch (severityLevel) {
      case "High":
        return { color: "error", label: "High" };
      case "Medium":
        return { color: "warning", label: "Medium" };
      case "Low":
        return { color: "info", label: "Low" };
      default:
        return { color: "warning", label: "Medium" };
    }
  };

  // Use backend-provided severity directly
  const severity = getSeverityDisplay(anomaly.severity || "Medium");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        sx={{
          mb: 2,
          borderRadius: 2,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          border: `1px solid ${
            severity.color === "error"
              ? "#ffcdd2"
              : severity.color === "warning"
              ? "#ffe0b2"
              : "#bbdefb"
          }`,
        }}
      >
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <WarningAmber color={severity.color} sx={{ mr: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                {anomaly.description || "Unusual Transaction"}
              </Typography>
            </Box>
            <Chip
              size="small"
              color={severity.color}
              label={`${severity.label} Anomaly`}
            />
          </Box>

          <Typography variant="body2" sx={{ mb: 2 }}>
            {anomaly.reason ||
              "This transaction deviates from your normal spending pattern."}
          </Typography>

          <Divider sx={{ my: 1.5 }} />

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <CalendarToday
                fontSize="small"
                sx={{ mr: 0.5, color: "text.secondary" }}
              />
              <Typography variant="body2" color="text.secondary">
                {formattedDate}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center" }}>
              <LocalAtm
                fontSize="small"
                sx={{ mr: 0.5, color: "text.secondary" }}
              />
              <Typography variant="body2" color="error.main" fontWeight="bold">
                {formatAmount(amount)}
              </Typography>
            </Box>

            <Chip
              size="small"
              label={displayCategory}
              sx={{ bgcolor: "#e8eaf6", color: "#3d5afe" }}
            />
          </Box>

          <Box
            sx={{
              mt: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {!feedbackSubmitted ? (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography variant="body2" sx={{ mr: 1 }}>
                  Normal spending?
                </Typography>
                <ButtonGroup size="small" variant="outlined">
                  <AccessibleButton
                    size="small"
                    color="success"
                    onClick={async () => {
                      if (normalFeedbackSubmitting) return;
                      setNormalFeedbackSubmitting(true);
                      try {
                        // Submit feedback that this is normal spending
                        // Use dynamic import to avoid circular dependency
                        const { anomalyService } = await import(
                          "../../services/anomalyService"
                        );
                        await anomalyService.submitFeedback({
                          transaction_id: anomaly.id || "",
                          is_normal: true,
                          anomaly_amount: amount,
                          category: anomaly.category || "unknown",
                          set_alert: false,
                          alert_threshold: null,
                        });
                        setFeedbackSubmitted(true);
                        if (onFeedbackSubmitted) onFeedbackSubmitted();
                      } catch (error) {
                        console.error("Error submitting feedback:", error);
                      } finally {
                        setNormalFeedbackSubmitting(false);
                      }
                    }}
                    id={`normal-spending-${anomaly.id}`}
                    label={`Mark ${
                      anomaly.description || "transaction"
                    } as normal spending`}
                    disabled={normalFeedbackSubmitting}
                    startIcon={
                      normalFeedbackSubmitting ? (
                        <CircularProgress size={16} />
                      ) : (
                        <CheckCircle />
                      )
                    }
                  >
                    Yes
                  </AccessibleButton>
                  <AccessibleButton
                    size="small"
                    color="primary"
                    onClick={() => onViewDetails(anomaly)}
                    id={`not-normal-${anomaly.id}`}
                    label={`Not normal spending, view details for ${
                      anomaly.description || "anomaly"
                    }`}
                    startIcon={<Cancel />}
                  >
                    No
                  </AccessibleButton>
                </ButtonGroup>
              </Box>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <CheckCircle color="success" fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2" color="success.main">
                  Thanks for your feedback!
                </Typography>
              </Box>
            )}

            <AccessibleButton
              size="small"
              variant="outlined"
              onClick={() => onViewDetails(anomaly)}
              id={`view-anomaly-${anomaly.id}`}
              label={`View details for ${anomaly.description || "anomaly"}`}
            >
              View Details
            </AccessibleButton>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AnomalyCard;
