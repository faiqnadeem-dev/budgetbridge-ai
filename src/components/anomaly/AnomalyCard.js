import React from 'react';
import { 
    Box, 
    Card, 
    CardContent, 
    Typography, 
    Chip, 
    Divider,
    Button
} from '@mui/material';
import { WarningAmber, CalendarToday, LocalAtm } from '@mui/icons-material';
import { motion } from 'framer-motion';

const AnomalyCard = ({ anomaly, onViewDetails }) => {
    const formattedAmount = parseFloat(anomaly.amount).toFixed(2);
    // Handle both date formats - ISO string or Firestore timestamp
    const formattedDate = anomaly.date ? 
        (typeof anomaly.date === 'string' ? 
            new Date(anomaly.date).toLocaleDateString() : 
            new Date(anomaly.date.seconds * 1000).toLocaleDateString()
        ) : 'Unknown date';
    
    // Determine severity based on anomaly score
    const getSeverity = (score) => {
        const absScore = Math.abs(score);
        if (absScore > 0.8) return { color: 'error', label: 'High' };
        if (absScore > 0.65) return { color: 'warning', label: 'Medium' };
        return { color: 'info', label: 'Low' };
    };
    
    // Calculate severity or use default
    const severity = anomaly.anomalyScore ? 
        getSeverity(anomaly.anomalyScore) : 
        { color: 'warning', label: 'Medium' };
    
    // Use categoryName if available, otherwise use category field
    const displayCategory = anomaly.categoryName || 
        (anomaly.category ? 
            anomaly.category.charAt(0).toUpperCase() + anomaly.category.slice(1) : 
            'Unknown Category'
        );
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card 
                sx={{ 
                    mb: 2, 
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    border: `1px solid ${severity.color === 'error' ? '#ffcdd2' : 
                             severity.color === 'warning' ? '#ffe0b2' : '#bbdefb'}`
                }}
            >
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <WarningAmber color={severity.color} sx={{ mr: 1 }} />
                            <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                {anomaly.description || 'Unusual Transaction'}
                            </Typography>
                        </Box>
                        <Chip 
                            size="small" 
                            color={severity.color} 
                            label={`${severity.label} Anomaly`}
                        />
                    </Box>
                    
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        {anomaly.reason || 'This transaction deviates from your normal spending pattern.'}
                    </Typography>
                    
                    <Divider sx={{ my: 1.5 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CalendarToday fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                                {formattedDate}
                            </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <LocalAtm fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="body2" color="error.main" fontWeight="bold">
                                ${formattedAmount}
                            </Typography>
                        </Box>
                        
                        <Chip 
                            size="small" 
                            label={displayCategory}
                            sx={{ bgcolor: '#e8eaf6', color: '#3d5afe' }} 
                        />
                    </Box>
                    
                    <Box sx={{ mt: 2, textAlign: 'right' }}>
                        <Button 
                            size="small" 
                            variant="outlined" 
                            onClick={() => onViewDetails(anomaly)}
                        >
                            View Details
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default AnomalyCard;