import React from 'react';
import { Container, Typography } from '@mui/material';
import ExpenseForm from '../components/expense/ExpenseForm';

const ExpensePage = () => {
  return (
    <Container>
      <Typography 
        variant="h4" 
        sx={{ 
          textAlign: 'center', 
          my: 4,
          color: '#1a237e'
        }}
      >
        Add New Expense
      </Typography>
      <ExpenseForm />
    </Container>
  );
};

export default ExpensePage;
