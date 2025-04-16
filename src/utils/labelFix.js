/**
 * Comprehensive fix for label-form element relationships
 * Ensures all labels reference elements by ID, not by name
 * Optimized version with throttling and targeted approach
 */

// Fix that runs as soon as DOM is available
export function fixLabelIdRelationships() {
    let isRunning = false;
    let pendingExecution = false;
    
    // Throttled execution function to prevent excessive CPU usage
    const throttledFixLabels = () => {
      if (isRunning) {
        pendingExecution = true;
        return;
      }
      
      isRunning = true;
      
      // Set a timeout to prevent blocking the main thread
      setTimeout(() => {
        fixLabels();
        isRunning = false;
        
        if (pendingExecution) {
          pendingExecution = false;
          throttledFixLabels();
        }
      }, 100);
    };
    
    // The actual fix function with optimizations
    const fixLabels = () => {
      // Track which elements we've already processed to avoid duplicate work
      const processedElements = new Set();
      
      // Find Material-UI labels that need fixing
      const muiLabels = document.querySelectorAll('.MuiInputLabel-root[for]');
      
      muiLabels.forEach(label => {
        if (processedElements.has(label)) return;
        
        const forValue = label.getAttribute('for');
        if (!forValue) return;
        
        // Skip if already correctly pointing to an element with this ID
        const targetElement = document.getElementById(forValue);
        if (targetElement) {
          processedElements.add(label);
          return;
        }
        
        // Look for elements with this name instead
        const elementsWithName = document.querySelectorAll(`[name="${forValue}"]`);
        if (elementsWithName.length === 0) return;
        
        const element = elementsWithName[0];
        
        // Skip if already processed
        if (processedElements.has(element)) return;
        
        // Add ID if needed
        if (!element.id) {
          element.id = `label-fix-${forValue}-${Date.now()}`;
        }
        
        // Update label
        label.setAttribute('for', element.id);
        
        // Mark as processed
        processedElements.add(label);
        processedElements.add(element);
      });
      
      // Handle standard HTML labels too
      const allLabels = document.querySelectorAll('label[for]');
      
      allLabels.forEach(label => {
        if (processedElements.has(label)) return;
        
        const forValue = label.getAttribute('for');
        
        // Skip if already correctly pointing to an ID
        if (document.getElementById(forValue)) {
          processedElements.add(label);
          return;
        }
        
        // Find elements with matching name attribute
        const matchingNameElements = document.querySelectorAll(`[name="${forValue}"]`);
        
        if (matchingNameElements.length > 0) {
          const element = matchingNameElements[0];
          
          // Skip if already processed
          if (processedElements.has(element)) return;
          
          // Generate a guaranteed unique ID
          if (!element.id) {
            const uniqueId = `field-${forValue}-${Date.now()}`;
            element.id = uniqueId;
          }
          
          // Update the label's for attribute to point to the ID
          label.setAttribute('for', element.id);
          
          // Mark as processed
          processedElements.add(label);
          processedElements.add(element);
        }
      });
    };
    
    // Initial execution
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      throttledFixLabels();
    } else {
      document.addEventListener('DOMContentLoaded', throttledFixLabels, { once: true });
    }
    
    // Set up mutation observer with performance optimizations
    const observer = new MutationObserver((mutations) => {
      // Only run if there are mutations affecting attributes or DOM structure
      const shouldRun = mutations.some(mutation => {
        // For attribute mutations, only care about specific attributes
        if (mutation.type === 'attributes') {
          return ['for', 'id', 'name'].includes(mutation.attributeName);
        }
        // For DOM mutations, only care if nodes were added
        return mutation.type === 'childList' && mutation.addedNodes.length > 0;
      });
      
      if (shouldRun) {
        throttledFixLabels();
      }
    });
    
    // Start observing with a more limited scope
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributeFilter: ['for', 'id', 'name'],
      attributes: true
    });
    
    // Return cleanup function
    return () => {
      observer.disconnect();
      document.removeEventListener('DOMContentLoaded', throttledFixLabels);
    };
  }
  
  export default fixLabelIdRelationships;