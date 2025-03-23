import React from 'react';
import { 
    Box, 
    Paper, 
    Typography,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemIcon
} from '@mui/material';
import { 
    TrendingUp, 
    LocalAtm, 
    Category, 
    Timeline,
    CalendarMonth
} from '@mui/icons-material';

const AnomalyMetrics = ({ anomalies }) => {
    if (!anomalies || anomalies.length === 0) {
        return (
            <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Anomaly Insights</Typography>
                <Typography variant="body2" color="text.secondary">
                    No anomaly data available yet. As you record more transactions, our AI will
                    detect unusual spending patterns.
                </Typography>
            </Paper>
        );
    }
    
    // Calculate metrics
    const totalAnomalyAmount = anomalies.reduce((sum, anomaly) => sum + parseFloat(anomaly.amount), 0);
    
    // Group by category
    const categoryCount = {};
    anomalies.forEach(anomaly => {
        const catId = anomaly.categoryId;
        categoryCount[catId] = (categoryCount[catId] || 0) + 1;
    });
    
    // Find top categories
    const topCategories = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([catId, count]) => {
            const category = anomalies.find(a => a.categoryId === catId);
            return {
                id: catId,
                name: category?.categoryName || 'Unknown',
                count
            };
        });
    
    // Time patterns
    const monthCount = {};
    anomalies.forEach(anomaly => {
        const date = new Date(anomaly.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        monthCount[monthKey] = (monthCount[monthKey] || 0) + 1;
    });
    
    const topMonths = Object.entries(monthCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([monthKey, count]) => {
            const [year, month] = monthKey.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1, 1);
            return {
                label: date.toLocaleDateString(undefined, { year: 'numeric', month: 'long' }),
                count
            };
        });
    
    return (
        <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Anomaly Insights</Typography>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">
                    Total Anomalous Spending
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                    <Typography variant="h4" color="error.main" sx={{ fontWeight: 600 }}>
                        ${totalAnomalyAmount.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        across {anomalies.length} transactions
                    </Typography>
                </Box>
            </Box>
            
            {topCategories.length > 0 && (
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Category sx={{ mr: 1, fontSize: 20, color: 'primary.main' }} />
                        <Typography variant="subtitle2">Top Anomaly Categories</Typography>
                    </Box>
                    <List dense disablePadding>
                        {topCategories.map((category) => (
                            <ListItem key={category.id} disableGutters>
                                <ListItemIcon sx={{ minWidth: 28 }}>
                                    <Category fontSize="small" color="primary" />
                                </ListItemIcon>
                                <ListItemText 
                                    primary={category.name} 
                                    secondary={`${category.count} anomalies`}
                                    primaryTypographyProps={{ variant: 'body2' }}
                                    secondaryTypographyProps={{ variant: 'caption' }}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            )}
            
            {topMonths.length > 0 && (
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <CalendarMonth sx={{ mr: 1, fontSize: 20, color: 'primary.main' }} />
                        <Typography variant="subtitle2">Time Patterns</Typography>
                    </Box>
                    <List dense disablePadding>
                        {topMonths.map((month, index) => (
                            <ListItem key={index} disableGutters>
                                <ListItemIcon sx={{ minWidth: 28 }}>
                                    <Timeline fontSize="small" color="primary" />
                                </ListItemIcon>
                                <ListItemText 
                                    primary={month.label} 
                                    secondary={`${month.count} anomalies`}
                                    primaryTypographyProps={{ variant: 'body2' }}
                                    secondaryTypographyProps={{ variant: 'caption' }}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            )}
        </Paper>
    );
};

export default AnomalyMetrics;