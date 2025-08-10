# Setup Instructions for ExpenseIQ

## Environment Variables Setup

The application requires Supabase environment variables to function properly. Follow these steps:

### 1. Create Environment File

Create a `.env` file in the root directory with the following content:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the "Project URL" and "anon public" key
4. Replace the placeholder values in your `.env` file

### 3. Database Setup

Make sure your Supabase database has the required tables and policies:

1. Run the migrations in the `supabase/migrations/` folder
2. The latest migration should be applied: `20250810165714_dry_cliff.sql`

### 4. Common Issues and Solutions

#### Issue: "Could not save, please try again" when adding expenses

**Possible Causes:**
1. Missing environment variables
2. Database connection issues
3. Row Level Security (RLS) policy violations
4. Invalid workspace or user permissions

**Solutions:**
1. Check that your `.env` file exists and has correct values
2. Verify you're logged in and have an active workspace selected
3. Check browser console for specific error messages
4. Ensure the user has proper workspace membership

#### Issue: Environment variables not loading

**Solution:**
1. Restart your development server after creating the `.env` file
2. Make sure the `.env` file is in the root directory (same level as `package.json`)
3. Verify the variable names start with `VITE_`

### 5. Testing the Setup

1. Start the development server: `npm run dev`
2. Sign up or log in to your account
3. Create or select a workspace
4. Try adding a manual expense
5. Check that the expense appears in your Supabase database

### 6. Database Schema

The application uses the following key tables:
- `workspaces` - Business/workspace entities
- `workspace_members` - User membership in workspaces
- `expenses` - Expense records with enum types for source and status

The expense table uses custom enum types:
- `expense_source`: 'upload', 'camera', 'voice', 'manual'
- `expense_status`: 'unreviewed', 'reviewed', 'flagged'

## Support

If you continue to experience issues:
1. Check the browser console for error messages
2. Verify your Supabase project is active and accessible
3. Ensure all migrations have been applied successfully
