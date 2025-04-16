import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Card,
  CardContent,
  LinearProgress,
  Tooltip,
  Button,
  IconButton,
  Avatar,
  Chip,
  useTheme,
} from "@mui/material";
import {
  CheckCircle,
  Cancel,
  ArrowUpward,
  ArrowDownward,
  Info,
  TrendingUp,
  TrendingDown,
  AccountBalance,
  SaveAlt,
  Warning,
  Lightbulb,
  Stars,
  Speed,
  Timeline,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import {
  RadialBarChart,
  RadialBar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import { useCurrency } from "../../contexts/CurrencyContext";

// Animated card component
const AnimatedCard = ({ children, delay = 0, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      style={{ height: "100%" }}
    >
      <Card {...props} sx={{ height: "100%", ...props.sx }}>
        {children}
      </Card>
    </motion.div>
  );
};

// Score gauge component
const ScoreGauge = ({ score, label, color }) => {
  const theme = useTheme();

  const data = [
    {
      name: "Score",
      value: score - 300,
      fill: color,
    },
  ];

  return (
    <Box sx={{ textAlign: "center", position: "relative" }}>
      <ResponsiveContainer width="100%" height={300}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="40%"
          outerRadius="90%"
          barSize={20}
          data={data}
          startAngle={180}
          endAngle={0}
        >
          <RadialBar
            background
            dataKey="value"
            cornerRadius={12}
            max={550} // 850 - 300
            animationDuration={1500}
          />
          <text
            x="50%"
            y="45%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="progress-label"
            fontSize="2.5em"
            fontWeight="bold"
            fill={theme.palette.text.primary}
          >
            {score}
          </text>
          <text
            x="50%"
            y="60%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="progress-label"
            fontSize="1.2em"
            fontWeight="bold"
            fill={color}
          >
            {label}
          </text>
        </RadialBarChart>
      </ResponsiveContainer>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          px: 4,
          mt: -2,
        }}
      >
        <Typography variant="caption" color="text.secondary" fontWeight="bold">
          300
        </Typography>
        <Typography variant="caption" color="text.secondary" fontWeight="bold">
          850
        </Typography>
      </Box>
    </Box>
  );
};

// Factor item component
const FactorItem = ({ factor, index }) => {
  const getIcon = () => {
    if (factor.type === "positive")
      return <CheckCircle sx={{ color: "success.main" }} />;
    if (factor.type === "negative")
      return <Warning sx={{ color: "error.main" }} />;
    return <Info sx={{ color: "info.main" }} />;
  };

  const getImpactColor = () => {
    if (factor.impact === "high") return "error.main";
    if (factor.impact === "medium") return "warning.main";
    return "info.main";
  };

  // Motion settings
  const delay = index * 0.1;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <ListItem
        sx={{
          py: 1,
          borderBottom: index < 3 ? "1px solid rgba(0,0,0,0.06)" : "none",
          "&:hover": { bgcolor: "rgba(0,0,0,0.02)" },
        }}
      >
        <ListItemIcon sx={{ minWidth: 36 }}>{getIcon()}</ListItemIcon>
        <ListItemText
          primary={factor.text}
          primaryTypographyProps={{ fontWeight: "medium" }}
          secondary={`Impact: ${
            factor.impact.charAt(0).toUpperCase() + factor.impact.slice(1)
          }`}
          secondaryTypographyProps={{
            color: getImpactColor(),
            fontSize: "0.75rem",
            fontWeight: "bold",
          }}
        />
      </ListItem>
    </motion.div>
  );
};

// Component score card with animation
const ComponentScoreCard = ({ component, index }) => {
  const componentColor =
    component.status === "excellent"
      ? "success.main"
      : component.status === "good"
      ? "success.light"
      : component.status === "okay"
      ? "info.main"
      : component.status === "fair"
      ? "warning.main"
      : component.status === "poor"
      ? "error.main"
      : "text.secondary";

  // Get currency formatter
  const { formatAmount } = useCurrency();

  // Format details based on component type
  const getDetailDisplay = () => {
    if (component.label === "Budget Adherence") {
      return (
        <>
          <Typography variant="body2" color="text.secondary">
            You've spent {component.details.budgetRatio}% of your monthly
            budget.
          </Typography>
          {component.details.spentAmount !== undefined && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {formatAmount(component.details.spentAmount)} spent of{" "}
              {formatAmount(component.details.budgetAmount)} budget
            </Typography>
          )}
        </>
      );
    } else if (component.label === "Savings Rate") {
      return (
        <Typography variant="body2" color="text.secondary">
          You're saving {component.details.savingsRate}% of your income.
        </Typography>
      );
    } else if (component.label === "Spending Consistency") {
      return (
        <Typography variant="body2" color="text.secondary">
          Your spending variation is {component.details.variationCoefficient}%
          {component.details.monthsAnalyzed &&
            ` across ${component.details.monthsAnalyzed} months`}
          .
        </Typography>
      );
    } else if (component.label === "Expense Diversity") {
      return (
        <Typography variant="body2" color="text.secondary">
          Your spending is spread across {component.details.categories}{" "}
          categories.
        </Typography>
      );
    }
    return null;
  };

  return (
    <AnimatedCard
      delay={index * 0.1}
      sx={{
        borderTop: `4px solid ${
          componentColor === "success.main"
            ? "#4CAF50"
            : componentColor === "success.light"
            ? "#8BC34A"
            : componentColor === "info.main"
            ? "#2196F3"
            : componentColor === "warning.main"
            ? "#FFC107"
            : componentColor === "error.main"
            ? "#F44336"
            : "#9E9E9E"
        }`,
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1,
          }}
        >
          <Typography variant="h6" gutterBottom>
            {component.label}
          </Typography>
          <Chip
            label={component.score}
            color={
              component.status === "excellent" || component.status === "good"
                ? "success"
                : component.status === "okay"
                ? "info"
                : component.status === "fair"
                ? "warning"
                : "error"
            }
            size="small"
          />
        </Box>

        <LinearProgress
          variant="determinate"
          value={component.score}
          sx={{
            mb: 2,
            height: 8,
            borderRadius: 2,
            bgcolor: "grey.200",
            "& .MuiLinearProgress-bar": {
              bgcolor: componentColor,
              transition: "transform 1s ease-in-out",
            },
          }}
        />

        <Typography variant="body2" sx={{ mb: 1.5 }}>
          {component.message}
        </Typography>

        {getDetailDisplay()}
      </CardContent>
    </AnimatedCard>
  );
};

const CreditScorePage = ({
  transactions,
  monthlyBudget,
  totalSpent,
  totalRevenue,
  categoryBudgets,
  categories = [],
  monthlyIncome = 0,
  totalSavings = 0,
}) => {
  const [creditScore, setCreditScore] = useState(null);
  const [scoreFactors, setScoreFactors] = useState([]);
  const [scoreBreakdown, setScoreBreakdown] = useState({});
  const [loading, setLoading] = useState(true);

  // Add state for navigation
  const [navigateTo, setNavigateTo] = useState(null);

  // Store the calculated score in ref to avoid dependency cycle issues
  const calculatedScoreRef = useRef(null);

  // Add currency context
  const { formatAmount } = useCurrency();

  // Effect to calculate score when component mounts or dependencies change
  useEffect(() => {
    console.log(
      "CreditScorePage: Dependencies changed, recalculating score..."
    );
    calculateCreditScore();
  }, [
    transactions,
    monthlyBudget,
    totalSpent,
    totalRevenue,
    categoryBudgets,
    categories,
    monthlyIncome,
    totalSavings,
  ]);

  // Separate effect to share score with dashboard
  useEffect(() => {
    if (creditScore && window.updateDashboardCreditScore) {
      console.log(
        "CreditScorePage: Credit score state updated, sharing with dashboard:",
        creditScore
      );
      const scoreInfo = getScoreRangeInfo(creditScore);
      window.updateDashboardCreditScore({
        score: creditScore,
        label: scoreInfo.label,
        color: scoreInfo.color,
      });
    }
  }, [creditScore]);

  const calculateCreditScore = () => {
    console.log("CreditScorePage: Beginning credit score calculation");
    setLoading(true);

    // Start with base score of 500
    let score = 500;
    let breakdown = {};
    let factors = [];

    try {
      // 1. Budget adherence (max 100 points)
      const budgetAdherenceScore = calculateBudgetAdherenceScore();
      score += budgetAdherenceScore.score;
      breakdown.budgetAdherence = budgetAdherenceScore;

      // 2. Savings rate (max 100 points)
      const savingsRateScore = calculateSavingsRateScore();
      score += savingsRateScore.score;
      breakdown.savingsRate = savingsRateScore;

      // 3. Spending consistency (max 100 points)
      const consistencyScore = calculateConsistencyScore();
      score += consistencyScore.score;
      breakdown.consistency = consistencyScore;

      // 4. Expense diversity (max 50 points)
      const diversityScore = calculateDiversityScore();
      score += diversityScore.score;
      breakdown.diversity = diversityScore;

      // Generate factors that affect score (positive and negative)
      factors = generateScoreFactors(breakdown);

      // Ensure score is within 300-850 range (standard credit score range)
      score = Math.max(300, Math.min(850, score));

      setCreditScore(score);
      setScoreFactors(factors);
      setScoreBreakdown(breakdown);

      // After calculation, log the results
      console.log("CreditScorePage: Calculation complete, score:", score);

      // Share the credit score with the dashboard
      const scoreInfo = getScoreRangeInfo(score);
      if (window.updateDashboardCreditScore) {
        console.log("CreditScorePage: Sharing score with dashboard:", score);
        window.updateDashboardCreditScore({
          score: score,
          label: scoreInfo.label,
          color: scoreInfo.color,
        });
      } else {
        console.warn(
          "CreditScorePage: Dashboard update function not available"
        );
      }
    } catch (error) {
      console.error("Error calculating credit score:", error);
      // Set default values if calculation fails
      setCreditScore(600);
      setScoreFactors([
        {
          type: "negative",
          text: "Could not calculate all score factors",
          impact: "high",
        },
      ]);

      // Share the default credit score with the dashboard
      if (window.updateDashboardCreditScore) {
        window.updateDashboardCreditScore({
          score: 600,
          label: "Fair",
          color: "#FFC107",
        });
      }
    }

    setLoading(false);
  };

  // Calculate how well user adheres to their budget
  const calculateBudgetAdherenceScore = () => {
    if (!monthlyBudget || monthlyBudget <= 0) {
      return {
        score: 20,
        label: "Budget Adherence",
        message: "No budget set",
        status: "neutral",
        details: { budgetRatio: 0, categoryAdherenceRate: 0 },
      };
    }

    // Filter expense transactions from the current month
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const currentMonthExpenses = transactions.filter((t) => {
      if (t.isRevenue) return false;
      const txDate = new Date(t.date);
      return (
        txDate.getMonth() === currentMonth &&
        txDate.getFullYear() === currentYear
      );
    });

    // Calculate current month spending (or use totalSpent if no transactions for current month)
    const currentMonthTotal =
      currentMonthExpenses.length > 0
        ? currentMonthExpenses.reduce(
            (sum, t) => sum + parseFloat(t.amount || 0),
            0
          )
        : totalSpent;

    // Check if user stays within budget
    const budgetRatio = Math.min(currentMonthTotal / monthlyBudget, 2); // Cap at 200% for score calculation

    let score = 0;
    let message = "";
    let status = "neutral";

    if (budgetRatio <= 0.05) {
      // Extremely under budget - excellent
      score = 100;
      message = "Exceptional budget management";
      status = "excellent";
    } else if (budgetRatio <= 0.25) {
      // Well under budget - excellent
      score = 95;
      message = "Excellent budget management";
      status = "excellent";
    } else if (budgetRatio <= 0.5) {
      // Very under budget - excellent
      score = 85;
      message = "Very good budget management";
      status = "good";
    } else if (budgetRatio <= 0.65) {
      // Under budget - good
      score = 75;
      message = "Good budget management";
      status = "good";
    } else if (budgetRatio <= 0.8) {
      // Moderately under budget - okay
      score = 60;
      message = "Moderate budget management";
      status = "okay";
    } else if (budgetRatio <= 0.95) {
      // Slightly under budget - fair
      score = 45;
      message = "Fair budget management";
      status = "fair";
    } else if (budgetRatio <= 1.0) {
      // Just within budget - fair
      score = 35;
      message = "Just within budget";
      status = "fair";
    } else if (budgetRatio <= 1.1) {
      // Slightly over budget - poor
      score = 20;
      message = "Slightly over budget";
      status = "poor";
    } else if (budgetRatio <= 1.25) {
      // Over budget - poor
      score = 10;
      message = "Over budget";
      status = "poor";
    } else {
      // Significantly over budget - poor
      score = 0;
      message = "Significantly over budget";
      status = "poor";
    }

    // Check category budget adherence
    let categoryAdherence = 0;
    let categoriesChecked = 0;

    Object.keys(categoryBudgets).forEach((categoryId) => {
      const budget = categoryBudgets[categoryId];
      if (budget && budget > 0) {
        const categoryExpenses = currentMonthExpenses
          .filter((t) => t.category === categoryId)
          .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

        const ratio = categoryExpenses / budget;

        if (ratio <= 1.0) {
          categoryAdherence += 1;
        }

        categoriesChecked++;
      }
    });

    // Adjust score based on category adherence if categories exist
    if (categoriesChecked > 0) {
      const categoryAdherenceRate = categoryAdherence / categoriesChecked;
      score = Math.round(score * (0.7 + 0.3 * categoryAdherenceRate));
    }

    return {
      score,
      label: "Budget Adherence",
      message,
      status,
      details: {
        budgetRatio: Math.round(budgetRatio * 100), // Convert to percentage
        spentAmount: currentMonthTotal,
        budgetAmount: monthlyBudget,
        categoryAdherenceRate:
          categoriesChecked > 0
            ? Math.round((categoryAdherence / categoriesChecked) * 100)
            : 0, // Convert to percentage
      },
    };
  };

  // Calculate score based on savings rate
  const calculateSavingsRateScore = () => {
    console.log(
      "Calculating savings rate with totalSavings:",
      totalSavings,
      "monthlyIncome:",
      monthlyIncome
    );
    // First check if we have the direct totalSavings and monthlyIncome values from the dashboard
    // These are the most accurate values to use
    if (totalSavings > 0 && monthlyIncome > 0) {
      const savingsRate = totalSavings / monthlyIncome;

      let score = 0;
      let message = "";
      let status = "neutral";

      if (savingsRate < 0.05) {
        // Very low savings - poor
        score = 20;
        message = "Very low savings rate";
        status = "poor";
      } else if (savingsRate < 0.1) {
        // Low savings - fair
        score = 40;
        message = "Low savings rate";
        status = "fair";
      } else if (savingsRate < 0.2) {
        // Moderate savings - good
        score = 60;
        message = "Moderate savings rate";
        status = "okay";
      } else if (savingsRate < 0.3) {
        // Good savings - very good
        score = 80;
        message = "Good savings rate";
        status = "good";
      } else {
        // Excellent savings - excellent
        score = 100;
        message = "Excellent savings rate";
        status = "excellent";
      }

      return {
        score,
        label: "Savings Rate",
        message,
        status,
        details: {
          savingsRate: Math.round(savingsRate * 100),
          savings: totalSavings,
        },
      };
    }

    // As a fallback, check for savings category
    const savingsCategory = categories.find(
      (cat) => cat.id === "savings" || cat.name.toLowerCase() === "savings"
    );

    // Get current month's data
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const currentMonthTransactions = transactions.filter((t) => {
      const txDate = new Date(t.date);
      return (
        txDate.getMonth() === currentMonth &&
        txDate.getFullYear() === currentYear
      );
    });

    // Check for monthly savings allocation from the dashboard
    // This takes precedence if it exists
    if (savingsCategory && categoryBudgets[savingsCategory.id] > 0) {
      const monthlySavings = categoryBudgets[savingsCategory.id] || 0;
      const income =
        monthlyIncome > 0
          ? monthlyIncome
          : totalRevenue > 0
          ? totalRevenue
          : monthlyBudget;

      if (income > 0) {
        const savingsRate = monthlySavings / income;

        let score = 0;
        let message = "";
        let status = "neutral";

        if (savingsRate < 0.05) {
          // Very low savings - poor
          score = 20;
          message = "Very low savings rate";
          status = "poor";
        } else if (savingsRate < 0.1) {
          // Low savings - fair
          score = 40;
          message = "Low savings rate";
          status = "fair";
        } else if (savingsRate < 0.2) {
          // Moderate savings - good
          score = 60;
          message = "Moderate savings rate";
          status = "okay";
        } else if (savingsRate < 0.3) {
          // Good savings - very good
          score = 80;
          message = "Good savings rate";
          status = "good";
        } else {
          // Excellent savings - excellent
          score = 100;
          message = "Excellent savings rate";
          status = "excellent";
        }

        return {
          score,
          label: "Savings Rate",
          message,
          status,
          details: {
            savingsRate: Math.round(savingsRate * 100),
            savings: monthlySavings,
          },
        };
      }
    }

    // If we couldn't determine savings from the above methods,
    // calculate from income vs expenses
    const monthIncome = currentMonthTransactions
      .filter((t) => t.isRevenue)
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const monthExpenses = currentMonthTransactions
      .filter((t) => !t.isRevenue)
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    // Use current month's data if available, otherwise use provided totals
    const income =
      monthIncome > 0
        ? monthIncome
        : totalRevenue > 0
        ? totalRevenue
        : monthlyIncome > 0
        ? monthlyIncome
        : monthlyBudget;

    const expenses =
      currentMonthTransactions.length > 0 ? monthExpenses : totalSpent;

    if (income <= 0) {
      return {
        score: 20,
        label: "Savings Rate",
        message: "No income recorded",
        status: "neutral",
        details: { savingsRate: 0, savings: 0 },
      };
    }

    const savings = income - expenses;
    const savingsRate = Math.max(0, Math.min(savings / income, 1)); // Clamp between 0-100%

    let score = 0;
    let message = "";
    let status = "neutral";

    if (savingsRate < 0) {
      // Negative savings - poor
      score = 0;
      message = "Spending exceeds income";
      status = "poor";
    } else if (savingsRate < 0.05) {
      // Very low savings - poor
      score = 20;
      message = "Very low savings rate";
      status = "poor";
    } else if (savingsRate < 0.1) {
      // Low savings - fair
      score = 40;
      message = "Low savings rate";
      status = "fair";
    } else if (savingsRate < 0.2) {
      // Moderate savings - good
      score = 60;
      message = "Moderate savings rate";
      status = "okay";
    } else if (savingsRate < 0.3) {
      // Good savings - very good
      score = 80;
      message = "Good savings rate";
      status = "good";
    } else {
      // Excellent savings - excellent
      score = 100;
      message = "Excellent savings rate";
      status = "excellent";
    }

    return {
      score,
      label: "Savings Rate",
      message,
      status,
      details: {
        savingsRate: Math.round(savingsRate * 100),
        savings,
      },
    };
  };

  // Calculate score based on spending consistency
  const calculateConsistencyScore = () => {
    // If we have very few transactions, we can't meaningfully measure consistency
    if (transactions.length < 10) {
      return {
        score: 50,
        label: "Spending Consistency",
        message: "Limited transaction history - consistency analysis pending",
        status: "neutral",
        details: { variationCoefficient: 0 },
      };
    }

    // Group transactions by month
    const expensesByMonth = {};

    transactions.forEach((transaction) => {
      if (!transaction.isRevenue) {
        const date = new Date(transaction.date);
        const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;

        if (!expensesByMonth[monthYear]) {
          expensesByMonth[monthYear] = 0;
        }

        expensesByMonth[monthYear] += parseFloat(transaction.amount || 0);
      }
    });

    // Need at least 2 months of data
    const months = Object.keys(expensesByMonth);
    if (months.length < 2) {
      return {
        score: 50,
        label: "Spending Consistency",
        message: "Need multiple months of data for consistency analysis",
        status: "neutral",
        details: { variationCoefficient: 0 },
      };
    }

    // Calculate variance in monthly spending
    const values = Object.values(expensesByMonth);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;

    if (avg === 0) {
      return {
        score: 50,
        label: "Spending Consistency",
        message: "No expenses recorded",
        status: "neutral",
        details: { variationCoefficient: 0 },
      };
    }

    // Calculate standard deviation
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) /
      values.length;
    const stdDev = Math.sqrt(variance);

    // Calculate coefficient of variation (standard deviation / mean)
    const cv = Math.min(stdDev / avg, 1); // Cap at 100% for readability

    let score = 0;
    let message = "";
    let status = "neutral";

    if (cv < 0.1) {
      // Very consistent - excellent
      score = 100;
      message = "Very consistent spending habits";
      status = "excellent";
    } else if (cv < 0.2) {
      // Consistent - good
      score = 80;
      message = "Consistent spending habits";
      status = "good";
    } else if (cv < 0.3) {
      // Somewhat consistent - okay
      score = 60;
      message = "Somewhat consistent spending habits";
      status = "okay";
    } else if (cv < 0.4) {
      // Inconsistent - fair
      score = 40;
      message = "Inconsistent spending habits";
      status = "fair";
    } else {
      // Very inconsistent - poor
      score = 20;
      message = "Inconsistent spending patterns";
      status = "poor";
    }

    // If we have very few months of data, cap the impact of this score
    // and provide appropriate messaging
    if (months.length < 3) {
      score = Math.max(40, score); // Ensure score isn't too negative with limited data

      if (score < 60) {
        message = "Some spending variation (based on limited data)";
      } else if (score >= 60) {
        message += " (based on limited data)";
      }

      // Adjust status to be less extreme with limited data
      if (status === "poor") status = "fair";
      if (status === "excellent") status = "good";
    }

    return {
      score,
      label: "Spending Consistency",
      message,
      status,
      details: {
        variationCoefficient: Math.round(cv * 100),
        monthsAnalyzed: months.length,
      },
    };
  };

  // Calculate score based on expense diversity (not too concentrated in one category)
  const calculateDiversityScore = () => {
    // Focus on recent transactions - last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const recentTransactions = transactions.filter((t) => {
      if (t.isRevenue) return false;
      const txDate = new Date(t.date);
      return txDate >= threeMonthsAgo;
    });

    // If we have very few transactions, we can't realistically judge diversity
    if (recentTransactions.length < 5) {
      return {
        score: 25,
        label: "Expense Diversity",
        message: "Need more transaction history to assess spending diversity",
        status: "neutral",
        details: { hhi: 0, categories: 0 },
      };
    }

    // Group expenses by category
    const expensesByCategory = {};
    let totalExpenses = 0;

    recentTransactions.forEach((transaction) => {
      const categoryId = transaction.category || "uncategorized";

      if (!expensesByCategory[categoryId]) {
        expensesByCategory[categoryId] = 0;
      }

      const amount = parseFloat(transaction.amount || 0);
      expensesByCategory[categoryId] += amount;
      totalExpenses += amount;
    });

    if (totalExpenses === 0) {
      return {
        score: 25,
        label: "Expense Diversity",
        message: "No expenses recorded",
        status: "neutral",
        details: { hhi: 0, categories: 0 },
      };
    }

    // Calculate concentration of spending
    const categories = Object.keys(expensesByCategory);

    // If we have a decent number of unique categories, increase the base score
    const uniqueCategoriesScore = Math.min(categories.length * 5, 30);

    // Calculate Herfindahl-Hirschman Index (HHI) for spending concentration
    // HHI = sum of squares of market shares (as percentages)
    const hhi = categories.reduce((sum, cat) => {
      const share = (expensesByCategory[cat] / totalExpenses) * 100;
      return sum + share * share;
    }, 0);

    // HHI ranges from 0 (perfect diversity) to 10000 (complete concentration)
    // For our score, lower HHI is better
    let score = 0;
    let message = "";
    let status = "neutral";

    if (hhi < 2000) {
      // Well diversified - excellent
      score = 50;
      message = "Well-balanced spending across categories";
      status = "excellent";
    } else if (hhi < 3000) {
      // Moderately diversified - good
      score = 40;
      message = "Good spending balance across categories";
      status = "good";
    } else if (hhi < 4000) {
      // Somewhat concentrated - okay
      score = 30;
      message = "Acceptable spending balance";
      status = "okay";
    } else if (hhi < 5000) {
      // Concentrated - fair
      score = 20;
      message = "Spending spread across several categories";
      status = "fair";
    } else {
      // Highly concentrated - poor
      score = 10;
      message = "Spending concentrated in a few categories";
      status = "poor";
    }

    // With limited data, avoid extreme assessments
    if (recentTransactions.length < 15 || categories.length < 4) {
      // Adjust message to reflect limited data
      message += " (based on limited transaction data)";

      // Make the score less extreme
      if (score < 20) score = 20;
      if (status === "poor") status = "fair";
    }

    return {
      score: Math.max(score, uniqueCategoriesScore), // Ensure we reward having many categories
      label: "Expense Diversity",
      message,
      status,
      details: {
        hhi: Math.round(hhi),
        categories: categories.length,
        transactionsAnalyzed: recentTransactions.length,
      },
    };
  };

  // Generate factors that affect the score
  const generateScoreFactors = (breakdown) => {
    const factors = [];

    // Add positive factors
    if (
      breakdown.budgetAdherence &&
      breakdown.budgetAdherence.status === "excellent"
    ) {
      factors.push({
        type: "positive",
        text: "Excellent budget management",
        impact: "high",
      });
    } else if (
      breakdown.budgetAdherence &&
      breakdown.budgetAdherence.status === "good"
    ) {
      factors.push({
        type: "positive",
        text: "Good budget adherence",
        impact: "medium",
      });
    }

    if (breakdown.savingsRate && breakdown.savingsRate.status === "excellent") {
      factors.push({
        type: "positive",
        text: "High savings rate",
        impact: "high",
      });
    } else if (
      breakdown.savingsRate &&
      breakdown.savingsRate.status === "good"
    ) {
      factors.push({
        type: "positive",
        text: "Good savings rate",
        impact: "medium",
      });
    }

    if (breakdown.consistency && breakdown.consistency.status === "excellent") {
      factors.push({
        type: "positive",
        text: "Very consistent spending patterns",
        impact: "medium",
      });
    } else if (
      breakdown.consistency &&
      breakdown.consistency.status === "good"
    ) {
      factors.push({
        type: "positive",
        text: "Consistent spending patterns",
        impact: "low",
      });
    }

    if (breakdown.diversity && breakdown.diversity.status === "excellent") {
      factors.push({
        type: "positive",
        text: "Well-balanced spending across categories",
        impact: "low",
      });
    }

    // Add negative factors
    if (
      breakdown.budgetAdherence &&
      (breakdown.budgetAdherence.status === "poor" ||
        breakdown.budgetAdherence.status === "fair")
    ) {
      factors.push({
        type: "negative",
        text: "Not adhering to budget",
        impact: "high",
      });
    }

    if (
      breakdown.savingsRate &&
      (breakdown.savingsRate.status === "poor" ||
        breakdown.savingsRate.status === "fair")
    ) {
      factors.push({
        type: "negative",
        text: "Low savings rate",
        impact: "high",
      });
    }

    if (
      breakdown.consistency &&
      (breakdown.consistency.status === "poor" ||
        breakdown.consistency.status === "fair")
    ) {
      factors.push({
        type: "negative",
        text: "Inconsistent spending patterns",
        impact: "medium",
      });
    }

    if (
      breakdown.diversity &&
      (breakdown.diversity.status === "poor" ||
        breakdown.diversity.status === "fair")
    ) {
      factors.push({
        type: "negative",
        text: "Spending concentrated in few categories",
        impact: "low",
      });
    }

    // If we have too few factors, add a neutral/informational one
    if (factors.length < 2) {
      factors.push({
        type: "neutral",
        text: "Limited transaction history",
        impact: "medium",
      });
    }

    return factors;
  };

  // Determine credit score range and color
  const getScoreRangeInfo = (score) => {
    if (score >= 750) {
      return { label: "Excellent", color: "#4CAF50" };
    } else if (score >= 700) {
      return { label: "Very Good", color: "#8BC34A" };
    } else if (score >= 650) {
      return { label: "Good", color: "#CDDC39" };
    } else if (score >= 600) {
      return { label: "Fair", color: "#FFC107" };
    } else if (score >= 550) {
      return { label: "Poor", color: "#FF9800" };
    } else {
      return { label: "Very Poor", color: "#F44336" };
    }
  };

  // Convert score to percentage for gauge
  const scoreToPercentage = (score) => {
    // Convert from 300-850 range to 0-100%
    return ((score - 300) / (850 - 300)) * 100;
  };

  // Generate radar chart data from score breakdown
  const getRadarData = () => {
    if (!scoreBreakdown || Object.keys(scoreBreakdown).length === 0) {
      return [];
    }

    return Object.keys(scoreBreakdown).map((key) => ({
      subject: scoreBreakdown[key].label,
      A: scoreBreakdown[key].score,
      fullMark: 100,
    }));
  };

  // Generate recommendation actions based on score breakdown
  const getRecommendedActions = () => {
    const actions = [];

    if (
      scoreBreakdown.budgetAdherence &&
      scoreBreakdown.budgetAdherence.score < 60
    ) {
      actions.push({
        title: "Review Your Budget",
        description:
          "Adjust your budget to more realistic levels or reduce spending in key categories.",
        icon: <AccountBalance />,
        color: "#1976d2",
        action: "Budget Management",
        target: "budget",
      });
    }

    if (scoreBreakdown.savingsRate && scoreBreakdown.savingsRate.score < 60) {
      actions.push({
        title: "Increase Savings",
        description: "Try to save at least 20% of your monthly income.",
        icon: <SaveAlt />,
        color: "#388e3c",
        action: "Set Savings Goal",
        target: "budget",
      });
    }

    if (scoreBreakdown.consistency && scoreBreakdown.consistency.score < 60) {
      actions.push({
        title: "Stabilize Spending",
        description:
          "Try to maintain more consistent spending patterns month to month.",
        icon: <TrendingUp />,
        color: "#f57c00",
        action: "View Patterns",
        target: "insights",
      });
    }

    if (scoreBreakdown.diversity && scoreBreakdown.diversity.score < 30) {
      actions.push({
        title: "Diversify Spending",
        description: "Your spending is concentrated in too few categories.",
        icon: <PieChart />,
        color: "#7b1fa2",
        action: "View Categories",
        target: "insights",
      });
    }

    // If no specific actions needed, provide a general one
    if (actions.length === 0) {
      actions.push({
        title: "Maintain Good Habits",
        description:
          "You're doing well! Keep tracking your finances regularly.",
        icon: <Stars />,
        color: "#4CAF50",
        action: "Dashboard",
        target: "overview",
      });
    }

    return actions;
  };

  // Handle action button clicks
  const handleActionClick = (target) => {
    // Navigate to the specified view
    if (typeof window !== "undefined" && window.setActiveView) {
      window.setActiveView(target);
    } else {
      // Fallback if global navigation function is not available
      setNavigateTo(target);

      // If parent component passed setActiveView as prop, we could use that instead
      if (window.parent && window.parent.setActiveView) {
        window.parent.setActiveView(target);
      }
    }
  };

  // Effect to expose the navigation request to parent
  useEffect(() => {
    if (navigateTo) {
      // Make navigation request available to parent component
      if (window.creditScoreNavigation) {
        window.creditScoreNavigation.target = navigateTo;
        window.creditScoreNavigation.requested = true;
      } else {
        window.creditScoreNavigation = {
          target: navigateTo,
          requested: true,
        };
      }

      // Reset after making request
      setNavigateTo(null);
    }
  }, [navigateTo]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const scoreInfo = getScoreRangeInfo(creditScore);
  const scorePercentage = scoreToPercentage(creditScore);
  const radarData = getRadarData();
  const recommendedActions = getRecommendedActions();

  console.log(
    "CreditScorePage rendering with score:",
    creditScore,
    "and scoreInfo:",
    scoreInfo
  );

  // Update the radar chart tooltip if needed
  const customTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: "#fff",
            border: "1px solid #ddd",
            padding: "10px",
            borderRadius: "4px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          }}
        >
          <p
            style={{ margin: 0 }}
          >{`${payload[0].payload.subject}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Box sx={{ py: 2 }}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 3,
            background: "linear-gradient(145deg, #f6f8fc 0%, #eef2f9 100%)",
            boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 0,
              right: 0,
              width: { xs: "100%", md: "30%" },
              height: "100%",
              opacity: 0.04,
              background:
                "radial-gradient(circle at 50% 50%, " +
                scoreInfo.color +
                " 0%, transparent 70%)",
              zIndex: 0,
            }}
          />

          <Grid container spacing={3}>
            <Grid item xs={12} md={5}>
              <Box sx={{ position: "relative", zIndex: 1 }}>
                <Typography
                  variant="h5"
                  gutterBottom
                  sx={{ fontWeight: "bold", mb: 3 }}
                >
                  Your Financial Health Score
                </Typography>

                <ScoreGauge
                  score={creditScore}
                  label={scoreInfo.label}
                  color={scoreInfo.color}
                />

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 2, textAlign: "center" }}
                >
                  Updated{" "}
                  {new Date().toLocaleDateString("en-US", {
                    month: "numeric",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={7}>
              <Box sx={{ mb: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Stars sx={{ color: "primary.main", mr: 1 }} />
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontWeight: "medium", mb: 0 }}
                  >
                    Key Factors
                  </Typography>
                </Box>

                <Paper
                  elevation={0}
                  sx={{
                    p: 1,
                    bgcolor: "background.paper",
                    borderRadius: 2,
                    boxShadow: "inset 0 0 10px rgba(0,0,0,0.03)",
                  }}
                >
                  <List sx={{ py: 0 }}>
                    {scoreFactors.slice(0, 4).map((factor, index) => (
                      <FactorItem key={index} factor={factor} index={index} />
                    ))}
                  </List>
                </Paper>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </motion.div>

      <Box sx={{ mb: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Speed sx={{ color: "primary.main", mr: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: "medium" }}>
              Score Components
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {Object.keys(scoreBreakdown).map((key, index) => {
              const component = scoreBreakdown[key];
              return (
                <Grid item xs={12} sm={6} key={key}>
                  <ComponentScoreCard component={component} index={index} />
                </Grid>
              );
            })}
          </Grid>
        </motion.div>
      </Box>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            boxShadow: "0 4px 20px 0 rgba(0,0,0,0.05)",
            mb: 4,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <Timeline sx={{ color: "info.main", mr: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: "medium" }}>
              Recommended Actions
            </Typography>
          </Box>

          <Grid container spacing={2}>
            {recommendedActions.map((action, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <AnimatedCard
                  variant="outlined"
                  sx={{
                    boxShadow: "none",
                    borderRadius: 2,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-5px)",
                      boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
                    },
                  }}
                  delay={index * 0.1 + 0.4}
                >
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Box sx={{ display: "flex" }}>
                      <Avatar
                        sx={{
                          bgcolor: action.color,
                          width: 40,
                          height: 40,
                          mr: 2,
                        }}
                      >
                        {action.icon}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {action.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          {action.description}
                        </Typography>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() =>
                            window.parent.setActiveView
                              ? window.parent.setActiveView(action.target)
                              : (window.location.hash = `#${action.target}`)
                          }
                          sx={{
                            borderRadius: 5,
                            textTransform: "none",
                            px: 2,
                            boxShadow: "none",
                            "&:hover": {
                              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                            },
                          }}
                        >
                          {action.action}
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </AnimatedCard>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default CreditScorePage;
