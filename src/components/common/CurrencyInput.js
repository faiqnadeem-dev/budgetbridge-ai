import React from "react";
import { InputAdornment, Typography } from "@mui/material";
import { useCurrency } from "../../contexts/CurrencyContext";
import { AccessibleTextField } from "./AccessibleComponents";

/**
 * A standardized currency input component that shows the user's selected currency symbol
 *
 * @param {Object} props - Component props including standard TextField props
 * @returns {JSX.Element} Rendered component
 */
const CurrencyInput = ({
  id,
  name,
  label,
  value,
  onChange,
  error,
  helperText,
  required = false,
  fullWidth = true,
  sx = {},
  size = "medium",
  ...otherProps
}) => {
  // Get the currency symbol from our context
  const { symbol } = useCurrency();

  return (
    <AccessibleTextField
      id={id || `currency-input-${name}`}
      name={name}
      label={label}
      type="number"
      value={value}
      onChange={onChange}
      fullWidth={fullWidth}
      required={required}
      sx={{ ...sx }}
      error={error}
      helperText={helperText}
      size={size}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Typography sx={{ mr: 0.5 }}>{symbol}</Typography>
          </InputAdornment>
        ),
      }}
      {...otherProps}
    />
  );
};

export default CurrencyInput;
