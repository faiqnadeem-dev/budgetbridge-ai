/**
 * Opens a receipt image in a proper viewer window
 * @param {string} receiptDataUrl - The base64 data URL of the receipt
 */
export const openReceiptViewer = (receiptDataUrl) => {
  if (!receiptDataUrl) return;

  // Create a new window with an HTML document that displays the image properly
  const newWindow = window.open("", "_blank");

  if (!newWindow) {
    alert("Popup blocked. Please allow popups for this site to view receipts.");
    return;
  }

  // Write the HTML content with the image embedded
  newWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt Viewer</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            background-color: #f5f5f5;
            min-height: 100vh;
            font-family: Arial, sans-serif;
          }
          .receipt-container {
            background-color: white;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-width: 800px;
            text-align: center;
          }
          img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 0 auto;
          }
          h1 {
            margin-top: 0;
            font-size: 1.5rem;
            color: #1976d2;
          }
          .buttons {
            margin-top: 15px;
            display: flex;
            justify-content: center;
            gap: 10px;
          }
          .btn {
            padding: 8px 16px;
            background-color: #1976d2;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
          .btn:hover {
            background-color: #1565c0;
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <h1>Transaction Receipt</h1>
          <img src="${receiptDataUrl}" alt="Receipt" />
          <div class="buttons">
            <button class="btn" onclick="window.print()">Print Receipt</button>
            <button class="btn" onclick="window.close()">Close</button>
          </div>
        </div>
      </body>
    </html>
  `);

  newWindow.document.close();
};

