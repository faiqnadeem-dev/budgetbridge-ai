import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Tooltip, 
  Paper, 
  Typography, 
  Fade,
  Stepper,
  Step,
  StepLabel,
  IconButton
} from '@mui/material';
import { 
  Close, 
  NavigateNext,
  NavigateBefore,
  CheckCircle
} from '@mui/icons-material';

// Tour steps configuration
const tourSteps = [
  {
    target: '#set-income-btn',
    title: 'Set Your Income',
    content: 'Start by setting your monthly income. This is the foundation of your budget planning.',
    placement: 'bottom'
  },
  {
    target: '#set-budget-btn',
    title: 'Create Your Budget',
    content: 'Next, set budgets for different spending categories to manage your finances effectively.',
    placement: 'bottom'
  },
  {
    target: '.add-expense-btn',
    title: 'Track Your Expenses',
    content: 'Add your expenses to see how you\'re spending against your budget categories.',
    placement: 'bottom'
  },
  {
    target: '.add-revenue-btn',
    title: 'Record Additional Income',
    content: 'Track any additional income beyond your regular monthly income.',
    placement: 'bottom'
  },
  {
    target: '#overview-section',
    title: 'Monitor Your Finances',
    content: 'Watch your financial overview to see your income, expenses, and savings at a glance.',
    placement: 'top'
  }
];

const GuidedTour = ({ open, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [elementVisible, setElementVisible] = useState(false);

  useEffect(() => {
    if (open) {
      // Check if the target element exists
      const checkElement = () => {
        const element = document.querySelector(tourSteps[currentStep].target);
        if (element) {
          setElementVisible(true);
          // Scroll to the element
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          setElementVisible(false);
        }
      };

      checkElement();
      // Recheck in case elements load dynamically
      const timer = setTimeout(checkElement, 500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, open]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Mark the tour as completed
    if (onComplete) {
      onComplete();
    }
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  if (!open) return null;

  const currentTourStep = tourSteps[currentStep];

  return (
    <>
      {/* Overlay */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1300,
          pointerEvents: 'none'
        }}
      />

      {/* Tour tooltip */}
      {elementVisible && (
        <Tooltip
          open={true}
          title={
            <Box sx={{ p: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">{currentTourStep.title}</Typography>
                <IconButton size="small" onClick={handleSkip} sx={{ color: 'white' }}>
                  <Close fontSize="small" />
                </IconButton>
              </Box>
              <Typography variant="body2" sx={{ mb: 2 }}>{currentTourStep.content}</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button 
                  size="small" 
                  onClick={handleBack} 
                  disabled={currentStep === 0}
                  startIcon={<NavigateBefore />}
                >
                  Back
                </Button>
                <Stepper activeStep={currentStep} sx={{ flex: 1, mx: 2 }}>
                  {tourSteps.map((_, index) => (
                    <Step key={index}>
                      <StepLabel />
                    </Step>
                  ))}
                </Stepper>
                <Button 
                  size="small" 
                  variant="contained" 
                  onClick={handleNext}
                  endIcon={currentStep === tourSteps.length - 1 ? <CheckCircle /> : <NavigateNext />}
                >
                  {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
                </Button>
              </Box>
            </Box>
          }
          placement={currentTourStep.placement}
          arrow
          componentsProps={{
            tooltip: {
              sx: {
                bgcolor: 'primary.dark',
                '& .MuiTooltip-arrow': {
                  color: 'primary.dark',
                },
                maxWidth: 350,
                p: 2
              }
            }
          }}
          PopperProps={{
            style: { pointerEvents: 'all' }
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none'
            }}
          />
        </Tooltip>
      )}

      {/* Floating control panel (only shown if element is not visible) */}
      {!elementVisible && (
        <Fade in={!elementVisible}>
          <Paper
            elevation={4}
            sx={{
              position: 'fixed',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              p: 2,
              zIndex: 1400,
              maxWidth: 400,
              pointerEvents: 'all'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Looking for {currentTourStep.title}
              </Typography>
              <IconButton size="small" onClick={handleSkip}>
                <Close fontSize="small" />
              </IconButton>
            </Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              The element for this step isn't visible right now. You may need to navigate to see it.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Button 
                size="small" 
                onClick={handleBack} 
                disabled={currentStep === 0}
                startIcon={<NavigateBefore />}
              >
                Back
              </Button>
              <Button 
                size="small" 
                variant="contained" 
                onClick={handleNext}
              >
                Skip this step
              </Button>
            </Box>
          </Paper>
        </Fade>
      )}
    </>
  );
};

export default GuidedTour;
