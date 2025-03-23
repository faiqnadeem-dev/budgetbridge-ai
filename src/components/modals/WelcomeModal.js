import React from 'react';
import { Modal, Box, Typography, TextField, Button } from '@mui/material';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const WelcomeModal = ({ open, onClose, currentUser, onNameSet }) => {
    const [newUserName, setNewUserName] = React.useState('');

    const handleSubmit = async () => {
        if (!newUserName.trim()) return;
        
        try {
            await setDoc(doc(db, 'users', currentUser.uid), {
                name: newUserName,
                monthlyBudget: 0,
                categories: [
                    { id: 'food', name: 'Food' },
                    { id: 'transport', name: 'Transport' },
                    { id: 'utilities', name: 'Utilities' },
                    { id: 'entertainment', name: 'Entertainment' },
                    { id: 'other', name: 'Other' }
                ],
                revenueCategories: [
                    { id: 'salary', name: 'Salary' },
                    { id: 'freelance', name: 'Freelance' },
                    { id: 'investments', name: 'Investments' },
                    { id: 'other-income', name: 'Other Income' }
                ]
            });
            
            onNameSet(newUserName);
            onClose();
        } catch (error) {
            console.error('Error saving user name:', error);
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 400,
                bgcolor: 'background.paper',
                borderRadius: 2,
                boxShadow: 24,
                p: 4,
            }}>
                <Typography variant="h5" component="h2" gutterBottom>
                    Welcome to Finance App!
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                    What would you like us to call you?
                </Typography>
                <TextField
                    fullWidth
                    label="Your Name"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    sx={{ mb: 3 }}
                />
                <Button
                    fullWidth
                    variant="contained"
                    onClick={handleSubmit}
                    sx={{ bgcolor: '#1a237e', '&:hover': { bgcolor: '#000051' } }}
                >
                    Get Started
                </Button>
            </Box>
        </Modal>
    );
};

export default WelcomeModal;
