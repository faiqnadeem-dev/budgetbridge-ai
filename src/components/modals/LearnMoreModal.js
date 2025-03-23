import React from 'react';
import { Modal, Box, Typography, IconButton, Grid, Button } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import SpeedIcon from '@mui/icons-material/Speed';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import UpdateIcon from '@mui/icons-material/Update';

const LearnMoreModal = ({ open, handleClose }) => {
  const features = [
    {
      icon: <ShowChartIcon sx={{ fontSize: 40, color: '#1a237e' }} />,
      title: "Smart Analytics",
      description: "AI-powered insights to optimize your spending patterns"
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 40, color: '#1a237e' }} />,
      title: "Real-time Tracking",
      description: "Monitor your finances with live updates and alerts"
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: 40, color: '#1a237e' }} />,
      title: "Investment Tools",
      description: "Advanced portfolio management and investment tracking"
    },
    {
      icon: <UpdateIcon sx={{ fontSize: 40, color: '#1a237e' }} />,
      title: "Future Updates",
      description: "Coming soon: Crypto integration, AI predictions, and more"
    }
  ];

  return (
    <AnimatePresence>
      {open && (
        <Modal
        open={open}
        onClose={handleClose}
        closeAfterTransition
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            y: 0,
            transition: {
              type: "spring",
              stiffness: 300,
              damping: 30
            }
          }}
          exit={{ 
            opacity: 0,
            scale: 0.95,
            y: 20,
            transition: {
              duration: 0.2
            }
          }}
        >
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90%',
              maxWidth: 900,
              bgcolor: 'background.paper',
              borderRadius: 3,
              boxShadow: 24,
              p: 4
            }}>
              <IconButton
                onClick={handleClose}
                sx={{ position: 'absolute', right: 8, top: 8 }}
              >
                <CloseIcon />
              </IconButton>

              <Typography variant="h4" sx={{ mb: 1, color: '#1a237e' }}>
                Discover Smart Finance
              </Typography>

              <Typography variant="subtitle1" sx={{ mb: 4, color: 'text.secondary' }}>
                Your journey to financial freedom starts here
              </Typography>

              <Grid container spacing={4}>
                {features.map((feature, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        {feature.icon}
                        <Box>
                          <Typography variant="h6" sx={{ mb: 1 }}>
                            {feature.title}
                          </Typography>
                          <Typography variant="body1" color="text.secondary">
                            {feature.description}
                          </Typography>
                        </Box>
                      </Box>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>

              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleClose}
                  sx={{
                    bgcolor: '#1a237e',
                    '&:hover': { bgcolor: '#283593' }
                  }}
                >
                  Got It
                </Button>
              </Box>
            </Box>
          </motion.div>
        </Modal>
      )}
    </AnimatePresence>
  );
};

export default LearnMoreModal;
