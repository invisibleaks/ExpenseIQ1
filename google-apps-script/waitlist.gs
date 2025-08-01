/**
 * Google Apps Script for Expense IQ Waitlist
 * 
 * Setup Instructions:
 * 1. Create a new Google Sheets document
 * 2. Go to Extensions > Apps Script
 * 3. Replace the default code with this script
 * 4. Save and deploy as a web app
 * 5. Set permissions to "Anyone" and execute as "Me"
 * 6. Copy the web app URL and update GOOGLE_SCRIPT_URL in WaitlistModal.tsx
 */

// Configuration
const SHEET_NAME = 'Waitlist'; // Name of the sheet tab
const HEADERS = ['Timestamp', 'Name', 'Email', 'Source', 'IP Address'];

/**
 * Initialize the spreadsheet with headers
 */
function initializeSheet() {
  const sheet = getOrCreateSheet();
  
  // Add headers if sheet is empty
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    
    // Format headers
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4285f4');
    headerRange.setFontColor('white');
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, HEADERS.length);
  }
}

/**
 * Get or create the waitlist sheet
 */
function getOrCreateSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }
  
  return sheet;
}

/**
 * Handle POST requests from the waitlist form
 */
function doPost(e) {
  try {
    // Initialize sheet if needed
    initializeSheet();
    
    // Parse the request data
    const data = JSON.parse(e.postData.contents);
    
    // Validate required fields
    if (!data.name || !data.email) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          error: 'Name and email are required'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          error: 'Invalid email format'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Check for duplicate email
    const sheet = getOrCreateSheet();
    const emailColumn = 3; // Email is in column C
    const emails = sheet.getRange(2, emailColumn, sheet.getLastRow() - 1, 1).getValues();
    const existingEmails = emails.map(row => row[0].toString().toLowerCase());
    
    if (existingEmails.includes(data.email.toLowerCase())) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          error: 'Email already registered'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get client IP (if available)
    const clientIP = e.parameter.clientIP || 'Unknown';
    
    // Prepare row data
    const rowData = [
      new Date(data.timestamp || new Date()),
      data.name.trim(),
      data.email.trim().toLowerCase(),
      data.source || 'website',
      clientIP
    ];
    
    // Add the new row
    sheet.appendRow(rowData);
    
    // Send confirmation email (optional)
    sendConfirmationEmail(data.email, data.name);
    
    // Log the submission
    console.log('Waitlist submission:', {
      name: data.name,
      email: data.email,
      timestamp: data.timestamp
    });
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Successfully added to waitlist'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error processing waitlist submission:', error);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: 'Internal server error'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle GET requests (for testing)
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      message: 'Expense IQ Waitlist API is running',
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Send confirmation email to new waitlist subscribers
 * Note: This requires Gmail API permissions
 */
function sendConfirmationEmail(email, name) {
  try {
    const subject = 'Welcome to the Expense IQ Waitlist! 🎉';
    const body = `
Hi ${name},

Thank you for joining the Expense IQ waitlist! 

You're now on the list to be among the first to experience our AI-powered expense management platform. We'll notify you as soon as we launch with exclusive early access.

What to expect:
✅ AI-powered expense categorization
✅ Automatic receipt capture and processing  
✅ Multi-account consolidation
✅ Tax-ready reports in seconds
✅ Save 10+ hours per month

We're working hard to bring you the best expense management experience for entrepreneurs and small business owners.

Stay tuned!

Best regards,
The Expense IQ Team

---
If you have any questions, just reply to this email.
You can unsubscribe at any time by replying with "UNSUBSCRIBE".
    `;
    
    // Send email using Gmail API
    GmailApp.sendEmail(email, subject, body);
    
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    // Don't throw error - email failure shouldn't break the signup process
  }
}

/**
 * Get waitlist statistics (for admin use)
 */
function getWaitlistStats() {
  const sheet = getOrCreateSheet();
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) {
    return {
      total: 0,
      today: 0,
      thisWeek: 0,
      thisMonth: 0
    };
  }
  
  const data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  let todayCount = 0;
  let weekCount = 0;
  let monthCount = 0;
  
  data.forEach(row => {
    const timestamp = new Date(row[0]);
    if (timestamp >= today) todayCount++;
    if (timestamp >= weekAgo) weekCount++;
    if (timestamp >= monthAgo) monthCount++;
  });
  
  return {
    total: lastRow - 1,
    today: todayCount,
    thisWeek: weekCount,
    thisMonth: monthCount
  };
}

/**
 * Export waitlist data as CSV (for admin use)
 */
function exportWaitlistCSV() {
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();
  
  let csv = '';
  data.forEach(row => {
    csv += row.map(cell => `"${cell}"`).join(',') + '\n';
  });
  
  return csv;
}