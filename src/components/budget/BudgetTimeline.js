import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ToggleButtonGroup,
  ToggleButton,
  Paper,
  Tooltip,
  Button,
  IconButton,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  ComposedChart,
} from "recharts";
import { DatePicker } from "@mui/x-date-pickers";
import {
  CalendarMonth,
  ShowChart,
  BarChart as BarChartIcon,
  StackedBarChartOutlined,
  InfoOutlined,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { useCurrency } from "../../contexts/CurrencyContext";

const BudgetTimeline = ({ transactions, categories, categoryBudgets }) => {
  const [timeRange, setTimeRange] = useState("year");
  const [chartType, setChartType] = useState("bar");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [chartData, setChartData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [comparisonMode, setComparisonMode] = useState(false);

  // Get currency formatting from context
  const { formatAmount } = useCurrency();

  useEffect(() => {
    generateChartData();
  }, [
    transactions,
    categories,
    timeRange,
    selectedCategory,
    selectedYear,
    comparisonMode,
  ]);

  const generateChartData = () => {
    if (!transactions || transactions.length === 0) {
      setChartData([]);
      return;
    }

    const data = [];
    let dateFormat;
    let groupByFn;

    if (timeRange === "year") {
      // Group by month for yearly view
      dateFormat = (date) => {
        const d = new Date(date);
        return d.toLocaleString("default", { month: "short" });
      };
      groupByFn = (date) => {
        const d = new Date(date);
        return d.getMonth();
      };

      // Initialize months
      for (let i = 0; i < 12; i++) {
        const month = new Date(selectedYear, i, 1);
        data.push({
          name: month.toLocaleString("default", { month: "short" }),
          month: i,
          expenses: 0,
          budget: getCategoryBudgetForMonth(selectedCategory, month),
        });
      }
    } else if (timeRange === "month") {
      // Group by day for monthly view
      const currentDate = new Date();
      const year = selectedYear || currentDate.getFullYear();
      const month = currentDate.getMonth(); // Default to current month
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      dateFormat = (date) => {
        const d = new Date(date);
        return d.getDate();
      };
      groupByFn = (date) => {
        const d = new Date(date);
        return d.getDate() - 1; // Adjust for 0-indexed array
      };

      // Initialize days
      for (let i = 1; i <= daysInMonth; i++) {
        data.push({
          name: i,
          day: i,
          expenses: 0,
          budget: getCategoryBudgetForDay(
            selectedCategory,
            new Date(year, month, i)
          ),
        });
      }
    } else if (timeRange === "quarter") {
      // Group by month for quarterly view
      const currentDate = new Date();
      const currentQuarter = Math.floor(currentDate.getMonth() / 3);
      const startMonth = currentQuarter * 3;

      dateFormat = (date) => {
        const d = new Date(date);
        return d.toLocaleString("default", { month: "short" });
      };
      groupByFn = (date) => {
        const d = new Date(date);
        const monthIdx = d.getMonth();
        return monthIdx - startMonth; // Relative to start of quarter
      };

      // Initialize months for the quarter
      for (let i = 0; i < 3; i++) {
        const month = new Date(selectedYear, startMonth + i, 1);
        data.push({
          name: month.toLocaleString("default", { month: "short" }),
          month: startMonth + i,
          expenses: 0,
          budget: getCategoryBudgetForMonth(selectedCategory, month),
        });
      }
    } else if (timeRange === "week") {
      // Group by day for weekly view
      const today = new Date();
      const day = today.getDay(); // 0 = Sunday, 6 = Saturday
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - day); // Go to beginning of week (Sunday)

      dateFormat = (date) => {
        const d = new Date(date);
        return d.toLocaleString("default", { weekday: "short" });
      };
      groupByFn = (date) => {
        const d = new Date(date);
        return d.getDay();
      };

      // Initialize days of the week
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        data.push({
          name: days[i],
          day: i,
          date: new Date(currentDate).toLocaleDateString(),
          expenses: 0,
          budget: getCategoryBudgetForDay(selectedCategory, currentDate),
        });
      }
    }

    // Process transactions
    transactions.forEach((transaction) => {
      if (!transaction.date) return;

      const transactionDate = new Date(transaction.date);
      const transactionYear = transactionDate.getFullYear();

      // Skip transactions not in the selected year
      if (transactionYear !== selectedYear) return;

      // Filter by category if one is selected
      if (
        selectedCategory !== "all" &&
        transaction.category !== selectedCategory
      )
        return;

      // Only include expenses
      if (transaction.type !== "expense") return;

      const amount = Number(transaction.amount);
      if (isNaN(amount)) return;

      const groupKey = groupByFn(transaction.date);
      if (groupKey >= 0 && groupKey < data.length) {
        data[groupKey].expenses += amount;

        if (comparisonMode) {
          // Add to specific category if comparison mode
          const categoryKey = transaction.category;
          if (!data[groupKey][categoryKey]) {
            data[groupKey][categoryKey] = 0;
          }
          data[groupKey][categoryKey] += amount;
        }
      }
    });

    setChartData(data);
  };

  const getCategoryBudgetForMonth = (categoryId, date) => {
    if (categoryId === "all") {
      let totalBudget = 0;
      categories.forEach((category) => {
        totalBudget += categoryBudgets[category.id] || 0;
      });
      return totalBudget;
    } else {
      return categoryBudgets[categoryId] || 0;
    }
  };

  const getCategoryBudgetForDay = (categoryId, date) => {
    const monthlyBudget = getCategoryBudgetForMonth(categoryId, date);
    const daysInMonth = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0
    ).getDate();
    return monthlyBudget / daysInMonth;
  };

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  const handleChartTypeChange = (event, newChartType) => {
    if (newChartType !== null) {
      setChartType(newChartType);
    }
  };

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
  };

  const handleYearChange = (value) => {
    setSelectedYear(value);
  };

  const handleComparisonToggle = () => {
    setComparisonMode(!comparisonMode);
  };

  const getCategoryColor = (category) => {
    const colors = [
      "#4A8FE7", // Blue
      "#E57373", // Red
      "#66BB6A", // Green
      "#FFA726", // Orange
      "#AB47BC", // Purple
      "#42A5F5", // Light Blue
      "#FF8A65", // Orange/Peach
      "#29B6F6", // Light Blue 2
    ];

    if (category === "expenses") return "#f44336";
    if (category === "budget") return "#4caf50";

    const categoryIndex = categories.findIndex((cat) => cat.id === category);
    if (categoryIndex !== -1) {
      return colors[categoryIndex % colors.length];
    }

    // Default color
    return "#2196f3";
  };

  const customTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper
          sx={{
            p: 2,
            boxShadow: "0 3px 14px rgba(0,0,0,0.15)",
            borderRadius: 2,
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {label}
          </Typography>

          {payload.map((entry, index) => (
            <Box
              key={`tooltip-${index}`}
              sx={{ display: "flex", alignItems: "center", mb: 0.5 }}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: entry.color,
                  mr: 1,
                }}
              />
              <Typography variant="body2" sx={{ mr: 1 }}>
                {entry.name}:
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {formatAmount(entry.value)}
              </Typography>
            </Box>
          ))}
        </Paper>
      );
    }
    return null;
  };

  const renderChart = () => {
    const ChartComponent =
      chartType === "bar"
        ? BarChart
        : chartType === "line"
        ? LineChart
        : chartType === "area"
        ? AreaChart
        : ComposedChart;

    return (
      <ResponsiveContainer width="100%" height={400}>
        <ChartComponent
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="name"
            tick={{ fill: "#666" }}
            axisLine={{ stroke: "#e0e0e0" }}
          />
          <YAxis
            tick={{ fill: "#666" }}
            axisLine={{ stroke: "#e0e0e0" }}
            tickFormatter={(value) => `$${value}`}
          />
          <RechartsTooltip content={customTooltip} />
          <Legend />

          {comparisonMode ? (
            // Render bars for each category in comparison mode
            categories.map((category, index) => (
              <Bar
                key={category.id}
                dataKey={category.id}
                name={category.name}
                fill={getCategoryColor(category.id)}
                animationDuration={1500}
                animationEasing="ease-out"
                radius={[4, 4, 0, 0]}
              />
            ))
          ) : (
            <>
              {chartType === "bar" && (
                <>
                  <Bar
                    dataKey="expenses"
                    name="Expenses"
                    fill="#f44336"
                    radius={[4, 4, 0, 0]}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                  <Bar
                    dataKey="budget"
                    name="Budget"
                    fill="#4caf50"
                    radius={[4, 4, 0, 0]}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                </>
              )}

              {chartType === "line" && (
                <>
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    name="Expenses"
                    stroke="#f44336"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                  <Line
                    type="monotone"
                    dataKey="budget"
                    name="Budget"
                    stroke="#4caf50"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                </>
              )}

              {chartType === "area" && (
                <>
                  <Area
                    type="monotone"
                    dataKey="budget"
                    name="Budget"
                    fill="#a5d6a7"
                    stroke="#4caf50"
                    strokeWidth={2}
                    fillOpacity={0.3}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    name="Expenses"
                    fill="#ffcdd2"
                    stroke="#f44336"
                    strokeWidth={2}
                    fillOpacity={0.3}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                </>
              )}

              {chartType === "composed" && (
                <>
                  <Bar
                    dataKey="expenses"
                    name="Expenses"
                    barSize={20}
                    fill="#f44336"
                    radius={[4, 4, 0, 0]}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                  <Line
                    type="monotone"
                    dataKey="budget"
                    name="Budget"
                    stroke="#4caf50"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                </>
              )}
            </>
          )}
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card
        sx={{
          mt: 4,
          borderRadius: 3,
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        <CardContent>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
            Budget Timeline
            <Tooltip title="Visualize your spending patterns over time and compare with your budget allocations">
              <IconButton size="small" sx={{ ml: 1, mt: -0.5 }}>
                <InfoOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          </Typography>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="time-range-label">Time Range</InputLabel>
                <Select
                  labelId="time-range-label"
                  id="time-range-select"
                  value={timeRange}
                  label="Time Range"
                  onChange={handleTimeRangeChange}
                >
                  <MenuItem value="week">Weekly</MenuItem>
                  <MenuItem value="month">Monthly</MenuItem>
                  <MenuItem value="quarter">Quarterly</MenuItem>
                  <MenuItem value="year">Yearly</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="category-select-label">Category</InputLabel>
                <Select
                  labelId="category-select-label"
                  id="category-select"
                  value={selectedCategory}
                  label="Category"
                  onChange={handleCategoryChange}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography variant="body2" sx={{ mr: 2 }}>
                  Year: {selectedYear}
                </Typography>
                <IconButton
                  onClick={() => setSelectedYear(selectedYear - 1)}
                  disabled={selectedYear <= new Date().getFullYear() - 5}
                  size="small"
                >
                  -
                </IconButton>

                <IconButton
                  onClick={() => setSelectedYear(selectedYear + 1)}
                  disabled={selectedYear >= new Date().getFullYear()}
                  size="small"
                >
                  +
                </IconButton>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant={comparisonMode ? "contained" : "outlined"}
                  size="small"
                  onClick={handleComparisonToggle}
                  startIcon={<StackedBarChartOutlined />}
                  sx={{
                    borderRadius: 2,
                    boxShadow: comparisonMode ? 3 : 0,
                  }}
                >
                  {comparisonMode ? "Hide Comparison" : "Compare Categories"}
                </Button>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mb: 2, display: "flex", justifyContent: "center" }}>
            <ToggleButtonGroup
              value={chartType}
              exclusive
              onChange={handleChartTypeChange}
              aria-label="chart type"
              size="small"
              sx={{
                "& .MuiToggleButton-root": {
                  borderRadius: 1,
                  px: 2,
                  py: 1,
                },
              }}
            >
              <ToggleButton value="bar" aria-label="bar chart">
                <BarChartIcon fontSize="small" sx={{ mr: 0.5 }} />
                Bar
              </ToggleButton>
              <ToggleButton value="line" aria-label="line chart">
                <ShowChart fontSize="small" sx={{ mr: 0.5 }} />
                Line
              </ToggleButton>
              <ToggleButton value="area" aria-label="area chart">
                <StackedBarChartOutlined fontSize="small" sx={{ mr: 0.5 }} />
                Area
              </ToggleButton>
              <ToggleButton value="composed" aria-label="composed chart">
                <CalendarMonth fontSize="small" sx={{ mr: 0.5 }} />
                Combo
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box sx={{ height: 400, mt: 4 }}>
            {chartData.length > 0 ? (
              renderChart()
            ) : (
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  bgcolor: "rgba(0,0,0,0.02)",
                  borderRadius: 2,
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  No data available for the selected time period
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  Try changing the filters or adding more transactions
                </Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Card
                  variant="outlined"
                  sx={{ borderRadius: 2, bgcolor: "rgba(76, 175, 80, 0.05)" }}
                >
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Budget (Selected Period)
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{ color: "#4caf50", fontWeight: "bold" }}
                    >
                      {formatAmount(
                        chartData.reduce((sum, item) => sum + item.budget, 0)
                      )}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Card
                  variant="outlined"
                  sx={{ borderRadius: 2, bgcolor: "rgba(244, 67, 54, 0.05)" }}
                >
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Expenses (Selected Period)
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{ color: "#f44336", fontWeight: "bold" }}
                    >
                      {formatAmount(
                        chartData.reduce((sum, item) => sum + item.expenses, 0)
                      )}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Card
                  variant="outlined"
                  sx={{ borderRadius: 2, bgcolor: "rgba(33, 150, 243, 0.05)" }}
                >
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Typography variant="body2" color="text.secondary">
                      Balance
                    </Typography>
                    {(() => {
                      const budget = chartData.reduce(
                        (sum, item) => sum + item.budget,
                        0
                      );
                      const expenses = chartData.reduce(
                        (sum, item) => sum + item.expenses,
                        0
                      );
                      const balance = budget - expenses;
                      return (
                        <Typography
                          variant="h6"
                          sx={{
                            color: balance >= 0 ? "#4caf50" : "#f44336",
                            fontWeight: "bold",
                          }}
                        >
                          {formatAmount(balance)}
                        </Typography>
                      );
                    })()}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default BudgetTimeline;
