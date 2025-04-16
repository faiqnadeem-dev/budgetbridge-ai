import { alpha } from "@mui/material/styles";

export const dashboardStyles = {
  mainContainer: {
    display: "flex",
    minHeight: "100vh",
    bgcolor: "#f8fafc",
    position: "relative",
  },

  contentArea: {
    flexGrow: 1,
    p: { xs: 2, md: 4 },
    bgcolor: "#f8fafc",
    minHeight: "100vh",
    position: "relative",
    zIndex: 1,
  },

  overviewCard: {
    p: 3,
    height: "100%",
    borderRadius: 3,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    transition: "all 0.3s ease-in-out",
    "&:hover": {
      transform: "translateY(-5px)",
      boxShadow: "0 14px 40px rgba(0,0,0,0.12)",
    },
    position: "relative",
    overflow: "hidden",
  },

  revenueCard: {
    background: "linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)",
    color: "white",
  },

  expenseCard: {
    background: "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
    color: "white",
  },

  balanceCard: {
    background: "linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)",
    color: "white",
  },

  budgetCard: {
    background: "linear-gradient(135deg, #2196F3 0%, #1976D2 100%)",
    color: "white",
  },

  savingsCard: {
    background: "linear-gradient(135deg, #00BCD4 0%, #0097A7 100%)",
    color: "white",
  },

  creditScoreCard: {
    background: "linear-gradient(135deg, #673AB7 0%, #512DA8 100%)",
    color: "white",
  },

  transactionList: {
    p: 0,
    borderRadius: 3,
    bgcolor: "white",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    overflow: "hidden",
  },

  transactionItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    p: 2,
    borderBottom: "1px solid rgba(0,0,0,0.06)",
    transition: "all 0.2s ease-in-out",
    "&:hover": {
      bgcolor: "rgba(0,0,0,0.02)",
    },
  },

  modalContent: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: { xs: "90%", sm: 500 },
    bgcolor: "background.paper",
    borderRadius: 3,
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    p: 4,
    maxHeight: "90vh",
    overflow: "auto",
  },

  actionButton: {
    borderRadius: 2,
    textTransform: "none",
    py: 1.5,
    px: 3,
    fontWeight: "bold",
    boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
  },

  addRevenueButton: {
    bgcolor: "#4CAF50",
    boxShadow: "0 6px 20px rgba(76, 175, 80, 0.3)",
    "&:hover": {
      bgcolor: "#388E3C",
    },
  },

  addExpenseButton: {
    bgcolor: "#f44336",
    boxShadow: "0 6px 20px rgba(244, 67, 54, 0.3)",
    "&:hover": {
      bgcolor: "#d32f2f",
    },
  },

  sidebar: {
    width: 280,
    flexShrink: 0,
    "& .MuiDrawer-paper": {
      width: 280,
      boxSizing: "border-box",
      background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
      color: "white",
      borderRight: "none",
      zIndex: 0,
      boxShadow: "0 0 20px rgba(0,0,0,0.2)",
      overflow: "hidden",
    },
  },

  sidebarItem: {
    margin: "3px 16px",
    borderRadius: "12px",
    padding: "10px 16px",
    transition: "all 0.2s ease",
    width: "calc(100% - 32px)",
    justifyContent: "flex-start",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      transform: "translateX(5px)",
    },
    "&.Mui-selected": {
      backgroundColor: "rgba(255, 255, 255, 0.12)",
      "&:hover": {
        backgroundColor: "rgba(255, 255, 255, 0.15)",
      },
    },
  },

  cardTitle: {
    fontSize: "1rem",
    fontWeight: 500,
    opacity: 0.9,
    mb: 1,
  },

  cardAmount: {
    fontSize: "2rem",
    fontWeight: 700,
  },

  cardIcon: {
    fontSize: "2rem",
    opacity: 0.8,
    mb: 2,
  },

  "@keyframes fadeIn": {
    from: {
      opacity: 0,
      transform: "translateY(10px)",
    },
    to: {
      opacity: 1,
      transform: "translateY(0)",
    },
  },

  animatedElement: {
    animation: "fadeIn 0.3s ease-out",
  },

  glassContainer: {
    background: "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(20px)",
    borderRadius: 3,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  },

  welcomeContainer: {
    background: "linear-gradient(135deg, #1a237e 0%, #3949ab 100%)",
    color: "white",
    borderRadius: 3,
    p: 3,
    mb: 4,
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 10px 30px rgba(26, 35, 126, 0.2)",
  },

  circleDecoration: {
    position: "absolute",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.1)",
  },

  actionChip: {
    borderRadius: 8,
    fontWeight: "medium",
    height: 32,
  },

  responsiveGrid: {
    display: "grid",
    gridTemplateColumns: {
      xs: "1fr",
      sm: "repeat(2, 1fr)",
      md: "repeat(3, 1fr)",
      lg: "repeat(4, 1fr)",
    },
    gap: 3,
  },

  primaryButton: {
    textTransform: "none",
    borderRadius: 2,
    fontWeight: "medium",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    transition: "all 0.2s ease",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
    },
  },

  enhancedInput: {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      transition: "all 0.2s ease",
      "&:hover": {
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      },
      "&.Mui-focused": {
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      },
    },
  },

  categoryColors: {
    housing: "#4299E1",
    food: "#F6AD55",
    transportation: "#68D391",
    utilities: "#B794F4",
    healthcare: "#FC8181",
    entertainment: "#F6E05E",
    education: "#90CDF4",
    savings: "#4FD1C5",
    debt: "#F687B3",
    personal: "#9AE6B4",
  },
};

export default dashboardStyles;
