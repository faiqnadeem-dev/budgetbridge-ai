import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  LinearProgress,
  CircularProgress,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Avatar,
} from "@mui/material";
import {
  InfoOutlined,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Error,
  Warning,
  ArrowForward,
  Edit,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { useCurrency } from "../../contexts/CurrencyContext";

const BudgetProgressTracker = ({
  categories = [],
  categoryBudgets = {},
  transactions = [],
  currentMonth = new Date(),
  onEditBudget,
}) => {
  const [categorySpending, setCategorySpending] = useState({});
  const [totalBudgeted, setTotalBudgeted] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState("percent"); // 'percent', 'amount', 'category'

  // Get formatAmount from currency context
  const { formatAmount } = useCurrency();

  // Calculate spending for the current month by category
  useEffect(() => {
    setIsLoading(true);

    // Get start and end dates for the current month
    const monthStart = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );
    const monthEnd = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    // Filter transactions for current month
    const currentMonthTransactions = transactions.filter((t) => {
      const txDate = new Date(t.date);
      return t.type === "expense" && txDate >= monthStart && txDate <= monthEnd;
    });

    // Calculate spending by category
    const spending = {};
    let total = 0;

    currentMonthTransactions.forEach((transaction) => {
      const { category, amount } = transaction;
      if (!spending[category]) {
        spending[category] = 0;
      }
      spending[category] += Number(amount);
      total += Number(amount);
    });

    setCategorySpending(spending);
    setTotalSpent(total);

    // Calculate total budgeted amount
    const budgetedAmount = Object.values(categoryBudgets).reduce(
      (sum, amount) => sum + Number(amount || 0),
      0
    );
    setTotalBudgeted(budgetedAmount);

    setIsLoading(false);
  }, [transactions, categoryBudgets, currentMonth]);

  // Get all categories with their spending and budget data
  const getCategoryData = () => {
    return categories.map((category) => {
      const spent = categorySpending[category.id] || 0;
      const budget = categoryBudgets[category.id] || 0;
      const percentage = budget > 0 ? (spent / budget) * 100 : 0;

      return {
        id: category.id,
        name: category.name,
        spent,
        budget,
        percentage,
        remaining: budget - spent,
        status:
          percentage > 100 ? "over" : percentage > 85 ? "warning" : "good",
      };
    });
  };

  // Sort category data based on the selected sort option
  const getSortedCategoryData = () => {
    const data = getCategoryData();

    switch (sortBy) {
      case "percent":
        return data.sort((a, b) => b.percentage - a.percentage);
      case "amount":
        return data.sort((a, b) => b.spent - a.spent);
      case "remaining":
        return data.sort((a, b) => a.remaining - b.remaining);
      case "category":
        return data.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return data;
    }
  };

  // Get color for progress bar based on percentage
  const getProgressColor = (percentage) => {
    if (percentage > 100) return "error.main";
    if (percentage > 85) return "warning.main";
    return "success.main";
  };

  // Get month name
  const getMonthName = () => {
    return currentMonth.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
  };

  // Handle edit budget click
  const handleEditBudget = (categoryId) => {
    // If a category ID is provided, scroll to it in the budget modal
    if (categoryId) {
      onEditBudget(categoryId);
    } else {
      onEditBudget();
    }
  };

  // Get varying gradient backgrounds for categories
  const getCategoryColor = (index) => {
    const colors = [
      "linear-gradient(135deg, #6AC8FF 0%, #4A8FE7 100%)", // Blue
      "linear-gradient(135deg, #FF9F7F 0%, #E57373 100%)", // Red
      "linear-gradient(135deg, #A5D6A7 0%, #66BB6A 100%)", // Green
      "linear-gradient(135deg, #FFD54F 0%, #FFA726 100%)", // Orange
      "linear-gradient(135deg, #CE93D8 0%, #AB47BC 100%)", // Purple
      "linear-gradient(135deg, #90CAF9 0%, #42A5F5 100%)", // Light Blue
      "linear-gradient(135deg, #FFCC80 0%, #FF8A65 100%)", // Orange/Peach
      "linear-gradient(135deg, #81D4FA 0%, #29B6F6 100%)", // Light Blue 2
    ];
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
            Budget Overview
          </Typography>

          <Card
            sx={{
              p: 2,
              borderRadius: 3,
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              background: "linear-gradient(135deg, #f5f7fa 0%, #E3EEFF 100%)",
            }}
          >
            <CardContent>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <Box
                      sx={{
                        position: "relative",
                        display: "inline-flex",
                        mb: 1,
                      }}
                    >
                      <CircularProgress
                        variant="determinate"
                        value={
                          totalBudgeted > 0
                            ? Math.min((totalSpent / totalBudgeted) * 100, 100)
                            : 0
                        }
                        size={180}
                        thickness={5}
                        sx={{
                          color: (theme) =>
                            totalSpent > totalBudgeted
                              ? theme.palette.error.main
                              : theme.palette.primary.main,
                          "& .MuiCircularProgress-circle": {
                            strokeLinecap: "round",
                          },
                        }}
                      />
                      <Box
                        sx={{
                          top: 0,
                          left: 0,
                          bottom: 0,
                          right: 0,
                          position: "absolute",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexDirection: "column",
                        }}
                      >
                        <Typography
                          variant="h6"
                          color="text.secondary"
                          component="div"
                          sx={{ mb: 0.5 }}
                        >
                          Spent
                        </Typography>
                        <Typography
                          variant="h4"
                          sx={{ fontWeight: "bold" }}
                          component="div"
                        >
                          {formatAmount(totalSpent)}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          component="div"
                        >
                          of {formatAmount(totalBudgeted)}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      textAlign="center"
                    >
                      {totalBudgeted > 0
                        ? `${((totalSpent / totalBudgeted) * 100).toFixed(
                            0
                          )}% of total budget used`
                        : "No budget set"}
                    </Typography>

                    <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
                      {totalBudgeted - totalSpent >= 0 ? (
                        <Chip
                          icon={<TrendingDown />}
                          label={`${formatAmount(
                            totalBudgeted - totalSpent
                          )} Remaining`}
                          color="success"
                          sx={{ fontWeight: "medium" }}
                        />
                      ) : (
                        <Chip
                          icon={<TrendingUp />}
                          label={`${formatAmount(
                            Math.abs(totalBudgeted - totalSpent)
                          )} Over Budget`}
                          color="error"
                          sx={{ fontWeight: "medium" }}
                        />
                      )}
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography
                    variant="subtitle1"
                    sx={{ mb: 2, fontWeight: 600 }}
                  >
                    Budget Allocation
                  </Typography>
                  <Grid container spacing={2}>
                    {categories.slice(0, 4).map((category, index) => {
                      const budget = categoryBudgets[category.id] || 0;
                      if (budget <= 0) return null;

                      const percentage =
                        totalBudgeted > 0 ? (budget / totalBudgeted) * 100 : 0;
                      return (
                        <Grid item xs={6} key={category.id}>
                          <Box
                            sx={{
                              mb: 0.5,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              {category.name}
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {percentage.toFixed(0)}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={percentage}
                            sx={{
                              height: 8,
                              borderRadius: 5,
                              mb: 1,
                              background: "rgba(0,0,0,0.05)",
                              "& .MuiLinearProgress-bar": {
                                background: getCategoryColor(index),
                              },
                            }}
                          />
                        </Grid>
                      );
                    })}
                  </Grid>

                  <Box
                    sx={{ display: "flex", justifyContent: "center", mt: 2 }}
                  >
                    <Tooltip title="Edit budgets">
                      <IconButton
                        onClick={() => handleEditBudget()}
                        sx={{
                          bgcolor: "rgba(25, 118, 210, 0.08)",
                          "&:hover": { bgcolor: "rgba(25, 118, 210, 0.15)" },
                        }}
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          Category Breakdown
        </Typography>

        <Grid container spacing={3}>
          {categories.map((category, index) => {
            const {
              spent = 0,
              budget = 0,
              percentage = 0,
              remaining = 0,
            } = categorySpending[category.id] || {};

            // Skip categories with no budget
            if (budget <= 0) return null;

            return (
              <Grid item xs={12} sm={6} md={4} key={category.id}>
                <Card
                  sx={{
                    height: "100%",
                    borderRadius: 3,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    transition: "transform 0.3s, box-shadow 0.3s",
                    "&:hover": {
                      transform: "translateY(-5px)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      height: 8,
                      background: getCategoryColor(index),
                      borderTopLeftRadius: 12,
                      borderTopRightRadius: 12,
                    }}
                  />
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 2,
                      }}
                    >
                      <Typography variant="h6" component="div">
                        {category.name}
                      </Typography>
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          background: getCategoryColor(index),
                          fontSize: "0.875rem",
                          fontWeight: "bold",
                        }}
                      >
                        {category.name.charAt(0).toUpperCase()}
                      </Avatar>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Budget
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatAmount(budget)}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Spent
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatAmount(spent)}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 2,
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Remaining
                      </Typography>
                      <Typography
                        variant="body1"
                        fontWeight="medium"
                        color={remaining >= 0 ? "success.main" : "error.main"}
                      >
                        {remaining >= 0
                          ? formatAmount(remaining)
                          : `-${formatAmount(Math.abs(remaining))}`}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 1, position: "relative" }}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(percentage, 100)}
                        sx={{
                          height: 10,
                          borderRadius: 5,
                          bgcolor: "rgba(0,0,0,0.05)",
                          "& .MuiLinearProgress-bar": {
                            bgcolor: getProgressColor(percentage),
                            borderRadius: 5,
                          },
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          position: "absolute",
                          right: 0,
                          top: -18,
                          fontWeight: "bold",
                          color: getProgressColor(percentage),
                        }}
                      >
                        {percentage.toFixed(0)}%
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        mt: 3,
                        justifyContent: "flex-end",
                      }}
                    >
                      <Tooltip title="Edit budget">
                        <IconButton
                          size="small"
                          onClick={() => handleEditBudget(category.id)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </motion.div>
    </Box>
  );
};

export default BudgetProgressTracker;
