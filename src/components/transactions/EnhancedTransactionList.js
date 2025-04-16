import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Button,
  Divider,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Chip,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  Alert,
  AlertTitle,
  Stack,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import {
  Search,
  FilterList,
  Sort,
  Edit,
  Delete,
  Receipt,
  CalendarToday,
  ArrowUpward,
  ArrowDownward,
  MoreVert,
  GetApp,
  Refresh,
  Close,
  RepeatOneOutlined,
  Autorenew,
  TrendingDown,
  TrendingUp,
  InfoOutlined,
  Search as SearchIcon,
  DateRange,
} from "@mui/icons-material";
import { useUser } from "@clerk/clerk-react";
import { openReceiptViewer } from "../../utils/receiptUtils";
import { useCurrency } from "../../contexts/CurrencyContext";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  LocalizationProvider,
  DatePicker,
  MobileDatePicker,
} from "@mui/x-date-pickers";

const EnhancedTransactionList = ({
  transactions = [],
  onEditTransaction,
  onDeleteTransaction,
  categories = [],
  revenueCategories = [],
  onRefreshTransactions,
  isLoading = false,
  onUpdateTransaction,
}) => {
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  const [sortMenuAnchor, setSortMenuAnchor] = useState(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [actionTransaction, setActionTransaction] = useState(null);
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [transactionFilters, setTransactionFilters] = useState({
    type: null,
    category: "",
    startDate: null,
    endDate: null,
  });
  const { user } = useUser();

  // Get the currency formatter
  const { formatAmount } = useCurrency();

  // Initial filtering
  useEffect(() => {
    applyFilters();
  }, [
    transactions,
    searchQuery,
    selectedType,
    selectedCategory,
    sortField,
    sortDirection,
    dateRange,
  ]);

  // Apply all filters and sorting
  const applyFilters = () => {
    // Start with all transactions
    let filtered = [...transactions];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (t) =>
          t.description?.toLowerCase().includes(query) ||
          t.categoryName?.toLowerCase().includes(query)
      );
    }

    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter((t) => t.type === selectedType);
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    // Filter by date range
    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      startDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((t) => new Date(t.date) >= startDate);
    }

    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((t) => new Date(t.date) <= endDate);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      // Handle null values
      if (!a[sortField]) return 1;
      if (!b[sortField]) return -1;

      // Handle date fields
      if (sortField === "date") {
        return sortDirection === "asc"
          ? new Date(a.date) - new Date(b.date)
          : new Date(b.date) - new Date(a.date);
      }

      // Handle numeric fields
      if (typeof a[sortField] === "number") {
        return sortDirection === "asc"
          ? a[sortField] - b[sortField]
          : b[sortField] - a[sortField];
      }

      // Handle string fields
      return sortDirection === "asc"
        ? a[sortField].localeCompare(b[sortField])
        : b[sortField].localeCompare(a[sortField]);
    });

    setFilteredTransactions(filtered);
  };

  // Calculate pagination
  const pageCount = Math.ceil(filteredTransactions.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedTransactions = filteredTransactions.slice(
    startIndex,
    startIndex + rowsPerPage
  );

  // Handle filter menu
  const handleFilterClick = (event) => {
    setFilterMenuAnchor(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterMenuAnchor(null);
  };

  // Set transaction type filter
  const setTransactionType = (type) => {
    setSelectedType(type);
    setTransactionFilters({
      ...transactionFilters,
      type: type === "all" ? null : type,
    });
    handleFilterClose();
  };

  // Set category filter
  const setCategoryFilter = (categoryId) => {
    setSelectedCategory(categoryId);
    setTransactionFilters({
      ...transactionFilters,
      category: categoryId,
    });
    handleFilterClose();
  };

  // Handle date range filter
  const openDatePicker = () => {
    setDatePickerOpen(true);
  };

  const handleDatePickerClose = () => {
    setDatePickerOpen(false);
  };

  const handleDateRangeChange = (newRange) => {
    setDateRange(newRange);
    setTransactionFilters({
      ...transactionFilters,
      startDate: newRange.start,
      endDate: newRange.end,
    });
    setCurrentPage(1); // Reset to first page when filters change
    handleFilterClose();
    setDatePickerOpen(false);
  };

  // Handle sort menu
  const handleSortClick = (event) => {
    setSortMenuAnchor(event.currentTarget);
  };

  const handleSortClose = () => {
    setSortMenuAnchor(null);
  };

  // Handle setting sort field
  const handleSetSort = (field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field with default desc direction
      setSortField(field);
      setSortDirection("desc");
    }
    handleSortClose();
  };

  // Handle transaction action menu
  const handleActionClick = (event, transaction) => {
    event.stopPropagation();
    setActionMenuAnchor(event.currentTarget);
    setActionTransaction(transaction);
  };

  const handleActionClose = () => {
    setActionMenuAnchor(null);
    setActionTransaction(null);
  };

  // Handle opening receipt viewer
  const handleOpenReceiptViewer = (transaction) => {
    if (transaction?.receiptImage || transaction?.receiptUrl) {
      // Use whichever receipt property is available
      const receiptSource = transaction.receiptImage || transaction.receiptUrl;
      openReceiptViewer(receiptSource);
    }
  };

  // Handle transaction edit
  const handleEdit = () => {
    if (actionTransaction) {
      onEditTransaction(actionTransaction);
      handleActionClose();
    }
  };

  // Handle transaction delete
  const handleDelete = () => {
    if (actionTransaction) {
      // Pass additional isRecurring flag if the transaction is recurring
      onDeleteTransaction(actionTransaction.id, actionTransaction.isRecurring);
      handleActionClose();
    }
  };

  // Handle attach receipt
  const handleAttachReceipt = () => {
    if (!actionTransaction) {
      handleActionClose();
      return;
    }

    // If there's already a receipt attached, open it
    if (actionTransaction?.receiptImage || actionTransaction?.receiptUrl) {
      const receiptSource =
        actionTransaction.receiptImage || actionTransaction.receiptUrl;
      openReceiptViewer(receiptSource);
      handleActionClose();
      return;
    }

    // Create a hidden file input
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";

    // Handle file selection
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Check file size
      if (file.size > 500000) {
        // ~500KB limit to keep under Firestore 1MB doc limit
        alert("File is too large. Please select an image smaller than 500KB.");
        return;
      }

      // Convert to base64 for simple storage
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          // Update the transaction with the receipt base64 data
          if (onUpdateTransaction) {
            await onUpdateTransaction({
              id: actionTransaction.id,
              receiptImage: reader.result,
              receiptUrl: reader.result, // Set both properties for compatibility
            });

            // Refresh transactions to show updated receipt
            onRefreshTransactions();

            alert("Receipt attached successfully!");
          } else {
            alert("Cannot attach receipt: update functionality not available.");
          }
        } catch (error) {
          console.error("Error attaching receipt:", error);
          alert("Failed to attach receipt. Please try again.");
        }
      };

      reader.onerror = () => {
        alert("Failed to read file");
      };

      reader.readAsDataURL(file);
    };

    // Trigger the file picker
    fileInput.click();

    // Close the menu
    handleActionClose();
  };

  // Handle delete receipt
  const handleDeleteReceipt = async () => {
    if (!actionTransaction?.receiptImage && !actionTransaction?.receiptUrl) {
      handleActionClose();
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to remove this receipt?"
    );
    if (!confirmDelete) {
      handleActionClose();
      return;
    }

    try {
      // Update the transaction with null receipt image
      if (onUpdateTransaction) {
        await onUpdateTransaction({
          id: actionTransaction.id,
          receiptImage: null,
          receiptUrl: null, // Clear both properties
        });

        // Refresh transactions list
        onRefreshTransactions();

        alert("Receipt removed successfully");
      } else {
        alert("Cannot remove receipt: update functionality not available.");
      }
    } catch (error) {
      console.error("Error removing receipt:", error);
      alert("Failed to remove receipt. Please try again.");
    }

    handleActionClose();
  };

  // Toggle select mode
  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedTransactions([]);
  };

  // Select all transactions
  const handleSelectAll = () => {
    if (selectedTransactions.length === paginatedTransactions.length) {
      // If all are selected, deselect all
      setSelectedTransactions([]);
    } else {
      // Select all
      setSelectedTransactions([...paginatedTransactions]);
    }
  };

  // Handle transaction selection
  const handleSelect = (transaction) => {
    const isSelected = selectedTransactions.some(
      (t) => t.id === transaction.id
    );

    if (isSelected) {
      setSelectedTransactions(
        selectedTransactions.filter((t) => t.id !== transaction.id)
      );
    } else {
      setSelectedTransactions([...selectedTransactions, transaction]);
    }
  };

  // Handle batch delete
  const handleBatchDelete = () => {
    if (selectedTransactions.length === 0) return;

    // Open confirmation dialog instead of using window.confirm
    setConfirmDeleteOpen(true);
  };

  // Confirm batch delete action
  const confirmBatchDelete = () => {
    // Pass array of transaction IDs to delete
    const transactionIds = selectedTransactions.map(
      (transaction) => transaction.id
    );

    // Check if any of the selected transactions are recurring
    const hasRecurring = selectedTransactions.some((t) => t.isRecurring);

    // Pass both the IDs and the recurring flag
    onDeleteTransaction(transactionIds, hasRecurring);

    // Clear selection and exit select mode
    setSelectedTransactions([]);
    setSelectMode(false);
    setConfirmDeleteOpen(false);
  };

  // Close confirmation dialog
  const closeConfirmDelete = () => {
    setConfirmDeleteOpen(false);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedType("all");
    setSelectedCategory("");
    setDateRange({ start: null, end: null });
    setSortField("date");
    setSortDirection("desc");
    setTransactionFilters({
      type: null,
      category: "",
      startDate: null,
      endDate: null,
    });
    handleFilterClose();
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Export transaction to CSV
  const exportTransactionToCSV = () => {
    if (!actionTransaction) {
      handleActionClose();
      return;
    }

    // Format date
    const date = new Date(actionTransaction.date);
    // Format date as MM/DD/YYYY for better Excel compatibility
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    const formattedDate = `${month}/${day}/${year}`;

    // Escape function for CSV values
    const escapeCSV = (value) => {
      if (value == null) return "";
      const stringValue = String(value);
      // If the value contains quotes, commas, or newlines, wrap it in quotes and escape any quotes
      if (
        stringValue.includes('"') ||
        stringValue.includes(",") ||
        stringValue.includes("\n")
      ) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Create CSV content
    const headers = "Date,Type,Description,Category,Amount\n";
    const row = `${formattedDate},${escapeCSV(
      actionTransaction.type
    )},${escapeCSV(actionTransaction.description)},${escapeCSV(
      actionTransaction.categoryName
    )},${actionTransaction.amount}\n`;
    const csvContent = headers + row;

    // Create blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `transaction_${actionTransaction.id}.csv`);
    document.body.appendChild(link);

    // Trigger download and cleanup
    link.click();
    document.body.removeChild(link);

    handleActionClose();
  };

  // Export all transactions to CSV
  const exportAllTransactionsToCSV = () => {
    if (filteredTransactions.length === 0) return;

    // Escape function for CSV values
    const escapeCSV = (value) => {
      if (value == null) return "";
      const stringValue = String(value);
      // If the value contains quotes, commas, or newlines, wrap it in quotes and escape any quotes
      if (
        stringValue.includes('"') ||
        stringValue.includes(",") ||
        stringValue.includes("\n")
      ) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Format headers
    const headers = "Date,Type,Description,Category,Amount,Payment Method\n";

    // Format each row
    let csvContent = headers;
    filteredTransactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      // Format date as MM/DD/YYYY for better Excel compatibility
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const year = date.getFullYear();
      const formattedDate = `${month}/${day}/${year}`;

      const row = `${formattedDate},${escapeCSV(transaction.type)},${escapeCSV(
        transaction.description
      )},${escapeCSV(transaction.categoryName)},${
        transaction.amount
      },${escapeCSV(transaction.paymentMethod)}\n`;
      csvContent += row;
    });

    // Create blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `transactions_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);

    // Trigger download and cleanup
    link.click();
    document.body.removeChild(link);
  };

  // Render a single transaction row
  const renderTransactionRow = (transaction) => {
    const isSelected = selectedTransactions.includes(transaction.id);
    return (
      <Box
        key={transaction.id}
        sx={{
          display: "flex",
          alignItems: "center",
          p: 2,
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          transition: "background-color 0.2s",
          "&:hover": {
            backgroundColor: "rgba(0,0,0,0.02)",
          },
          position: "relative",
        }}
      >
        {selectMode && (
          <Checkbox
            checked={isSelected}
            onChange={() => handleSelect(transaction)}
            sx={{ mr: 1 }}
          />
        )}
        <Box
          sx={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
          }}
          onClick={() => !selectMode && handleOpenReceiptViewer(transaction)}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mr: 2,
                bgcolor:
                  transaction.type === "expense"
                    ? "rgba(244, 67, 54, 0.12)"
                    : "rgba(76, 175, 80, 0.12)",
                color: transaction.type === "expense" ? "#f44336" : "#4caf50",
              }}
            >
              {transaction.type === "expense" ? (
                <TrendingDown />
              ) : (
                <TrendingUp />
              )}
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                {transaction.description}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 1,
                }}
              >
                <Chip
                  label={transaction.categoryName || "Uncategorized"}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: "0.75rem",
                    bgcolor:
                      transaction.type === "expense"
                        ? "rgba(244, 67, 54, 0.08)"
                        : "rgba(76, 175, 80, 0.08)",
                    color:
                      transaction.type === "expense" ? "#d32f2f" : "#2e7d32",
                    borderRadius: "6px",
                  }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  <CalendarToday sx={{ fontSize: 12, mr: 0.5 }} />
                  {new Date(transaction.date).toLocaleDateString()}
                </Typography>
                {transaction.paymentMethod && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "flex", alignItems: "center" }}
                  >
                    <Receipt sx={{ fontSize: 12, mr: 0.5 }} />
                    {transaction.paymentMethod}
                  </Typography>
                )}
                {transaction.isRecurring && (
                  <Tooltip title="Recurring Transaction">
                    <Chip
                      icon={
                        <Autorenew sx={{ fontSize: "0.75rem !important" }} />
                      }
                      label="Recurring"
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: "0.75rem",
                        bgcolor: "rgba(103, 58, 183, 0.1)",
                        color: "#5e35b1",
                        borderRadius: "6px",
                      }}
                    />
                  </Tooltip>
                )}
              </Box>
            </Box>
          </Box>
          <Box sx={{ textAlign: "right", minWidth: "100px" }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: "bold",
                color: transaction.type === "expense" ? "#d32f2f" : "#2e7d32",
              }}
            >
              {transaction.type === "expense" ? "-" : "+"}
              {formatAmount(transaction.amount)}
            </Typography>
            {transaction.notes && (
              <Tooltip title={transaction.notes}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  <InfoOutlined sx={{ fontSize: 12, mr: 0.5 }} />
                  Note
                </Typography>
              </Tooltip>
            )}
          </Box>
        </Box>

        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleActionClick(e, transaction);
          }}
          sx={{
            ml: 1,
            color: "text.secondary",
            "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" },
          }}
        >
          <MoreVert />
        </IconButton>
      </Box>
    );
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* Filter and search controls */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", md: "center" },
          mb: 2,
          gap: 2,
          p: 2,
          bgcolor: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(8px)",
          borderRadius: "16px 16px 0 0",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <Box
          sx={{ display: "flex", gap: 1, alignItems: "center", flexGrow: 1 }}
        >
          <TextField
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            variant="outlined"
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="action" />
                </InputAdornment>
              ),
              sx: {
                borderRadius: 2,
                backgroundColor: "rgba(0,0,0,0.02)",
                "&.Mui-focused": {
                  backgroundColor: "white",
                  boxShadow: "0 0 0 2px rgba(25, 118, 210, 0.2)",
                },
                transition: "all 0.2s ease",
              },
            }}
            sx={{
              flexGrow: 1,
              maxWidth: { xs: "100%", md: "300px" },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(0,0,0,0.08)",
              },
            }}
          />
          <IconButton
            onClick={handleFilterClick}
            aria-label="Filter"
            sx={{
              backgroundColor: filterMenuAnchor
                ? "rgba(25, 118, 210, 0.1)"
                : "rgba(0,0,0,0.02)",
              borderRadius: "12px",
              p: 1,
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: "rgba(25, 118, 210, 0.15)",
              },
            }}
          >
            <FilterList color={filterMenuAnchor ? "primary" : "action"} />
          </IconButton>
          <IconButton
            onClick={handleSortClick}
            aria-label="Sort"
            sx={{
              backgroundColor: sortMenuAnchor
                ? "rgba(25, 118, 210, 0.1)"
                : "rgba(0,0,0,0.02)",
              borderRadius: "12px",
              p: 1,
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: "rgba(25, 118, 210, 0.15)",
              },
            }}
          >
            <Sort color={sortMenuAnchor ? "primary" : "action"} />
          </IconButton>
          {Object.values(transactionFilters).some(
            (val) => val !== null && val !== ""
          ) && (
            <Button
              variant="outlined"
              size="small"
              onClick={resetFilters}
              startIcon={<Close fontSize="small" />}
              sx={{
                borderRadius: "12px",
                textTransform: "none",
                borderColor: "rgba(0,0,0,0.12)",
                fontSize: "0.8125rem",
                py: 0.5,
                px: 1.5,
                color: "text.secondary",
                "&:hover": {
                  backgroundColor: "rgba(0,0,0,0.03)",
                  borderColor: "rgba(0,0,0,0.2)",
                },
              }}
            >
              Clear Filters
            </Button>
          )}
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Refresh fontSize="small" />}
            onClick={() => onRefreshTransactions()}
            disabled={isLoading}
            sx={{
              borderRadius: "12px",
              textTransform: "none",
              borderColor: "rgba(0,0,0,0.12)",
              fontSize: "0.8125rem",
              py: 0.5,
              px: 1.5,
              color: "text.secondary",
              "&:hover": {
                backgroundColor: "rgba(0,0,0,0.03)",
                borderColor: "rgba(0,0,0,0.2)",
              },
              "&.Mui-disabled": {
                opacity: 0.5,
                color: "text.disabled",
              },
            }}
          >
            Refresh
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<GetApp fontSize="small" />}
            onClick={exportAllTransactionsToCSV}
            sx={{
              borderRadius: "12px",
              textTransform: "none",
              borderColor: "rgba(0,0,0,0.12)",
              fontSize: "0.8125rem",
              py: 0.5,
              px: 1.5,
              color: "text.secondary",
              "&:hover": {
                backgroundColor: "rgba(0,0,0,0.03)",
                borderColor: "rgba(0,0,0,0.2)",
              },
            }}
          >
            Export
          </Button>
          {selectMode ? (
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={toggleSelectMode}
              sx={{
                borderRadius: "12px",
                textTransform: "none",
                fontSize: "0.8125rem",
                py: 0.5,
                px: 1.5,
              }}
            >
              Cancel
            </Button>
          ) : (
            <Button
              size="small"
              variant="outlined"
              startIcon={
                <Checkbox
                  size="small"
                  checked={false}
                  sx={{ p: 0, mr: -0.5 }}
                />
              }
              onClick={toggleSelectMode}
              sx={{
                borderRadius: "12px",
                textTransform: "none",
                borderColor: "rgba(0,0,0,0.12)",
                fontSize: "0.8125rem",
                py: 0.5,
                px: 1.5,
                color: "text.secondary",
                "&:hover": {
                  backgroundColor: "rgba(0,0,0,0.03)",
                  borderColor: "rgba(0,0,0,0.2)",
                },
              }}
            >
              Select
            </Button>
          )}
        </Box>
      </Box>

      {/* Filter chips if filters applied */}
      {Object.values(transactionFilters).some(
        (val) => val !== null && val !== ""
      ) && (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            mb: 2,
            px: 2.5,
            mt: 1,
          }}
        >
          {selectedType !== "all" && (
            <Chip
              label={`Type: ${
                selectedType === "expense" ? "Expense" : "Revenue"
              }`}
              onDelete={() => setTransactionType("all")}
              size="small"
              color={selectedType === "expense" ? "error" : "success"}
              sx={{
                borderRadius: "8px",
                fontWeight: 500,
                fontSize: "0.75rem",
                "& .MuiChip-deleteIcon": {
                  fontSize: "0.875rem",
                },
              }}
            />
          )}
          {selectedCategory && (
            <Chip
              label={`Category: ${
                [...categories, ...revenueCategories].find(
                  (c) => c.id === selectedCategory
                )?.name || selectedCategory
              }`}
              onDelete={() => setCategoryFilter("")}
              size="small"
              color="primary"
              sx={{
                borderRadius: "8px",
                fontWeight: 500,
                fontSize: "0.75rem",
                "& .MuiChip-deleteIcon": {
                  fontSize: "0.875rem",
                },
              }}
            />
          )}
          {dateRange.start && (
            <Chip
              label={`From: ${new Date(dateRange.start).toLocaleDateString()}`}
              onDelete={() =>
                handleDateRangeChange({ ...dateRange, start: null })
              }
              size="small"
              color="info"
              sx={{
                borderRadius: "8px",
                fontWeight: 500,
                fontSize: "0.75rem",
                "& .MuiChip-deleteIcon": {
                  fontSize: "0.875rem",
                },
              }}
            />
          )}
          {dateRange.end && (
            <Chip
              label={`To: ${new Date(dateRange.end).toLocaleDateString()}`}
              onDelete={() =>
                handleDateRangeChange({ ...dateRange, end: null })
              }
              size="small"
              color="info"
              sx={{
                borderRadius: "8px",
                fontWeight: 500,
                fontSize: "0.75rem",
                "& .MuiChip-deleteIcon": {
                  fontSize: "0.875rem",
                },
              }}
            />
          )}
        </Box>
      )}

      {/* Transaction list */}
      <Box
        sx={{
          backgroundColor: "white",
          borderRadius: selectMode ? 0 : "0 0 16px 16px",
          overflow: "hidden",
          boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
        }}
      >
        {isLoading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              p: 6,
            }}
          >
            <CircularProgress size={32} />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
              Loading transactions...
            </Typography>
          </Box>
        ) : paginatedTransactions.length === 0 ? (
          <Box
            sx={{
              textAlign: "center",
              py: 6,
              px: 3,
              color: "text.secondary",
            }}
          >
            <SearchIcon
              sx={{ fontSize: 48, color: "rgba(0,0,0,0.1)", mb: 2 }}
            />
            <Typography variant="h6" gutterBottom color="text.secondary">
              No transactions found
            </Typography>
            <Typography variant="body2">
              {searchQuery || selectedCategory || selectedType !== "all"
                ? "Try adjusting your filters or search query"
                : "Add your first transaction to get started"}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ overflow: "hidden" }}>
            {selectMode && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  px: 2.5,
                  py: 1.5,
                  bgcolor: "rgba(25, 118, 210, 0.05)",
                  borderBottom: "1px solid rgba(0,0,0,0.06)",
                }}
              >
                <FormControl
                  size="small"
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Checkbox
                    checked={
                      paginatedTransactions.length > 0 &&
                      selectedTransactions.length ===
                        paginatedTransactions.length
                    }
                    indeterminate={
                      selectedTransactions.length > 0 &&
                      selectedTransactions.length < paginatedTransactions.length
                    }
                    onChange={handleSelectAll}
                    sx={{
                      color: "rgba(0,0,0,0.4)",
                      "&.Mui-checked": {
                        color: "primary.main",
                      },
                      "&.MuiCheckbox-indeterminate": {
                        color: "primary.main",
                      },
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      color:
                        selectedTransactions.length > 0
                          ? "primary.main"
                          : "text.secondary",
                    }}
                  >
                    {selectedTransactions.length === 0
                      ? "Select items"
                      : `${selectedTransactions.length} selected`}
                  </Typography>
                </FormControl>
                {selectedTransactions.length > 0 && (
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={handleBatchDelete}
                    startIcon={<Delete fontSize="small" />}
                    sx={{
                      borderRadius: "12px",
                      textTransform: "none",
                      boxShadow: "none",
                      px: 2,
                      "&:hover": {
                        boxShadow: "0 2px 8px rgba(244, 67, 54, 0.3)",
                      },
                    }}
                  >
                    Delete Selected
                  </Button>
                )}
              </Box>
            )}

            {/* List of transactions with improved styling */}
            <Box>
              {paginatedTransactions.map((transaction, index) => (
                <Box
                  key={transaction.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    p: 2.5,
                    borderBottom:
                      index < paginatedTransactions.length - 1
                        ? "1px solid rgba(0,0,0,0.06)"
                        : "none",
                    transition: "background-color 0.2s",
                    "&:hover": {
                      backgroundColor: "rgba(0,0,0,0.02)",
                    },
                    position: "relative",
                  }}
                >
                  {selectMode && (
                    <Checkbox
                      checked={selectedTransactions.some(
                        (t) => t.id === transaction.id
                      )}
                      onChange={() => handleSelect(transaction)}
                      sx={{
                        mr: 1,
                        color: "rgba(0,0,0,0.4)",
                        "&.Mui-checked": {
                          color: "primary.main",
                        },
                      }}
                    />
                  )}
                  <Box
                    sx={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor:
                        transaction?.receiptImage || transaction?.receiptUrl
                          ? "pointer"
                          : "default",
                    }}
                    onClick={() => {
                      if (
                        !selectMode &&
                        (transaction?.receiptImage || transaction?.receiptUrl)
                      ) {
                        handleOpenReceiptViewer(transaction);
                      }
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: "14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mr: 2,
                          background:
                            transaction.type === "expense"
                              ? "linear-gradient(135deg, rgba(244, 67, 54, 0.12) 0%, rgba(244, 67, 54, 0.06) 100%)"
                              : "linear-gradient(135deg, rgba(76, 175, 80, 0.12) 0%, rgba(76, 175, 80, 0.06) 100%)",
                          color:
                            transaction.type === "expense"
                              ? "#f44336"
                              : "#4caf50",
                          boxShadow:
                            transaction.type === "expense"
                              ? "0 2px 8px rgba(244, 67, 54, 0.1)"
                              : "0 2px 8px rgba(76, 175, 80, 0.1)",
                        }}
                      >
                        {transaction.type === "expense" ? (
                          <TrendingDown />
                        ) : (
                          <TrendingUp />
                        )}
                      </Box>
                      <Box>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 600,
                            mb: 0.5,
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          {transaction.description}
                          {(transaction?.receiptImage ||
                            transaction?.receiptUrl) && (
                            <Tooltip title="Receipt attached - click to view">
                              <Receipt
                                sx={{
                                  ml: 1,
                                  fontSize: "1rem",
                                  color: "rgba(0, 0, 0, 0.4)",
                                  opacity: 0.7,
                                }}
                              />
                            </Tooltip>
                          )}
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 1,
                          }}
                        >
                          <Chip
                            label={transaction.categoryName || "Uncategorized"}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: "0.75rem",
                              bgcolor:
                                transaction.type === "expense"
                                  ? "rgba(244, 67, 54, 0.08)"
                                  : "rgba(76, 175, 80, 0.08)",
                              color:
                                transaction.type === "expense"
                                  ? "#d32f2f"
                                  : "#2e7d32",
                              borderRadius: "8px",
                              fontWeight: 500,
                            }}
                          />
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "flex", alignItems: "center" }}
                          >
                            <CalendarToday sx={{ fontSize: 12, mr: 0.5 }} />
                            {new Date(transaction.date).toLocaleDateString(
                              undefined,
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </Typography>
                          {transaction.paymentMethod && (
                            <Chip
                              icon={
                                <Receipt
                                  sx={{ fontSize: "0.75rem !important" }}
                                />
                              }
                              label={transaction.paymentMethod}
                              size="small"
                              variant="outlined"
                              sx={{
                                height: 22,
                                fontSize: "0.75rem",
                                borderRadius: "8px",
                                borderColor: "rgba(0,0,0,0.12)",
                                color: "text.secondary",
                              }}
                            />
                          )}
                          {transaction.isRecurring && (
                            <Tooltip title="Recurring Transaction">
                              <Chip
                                icon={
                                  <Autorenew
                                    sx={{ fontSize: "0.75rem !important" }}
                                  />
                                }
                                label="Recurring"
                                size="small"
                                sx={{
                                  height: 22,
                                  fontSize: "0.75rem",
                                  bgcolor: "rgba(103, 58, 183, 0.1)",
                                  color: "#5e35b1",
                                  borderRadius: "8px",
                                  fontWeight: 500,
                                }}
                              />
                            </Tooltip>
                          )}
                        </Box>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: "right", minWidth: "120px" }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: "700",
                          fontSize: "1.125rem",
                          color:
                            transaction.type === "expense"
                              ? "#d32f2f"
                              : "#2e7d32",
                          mb: 0.5,
                        }}
                      >
                        {transaction.type === "expense" ? "-" : "+"}
                        {formatAmount(transaction.amount)}
                      </Typography>
                      {transaction.notes && (
                        <Tooltip title={transaction.notes}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              bgcolor: "rgba(0,0,0,0.04)",
                              px: 1,
                              py: 0.25,
                              borderRadius: 1,
                            }}
                          >
                            <InfoOutlined sx={{ fontSize: 12, mr: 0.5 }} />
                            Note
                          </Typography>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>

                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActionClick(e, transaction);
                    }}
                    sx={{
                      ml: 1,
                      color: "text.secondary",
                      backgroundColor: "rgba(0,0,0,0.03)",
                      "&:hover": {
                        backgroundColor: "rgba(0,0,0,0.08)",
                        color: "text.primary",
                      },
                      transition: "all 0.2s ease",
                    }}
                  >
                    <MoreVert fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>

            {/* Pagination */}
            {pageCount > 1 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  borderTop: "1px solid rgba(0,0,0,0.06)",
                  p: 2,
                }}
              >
                <Stack direction="row" spacing={0.5}>
                  {Array.from({ length: pageCount }, (_, i) => i + 1).map(
                    (page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "contained" : "text"}
                        onClick={() => handlePageChange(page)}
                        size="small"
                        sx={{
                          minWidth: 36,
                          height: 36,
                          borderRadius: "12px",
                          p: 0,
                          boxShadow: "none",
                          "&.MuiButton-contained": {
                            "&:hover": {
                              boxShadow: "0 2px 8px rgba(25, 118, 210, 0.3)",
                            },
                          },
                        }}
                      >
                        {page}
                      </Button>
                    )
                  )}
                </Stack>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Menus */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionClose}
        PaperProps={{
          sx: {
            boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
            borderRadius: "16px",
            width: 220,
            overflow: "hidden",
            p: 1,
            "& .MuiMenuItem-root": {
              borderRadius: "8px",
              mx: 0.5,
              my: 0.25,
              px: 2,
              py: 1.25,
            },
          },
        }}
      >
        <MenuItem onClick={handleEdit} dense>
          <ListItemIcon>
            <Edit fontSize="small" sx={{ color: "primary.main" }} />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontWeight: 500 }}>
            Edit Transaction
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={handleAttachReceipt} dense>
          <ListItemIcon>
            <Receipt fontSize="small" sx={{ color: "#673ab7" }} />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontWeight: 500 }}>
            {actionTransaction?.receiptImage || actionTransaction?.receiptUrl
              ? "View Receipt"
              : "Attach Receipt"}
          </ListItemText>
        </MenuItem>
        {(actionTransaction?.receiptImage || actionTransaction?.receiptUrl) && (
          <MenuItem onClick={handleDeleteReceipt} dense>
            <ListItemIcon>
              <Delete fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText
              primaryTypographyProps={{ fontWeight: 500, color: "error.main" }}
            >
              Delete Receipt
            </ListItemText>
          </MenuItem>
        )}
        <Divider sx={{ my: 0.75 }} />
        <MenuItem onClick={handleDelete} dense>
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText
            primaryTypographyProps={{ fontWeight: 500, color: "error.main" }}
          >
            Delete Transaction
          </ListItemText>
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={handleFilterClose}
        PaperProps={{
          sx: {
            boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
            borderRadius: "16px",
            width: 260,
            overflow: "hidden",
            p: 1,
            "& .MuiMenuItem-root": {
              borderRadius: "8px",
              mx: 0.5,
              my: 0.25,
              px: 2,
              py: 1.25,
            },
          },
        }}
      >
        <MenuItem dense disabled>
          <Typography
            variant="caption"
            sx={{
              fontWeight: "700",
              color: "text.secondary",
              letterSpacing: 0.5,
            }}
          >
            TRANSACTION TYPE
          </Typography>
        </MenuItem>
        <MenuItem
          onClick={() => setTransactionType("all")}
          dense
          selected={selectedType === "all"}
          sx={{ borderRadius: "8px", position: "relative" }}
        >
          <ListItemText
            primary="All Transactions"
            primaryTypographyProps={{
              fontWeight: selectedType === "all" ? 600 : 400,
            }}
          />
          {selectedType === "all" && (
            <Box
              sx={{
                position: "absolute",
                width: 4,
                height: "70%",
                left: 0,
                borderRadius: "0 4px 4px 0",
                backgroundColor: "primary.main",
              }}
            />
          )}
        </MenuItem>
        <MenuItem
          onClick={() => setTransactionType("expense")}
          dense
          selected={selectedType === "expense"}
          sx={{ borderRadius: "8px", position: "relative" }}
        >
          <ListItemText
            primary="Expenses"
            primaryTypographyProps={{
              fontWeight: selectedType === "expense" ? 600 : 400,
            }}
          />
          {selectedType === "expense" && (
            <Box
              sx={{
                position: "absolute",
                width: 4,
                height: "70%",
                left: 0,
                borderRadius: "0 4px 4px 0",
                backgroundColor: "primary.main",
              }}
            />
          )}
        </MenuItem>
        <MenuItem
          onClick={() => setTransactionType("revenue")}
          dense
          selected={selectedType === "revenue"}
          sx={{ borderRadius: "8px", position: "relative" }}
        >
          <ListItemText
            primary="Revenue"
            primaryTypographyProps={{
              fontWeight: selectedType === "revenue" ? 600 : 400,
            }}
          />
          {selectedType === "revenue" && (
            <Box
              sx={{
                position: "absolute",
                width: 4,
                height: "70%",
                left: 0,
                borderRadius: "0 4px 4px 0",
                backgroundColor: "primary.main",
              }}
            />
          )}
        </MenuItem>
        <Divider sx={{ my: 0.75 }} />

        <MenuItem dense disabled>
          <Typography
            variant="caption"
            sx={{
              fontWeight: "700",
              color: "text.secondary",
              letterSpacing: 0.5,
            }}
          >
            DATE RANGE
          </Typography>
        </MenuItem>
        <MenuItem
          onClick={openDatePicker}
          dense
          sx={{ borderRadius: "8px", position: "relative" }}
        >
          <ListItemIcon>
            <DateRange fontSize="small" color="action" />
          </ListItemIcon>
          <ListItemText
            primary="Select Date Range"
            primaryTypographyProps={{ fontWeight: 500 }}
          />
        </MenuItem>
        <Divider sx={{ my: 0.75 }} />

        <MenuItem dense disabled>
          <Typography
            variant="caption"
            sx={{
              fontWeight: "700",
              color: "text.secondary",
              letterSpacing: 0.5,
            }}
          >
            CATEGORY
          </Typography>
        </MenuItem>
        <MenuItem
          onClick={() => setCategoryFilter("")}
          dense
          selected={selectedCategory === ""}
          sx={{ borderRadius: "8px", position: "relative" }}
        >
          <ListItemText
            primary="All Categories"
            primaryTypographyProps={{
              fontWeight: selectedCategory === "" ? 600 : 400,
            }}
          />
          {selectedCategory === "" && (
            <Box
              sx={{
                position: "absolute",
                width: 4,
                height: "70%",
                left: 0,
                borderRadius: "0 4px 4px 0",
                backgroundColor: "primary.main",
              }}
            />
          )}
        </MenuItem>
        {[...categories, ...revenueCategories]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((category) => (
            <MenuItem
              key={category.id}
              onClick={() => setCategoryFilter(category.id)}
              dense
              selected={selectedCategory === category.id}
              sx={{ borderRadius: "8px", position: "relative" }}
            >
              <ListItemText
                primary={category.name}
                primaryTypographyProps={{
                  fontWeight: selectedCategory === category.id ? 600 : 400,
                }}
              />
              {selectedCategory === category.id && (
                <Box
                  sx={{
                    position: "absolute",
                    width: 4,
                    height: "70%",
                    left: 0,
                    borderRadius: "0 4px 4px 0",
                    backgroundColor: "primary.main",
                  }}
                />
              )}
            </MenuItem>
          ))}
      </Menu>

      <Menu
        anchorEl={sortMenuAnchor}
        open={Boolean(sortMenuAnchor)}
        onClose={handleSortClose}
        PaperProps={{
          sx: {
            boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
            borderRadius: "16px",
            width: 220,
            overflow: "hidden",
            p: 1,
            "& .MuiMenuItem-root": {
              borderRadius: "8px",
              mx: 0.5,
              my: 0.25,
              px: 2,
              py: 1.25,
            },
          },
        }}
      >
        <MenuItem dense disabled>
          <Typography
            variant="caption"
            sx={{
              fontWeight: "700",
              color: "text.secondary",
              letterSpacing: 0.5,
            }}
          >
            SORT BY
          </Typography>
        </MenuItem>
        <MenuItem
          onClick={() => handleSetSort("date")}
          dense
          selected={sortField === "date"}
          sx={{ borderRadius: "8px", position: "relative" }}
        >
          <ListItemIcon>
            {sortField === "date" ? (
              sortDirection === "asc" ? (
                <ArrowUpward fontSize="small" color="primary" />
              ) : (
                <ArrowDownward fontSize="small" color="primary" />
              )
            ) : null}
          </ListItemIcon>
          <ListItemText
            primary="Date"
            primaryTypographyProps={{
              fontWeight: sortField === "date" ? 600 : 400,
            }}
          />
          {sortField === "date" && (
            <Box
              sx={{
                position: "absolute",
                width: 4,
                height: "70%",
                left: 0,
                borderRadius: "0 4px 4px 0",
                backgroundColor: "primary.main",
              }}
            />
          )}
        </MenuItem>
        <MenuItem
          onClick={() => handleSetSort("amount")}
          dense
          selected={sortField === "amount"}
          sx={{ borderRadius: "8px", position: "relative" }}
        >
          <ListItemIcon>
            {sortField === "amount" ? (
              sortDirection === "asc" ? (
                <ArrowUpward fontSize="small" color="primary" />
              ) : (
                <ArrowDownward fontSize="small" color="primary" />
              )
            ) : null}
          </ListItemIcon>
          <ListItemText
            primary="Amount"
            primaryTypographyProps={{
              fontWeight: sortField === "amount" ? 600 : 400,
            }}
          />
          {sortField === "amount" && (
            <Box
              sx={{
                position: "absolute",
                width: 4,
                height: "70%",
                left: 0,
                borderRadius: "0 4px 4px 0",
                backgroundColor: "primary.main",
              }}
            />
          )}
        </MenuItem>
        <MenuItem
          onClick={() => handleSetSort("description")}
          dense
          selected={sortField === "description"}
          sx={{ borderRadius: "8px", position: "relative" }}
        >
          <ListItemIcon>
            {sortField === "description" ? (
              sortDirection === "asc" ? (
                <ArrowUpward fontSize="small" color="primary" />
              ) : (
                <ArrowDownward fontSize="small" color="primary" />
              )
            ) : null}
          </ListItemIcon>
          <ListItemText
            primary="Description"
            primaryTypographyProps={{
              fontWeight: sortField === "description" ? 600 : 400,
            }}
          />
          {sortField === "description" && (
            <Box
              sx={{
                position: "absolute",
                width: 4,
                height: "70%",
                left: 0,
                borderRadius: "0 4px 4px 0",
                backgroundColor: "primary.main",
              }}
            />
          )}
        </MenuItem>
        <MenuItem
          onClick={() => handleSetSort("categoryName")}
          dense
          selected={sortField === "categoryName"}
          sx={{ borderRadius: "8px", position: "relative" }}
        >
          <ListItemIcon>
            {sortField === "categoryName" ? (
              sortDirection === "asc" ? (
                <ArrowUpward fontSize="small" color="primary" />
              ) : (
                <ArrowDownward fontSize="small" color="primary" />
              )
            ) : null}
          </ListItemIcon>
          <ListItemText
            primary="Category"
            primaryTypographyProps={{
              fontWeight: sortField === "categoryName" ? 600 : 400,
            }}
          />
          {sortField === "categoryName" && (
            <Box
              sx={{
                position: "absolute",
                width: 4,
                height: "70%",
                left: 0,
                borderRadius: "0 4px 4px 0",
                backgroundColor: "primary.main",
              }}
            />
          )}
        </MenuItem>
      </Menu>

      {/* Dialog for confirming batch delete */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={closeConfirmDelete}
        PaperProps={{
          sx: { borderRadius: "16px", maxWidth: 400 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, pt: 3, pb: 1 }}>
          Delete {selectedTransactions.length} Transactions?
        </DialogTitle>
        <DialogContent>
          <Alert
            severity="warning"
            variant="filled"
            sx={{
              mb: 2,
              borderRadius: "12px",
              "& .MuiAlert-icon": {
                fontSize: "1.5rem",
                alignItems: "center",
              },
            }}
          >
            <AlertTitle sx={{ fontWeight: 600 }}>Warning</AlertTitle>
            This action cannot be undone. All selected transactions will be
            permanently deleted.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={closeConfirmDelete}
            variant="outlined"
            sx={{
              borderRadius: "12px",
              textTransform: "none",
              mr: 1,
              px: 3,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmBatchDelete}
            color="error"
            variant="contained"
            sx={{
              borderRadius: "12px",
              textTransform: "none",
              px: 3,
              boxShadow: "0 4px 16px rgba(244, 67, 54, 0.2)",
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Date Range Picker Dialog */}
      <Dialog
        open={datePickerOpen}
        onClose={handleDatePickerClose}
        PaperProps={{
          sx: { borderRadius: "16px", maxWidth: 400, p: 1 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, pt: 2 }}>
          Select Date Range
        </DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ my: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
                Start Date
              </Typography>
              <DatePicker
                value={dateRange.start}
                onChange={(newValue) => {
                  setDateRange({ ...dateRange, start: newValue });
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    sx: {
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "12px",
                      },
                    },
                  },
                }}
              />
            </Box>
            <Box sx={{ my: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
                End Date
              </Typography>
              <DatePicker
                value={dateRange.end}
                onChange={(newValue) => {
                  setDateRange({ ...dateRange, end: newValue });
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    sx: {
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "12px",
                      },
                    },
                  },
                }}
              />
            </Box>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleDatePickerClose}
            variant="outlined"
            sx={{
              borderRadius: "12px",
              textTransform: "none",
              mr: 1,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleDateRangeChange(dateRange)}
            variant="contained"
            sx={{
              borderRadius: "12px",
              textTransform: "none",
              px: 3,
            }}
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnhancedTransactionList;
