import React from 'react';
import { Modal, Box, Typography, IconButton } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';

const VisionModal = ({ open, handleClose }) => {
  const modalVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    },
    exit: { 
      opacity: 0,
      y: 50,
      transition: { duration: 0.3 }
    }
  };

  const features = [
    {
      icon: <TrendingUpIcon sx={{ fontSize: 40, color: '#1a237e' }} />,
      title: "Financial Growth",
      description: "Empowering users to achieve sustainable financial growth through smart tracking and insights."
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40, color: '#1a237e' }} />,
      title: "Secure Future",
      description: "Building a secure financial future with advanced planning tools and expert guidance."
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 40, color: '#1a237e' }} />,
      title: "Efficient Management",
      description: "Streamlining financial management with intuitive tools and real-time analytics."
    }
  ];

  return (
    <AnimatePresence>
      {open && (
        <Modal
          open={open}
          onClose={handleClose}
          closeAfterTransition
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 2
          }}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <Box sx={{
              position: 'relative',
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: 24,
              p: 4,
              maxWidth: 600,
              mx: 'auto'
            }}>
              <IconButton
                onClick={handleClose}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  color: 'grey.500'
                }}
              >
                <CloseIcon />
              </IconButton>

              <Typography variant="h4" component="h2" sx={{ mb: 3, color: '#1a237e' }}>
                Our Vision
              </Typography>

              <Typography variant="body1" sx={{ mb: 4 }}>
                We envision a world where financial management is accessible, intuitive, and empowering for everyone. Our mission is to provide cutting-edge tools that transform complex financial data into actionable insights.
              </Typography>

              <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' } }}>
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 }}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      {feature.icon}
                      <Typography variant="h6" sx={{ my: 1 }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {feature.description}
                      </Typography>
                    </Box>
                  </motion.div>
                ))}
              </Box>
            </Box>
          </motion.div>
        </Modal>
      )}
    </AnimatePresence>
  );
};

export default VisionModal;
