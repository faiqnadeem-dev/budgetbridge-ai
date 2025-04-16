import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  CircularProgress,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Tooltip,
  Chip,
  Alert,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  CheckCircle,
  Flag,
  Savings,
  DirectionsCar,
  Celebration,
  Home,
  School,
  FlightTakeoff,
  AttachMoney,
  SavingsOutlined,
  LocalHospital,
  MoreVert,
  Close,
} from "@mui/icons-material";
import { useCurrency } from "../../contexts/CurrencyContext";

const BudgetGoals = ({
  goals = [],
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  categories = [],
  transactions = [],
}) => {
  const [activeGoals, setActiveGoals] = useState([]);
  const [completedGoals, setCompletedGoals] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentGoal, setCurrentGoal] = useState(null);
  const [categoryAmounts, setCategoryAmounts] = useState({});
  const [dialogError, setDialogError] = useState("");

  // Form state for adding/editing goals
  const [goalName, setGoalName] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [goalIcon, setGoalIcon] = useState("savings");
  const [goalDeadline, setGoalDeadline] = useState("");
  const [goalCategory, setGoalCategory] = useState("");
  const [goalDescription, setGoalDescription] = useState("");

  // Get formatAmount from currency context
  const { formatAmount } = useCurrency();

  // Calculate total spent per category
  useEffect(() => {
    const amounts = {};
    categories.forEach((category) => {
      const categoryTransactions = transactions.filter(
        (t) => t.category === category.id
      );
      amounts[category.id] = categoryTransactions.reduce(
        (sum, t) => sum + Number(t.amount),
        0
      );
    });
    setCategoryAmounts(amounts);
  }, [transactions, categories]);

  // Split goals into active and completed
  useEffect(() => {
    const active = [];
    const completed = [];

    goals.forEach((goal) => {
      if (goal.completed) {
        completed.push(goal);
      } else {
        active.push(goal);
      }
    });

    // Sort active goals by deadline (closest first)
    active.sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    });

    // Sort completed goals by completion date (most recent first)
    completed.sort((a, b) => {
      if (!a.completedDate) return 1;
      if (!b.completedDate) return -1;
      return new Date(b.completedDate) - new Date(a.completedDate);
    });

    setActiveGoals(active);
    setCompletedGoals(completed);
  }, [goals]);

  // Calculate progress for a goal
  const calculateProgress = (goal) => {
    if (!goal.category) return 0;

    const currentAmount = categoryAmounts[goal.category] || 0;
    return Math.min(Math.round((currentAmount / goal.targetAmount) * 100), 100);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "No deadline";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Get days remaining until deadline
  const getDaysRemaining = (dateString) => {
    if (!dateString) return null;

    const deadline = new Date(dateString);
    const today = new Date();

    // Set hours to 0 for both dates to get accurate day count
    deadline.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  // Get icon for goal
  const getGoalIcon = (iconName) => {
    switch (iconName) {
      case "savings":
        return <Savings />;
      case "car":
        return <DirectionsCar />;
      case "celebration":
        return <Celebration />;
      case "home":
        return <Home />;
      case "school":
        return <School />;
      case "travel":
        return <FlightTakeoff />;
      case "money":
        return <AttachMoney />;
      case "investment":
        return <SavingsOutlined />;
      case "health":
        return <LocalHospital />;
      default:
        return <Savings />;
    }
  };

  // Handle opening dialog for adding new goal
  const handleOpenAddDialog = () => {
    setCurrentGoal(null);
    setGoalName("");
    setGoalAmount("");
    setGoalIcon("savings");
    setGoalDeadline("");
    setGoalCategory("");
    setGoalDescription("");
    setDialogError("");
    setIsDialogOpen(true);
  };

  // Handle opening dialog for editing goal
  const handleOpenEditDialog = (goal) => {
    setCurrentGoal(goal);
    setGoalName(goal.name);
    setGoalAmount(goal.targetAmount.toString());
    setGoalIcon(goal.icon || "savings");
    setGoalDeadline(goal.deadline || "");
    setGoalCategory(goal.category || "");
    setGoalDescription(goal.description || "");
    setDialogError("");
    setIsDialogOpen(true);
  };

  // Handle closing dialog
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  // Handle submitting goal form
  const handleSubmitGoal = () => {
    // Validate form
    if (!goalName.trim()) {
      setDialogError("Please enter a goal name");
      return;
    }

    if (!goalAmount || isNaN(Number(goalAmount)) || Number(goalAmount) <= 0) {
      setDialogError("Please enter a valid target amount");
      return;
    }

    // Prepare goal data
    const goalData = {
      id: currentGoal?.id, // Will be undefined for new goals
      name: goalName.trim(),
      targetAmount: Number(goalAmount),
      icon: goalIcon,
      deadline: goalDeadline || null,
      category: goalCategory || null,
      description: goalDescription.trim(),
      completed: currentGoal?.completed || false,
      completedDate: currentGoal?.completedDate || null,
      createdAt: currentGoal?.createdAt || new Date().toISOString(),
    };

    // Call appropriate handler
    if (currentGoal) {
      onUpdateGoal(goalData);
    } else {
      onAddGoal(goalData);
    }

    // Close dialog
    handleCloseDialog();
  };

  // Handle marking goal as complete
  const handleCompleteGoal = (goal) => {
    const updatedGoal = {
      ...goal,
      completed: true,
      completedDate: new Date().toISOString(),
    };
    onUpdateGoal(updatedGoal);
  };

  // Handle deleting goal
  const handleDeleteGoal = (goalId) => {
    if (window.confirm("Are you sure you want to delete this goal?")) {
      onDeleteGoal(goalId);
    }
  };

  return (
    <Box>
      {/* Active Goals Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h6">Active Financial Goals</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenAddDialog}
          >
            Add Goal
          </Button>
        </Box>

        {activeGoals.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            You don't have any active financial goals. Create one to start
            tracking your progress!
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {activeGoals.map((goal) => {
              const progress = calculateProgress(goal);
              const daysRemaining = getDaysRemaining(goal.deadline);

              return (
                <Grid item xs={12} sm={6} md={4} key={goal.id}>
                  <Card sx={{ height: "100%", position: "relative" }}>
                    <CardContent>
                      {/* Goal Icon and Name */}
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 2 }}
                      >
                        <Box
                          sx={{
                            mr: 1.5,
                            bgcolor: "primary.main",
                            color: "white",
                            borderRadius: "50%",
                            width: 40,
                            height: 40,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {getGoalIcon(goal.icon)}
                        </Box>
                        <Typography
                          variant="h6"
                          noWrap
                          sx={{ maxWidth: "70%" }}
                        >
                          {goal.name}
                        </Typography>

                        {/* Action buttons */}
                        <Box sx={{ position: "absolute", top: 8, right: 8 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEditDialog(goal)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteGoal(goal.id)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>

                      {/* Goal Amount */}
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: "medium", mb: 1 }}
                      >
                        {formatAmount(goal.targetAmount)}
                      </Typography>

                      {/* Progress Bar */}
                      <Box sx={{ mb: 1.5 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 0.5,
                          }}
                        >
                          <Typography variant="body2">Progress</Typography>
                          <Typography variant="body2">{progress}%</Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={progress}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: "grey.200",
                          }}
                        />
                      </Box>

                      {/* Additional Information */}
                      <Box sx={{ mt: 2 }}>
                        {goal.category && (
                          <Typography
                            variant="caption"
                            display="block"
                            color="text.secondary"
                          >
                            Category:{" "}
                            {categories.find((c) => c.id === goal.category)
                              ?.name || "Unknown"}
                          </Typography>
                        )}

                        {goal.deadline && (
                          <Typography
                            variant="caption"
                            display="block"
                            color={
                              daysRemaining < 0
                                ? "error.main"
                                : "text.secondary"
                            }
                          >
                            {daysRemaining < 0
                              ? `Overdue by ${Math.abs(daysRemaining)} days`
                              : `${daysRemaining} days remaining`}
                          </Typography>
                        )}
                      </Box>

                      {/* Complete Button */}
                      <Box
                        sx={{
                          mt: 2,
                          display: "flex",
                          justifyContent: "flex-end",
                        }}
                      >
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => handleCompleteGoal(goal)}
                          startIcon={<CheckCircle />}
                        >
                          Complete
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Paper>

      {/* Completed Goals Section */}
      {completedGoals.length > 0 && (
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Completed Goals
          </Typography>

          <Grid container spacing={3}>
            {completedGoals.map((goal) => (
              <Grid item xs={12} sm={6} md={4} key={goal.id}>
                <Card
                  sx={{
                    height: "100%",
                    bgcolor: "success.light",
                    position: "relative",
                  }}
                >
                  <CardContent>
                    {/* Goal Icon and Name */}
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Box
                        sx={{
                          mr: 1.5,
                          bgcolor: "success.main",
                          color: "white",
                          borderRadius: "50%",
                          width: 40,
                          height: 40,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <CheckCircle />
                      </Box>
                      <Typography variant="h6" noWrap sx={{ maxWidth: "70%" }}>
                        {goal.name}
                      </Typography>

                      {/* Action buttons */}
                      <Box sx={{ position: "absolute", top: 8, right: 8 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteGoal(goal.id)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Goal Amount */}
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: "medium", mb: 1 }}
                    >
                      {formatAmount(goal.targetAmount)}
                    </Typography>

                    {/* Completion Info */}
                    <Typography variant="body2" color="success.dark">
                      Completed on {formatDate(goal.completedDate)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Add/Edit Goal Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {currentGoal ? "Edit Goal" : "Add New Financial Goal"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ my: 2 }}>
            {dialogError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {dialogError}
              </Alert>
            )}

            <Grid container spacing={2}>
              {/* Goal Name */}
              <Grid item xs={12}>
                <TextField
                  label="Goal Name"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  fullWidth
                  required
                />
              </Grid>

              {/* Goal Amount */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Target Amount"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                  fullWidth
                  type="number"
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">$</InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Goal Icon */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Icon</InputLabel>
                  <Select
                    value={goalIcon}
                    onChange={(e) => setGoalIcon(e.target.value)}
                    label="Icon"
                  >
                    <MenuItem value="savings">Savings</MenuItem>
                    <MenuItem value="car">Car</MenuItem>
                    <MenuItem value="home">Home</MenuItem>
                    <MenuItem value="travel">Travel</MenuItem>
                    <MenuItem value="celebration">Celebration</MenuItem>
                    <MenuItem value="school">Education</MenuItem>
                    <MenuItem value="money">Money</MenuItem>
                    <MenuItem value="investment">Investment</MenuItem>
                    <MenuItem value="health">Health</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Goal Deadline */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Target Date"
                  value={goalDeadline}
                  onChange={(e) => setGoalDeadline(e.target.value)}
                  fullWidth
                  type="date"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Goal Category */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={goalCategory}
                    onChange={(e) => setGoalCategory(e.target.value)}
                    label="Category"
                  >
                    <MenuItem value="">None</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Goal Description */}
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  value={goalDescription}
                  onChange={(e) => setGoalDescription(e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmitGoal} variant="contained">
            {currentGoal ? "Update" : "Create"} Goal
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BudgetGoals;
