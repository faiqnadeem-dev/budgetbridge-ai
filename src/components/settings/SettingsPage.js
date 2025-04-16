import React, { useState, useEffect } from "react";
import { UserProfile, useUser } from "@clerk/clerk-react";
import {
  Box,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Grid,
  Card,
  CardContent,
  useTheme,
  CircularProgress,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  RadioGroup,
  Radio,
} from "@mui/material";
import {
  CloudDownload,
  AccountCircle,
  SettingsApplications,
  CurrencyExchange,
} from "@mui/icons-material";
import { currencies } from "../../utils/currencyUtils";
import { useCurrency } from "../../contexts/CurrencyContext";
import { db } from "../../config/firebase";
import {
  doc,
  updateDoc,
  getDoc,
  getDocs,
  collection,
} from "firebase/firestore";

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `settings-tab-${index}`,
    "aria-controls": `settings-tabpanel-${index}`,
  };
}

const SettingsPage = () => {
  const { user } = useUser();
  const [tabValue, setTabValue] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [updatingCurrency, setUpdatingCurrency] = useState(false);
  const theme = useTheme();

  // Use our currency context
  const { currencyCode, updateCurrency } = useCurrency();
  const [selectedCurrency, setSelectedCurrency] = useState(currencyCode);

  // Update selected currency when the context's currency changes
  useEffect(() => {
    setSelectedCurrency(currencyCode);
  }, [currencyCode]);

  const [exportFormat, setExportFormat] = useState("csv"); // Default to CSV

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      // Fetch user data from Firestore - this contains categories and budgets
      const userDocRef = doc(db, "users", user.id);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data() || {};

      // Fetch transactions
      const transactionsSnapshot = await getDocs(
        collection(db, "users", user.id, "transactions")
      );
      const transactions = [];
      transactionsSnapshot.forEach((doc) => {
        transactions.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Extract categories directly from user document
      const categories = userData.categories || [];
      const revenueCategories = userData.revenueCategories || [];

      // Create budgets from category budget data
      const budgets = [];
      if (userData.categories) {
        userData.categories.forEach((category) => {
          if (category.budget && category.budget > 0) {
            budgets.push({
              id: `budget-${category.id}`,
              category: category.id,
              categoryName: category.name,
              amount: category.budget,
              period: "monthly",
            });
          }
        });
      }

      let dataBlob, url, filename;

      if (exportFormat === "csv") {
        // Start building CSV content with sections
        let csvContent = "";

        // Add transactions section if there are any
        if (transactions.length > 0) {
          const transactionsCsv = transactions
            .map((t) => {
              // Handle potential missing fields with defaults and escape commas in text fields
              const description = (t.description || "").replace(/,/g, ";");
              const merchant = (t.merchant || "").replace(/,/g, ";");
              return `${t.id || ""},${t.date || ""},${
                t.category || ""
              },${merchant},${t.amount || 0},${
                t.type || "expense"
              },${description}`;
            })
            .join("\n");

          csvContent +=
            "# Transactions\nid,date,category,merchant,amount,type,description\n" +
            transactionsCsv;
        } else {
          csvContent += "# Transactions\nNo transactions found.";
        }

        // Add categories section for expense categories
        if (categories.length > 0) {
          const categoriesCsv = categories
            .map((c) => {
              const name = (c.name || "").replace(/,/g, ";");
              return `${c.id || ""},${name},${c.color || ""},${c.budget || 0}`;
            })
            .join("\n");

          csvContent +=
            "\n\n# Expense Categories\nid,name,color,budget\n" + categoriesCsv;
        } else {
          csvContent +=
            "\n\n# Expense Categories\nNo expense categories found.";
        }

        // Add revenue categories section
        if (revenueCategories.length > 0) {
          const revenueCategoriesCsv = revenueCategories
            .map((c) => {
              const name = (c.name || "").replace(/,/g, ";");
              return `${c.id || ""},${name},${c.color || ""}`;
            })
            .join("\n");

          csvContent +=
            "\n\n# Revenue Categories\nid,name,color\n" + revenueCategoriesCsv;
        } else {
          csvContent +=
            "\n\n# Revenue Categories\nNo revenue categories found.";
        }

        // Add budgets section if there are any
        if (budgets.length > 0) {
          const budgetsCsv = budgets
            .map((b) => {
              return `${b.id || ""},${b.category || ""},${
                b.categoryName || ""
              },${b.amount || 0},${b.period || "monthly"}`;
            })
            .join("\n");

          csvContent +=
            "\n\n# Budgets\nid,category,categoryName,amount,period\n" +
            budgetsCsv;
        } else {
          csvContent += "\n\n# Budgets\nNo explicit budgets found.";
        }

        // Add user settings
        csvContent += "\n\n# Settings";
        csvContent += `\nMonthly Budget: ${userData.monthlyBudget || 0}`;
        csvContent += `\nMonthly Income: ${userData.monthlyIncome || 0}`;
        csvContent += `\nPreferred Currency: ${
          userData?.settings?.preferredCurrency || "USD"
        }`;

        // Create CSV file
        dataBlob = new Blob([csvContent], { type: "text/csv" });
        filename = `finance-data-export-${
          new Date().toISOString().split("T")[0]
        }.csv`;
      } else {
        // For JSON, ensure we're exporting sensible data even if collections are empty
        const exportData = {
          userData: {
            displayName: userData.displayName,
            email: userData.email,
            monthlyBudget: userData.monthlyBudget || 0,
            monthlyIncome: userData.monthlyIncome || 0,
            settings: userData.settings || {},
          },
          transactions: transactions || [],
          categories: categories || [],
          revenueCategories: revenueCategories || [],
          budgets: budgets || [],
          exportDate: new Date().toISOString(),
          summary: {
            transactionCount: transactions.length,
            categoryCount: categories.length,
            revenueCategoryCount: revenueCategories.length,
            budgetCount: budgets.length,
            totalAllocatedBudget: budgets.reduce(
              (sum, b) => sum + (b.amount || 0),
              0
            ),
          },
        };

        // Export as JSON
        const dataStr = JSON.stringify(exportData, null, 2);
        dataBlob = new Blob([dataStr], { type: "application/json" });
        filename = `finance-data-export-${
          new Date().toISOString().split("T")[0]
        }.json`;
      }

      url = URL.createObjectURL(dataBlob);

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSnackbar({
        open: true,
        message: `Your data was exported successfully as ${exportFormat.toUpperCase()}!`,
        severity: "success",
      });
    } catch (error) {
      console.error("Export error:", error);
      setSnackbar({
        open: true,
        message: "Failed to export data. Please try again.",
        severity: "error",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleExportFormatChange = (event) => {
    setExportFormat(event.target.value);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Update the currency change handler to use our context
  const handleCurrencyChange = async (event) => {
    const newCurrency = event.target.value;
    setSelectedCurrency(newCurrency);
    setUpdatingCurrency(true);

    try {
      // Update the user's currency preference in Firestore
      await updateDoc(doc(db, "users", user.id), {
        "settings.preferredCurrency": newCurrency,
      });

      // Use our context to update currency across the app
      updateCurrency(newCurrency);

      setSnackbar({
        open: true,
        message: `Currency updated to ${currencies[newCurrency].name}`,
        severity: "success",
      });
    } catch (error) {
      console.error("Error updating currency preference:", error);
      setSnackbar({
        open: true,
        message: "Failed to update currency. Please try again.",
        severity: "error",
      });
    } finally {
      setUpdatingCurrency(false);
    }
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        p: 3,
        width: "100%",
        height: "100%",
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ mb: 4, fontWeight: "bold" }}
      >
        Settings
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="settings tabs"
        >
          <Tab
            icon={<SettingsApplications />}
            label="General"
            {...a11yProps(0)}
          />
          <Tab icon={<AccountCircle />} label="Profile" {...a11yProps(1)} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Currency Selection Card */}
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  Currency Preferences
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="textSecondary" paragraph>
                  Choose your preferred currency for all transactions and
                  budgets.
                </Typography>
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="currency-select-label">Currency</InputLabel>
                  <Select
                    labelId="currency-select-label"
                    id="currency-select"
                    value={selectedCurrency}
                    onChange={handleCurrencyChange}
                    label="Currency"
                    startAdornment={
                      updatingCurrency ? (
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                      ) : (
                        <CurrencyExchange sx={{ mr: 1 }} />
                      )
                    }
                  >
                    {Object.values(currencies).map((currency) => (
                      <MenuItem key={currency.code} value={currency.code}>
                        {currency.symbol} - {currency.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>

          {/* Export Data Card */}
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  Export Data
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="textSecondary" paragraph>
                  Download all your financial data for backup or analysis.
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <FormControl component="fieldset">
                    <RadioGroup
                      row
                      value={exportFormat}
                      onChange={handleExportFormatChange}
                    >
                      <FormControlLabel
                        value="csv"
                        control={<Radio />}
                        label="CSV"
                      />
                      <FormControlLabel
                        value="json"
                        control={<Radio />}
                        label="JSON"
                      />
                    </RadioGroup>
                  </FormControl>
                </Box>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={
                    exporting ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <CloudDownload />
                    )
                  }
                  onClick={handleExportData}
                  disabled={exporting}
                >
                  {exporting
                    ? "Exporting..."
                    : `Export as ${exportFormat.toUpperCase()}`}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" component="h2" gutterBottom>
              Profile Management
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Box
              sx={{
                ".cl-component": {
                  fontFamily: theme.typography.fontFamily,
                },
                ".cl-card": {
                  boxShadow: "none",
                  border: "none",
                },
              }}
            >
              <UserProfile />
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsPage;
