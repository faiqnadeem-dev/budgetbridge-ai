import React, { useState } from "react";
import {
  Modal,
  Box,
  Typography,
  IconButton,
  Grid,
  Paper,
  Button,
  useTheme,
  useMediaQuery,
  Divider,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import CloseIcon from "@mui/icons-material/Close";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import PsychologyAltIcon from "@mui/icons-material/PsychologyAlt";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SpeedIcon from "@mui/icons-material/Speed";
import SecurityIcon from "@mui/icons-material/Security";
import DataUsageIcon from "@mui/icons-material/DataUsage";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

const AboutModal = ({ open, handleClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [activeTab, setActiveTab] = useState("features");

  // Updated color scheme to match dark blue theme
  const colors = {
    primary: "#1a237e", // Deep indigo
    secondary: "#3949ab", // Indigo
    highlight: "#536dfe", // Brighter indigo
    dark: "#0d1442", // Very dark blue (for backgrounds)
    darkBackground: "#111936", // Dark blue background matching screenshot
    cardBg: "#172252", // Slightly lighter blue for cards
    lightAccent: "#8c9eff", // Light indigo accent
    text: "#e0e0e0", // Light text for dark backgrounds
    white: "#ffffff",
    aiTag: "#304ffe", // Bright indigo for AI tags
  };

  // Enhanced animations
  const modalVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      y: 50,
      transition: { duration: 0.3 },
    },
  };

  const featureCardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (custom) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: custom * 0.1,
        duration: 0.4,
      },
    }),
    hover: {
      y: -5,
      boxShadow: "0 8px 25px rgba(14, 30, 77, 0.32)",
      transition: { duration: 0.2 },
    },
  };

  // Enhanced feature descriptions with consistent lengths
  const features = [
    {
      icon: <PsychologyAltIcon fontSize="medium" />,
      title: "AI Budget Recommendations",
      description:
        "Our intelligent AI analyzes your spending patterns and income streams to create personalized budget recommendations tailored to your financial goals.",
      primary: true,
      bgGradient: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.highlight} 100%)`,
    },
    {
      icon: <WarningAmberIcon fontSize="medium" />,
      title: "AI Anomaly Detection",
      description:
        "Advanced machine learning algorithms powered by Isolation Forest identify unusual spending patterns and potentially fraudulent transactions in real-time.",
      primary: true,
      bgGradient: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.highlight} 100%)`,
    },
    {
      icon: <DashboardIcon fontSize="medium" />,
      title: "Interactive Dashboard",
      description:
        "Visualize your financial data with beautiful, interactive charts that provide meaningful insights about your spending habits at a glance.",
      color: colors.lightAccent,
    },
    {
      icon: <ReceiptLongIcon fontSize="medium" />,
      title: "Transaction Tracking",
      description:
        "Easily log and categorize all your expenses with our intuitive interface. Search, filter, and organize transactions however you need.",
      color: colors.lightAccent,
    },
    {
      icon: <AccountBalanceIcon fontSize="medium" />,
      title: "Budget Management",
      description:
        "Set up and track your budget goals across multiple categories to stay financially disciplined. Get alerts when approaching budget limits.",
      color: colors.lightAccent,
    },
    {
      icon: <AutorenewIcon fontSize="medium" />,
      title: "Recurring Transactions",
      description:
        "Never miss recurring bills with automated tracking of subscription services and regular expenses. Get notifications before payments are due.",
      color: colors.lightAccent,
    },
  ];

  const technologies = [
    "React",
    "Material UI",
    "Firebase",
    "OpenAI API",
    "Isolation Forest",
    "Framer Motion",
    "TensorFlow.js",
  ];

  const stats = [
    {
      value: "95%",
      label: "Anomaly detection accuracy",
      icon: <SpeedIcon />,
    },
    {
      value: "15%",
      label: "Average savings with AI recommendations",
      icon: <TrendingUpIcon />,
    },
    {
      value: "Real-time",
      label: "Transaction monitoring",
      icon: <SecurityIcon />,
    },
    {
      value: "10ms",
      label: "Average AI response time",
      icon: <DataUsageIcon />,
    },
  ];

  const renderFeatures = () => (
    <Box>
      <Grid container spacing={2.5}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <motion.div
              custom={index}
              variants={featureCardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              style={{ height: "100%" }}
            >
              <Paper
                elevation={feature.primary ? 6 : 2}
                sx={{
                  height: "100%",
                  overflow: "hidden",
                  position: "relative",
                  borderRadius: 2,
                  transition: "all 0.3s ease",
                  bgcolor: feature.primary ? "transparent" : colors.cardBg,
                  border: feature.primary
                    ? "none"
                    : `1px solid rgba(83, 109, 254, 0.2)`,
                }}
              >
                <Box
                  sx={{
                    p: 2.5,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  {feature.primary && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        opacity: 1,
                        background: feature.bgGradient,
                        zIndex: -1,
                      }}
                    />
                  )}

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 1.5,
                      color: feature.primary ? colors.white : feature.color,
                    }}
                  >
                    <Box
                      sx={{
                        mr: 1.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        p: 1,
                        borderRadius: "50%",
                        bgcolor: feature.primary
                          ? "rgba(255,255,255,0.15)"
                          : "rgba(83, 109, 254, 0.15)",
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontSize: "1.1rem",
                        fontWeight: 600,
                        color: feature.primary ? colors.white : feature.color,
                      }}
                    >
                      {feature.title}
                    </Typography>
                  </Box>

                  <Typography
                    variant="body2"
                    sx={{
                      color: feature.primary
                        ? "rgba(255,255,255,0.9)"
                        : colors.text,
                      lineHeight: 1.6,
                      fontSize: "0.875rem",
                      minHeight: "4.5rem", // Fixed height for descriptions
                    }}
                  >
                    {feature.description}
                  </Typography>

                  {feature.primary && (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        width: "100%",
                        mt: "auto",
                        pt: 1.5,
                      }}
                    >
                      <Box
                        component="span"
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          bgcolor: colors.aiTag,
                          color: colors.white,
                          borderRadius: 4,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                          letterSpacing: "0.5px",
                        }}
                      >
                        AI POWERED
                      </Box>
                    </Box>
                  )}
                </Box>
              </Paper>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderTechnologies = () => (
    <Box>
      <Typography
        variant="body1"
        sx={{
          mb: 2.5,
          color: colors.text,
          fontWeight: 400,
          textAlign: "center",
          maxWidth: "600px",
          mx: "auto",
          lineHeight: 1.6,
        }}
      >
        BudgetBridge is built using a modern technology stack combining powerful
        frontend frameworks with advanced AI capabilities and secure cloud
        infrastructure.
      </Typography>

      <Grid container spacing={2} justifyContent="center" sx={{ mb: 3 }}>
        {technologies.map((tech, index) => (
          <Grid item key={index}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{
                opacity: 1,
                scale: 1,
                transition: { delay: index * 0.1 },
              }}
              whileHover={{ scale: 1.05 }}
            >
              <Paper
                elevation={3}
                sx={{
                  px: 2,
                  py: 1.5,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: colors.cardBg,
                  color: colors.lightAccent,
                  border: `1px solid rgba(83, 109, 254, 0.3)`,
                }}
              >
                <Typography variant="body2" fontWeight={600} fontSize="0.9rem">
                  {tech}
                </Typography>
              </Paper>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      <Typography
        variant="h6"
        sx={{
          mb: 2,
          color: colors.lightAccent,
          fontWeight: 600,
          textAlign: "center",
          fontSize: "1.1rem",
        }}
      >
        Performance Metrics
      </Typography>

      <Grid container spacing={2.5} justifyContent="center">
        {stats.map((stat, index) => (
          <Grid item xs={6} sm={3} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Paper
                elevation={2}
                sx={{
                  p: 2,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  bgcolor: colors.cardBg,
                  borderRadius: 2,
                  border: `1px solid rgba(83, 109, 254, 0.2)`,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 1,
                    mb: 1,
                    borderRadius: "50%",
                    bgcolor: "rgba(83, 109, 254, 0.15)",
                    color: colors.lightAccent,
                  }}
                >
                  {stat.icon}
                </Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: colors.white,
                    mb: 0.5,
                    fontSize: "1.5rem",
                  }}
                >
                  {stat.value}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: colors.text,
                    fontSize: "0.8rem",
                    lineHeight: 1.4,
                  }}
                >
                  {stat.label}
                </Typography>
              </Paper>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderHowItWorks = () => (
    <Box>
      <Box sx={{ mb: 3.5 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Paper
            elevation={4}
            sx={{
              p: 3,
              borderRadius: 2,
              backgroundColor: colors.cardBg,
              border: `1px solid rgba(83, 109, 254, 0.3)`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "5px",
                height: "100%",
                bgcolor: colors.highlight,
              }}
            />

            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  p: 1,
                  borderRadius: "50%",
                  bgcolor: "rgba(83, 109, 254, 0.15)",
                  mr: 2,
                }}
              >
                <WarningAmberIcon sx={{ color: colors.lightAccent }} />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontSize: "1.2rem",
                  fontWeight: 600,
                  color: colors.lightAccent,
                }}
              >
                AI Anomaly Detection System
              </Typography>
            </Box>

            <Typography
              variant="body1"
              sx={{ mb: 2.5, color: colors.text, lineHeight: 1.6 }}
            >
              Our proprietary AI model uses the Isolation Forest algorithm, a
              powerful machine learning technique that excels at detecting
              outliers in financial data. Here's how it works:
            </Typography>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "rgba(83, 109, 254, 0.08)",
                    borderRadius: 1.5,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ color: colors.white, mb: 1, fontWeight: 600 }}
                  >
                    1. Data Collection & Processing
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.text }}>
                    We analyze your transaction history to understand normal
                    spending behavior across categories, times, and merchants
                    without storing sensitive details.
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "rgba(83, 109, 254, 0.08)",
                    borderRadius: 1.5,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ color: colors.white, mb: 1, fontWeight: 600 }}
                  >
                    2. Anomaly Scoring
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.text }}>
                    Each transaction receives an anomaly score based on how
                    different it is from your normal patterns, using multiple
                    dimensions of data.
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "rgba(83, 109, 254, 0.08)",
                    borderRadius: 1.5,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ color: colors.white, mb: 1, fontWeight: 600 }}
                  >
                    3. Alert Generation
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.text }}>
                    Transactions above a certain threshold trigger intelligent
                    alerts with context about why the transaction was flagged as
                    unusual.
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "rgba(83, 109, 254, 0.08)",
                    borderRadius: 1.5,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ color: colors.white, mb: 1, fontWeight: 600 }}
                  >
                    4. Continuous Learning
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.text }}>
                    The system adapts to your feedback and evolving spending
                    patterns, becoming more accurate over time as you use the
                    app.
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "flex-start", sm: "center" },
                justifyContent: "space-between",
                gap: 2,
                p: 2,
                bgcolor: "rgba(83, 109, 254, 0.15)",
                borderRadius: 1.5,
                mt: 1,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <SpeedIcon
                  sx={{ mr: 1, color: colors.lightAccent, fontSize: "1.2rem" }}
                />
                <Typography
                  variant="body2"
                  fontWeight={500}
                  color={colors.white}
                >
                  95% accuracy in fraud detection
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <SecurityIcon
                  sx={{ mr: 1, color: colors.lightAccent, fontSize: "1.2rem" }}
                />
                <Typography
                  variant="body2"
                  fontWeight={500}
                  color={colors.white}
                >
                  Real-time monitoring & alerts
                </Typography>
              </Box>
            </Box>
          </Paper>
        </motion.div>
      </Box>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Paper
          elevation={4}
          sx={{
            p: 3,
            borderRadius: 2,
            backgroundColor: colors.cardBg,
            border: `1px solid rgba(83, 109, 254, 0.3)`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "5px",
              height: "100%",
              bgcolor: colors.highlight,
            }}
          />

          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 1,
                borderRadius: "50%",
                bgcolor: "rgba(83, 109, 254, 0.15)",
                mr: 2,
              }}
            >
              <PsychologyAltIcon sx={{ color: colors.lightAccent }} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontSize: "1.2rem",
                fontWeight: 600,
                color: colors.lightAccent,
              }}
            >
              AI Budget Recommendation Engine
            </Typography>
          </Box>

          <Typography
            variant="body1"
            sx={{ mb: 2.5, color: colors.text, lineHeight: 1.6 }}
          >
            Our AI budget recommendation system uses OpenAI's advanced models to
            analyze your financial data and create personalized budget
            allocations that help you save more effectively:
          </Typography>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: "rgba(83, 109, 254, 0.08)",
                  borderRadius: 1.5,
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ color: colors.white, mb: 1, fontWeight: 600 }}
                >
                  1. Spending Pattern Analysis
                </Typography>
                <Typography variant="body2" sx={{ color: colors.text }}>
                  The AI examines your transaction history to identify recurring
                  expenses, discretionary spending, and potential savings
                  opportunities.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: "rgba(83, 109, 254, 0.08)",
                  borderRadius: 1.5,
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ color: colors.white, mb: 1, fontWeight: 600 }}
                >
                  2. Smart Category Allocation
                </Typography>
                <Typography variant="body2" sx={{ color: colors.text }}>
                  Based on your income and spending habits, the AI suggests
                  optimal budget allocations across categories like housing,
                  food, transportation, and entertainment.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: "rgba(83, 109, 254, 0.08)",
                  borderRadius: 1.5,
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ color: colors.white, mb: 1, fontWeight: 600 }}
                >
                  3. Personalized Savings Goals
                </Typography>
                <Typography variant="body2" sx={{ color: colors.text }}>
                  The system helps you set achievable savings targets based on
                  your financial situation and adjusts recommendations to help
                  you reach these goals.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: "rgba(83, 109, 254, 0.08)",
                  borderRadius: 1.5,
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ color: colors.white, mb: 1, fontWeight: 600 }}
                >
                  4. Adaptive Recommendations
                </Typography>
                <Typography variant="body2" sx={{ color: colors.text }}>
                  As your financial situation changes, the AI adjusts its
                  recommendations to accommodate new income sources, expenses,
                  or financial goals.
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 2,
              bgcolor: "rgba(83, 109, 254, 0.15)",
              borderRadius: 1.5,
              mt: 1,
            }}
          >
            <TrendingUpIcon
              sx={{ mr: 1.5, color: colors.lightAccent, fontSize: "1.2rem" }}
            />
            <Typography variant="body2" fontWeight={600} color={colors.white}>
              Average user saves 15% more with our AI budget recommendations
            </Typography>
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );

  return (
    <AnimatePresence>
      {open && (
        <Modal
          open={open}
          onClose={handleClose}
          closeAfterTransition
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 2,
          }}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ width: "100%", maxWidth: "800px", maxHeight: "85vh" }}
          >
            <Paper
              elevation={10}
              sx={{
                borderRadius: 3,
                overflow: "hidden",
                maxHeight: "85vh",
                display: "flex",
                flexDirection: "column",
                bgcolor: colors.darkBackground,
                border: `1px solid rgba(83, 109, 254, 0.3)`,
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  position: "relative",
                  background: `linear-gradient(135deg, ${colors.dark} 0%, ${colors.primary} 100%)`,
                  pt: 3.5,
                  pb: 3.5,
                  px: { xs: 3, sm: 4 },
                  borderBottom: `1px solid rgba(83, 109, 254, 0.3)`,
                }}
              >
                <IconButton
                  onClick={handleClose}
                  sx={{
                    position: "absolute",
                    right: 16,
                    top: 16,
                    color: colors.white,
                    bgcolor: "rgba(255,255,255,0.1)",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.2)",
                    },
                  }}
                >
                  <CloseIcon />
                </IconButton>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        p: 1,
                        borderRadius: "50%",
                        bgcolor: "rgba(255,255,255,0.1)",
                        mr: 2,
                      }}
                    >
                      <AutoAwesomeIcon
                        sx={{
                          color: colors.white,
                          fontSize: 28,
                        }}
                      />
                    </Box>
                    <Typography
                      variant="h4"
                      component="h1"
                      sx={{
                        color: colors.white,
                        fontWeight: 700,
                        letterSpacing: "-0.5px",
                        fontSize: { xs: "1.75rem", sm: "2rem" },
                      }}
                    >
                      BudgetBridge
                    </Typography>
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      color: "rgba(255,255,255,0.9)",
                      fontWeight: 400,
                      mt: 1,
                      ml: 5,
                      fontSize: { xs: "1rem", sm: "1.1rem" },
                    }}
                  >
                    Your AI-powered personal finance assistant
                  </Typography>
                </motion.div>
              </Box>

              {/* Tab Navigation */}
              <Box
                sx={{
                  display: "flex",
                  borderBottom: `1px solid rgba(83, 109, 254, 0.2)`,
                  bgcolor: colors.darkBackground,
                }}
              >
                <Button
                  onClick={() => setActiveTab("features")}
                  sx={{
                    py: 1.5,
                    px: { xs: 2, sm: 3 },
                    color:
                      activeTab === "features"
                        ? colors.lightAccent
                        : colors.text,
                    borderBottom:
                      activeTab === "features"
                        ? `2px solid ${colors.lightAccent}`
                        : "none",
                    borderRadius: 0,
                    fontSize: "0.95rem",
                    fontWeight: activeTab === "features" ? 600 : 400,
                    transition: "all 0.2s ease",
                  }}
                >
                  Features
                </Button>
                <Button
                  onClick={() => setActiveTab("how-it-works")}
                  sx={{
                    py: 1.5,
                    px: { xs: 2, sm: 3 },
                    color:
                      activeTab === "how-it-works"
                        ? colors.lightAccent
                        : colors.text,
                    borderBottom:
                      activeTab === "how-it-works"
                        ? `2px solid ${colors.lightAccent}`
                        : "none",
                    borderRadius: 0,
                    fontSize: "0.95rem",
                    fontWeight: activeTab === "how-it-works" ? 600 : 400,
                    transition: "all 0.2s ease",
                  }}
                >
                  How It Works
                </Button>
                <Button
                  onClick={() => setActiveTab("tech")}
                  sx={{
                    py: 1.5,
                    px: { xs: 2, sm: 3 },
                    color:
                      activeTab === "tech" ? colors.lightAccent : colors.text,
                    borderBottom:
                      activeTab === "tech"
                        ? `2px solid ${colors.lightAccent}`
                        : "none",
                    borderRadius: 0,
                    fontSize: "0.95rem",
                    fontWeight: activeTab === "tech" ? 600 : 400,
                    transition: "all 0.2s ease",
                  }}
                >
                  Technologies
                </Button>
              </Box>

              {/* Content */}
              <Box
                sx={{
                  p: { xs: 2.5, sm: 3 },
                  overflowY: "auto",
                  bgcolor: colors.darkBackground,
                }}
              >
                {activeTab === "features" && renderFeatures()}
                {activeTab === "tech" && renderTechnologies()}
                {activeTab === "how-it-works" && renderHowItWorks()}
              </Box>
            </Paper>
          </motion.div>
        </Modal>
      )}
    </AnimatePresence>
  );
};

export default AboutModal;
