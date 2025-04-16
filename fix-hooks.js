// Fix React Hooks Error in dashboard.js
const fs = require("fs");
const path = require("path");

// Path to the dashboard file
const filePath = path.join(__dirname, "src", "pages", "dashboard.js");

// Read the file
fs.readFile(filePath, "utf8", (err, data) => {
  if (err) {
    console.error("Error reading file:", err);
    return;
  }

  // Find and remove the problematic useEffect inside JSX
  const startMarker =
    "{/* Add this effect to scroll to the selected category when the modal opens */}";
  const endMarker = "}, [openBudgetModal, selectedCategoryId])}";

  const startIndex = data.indexOf(startMarker);
  if (startIndex === -1) {
    console.log("Marker not found. File may already be fixed.");
    return;
  }

  const endIndex = data.indexOf(endMarker, startIndex) + endMarker.length;

  // Remove the problematic code
  const fixedContent = data.substring(0, startIndex) + data.substring(endIndex);

  // Add the useEffect in the right place
  const hookMarker = "// Welcome message for first-time users";
  const hookIndex = fixedContent.indexOf(hookMarker);

  if (hookIndex === -1) {
    console.log("Could not find hook insertion point.");
    return;
  }

  const newEffect = `
  // Effect to scroll to selected category in budget modal
  useEffect(() => {
    if (openBudgetModal && selectedCategoryId) {
      // Use setTimeout to ensure the modal is rendered before scrolling
      setTimeout(() => {
        const categoryElement = document.getElementById(\`budget-category-\${selectedCategoryId}\`);
        if (categoryElement) {
          categoryElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [openBudgetModal, selectedCategoryId]);

  ${hookMarker}`;

  const finalContent =
    fixedContent.substring(0, hookIndex) +
    newEffect +
    fixedContent.substring(hookIndex + hookMarker.length);

  // Write the file back
  fs.writeFile(filePath, finalContent, "utf8", (err) => {
    if (err) {
      console.error("Error writing file:", err);
      return;
    }
    console.log("Successfully fixed dashboard.js");
  });
});
