import React from 'react';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions,
    Typography,
    Button,
    Box,
    Divider,
    Chip,
    IconButton
} from '@mui/material';
import { 
    Close, 
    CalendarToday, 
    LocalAtm, 
    Category,
    Warning,
    TrendingDown
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const AnomalyDetailModal = ({ open, anomaly, onClose }) => {
    if (!anomaly) return null;
    
    const formattedAmount = parseFloat(anomaly.amount).toFixed(2);
    
    // Handle both date formats - ISO string or Firestore timestamp
    const formattedDate = anomaly.date ? 
        (typeof anomaly.date === 'string' ? 
            new Date(anomaly.date).toLocaleDateString() : 
            new Date(anomaly.date.seconds * 1000).toLocaleDateString()
        ) : 'Unknown date';
    
    // Use categoryName if available, otherwise use category field
    const displayCategory = anomaly.categoryName || 
        (anomaly.category ? 
            anomaly.category.charAt(0).toUpperCase() + anomaly.category.slice(1) : 
            'Unknown Category'
        );
    
    // Format anomaly score for display (0-100% unusual)
    const getAnomalyPercentage = (score) => {
        // Default value if score is not available
        if (score === undefined || score === null) return 70;
        
        // Convert score to a percentage (scores are typically -1 to 0 for anomalies)
        return Math.min(100, Math.round(Math.abs(score) * 100));
    };
    
    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 2 }
            }}
        >
            <DialogTitle sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Anomaly Details</Typography>
                    <IconButton onClick={onClose} size="small">
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>
            
            <DialogContent>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 500, mb: 1 }}>
                        {anomaly.description || 'Unusual Transaction'}
                    </Typography>
                    <Chip 
                        color="error" 
                        icon={<Warning />} 
                        label="Unusual Transaction"
                        size="small"
                    />
                </Box>
                
                <Box 
                    sx={{ 
                        p: 2, 
                        bgcolor: '#f5f5f5', 
                        borderRadius: 1,
                        mb: 3
                    }}
                >
                    <Typography variant="body1">
                        {anomaly.reason || 'This transaction deviates significantly from your normal spending patterns.'}
                    </Typography>
                </Box>
                
                <Divider sx={{ mb: 3 }} />
                
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocalAtm sx={{ mr: 1, color: 'error.main' }} />
                        <Box>
                            <Typography variant="body2" color="text.secondary">Amount</Typography>
                            <Typography variant="h6" color="error.main">${formattedAmount}</Typography>
                        </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CalendarToday sx={{ mr: 1, color: 'primary.main' }} />
                        <Box>
                            <Typography variant="body2" color="text.secondary">Date</Typography>
                            <Typography variant="h6">{formattedDate}</Typography>
                        </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Category sx={{ mr: 1, color: 'primary.main' }} />
                        <Box>
                            <Typography variant="body2" color="text.secondary">Category</Typography>
                            <Typography variant="h6">{displayCategory}</Typography>
                        </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TrendingDown sx={{ mr: 1, color: 'warning.main' }} />
                        <Box>
                            <Typography variant="body2" color="text.secondary">Anomaly Score</Typography>
                            <Typography variant="h6">{getAnomalyPercentage(anomaly.anomalyScore)}% unusual</Typography>
                        </Box>
                    </Box>
                </Box>
                
                <Box sx={{ bgcolor: '#fff3e0', p: 2, borderRadius: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                        What makes this transaction unusual?
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        Our AI algorithm analyzes your spending patterns based on amount, timing, frequency, and category. 
                        This transaction was flagged because it deviates significantly from your established patterns in this category.
                    </Typography>
                </Box>
            </DialogContent>
            
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default AnomalyDetailModal;