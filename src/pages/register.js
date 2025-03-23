import React, { useState } from 'react';
import { auth } from '../config/firebase';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import '../styles/auth.css';
import '../styles/animations.css';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      setVerificationSent(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-side">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper className="auth-card">
            {verificationSent ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Alert severity="success" sx={{ mb: 2 }}>
                  Verification email sent! Please check your inbox and verify your email before logging in.
                </Alert>
              </motion.div>
            ) : (
              <>
                <Typography variant="h4" className="auth-title">
                  Create Account
                </Typography>
                <Typography variant="body1" sx={{ mb: 4, color: '#666' }}>
                  Start your financial journey today
                </Typography>
                <Box component="form" onSubmit={handleRegister}>
                  <TextField
                    className="input-field"
                    margin="normal"
                    required
                    fullWidth
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: 'rgba(0, 0, 0, 0.1)',
                          borderRadius: '10px',
                        },
                        '&:hover fieldset': {
                          borderColor: '#1a237e',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#1a237e',
                        },
                      },
                      mb: 2
                    }}
                  />
                  <TextField
                    className="input-field"
                    margin="normal"
                    required
                    fullWidth
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: 'rgba(0, 0, 0, 0.1)',
                          borderRadius: '10px',
                        },
                        '&:hover fieldset': {
                          borderColor: '#1a237e',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#1a237e',
                        },
                      },
                      mb: 2
                    }}
                  />
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      className="auth-button"
                    >
                      Sign Up
                    </Button>
                  </motion.div>
                  <Link to="/login" style={{ textDecoration: 'none' }}>
                    <Button fullWidth variant="text" sx={{ mt: 2 }}>
                      Already have an account? Sign In
                    </Button>
                  </Link>
                </Box>
              </>
            )}
          </Paper>
        </motion.div>
      </div>
      <div className="auth-image-side">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Typography variant="h3" sx={{ mb: 3, fontWeight: 600 }}>
            Welcome to Smart Finance
          </Typography>
          <Typography variant="h6">
            Your journey to financial freedom starts here
          </Typography>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
