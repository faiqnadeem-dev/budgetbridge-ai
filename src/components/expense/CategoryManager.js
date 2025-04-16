import React, { useState, useEffect, useCallback } from 'react';
import {
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  Box,
  Typography,
  Alert
} from '@mui/material';
import { Delete, Add } from '@mui/icons-material';
import { db } from '../../config/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { 
  AccessibleDialog,
  AccessibleTextField,
  AccessibleButton,
  AccessibleIconButton
} from '../../utils/accessibilityHelpers';

const CategoryManager = ({ open, onClose, userId }) => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [error, setError] = useState('');

  const fetchCategories = useCallback(async () => {
    if (!userId) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setCategories(userData.categories || []);
      } else {
        const defaultCategories = [
          { id: '1', name: 'Food & Dining', budget: 0 },
          { id: '2', name: 'Transportation', budget: 0 },
          { id: '3', name: 'Bills & Utilities', budget: 0 },
          { id: '4', name: 'Entertainment', budget: 0 },
          { id: '5', name: 'Shopping', budget: 0 },
          { id: '6', name: 'Others', budget: 0 }
        ];
        await setDoc(doc(db, 'users', userId), {
          categories: defaultCategories
        });
        setCategories(defaultCategories);
      }
    } catch (error) {
      setError('Failed to fetch categories');
      console.error('Error fetching categories:', error);
    }
  }, [userId]);

  useEffect(() => {
    if (open && userId) {
      fetchCategories();
    }
  }, [open, userId, fetchCategories]);

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      setError('Category name cannot be empty');
      return;
    }

    if (categories.some(cat => cat.name.toLowerCase() === newCategory.trim().toLowerCase())) {
      setError('Category already exists');
      return;
    }

    try {
      const newCategoryObj = {
        id: Date.now().toString(),
        name: newCategory.trim(),
        budget: 0
      };
      
      const updatedCategories = [...categories, newCategoryObj];
      await updateDoc(doc(db, 'users', userId), {
        categories: updatedCategories
      });
      
      setCategories(updatedCategories);
      setNewCategory('');
      setError('');
    } catch (error) {
      setError('Failed to add category');
      console.error('Error adding category:', error);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      const updatedCategories = categories.filter(cat => cat.id !== categoryId);
      await updateDoc(doc(db, 'users', userId), {
        categories: updatedCategories
      });
      
      setCategories(updatedCategories);
    } catch (error) {
      setError('Failed to delete category');
      console.error('Error deleting category:', error);
    }
  };

  const handleUpdateCategory = async (categoryId, newBudget) => {
    try {
      const updatedCategories = categories.map(cat => 
        cat.id === categoryId ? { ...cat, budget: Number(newBudget) } : cat
      );
      
      await updateDoc(doc(db, 'users', userId), {
        categories: updatedCategories
      });
      
      setCategories(updatedCategories);
    } catch (error) {
      setError('Failed to update category budget');
      console.error('Error updating category:', error);
    }
  };

  return (
    <AccessibleDialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      id="category-manager-dialog"
      title="Manage Categories"
      sx={{ '& .MuiDialog-paper': { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ bgcolor: '#1a237e', color: 'white' }}>
        Manage Categories
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}
        
        <Box sx={{ mb: 2, display: 'flex', gap: 1, mt: 2 }}>
          <AccessibleTextField
            id="new-category-name"
            label="New Category Name"
            fullWidth
            size="small"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category name"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
          />
          <AccessibleButton
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddCategory}
            sx={{ 
              bgcolor: '#1a237e',
              '&:hover': { bgcolor: '#283593' }
            }}
            id="add-category-button"
            label="Add Category"
          >
            Add
          </AccessibleButton>
        </Box>
        
        <List>
          {categories.map((category) => (
            <ListItem
              key={category.id}
              sx={{
                borderRadius: 1,
                mb: 1,
                '&:hover': { bgcolor: '#f5f5f5' }
              }}
            >
              <ListItemText 
                primary={category.name}
                secondary={
                  <AccessibleTextField
                    id={`category-budget-${category.id}`}
                    label="Monthly Budget"
                    size="small"
                    type="number"
                    value={category.budget}
                    onChange={(e) => handleUpdateCategory(category.id, e.target.value)}
                    sx={{ mt: 1 }}
                  />
                }
              />
              <AccessibleIconButton 
                edge="end" 
                onClick={() => handleDeleteCategory(category.id)}
                sx={{ color: '#d32f2f' }}
                id={`delete-category-${category.id}`}
                label={`Delete ${category.name} category`}
              >
                <Delete />
              </AccessibleIconButton>
            </ListItem>
          ))}
        </List>
      </DialogContent>
    </AccessibleDialog>
  );
};

export default CategoryManager;