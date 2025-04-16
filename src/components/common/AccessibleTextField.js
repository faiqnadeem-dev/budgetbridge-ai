import React from 'react';
import { TextField } from '@mui/material';

const AccessibleTextField = (props) => {
  // Use React.useId for unique id generation
  const reactId = React.useId();
  const id = props.id || `field-${props.name || props.label?.toLowerCase().replace(/\s+/g, '-') || reactId}`;
  
  return (
    <TextField
      {...props}
      id={id} // Always set an ID
      name={props.name || id} // Ensure a name is provided
      autoComplete={props.autoComplete || "on"} // Set a default autocomplete attribute
      InputLabelProps={{
        htmlFor: id,
        ...props.InputLabelProps
      }}
    />
  );
};

export default AccessibleTextField;
