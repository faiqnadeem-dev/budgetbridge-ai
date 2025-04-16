import React from "react";
import {
  TextField as MuiTextField,
  Button as MuiButton,
  IconButton as MuiIconButton,
  Select as MuiSelect,
  Dialog as MuiDialog,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  FormHelperText,
} from "@mui/material";

/**
 * AccessibleTextField - A wrapper around MUI's TextField that generates a unique ID
 * using React.useId and ensures that the label references the field correctly.
 */
export const AccessibleTextField = ({
  id,
  label,
  name,
  select,
  children,
  helperText,
  error,
  InputProps,
  ...props
}) => {
  const reactId = React.useId();
  const inputId =
    id ||
    `field-${name || label?.toLowerCase().replace(/\s+/g, "-") || reactId}`;
  const inputName = name || inputId;

  if (select) {
    return (
      <FormControl fullWidth={props.fullWidth} error={error}>
        <InputLabel id={`${inputId}-label`} htmlFor={inputId}>
          {label}
        </InputLabel>
        <MuiSelect
          id={inputId}
          name={inputName}
          label={label}
          labelId={`${inputId}-label`}
          autoComplete={props.autoComplete || "on"}
          {...props}
        >
          {children}
        </MuiSelect>
        {helperText && <FormHelperText>{helperText}</FormHelperText>}
      </FormControl>
    );
  }

  return (
    <MuiTextField
      id={inputId}
      name={inputName}
      label={label}
      autoComplete={props.autoComplete || "on"}
      helperText={helperText}
      error={error}
      InputProps={InputProps}
      InputLabelProps={{
        htmlFor: inputId,
        ...props.InputLabelProps,
      }}
      {...props}
    >
      {children}
    </MuiTextField>
  );
};

/**
 * AccessibleButton - Ensures proper aria-label and unique ID.
 */
export const AccessibleButton = ({ id, label, children, ...props }) => {
  const buttonId =
    id ||
    `btn-${
      label?.toLowerCase().replace(/\s+/g, "-") ||
      Math.random().toString(36).substring(2, 9)
    }`;

  return (
    <MuiButton
      id={buttonId}
      aria-label={
        label || (typeof children === "string" ? children : undefined)
      }
      {...props}
    >
      {children}
    </MuiButton>
  );
};

/**
 * AccessibleIconButton - Ensures proper aria-label and unique ID.
 */
export const AccessibleIconButton = ({ id, label, ...props }) => {
  const buttonId =
    id ||
    `icon-btn-${
      label?.toLowerCase().replace(/\s+/g, "-") ||
      Math.random().toString(36).substring(2, 9)
    }`;

  return <MuiIconButton id={buttonId} aria-label={label} {...props} />;
};

/**
 * AccessibleDialog - Ensures the dialog has proper aria-labelledby linking.
 */
export const AccessibleDialog = ({ id, title, children, ...props }) => {
  const dialogId =
    id ||
    `dialog-${
      title?.toLowerCase().replace(/\s+/g, "-") ||
      Math.random().toString(36).substring(2, 9)
    }`;
  const titleId = `${dialogId}-title`;

  return (
    <MuiDialog id={dialogId} aria-labelledby={titleId} {...props}>
      {React.Children.map(children, (child) => {
        if (!child) return child;
        if (child.type === DialogTitle) {
          return React.cloneElement(child, {
            id: titleId,
            ...child.props,
          });
        }
        return child;
      })}
    </MuiDialog>
  );
};
