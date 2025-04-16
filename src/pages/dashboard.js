import React, { useState, useEffect, useRef, lazy, useCallback } from "react";
import { useFirebaseUser } from "../context/ClerkFirebaseBridge";
import { useUser, useAuth, UserButton } from "@clerk/clerk-react";
import { db } from "../config/firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  deleteDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import dashboardStyles from "../styles/DashboardStyles";
import CategoryDialog from "../components/budget/CategoryDialog";
import SpendingInsights from "../components/SpendingInsights";
import AnomalyDashboard from "../components/anomaly/AnomalyDashboard";
import OnboardingFlow from "../components/onboarding/OnboardingFlow";
import BudgetManagementPage from "../components/budget/BudgetManagementPage";
import CreditScorePage from "../components/credit/CreditScorePage";
import SettingsPage from "../components/settings/SettingsPage";
import { useNavigate } from "react-router-dom";
import { useColorMode } from "../index";
import {
  Box,
  Drawer,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Modal,
  Button,
  Menu,
  MenuItem,
  Grid,
  Paper,
  Snackbar,
  Alert,
  LinearProgress,
  Chip,
  Tooltip,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  AlertTitle,
  Slider,
  FormControlLabel,
  Checkbox,
  TextField,
  Tabs,
  Tab,
  Fab,
  Avatar,
  TableCell,
  InputAdornment,
} from "@mui/material";
import {
  AccountBalanceWallet,
  ExitToApp,
  Settings,
  AddCircleOutline,
  TrendingUp,
  TrendingDown,
  Edit,
  Delete,
  InsightsOutlined,
  WarningAmber,
  Psychology,
  SmartToy,
  SaveAlt,
  Savings,
  MoreVert,
  ErrorOutline,
  InfoOutlined,
  ScheduleOutlined,
  MonetizationOnOutlined,
  AccountBalanceWalletOutlined,
  ShowChart,
} from "@mui/icons-material";
import {
  AccessibleTextField,
  AccessibleButton,
  AccessibleDialog,
} from "../components/common/AccessibleComponents";
import openaiService from "../services/openaiService";
import EnhancedTransactionList from "../components/transactions/EnhancedTransactionList";
import TransactionForm from "../components/transactions/TransactionForm";
import RecurringTransactionSetup from "../components/transactions/RecurringTransactionSetup";
import { expenseService } from "../services/expenseService";
import {
  getUserCurrency,
  formatCurrency,
  currencies,
  syncUserCurrency,
} from "../utils/currencyUtils";
import { useCurrency } from "../contexts/CurrencyContext";

const Dashboard = ({ activeView: initialActiveView }) => {
  const { user } = useUser();
  const { currentUser } = useFirebaseUser();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const [view, setView] = useState(initialActiveView || "dashboard");
  const [categories, setCategories] = useState([]);
  const [revenueCategories, setRevenueCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [newIncome, setNewIncome] = useState("");
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [categoryBudgets, setCategoryBudgets] = useState({});
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalSavings, setTotalSavings] = useState(0);
  const [remainingBudget, setRemainingBudget] = useState(0);
  const [totalAllocated, setTotalAllocated] = useState(0);
  const [isOverAllocated, setOverAllocated] = useState(false);
  const [allowOverBudget, setAllowOverBudget] = useState(false);
  // Category threshold alerts
  const [categoryAlerts, setCategoryAlerts] = useState({});
  const [alertThresholds, setAlertThresholds] = useState({});
  const [aiLoading, setAiLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showWelcomeSnackbar, setShowWelcomeSnackbar] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [activeView, setActiveView] = useState(initialActiveView || "overview");
  const [anomalyNotification, setAnomalyNotification] = useState({
    open: false,
    message: "",
    count: 0,
  });
  const [showOnboarding, setShowOnboarding] = useState(false);

  const [openAddExpense, setOpenAddExpense] = useState(false);
  const [openAddRevenue, setOpenAddRevenue] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newRevenueCategory, setNewRevenueCategory] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddRevenueCategory, setShowAddRevenueCategory] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [revenueCategoryDialogOpen, setRevenueCategoryDialogOpen] =
    useState(false);

  const [openBudgetModal, setOpenBudgetModal] = useState(false);
  const [openIncomeModal, setOpenIncomeModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newBudget, setNewBudget] = useState("");
  const [showIncomeRequiredMessage, setShowIncomeRequiredMessage] =
    useState(false);

  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [paginatedTransactions, setPaginatedTransactions] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(true);
  const [transactionModal, setTransactionModal] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [recurringTransactions, setRecurringTransactions] = useState([]);
  const [recurringTransactionsLoading, setRecurringTransactionsLoading] =
    useState(false);
  const [transactionFilters, setTransactionFilters] = useState({
    type: null,
    category: "",
    startDate: null,
    endDate: null,
  });
  const [paymentMethods, setPaymentMethods] = useState([
    { id: "cash", name: "Cash" },
    { id: "credit", name: "Credit Card" },
    { id: "debit", name: "Debit Card" },
    { id: "bank", name: "Bank Transfer" },
  ]);

  // Budget-related state
  const [budgetView, setBudgetView] = useState("progress"); // 'progress', 'goals', 'timeline'
  const [goals, setGoals] = useState([]);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Budget period tracking
  const [currentBudgetPeriod, setCurrentBudgetPeriod] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1, // 1-12 for months
  });
  const [budgetPeriodHistory, setBudgetPeriodHistory] = useState({});
  const [shouldResetBudget, setShouldResetBudget] = useState(false);

  // Add a new state for credit score (if needed)
  const [creditScore, setCreditScore] = useState(null);
  const [creditScoreLoading, setCreditScoreLoading] = useState(true);
  const [creditScoreLabel, setCreditScoreLabel] = useState("");
  const [creditScoreColor, setCreditScoreColor] = useState("#673AB7");

  // Add a new state for credit score shared between dashboard and credit score page
  const [sharedCreditScore, setSharedCreditScore] = useState({
    score: null,
    label: "",
    color: "#673AB7",
  });

  // Get currency formatter from our context
  const { formatAmount, updateCurrency, symbol, currencyCode } = useCurrency();

  // Add back the handleUpdateCurrency function using the new context
  const handleUpdateCurrency = async (currency, fromOnboarding = false) => {
    try {
      // The currency is already updated in Firestore and localStorage
      // by the OnboardingFlow component, so we just need to use our context
      if (!fromOnboarding) {
        updateCurrency(currency);
      }

      // No need to refresh the page, the context will handle updates
    } catch (error) {
      console.error("Error handling currency update in Dashboard:", error);
    }
  };

  // ----------------------------
  // Transaction-related functions
  // ----------------------------
  const fetchTransactions = async (resetPagination = false) => {
    try {
      setTransactionsLoading(true);

      const options = {
        ...transactionFilters,
        pageSize: 20,
        startAfterDoc: resetPagination ? null : lastDoc,
      };

      const result = await expenseService.getTransactions(user.id, options);

      if (resetPagination) {
        setPaginatedTransactions(result.transactions);
      } else {
        setPaginatedTransactions([
          ...paginatedTransactions,
          ...result.transactions,
        ]);
      }

      setLastDoc(result.lastDoc);
      setHasMoreTransactions(result.hasMore);

      // Also update the full transactions state for totals and budgeting
      setTransactions(result.transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const fetchRecurringTransactions = async () => {
    try {
      setRecurringTransactionsLoading(true);
      const result = await expenseService.getRecurringTransactions(user.id);
      setRecurringTransactions(result);
    } catch (error) {
      console.error("Error fetching recurring transactions:", error);
    } finally {
      setRecurringTransactionsLoading(false);
    }
  };

  // Process recurring transactions and generate actual transactions for due ones
  const processRecurringTransactions = async () => {
    try {
      // Skip if no user or no recurring transactions
      if (!user?.id || recurringTransactions.length === 0) return;

      const today = new Date();
      const processed = [];

      for (const recurring of recurringTransactions) {
        // Skip inactive ones
        if (recurring.active === false) continue;

        // Skip if end date has passed
        if (recurring.endDate && new Date(recurring.endDate) < today) continue;

        // Skip if start date is in future
        const startDate = new Date(recurring.startDate);
        if (startDate > today) continue;

        // Determine if this transaction should be generated
        let shouldGenerate = false;
        const lastGen = recurring.lastGenerated
          ? new Date(recurring.lastGenerated)
          : null;

        switch (recurring.frequency) {
          case "daily":
            shouldGenerate =
              !lastGen ||
              lastGen.getDate() !== today.getDate() ||
              lastGen.getMonth() !== today.getMonth() ||
              lastGen.getFullYear() !== today.getFullYear();
            break;
          case "weekly":
            // Generate if today matches day of week and hasn't been generated this week
            shouldGenerate =
              today.getDay() === recurring.dayOfWeek &&
              (!lastGen || today - lastGen >= 6 * 24 * 60 * 60 * 1000);
            break;
          case "monthly":
            // Generate if today matches day of month and hasn't been generated this month
            shouldGenerate =
              today.getDate() === recurring.dayOfMonth &&
              (!lastGen ||
                lastGen.getMonth() !== today.getMonth() ||
                lastGen.getFullYear() !== today.getFullYear());
            break;
          case "yearly":
            // Generate if matches month/day and hasn't been generated this year
            const recurDate = new Date(recurring.startDate);
            shouldGenerate =
              today.getDate() === recurring.dayOfMonth &&
              today.getMonth() === recurDate.getMonth() &&
              (!lastGen || lastGen.getFullYear() !== today.getFullYear());
            break;
        }

        if (shouldGenerate) {
          // Create actual transaction
          const transaction = {
            amount: recurring.amount,
            category: recurring.category,
            description: recurring.description,
            type: recurring.type,
            date: today.toISOString(),
            notes: `Auto-generated from recurring transaction`,
            isRecurring: true,
            recurringFrequency: recurring.frequency,
            recurringTransactionId: recurring.id, // Link back to the template
          };

          // Add to database
          await expenseService.addTransaction(transaction, user.id);

          // Update the recurring transaction's lastGenerated field
          await expenseService.updateRecurringTransaction(
            {
              ...recurring,
              lastGenerated: today.toISOString(),
            },
            user.id
          );

          processed.push(recurring.description);
        }
      }

      if (processed.length > 0) {
        // Refresh transactions list
        fetchTransactions(true);

        // Notify user
        alert(
          `Generated ${
            processed.length
          } recurring transactions: ${processed.join(", ")}`
        );
      }
    } catch (error) {
      console.error("Error processing recurring transactions:", error);
    }
  };

  const handleOpenTransactionModal = (transaction = null) => {
    setCurrentTransaction(transaction);
    setTransactionModal(true);
  };

  const handleCloseTransactionModal = () => {
    setCurrentTransaction(null);
    setTransactionModal(false);
  };

  const handleSubmitTransaction = async (
    transactionData,
    recurringData = null
  ) => {
    try {
      // First handle the immediate transaction
      if (transactionData.id) {
        await expenseService.updateTransaction(transactionData, user.id);
      } else {
        await expenseService.addTransaction(transactionData, user.id);
      }

      // If this is a new recurring transaction, also create the recurring template
      if (recurringData && !transactionData.id) {
        await expenseService.addRecurringTransaction(recurringData, user.id);
        // Refresh recurring transactions list
        await fetchRecurringTransactions();
      }

      // Refresh transactions
      await fetchTransactions(true);

      // Check if any categories have exceeded their budget thresholds
      if (transactionData.type === "expense") {
        checkCategoryThresholds();

        // Check for anomalies after adding an expense transaction
        try {
          // Import anomalyService dynamically to avoid circular dependencies
          const { anomalyService } = await import("../services/anomalyService");
          const response = await anomalyService.getUserAnomalies();

          if (
            response &&
            Array.isArray(response.anomalies) &&
            response.anomalies.length > 0
          ) {
            // Check if the new transaction is among the anomalies
            const newAnomalies = response.anomalies.filter(
              (anomaly) =>
                anomaly.description === transactionData.description &&
                parseFloat(anomaly.amount) ===
                  parseFloat(transactionData.amount)
            );

            if (newAnomalies.length > 0) {
              // Show notification for the newly detected anomaly
              setAnomalyNotification({
                open: true,
                message:
                  "Unusual transaction detected! View details in Anomaly Detection.",
                count: newAnomalies.length,
              });
            }
          }
        } catch (error) {
          console.error("Error checking for anomalies:", error);
        }
      }

      handleCloseTransactionModal();
    } catch (error) {
      console.error("Error saving transaction:", error);
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    // If transactionId is an array, handle multiple deletions
    if (Array.isArray(transactionId)) {
      try {
        // Create promises for all delete operations
        const deletePromises = transactionId.map((id) =>
          expenseService.deleteTransaction(id, user.id)
        );

        // Execute all deletions in parallel
        await Promise.all(deletePromises);
        fetchTransactions(true);
      } catch (error) {
        console.error("Error batch deleting transactions:", error);
      }
      return;
    }

    // Handle single transaction deletion
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        // Get the transaction details first
        const transactionToDelete = transactions.find(
          (t) => t.id === transactionId
        );

        // Delete the transaction
        await expenseService.deleteTransaction(transactionId, user.id);

        // If this was a recurring transaction, ask if they want to delete all future occurrences
        if (transactionToDelete?.isRecurring) {
          const deleteRecurring = window.confirm(
            "Do you also want to delete the recurring template to prevent future transactions?"
          );

          if (deleteRecurring) {
            // If we have a direct link to the recurring template
            if (transactionToDelete.recurringTransactionId) {
              await expenseService.deleteRecurringTransaction(
                transactionToDelete.recurringTransactionId,
                user.id
              );
            } else {
              // Find recurring templates with matching description and amount
              const matchingTemplate = recurringTransactions.find(
                (rt) =>
                  rt.description === transactionToDelete.description &&
                  rt.amount === transactionToDelete.amount &&
                  rt.type === transactionToDelete.type
              );

              if (matchingTemplate) {
                await expenseService.deleteRecurringTransaction(
                  matchingTemplate.id,
                  user.id
                );
              }
            }

            // Refresh recurring transactions
            fetchRecurringTransactions();
          }
        }

        fetchTransactions(true);
      } catch (error) {
        console.error("Error deleting transaction:", error);
      }
    }
  };

  const handleAddRecurring = async (recurringData) => {
    try {
      await expenseService.addRecurringTransaction(recurringData, user.id);
      fetchRecurringTransactions();
    } catch (error) {
      console.error("Error adding recurring transaction:", error);
    }
  };

  const handleEditRecurring = async (recurringData) => {
    try {
      await expenseService.updateRecurringTransaction(recurringData, user.id);
      fetchRecurringTransactions();
    } catch (error) {
      console.error("Error updating recurring transaction:", error);
    }
  };

  const handleDeleteRecurring = async (recurringId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this recurring transaction template?"
      )
    ) {
      try {
        const recurringToDelete = recurringTransactions.find(
          (r) => r.id === recurringId
        );

        // Delete the recurring template
        await expenseService.deleteRecurringTransaction(recurringId, user.id);

        // Ask if user wants to delete previously generated transactions
        const deleteExisting = window.confirm(
          "Do you also want to delete all existing transactions that were previously generated from this template?"
        );

        if (deleteExisting && recurringToDelete) {
          // Find all transactions that match the template's description, category, and amount
          const matchingTransactions = transactions.filter(
            (t) =>
              t.description === recurringToDelete.description &&
              t.category === recurringToDelete.category &&
              t.amount === recurringToDelete.amount &&
              t.type === recurringToDelete.type &&
              (t.recurringTransactionId === recurringId ||
                t.notes?.includes("Auto-generated from recurring transaction"))
          );

          if (matchingTransactions.length > 0) {
            // Delete all matching transactions
            const deletePromises = matchingTransactions.map((t) =>
              expenseService.deleteTransaction(t.id, user.id)
            );

            await Promise.all(deletePromises);

            // Refresh transactions
            fetchTransactions(true);
          }
        }

        fetchRecurringTransactions();
      } catch (error) {
        console.error("Error deleting recurring transaction:", error);
      }
    }
  };

  // Load initial data once user is available
  useEffect(() => {
    if (user?.id) {
      fetchTransactions(true);
      fetchRecurringTransactions().then(() => {
        processRecurringTransactions();
      });
    }
  }, [user?.id]);

  // ----------------------------
  // Totals calculation from transactions
  // ----------------------------
  useEffect(() => {
    const calculateTotals = () => {
      // Filter transactions for current budget period
      const currentPeriodTransactions = transactions.filter((t) => {
        // Skip transactions without dates
        if (!t.date) return false;

        const transDate = new Date(t.date);
        const transMonth = transDate.getMonth() + 1; // 1-12
        const transYear = transDate.getFullYear();

        // Include transaction if it matches current budget period
        return (
          transMonth === currentBudgetPeriod.month &&
          transYear === currentBudgetPeriod.year
        );
      });

      const expenses = currentPeriodTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

      const revenues = currentPeriodTransactions
        .filter((t) => t.type === "revenue")
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

      setTotalSpent(expenses);
      setTotalRevenue(revenues);

      // Update filtered transactions for display
      setFilteredTransactions(currentPeriodTransactions);
    };

    calculateTotals();
  }, [transactions, currentBudgetPeriod]);

  // ----------------------------
  // Category & Income Data
  // ----------------------------
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;

      try {
        const userDoc = await getDoc(doc(db, "users", user.id));

        const defaultExpenseCategories = [
          { id: "food", name: "Food" },
          { id: "transport", name: "Transport" },
          { id: "utilities", name: "Utilities" },
          { id: "entertainment", name: "Entertainment" },
          { id: "savings", name: "Savings" },
          { id: "other", name: "Other" },
        ];

        const defaultRevenueCategories = [
          { id: "salary", name: "Salary" },
          { id: "freelance", name: "Freelance" },
          { id: "investments", name: "Investments" },
          { id: "other-income", name: "Other Income" },
        ];

        if (userDoc.exists()) {
          const userData = userDoc.data();

          // Store complete user data in localStorage for component access
          syncUserCurrency(
            userData?.settings?.preferredCurrency || "USD",
            userData
          );

          if (userData.onboardingCompleted === false) {
            setShowOnboarding(true);
            await updateDoc(doc(db, "users", user.id), {
              lastLogin: new Date(),
            });
            setTimeout(() => {
              setShowWelcomeSnackbar(false);
            }, 2000);
          }

          // Load budget period info
          if (userData.currentBudgetPeriod) {
            setCurrentBudgetPeriod(userData.currentBudgetPeriod);
          } else {
            // If no budget period exists, set to current month and save it
            const currentPeriod = {
              year: new Date().getFullYear(),
              month: new Date().getMonth() + 1,
            };
            setCurrentBudgetPeriod(currentPeriod);
            await setDoc(
              doc(db, "users", user.id),
              { currentBudgetPeriod: currentPeriod },
              { merge: true }
            );
          }

          // Load budget period history if it exists
          if (userData.budgetPeriodHistory) {
            setBudgetPeriodHistory(userData.budgetPeriodHistory);
          }

          setMonthlyBudget(userData.monthlyBudget || 0);
          setMonthlyIncome(userData.monthlyIncome || 0);

          const userCategories =
            userData.categories || defaultExpenseCategories;
          setCategories(userCategories);

          const budgets = {};
          let totalBudgetAllocated = 0;
          userCategories.forEach((cat) => {
            budgets[cat.id] = cat.budget || 0;
            totalBudgetAllocated += cat.budget || 0;
          });

          setCategoryBudgets(budgets);
          setTotalAllocated(totalBudgetAllocated);
          setRemainingBudget(userData.monthlyIncome - totalBudgetAllocated);

          setRevenueCategories(
            userData.revenueCategories || defaultRevenueCategories
          );
        } else {
          // Create default user document
          const currentPeriod = {
            year: new Date().getFullYear(),
            month: new Date().getMonth() + 1,
          };

          await setDoc(doc(db, "users", user.id), {
            uid: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            displayName: user.fullName,
            photoURL: user.imageUrl,
            categories: defaultExpenseCategories.map((cat) => ({
              ...cat,
              budget: 0,
            })),
            revenueCategories: defaultRevenueCategories,
            monthlyBudget: 0,
            monthlyIncome: 0,
            currentBudgetPeriod: currentPeriod,
            budgetPeriodHistory: {},
            createdAt: new Date(),
            onboardingCompleted: false,
          });

          setCategories(defaultExpenseCategories);
          setRevenueCategories(defaultRevenueCategories);
          setCurrentBudgetPeriod(currentPeriod);
          setShowOnboarding(true);
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Load alert thresholds and check for alerts whenever relevant data changes
  useEffect(() => {
    // Skip if data isn't loaded yet
    if (isLoading || categories.length === 0) return;

    // Load saved thresholds from database if they exist
    const fetchThresholds = async () => {
      if (user?.id) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.id));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.alertThresholds) {
              setAlertThresholds(userData.alertThresholds);
            }
          }
        } catch (error) {
          console.error("Error fetching alert thresholds:", error);
        }
      }
    };

    // Try to load thresholds from localStorage if not yet loaded from database
    const savedAlerts = localStorage.getItem("categoryAlerts");
    if (savedAlerts) {
      try {
        setCategoryAlerts(JSON.parse(savedAlerts));
      } catch (error) {
        console.error("Error parsing saved alerts:", error);
      }
    }

    fetchThresholds().then(() => {
      // Check thresholds after loading data
      checkCategoryThresholds();
    });
  }, [isLoading, categories, transactions, categoryBudgets]);

  // Calculate savings from dedicated Savings category; if not present, set savings to 0.
  useEffect(() => {
    const savingsCategory = categories.find(
      (cat) => cat.id === "savings" || cat.name.toLowerCase() === "savings"
    );

    if (savingsCategory) {
      setTotalSavings(categoryBudgets[savingsCategory.id] || 0);
    } else {
      setTotalSavings(0);
    }
  }, [categories, categoryBudgets]);

  // Effect to scroll to selected category in budget modal
  useEffect(() => {
    if (openBudgetModal && selectedCategoryId) {
      // Use setTimeout to ensure the modal is rendered before scrolling
      setTimeout(() => {
        const categoryElement = document.getElementById(
          `budget-category-${selectedCategoryId}`
        );
        if (categoryElement) {
          categoryElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 300);
    }
  }, [openBudgetModal, selectedCategoryId]);

  // Welcome message for first-time users
  useEffect(() => {
    const checkFirstTimeUser = async () => {
      if (user && currentUser) {
        try {
          console.log("Checking if user is first-time user", user.id);

          // Check localStorage first for a definitive answer
          const hasSeenWelcome = localStorage.getItem(
            `welcome_seen_${user.id}`
          );

          if (hasSeenWelcome === "true") {
            console.log("User has already seen welcome based on localStorage");
            setIsFirstTimeUser(false);
            return;
          }

          const userDoc = await getDoc(doc(db, "users", user.id));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log("User data for first-time check:", userData);

            // First-time login flag takes priority
            if (userData.isFirstTimeLogin === true) {
              console.log(
                "Found isFirstTimeLogin flag - setting as first-time user"
              );
              setIsFirstTimeUser(true);
              setShowWelcomeSnackbar(true);

              // Mark that they've seen the welcome in both Firestore and localStorage
              await updateDoc(doc(db, "users", user.id), {
                lastLogin: new Date(),
                isFirstTimeLogin: false,
                hasSeenWelcome: true,
              });

              // Set local storage to prevent showing again
              localStorage.setItem(`welcome_seen_${user.id}`, "true");

              setTimeout(() => {
                setShowWelcomeSnackbar(false);
              }, 3000);
              return;
            }

            // Mark as returning user if they've completed onboarding
            if (
              userData.onboardingCompleted === true &&
              userData.hasSeenWelcome === true
            ) {
              console.log(
                "User is a returning user - completed onboarding and has seen welcome"
              );
              setIsFirstTimeUser(false);

              // Always update the login timestamp
              await updateDoc(doc(db, "users", user.id), {
                lastLogin: new Date(),
              });

              // Store in localStorage as well
              localStorage.setItem(`welcome_seen_${user.id}`, "true");
              return;
            }

            // By default, treat as first-time user
            console.log("Default case: treating as first-time user");
            setIsFirstTimeUser(true);

            // Update to mark they've seen the welcome
            await updateDoc(doc(db, "users", user.id), {
              lastLogin: new Date(),
              hasSeenWelcome: true,
            });

            // Set local storage to prevent showing again after page refresh
            localStorage.setItem(`welcome_seen_${user.id}`, "true");
          } else {
            // Document doesn't exist yet - definitely a new user
            console.log(
              "User document doesn't exist yet - setting as first-time user"
            );
            setIsFirstTimeUser(true);
          }
        } catch (error) {
          console.error("Error checking first-time user:", error);
        }
      }
    };

    checkFirstTimeUser();
  }, [user, currentUser]);

  // Generate auto budget allocation based on income and categories
  const generateAutoBudgets = (income, categories, transactions = []) => {
    const needsCategories = ["food", "transport", "utilities", "healthcare"];
    const wantsCategories = ["entertainment", "shopping", "other"];
    const savingsCategories = ["savings", "investments"];

    const userNeeds = categories.filter((cat) =>
      needsCategories.includes(cat.id)
    );
    const userWants = categories.filter((cat) =>
      wantsCategories.includes(cat.id)
    );
    const userSavings = categories.filter((cat) =>
      savingsCategories.includes(cat.id)
    );
    const userOther = categories.filter(
      (cat) =>
        !needsCategories.includes(cat.id) &&
        !wantsCategories.includes(cat.id) &&
        !savingsCategories.includes(cat.id) &&
        cat.id !== "uncategorized" // Exclude uncategorized from allocation
    );

    const needsBudget = income * 0.5;
    const wantsBudget = income * 0.3;
    const savingsBudget = income * 0.2;

    const budgets = {};

    const distributeAmount = (categories, totalAmount, transactions) => {
      if (categories.length === 0) return;

      // Calculate unrounded allocations first
      const unroundedAllocations = {};
      let totalUnrounded = 0;

      if (transactions.length > 0) {
        const categorySpending = {};
        let totalSpent = 0;
        categories.forEach((cat) => {
          const spent = transactions
            .filter((t) => t.category === cat.id && t.type === "expense")
            .reduce((sum, t) => sum + Number(t.amount), 0);
          categorySpending[cat.id] = spent;
          totalSpent += spent;
        });

        if (totalSpent > 0) {
          categories.forEach((cat) => {
            const proportion = categorySpending[cat.id] / totalSpent;
            unroundedAllocations[cat.id] = totalAmount * proportion;
            totalUnrounded += unroundedAllocations[cat.id];
          });
        } else {
          const amountPerCategory = totalAmount / categories.length;
          categories.forEach((cat) => {
            unroundedAllocations[cat.id] = amountPerCategory;
            totalUnrounded += amountPerCategory;
          });
        }
      } else {
        const amountPerCategory = totalAmount / categories.length;
        categories.forEach((cat) => {
          unroundedAllocations[cat.id] = amountPerCategory;
          totalUnrounded += amountPerCategory;
        });
      }

      // Floor all values first to ensure we don't exceed the total
      let allocatedSoFar = 0;
      categories.forEach((cat) => {
        budgets[cat.id] = Math.floor(unroundedAllocations[cat.id]);
        allocatedSoFar += budgets[cat.id];
      });

      // Distribute the remaining amount (to avoid losing money due to rounding)
      const remaining = totalAmount - allocatedSoFar;

      // Sort categories by their fractional parts to determine which ones to round up
      const sortedByFraction = [...categories].sort((a, b) => {
        const fractionA =
          unroundedAllocations[a.id] - Math.floor(unroundedAllocations[a.id]);
        const fractionB =
          unroundedAllocations[b.id] - Math.floor(unroundedAllocations[b.id]);
        return fractionB - fractionA; // Largest fraction first
      });

      // Allocate remaining amount to categories with largest fractional parts
      let remainingToDistribute = Math.round(remaining);
      for (
        let i = 0;
        i < remainingToDistribute && i < sortedByFraction.length;
        i++
      ) {
        budgets[sortedByFraction[i].id] += 1;
      }
    };

    distributeAmount(userNeeds, needsBudget, transactions);
    distributeAmount(userWants, wantsBudget, transactions);
    distributeAmount(userSavings, savingsBudget, transactions);

    // Calculate how much we've allocated so far
    const allocatedBudget = Object.values(budgets).reduce(
      (sum, val) => sum + val,
      0
    );

    // Ensure we never exceed the income
    const remainingBudget = Math.max(0, income - allocatedBudget);

    if (remainingBudget > 0 && userOther.length > 0) {
      distributeAmount(userOther, remainingBudget, transactions);
    }

    // Final check to make sure we haven't allocated more than income
    const finalTotal = Object.values(budgets).reduce(
      (sum, val) => sum + val,
      0
    );
    if (finalTotal > income) {
      // Find the category with the highest budget and reduce it
      const highestCat = Object.entries(budgets).reduce(
        (highest, [id, amount]) =>
          amount > highest.amount ? { id, amount } : highest,
        { id: null, amount: 0 }
      );

      if (highestCat.id) {
        budgets[highestCat.id] -= finalTotal - income;
      }
    }

    return budgets;
  };

  // Apply a budget template
  const applyBudgetTemplate = (templateType) => {
    if (monthlyIncome <= 0) {
      setShowIncomeRequiredMessage(true);
      return;
    }

    let newBudgets = {};

    switch (templateType) {
      case "50-30-20":
        newBudgets = generateAutoBudgets(
          monthlyIncome,
          categories,
          transactions
        );
        break;
      case "zero-based":
        newBudgets = {};
        const evenAmount = Math.floor(monthlyIncome / categories.length);
        categories.forEach((cat) => {
          newBudgets[cat.id] = evenAmount;
        });
        break;
      case "spending-based":
        newBudgets = {};
        const categoryTotals = {};
        let totalSpending = 0;
        categories.forEach((cat) => {
          const catSpending = transactions
            .filter((t) => t.category === cat.id && t.type === "expense")
            .reduce((sum, t) => sum + Number(t.amount), 0);
          categoryTotals[cat.id] = catSpending;
          totalSpending += catSpending;
        });
        if (totalSpending > 0) {
          categories.forEach((cat) => {
            const proportion = categoryTotals[cat.id] / totalSpending;
            newBudgets[cat.id] = Math.round(monthlyIncome * proportion);
          });
        } else {
          const evenAmount = Math.floor(monthlyIncome / categories.length);
          categories.forEach((cat) => {
            newBudgets[cat.id] = evenAmount;
          });
        }
        break;
      default:
        return;
    }

    setCategoryBudgets(newBudgets);
    updateTotalAllocated(newBudgets);
  };

  // Use AI to generate a smart budget allocation
  const applyAISmartBudget = async () => {
    if (monthlyIncome <= 0) {
      setShowIncomeRequiredMessage(true);
      return;
    }

    // Show loading state
    setIsLoading(true);

    try {
      // Prepare data for the OpenAI service
      const userData = {
        transactions: transactions.slice(0, 50), // Use recent transactions for context
        categories: categories,
        monthlyIncome: monthlyIncome,
        existingBudgets: categoryBudgets,
        financialGoals: "Balance spending and saving based on smart allocation", // Default goal
        currency: {
          code: currencyCode,
          symbol: symbol,
        },
      };

      // Call the OpenAI service
      const result = await openaiService.generateSmartBudgetAllocation(
        userData
      );

      if (result.status === "success") {
        // Update budgets with AI recommendation
        setCategoryBudgets(result.categoryBudgets);
        updateTotalAllocated(result.categoryBudgets);

        // Show success message
        alert(
          "AI has created a personalized budget based on your financial profile!"
        );
      } else {
        // Fall back to rule-based if AI fails
        console.error("AI budget generation failed:", result.error);
        alert(
          "Could not generate AI budget. Using standard allocation instead."
        );

        const fallbackBudgets = generateAutoBudgets(
          monthlyIncome,
          categories,
          transactions
        );
        setCategoryBudgets(fallbackBudgets);
        updateTotalAllocated(fallbackBudgets);
      }
    } catch (error) {
      console.error("Error in AI budget generation:", error);

      // Fallback to rule-based system
      alert("Could not generate AI budget. Using standard allocation instead.");
      const fallbackBudgets = generateAutoBudgets(
        monthlyIncome,
        categories,
        transactions
      );
      setCategoryBudgets(fallbackBudgets);
      updateTotalAllocated(fallbackBudgets);
    } finally {
      setIsLoading(false);
    }
  };

  // Update total allocated amount
  const updateTotalAllocated = (budgets) => {
    const total = Object.values(budgets).reduce(
      (sum, amount) => sum + Number(amount || 0),
      0
    );
    setTotalAllocated(total);
    const remaining = monthlyIncome - total;
    setRemainingBudget(remaining);
    setOverAllocated(remaining < 0);
    return total;
  };

  // Check if any category has exceeded its alert threshold
  const checkCategoryThresholds = () => {
    const newAlerts = {};

    categories.forEach((category) => {
      const budget = categoryBudgets[category.id] || 0;
      // Skip categories with disabled thresholds (null value)
      const threshold = alertThresholds[category.id];

      // Only check categories with enabled thresholds and a budget
      if (threshold !== null && threshold !== undefined && budget > 0) {
        // Filter for current period transactions
        const currentPeriodTransactions = transactions.filter((t) => {
          // Skip transactions without dates
          if (!t.date) return false;

          const transDate = new Date(t.date);
          const transMonth = transDate.getMonth() + 1; // 1-12
          const transYear = transDate.getFullYear();

          // Include transaction if it matches current budget period
          return (
            transMonth === currentBudgetPeriod.month &&
            transYear === currentBudgetPeriod.year
          );
        });

        // Calculate spending for this category in current period
        const spent = currentPeriodTransactions
          .filter((t) => t.category === category.id && t.type === "expense")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const percentage = spent / budget;

        // If spending exceeds threshold, create an alert
        if (percentage >= threshold) {
          newAlerts[category.id] = {
            category: category.name,
            spent,
            budget,
            percentage,
            message: `You've spent ${(percentage * 100).toFixed(0)}% of your ${
              category.name
            } budget`,
          };
        }
      }
    });

    setCategoryAlerts(newAlerts);
    // Store alerts in localStorage for persistence
    localStorage.setItem("categoryAlerts", JSON.stringify(newAlerts));

    return newAlerts;
  };

  const handleCategoryBudgetChange = (categoryId, value) => {
    const newBudgets = { ...categoryBudgets };
    newBudgets[categoryId] = Number(value) || 0;
    setCategoryBudgets(newBudgets);
    updateTotalAllocated(newBudgets);
  };

  const handleSmartBudgetAllocation = async () => {
    try {
      setAiLoading(true);

      const userData = {
        transactions,
        categories,
        monthlyIncome,
        existingBudgets: categoryBudgets,
        financialGoals: "Build savings and maintain balanced spending",
        currency: {
          code: currencyCode,
          symbol: symbol,
        },
      };

      const result = await openaiService.generateSmartBudgetAllocation(
        userData
      );

      if (result.status === "success") {
        const validatedBudgets = {};
        categories.forEach((category) => {
          const categoryId = category.id;
          let budgetAmount = Number(result.categoryBudgets[categoryId]);
          if (!isNaN(budgetAmount) && budgetAmount >= 0) {
            validatedBudgets[categoryId] = budgetAmount;
          } else {
            validatedBudgets[categoryId] = categoryBudgets[categoryId] || 0;
          }
        });

        setCategoryBudgets(validatedBudgets);
        updateTotalAllocated(validatedBudgets);
      } else {
        alert(
          "Sorry, we couldn't generate AI budget recommendations. Please try again later."
        );
      }
    } catch (error) {
      console.error("Error in AI budget allocation:", error);
      alert("An error occurred while generating AI budget allocation.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveCategoryBudgets = async () => {
    try {
      if (remainingBudget < 0 && !allowOverBudget) {
        const confirm = window.confirm(
          `Your budget allocations exceed your monthly income by $${Math.abs(
            remainingBudget
          ).toFixed(2)}. \n\n` +
            `Would you like to save anyway? You can adjust these later.`
        );

        if (!confirm) return;
      }

      const updatedCategories = categories.map((cat) => ({
        ...cat,
        budget: categoryBudgets[cat.id] || 0,
      }));

      const totalBudget = updateTotalAllocated(categoryBudgets);

      await setDoc(
        doc(db, "users", user.id),
        {
          categories: updatedCategories,
          monthlyBudget: totalBudget,
          categoryBudgets: categoryBudgets,
          alertThresholds: alertThresholds,
          allowOverBudget: allowOverBudget,
        },
        { merge: true }
      );

      setCategories(updatedCategories);
      setMonthlyBudget(totalBudget);
      setOpenBudgetModal(false);
    } catch (error) {
      console.error("Error saving category budgets:", error);
      alert("Failed to save budget settings. Please try again.");
    }
  };

  const handleIncomeUpdate = async () => {
    if (!newIncome) return;

    const updatedIncome = Number(newIncome);

    try {
      await setDoc(
        doc(db, "users", user.id),
        {
          monthlyIncome: updatedIncome,
        },
        { merge: true }
      );

      setMonthlyIncome(updatedIncome);
      setNewIncome("");
      setOpenIncomeModal(false);

      if (categories.length > 0) {
        const autoBudgets = generateAutoBudgets(
          updatedIncome,
          categories,
          transactions
        );
        setCategoryBudgets(autoBudgets);
        updateTotalAllocated(autoBudgets);
        setOpenBudgetModal(true);
      }
    } catch (error) {
      console.error("Error updating income:", error);
    }
  };

  const handleEditTransaction = async () => {
    if (!editingTransaction || !description || !amount || !category) return;

    const selectedCategory =
      editingTransaction.type === "revenue"
        ? revenueCategories.find((cat) => cat.id === category)
        : categories.find((cat) => cat.id === category);

    const transactionRef = doc(
      db,
      "users",
      user.id,
      "transactions",
      editingTransaction.id
    );
    await updateDoc(transactionRef, {
      description,
      amount: Number(amount),
      category,
      categoryName: selectedCategory?.name || category,
    });

    setTransactions(
      transactions.map((t) =>
        t.id === editingTransaction.id
          ? {
              ...t,
              description,
              amount: Number(amount),
              category,
              categoryName: selectedCategory?.name || category,
            }
          : t
      )
    );

    setOpenEditModal(false);
    setEditingTransaction(null);
    setDescription("");
    setAmount("");
    setCategory("");
  };

  const handleAddCategory = async (categoryName, isRevenue = false) => {
    if (!categoryName.trim()) return;

    try {
      if (editingCategory) {
        const currentCategories = isRevenue ? revenueCategories : categories;
        const updatedCategoryObj = {
          ...editingCategory,
          name: categoryName.trim(),
        };

        const updatedCategories = currentCategories.map((cat) =>
          cat.id === editingCategory.id ? updatedCategoryObj : cat
        );

        await setDoc(
          doc(db, "users", user.id),
          {
            [isRevenue ? "revenueCategories" : "categories"]: updatedCategories,
          },
          { merge: true }
        );

        const updatedTransactions = transactions.map((t) =>
          t.category === editingCategory.id
            ? { ...t, categoryName: updatedCategoryObj.name }
            : t
        );

        if (updatedTransactions.length > 0) {
          const batch = writeBatch(db);
          updatedTransactions.forEach((t) => {
            if (t.category === editingCategory.id) {
              const transRef = doc(db, "users", user.id, "transactions", t.id);
              batch.update(transRef, { categoryName: updatedCategoryObj.name });
            }
          });
          await batch.commit();
        }

        setTransactions(updatedTransactions);
        if (isRevenue) {
          setRevenueCategories(updatedCategories);
        } else {
          setCategories(updatedCategories);
        }
      } else {
        const newCategoryObj = {
          id: categoryName.toLowerCase().replace(/\s+/g, "-"),
          name: categoryName.trim(),
          budget: 0,
        };

        const updatedCategories = isRevenue
          ? [...revenueCategories, newCategoryObj]
          : [...categories, newCategoryObj];

        await setDoc(
          doc(db, "users", user.id),
          {
            [isRevenue ? "revenueCategories" : "categories"]: updatedCategories,
          },
          { merge: true }
        );

        if (isRevenue) {
          setRevenueCategories(updatedCategories);
        } else {
          setCategories(updatedCategories);
          const newBudgets = { ...categoryBudgets };
          newBudgets[newCategoryObj.id] = 0;
          setCategoryBudgets(newBudgets);
        }
      }

      if (isRevenue) {
        setRevenueCategoryDialogOpen(false);
      } else {
        setCategoryDialogOpen(false);
      }

      setEditingCategory(null);
    } catch (error) {
      console.error("Error adding/editing category:", error);
      alert("There was an error updating the category. Please try again.");
    }
  };

  const handleDeleteCategory = async (categoryToDelete, isRevenue = false) => {
    try {
      const currentCategories = isRevenue ? revenueCategories : categories;

      // Prevent deletion of the last category
      if (currentCategories.length <= 1) {
        alert(
          "You cannot delete the last category. At least one category is required."
        );
        return;
      }

      const categoryTransactions = transactions.filter(
        (t) =>
          t.category === categoryToDelete.id &&
          t.type === (isRevenue ? "revenue" : "expense")
      );

      if (categoryTransactions.length > 0) {
        // If there are transactions, ask for a replacement category
        const confirmDelete = window.confirm(
          `This category "${categoryToDelete.name}" has ${categoryTransactions.length} transaction(s). Would you like to reassign these transactions to another category and delete this one?`
        );

        if (!confirmDelete) return;

        // Create a dialog to select a target category
        const dialogContainer = document.createElement("div");
        dialogContainer.style.position = "fixed";
        dialogContainer.style.top = "0";
        dialogContainer.style.left = "0";
        dialogContainer.style.width = "100%";
        dialogContainer.style.height = "100%";
        dialogContainer.style.backgroundColor = "rgba(0,0,0,0.5)";
        dialogContainer.style.display = "flex";
        dialogContainer.style.justifyContent = "center";
        dialogContainer.style.alignItems = "center";
        dialogContainer.style.zIndex = "9999";

        const dialogBox = document.createElement("div");
        dialogBox.style.backgroundColor = "white";
        dialogBox.style.borderRadius = "8px";
        dialogBox.style.padding = "20px";
        dialogBox.style.maxWidth = "500px";
        dialogBox.style.width = "90%";

        const title = document.createElement("h3");
        title.textContent = `Select a category to move ${categoryTransactions.length} transactions to:`;
        title.style.marginBottom = "15px";

        const select = document.createElement("select");
        select.style.width = "100%";
        select.style.padding = "8px";
        select.style.marginBottom = "20px";
        select.style.borderRadius = "4px";
        select.style.border = "1px solid #ccc";

        // Get available categories (excluding the one being deleted)
        const availableCategories = currentCategories.filter(
          (cat) => cat.id !== categoryToDelete.id
        );

        // Add options for each category
        availableCategories.forEach((cat) => {
          const option = document.createElement("option");
          option.value = cat.id;
          option.textContent = cat.name;
          select.appendChild(option);
        });

        const buttonContainer = document.createElement("div");
        buttonContainer.style.display = "flex";
        buttonContainer.style.justifyContent = "flex-end";
        buttonContainer.style.gap = "10px";

        const cancelButton = document.createElement("button");
        cancelButton.textContent = "Cancel";
        cancelButton.style.padding = "8px 16px";
        cancelButton.style.borderRadius = "4px";
        cancelButton.style.border = "1px solid #ccc";
        cancelButton.style.backgroundColor = "#f5f5f5";
        cancelButton.style.cursor = "pointer";

        const confirmButton = document.createElement("button");
        confirmButton.textContent = "Move & Delete";
        confirmButton.style.padding = "8px 16px";
        confirmButton.style.borderRadius = "4px";
        confirmButton.style.border = "none";
        confirmButton.style.backgroundColor = "#1976d2";
        confirmButton.style.color = "white";
        confirmButton.style.cursor = "pointer";

        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(confirmButton);

        dialogBox.appendChild(title);
        dialogBox.appendChild(select);
        dialogBox.appendChild(buttonContainer);
        dialogContainer.appendChild(dialogBox);

        document.body.appendChild(dialogContainer);

        // Handle dialog buttons
        cancelButton.onclick = () => {
          document.body.removeChild(dialogContainer);
        };

        confirmButton.onclick = async () => {
          const targetCategoryId = select.value;
          if (!targetCategoryId) {
            alert("Please select a category.");
            return;
          }

          // Get the name of the target category
          const targetCategory = availableCategories.find(
            (cat) => cat.id === targetCategoryId
          );
          if (!targetCategory) {
            alert("Invalid category selected.");
            document.body.removeChild(dialogContainer);
            return;
          }

          try {
            // Show loading state
            confirmButton.disabled = true;
            confirmButton.textContent = "Processing...";

            // Update all transactions to the new category
            const batch = writeBatch(db);

            for (const transaction of categoryTransactions) {
              const transactionRef = doc(
                db,
                "users",
                user.id,
                "transactions",
                transaction.id
              );
              batch.update(transactionRef, {
                category: targetCategoryId,
                categoryName: targetCategory.name,
              });
            }

            // Commit the batch
            await batch.commit();

            // Delete the category
            const updatedCategories = currentCategories.filter(
              (cat) => cat.id !== categoryToDelete.id
            );

            await setDoc(
              doc(db, "users", user.id),
              {
                [isRevenue ? "revenueCategories" : "categories"]:
                  updatedCategories,
              },
              { merge: true }
            );

            if (isRevenue) {
              setRevenueCategories(updatedCategories);
            } else {
              setCategories(updatedCategories);
              const updatedBudgets = { ...categoryBudgets };
              delete updatedBudgets[categoryToDelete.id];
              setCategoryBudgets(updatedBudgets);
              updateTotalAllocated(updatedBudgets);
            }

            if (isRevenue) {
              setShowAddRevenueCategory(false);
            } else {
              setShowAddCategory(false);
            }

            setEditingCategory(null);

            // Show success message
            alert(
              `Category "${categoryToDelete.name}" has been deleted successfully. ${categoryTransactions.length} transactions were moved to "${targetCategory.name}".`
            );

            // Force refresh of transactions to show updated category assignments
            await fetchTransactions(true);

            // Remove dialog
            document.body.removeChild(dialogContainer);
          } catch (error) {
            console.error("Error processing category deletion:", error);
            alert(
              "There was an error processing your request. Please try again."
            );
            confirmButton.disabled = false;
            confirmButton.textContent = "Move & Delete";
          }
        };
      } else {
        // If no transactions, just confirm and delete
        const confirmDelete = window.confirm(
          `Are you sure you want to delete the "${categoryToDelete.name}" category?`
        );

        if (!confirmDelete) return;

        // Delete the category
        const updatedCategories = currentCategories.filter(
          (cat) => cat.id !== categoryToDelete.id
        );

        await setDoc(
          doc(db, "users", user.id),
          {
            [isRevenue ? "revenueCategories" : "categories"]: updatedCategories,
          },
          { merge: true }
        );

        if (isRevenue) {
          setRevenueCategories(updatedCategories);
        } else {
          setCategories(updatedCategories);
          const updatedBudgets = { ...categoryBudgets };
          delete updatedBudgets[categoryToDelete.id];
          setCategoryBudgets(updatedBudgets);
          updateTotalAllocated(updatedBudgets);
        }

        if (isRevenue) {
          setShowAddRevenueCategory(false);
        } else {
          setShowAddCategory(false);
        }

        setEditingCategory(null);

        // Show success message
        alert(
          `Category "${categoryToDelete.name}" has been deleted successfully.`
        );
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("There was an error deleting the category. Please try again.");
    }
  };

  const handleViewChange = (view) => {
    setActiveView(view);
    if (view === "overview") {
      navigate("/dashboard");
    } else if (view === "anomalies") {
      navigate("/anomalies");
    }
  };

  const handleSignOut = () => {
    signOut();
  };

  // Handle onboarding completion
  const handleOnboardingComplete = async () => {
    try {
      console.log("Handling onboarding completion");

      // Mark onboarding as completed in the database
      await updateDoc(doc(db, "users", user.id), {
        onboardingCompleted: true,
        lastLogin: new Date(),
        isFirstTimeLogin: true, // Use this flag to show welcome message once
        hasSeenWelcome: false, // Will be set to true after they see the welcome
      });

      // Reset the localStorage welcome seen flag to ensure they see welcome message
      localStorage.removeItem(`welcome_seen_${user.id}`);

      // Explicitly set as first-time user when onboarding completes
      setIsFirstTimeUser(true);
      setShowWelcomeSnackbar(true);

      // Close the onboarding flow
      setShowOnboarding(false);

      // Refresh data
      fetchTransactions(true);
      fetchUserData();

      console.log("Onboarding completed successfully, forcing page reload");

      // Force a page reload to ensure the welcome message displays correctly
      window.location.reload();
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
  };

  // ----------------------------
  // Budget Goals Functions
  // ----------------------------
  const fetchBudgetGoals = async () => {
    try {
      setGoalsLoading(true);
      const goalsRef = collection(db, "users", user.id, "budgetGoals");
      const goalsSnapshot = await getDocs(goalsRef);
      const goalsData = [];
      goalsSnapshot.forEach((doc) => {
        goalsData.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setGoals(goalsData);
    } catch (error) {
      console.error("Error fetching budget goals:", error);
    } finally {
      setGoalsLoading(false);
    }
  };

  const handleAddGoal = async (goalData) => {
    try {
      const goalsRef = collection(db, "users", user.id, "budgetGoals");
      const docRef = await addDoc(goalsRef, goalData);
      setGoals([...goals, { id: docRef.id, ...goalData }]);
    } catch (error) {
      console.error("Error adding budget goal:", error);
    }
  };

  const handleUpdateGoal = async (goalData) => {
    try {
      const goalRef = doc(db, "users", user.id, "budgetGoals", goalData.id);
      await updateDoc(goalRef, goalData);
      setGoals(
        goals.map((goal) => (goal.id === goalData.id ? goalData : goal))
      );
    } catch (error) {
      console.error("Error updating budget goal:", error);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      const goalRef = doc(db, "users", user.id, "budgetGoals", goalId);
      await deleteDoc(goalRef);
      setGoals(goals.filter((goal) => goal.id !== goalId));
    } catch (error) {
      console.error("Error deleting budget goal:", error);
    }
  };

  const handleEditBudget = (categoryId) => {
    // Open the budget modal regardless of whether a category is specified
    setOpenBudgetModal(true);

    // If a specific category is provided, store it for the modal to focus on
    if (categoryId) {
      const category = categories.find((cat) => cat.id === categoryId);
      if (category) {
        setSelectedCategoryId(categoryId);
      }
    } else {
      // Reset selected category if no specific category is provided
      setSelectedCategoryId(null);
    }
  };

  // Function to render category spending
  const renderCategorySpending = (categoryId) => {
    const categorySpending = transactions
      .filter((t) => t.category === categoryId && t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const budgetForCategory = categoryBudgets[categoryId] || 0;

    if (budgetForCategory === 0) return null;

    return (
      <Typography variant="body2" color="text.secondary">
        Spent: ${categorySpending.toFixed(2)} (
        {((categorySpending / budgetForCategory) * 100).toFixed(0)}%)
      </Typography>
    );
  };

  useEffect(() => {
    if (user?.id) {
      fetchBudgetGoals();
    }
  }, [user?.id]);

  // ----------------------------
  // Sidebar Component
  // ----------------------------
  const Sidebar = () => (
    <Drawer variant="permanent" sx={dashboardStyles.sidebar}>
      <Box
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "16px 0",
        }}
      >
        <Box
          sx={{
            mb: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Avatar
            src="/logo.png"
            alt="BudgetBridge Logo"
            sx={{
              width: 48,
              height: 48,
              mb: 1,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              background: "linear-gradient(135deg, #22c55e, #0ea5e9)",
              p: 0.75,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Savings sx={{ fontSize: "1.8rem", color: "white" }} />
            </Box>
          </Avatar>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              fontSize: "0.9rem",
              letterSpacing: "0.5px",
              background: "linear-gradient(90deg, #fff, #e0e0e0)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            BudgetBridge
          </Typography>
        </Box>

        <Divider sx={{ mb: 1.5, opacity: 0.2 }} />

        <List
          component="nav"
          sx={{
            flexGrow: 1,
            px: 1,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
          disablePadding
        >
          <ListItem
            button
            onClick={() => setActiveView("overview")}
            selected={activeView === "overview"}
            sx={dashboardStyles.sidebarItem}
            disableGutters
          >
            <ListItemIcon sx={{ minWidth: 28, color: "white", ml: 0.5 }}>
              <AccountBalanceWallet sx={{ fontSize: "1.1rem" }} />
            </ListItemIcon>
            <ListItemText
              primary="Overview"
              primaryTypographyProps={{
                fontSize: "0.85rem",
                fontWeight: activeView === "overview" ? 600 : 400,
              }}
            />
          </ListItem>

          <ListItem
            button
            onClick={() => setActiveView("insights")}
            selected={activeView === "insights"}
            sx={dashboardStyles.sidebarItem}
            disableGutters
          >
            <ListItemIcon sx={{ minWidth: 28, color: "white", ml: 0.5 }}>
              <InsightsOutlined sx={{ fontSize: "1.1rem" }} />
            </ListItemIcon>
            <ListItemText
              primary="Insights"
              primaryTypographyProps={{
                fontSize: "0.85rem",
                fontWeight: activeView === "insights" ? 600 : 400,
              }}
            />
          </ListItem>

          <ListItem
            button
            onClick={() => setActiveView("anomaly")}
            selected={activeView === "anomaly"}
            sx={dashboardStyles.sidebarItem}
            disableGutters
          >
            <ListItemIcon sx={{ minWidth: 28, color: "white", ml: 0.5 }}>
              <WarningAmber sx={{ fontSize: "1.1rem" }} />
            </ListItemIcon>
            <ListItemText
              primary="Anomaly Detection"
              primaryTypographyProps={{
                fontSize: "0.85rem",
                fontWeight: activeView === "anomaly" ? 600 : 400,
              }}
            />
          </ListItem>

          <ListItem
            button
            onClick={() => setActiveView("creditscore")}
            selected={activeView === "creditscore"}
            sx={dashboardStyles.sidebarItem}
            disableGutters
          >
            <ListItemIcon sx={{ minWidth: 28, color: "white", ml: 0.5 }}>
              <Psychology sx={{ fontSize: "1.1rem" }} />
            </ListItemIcon>
            <ListItemText
              primary="Health Score"
              primaryTypographyProps={{
                fontSize: "0.85rem",
                fontWeight: activeView === "creditscore" ? 600 : 400,
              }}
            />
          </ListItem>

          <ListItem
            button
            onClick={() => setActiveView("budget")}
            selected={activeView === "budget"}
            sx={dashboardStyles.sidebarItem}
            disableGutters
          >
            <ListItemIcon sx={{ minWidth: 28, color: "white", ml: 0.5 }}>
              <Savings sx={{ fontSize: "1.1rem" }} />
            </ListItemIcon>
            <ListItemText
              primary="Budget"
              primaryTypographyProps={{
                fontSize: "0.85rem",
                fontWeight: activeView === "budget" ? 600 : 400,
              }}
            />
          </ListItem>

          <ListItem
            button
            onClick={() => setActiveView("recurring")}
            selected={activeView === "recurring"}
            sx={dashboardStyles.sidebarItem}
            disableGutters
          >
            <ListItemIcon sx={{ minWidth: 28, color: "white", ml: 0.5 }}>
              <ScheduleOutlined sx={{ fontSize: "1.1rem" }} />
            </ListItemIcon>
            <ListItemText
              primary="Recurring"
              primaryTypographyProps={{
                fontSize: "0.85rem",
                fontWeight: activeView === "recurring" ? 600 : 400,
              }}
            />
          </ListItem>

          <ListItem
            button
            onClick={() => setActiveView("settings")}
            selected={activeView === "settings"}
            sx={dashboardStyles.sidebarItem}
            disableGutters
          >
            <ListItemIcon sx={{ minWidth: 28, color: "white", ml: 0.5 }}>
              <Settings sx={{ fontSize: "1.1rem" }} />
            </ListItemIcon>
            <ListItemText
              primary="Settings"
              primaryTypographyProps={{
                fontSize: "0.85rem",
                fontWeight: activeView === "settings" ? 600 : 400,
              }}
            />
          </ListItem>
        </List>

        <Divider sx={{ my: 1.5, opacity: 0.2 }} />

        <Box sx={{ px: 1, width: "100%" }}>
          <ListItem
            button
            onClick={handleSignOut}
            sx={{
              ...dashboardStyles.sidebarItem,
              mb: 1.5,
              background: "rgba(239, 68, 68, 0.15)",
              "&:hover": {
                background: "rgba(239, 68, 68, 0.25)",
              },
            }}
            disableGutters
          >
            <ListItemIcon sx={{ minWidth: 28, color: "#ef4444", ml: 0.5 }}>
              <ExitToApp sx={{ fontSize: "1.1rem" }} />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{
                fontSize: "0.85rem",
                color: "#ef4444",
              }}
            />
          </ListItem>
        </Box>
      </Box>
    </Drawer>
  );

  // Add this function to check and handle month transition
  const checkForMonthTransition = () => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // 1-12 for months
    const currentYear = today.getFullYear();

    // Check if we've moved to a new month since last budget setup
    if (
      currentMonth !== currentBudgetPeriod.month ||
      currentYear !== currentBudgetPeriod.year
    ) {
      setShouldResetBudget(true);
    }
  };

  // Add this to handle budget period transitions
  const handleBudgetPeriodTransition = async () => {
    try {
      // Save current budget to history
      const periodKey = `${currentBudgetPeriod.year}-${currentBudgetPeriod.month}`;
      const newBudgetHistory = { ...budgetPeriodHistory };
      newBudgetHistory[periodKey] = {
        monthlyIncome,
        monthlyBudget,
        categoryBudgets: { ...categoryBudgets },
        timestamp: new Date(),
      };

      // Save budget history to database
      await setDoc(
        doc(db, "users", user.id),
        {
          budgetPeriodHistory: newBudgetHistory,
        },
        { merge: true }
      );

      // Update local state
      setBudgetPeriodHistory(newBudgetHistory);

      // Reset for new month
      const updatedBudgetPeriod = {
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
      };

      // Set the new budget period
      setCurrentBudgetPeriod(updatedBudgetPeriod);
      setShouldResetBudget(false);

      // Confirm transition with user
      alert(
        `Your budget has been carried over to the new month (${updatedBudgetPeriod.month}/${updatedBudgetPeriod.year}). You can adjust it as needed.`
      );

      // Save current budget period to DB
      await setDoc(
        doc(db, "users", user.id),
        {
          currentBudgetPeriod: updatedBudgetPeriod,
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error handling budget period transition:", error);
    }
  };

  // Add this effect to check for month transitions on app load and when date changes
  useEffect(() => {
    checkForMonthTransition();

    // Ask user about budget transition if needed
    if (shouldResetBudget && user?.id) {
      const confirmReset = window.confirm(
        "It looks like we're in a new month since your last budget update. Would you like to keep your current budget settings for this month?"
      );

      if (confirmReset) {
        handleBudgetPeriodTransition();
      } else {
        // Just update the period without notification if user declines
        setCurrentBudgetPeriod({
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
        });
        setShouldResetBudget(false);
      }
    }
  }, [shouldResetBudget, user?.id]);

  // Add this new handleUpdateTransaction function after the existing handleSubmitTransaction function

  const handleUpdateTransaction = async (transactionData) => {
    try {
      // Make sure we have an ID
      if (!transactionData.id) {
        console.error("Cannot update transaction: missing ID");
        return;
      }

      await expenseService.updateTransaction(transactionData, user.id);

      // Refresh transactions
      await fetchTransactions(true);

      // Check if any categories have exceeded their budget thresholds
      if (transactionData.type === "expense") {
        checkCategoryThresholds();
      }

      return true;
    } catch (error) {
      console.error("Error updating transaction:", error);
      return false;
    }
  };

  // Add a quick credit score calculation function
  const calculateQuickCreditScore = () => {
    setCreditScoreLoading(true);

    try {
      // Start with base score of 500
      let score = 500;

      // 1. Budget adherence (max 100 points)
      if (monthlyBudget > 0) {
        const budgetRatio = totalSpent / monthlyBudget;

        if (budgetRatio <= 0.05) score += 100; // Exceptional budget management
        else if (budgetRatio <= 0.25)
          score += 95; // Excellent budget management
        else if (budgetRatio <= 0.5) score += 85; // Very good budget management
        else if (budgetRatio <= 0.65) score += 75; // Good budget management
        else if (budgetRatio <= 0.8) score += 60; // Moderate budget management
        else if (budgetRatio <= 0.95) score += 45; // Fair budget management
        else if (budgetRatio <= 1.0) score += 35; // Just within budget
        else if (budgetRatio <= 1.1) score += 20; // Slightly over budget
        else if (budgetRatio <= 1.25) score += 10; // Over budget
        else score += 0; // Significantly over budget
      } else {
        score += 20; // Default if no budget set
      }

      // 2. Savings rate (max 100 points)
      // First check if there's a dedicated savings category
      const savingsCategory = categories.find(
        (cat) => cat.id === "savings" || cat.name.toLowerCase() === "savings"
      );

      if (savingsCategory && categoryBudgets[savingsCategory.id]) {
        const monthlySavings = categoryBudgets[savingsCategory.id];
        const monthlyIncome = totalRevenue > 0 ? totalRevenue : monthlyBudget;

        if (monthlyIncome > 0) {
          const savingsRate = monthlySavings / monthlyIncome;

          if (savingsRate >= 0.3) score += 100;
          else if (savingsRate >= 0.2) score += 80;
          else if (savingsRate >= 0.1) score += 60;
          else if (savingsRate >= 0.05) score += 40;
          else score += 20;
        } else {
          score += 20; // Default if no income recorded
        }
      } else {
        // If no savings category, calculate from income vs expenses
        const income = totalRevenue > 0 ? totalRevenue : monthlyBudget;

        if (income > 0) {
          const savings = income - totalSpent;
          const savingsRate = savings / income;

          if (savingsRate < 0) score += 0;
          else if (savingsRate < 0.05) score += 20;
          else if (savingsRate < 0.1) score += 40;
          else if (savingsRate < 0.2) score += 60;
          else if (savingsRate < 0.3) score += 80;
          else score += 100;
        } else {
          score += 20; // Default if no income recorded
        }
      }

      // 3. Transaction consistency (simplified, max 50 points)
      if (transactions.length >= 10) {
        score += 50;
      } else if (transactions.length > 0) {
        score += Math.round((transactions.length / 10) * 50);
      }

      // 4. Category diversity (simplified, max 50 points)
      const expenseTransactions = transactions.filter((t) => !t.isRevenue);
      const categoriesUsed = new Set(
        expenseTransactions.map((t) => t.category)
      );

      if (categoriesUsed.size >= 8) {
        score += 50;
      } else if (categoriesUsed.size > 0) {
        score += Math.round((categoriesUsed.size / 8) * 50);
      }

      // Ensure score is within 300-850 range
      score = Math.max(300, Math.min(850, score));

      // Set score and label
      setCreditScore(score);

      // Determine score label
      let label, color;
      if (score >= 750) {
        label = "Excellent";
        color = "#4CAF50";
      } else if (score >= 700) {
        label = "Very Good";
        color = "#8BC34A";
      } else if (score >= 650) {
        label = "Good";
        color = "#CDDC39";
      } else if (score >= 600) {
        label = "Fair";
        color = "#FFC107";
      } else if (score >= 550) {
        label = "Poor";
        color = "#FF9800";
      } else {
        label = "Very Poor";
        color = "#F44336";
      }

      setCreditScoreLabel(label);
      setCreditScoreColor(color);
    } catch (error) {
      console.error("Error calculating quick credit score:", error);
      setCreditScore(600);
      setCreditScoreLabel("Fair");
    }

    setCreditScoreLoading(false);
  };

  // Calculate the credit score when relevant data changes
  useEffect(() => {
    if (!isLoading) {
      if (!window.initialCreditScoreCalculated) {
        // Set a flag to indicate we're calculating the initial score
        window.initialCreditScoreCalculated = true;

        // Calculate the score immediately for the dashboard
        calculateQuickCreditScore();

        // Get the full credit score on first render
        if (activeView === "creditscore") {
          setCreditScoreLoading(true);
        }
      }
    }
  }, [isLoading]);

  // Check if we need to trigger the credit score page calculation when switching to it
  useEffect(() => {
    if (activeView === "creditscore" && !isLoading) {
      // Set loading to true so the user knows we're calculating
      setCreditScoreLoading(true);
    }
  }, [activeView, isLoading]);

  // Add a function to update the shared credit score
  const updateSharedCreditScore = (scoreData) => {
    console.log("Dashboard updating credit score:", scoreData);
    // Store the score data in local storage to persist across page refreshes
    try {
      localStorage.setItem("creditScoreData", JSON.stringify(scoreData));
    } catch (e) {
      console.error("Error saving credit score to localStorage:", e);
    }

    setSharedCreditScore(scoreData);
    setCreditScore(scoreData.score);
    setCreditScoreLabel(scoreData.label);
    setCreditScoreColor(scoreData.color);
    setCreditScoreLoading(false);
  };

  // Initialize credit score from localStorage if available
  useEffect(() => {
    console.log("Dashboard initializing credit score from localStorage...");
    try {
      const savedScoreData = localStorage.getItem("creditScoreData");
      if (savedScoreData) {
        const scoreData = JSON.parse(savedScoreData);
        console.log("Dashboard loading saved credit score:", scoreData);
        setSharedCreditScore(scoreData);
        setCreditScore(scoreData.score);
        setCreditScoreLabel(scoreData.label);
        setCreditScoreColor(scoreData.color);
        setCreditScoreLoading(false);
      } else if (!isLoading) {
        // Calculate initial score if no saved score
        console.log("No saved credit score found, calculating initial score");
        calculateQuickCreditScore();
      }
    } catch (e) {
      console.error("Error loading credit score from localStorage:", e);
      if (!isLoading) {
        calculateQuickCreditScore();
      }
    }
  }, [isLoading]);

  // Make the shared credit score available to the CreditScorePage
  useEffect(() => {
    // Expose the credit score update function to the window object
    window.updateDashboardCreditScore = updateSharedCreditScore;

    return () => {
      // Clean up when component unmounts
      delete window.updateDashboardCreditScore;
    };
  }, []);

  // Make setActiveView accessible to other components
  useEffect(() => {
    // Expose the setActiveView function to the window object
    // so child components like CreditScorePage can use it
    window.setActiveView = setActiveView;

    return () => {
      // Clean up when component unmounts
      delete window.setActiveView;
    };
  }, []);

  // Check for navigation requests from credit score component
  useEffect(() => {
    // Check if credit score page has requested navigation
    if (
      window.creditScoreNavigation &&
      window.creditScoreNavigation.requested
    ) {
      const { target } = window.creditScoreNavigation;
      setActiveView(target);

      // Reset the request flag
      window.creditScoreNavigation.requested = false;
    }

    // Set up interval to periodically check for navigation requests
    const checkInterval = setInterval(() => {
      if (
        window.creditScoreNavigation &&
        window.creditScoreNavigation.requested
      ) {
        const { target } = window.creditScoreNavigation;
        setActiveView(target);
        window.creditScoreNavigation.requested = false;
      }
    }, 500);

    return () => clearInterval(checkInterval);
  }, []);

  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [lastLoginTime, setLastLoginTime] = useState(null);

  // Helper function to get time-appropriate greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Helper function to get user's name
  const getUserName = () => {
    return (
      user?.username ||
      user?.firstName ||
      user?.fullName?.split(" ")[0] ||
      "there"
    );
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ ...dashboardStyles.mainContainer, bgcolor: "#f5f5f5" }}>
      <Sidebar />

      <Box component="main" sx={{ ...dashboardStyles.contentArea, p: 3 }}>
        {isLoading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100vh",
            }}
          >
            <CircularProgress />
          </Box>
        ) : showOnboarding ? (
          <OnboardingFlow
            open={true}
            onClose={() => setShowOnboarding(false)}
            onComplete={handleOnboardingComplete}
            userId={user?.id}
            categories={categories}
            generateAIBudgets={generateAutoBudgets}
            onUpdateIncome={(income) => {
              setMonthlyIncome(Number(income));
              // Save income to database
              setDoc(
                doc(db, "users", user.id),
                {
                  monthlyIncome: Number(income),
                },
                { merge: true }
              ).catch((error) => {
                console.error("Error saving income during onboarding:", error);
              });
            }}
            onUpdateBudgets={(budgets) => {
              setCategoryBudgets(budgets);
              const totalBudget = updateTotalAllocated(budgets);

              // Save budgets to database
              const updatedCategories = categories.map((cat) => ({
                ...cat,
                budget: budgets[cat.id] || 0,
              }));

              setDoc(
                doc(db, "users", user.id),
                {
                  categories: updatedCategories,
                  monthlyBudget: totalBudget,
                  categoryBudgets: budgets,
                },
                { merge: true }
              ).catch((error) => {
                console.error("Error saving budgets during onboarding:", error);
              });
            }}
            onUpdateCurrency={handleUpdateCurrency}
          />
        ) : (
          <>
            {activeView === "overview" && (
              <Box
                sx={{
                  background:
                    "linear-gradient(145deg, #f6f9ff 0%, #eef2f9 100%)",
                  borderRadius: 4,
                  p: 3,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                }}
              >
                {/* Welcome Header Section with animated gradient */}
                <Box
                  sx={{
                    mb: 4,
                    p: 3,
                    borderRadius: 3,
                    background:
                      "linear-gradient(135deg, #1a237e 0%, #3949ab 100%)",
                    color: "white",
                    position: "relative",
                    overflow: "hidden",
                    boxShadow: "0 8px 32px rgba(26, 35, 126, 0.2)",
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      opacity: 0.1,
                      background:
                        "radial-gradient(circle at 30% 50%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 70%)",
                      zIndex: 0,
                    }}
                  />

                  {isFirstTimeUser ? (
                    <>
                      <Typography
                        variant="h3"
                        gutterBottom
                        sx={{
                          fontWeight: "bold",
                          mb: 1,
                          position: "relative",
                          zIndex: 1,
                          textShadow: "0 2px 4px rgba(0,0,0,0.2)",
                        }}
                      >
                        Welcome to your financial dashboard, {getUserName()}!
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          position: "relative",
                          zIndex: 1,
                          mb: 2,
                          opacity: 0.9,
                          fontWeight: "normal",
                        }}
                      >
                        We're excited to help you manage your finances. Let's
                        get started tracking your expenses and budgets.
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Typography
                        variant="h3"
                        gutterBottom
                        sx={{
                          fontWeight: "bold",
                          mb: 0.5,
                          position: "relative",
                          zIndex: 1,
                          textShadow: "0 2px 4px rgba(0,0,0,0.2)",
                        }}
                      >
                        {getGreeting()}, {getUserName()}
                      </Typography>

                      <Typography
                        variant="h5"
                        gutterBottom
                        sx={{
                          color: "rgba(255,255,255,0.85)",
                          fontWeight: "medium",
                          mb: 2,
                          position: "relative",
                          zIndex: 1,
                        }}
                      >
                        {new Date().toLocaleString("default", {
                          month: "long",
                          year: "numeric",
                          day: "numeric",
                          weekday: "long",
                        })}
                      </Typography>
                    </>
                  )}

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      background: "rgba(255,255,255,0.15)",
                      backdropFilter: "blur(8px)",
                      borderRadius: 2,
                      p: 1.5,
                      mt: 1,
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: "rgba(255,255,255,0.9)",
                        mr: 1,
                        fontWeight: "medium",
                      }}
                    >
                      Current Budget Period:
                    </Typography>
                    <Chip
                      label={`${new Date(
                        0,
                        currentBudgetPeriod.month - 1
                      ).toLocaleString("default", { month: "long" })} ${
                        currentBudgetPeriod.year
                      }`}
                      size="small"
                      sx={{
                        background: "rgba(255,255,255,0.25)",
                        color: "white",
                        fontWeight: "bold",
                        "& .MuiChip-label": {
                          px: 1.5,
                        },
                      }}
                    />
                    {(new Date().getMonth() + 1 !== currentBudgetPeriod.month ||
                      new Date().getFullYear() !==
                        currentBudgetPeriod.year) && (
                      <Tooltip title="Your budget period doesn't match the current month. Your transactions are being tracked against this budget period.">
                        <InfoOutlined
                          fontSize="small"
                          sx={{ ml: 1, color: "warning.light" }}
                        />
                      </Tooltip>
                    )}
                  </Box>
                </Box>

                {/* Alert Section */}
                {Object.keys(categoryAlerts).length > 0 && (
                  <Box
                    sx={{
                      mb: 4,
                      borderRadius: 3,
                      overflow: "hidden",
                      boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
                    }}
                  >
                    {Object.values(categoryAlerts).map((alert, index) => (
                      <Alert
                        key={alert.category}
                        severity={alert.percentage >= 1 ? "error" : "warning"}
                        sx={{
                          mb:
                            index < Object.values(categoryAlerts).length - 1
                              ? 0.5
                              : 0,
                          borderRadius:
                            index === 0
                              ? "12px 12px 0 0"
                              : index ===
                                Object.values(categoryAlerts).length - 1
                              ? "0 0 12px 12px"
                              : 0,
                          "& .MuiAlert-icon": {
                            fontSize: "1.5rem",
                            alignItems: "center",
                          },
                        }}
                        variant="filled"
                        onClose={() => {
                          const categoryId = Object.keys(categoryAlerts).find(
                            (id) =>
                              categoryAlerts[id].category === alert.category
                          );

                          if (categoryId) {
                            const newAlerts = { ...categoryAlerts };
                            delete newAlerts[categoryId];
                            setCategoryAlerts(newAlerts);
                            localStorage.setItem(
                              "categoryAlerts",
                              JSON.stringify(newAlerts)
                            );
                          }
                        }}
                      >
                        <AlertTitle sx={{ fontWeight: "bold" }}>
                          Budget{" "}
                          {alert.percentage >= 1 ? "Exceeded" : "Warning"}
                        </AlertTitle>
                        <Typography variant="body2">
                          {alert.message}
                          <Typography
                            component="span"
                            sx={{ fontWeight: "bold" }}
                          >
                            ({formatAmount(alert.spent)} of{" "}
                            {formatAmount(alert.budget)})
                          </Typography>
                        </Typography>
                      </Alert>
                    ))}
                  </Box>
                )}

                {/* Financial Summary Section */}
                <Box
                  sx={{
                    mb: 4,
                    display: "flex",
                    gap: 3,
                    flexWrap: { xs: "wrap", md: "nowrap" },
                  }}
                >
                  {/* Income & Budget Summary */}
                  <Paper
                    sx={{
                      flex: 1,
                      p: 3,
                      borderRadius: 3,
                      background: "rgba(255,255,255,0.9)",
                      backdropFilter: "blur(20px)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                      minWidth: { xs: "100%", md: "320px" },
                    }}
                  >
                    <Box sx={{ display: "flex", gap: 4, mb: 3 }}>
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 0.5 }}
                        >
                          Monthly Income
                        </Typography>
                        <Typography
                          variant="h4"
                          sx={{ fontWeight: "bold", color: "#1a237e" }}
                        >
                          {formatAmount(monthlyIncome)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 0.5 }}
                        >
                          Monthly Budget
                        </Typography>
                        <Typography
                          variant="h4"
                          sx={{ fontWeight: "bold", color: "#1a237e" }}
                        >
                          {formatAmount(monthlyBudget)}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={() => setOpenIncomeModal(true)}
                        sx={{
                          borderColor: "#1a237e",
                          color: "#1a237e",
                          borderRadius: 2,
                          fontSize: "0.875rem",
                          textTransform: "none",
                          py: 1,
                          px: 2,
                          fontWeight: "medium",
                        }}
                      >
                        Set Income
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() =>
                          monthlyIncome > 0
                            ? setOpenBudgetModal(true)
                            : setShowIncomeRequiredMessage(true)
                        }
                        disabled={monthlyIncome <= 0}
                        sx={{
                          borderColor: "#1a237e",
                          color: "#1a237e",
                          borderRadius: 2,
                          fontSize: "0.875rem",
                          textTransform: "none",
                          py: 1,
                          px: 2,
                          fontWeight: "medium",
                          "&.Mui-disabled": {
                            borderColor: "rgba(26, 35, 126, 0.3)",
                            color: "rgba(26, 35, 126, 0.3)",
                          },
                        }}
                      >
                        Set Category Budgets
                      </Button>
                    </Box>
                  </Paper>

                  {/* Action buttons for adding transactions */}
                  <Paper
                    elevation={0}
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "row", md: "column" },
                      gap: 2,
                      p: 3,
                      borderRadius: 3,
                      background:
                        "linear-gradient(145deg, #f0f4ff 0%, #e6ecff 100%)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
                      justifyContent: "center",
                      alignItems: "stretch",
                      minWidth: { xs: "100%", md: "200px" },
                    }}
                  >
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<TrendingUp />}
                      onClick={() =>
                        handleOpenTransactionModal({ type: "revenue" })
                      }
                      sx={{
                        borderRadius: 2,
                        py: 1.5,
                        backgroundColor: "#4caf50",
                        boxShadow: "0 6px 20px rgba(76, 175, 80, 0.3)",
                        textTransform: "none",
                        fontWeight: "bold",
                        fontSize: "0.95rem",
                        "&:hover": { backgroundColor: "#43a047" },
                      }}
                    >
                      Add Revenue
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<TrendingDown />}
                      onClick={() =>
                        handleOpenTransactionModal({ type: "expense" })
                      }
                      disabled={totalAllocated <= 0}
                      sx={{
                        borderRadius: 2,
                        py: 1.5,
                        backgroundColor: "#f44336",
                        boxShadow: "0 6px 20px rgba(244, 67, 54, 0.3)",
                        textTransform: "none",
                        fontWeight: "bold",
                        fontSize: "0.95rem",
                        "&:hover": { backgroundColor: "#e53935" },
                        "&.Mui-disabled": {
                          backgroundColor: "rgba(244, 67, 54, 0.5)",
                          color: "rgba(255, 255, 255, 0.7)",
                        },
                      }}
                    >
                      {totalAllocated <= 0 ? "Set Budget First" : "Add Expense"}
                    </Button>
                  </Paper>
                </Box>

                {/* Financial Cards Grid */}
                <Grid container spacing={3} sx={{ mb: 5 }}>
                  <Grid item xs={12} md={4}>
                    <Paper
                      sx={{
                        p: 3,
                        height: "100%",
                        borderRadius: 3,
                        background:
                          "linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)",
                        color: "white",
                        position: "relative",
                        overflow: "hidden",
                        boxShadow: "0 10px 30px rgba(76, 175, 80, 0.3)",
                        transition:
                          "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                        "&:hover": {
                          transform: "translateY(-5px)",
                          boxShadow: "0 14px 40px rgba(76, 175, 80, 0.4)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          top: -30,
                          right: -30,
                          width: 150,
                          height: 150,
                          borderRadius: "50%",
                          background: "rgba(255,255,255,0.1)",
                        }}
                      />
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: -40,
                          left: -40,
                          width: 180,
                          height: 180,
                          borderRadius: "50%",
                          background: "rgba(255,255,255,0.06)",
                        }}
                      />
                      <TrendingUp sx={{ fontSize: 30, mb: 1, opacity: 0.8 }} />
                      <Typography
                        sx={{ fontSize: "1rem", fontWeight: 500, mb: 1 }}
                      >
                        Total Revenue
                      </Typography>
                      <Typography sx={{ fontSize: "2rem", fontWeight: 700 }}>
                        +{formatAmount(totalRevenue)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper
                      sx={{
                        p: 3,
                        height: "100%",
                        borderRadius: 3,
                        background:
                          "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
                        color: "white",
                        position: "relative",
                        overflow: "hidden",
                        boxShadow: "0 10px 30px rgba(244, 67, 54, 0.3)",
                        transition:
                          "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                        "&:hover": {
                          transform: "translateY(-5px)",
                          boxShadow: "0 14px 40px rgba(244, 67, 54, 0.4)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          top: -30,
                          right: -30,
                          width: 150,
                          height: 150,
                          borderRadius: "50%",
                          background: "rgba(255,255,255,0.1)",
                        }}
                      />
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: -40,
                          left: -40,
                          width: 180,
                          height: 180,
                          borderRadius: "50%",
                          background: "rgba(255,255,255,0.06)",
                        }}
                      />
                      <TrendingDown
                        sx={{ fontSize: 30, mb: 1, opacity: 0.8 }}
                      />
                      <Typography
                        sx={{ fontSize: "1rem", fontWeight: 500, mb: 1 }}
                      >
                        Total Expenses
                      </Typography>
                      <Typography sx={{ fontSize: "2rem", fontWeight: 700 }}>
                        -{formatAmount(totalSpent)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper
                      sx={{
                        p: 3,
                        height: "100%",
                        borderRadius: 3,
                        background:
                          "linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)",
                        color: "white",
                        position: "relative",
                        overflow: "hidden",
                        boxShadow: "0 10px 30px rgba(26, 35, 126, 0.3)",
                        transition:
                          "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                        "&:hover": {
                          transform: "translateY(-5px)",
                          boxShadow: "0 14px 40px rgba(26, 35, 126, 0.4)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          top: -30,
                          right: -30,
                          width: 150,
                          height: 150,
                          borderRadius: "50%",
                          background: "rgba(255,255,255,0.1)",
                        }}
                      />
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: -40,
                          left: -40,
                          width: 180,
                          height: 180,
                          borderRadius: "50%",
                          background: "rgba(255,255,255,0.06)",
                        }}
                      />
                      <AccountBalanceWalletOutlined
                        sx={{ fontSize: 30, mb: 1, opacity: 0.8 }}
                      />
                      <Typography
                        sx={{ fontSize: "1rem", fontWeight: 500, mb: 1 }}
                      >
                        Net Balance
                      </Typography>
                      <Typography sx={{ fontSize: "2rem", fontWeight: 700 }}>
                        {formatAmount(
                          monthlyBudget + totalRevenue - totalSpent
                        )}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper
                      sx={{
                        p: 3,
                        height: "100%",
                        borderRadius: 3,
                        background:
                          "linear-gradient(135deg, #2196F3 0%, #1976D2 100%)",
                        color: "white",
                        position: "relative",
                        overflow: "hidden",
                        boxShadow: "0 10px 30px rgba(33, 150, 243, 0.3)",
                        transition:
                          "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                        "&:hover": {
                          transform: "translateY(-5px)",
                          boxShadow: "0 14px 40px rgba(33, 150, 243, 0.4)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          top: -30,
                          right: -30,
                          width: 150,
                          height: 150,
                          borderRadius: "50%",
                          background: "rgba(255,255,255,0.1)",
                        }}
                      />
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: -40,
                          left: -40,
                          width: 180,
                          height: 180,
                          borderRadius: "50%",
                          background: "rgba(255,255,255,0.06)",
                        }}
                      />
                      <MonetizationOnOutlined
                        sx={{ fontSize: 30, mb: 1, opacity: 0.8 }}
                      />
                      <Typography
                        sx={{ fontSize: "1rem", fontWeight: 500, mb: 1 }}
                      >
                        Monthly Budget
                      </Typography>
                      <Typography sx={{ fontSize: "2rem", fontWeight: 700 }}>
                        {formatAmount(monthlyBudget)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper
                      sx={{
                        p: 3,
                        height: "100%",
                        borderRadius: 3,
                        background:
                          "linear-gradient(135deg, #00BCD4 0%, #0097A7 100%)",
                        color: "white",
                        position: "relative",
                        overflow: "hidden",
                        boxShadow: "0 10px 30px rgba(0, 188, 212, 0.3)",
                        transition:
                          "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                        "&:hover": {
                          transform: "translateY(-5px)",
                          boxShadow: "0 14px 40px rgba(0, 188, 212, 0.4)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          top: -30,
                          right: -30,
                          width: 150,
                          height: 150,
                          borderRadius: "50%",
                          background: "rgba(255,255,255,0.1)",
                        }}
                      />
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: -40,
                          left: -40,
                          width: 180,
                          height: 180,
                          borderRadius: "50%",
                          background: "rgba(255,255,255,0.06)",
                        }}
                      />
                      <Savings sx={{ fontSize: 30, mb: 1, opacity: 0.8 }} />
                      <Typography
                        sx={{ fontSize: "1rem", fontWeight: 500, mb: 1 }}
                      >
                        Monthly Savings
                      </Typography>
                      <Typography sx={{ fontSize: "2rem", fontWeight: 700 }}>
                        {formatAmount(totalSavings)}
                      </Typography>
                      {(() => {
                        const savingsCategory = categories.find(
                          (cat) =>
                            cat.id === "savings" ||
                            cat.name.toLowerCase() === "savings"
                        );
                        if (savingsCategory && monthlyIncome > 0) {
                          return (
                            <Box sx={{ mt: 1 }}>
                              <Chip
                                label={`${(
                                  (totalSavings / monthlyIncome) *
                                  100
                                ).toFixed(1)}% of income`}
                                size="small"
                                sx={{
                                  bgcolor: "rgba(255,255,255,0.2)",
                                  color: "white",
                                  fontWeight: "bold",
                                }}
                              />
                            </Box>
                          );
                        }
                        return null;
                      })()}
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper
                      sx={{
                        p: 3,
                        height: "100%",
                        borderRadius: 3,
                        background:
                          "linear-gradient(135deg, #673AB7 0%, #512DA8 100%)",
                        color: "white",
                        position: "relative",
                        overflow: "hidden",
                        cursor: "pointer",
                        boxShadow: "0 10px 30px rgba(103, 58, 183, 0.3)",
                        transition:
                          "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                        "&:hover": {
                          transform: "translateY(-5px)",
                          boxShadow: "0 14px 40px rgba(103, 58, 183, 0.4)",
                        },
                      }}
                      onClick={() => setActiveView("creditscore")}
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          top: -30,
                          right: -30,
                          width: 150,
                          height: 150,
                          borderRadius: "50%",
                          background: "rgba(255,255,255,0.1)",
                        }}
                      />
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: -40,
                          left: -40,
                          width: 180,
                          height: 180,
                          borderRadius: "50%",
                          background: "rgba(255,255,255,0.06)",
                        }}
                      />
                      <ShowChart sx={{ fontSize: 30, mb: 1, opacity: 0.8 }} />
                      <Typography
                        sx={{ fontSize: "1rem", fontWeight: 500, mb: 1 }}
                      >
                        Financial Health Score
                      </Typography>
                      {creditScoreLoading ? (
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <CircularProgress
                            size={20}
                            sx={{ color: "white", mr: 1 }}
                          />
                          <Typography>Calculating...</Typography>
                        </Box>
                      ) : (
                        <>
                          <Typography
                            sx={{ fontSize: "2rem", fontWeight: 700 }}
                          >
                            {creditScore}
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            <Chip
                              label={creditScoreLabel}
                              size="small"
                              sx={{
                                bgcolor: creditScoreColor,
                                color: "white",
                                fontWeight: "bold",
                              }}
                            />
                            <Typography
                              variant="caption"
                              sx={{ display: "block", mt: 1, opacity: 0.8 }}
                            >
                              Click for details
                            </Typography>
                          </Box>
                        </>
                      )}
                    </Paper>
                  </Grid>
                </Grid>

                {/* Transaction List with Enhanced Styling */}
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    overflow: "hidden",
                    background: "white",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                  }}
                >
                  <Box
                    sx={{ p: 2, borderBottom: "1px solid rgba(0,0,0,0.08)" }}
                  >
                    <Typography variant="h6" fontWeight="bold">
                      Recent Transactions
                    </Typography>
                  </Box>
                  <EnhancedTransactionList
                    transactions={paginatedTransactions}
                    onEditTransaction={handleOpenTransactionModal}
                    onDeleteTransaction={handleDeleteTransaction}
                    categories={categories}
                    revenueCategories={revenueCategories}
                    onRefreshTransactions={() => fetchTransactions(true)}
                    isLoading={transactionsLoading}
                    onUpdateTransaction={handleUpdateTransaction}
                  />

                  {hasMoreTransactions && (
                    <Box sx={{ textAlign: "center", p: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={() => fetchTransactions(false)}
                        disabled={transactionsLoading}
                        sx={{
                          borderRadius: 2,
                          textTransform: "none",
                          px: 4,
                        }}
                      >
                        {transactionsLoading
                          ? "Loading..."
                          : "Load More Transactions"}
                      </Button>
                    </Box>
                  )}
                </Paper>
              </Box>
            )}

            {activeView === "insights" && (
              <Box sx={dashboardStyles.animatedElement}>
                <Typography variant="h4" gutterBottom>
                  Spending Insights
                </Typography>
                <SpendingInsights
                  transactions={transactions}
                  monthlyBudget={monthlyBudget}
                  categoryBudgets={categoryBudgets}
                  categories={categories}
                  monthlyIncome={monthlyIncome}
                />
              </Box>
            )}

            {activeView === "anomaly" && (
              <Box sx={dashboardStyles.animatedElement}>
                <Typography variant="h4" gutterBottom>
                  AI Anomaly Detection
                </Typography>
                <AnomalyDashboard categories={categories} />
              </Box>
            )}

            {activeView === "creditscore" && (
              <Box sx={dashboardStyles.animatedElement}>
                <Typography variant="h4" gutterBottom>
                  Financial Health Score
                </Typography>
                <CreditScorePage
                  transactions={transactions}
                  monthlyBudget={monthlyBudget}
                  totalSpent={totalSpent}
                  totalRevenue={totalRevenue}
                  categoryBudgets={categoryBudgets}
                  categories={categories}
                  monthlyIncome={monthlyIncome}
                  totalSavings={totalSavings}
                />
              </Box>
            )}

            {activeView === "budget" && (
              <Box sx={dashboardStyles.animatedElement}>
                <BudgetManagementPage
                  categories={categories}
                  categoryBudgets={categoryBudgets}
                  transactions={transactions}
                  currentMonth={currentMonth}
                  onEditBudget={handleEditBudget}
                />
              </Box>
            )}

            {activeView === "recurring" && (
              <RecurringTransactionSetup
                recurringTransactions={recurringTransactions}
                onCreateRecurring={handleAddRecurring}
                onDeleteRecurring={handleDeleteRecurring}
                onUpdateRecurring={handleEditRecurring}
                categories={categories}
                revenueCategories={revenueCategories}
                loading={recurringTransactionsLoading}
                paymentMethods={paymentMethods}
              />
            )}

            {activeView === "settings" && <SettingsPage />}
          </>
        )}
      </Box>

      {/* Category Budget Management Modal */}
      <Modal
        open={openBudgetModal}
        onClose={() => {
          setOpenBudgetModal(false);
          setSelectedCategoryId(null); // Reset selected category when closing modal
        }}
        aria-labelledby="category-budget-title"
      >
        <Box
          sx={{
            width: 600,
            maxWidth: "90vw",
            p: 3,
            bgcolor: "background.paper",
            borderRadius: 2,
            maxHeight: "80vh",
            overflow: "auto",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <Typography variant="h5" id="category-budget-title" gutterBottom>
            Budget Management
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <Typography
                variant="body1"
                sx={{ fontSize: "1.1rem", fontWeight: "medium" }}
              >
                Monthly Income: {formatAmount(monthlyIncome)}
              </Typography>
              <Box>
                <Tooltip title="Let AI allocate your budget based on your spending patterns and financial best practices">
                  <Button
                    id="ai-smart-budget-btn"
                    variant="outlined"
                    size="small"
                    startIcon={
                      aiLoading ? <CircularProgress size={16} /> : <SmartToy />
                    }
                    onClick={handleSmartBudgetAllocation}
                    disabled={aiLoading}
                    color="primary"
                    sx={{ mb: 1 }}
                  >
                    {aiLoading ? "Generating..." : "AI Smart Budget"}
                  </Button>
                </Tooltip>
              </Box>
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Total Allocated:
              </Typography>
              <Typography
                variant="body1"
                color={isOverAllocated ? "error.main" : "text.primary"}
                fontWeight="medium"
              >
                {formatAmount(totalAllocated)}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Remaining to Allocate:
              </Typography>
              <Typography
                variant="body1"
                color={isOverAllocated ? "error.main" : "success.main"}
                fontWeight="medium"
              >
                {formatAmount(monthlyIncome - totalAllocated)}
              </Typography>
            </Box>

            <Card
              sx={{
                mt: 2,
                bgcolor: isOverAllocated
                  ? "rgba(244, 67, 54, 0.05)"
                  : "transparent",
                border: isOverAllocated ? "1px solid" : "none",
                borderColor: "error.light",
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ display: "flex", alignItems: "center" }}
                  >
                    <AccountBalanceWallet
                      fontSize="small"
                      sx={{ mr: 1, color: "primary.main" }}
                    />
                    Allocated: {formatAmount(totalAllocated)}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color:
                        remainingBudget >= 0 ? "success.main" : "error.main",
                      fontWeight: "medium",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {remainingBudget >= 0 ? (
                      <>
                        <Savings fontSize="small" sx={{ mr: 1 }} />
                        Remaining: {formatAmount(Math.abs(remainingBudget))}
                      </>
                    ) : (
                      <>
                        <ErrorOutline fontSize="small" sx={{ mr: 1 }} />
                        Over-allocated:{" "}
                        {formatAmount(Math.abs(remainingBudget))}
                      </>
                    )}
                  </Typography>
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={Math.min((totalAllocated / monthlyIncome) * 100, 100)}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    mt: 2,
                    bgcolor: "grey.200",
                    "& .MuiLinearProgress-bar": {
                      bgcolor:
                        remainingBudget >= 0 ? "success.main" : "error.main",
                    },
                  }}
                />
              </CardContent>

              {isOverAllocated && (
                <Box
                  sx={{
                    px: 2,
                    pb: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography variant="caption" color="error">
                    Your budget exceeds your income by{" "}
                    {formatAmount(Math.abs(remainingBudget))}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Typography variant="caption" sx={{ mr: 1 }}>
                      Allow over-budget
                    </Typography>
                    <Switch
                      id="allow-over-budget-switch"
                      size="small"
                      checked={allowOverBudget}
                      onChange={(e) => setAllowOverBudget(e.target.checked)}
                    />
                  </Box>
                </Box>
              )}
            </Card>
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
              mt: 3,
            }}
          >
            <Typography variant="h6">Categories</Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddCircleOutline />}
              onClick={() => {
                setEditingCategory(null);
                setCategoryDialogOpen(true);
              }}
            >
              Add Category
            </Button>
          </Box>

          <List>
            {categories.map((category) => {
              const categorySpending = transactions
                .filter(
                  (t) => t.category === category.id && t.type === "expense"
                )
                .reduce((sum, t) => sum + Number(t.amount), 0);
              const budgetForCategory = categoryBudgets[category.id] || 0;
              const spendingPercentage =
                budgetForCategory > 0
                  ? Math.min((categorySpending / budgetForCategory) * 100, 100)
                  : 0;

              const isSavingsCategory =
                category.id === "savings" ||
                category.name.toLowerCase() === "savings";

              return (
                <ListItem
                  key={category.id}
                  id={`budget-category-${category.id}`}
                  sx={{
                    mb: 1,
                    p: 2,
                    bgcolor: isSavingsCategory
                      ? "rgba(224, 247, 250, 0.5)"
                      : selectedCategoryId === category.id
                      ? "rgba(33, 150, 243, 0.1)" // Highlight selected category
                      : "grey.50",
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor:
                      selectedCategoryId === category.id
                        ? "primary.main"
                        : isSavingsCategory
                        ? "#00acc1"
                        : "grey.200",
                    transition: "all 0.3s ease",
                  }}
                >
                  <Box sx={{ width: "100%" }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="subtitle1">
                        {category.name}
                      </Typography>
                      <Box>
                        <Tooltip title="Edit Category">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingCategory(category);
                              setCategoryDialogOpen(true);
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Category">
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleDeleteCategory(category, false)
                            }
                            sx={{ color: "error.main" }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={7}>
                        <AccessibleTextField
                          id={`category-budget-${category.id}`}
                          name={`category-budget-${category.id}`}
                          fullWidth
                          label="Monthly Budget"
                          type="number"
                          value={categoryBudgets[category.id] || ""}
                          onChange={(e) =>
                            handleCategoryBudgetChange(
                              category.id,
                              e.target.value
                            )
                          }
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                {symbol}
                              </InputAdornment>
                            ),
                          }}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={5}>
                        <Box>
                          <Typography variant="body2">
                            {(
                              ((categoryBudgets[category.id] || 0) /
                                monthlyIncome) *
                              100
                            ).toFixed(1)}
                            % of income
                          </Typography>

                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              mt: 1,
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                mr: 1,
                              }}
                            >
                              <InfoOutlined
                                fontSize="inherit"
                                sx={{ mr: 0.5, fontSize: "14px" }}
                              />
                              Spent: {formatAmount(categorySpending)}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ fontWeight: "bold" }}
                            >
                              Budget:{" "}
                              {formatAmount(categoryBudgets[category.id] || 0)}
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mt: 0.5,
                            }}
                          >
                            <LinearProgress
                              variant="determinate"
                              value={spendingPercentage}
                              sx={{
                                flexGrow: 1,
                                height: 8,
                                borderRadius: 4,
                                bgcolor: "grey.200",
                                "& .MuiLinearProgress-bar": {
                                  bgcolor:
                                    spendingPercentage > 90
                                      ? "error.main"
                                      : spendingPercentage > 75
                                      ? "warning.main"
                                      : "success.main",
                                },
                              }}
                            />
                          </Box>
                        </Box>
                      </Grid>

                      {/* Add threshold input field with checkbox */}
                      <Grid item xs={12}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", mt: 1 }}
                        >
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={
                                  alertThresholds[category.id] !== null &&
                                  alertThresholds[category.id] !== undefined
                                }
                                onChange={(e) => {
                                  const newThresholds = { ...alertThresholds };
                                  if (e.target.checked) {
                                    newThresholds[category.id] = 0.8; // Default to 80%
                                  } else {
                                    newThresholds[category.id] = null; // Null means disabled
                                  }
                                  setAlertThresholds(newThresholds);
                                }}
                                size="small"
                              />
                            }
                            label="Enable budget alert"
                          />

                          {alertThresholds[category.id] !== null &&
                            alertThresholds[category.id] !== undefined && (
                              <>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ mr: 1 }}
                                >
                                  Alert at:
                                </Typography>
                                <AccessibleTextField
                                  id={`threshold-${category.id}`}
                                  name={`threshold-${category.id}`}
                                  type="number"
                                  value={
                                    alertThresholds[category.id] === null
                                      ? ""
                                      : Math.round(
                                          (alertThresholds[category.id] ||
                                            0.8) * 100
                                        )
                                  }
                                  onChange={(e) => {
                                    const newThresholds = {
                                      ...alertThresholds,
                                    };
                                    if (e.target.value === "") {
                                      newThresholds[category.id] = null;
                                    } else {
                                      const rawValue = parseInt(
                                        e.target.value,
                                        10
                                      );
                                      if (!isNaN(rawValue)) {
                                        const val = Math.min(
                                          Math.max(1, rawValue),
                                          100
                                        );
                                        newThresholds[category.id] = val / 100;
                                      }
                                    }
                                    setAlertThresholds(newThresholds);
                                  }}
                                  InputProps={{
                                    endAdornment: <Typography>%</Typography>,
                                    inputProps: {
                                      min: 1,
                                      max: 100,
                                      inputMode: "numeric",
                                      pattern: "[0-9]*",
                                    },
                                  }}
                                  size="small"
                                  sx={{ width: 100 }}
                                  variant="outlined"
                                />
                                <Tooltip title="You will receive an alert when spending reaches this percentage of your budget">
                                  <InfoOutlined
                                    fontSize="small"
                                    sx={{ ml: 1, color: "text.secondary" }}
                                  />
                                </Tooltip>
                              </>
                            )}
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </ListItem>
              );
            })}
          </List>

          <Box sx={{ mt: 3, mb: 3 }}>
            <Typography variant="body2" gutterBottom>
              Quick Budget Templates:
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip
                id="budget-template-ai-smart"
                label={isLoading ? "Loading..." : "AI Smart Budget"}
                onClick={applyAISmartBudget}
                clickable
                color="primary"
                variant="outlined"
                icon={isLoading ? <CircularProgress size={16} /> : <SmartToy />}
                disabled={isLoading}
              />
              <Chip
                id="budget-template-zero-based"
                label="Zero-Based Budget"
                onClick={() => applyBudgetTemplate("zero-based")}
                clickable
                color="primary"
                variant="outlined"
              />
              <Chip
                id="budget-template-spending-based"
                label="Based on Spending"
                onClick={() => applyBudgetTemplate("spending-based")}
                clickable
                color="primary"
                variant="outlined"
              />
            </Box>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Button variant="contained" onClick={handleSaveCategoryBudgets}>
              Save Budgets
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Income Update Modal */}
      <Modal
        open={openIncomeModal}
        onClose={() => setOpenIncomeModal(false)}
        aria-labelledby="income-update-title"
      >
        <Box
          sx={{
            width: 400,
            maxWidth: "90vw",
            p: 3,
            bgcolor: "background.paper",
            borderRadius: 2,
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <Typography variant="h5" id="income-update-title" gutterBottom>
            Update Income
          </Typography>
          <AccessibleTextField
            id="new-income"
            label={`Monthly Income (${formatAmount(0).replace("0", "")})`}
            type="number"
            value={newIncome}
            onChange={(e) => setNewIncome(e.target.value)}
            fullWidth
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Button variant="contained" onClick={handleIncomeUpdate}>
              Save Income
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Transaction Modal */}
      <AccessibleDialog
        open={transactionModal}
        onClose={handleCloseTransactionModal}
        maxWidth="md"
        fullWidth
        title={
          currentTransaction?.id
            ? "Edit Transaction"
            : currentTransaction?.type === "revenue"
            ? "Add Revenue"
            : "Add Expense"
        }
        id="transaction-modal"
      >
        <DialogTitle id="transaction-modal-title">
          {currentTransaction?.id
            ? "Edit Transaction"
            : currentTransaction?.type === "revenue"
            ? "Add Revenue"
            : "Add Expense"}
        </DialogTitle>
        <DialogContent>
          <TransactionForm
            transaction={currentTransaction}
            onSubmit={handleSubmitTransaction}
            onCancel={handleCloseTransactionModal}
            categories={categories}
            revenueCategories={revenueCategories}
            onAddCategory={(type) => {
              setEditingCategory(null);
              if (type === "revenue") {
                setRevenueCategoryDialogOpen(true);
              } else {
                setCategoryDialogOpen(true);
              }
            }}
            paymentMethods={paymentMethods}
            allTransactions={transactions}
          />
        </DialogContent>
      </AccessibleDialog>

      {/* Edit Transaction Modal */}
      <AccessibleDialog
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        maxWidth="sm"
        fullWidth
        title="Edit Transaction"
        id="edit-transaction-modal"
      >
        <DialogTitle id="edit-transaction-title">Edit Transaction</DialogTitle>
        <DialogContent>
          <AccessibleTextField
            id="edit-description"
            name="edit-description"
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <AccessibleTextField
            id="edit-amount"
            name="edit-amount"
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <AccessibleTextField
            id="edit-category"
            name="edit-category"
            select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          >
            {categories.concat(revenueCategories).map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>
                {cat.name}
              </MenuItem>
            ))}
          </AccessibleTextField>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <AccessibleButton
              variant="contained"
              onClick={handleEditTransaction}
              id="save-edit-transaction"
              name="save-edit-transaction"
              label="Save Changes"
            >
              Save Changes
            </AccessibleButton>
          </Box>
        </DialogContent>
      </AccessibleDialog>

      <Snackbar
        open={showWelcomeSnackbar}
        autoHideDuration={3000}
        onClose={() => setShowWelcomeSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success">
          {isFirstTimeUser
            ? `Welcome to your new financial dashboard, ${getUserName()}!`
            : `Welcome back, ${getUserName()}! Ready to manage your finances?`}
        </Alert>
      </Snackbar>

      <CategoryDialog
        open={categoryDialogOpen}
        onClose={() => {
          setCategoryDialogOpen(false);
          setEditingCategory(null);
        }}
        onSave={(categoryName) => handleAddCategory(categoryName, false)}
        onDelete={(category) => {
          handleDeleteCategory(category, false);
          setCategoryDialogOpen(false);
        }}
        editingCategory={editingCategory}
        isRevenue={false}
      />

      {/* Anomaly Notification */}
      <Snackbar
        open={anomalyNotification.open}
        autoHideDuration={6000}
        onClose={() =>
          setAnomalyNotification({ ...anomalyNotification, open: false })
        }
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity="warning"
          sx={{ width: "100%" }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                setAnomalyNotification({ ...anomalyNotification, open: false });
                setActiveView("anomaly");
              }}
            >
              View
            </Button>
          }
        >
          {anomalyNotification.message}
        </Alert>
      </Snackbar>

      <CategoryDialog
        open={revenueCategoryDialogOpen}
        onClose={() => {
          setRevenueCategoryDialogOpen(false);
          setEditingCategory(null);
        }}
        onSave={(categoryName) => handleAddCategory(categoryName, true)}
        onDelete={(category) => {
          handleDeleteCategory(category, true);
          setRevenueCategoryDialogOpen(false);
        }}
        editingCategory={editingCategory}
        isRevenue={true}
      />

      {/* Onboarding Flow */}
      <OnboardingFlow
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
        userId={user?.id}
        categories={categories}
        transactions={transactions}
        onUpdateIncome={(income) => {
          setMonthlyIncome(Number(income));
          // Save income to database
          setDoc(
            doc(db, "users", user.id),
            {
              monthlyIncome: Number(income),
            },
            { merge: true }
          ).catch((error) => {
            console.error("Error saving income during onboarding:", error);
          });
        }}
        onUpdateBudgets={(budgets) => {
          setCategoryBudgets(budgets);
          const totalBudget = updateTotalAllocated(budgets);

          // Save budgets to database
          const updatedCategories = categories.map((cat) => ({
            ...cat,
            budget: budgets[cat.id] || 0,
          }));

          setDoc(
            doc(db, "users", user.id),
            {
              categories: updatedCategories,
              monthlyBudget: totalBudget,
              categoryBudgets: budgets,
            },
            { merge: true }
          ).catch((error) => {
            console.error("Error saving budgets during onboarding:", error);
          });
        }}
        generateAIBudgets={async (income, categories) => {
          try {
            // Use the same AI-powered budget allocation for onboarding
            const userData = {
              transactions: transactions.slice(0, 50), // Use recent transactions for context (if any)
              categories: categories,
              monthlyIncome: income,
              existingBudgets: {},
              financialGoals: "Smart allocation for new user", // Default goal for onboarding
            };

            // Call the OpenAI service
            const result = await openaiService.generateSmartBudgetAllocation(
              userData
            );

            if (result.status === "success") {
              return result.categoryBudgets;
            } else {
              // Fallback to rule-based if AI fails
              console.error(
                "AI budget generation failed during onboarding:",
                result.error
              );
              return generateAutoBudgets(income, categories, transactions);
            }
          } catch (error) {
            console.error(
              "Error in AI budget generation during onboarding:",
              error
            );
            // Fallback to rule-based system
            return generateAutoBudgets(income, categories, transactions);
          }
        }}
        onUpdateCurrency={handleUpdateCurrency}
      />
    </Box>
  );
};

export default Dashboard;
