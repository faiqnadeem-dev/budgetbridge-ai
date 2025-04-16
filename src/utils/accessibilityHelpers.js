import React from 'react';
import { TextField, Dialog, Button, IconButton, Switch, FormControlLabel } from '@mui/material';

/**
 * AccessibleTextField - A wrapper around MUI TextField with proper accessibility attributes.
 */
export const AccessibleTextField = ({ id, label, ...props }) => {
  const reactId = React.useId();
  const fieldId = id || `field-${label?.toLowerCase().replace(/\s+/g, '-') || reactId}`;
  
  return (
    <TextField
      id={fieldId}
      name={props.name || fieldId}
      label={label}
      autoComplete={props.autoComplete || "on"}
      InputLabelProps={{
        htmlFor: fieldId,
        ...props.InputLabelProps
      }}
      {...props}
    />
  );
};

/**
 * AccessibleDialog - A wrapper around MUI Dialog with proper accessibility attributes.
 */
export const AccessibleDialog = ({ id, title, children, ...props }) => {
  const dialogId = id || `dialog-${title?.toLowerCase().replace(/\s+/g, '-') || React.useId()}`;
  const titleId = `${dialogId}-title`;
  
  return (
    <Dialog
      id={dialogId}
      aria-labelledby={titleId}
      {...props}
    >
      {React.Children.map(children, child => {
        if (!child) return child;
        if (child.type && child.type.muiName === 'DialogTitle') {
          return React.cloneElement(child, {
            id: titleId,
            ...child.props
          });
        }
        return child;
      })}
    </Dialog>
  );
};

/**
 * AccessibleButton - A wrapper around MUI Button with proper accessibility attributes.
 */
export const AccessibleButton = ({ id, label, children, ...props }) => {
  const buttonText = typeof children === 'string' ? children : label || 'button';
  const buttonId = id || `btn-${buttonText.toLowerCase().replace(/\s+/g, '-') || React.useId()}`;
  
  return (
    <Button
      id={buttonId}
      name={buttonId}
      aria-label={label || (typeof children === 'string' ? children : undefined)}
      {...props}
    >
      {children}
    </Button>
  );
};

/**
 * AccessibleIconButton - A wrapper around MUI IconButton with proper accessibility attributes.
 */
export const AccessibleIconButton = ({ id, label, ...props }) => {
  const buttonId = id || `icon-btn-${label?.toLowerCase().replace(/\s+/g, '-') || React.useId()}`;
  
  return (
    <IconButton
      id={buttonId}
      name={buttonId}
      aria-label={label}
      {...props}
    />
  );
};

/**
 * AccessibleSwitch - A wrapper around MUI Switch with proper accessibility attributes.
 */
export const AccessibleSwitch = ({ id, label, checked, onChange, ...props }) => {
  const switchId = id || `switch-${label?.toLowerCase().replace(/\s+/g, '-') || React.useId()}`;
  
  return (
    <FormControlLabel
      control={
        <Switch
          id={switchId}
          name={switchId}
          checked={checked}
          onChange={onChange}
          inputProps={{ 'aria-label': label }}
          {...props}
        />
      }
      label={label}
    />
  );
};
