import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Paper, 
    Typography, 
    Divider, 
    CircularProgress,
    Button,
    TextField,
    MenuItem,
    Grid,
    Alert
} from '@mui/material';
import { Search, TrendingUp, WarningAmber } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { anomalyService } from '../../services/anomalyService';
import AnomalyCard from './AnomalyCard';
import AnomalyDetailModal from './AnomalyDetailModal';
import AnomalyMetrics from './AnomalyMetrics';
import { useAuth } from '../../context/AuthContext';

const AnomalyDashboard = ({ categories }) => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [anomalies, setAnomalies] = useState([]);
    const [filteredAnomalies, setFilteredAnomalies] = useState([]);
    const [selectedAnomaly, setSelectedAnomaly] = useState(null);
    const [filterCategory, setFilterCategory] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState('');
    
    useEffect(() => {
        const fetchAnomalies = async () => {
            try {
                setLoading(true);
                const response = await anomalyService.getUserAnomalies(token);
                setAnomalies(response.anomalies);
                setFilteredAnomalies(response.anomalies);
                setLoading(false);
            } catch (error) {
                setError('Failed to load anomaly data');
                setLoading(false);
            }
        };
        
        fetchAnomalies();
    }, [token]);
    
    useEffect(() => {
        if (!anomalies.length) return;
        
        let result = [...anomalies];
        
        // Apply category filter
        if (filterCategory) {
            result = result.filter(a => a.categoryId === filterCategory);
        }
        
        // Apply search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(a => 
                a.description.toLowerCase().includes(query) ||
                a.categoryName.toLowerCase().includes(query) ||
                a.reason.toLowerCase().includes(query)
            );
        }
        
        setFilteredAnomalies(result);
    }, [anomalies, filterCategory, searchQuery]);
    
    const handleViewDetails = (anomaly) => {
        setSelectedAnomaly(anomaly);
    };
    
    const handleCloseDetails = () => {
        setSelectedAnomaly(null);
    };
    
    return (
        <Box>
            <Paper 
                sx={{ 
                    p: 3, 
                    mb: 3, 
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #e8eaf6 0%, #c5cae9 100%)'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <WarningAmber sx={{ fontSize: 28, mr: 2, color: '#3d5afe' }} />
                    <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a237e' }}>
                        AI-Powered Spending Anomaly Detection
                    </Typography>
                </Box>
                
                <Typography variant="body1" sx={{ mb: 2 }}>
                    Our machine learning algorithm analyzes your spending patterns to identify unusual transactions 
                    that deviate from your normal habits. This helps you spot potential issues or opportunities to optimize your finances.
                </Typography>
            </Paper>
            
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}
            
            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                Detected Anomalies
                            </Typography>
                            {!loading && (
                                <Typography variant="body2" color="text.secondary">
                                    {filteredAnomalies.length} {filteredAnomalies.length === 1 ? 'anomaly' : 'anomalies'} found
                                </Typography>
                            )}
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                            <TextField
                                size="small"
                                label="Search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                sx={{ flexGrow: 1 }}
                                InputProps={{
                                    startAdornment: <Search color="action" sx={{ mr: 1 }} />
                                }}
                            />
                            
                            <TextField
                                select
                                size="small"
                                label="Category"
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                sx={{ minWidth: 150 }}
                            >
                                <MenuItem value="">All Categories</MenuItem>
                                {categories.map((category) => (
                                    <MenuItem key={category.id} value={category.id}>
                                        {category.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Box>
                        
                        <Divider sx={{ mb: 3 }} />
                        
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : filteredAnomalies.length > 0 ? (
                            <Box>
                                {filteredAnomalies.map((anomaly) => (
                                    <AnomalyCard 
                                        key={anomaly.id} 
                                        anomaly={anomaly} 
                                        onViewDetails={handleViewDetails}
                                    />
                                ))}
                            </Box>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="body1" color="text.secondary">
                                    No anomalies found with the current filters
                                </Typography>
                                {filterCategory || searchQuery ? (
                                    <Button 
                                        variant="text" 
                                        onClick={() => {
                                            setFilterCategory('');
                                            setSearchQuery('');
                                        }}
                                    >
                                        Clear Filters
                                    </Button>
                                ) : (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        This means your spending patterns are consistent
                                    </Typography>
                                )}
                            </Box>
                        )}
                    </Paper>
                </Grid>
                
                <Grid item xs={12} md={4}>
                    <AnomalyMetrics anomalies={anomalies} />
                </Grid>
            </Grid>
            
            {selectedAnomaly && (
                <AnomalyDetailModal 
                    open={!!selectedAnomaly}
                    anomaly={selectedAnomaly}
                    onClose={handleCloseDetails}
                />
            )}
        </Box>
    );
};

export default AnomalyDashboard;