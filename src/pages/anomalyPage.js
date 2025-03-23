import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import AnomalyDashboard from '../components/anomaly/AnomalyDashboard';
import { db } from '../config/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

const AnomalyPage = () => {
  const { currentUser } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        if (currentUser) {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists() && userDoc.data().categories) {
            setCategories(userDoc.data().categories);
          } else {
            // Default categories if none exist
            setCategories([
              { id: 'food', name: 'Food & Dining' },
              { id: 'transport', name: 'Transportation' },
              { id: 'utilities', name: 'Bills & Utilities' },
              { id: 'entertainment', name: 'Entertainment' },
              { id: 'shopping', name: 'Shopping' },
              { id: 'other', name: 'Other' }
            ]);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setLoading(false);
      }
    };

    fetchCategories();
  }, [currentUser]);

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '80vh' 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Typography 
        variant="h4" 
        sx={{ 
          mb: 4, 
          fontWeight: 600,
          color: '#1a237e'
        }}
      >
        AI Anomaly Detection
      </Typography>
      
      <AnomalyDashboard categories={categories} />
    </Container>
  );
};

export default AnomalyPage;