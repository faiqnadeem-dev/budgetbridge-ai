import React from "react";
import {
  Modal,
  Box,
  Typography,
  IconButton,
  Grid,
  Button,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import CloseIcon from "@mui/icons-material/Close";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import SpeedIcon from "@mui/icons-material/Speed";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import InsightsIcon from "@mui/icons-material/Insights";

const LearnMoreModal = ({ open, handleClose }) => {
  const features = [
    {
      icon: <ShowChartIcon sx={{ fontSize: 40, color: "#1a237e" }} />,
      title: "Expense Tracking",
      description:
        "Easily track all transactions with our intuitive interface, including receipt management and recurring expenses",
    },
    {
      icon: <ReceiptLongIcon sx={{ fontSize: 40, color: "#1a237e" }} />,
      title: "Receipt Management",
      description:
        "Attach and store receipts directly with transactions for better record-keeping and financial organization",
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 40, color: "#1a237e" }} />,
      title: "Real-time Dashboard",
      description:
        "Monitor your financial status with a comprehensive dashboard showing spending patterns and budget status",
    },
    {
      icon: <InsightsIcon sx={{ fontSize: 40, color: "#1a237e" }} />,
      title: "Financial Insights",
      description:
        "Gain valuable insights into your spending habits and identify opportunities to save",
    },
    {
      icon: (
        <AccountBalanceWalletIcon sx={{ fontSize: 40, color: "#1a237e" }} />
      ),
      title: "Budget Management",
      description:
        "Create and manage budgets for different categories to control your spending effectively",
    },
    {
      icon: <NotificationsActiveIcon sx={{ fontSize: 40, color: "#1a237e" }} />,
      title: "Alert System",
      description:
        "Receive notifications about unusual spending patterns, budget limits, and recurring transaction reminders",
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <Modal open={open} onClose={handleClose} closeAfterTransition>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 30,
              },
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
              y: 20,
              transition: {
                duration: 0.2,
              },
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "90%",
                maxWidth: 900,
                maxHeight: "90vh",
                overflow: "auto",
                bgcolor: "background.paper",
                borderRadius: 3,
                boxShadow: 24,
                p: 4,
              }}
            >
              <IconButton
                onClick={handleClose}
                sx={{ position: "absolute", right: 8, top: 8 }}
              >
                <CloseIcon />
              </IconButton>

              <Typography variant="h4" sx={{ mb: 1, color: "#1a237e" }}>
                Manage Your Finances Smarter
              </Typography>

              <Typography
                variant="subtitle1"
                sx={{ mb: 4, color: "text.secondary" }}
              >
                BudgetBridge offers powerful tools to help you track expenses,
                manage budgets, and achieve financial freedom
              </Typography>

              <Grid container spacing={4}>
                {features.map((feature, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 2,
                        }}
                      >
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: "rgba(26, 35, 126, 0.05)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {feature.icon}
                        </Box>
                        <Box>
                          <Typography variant="h6" sx={{ mb: 1 }}>
                            {feature.title}
                          </Typography>
                          <Typography variant="body1" color="text.secondary">
                            {feature.description}
                          </Typography>
                        </Box>
                      </Box>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>

              <Box sx={{ mt: 4, textAlign: "center" }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleClose}
                  sx={{
                    bgcolor: "#1a237e",
                    "&:hover": { bgcolor: "#283593" },
                    px: 4,
                    py: 1,
                    borderRadius: 2,
                  }}
                >
                  Get Started Now
                </Button>
              </Box>
            </Box>
          </motion.div>
        </Modal>
      )}
    </AnimatePresence>
  );
};

export default LearnMoreModal;
