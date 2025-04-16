import React, { useState, useEffect } from "react";
import {
  Box,
  MenuItem,
  Grid,
  FormControlLabel,
  Switch,
  Typography,
  Divider,
  Chip,
  IconButton,
  InputAdornment,
  Alert,
  AlertTitle,
  CircularProgress,
} from "@mui/material";
import {
  CalendarToday,
  Receipt,
  PhotoCamera,
  CategoryOutlined as CategoryIcon,
  Add,
  CreditCard,
  AccountBalance,
  AttachMoney,
  LocalAtm,
  Delete,
  Visibility,
  Warning,
} from "@mui/icons-material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { useUser } from "@clerk/clerk-react";
import { openReceiptViewer } from "../../utils/receiptUtils";
import { checkForDuplicateTransaction } from "../../utils/transactionUtils";
import { getUserCurrency } from "../../utils/currencyUtils";
import { useCurrency } from "../../contexts/CurrencyContext";
// Import the accessible components
import {
  AccessibleTextField,
  AccessibleButton,
} from "../../components/common/AccessibleComponents";
import PropTypes from "prop-types";
import CurrencyInput from "../common/CurrencyInput";

const TransactionForm = ({
  transaction = null,
  onSubmit,
  onCancel,
  categories = [],
  revenueCategories = [],
  onAddCategory,
  paymentMethods = [],
  allTransactions = [],
  user,
}) => {
  // Set default values from existing transaction or initialize new ones
  const [type, setType] = useState(transaction?.type || "expense");
  const [amount, setAmount] = useState(transaction?.amount || "");
  const [description, setDescription] = useState(
    transaction?.description || ""
  );
  const [category, setCategory] = useState(transaction?.category || "");
  const [date, setDate] = useState(
    transaction?.date ? new Date(transaction.date) : new Date()
  );
  const [isRecurring, setIsRecurring] = useState(
    transaction?.isRecurring || false
  );
  const [recurringFrequency, setRecurringFrequency] = useState(
    transaction?.recurringFrequency || "monthly"
  );
  const [paymentMethod, setPaymentMethod] = useState(
    transaction?.paymentMethod || ""
  );
  const [notes, setNotes] = useState(transaction?.notes || "");
  const [tags, setTags] = useState(transaction?.tags || []);
  const [newTag, setNewTag] = useState("");
  const [receiptImage, setReceiptImage] = useState(
    transaction?.receiptImage || null
  );
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [errors, setErrors] = useState({});

  // Keep currency in state but don't show UI for it
  const [currency, setCurrency] = useState(
    transaction?.currency || getUserCurrency(user) || "USD"
  );
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [potentialDuplicate, setPotentialDuplicate] = useState(null);

  // Get currency formatter from context
  const { formatAmount } = useCurrency();

  // Get the appropriate categories based on transaction type
  const availableCategories =
    type === "expense" ? categories : revenueCategories;

  // Check for duplicate transactions when relevant fields change
  useEffect(() => {
    // Only check if we have enough data to detect a potential duplicate
    if (!description || !amount || !category || !date) {
      setPotentialDuplicate(null);
      setShowDuplicateWarning(false);
      return;
    }

    // Create a transaction object with current form values
    const currentTransaction = {
      id: transaction?.id,
      type,
      amount: Number(amount),
      description,
      category,
      date: date.toISOString(),
      currency,
    };

    // Check for potential duplicates
    const duplicate = checkForDuplicateTransaction(
      currentTransaction,
      allTransactions || []
    );

    if (duplicate) {
      setPotentialDuplicate(duplicate);
      setShowDuplicateWarning(true);
    } else {
      setPotentialDuplicate(null);
      setShowDuplicateWarning(false);
    }
  }, [
    description,
    amount,
    category,
    date,
    type,
    currency,
    transaction?.id,
    allTransactions,
  ]);

  // Update currency whenever user preferences change
  useEffect(() => {
    setCurrency(getUserCurrency(user) || "USD");
  }, [user?.settings?.preferredCurrency]);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

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

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Clear any validation errors
    setErrors({});

    // Prepare transaction data
    const transactionData = {
      id: transaction?.id, // Only present when editing existing transaction
      type,
      amount: Number(amount),
      description,
      category,
      categoryName:
        availableCategories.find((c) => c.id === category)?.name || "",
      date: date.toISOString(),
      isRecurring,
      recurringFrequency: isRecurring ? recurringFrequency : null,
      paymentMethod,
      notes,
      tags,
      receiptImage,
      currency, // Always use the current currency from state
      timestamp: new Date(), // Current timestamp for created/updated
    };

    // If this is a recurring transaction, also create a recurring template
    if (isRecurring && !transaction?.id) {
      // Create a recurring transaction template
      const recurringData = {
        type,
        amount: Number(amount),
        description,
        category,
        categoryName:
          availableCategories.find((c) => c.id === category)?.name || "",
        frequency: recurringFrequency,
        startDate: date.toISOString(),
        dayOfMonth: date.getDate(),
        dayOfWeek: date.getDay(),
        active: true,
        lastGenerated: date.toISOString(), // Set to now since we're creating the first instance
      };

      // Pass both the transaction and the recurring template
      onSubmit(transactionData, recurringData);
    } else {
      // Just submit the regular transaction
      onSubmit(transactionData);
    }
  };

  // Handle receipt image upload
  const handleReceiptUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show loading state
    setUploadingReceipt(true);

    // Check file size
    if (file.size > 500000) {
      // ~500KB limit to keep under Firestore 1MB doc limit
      alert("File is too large. Please select an image smaller than 500KB.");
      setUploadingReceipt(false);
      return;
    }

    // Convert to base64 for simple storage
    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptImage(reader.result);
      setUploadingReceipt(false);
    };
    reader.onerror = () => {
      alert("Failed to read file");
      setUploadingReceipt(false);
    };
    reader.readAsDataURL(file);
  };

  // Handle adding a new tag
  const handleAddTag = () => {
    if (!newTag.trim() || tags.includes(newTag.trim())) return;
    setTags([...tags, newTag.trim()]);
    setNewTag("");
  };

  // Handle removing a tag
  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // Reset recurring fields when recurring toggle changes
  useEffect(() => {
    if (!isRecurring) {
      setRecurringFrequency("monthly");
    }
  }, [isRecurring]);

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
      <Grid container spacing={3}>
        {/* Transaction Type Selection */}
        <Grid item xs={12}>
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <AccessibleButton
              variant={type === "expense" ? "contained" : "outlined"}
              color={type === "expense" ? "error" : "primary"}
              onClick={() => setType("expense")}
              startIcon={<LocalAtm />}
              sx={{ flex: 1 }}
              id="transaction-type-expense"
              label="Expense"
            >
              Expense
            </AccessibleButton>
            <AccessibleButton
              variant={type === "revenue" ? "contained" : "outlined"}
              color={type === "revenue" ? "success" : "primary"}
              onClick={() => setType("revenue")}
              startIcon={<AttachMoney />}
              sx={{ flex: 1 }}
              id="transaction-type-revenue"
              label="Revenue"
            >
              Revenue
            </AccessibleButton>
          </Box>
        </Grid>

        {/* Duplicate Transaction Warning */}
        {showDuplicateWarning && potentialDuplicate && (
          <Grid item xs={12}>
            <Alert
              severity="warning"
              icon={<Warning />}
              action={
                <AccessibleButton
                  color="inherit"
                  size="small"
                  onClick={() => setShowDuplicateWarning(false)}
                  label="Ignore Warning"
                >
                  IGNORE
                </AccessibleButton>
              }
            >
              <AlertTitle>Possible Duplicate Transaction</AlertTitle>
              This appears similar to an existing {
                potentialDuplicate.type
              } from {new Date(potentialDuplicate.date).toLocaleDateString()}{" "}
              for {formatAmount(potentialDuplicate.amount)}
              <br />
              Description: {potentialDuplicate.description}
            </Alert>
          </Grid>
        )}

        {/* Amount Field */}
        <Grid item xs={12} md={6}>
          <CurrencyInput
            id="transaction-amount"
            name="transaction-amount"
            label="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
            required
            error={!!errors.amount}
            helperText={errors.amount}
            autoComplete="off"
            user={user}
          />
        </Grid>

        {/* Date Picker */}
        <Grid item xs={12} md={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Date"
              value={date}
              onChange={(newDate) => setDate(newDate)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  id: "transaction-date",
                  name: "date",
                  InputProps: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarToday fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                  inputProps: {
                    "aria-label": "Transaction Date",
                    id: "transaction-date-input",
                    name: "dateInput",
                  },
                },
              }}
            />
          </LocalizationProvider>
        </Grid>

        {/* Description Field */}
        <Grid item xs={12}>
          <AccessibleTextField
            id="transaction-description"
            name="transaction-description"
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            required
            error={!!errors.description}
            helperText={errors.description}
            autoComplete="off"
          />
        </Grid>

        {/* Category Select */}
        <Grid item xs={12}>
          <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
            <AccessibleTextField
              select
              id="transaction-category"
              name="transaction-category"
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              fullWidth
              required
              error={!!errors.category}
              helperText={errors.category}
              autoComplete="off"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CategoryIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            >
              {availableCategories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </AccessibleTextField>
            <AccessibleButton
              onClick={() => onAddCategory(type)}
              variant="outlined"
              sx={{ minWidth: "auto", height: 56 }}
              id="transaction-add-category"
              label="Add Category"
            >
              <Add />
            </AccessibleButton>
          </Box>
        </Grid>

        {/* Payment Method - Only for expenses */}
        {type === "expense" && (
          <Grid item xs={12} md={6}>
            <AccessibleTextField
              select
              id="transaction-payment-method"
              name="transaction-payment-method"
              label="Payment Method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              fullWidth
              autoComplete="off"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CreditCard fontSize="small" />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="">Select Method</MenuItem>
              {paymentMethods.map((method) => (
                <MenuItem key={method.id} value={method.id}>
                  {method.name}
                </MenuItem>
              ))}
            </AccessibleTextField>
          </Grid>
        )}

        {/* Recurring Transaction Toggle */}
        <Grid item xs={12}>
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  id="transaction-recurring-toggle"
                  name="isRecurring"
                  inputProps={{
                    "aria-label": "Recurring Transaction",
                    id: "transaction-recurring-input",
                    name: "isRecurringInput",
                  }}
                />
              }
              label="Recurring Transaction"
            />

            {isRecurring && (
              <AccessibleTextField
                select
                id="transaction-recurring-frequency"
                name="recurringFrequency"
                value={recurringFrequency}
                onChange={(e) => setRecurringFrequency(e.target.value)}
                size="small"
                sx={{ ml: 2, minWidth: 120 }}
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="yearly">Yearly</MenuItem>
              </AccessibleTextField>
            )}
          </Box>
        </Grid>

        {/* Notes Field */}
        <Grid item xs={12}>
          <AccessibleTextField
            id="transaction-notes"
            name="transaction-notes"
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            multiline
            rows={2}
            placeholder="Add any additional notes here..."
            autoComplete="off"
          />
        </Grid>

        {/* Tags */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>
            Tags
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
            {tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                onDelete={() => handleRemoveTag(tag)}
                size="small"
              />
            ))}
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <AccessibleTextField
              id="transaction-new-tag"
              name="transaction-new-tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              size="small"
              placeholder="Add a tag"
              fullWidth
              autoComplete="off"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <AccessibleButton
              variant="outlined"
              onClick={handleAddTag}
              disabled={!newTag.trim()}
              id="transaction-add-tag"
              label="Add Tag"
            >
              Add
            </AccessibleButton>
          </Box>
        </Grid>

        {/* Receipt Upload */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>
            Receipt
          </Typography>
          {receiptImage ? (
            <Box
              sx={{
                border: "1px solid #e0e0e0",
                borderRadius: 1,
                p: 1,
                maxWidth: 300,
              }}
            >
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2">Receipt Image</Typography>
                <Box>
                  <IconButton
                    size="small"
                    onClick={() => openReceiptViewer(receiptImage)}
                    id="transaction-view-receipt"
                    name="viewReceipt"
                    aria-label="View Receipt"
                  >
                    <Visibility fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setReceiptImage(null)}
                    id="transaction-delete-receipt"
                    name="deleteReceipt"
                    aria-label="Delete Receipt"
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              <img
                src={receiptImage}
                alt="Receipt"
                style={{
                  width: "100%",
                  maxHeight: "150px",
                  objectFit: "contain",
                  cursor: "pointer",
                }}
                onClick={() => openReceiptViewer(receiptImage)}
              />
            </Box>
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <AccessibleButton
                variant="outlined"
                component="label"
                id="transaction-receipt-upload"
                name="receiptImage"
                disabled={uploadingReceipt}
                startIcon={
                  uploadingReceipt ? (
                    <CircularProgress size={20} />
                  ) : (
                    <Receipt />
                  )
                }
              >
                {uploadingReceipt ? "Uploading..." : "Upload Receipt"}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleReceiptUpload}
                  id="transaction-receipt-file"
                  name="receiptImageFile"
                  aria-label="Upload Receipt Image"
                />
              </AccessibleButton>
            </Box>
          )}
        </Grid>

        {/* Submit Button */}
        <Grid item xs={12}>
          <AccessibleButton
            variant="contained"
            type="submit"
            id="transaction-submit"
            label="Submit Transaction"
            disabled={uploadingReceipt}
          >
            Submit
          </AccessibleButton>
          <AccessibleButton
            variant="outlined"
            onClick={onCancel}
            sx={{ ml: 2 }}
            id="transaction-cancel"
            label="Cancel"
          >
            Cancel
          </AccessibleButton>
        </Grid>
      </Grid>
    </Box>
  );
};

TransactionForm.propTypes = {
  transaction: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  categories: PropTypes.array,
  revenueCategories: PropTypes.array,
  onAddCategory: PropTypes.func,
  paymentMethods: PropTypes.array,
  allTransactions: PropTypes.array,
  user: PropTypes.object,
};

export default TransactionForm;
