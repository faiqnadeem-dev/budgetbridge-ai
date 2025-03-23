import React, { useState } from 'react';
import { Paper, Typography, ButtonGroup, Button } from '@mui/material';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveLine } from '@nivo/line';
import { motion } from 'framer-motion';

const SpendingInsights = ({ transactions }) => {
    const [activeView, setActiveView] = useState('all');
    
    const categoryData = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            acc[t.categoryName] = (acc[t.categoryName] || 0) + Number(t.amount);
            return acc;
        }, {});

    const pieData = Object.entries(categoryData)
        .map(([name, value]) => ({
            id: name,
            label: name,
            value,
            color: `hsl(${Math.random() * 360}, 70%, 50%)`
        }))
        .sort((a, b) => b.value - a.value);

    const monthlyData = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            const month = new Date(t.date).toLocaleString('default', { month: 'short' });
            acc[month] = (acc[month] || 0) + Number(t.amount);
            return acc;
        }, {});

    const lineData = [{
        id: 'Monthly Spending',
        data: Object.entries(monthlyData).map(([month, value]) => ({
            x: month,
            y: value
        }))
    }];

    const CustomTooltip = ({ datum }) => (
        <div
            style={{
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
        >
            <strong>{datum.id}</strong>
            <div>${datum.value.toLocaleString()}</div>
        </div>
    );

    return (
        <div style={{ 
            width: '100%', 
            maxWidth: '100%',
            padding: '20px',
            boxSizing: 'border-box'
        }}>
            <ButtonGroup 
                variant="contained" 
                style={{ marginBottom: '20px', width: '100%', justifyContent: 'center' }}
            >
                <Button 
                    onClick={() => setActiveView('all')}
                    style={{
                        background: activeView === 'all' ? 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)' : '',
                        boxShadow: activeView === 'all' ? '0 3px 5px 2px rgba(33, 203, 243, .3)' : ''
                    }}
                >
                    All Time
                </Button>
                <Button 
                    onClick={() => setActiveView('month')}
                    style={{
                        background: activeView === 'month' ? 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)' : '',
                        boxShadow: activeView === 'month' ? '0 3px 5px 2px rgba(33, 203, 243, .3)' : ''
                    }}
                >
                    This Month
                </Button>
            </ButtonGroup>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Paper style={{ 
                    marginBottom: '20px', 
                    padding: '20px',
                    height: '300px',
                    background: 'linear-gradient(to right bottom, #ffffff, #f8f9fa)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}>
                    <Typography variant="h6" gutterBottom style={{ color: '#1a237e' }}>
                        Spending Distribution
                    </Typography>
                    <div style={{ height: '250px' }}>
                        <ResponsivePie
                            data={pieData}
                            margin={{ top: 40, right: 80, bottom: 40, left: 80 }}
                            innerRadius={0.6}
                            padAngle={0.7}
                            cornerRadius={3}
                            activeOuterRadiusOffset={8}
                            borderWidth={1}
                            borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                            enableArcLinkLabels={true}
                            arcLinkLabelsSkipAngle={10}
                            arcLinkLabelsTextColor="#333333"
                            arcLinkLabelsThickness={2}
                            arcLinkLabelsColor={{ from: 'color' }}
                            tooltip={CustomTooltip}
                            colors={{ scheme: 'nivo' }}
                            motionConfig="wobbly"
                            transitionMode="pushIn"
                        />
                    </div>
                </Paper>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <Paper style={{ 
                    padding: '20px',
                    height: '300px',
                    background: 'linear-gradient(to right bottom, #ffffff, #f8f9fa)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}>
                    <Typography variant="h6" gutterBottom style={{ color: '#1a237e' }}>
                        Spending Trends
                    </Typography>
                    <div style={{ height: '250px' }}>
                        <ResponsiveLine
                            data={lineData}
                            margin={{ top: 30, right: 50, bottom: 50, left: 60 }}
                            xScale={{ type: 'point' }}
                            yScale={{ 
                                type: 'linear',
                                min: 'auto',
                                max: 'auto',
                                stacked: false,
                            }}
                            curve="monotoneX"
                            axisTop={null}
                            axisRight={null}
                            axisBottom={{
                                tickSize: 5,
                                tickPadding: 5,
                                tickRotation: 0,
                                legend: 'Months',
                                legendOffset: 36,
                                legendPosition: 'middle'
                            }}
                            axisLeft={{
                                tickSize: 5,
                                tickPadding: 5,
                                tickRotation: 0,
                                legend: 'Amount ($)',
                                legendOffset: -40,
                                legendPosition: 'middle'
                            }}
                            enableArea={true}
                            areaBaselineValue={0}
                            areaOpacity={0.15}
                            enableGridX={true}
                            enableGridY={true}
                            gridYValues={5}
                            colors={['#3182ce']}
                            lineWidth={2}
                            pointSize={8}
                            pointColor="#ffffff"
                            pointBorderWidth={2}
                            pointBorderColor={{ from: 'serieColor' }}
                            crosshairType="cross"
                            enableSlices="x"
                            markers={[
                                {
                                    axis: 'y',
                                    value: 0,
                                    lineStyle: { stroke: '#b0b0b0', strokeWidth: 1 },
                                    textStyle: { fill: '#2e2e2e' },
                                    legend: 'Baseline',
                                }
                            ]}
                            theme={{
                                axis: {
                                    ticks: {
                                        text: {
                                            fontSize: 12,
                                            fill: '#666'
                                        }
                                    }
                                },
                                grid: {
                                    line: {
                                        stroke: '#eee',
                                        strokeWidth: 1
                                    }
                                }
                            }}
                            tooltip={({ point }) => (
                                <div style={{
                                    background: 'white',
                                    padding: '12px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}>
                                    <strong>{point.data.x}</strong>
                                    <div>${point.data.y.toLocaleString()}</div>
                                </div>
                            )}
                        />
                    </div>
                </Paper>
            </motion.div>
        </div>
    );
};

export default SpendingInsights;
