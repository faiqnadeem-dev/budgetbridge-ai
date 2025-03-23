import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppBar, Toolbar, Button, Box, Typography } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import VisionModal from '../components/modals/VisionModal';
import AboutModal from '../components/modals/AboutModal';
import ContactModal from '../components/modals/ContactModal';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [visionOpen, setVisionOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  const handleVisionOpen = () => setVisionOpen(true);
  const handleVisionClose = () => setVisionOpen(false);
  const handleAboutOpen = () => setAboutOpen(true);
  const handleAboutClose = () => setAboutOpen(false);
  const handleContactOpen = () => setContactOpen(true);
  const handleContactClose = () => setContactOpen(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  const navVariants = {
    hidden: { y: -100 },
    visible: { 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 50,
        damping: 15
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={navVariants}
      style={{ 
        position: 'relative',
        zIndex: 1000
      }}
    >
      <AppBar 
        position="absolute" 
        sx={{
          background: scrolled ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
          boxShadow: scrolled ? 1 : 'none',
          transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <Toolbar>
          <Typography 
            variant="h6" 
            sx={{ 
              flexGrow: 1, 
              color: scrolled ? '#1a237e' : '#fff',
              transition: 'color 0.3s ease'
            }}
          >
            FinanceApp
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            gap: 3, 
            alignItems: 'center',
            position: 'absolute',
            right: '2rem',
            transform: 'translateX(1.6rem)'
          }}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                component={Link}
                to="/"
                startIcon={<HomeIcon />}
                color="inherit" 
                sx={{ 
                  color: scrolled ? '#1a237e' : '#fff',
                  transition: 'color 0.3s ease'
                }}
              >
                Home
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                color="inherit"
                onClick={handleVisionOpen}
                sx={{ 
                  color: scrolled ? '#1a237e' : '#fff',
                  transition: 'color 0.3s ease'
                }}
              >
                Our Vision
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                color="inherit"
                onClick={handleAboutOpen}
                sx={{ 
                  color: scrolled ? '#1a237e' : '#fff',
                  transition: 'color 0.3s ease'
                }}
              >
                About
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                color="inherit"
                onClick={handleContactOpen}
                sx={{ 
                  color: scrolled ? '#1a237e' : '#fff',
                  transition: 'color 0.3s ease'
                }}
              >
                Contact
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                component={Link} 
                to="/login"
                variant="outlined" 
                sx={{ 
                  color: scrolled ? '#1a237e' : '#fff',
                  borderColor: scrolled ? '#1a237e' : '#fff',
                  transition: 'all 0.3s ease'
                }}
              >
                Login
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                component={Link} 
                to="/register"
                variant="contained" 
                sx={{ 
                  bgcolor: scrolled ? '#1a237e' : 'transparent',
                  '&:hover': { 
                    bgcolor: scrolled ? '#283593' : 'rgba(255, 255, 255, 0.1)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Register
              </Button>
            </motion.div>
          </Box>
        </Toolbar>
      </AppBar>
      <VisionModal open={visionOpen} handleClose={handleVisionClose} />
      <AboutModal open={aboutOpen} handleClose={handleAboutClose} />
      <ContactModal open={contactOpen} handleClose={handleContactClose} />
    </motion.div>
  );
};

export default Navbar;
