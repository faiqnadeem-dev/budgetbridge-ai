import React, { useState, useEffect } from "react";
import { DialogContent, DialogActions, Typography, Box } from "@mui/material";
import {
  AccessibleTextField,
  AccessibleButton,
  AccessibleDialog,
} from "../../components/common/AccessibleComponents";

const CategoryDialog = ({
  open,
  onClose,
  onSave,
  onDelete,
  editingCategory,
  isRevenue = false,
}) => {
  const [categoryName, setCategoryName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingCategory) {
      setCategoryName(editingCategory.name || "");
    } else {
      setCategoryName("");
    }
    setError("");
  }, [editingCategory, open]);

  const handleSave = () => {
    if (!categoryName.trim()) {
      setError("Category name cannot be empty");
      return;
    }

    onSave(categoryName);
  };

  const handleDelete = () => {
    if (editingCategory) {
      onDelete(editingCategory);
    }
  };

  const dialogTitle = editingCategory
    ? "Edit Category"
    : `Add ${isRevenue ? "Revenue" : "Expense"} Category`;

  return (
    <AccessibleDialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      title={dialogTitle}
      id="category-dialog"
    >
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <AccessibleTextField
            autoFocus
            margin="dense"
            id="category-name-input"
            name="categoryName"
            label="Category Name"
            type="text"
            fullWidth
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            error={!!error}
            helperText={error}
            autoComplete="off"
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {editingCategory && (
          <AccessibleButton
            onClick={handleDelete}
            color="error"
            sx={{ mr: "auto" }}
            id="delete-category-button"
            label="Delete Category"
          >
            Delete Category
          </AccessibleButton>
        )}
        <AccessibleButton onClick={onClose} id="cancel-button" label="Cancel">
          Cancel
        </AccessibleButton>
        <AccessibleButton
          onClick={handleSave}
          variant="contained"
          id="save-category-button"
          label={editingCategory ? "Update Category" : "Add Category"}
        >
          {editingCategory ? "Update" : "Add"}
        </AccessibleButton>
      </DialogActions>
    </AccessibleDialog>
  );
};

export default CategoryDialog;
