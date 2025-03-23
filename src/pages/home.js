import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Container, Button } from '@mui/material';
import { motion } from 'framer-motion';
import ParticlesBackground from '../components/ParticlesBackground';
import LearnMoreModal from '../components/modals/LearnMoreModal';

const Home = () => {
  const [learnMoreOpen, setLearnMoreOpen] = useState(false);
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/register', { 
      state: { animation: 'slideUp' } 
    });
  };

  const handleLearnMore = () => {
    setLearnMoreOpen(true);
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <ParticlesBackground />
      </Box>
      <Box sx={{ 
        position: 'relative', 
        zIndex: 1,
        height: '100vh',
        display: 'flex',
        alignItems: 'center'
      }}>
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.8,
              ease: [0.6, -0.05, 0.01, 0.99]
            }}
          >
            <Typography 
              variant="h2" 
              color="white" 
              sx={{ 
                fontWeight: 700,
                mb: 3,
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
              }}
            >
              Master Your Finances
            </Typography>
            <Typography 
              variant="h5" 
              color="white" 
              sx={{ 
                mb: 4,
                maxWidth: 600,
                textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
              }}
            >
              Take control of your financial future with our powerful expense tracking and budgeting tools.
            </Typography>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <Button 
                variant="contained" 
                size="large"
                onClick={handleGetStarted}
                sx={{ 
                  mr: 2,
                  bgcolor: '#1a237e',
                  '&:hover': { 
                    bgcolor: '#283593',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s ease'
                  }
                }}
              >
                Get Started
              </Button>
              <Button 
                variant="outlined" 
                size="large"
                onClick={handleLearnMore}
                sx={{ 
                  color: 'white',
                  borderColor: 'white',
                  '&:hover': { 
                    borderColor: '#fff',
                    bgcolor: 'rgba(255,255,255,0.1)',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s ease'
                  }
                }}
              >
                Learn More
              </Button>
            </motion.div>
          </motion.div>
        </Container>
      </Box>
      <LearnMoreModal 
        open={learnMoreOpen} 
        handleClose={() => setLearnMoreOpen(false)} 
      />
    </Box>
  );
};

export default Home;
