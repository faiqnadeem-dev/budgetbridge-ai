import React, { useState } from "react";
import { Box, Tabs, Tab, Typography } from "@mui/material";
import BudgetProgressTracker from "./BudgetProgressTracker";
import BudgetTimeline from "./BudgetTimeline";
import BudgetRecommendations from "./BudgetRecommendations";

// Helper component for tab panels
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`budget-tabpanel-${index}`}
      aria-labelledby={`budget-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Accessibility props for tabs
function a11yProps(index) {
  return {
    id: `budget-tab-${index}`,
    "aria-controls": `budget-tabpanel-${index}`,
  };
}

const BudgetManagementPage = ({
  categories,
  categoryBudgets,
  transactions,
  currentMonth,
  onEditBudget,
}) => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h4" gutterBottom>
        Budget Management
      </Typography>
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        aria-label="Budget Management Tabs"
      >
        <Tab label="Overview" {...a11yProps(0)} />
        <Tab label="Recommendations" {...a11yProps(1)} />
      </Tabs>
      <TabPanel value={tabValue} index={0}>
        <BudgetProgressTracker
          categories={categories}
          categoryBudgets={categoryBudgets}
          transactions={transactions}
          currentMonth={currentMonth}
          onEditBudget={onEditBudget}
        />
        <BudgetTimeline
          transactions={transactions}
          categories={categories}
          categoryBudgets={categoryBudgets}
        />
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <BudgetRecommendations />
      </TabPanel>
    </Box>
  );
};

export default BudgetManagementPage;
