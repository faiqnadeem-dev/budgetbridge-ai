import React, { useState } from 'react';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import '../styles/auth.css';
import '../styles/animations.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [openResetDialog, setOpenResetDialog] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (!userCredential.user.emailVerified) {
        alert('Please verify your email before logging in.');
        return;
      }
      navigate('/dashboard');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleResetPassword = async () => {
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      alert('Password reset email sent! Check your inbox.');
      setOpenResetDialog(false);
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
            <Typography variant="h4" className="auth-title">
              Welcome Back
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, color: '#666' }}>
              Your personal finance journey continues here
            </Typography>
            <Box component="form" onSubmit={handleLogin}>
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
                  Sign In
                </Button>
              </motion.div>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Button 
                  variant="text" 
                  onClick={() => setOpenResetDialog(true)}
                  sx={{ color: '#666' }}
                >
                  Forgot Password?
                </Button>
                <Link to="/register" style={{ textDecoration: 'none' }}>
                  <Button variant="text">
                    Sign Up
                  </Button>
                </Link>
              </Box>
            </Box>
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
            Smart Finance Assistant
          </Typography>
          <Typography variant="h6">
            Track, analyze, and optimize your finances with AI-powered insights
          </Typography>
        </motion.div>
      </div>

      <Dialog open={openResetDialog} onClose={() => setOpenResetDialog(false)}>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenResetDialog(false)}>Cancel</Button>
          <Button onClick={handleResetPassword} variant="contained">
            Send Reset Link
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Login;
