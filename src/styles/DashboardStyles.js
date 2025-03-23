import { alpha } from '@mui/material/styles';

export const dashboardStyles = {
  mainContainer: {
    display: 'flex',
    minHeight: '100vh',
    bgcolor: '#f8fafc'
  },
  
  contentArea: {
    flexGrow: 1,
    p: { xs: 2, md: 4 },
    bgcolor: '#f8fafc',
    minHeight: '100vh'
  },

  overviewCard: {
    p: 3,
    height: '100%',
    borderRadius: 3,
    boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
    transition: 'transform 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-5px)'
    }
  },

  revenueCard: {
    background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
    color: 'white'
  },

  expenseCard: {
    background: 'linear-gradient(135deg, #f44336 0%, #e53935 100%)',
    color: 'white'
  },

  balanceCard: {
    background: 'linear-gradient(135deg, #1a237e 0%, #151c63 100%)',
    color: 'white'
  },

  budgetCard: {
    background: 'linear-gradient(135deg, #2196F3 0%, #1e88e5 100%)',
    color: 'white'
  },

  transactionList: {
    mt: 4,
    p: 3,
    borderRadius: 3,
    bgcolor: 'white',
    boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)'
  },

  transactionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    p: 2,
    mb: 2,
    borderRadius: 2,
    bgcolor: alpha('#000', 0.02),
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      bgcolor: alpha('#000', 0.05),
      transform: 'translateX(5px)'
    }
  },

  modalContent: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '90%', sm: 400 },
    bgcolor: 'background.paper',
    borderRadius: 3,
    boxShadow: 24,
    p: 4
  },

  actionButton: {
    borderRadius: 2,
    textTransform: 'none',
    py: 1,
    px: 3
  },

  addRevenueButton: {
    bgcolor: '#4CAF50',
    '&:hover': {
      bgcolor: '#45a049'
    }
  },

  addExpenseButton: {
    bgcolor: '#1a237e',
    '&:hover': {
      bgcolor: '#151c63'
    }
  },

  sidebar: {
    width: 280,
    flexShrink: 0,
    '& .MuiDrawer-paper': {
      width: 280,
      boxSizing: 'border-box',
      background: 'linear-gradient(180deg, #1a237e 0%, #151c63 100%)',
      color: 'white',
      borderRight: 'none'
    }
  },

  cardTitle: {
    fontSize: '0.875rem',
    fontWeight: 500,
    opacity: 0.8,
    mb: 1
  },

  cardAmount: {
    fontSize: '1.5rem',
    fontWeight: 600
  },

  '@keyframes fadeIn': {
    from: {
      opacity: 0,
      transform: 'translateY(10px)'
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)'
    }
  },

  animatedElement: {
    animation: 'fadeIn 0.3s ease-out'
  },

  responsiveGrid: {
    display: 'grid',
    gridTemplateColumns: {
      xs: '1fr',
      sm: 'repeat(2, 1fr)',
      md: 'repeat(4, 1fr)'
    },
    gap: 3
  },

  cardIcon: {
    fontSize: '2rem',
    opacity: 0.8,
    mb: 2
  }
};

export default dashboardStyles;
