import React from 'react';
import { Modal, Box, Typography, IconButton, Grid } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';
import CodeIcon from '@mui/icons-material/Code';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import ArchitectureIcon from '@mui/icons-material/Architecture';

const AboutModal = ({ open, handleClose }) => {
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

  const techStack = [
    "React.js",
    "Material-UI",
    "Framer Motion",
    "Node.js",
    "Express",
    "Firebase"
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
              maxWidth: 700,
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
                About FinanceApp
              </Typography>

              <Grid container spacing={4}>
                <Grid item xs={12}>
                  <Box sx={{ mb: 3 }}>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <RocketLaunchIcon sx={{ mr: 1, color: '#1a237e' }} />
                        Project Vision
                      </Typography>
                      <Typography variant="body1">
                        A final year project aimed at revolutionizing personal finance management through intuitive design and powerful features. Built with modern technologies to deliver a seamless user experience.
                      </Typography>
                    </motion.div>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ mb: 3 }}>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <CodeIcon sx={{ mr: 1, color: '#1a237e' }} />
                        Tech Stack
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {techStack.map((tech, index) => (
                          <motion.div
                            key={tech}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 + index * 0.1 }}
                          >
                            <Box
                              sx={{
                                bgcolor: '#1a237e',
                                color: 'white',
                                px: 2,
                                py: 0.5,
                                borderRadius: 2,
                                fontSize: '0.9rem'
                              }}
                            >
                              {tech}
                            </Box>
                          </motion.div>
                        ))}
                      </Box>
                    </motion.div>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <ArchitectureIcon sx={{ mr: 1, color: '#1a237e' }} />
                        Future Development
                      </Typography>
                      <Typography variant="body1">
                        The project is continuously evolving with planned features including advanced analytics, AI-powered insights, and mobile applications. Stay tuned for regular updates and new capabilities!
                      </Typography>
                    </motion.div>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </motion.div>
        </Modal>
      )}
    </AnimatePresence>
  );
};

export default AboutModal;
