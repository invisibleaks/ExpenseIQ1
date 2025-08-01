# Waitlist Setup Instructions

This document provides step-by-step instructions for setting up the waitlist functionality with Google Sheets integration.

## Google Apps Script Setup

### 1. Create Google Sheets Document
1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Name it "Expense IQ Waitlist" or similar
4. Note the spreadsheet ID from the URL (the long string between `/d/` and `/edit`)

### 2. Set Up Apps Script
1. In your Google Sheet, go to **Extensions > Apps Script**
2. Delete the default `myFunction()` code
3. Copy and paste the entire contents of `google-apps-script/waitlist.gs`
4. Save the project (Ctrl+S or Cmd+S)
5. Name the project "Expense IQ Waitlist API"

### 3. Deploy as Web App
1. Click the **Deploy** button (top right)
2. Choose **New deployment**
3. Click the gear icon next to "Type" and select **Web app**
4. Fill in the deployment settings:
   - **Description**: "Expense IQ Waitlist API v1"
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone
5. Click **Deploy**
6. **Important**: Copy the Web App URL - you'll need this for the frontend

### 4. Set Permissions
1. The first time you deploy, you'll need to authorize the script
2. Click **Authorize access**
3. Choose your Google account
4. Click **Advanced** if you see a warning
5. Click **Go to [Project Name] (unsafe)**
6. Click **Allow**

### 5. Test the Deployment
1. Open the Web App URL in a new browser tab
2. You should see a JSON response like:
   ```json
   {
     "message": "Expense IQ Waitlist API is running",
     "timestamp": "2025-01-XX..."
   }
   ```

## Frontend Integration

### 1. Update the Google Script URL
1. Open `src/components/WaitlistModal.tsx`
2. Find the line with `GOOGLE_SCRIPT_URL`
3. Replace `YOUR_SCRIPT_ID` with your actual Web App URL:
   ```typescript
   const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_ACTUAL_SCRIPT_ID/exec';
   ```

### 2. Test the Integration
1. Start your development server: `npm run dev`
2. Click any "Try It Free" button
3. Fill out the form with test data
4. Submit the form
5. Check your Google Sheet - you should see the new entry

## Features Included

### Form Validation
- ✅ Real-time email format validation
- ✅ Required field validation
- ✅ Duplicate email prevention
- ✅ Input sanitization

### User Experience
- ✅ Loading states during submission
- ✅ Success confirmation message
- ✅ Error handling with user-friendly messages
- ✅ Auto-close modal after success
- ✅ Keyboard navigation (ESC to close)
- ✅ Mobile responsive design

### Data Management
- ✅ Automatic timestamp recording
- ✅ Duplicate email detection
- ✅ Data validation on server side
- ✅ Structured data storage in Google Sheets
- ✅ Optional confirmation emails

### Security & Privacy
- ✅ Input sanitization
- ✅ Basic spam protection
- ✅ No-cors mode for security
- ✅ Privacy-friendly data collection

## Customization Options

### Email Confirmation
The script includes an optional email confirmation feature. To enable:
1. The Gmail API is already included in the script
2. Customize the email template in the `sendConfirmationEmail` function
3. The confirmation emails will be sent from your Google account

### Analytics Integration
The form includes Google Analytics event tracking:
```typescript
gtag('event', 'waitlist_signup', {
  event_category: 'engagement',
  event_label: 'expense-iq-waitlist'
});
```

### Styling Customization
The modal and buttons use Tailwind CSS classes and can be easily customized:
- Colors: Modify the gradient classes (`from-purple-600 to-cyan-500`)
- Sizing: Adjust padding, margins, and font sizes
- Animations: Modify transition and transform classes

## Monitoring & Analytics

### View Submissions
1. Open your Google Sheet to see all submissions in real-time
2. Data includes: Timestamp, Name, Email, Source, IP Address

### Get Statistics
Use the Apps Script editor to run `getWaitlistStats()` for analytics:
- Total signups
- Signups today
- Signups this week  
- Signups this month

### Export Data
Run `exportWaitlistCSV()` to get a CSV export of all waitlist data.

## Troubleshooting

### Common Issues

**"Script function not found" error:**
- Make sure you've saved the Apps Script project
- Redeploy the web app after making changes

**Form submissions not appearing in sheet:**
- Check the Web App URL is correct in `WaitlistModal.tsx`
- Verify the deployment permissions are set to "Anyone"
- Check the browser console for error messages

**CORS errors:**
- This is normal with `no-cors` mode
- The form should still work despite console warnings

**Duplicate email detection not working:**
- Make sure the sheet has headers in row 1
- Check that email is in column C (3rd column)

### Getting Help
If you encounter issues:
1. Check the Apps Script execution log for errors
2. Test the Web App URL directly in a browser
3. Verify all permissions are granted
4. Make sure the Google Sheet is accessible

## Security Notes

- The script runs with your Google account permissions
- Only collect necessary data (name and email)
- Consider adding rate limiting for production use
- The no-cors mode provides additional security
- All data is stored in your private Google Sheet

## Next Steps

After setup:
1. Test thoroughly with different browsers and devices
2. Monitor the first few submissions to ensure everything works
3. Consider setting up email notifications for new signups
4. Plan your launch sequence for waitlist subscribers