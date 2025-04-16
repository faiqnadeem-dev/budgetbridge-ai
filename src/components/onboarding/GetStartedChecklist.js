import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Button,
  LinearProgress,
  Fade
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  ExpandMore,
  ExpandLess,
  AccountBalanceWallet,
  Savings,
  CategoryOutlined,
  ReceiptLong,
  Close
} from '@mui/icons-material';

const GetStartedChecklist = ({ 
  onClose,
  hasSetIncome,
  hasCreatedBudgets,
  hasAddedExpense,
  hasAddedCategory,
  onSetIncome,
  onCreateBudget,
  onAddExpense,
  onManageCategories,
  onStartTour
}) => {
  const [expanded, setExpanded] = useState(true);
  const [progress, setProgress] = useState(0);

  // Calculate progress based on completed tasks
  useEffect(() => {
    let completedSteps = 0;
    if (hasSetIncome) completedSteps++;
    if (hasCreatedBudgets) completedSteps++;
    if (hasAddedCategory) completedSteps++;
    if (hasAddedExpense) completedSteps++;
    
    setProgress((completedSteps / 4) * 100);
  }, [hasSetIncome, hasCreatedBudgets, hasAddedExpense, hasAddedCategory]);

  return (
    <Fade in={true}>
      <Paper
        elevation={3}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 350,
          maxWidth: '90vw',
          zIndex: 1200,
          overflow: 'hidden',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'primary.light'
        }}
      >
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          backgroundColor: 'primary.main',
          color: 'white' 
        }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Getting Started ({Math.round(progress)}% Complete)
          </Typography>
          <Box>
            {expanded ? (
              <ExpandLess 
                sx={{ cursor: 'pointer', mr: 1 }} 
                onClick={() => setExpanded(false)} 
              />
            ) : (
              <ExpandMore 
                sx={{ cursor: 'pointer', mr: 1 }} 
                onClick={() => setExpanded(true)} 
              />
            )}
            <Close 
              sx={{ cursor: 'pointer' }} 
              fontSize="small" 
              onClick={onClose} 
            />
          </Box>
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ 
            height: 4,
            '& .MuiLinearProgress-bar': {
              backgroundColor: progress === 100 ? 'success.main' : 'primary.main'
            }
          }} 
        />
        
        <Collapse in={expanded} timeout="auto">
          <List dense sx={{ py: 0 }}>
            <ListItem 
              sx={{ 
                py: 1.5, 
                px: 2,
                backgroundColor: hasSetIncome ? 'rgba(76, 175, 80, 0.08)' : 'inherit'
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {hasSetIncome ? (
                  <CheckCircle color="success" fontSize="small" />
                ) : (
                  <RadioButtonUnchecked color="primary" fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText 
                primary="Set your monthly income" 
                secondary={hasSetIncome ? "Completed" : "Where it all begins"}
              />
              {!hasSetIncome && (
                <Button 
                  size="small" 
                  variant="outlined" 
                  onClick={onSetIncome}
                  startIcon={<AccountBalanceWallet fontSize="small" />}
                >
                  Set
                </Button>
              )}
            </ListItem>
            
            <ListItem 
              sx={{ 
                py: 1.5, 
                px: 2,
                backgroundColor: hasCreatedBudgets ? 'rgba(76, 175, 80, 0.08)' : 'inherit'
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {hasCreatedBudgets ? (
                  <CheckCircle color="success" fontSize="small" />
                ) : (
                  <RadioButtonUnchecked color={hasSetIncome ? "primary" : "disabled"} fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText 
                primary="Create your budget" 
                secondary={hasCreatedBudgets ? "Completed" : "Allocate money to categories"}
                sx={{
                  '& .MuiListItemText-secondary': {
                    color: hasSetIncome ? 'text.secondary' : 'text.disabled'
                  }
                }}
              />
              {!hasCreatedBudgets && hasSetIncome && (
                <Button 
                  size="small" 
                  variant="outlined" 
                  onClick={onCreateBudget}
                  startIcon={<Savings fontSize="small" />}
                >
                  Create
                </Button>
              )}
            </ListItem>
            
            <ListItem 
              sx={{ 
                py: 1.5, 
                px: 2,
                backgroundColor: hasAddedCategory ? 'rgba(76, 175, 80, 0.08)' : 'inherit'
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {hasAddedCategory ? (
                  <CheckCircle color="success" fontSize="small" />
                ) : (
                  <RadioButtonUnchecked color={hasSetIncome ? "primary" : "disabled"} fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText 
                primary="Customize your categories" 
                secondary={hasAddedCategory ? "Completed" : "Personalize to your needs"}
                sx={{
                  '& .MuiListItemText-secondary': {
                    color: hasSetIncome ? 'text.secondary' : 'text.disabled'
                  }
                }}
              />
              {!hasAddedCategory && hasSetIncome && (
                <Button 
                  size="small" 
                  variant="outlined" 
                  onClick={onManageCategories}
                  startIcon={<CategoryOutlined fontSize="small" />}
                >
                  Manage
                </Button>
              )}
            </ListItem>
            
            <ListItem 
              sx={{ 
                py: 1.5, 
                px: 2,
                backgroundColor: hasAddedExpense ? 'rgba(76, 175, 80, 0.08)' : 'inherit'
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {hasAddedExpense ? (
                  <CheckCircle color="success" fontSize="small" />
                ) : (
                  <RadioButtonUnchecked color={hasCreatedBudgets ? "primary" : "disabled"} fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText 
                primary="Track your first expense" 
                secondary={hasAddedExpense ? "Completed" : "Start tracking your spending"}
                sx={{
                  '& .MuiListItemText-secondary': {
                    color: hasCreatedBudgets ? 'text.secondary' : 'text.disabled'
                  }
                }}
              />
              {!hasAddedExpense && hasCreatedBudgets && (
                <Button 
                  size="small" 
                  variant="outlined" 
                  onClick={onAddExpense}
                  startIcon={<ReceiptLong fontSize="small" />}
                >
                  Add
                </Button>
              )}
            </ListItem>
          </List>
          
          <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth 
              onClick={onStartTour}
            >
              Take a Guided Tour
            </Button>
            {progress === 100 && (
              <Typography 
                variant="body2" 
                sx={{ mt: 1, color: 'success.main', fontWeight: 'medium' }}
              >
                🎉 You're all set! Keep tracking your finances.
              </Typography>
            )}
          </Box>
        </Collapse>
      </Paper>
    </Fade>
  );
};

export default GetStartedChecklist;
