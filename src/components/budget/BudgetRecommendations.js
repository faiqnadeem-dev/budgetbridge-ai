import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Paper,
  Typography,
  CircularProgress,
  Button,
  Divider,
  Alert,
  TextField,
  Grid,
  Chip,
  IconButton,
  Avatar,
  Skeleton,
  Tooltip,
} from "@mui/material";
import {
  PsychologyAlt,
  AutoGraph,
  Lightbulb,
  Refresh,
  TipsAndUpdates,
  Analytics,
  RequestQuote,
  Savings,
  ArrowForward,
  InfoOutlined,
  Sync,
  Download,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { openaiService } from "../../services/openaiService";
import { useFirebaseUser } from "../../context/ClerkFirebaseBridge";
import { useUser } from "@clerk/clerk-react";
import { db } from "../../config/firebase";
import {
  collection,
  getDocs,
  query,
  limit,
  orderBy,
  doc,
  getDoc,
} from "firebase/firestore";
import AccessibleTextField from "../common/AccessibleTextField";
import { useCurrency } from "../../contexts/CurrencyContext";

const BudgetRecommendations = () => {
  const [recommendations, setRecommendations] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [userPreferences, setUserPreferences] = useState("");
  const [apiKeySet, setApiKeySet] = useState(
    !!process.env.REACT_APP_OPENAI_API_KEY
  );
  const [lastUpdated, setLastUpdated] = useState(null);

  const { currentUser, loading: authLoading } = useFirebaseUser();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();

  // Get currency info from context
  const { formatAmount, symbol, currencyCode } = useCurrency();

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      // Get user ID either from Firebase bridge or directly from Clerk
      let userId = currentUser?.uid;

      // If Firebase bridge is stuck loading but Clerk is loaded, use Clerk ID directly
      if (!userId && clerkLoaded && clerkUser?.id) {
        userId = clerkUser.id;
        console.log("Using Clerk user ID directly:", userId);
      }

      if (!userId) {
        console.log("No user ID available from either source");
        return;
      }

      console.log("Fetching data for user:", userId);

      try {
        // Fetch user information
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log("User data retrieved:", userData);
          setMonthlyIncome(userData.monthlyIncome || "");
          setCategories(userData.categories || []);
        } else {
          console.log("User document does not exist");
        }

        // Fetch transactions
        const transactionsRef = collection(db, "users", userId, "transactions");
        const q = query(transactionsRef, orderBy("date", "desc"), limit(50));
        const querySnapshot = await getDocs(q);
        const transactionsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log(`Retrieved ${transactionsData.length} transactions`);
        setTransactions(transactionsData);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError(
          "Failed to fetch your financial data. Please try again later."
        );
      }
    };

    fetchUserData();
  }, [currentUser, authLoading, clerkUser, clerkLoaded]);

  const handleGenerateRecommendations = async () => {
    if (!apiKeySet) {
      setError(
        "OpenAI API key is not set. Please set it in your environment variables."
      );
      return;
    }

    // Get user ID either from Firebase bridge or directly from Clerk
    let userId = currentUser?.uid;

    // If Firebase bridge is stuck loading but Clerk is loaded, use Clerk ID directly
    if (!userId && clerkLoaded && clerkUser?.id) {
      userId = clerkUser.id;
      console.log("Using Clerk user ID directly for recommendations:", userId);
    }

    if (!userId) {
      console.log("No authenticated user found from any source");
      setError("You need to be logged in to generate recommendations.");
      return;
    }

    // Check if we have transaction data
    if (transactions.length === 0) {
      console.log("No transactions available. Attempting to refresh data...");
      // Try to refresh data if no transactions are available
      try {
        const transactionsRef = collection(db, "users", userId, "transactions");
        const q = query(transactionsRef, orderBy("date", "desc"), limit(50));
        const querySnapshot = await getDocs(q);
        const transactionsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log(`Refreshed data: ${transactionsData.length} transactions`);
        setTransactions(transactionsData);

        // Also refresh categories
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log("Refreshed user data:", userData);
          setCategories(userData.categories || []);
        }
      } catch (err) {
        console.error("Failed to refresh data:", err);
        setError("Failed to load your financial data. Please try again later.");
        return;
      }
    }

    setIsLoading(true);
    setError("");

    try {
      console.log(
        `Sending data to OpenAI: ${transactions.length} transactions, ${categories.length} categories`
      );
      const userData = {
        transactions,
        categories,
        monthlyIncome,
        userPreferences,
        currency: {
          code: currencyCode,
          symbol: symbol,
        },
      };

      const result = await openaiService.getBudgetRecommendations(userData);

      if (result.status === "success") {
        setRecommendations(result.recommendations);
        setLastUpdated(new Date());
      } else {
        setError(result.error || "Failed to generate recommendations");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("An error occurred while generating recommendations");
    } finally {
      setIsLoading(false);
    }
  };

  // Format recommendations with a little parsing to make them more readable
  const formatRecommendations = (text) => {
    if (!text) return null;

    // Add emojis to make recommendations more visually appealing
    const enhancedText = addEmojisToText(text);

    // Split by line breaks
    const lines = enhancedText.split("\n");

    return lines.map((line, index) => {
      // Check if line is a header
      if (line.match(/^#+\s/) || line.match(/^[0-9]+\./)) {
        const content = line.replace(/^#+\s/, "").replace(/^[0-9]+\.\s/, "");
        return (
          <Typography
            key={index}
            variant="h6"
            sx={{ mt: 2, mb: 1, color: "#1a237e", fontWeight: 600 }}
          >
            {content}
          </Typography>
        );
      }

      // Check if line is a bullet point
      if (line.match(/^\s*[-*]\s/)) {
        // Extract the content after the bullet point
        const content = line.replace(/^\s*[-*]\s/, "");

        // Process bold text within bullet points
        const processedContent = content.split(/\*\*(.*?)\*\*/).map((part, i) =>
          i % 2 === 0 ? (
            part
          ) : (
            <strong key={i} style={{ color: "#283593" }}>
              {part}
            </strong>
          )
        );

        return (
          <Box key={index} sx={{ display: "flex", ml: 2, mb: 1 }}>
            <Typography variant="body1" sx={{ mr: 1 }}>
              •
            </Typography>
            <Typography variant="body1">{processedContent}</Typography>
          </Box>
        );
      }

      // Check if line is empty
      if (!line.trim()) {
        return <Box key={index} sx={{ height: 8 }} />;
      }

      // Regular paragraph - handle bold text with **
      return (
        <Typography key={index} variant="body1" paragraph>
          {line.split(/\*\*(.*?)\*\*/).map((part, i) =>
            i % 2 === 0 ? (
              part
            ) : (
              <strong key={i} style={{ color: "#283593" }}>
                {part}
              </strong>
            )
          )}
        </Typography>
      );
    });
  };

  // Helper function to add emojis based on content
  const addEmojisToText = (text) => {
    // Add emojis to headings and categories based on content
    return text
      .replace(/# Budget Recommendations/gi, "# 💰 Budget Recommendations")
      .replace(
        /# Recommended Monthly Budget/gi,
        "# 📊 Recommended Monthly Budget"
      )
      .replace(
        /# Specific Saving Suggestions/gi,
        "# 💡 Specific Saving Suggestions"
      )
      .replace(/# Areas Where/gi, "# ✂️ Areas Where")
      .replace(/# Other Financial Insights/gi, "# 🔍 Other Financial Insights")
      .replace(/Food & Dining/gi, "🍔 Food & Dining")
      .replace(/Transportation/gi, "🚗 Transportation")
      .replace(/Bills & Utilities/gi, "📱 Bills & Utilities")
      .replace(/Entertainment/gi, "🎬 Entertainment")
      .replace(/Shopping/gi, "🛍️ Shopping")
      .replace(/Other/gi, "📦 Other")
      .replace(/Dining Out/gi, "🍽️ Dining Out")
      .replace(/Review Entertainment/gi, "🎭 Review Entertainment")
      .replace(/Set Shopping Budgets/gi, "💳 Set Shopping Budgets");
  };

  // Add a function to handle downloading recommendations
  const handleDownloadRecommendations = () => {
    if (!recommendations) return;

    // Create a clean text version of the recommendations
    let textContent = "AI BUDGET RECOMMENDATIONS\n";
    textContent += "=========================\n\n";
    textContent += "Generated on: " + new Date().toLocaleString() + "\n\n";

    // Strip any HTML/formatting and just use plain text
    const plainText = recommendations.replace(/\*\*/g, "");
    textContent += plainText;

    // Create a blob and download link
    const blob = new Blob([textContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `budget-recommendations-${
      new Date().toISOString().split("T")[0]
    }.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          mb: 4,
        }}
      >
        <Box
          sx={{
            background: "linear-gradient(135deg, #3F51B5 0%, #5C6BC0 100%)",
            py: 4,
            px: 3,
            color: "white",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "40%",
              height: "100%",
              opacity: 0.1,
              transform: "translateX(30%)",
              display: { xs: "none", md: "block" },
            }}
          >
            <PsychologyAlt sx={{ fontSize: 250 }} />
          </Box>

          <Typography variant="h4" fontWeight="bold" gutterBottom>
            AI Budget Recommendations
          </Typography>

          <Typography variant="body1" sx={{ mb: 3, maxWidth: "80%" }}>
            Get personalized budget insights based on your spending patterns and
            financial goals
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexWrap: { xs: "wrap", sm: "nowrap" },
            }}
          >
            <Button
              variant="contained"
              onClick={handleGenerateRecommendations}
              disabled={isLoading}
              startIcon={
                isLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <Analytics />
                )
              }
              sx={{
                bgcolor: "white",
                color: "#3F51B5",
                fontWeight: "bold",
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.9)",
                },
                px: 3,
                py: 1,
                borderRadius: 2,
              }}
            >
              {isLoading ? "Analyzing Data..." : "Generate Recommendations"}
            </Button>

            <Tooltip title="This uses AI to analyze your spending habits and provide personalized budget recommendations">
              <IconButton sx={{ color: "white" }}>
                <InfoOutlined />
              </IconButton>
            </Tooltip>

            {lastUpdated && (
              <Typography
                variant="caption"
                sx={{
                  color: "rgba(255,255,255,0.8)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Sync fontSize="small" sx={{ mr: 0.5 }} />
                Last updated: {lastUpdated.toLocaleString()}
              </Typography>
            )}
          </Box>
        </Box>

        <CardContent sx={{ p: 0 }}>
          {error && (
            <Alert severity="error" sx={{ m: 3 }}>
              {error}
            </Alert>
          )}

          {!recommendations && !isLoading && !error && (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <img
                src="https://img.icons8.com/color/96/000000/light-on--v1.png"
                alt="Budget Ideas"
                style={{ opacity: 0.7, width: 80, height: 80 }}
              />
              <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
                Need budget ideas?
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1, mb: 3 }}
              >
                Generate personalized recommendations based on your spending
                habits and financial goals
              </Typography>
              <Grid
                container
                spacing={3}
                justifyContent="center"
                sx={{ mt: 2 }}
              >
                <Grid item xs={12} sm={4}>
                  <Card
                    sx={{
                      height: "100%",
                      borderRadius: 2,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 1 }}
                      >
                        <Avatar
                          sx={{ bgcolor: "#E3F2FD", color: "#1976D2", mr: 1 }}
                        >
                          <RequestQuote fontSize="small" />
                        </Avatar>
                        <Typography variant="subtitle1" fontWeight="medium">
                          Budget Allocation
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Optimal distribution of your income across different
                        spending categories
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card
                    sx={{
                      height: "100%",
                      borderRadius: 2,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 1 }}
                      >
                        <Avatar
                          sx={{ bgcolor: "#E8F5E9", color: "#388E3C", mr: 1 }}
                        >
                          <Savings fontSize="small" />
                        </Avatar>
                        <Typography variant="subtitle1" fontWeight="medium">
                          Saving Tips
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Personalized ways to reduce expenses and increase your
                        savings
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card
                    sx={{
                      height: "100%",
                      borderRadius: 2,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 1 }}
                      >
                        <Avatar
                          sx={{ bgcolor: "#FFF8E1", color: "#FFA000", mr: 1 }}
                        >
                          <TipsAndUpdates fontSize="small" />
                        </Avatar>
                        <Typography variant="subtitle1" fontWeight="medium">
                          Financial Insights
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Intelligent observations about your spending patterns
                        and habits
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {isLoading && (
            <Box sx={{ p: 4 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <CircularProgress size={20} sx={{ mr: 2 }} />
                <Typography>
                  Analyzing your financial data and generating
                  recommendations...
                </Typography>
              </Box>

              <Skeleton variant="text" height={40} sx={{ mb: 2 }} />
              <Skeleton variant="text" height={20} sx={{ mb: 1 }} />
              <Skeleton variant="text" height={20} sx={{ mb: 1 }} />
              <Skeleton variant="text" height={20} sx={{ mb: 3 }} />

              <Skeleton variant="text" height={35} sx={{ mb: 2 }} />
              <Skeleton variant="text" height={20} sx={{ mb: 1 }} width="90%" />
              <Skeleton variant="text" height={20} sx={{ mb: 1 }} width="95%" />
              <Skeleton variant="text" height={20} sx={{ mb: 3 }} width="85%" />

              <Skeleton variant="text" height={35} sx={{ mb: 2 }} />
              <Skeleton
                variant="rectangular"
                height={100}
                sx={{ mb: 3, borderRadius: 1 }}
              />

              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Typography variant="caption" color="text.secondary">
                  This may take up to 30 seconds to complete
                </Typography>
              </Box>
            </Box>
          )}

          {recommendations && !isLoading && (
            <Box sx={{ p: 4 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <Chip
                  icon={<Lightbulb />}
                  label="AI Generated"
                  color="primary"
                  variant="outlined"
                  size="small"
                  sx={{ mr: 2 }}
                />
                {lastUpdated && (
                  <Typography variant="caption" color="text.secondary">
                    Generated on {lastUpdated.toLocaleDateString()} at{" "}
                    {lastUpdated.toLocaleTimeString()}
                  </Typography>
                )}
                <Box sx={{ flexGrow: 1 }} />
                <Button
                  size="small"
                  startIcon={<Download />}
                  onClick={handleDownloadRecommendations}
                  sx={{ mr: 1 }}
                >
                  Download
                </Button>
                <Button
                  size="small"
                  startIcon={<Refresh />}
                  onClick={handleGenerateRecommendations}
                  disabled={isLoading}
                >
                  Refresh
                </Button>
              </Box>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    bgcolor: "rgba(63, 81, 181, 0.05)",
                    mb: 3,
                  }}
                >
                  {formatRecommendations(recommendations)}
                </Box>
              </motion.div>
            </Box>
          )}

          {!isLoading && (
            <Box sx={{ px: 4, pb: 3 }}>
              <Divider sx={{ mb: 3 }} />
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{ fontWeight: "medium" }}
              >
                Customize your recommendations
              </Typography>
              <Box component="form" sx={{ mt: 2 }}>
                <AccessibleTextField
                  label="Financial Goals & Preferences"
                  variant="outlined"
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Example: I want to save for a vacation, reduce restaurant spending, or increase investments"
                  value={userPreferences}
                  onChange={(e) => setUserPreferences(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="outlined"
                  startIcon={<PsychologyAlt />}
                  onClick={handleGenerateRecommendations}
                  disabled={isLoading}
                >
                  {recommendations
                    ? "Update Recommendations"
                    : "Get Personalized Advice"}
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default BudgetRecommendations;
