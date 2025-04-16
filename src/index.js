import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, useNavigate } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import App from "./App";
import { ClerkFirebaseBridgeProvider } from "./context/ClerkFirebaseBridge";
import { CLERK_PUBLISHABLE_KEY } from "./config/clerkConfig";
import "./styles/tailwind.css";

// Create a function to fix label-ID relationships
function fixLabelIdRelationships() {
  // Function to fix all labels in the document
  const fixLabels = () => {
    // Get all labels that have a "for" attribute
    const allLabels = document.querySelectorAll("label[for]");

    allLabels.forEach((label) => {
      const forValue = label.getAttribute("for");

      // Skip if the label correctly points to an ID
      if (document.getElementById(forValue)) {
        return;
      }

      // Find elements with matching name attribute
      const matchingNameElements = document.querySelectorAll(
        `[name="${forValue}"]`
      );

      if (matchingNameElements.length > 0) {
        const element = matchingNameElements[0];

        // Generate a unique ID if needed
        if (!element.id) {
          const uniqueId = `field-${forValue}-${Date.now().toString(36)}`;
          element.id = uniqueId;
        }

        // Update the label to point to the ID
        label.setAttribute("for", element.id);
      }
    });

    // Special handling for MUI components
    const inputLabels = document.querySelectorAll(".MuiInputLabel-root");
    inputLabels.forEach((label) => {
      const formControl = label.closest(".MuiFormControl-root");
      if (!formControl) return;

      const input = formControl.querySelector("input, select, textarea");
      if (!input) return;

      // Make sure input has an ID
      if (!input.id) {
        const uniqueId = `mui-input-${Date.now().toString(36)}`;
        input.id = uniqueId;
      }

      // Set the label's for attribute
      label.setAttribute("for", input.id);
    });
  };

  // Run the fix function
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    fixLabels();
  } else {
    document.addEventListener("DOMContentLoaded", fixLabels);
  }

  // Set up an observer to catch dynamically added elements
  const observer = new MutationObserver(() => {
    fixLabels();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Apply the fix immediately
if (typeof window !== "undefined") {
  fixLabelIdRelationships();
  // Also run it again when React is fully mounted
  window.addEventListener("load", fixLabelIdRelationships);
}

// Create a theme instance with brand colors
const theme = createTheme({
  palette: {
    primary: {
      main: "#1a237e", // primary brand color
      light: "#534bae",
      dark: "#000051",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#2196f3",
      light: "#6ec6ff",
      dark: "#0069c0",
      contrastText: "#ffffff",
    },
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
    button: {
      textTransform: "none",
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
          },
        },
      },
    },
  },
});

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

// ClerkProviderWithNavigate component to properly handle navigation
function ClerkProviderWithNavigate({ children }) {
  const navigate = useNavigate();

  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      navigate={(to) => navigate(to)}
      // Updated redirect properties:
      signInUrl="https://capital-pup-32.accounts.dev/sign-in"
      signUpUrl="https://capital-pup-32.accounts.dev/sign-up"
      fallbackRedirectUrl="/dashboard"
    >
      <ClerkFirebaseBridgeProvider>
        <App />
      </ClerkFirebaseBridgeProvider>
    </ClerkProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <ClerkProviderWithNavigate>
          <ClerkFirebaseBridgeProvider>
            <App />
          </ClerkFirebaseBridgeProvider>
        </ClerkProviderWithNavigate>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
