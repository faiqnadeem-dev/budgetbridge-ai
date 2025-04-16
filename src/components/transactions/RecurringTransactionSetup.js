import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Chip,
  Divider,
  Grid,
  Alert,
  IconButton,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  CalendarToday,
  Refresh,
  ScheduleOutlined,
  Check,
  Error,
} from "@mui/icons-material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import {
  AccessibleTextField,
  AccessibleButton,
  AccessibleDialog,
} from "../../components/common/AccessibleComponents";
import { useCurrency } from "../../contexts/CurrencyContext";

const RecurringTransactionSetup = ({
  recurringTransactions = [],
  onCreateRecurring,
  onUpdateRecurring,
  onDeleteRecurring,
  categories = [],
  revenueCategories = [],
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [typeFilter, setTypeFilter] = useState("all");

  // Initialize state for new/editing transaction
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(null);
  const [hasEndDate, setHasEndDate] = useState(false);
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [dayOfWeek, setDayOfWeek] = useState("1"); // Monday
  const [errors, setErrors] = useState({});
  const [active, setActive] = useState(true);

  // Get currency from context
  const { formatAmount, symbol } = useCurrency();

  // Filter transactions when filter changes
  useEffect(() => {
    if (typeFilter === "all") {
      setFilteredTransactions(recurringTransactions);
    } else {
      setFilteredTransactions(
        recurringTransactions.filter((t) => t.type === typeFilter)
      );
    }
  }, [recurringTransactions, typeFilter]);

  // Handle opening the dialog for adding new transaction
  const handleOpenDialog = () => {
    // Reset form
    setEditingTransaction(null);
    setType("expense");
    setAmount("");
    setDescription("");
    setCategory("");
    setFrequency("monthly");
    setStartDate(new Date());
    setEndDate(null);
    setHasEndDate(false);
    setDayOfMonth("1");
    setDayOfWeek("1");
    setActive(true);
    setErrors({});
    setIsDialogOpen(true);
  };

  // Handle opening the dialog for editing
  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setType(transaction.type);
    setAmount(transaction.amount.toString());
    setDescription(transaction.description);
    setCategory(transaction.category);
    setFrequency(transaction.frequency);
    setStartDate(new Date(transaction.startDate));
    setEndDate(transaction.endDate ? new Date(transaction.endDate) : null);
    setHasEndDate(!!transaction.endDate);
    setDayOfMonth(transaction.dayOfMonth?.toString() || "1");
    setDayOfWeek(transaction.dayOfWeek?.toString() || "1");
    setActive(transaction.active !== false); // Default to true if not specified
    setErrors({});
    setIsDialogOpen(true);
  };

  // Handle closing the dialog
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  // Handle form submission
  const handleSubmit = () => {
    // Validate form
    const validationErrors = {};
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      validationErrors.amount = "Please enter a valid amount";
    }
    if (!description.trim()) {
      validationErrors.description = "Please enter a description";
    }
    if (!category) {
      validationErrors.category = "Please select a category";
    }

    // Check if end date is after start date
    if (hasEndDate && endDate && startDate && endDate <= startDate) {
      validationErrors.endDate = "End date must be after start date";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Clear any validation errors
    setErrors({});

    // Prepare transaction data
    const availableCategories =
      type === "expense" ? categories : revenueCategories;
    const transactionData = {
      id: editingTransaction?.id, // Will be undefined for new transactions
      type,
      amount: Number(amount),
      description,
      category,
      categoryName:
        availableCategories.find((c) => c.id === category)?.name || "",
      frequency,
      startDate: startDate.toISOString(),
      endDate: hasEndDate && endDate ? endDate.toISOString() : null,
      dayOfMonth:
        frequency === "monthly" || frequency === "yearly"
          ? Number(dayOfMonth)
          : null,
      dayOfWeek: frequency === "weekly" ? Number(dayOfWeek) : null,
      active,
      lastGenerated: editingTransaction?.lastGenerated || null,
    };

    // Call appropriate handler
    if (editingTransaction) {
      onUpdateRecurring(transactionData);
    } else {
      onCreateRecurring(transactionData);
    }

    // Close dialog
    handleCloseDialog();
  };

  // Get days array for month selection
  const daysOfMonth = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

  // Days of week
  const daysOfWeek = [
    { value: "1", label: "Monday" },
    { value: "2", label: "Tuesday" },
    { value: "3", label: "Wednesday" },
    { value: "4", label: "Thursday" },
    { value: "5", label: "Friday" },
    { value: "6", label: "Saturday" },
    { value: "0", label: "Sunday" },
  ];

  // Format next occurrence date
  const formatNextOccurrence = (transaction) => {
    // This is a simplified calculation - production code would need to handle all cases
    // For demo purposes, we'll just add days to the current date based on frequency
    const today = new Date();
    let nextDate;

    switch (transaction.frequency) {
      case "daily":
        nextDate = new Date(today);
        nextDate.setDate(today.getDate() + 1);
        break;
      case "weekly":
        nextDate = new Date(today);
        // Find days until next occurrence of dayOfWeek
        const currentDay = today.getDay();
        const targetDay = transaction.dayOfWeek;
        const daysUntilNext = (targetDay - currentDay + 7) % 7;
        nextDate.setDate(
          today.getDate() + (daysUntilNext === 0 ? 7 : daysUntilNext)
        );
        break;
      case "monthly":
        nextDate = new Date(today);
        // Set to target day of current month
        nextDate.setDate(transaction.dayOfMonth);
        // If that day already passed this month, go to next month
        if (nextDate <= today) {
          nextDate.setMonth(today.getMonth() + 1);
        }
        break;
      case "yearly":
        nextDate = new Date(today);
        // Set month and day from start date
        const startDateObj = new Date(transaction.startDate);
        nextDate.setMonth(startDateObj.getMonth());
        nextDate.setDate(transaction.dayOfMonth || startDateObj.getDate());
        // If that date already passed this year, go to next year
        if (nextDate <= today) {
          nextDate.setFullYear(today.getFullYear() + 1);
        }
        break;
      default:
        nextDate = new Date(today);
        nextDate.setMonth(today.getMonth() + 1);
    }

    // Check if there's an end date and next occurrence is after it
    if (transaction.endDate && nextDate > new Date(transaction.endDate)) {
      return "Completed";
    }

    return nextDate.toLocaleDateString();
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h6">Recurring Transactions</Typography>
          <AccessibleButton
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenDialog}
            id="recurring-add-button"
            label="Add Recurring Transaction"
          >
            Add Recurring
          </AccessibleButton>
        </Box>

        <Box sx={{ display: "flex", mb: 3 }}>
          <AccessibleButton
            variant={typeFilter === "all" ? "contained" : "outlined"}
            sx={{ mr: 1 }}
            onClick={() => setTypeFilter("all")}
            id="recurring-filter-all"
            label="Show All Transactions"
          >
            All
          </AccessibleButton>
          <AccessibleButton
            variant={typeFilter === "expense" ? "contained" : "outlined"}
            color="error"
            sx={{ mr: 1 }}
            onClick={() => setTypeFilter("expense")}
            id="recurring-filter-expense"
            label="Show Expenses"
          >
            Expenses
          </AccessibleButton>
          <AccessibleButton
            variant={typeFilter === "revenue" ? "contained" : "outlined"}
            color="success"
            onClick={() => setTypeFilter("revenue")}
            id="recurring-filter-revenue"
            label="Show Revenue"
          >
            Revenue
          </AccessibleButton>
        </Box>

        {filteredTransactions.length === 0 ? (
          <Alert severity="info">
            No recurring transactions set up yet. Create your first one to
            automate your regular finances.
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Status</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Frequency</TableCell>
                  <TableCell>Next Occurrence</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {transaction.active ? (
                        <Chip
                          icon={<Check fontSize="small" />}
                          label="Active"
                          color="success"
                          size="small"
                        />
                      ) : (
                        <Chip
                          icon={<Error fontSize="small" />}
                          label="Inactive"
                          color="default"
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell
                      sx={{
                        color:
                          transaction.type === "expense"
                            ? "error.main"
                            : "success.main",
                        fontWeight: "medium",
                      }}
                    >
                      {transaction.type === "expense" ? "-" : "+"}
                      {formatAmount(transaction.amount)}
                    </TableCell>
                    <TableCell>{transaction.categoryName}</TableCell>
                    <TableCell style={{ textTransform: "capitalize" }}>
                      {transaction.frequency}
                      {transaction.frequency === "weekly" &&
                        transaction.dayOfWeek !== undefined && (
                          <Typography
                            variant="caption"
                            component="span"
                            sx={{ ml: 1 }}
                          >
                            (
                            {daysOfWeek.find(
                              (d) =>
                                d.value === transaction.dayOfWeek.toString()
                            )?.label || "Monday"}
                            )
                          </Typography>
                        )}
                      {transaction.frequency === "monthly" &&
                        transaction.dayOfMonth && (
                          <Typography
                            variant="caption"
                            component="span"
                            sx={{ ml: 1 }}
                          >
                            (Day {transaction.dayOfMonth})
                          </Typography>
                        )}
                    </TableCell>
                    <TableCell>{formatNextOccurrence(transaction)}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleEditTransaction(transaction)}
                        sx={{ mr: 1 }}
                        id={`recurring-edit-${transaction.id}`}
                        name={`edit-recurring-${transaction.id}`}
                        aria-label={`Edit ${transaction.description}`}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDeleteRecurring(transaction.id)}
                        id={`recurring-delete-${transaction.id}`}
                        name={`delete-recurring-${transaction.id}`}
                        aria-label={`Delete ${transaction.description}`}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Add/Edit Dialog */}
      <AccessibleDialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        title={
          editingTransaction
            ? "Edit Recurring Transaction"
            : "New Recurring Transaction"
        }
        id="recurring-transaction-dialog"
      >
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0 }}>
            {/* Transaction Type */}
            <Grid item xs={12}>
              <Box sx={{ display: "flex", gap: 2 }}>
                <AccessibleButton
                  variant={type === "expense" ? "contained" : "outlined"}
                  color={type === "expense" ? "error" : "primary"}
                  onClick={() => setType("expense")}
                  sx={{ flex: 1 }}
                  id="recurring-type-expense"
                  name="transactionType"
                >
                  Expense
                </AccessibleButton>
                <AccessibleButton
                  variant={type === "revenue" ? "contained" : "outlined"}
                  color={type === "revenue" ? "success" : "primary"}
                  onClick={() => setType("revenue")}
                  sx={{ flex: 1 }}
                  id="recurring-type-revenue"
                  name="transactionType"
                >
                  Revenue
                </AccessibleButton>
              </Box>
            </Grid>

            {/* Amount */}
            <Grid item xs={12} sm={6}>
              <AccessibleTextField
                id="recurring-amount"
                name="recurring-amount"
                label="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                fullWidth
                type="number"
                required
                autoComplete="off"
                error={!!errors.amount}
                helperText={errors.amount}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">{symbol}</InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12} sm={6}>
              <AccessibleTextField
                id="recurring-description"
                name="recurring-description"
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                required
                error={!!errors.description}
                helperText={errors.description}
              />
            </Grid>

            {/* Category */}
            <Grid item xs={12}>
              <AccessibleTextField
                select
                id="recurring-category"
                name="recurring-category"
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                fullWidth
                error={!!errors.category}
                helperText={errors.category}
              >
                {(type === "expense" ? categories : revenueCategories).map(
                  (cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  )
                )}
              </AccessibleTextField>
            </Grid>

            {/* Frequency */}
            <Grid item xs={12} sm={6}>
              <AccessibleTextField
                select
                id="recurring-frequency"
                name="recurring-frequency"
                label="Frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                fullWidth
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="yearly">Yearly</MenuItem>
              </AccessibleTextField>
            </Grid>

            {/* Start Date */}
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(newDate) => setStartDate(newDate)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      id: "recurring-start-date",
                      name: "startDate",
                      InputProps: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarToday fontSize="small" />
                          </InputAdornment>
                        ),
                      },
                      inputProps: {
                        "aria-label": "Start Date",
                        id: "recurring-start-date-input",
                        name: "startDateInput",
                      },
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>

            {/* End Date Toggle and Date Picker */}
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={hasEndDate}
                    onChange={(e) => setHasEndDate(e.target.checked)}
                    id="recurring-has-end-date"
                    name="hasEndDate"
                    inputProps={{
                      "aria-label": "Set End Date",
                      id: "recurring-has-end-date-input",
                      name: "hasEndDateInput",
                    }}
                  />
                }
                label="Set End Date"
              />
              {hasEndDate && (
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={(newDate) => setEndDate(newDate)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        id: "recurring-end-date",
                        name: "endDate",
                        error: !!errors.endDate,
                        helperText: errors.endDate,
                        InputProps: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <CalendarToday fontSize="small" />
                            </InputAdornment>
                          ),
                        },
                        inputProps: {
                          "aria-label": "End Date",
                          id: "recurring-end-date-input",
                          name: "endDateInput",
                        },
                      },
                    }}
                  />
                </LocalizationProvider>
              )}
            </Grid>

            {/* Day of Month (for monthly/yearly frequency) */}
            {(frequency === "monthly" || frequency === "yearly") && (
              <Grid item xs={12} sm={6}>
                <AccessibleTextField
                  id="recurring-day-of-month"
                  name="recurring-day-of-month"
                  label="Day of Month"
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(e.target.value)}
                  fullWidth
                  type="number"
                  required
                />
              </Grid>
            )}

            {/* Day of Week (for weekly frequency) */}
            {frequency === "weekly" && (
              <Grid item xs={12} sm={6}>
                <AccessibleTextField
                  id="recurring-day-of-week"
                  name="recurring-day-of-week"
                  label="Day of Week"
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(e.target.value)}
                  fullWidth
                  select
                  required
                >
                  {daysOfWeek.map((day) => (
                    <MenuItem key={day.value} value={day.value}>
                      {day.label}
                    </MenuItem>
                  ))}
                </AccessibleTextField>
              </Grid>
            )}

            {/* Active Toggle */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    id="recurring-active-toggle"
                    name="active"
                    inputProps={{
                      "aria-label": "Active Status",
                      id: "recurring-active-input",
                      name: "activeInput",
                    }}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <AccessibleButton
            onClick={handleCloseDialog}
            id="recurring-dialog-cancel"
            name="recurring-cancel"
            aria-label="Cancel"
          >
            Cancel
          </AccessibleButton>
          <AccessibleButton
            onClick={handleSubmit}
            variant="contained"
            id="recurring-save-button"
            name="recurring-submit"
            aria-label={`${
              editingTransaction ? "Update" : "Create"
            } Recurring Transaction`}
          >
            {editingTransaction ? "Update" : "Create"} Recurring Transaction
          </AccessibleButton>
        </DialogActions>
      </AccessibleDialog>
    </Box>
  );
};

export default RecurringTransactionSetup;
