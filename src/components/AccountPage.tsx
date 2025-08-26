import React, { useState, useRef, useEffect } from 'react';
import { 
  Brain, 
  Plus, 
  ChevronDown, 
  Calendar, 
  User, 
  Settings, 
  LogOut, 
  Upload, 
  Camera, 
  Mic, 
  Edit3, 
  Search, 
  Filter, 
  MoreHorizontal,
  Check,
  X,
  Eye,
  Trash2,
  Download,
  Tag,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Clock,
  FileText,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Building,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import BusinessModal from './BusinessModal';

interface Expense {
  id: string;
  merchant: string;
  amount: number;
  txn_date: string;
  global_category_id: string; // FIXED: Match actual database column name
  category_confidence: number;
  payment_method_id?: string;
  source: 'upload' | 'camera' | 'voice' | 'manual';
  status: 'unreviewed' | 'reviewed' | 'flagged';
  notes?: string;
  workspace_id: string;
  user_id: string;
  currency: string;
  is_reimbursable: boolean;
  created_at: string;
  // Joined fields
  category_name?: string;
  payment_method_name?: string;
}

interface Business {
  id: string;
  name: string;
  type: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
}

interface AccountPageProps {
  onBack: () => void;
  onLogout: () => void;
  user?: any;
}

const AccountPage: React.FC<AccountPageProps> = ({ onBack, onLogout, user }) => {
  // State management
  const [currentView, setCurrentView] = useState<'dashboard' | 'inbox' | 'expenses' | 'manual-entry' | 'profile'>('dashboard');
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [showCreateBusinessModal, setShowCreateBusinessModal] = useState(false);
  const [showReceiptPreview, setShowReceiptPreview] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [dateRange, setDateRange] = useState('This Month');
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState<string>('');
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const workspaceSelectorRef = useRef<HTMLButtonElement>(null);

  // Real data from database
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [workspaces, setWorkspaces] = useState([{ id: '', name: 'Select a business...' }]);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [isRefreshingExpenses, setIsRefreshingExpenses] = useState(false); // Add this flag

  // Debug: Check user and workspace state
  React.useEffect(() => {
    console.log('AccountPage Debug Info:', {
      user: user ? {
        id: user.id,
        email: user.email,
        hasUser: true
      } : 'No user',
      activeWorkspace,
      businessesCount: businesses.length,
      workspacesCount: workspaces.length,
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing',
      supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
    });
  }, [user, activeWorkspace, businesses, workspaces]);

  // Fetch workspaces from database - only if user is authenticated
  useEffect(() => {
    const fetchWorkspaces = async () => {
      // Check if user is authenticated
      if (!user) {
        setIsLoadingWorkspaces(false);
        return;
      }

      try {
        setIsLoadingWorkspaces(true);
        console.log('Fetching workspaces for user:', user.id);
        
        // Simple approach: fetch workspaces where user is the creator
        // This should work with the existing RLS policies
        const { data: workspacesData, error: workspacesError } = await supabase
          .from('workspaces')
          .select('*')
          .order('created_at', { ascending: false });

        if (workspacesError) {
          console.error('Error fetching workspaces:', workspacesError);
          // Try alternative approach if the first fails
          console.log('Trying alternative workspace fetch...');
          
          // Alternative: check if user can access any workspaces
          const { data: testData, error: testError } = await supabase
            .from('workspaces')
            .select('id, name')
            .limit(1);
            
          if (testError) {
            console.error('Alternative approach also failed:', testError);
            console.log('This suggests an RLS policy issue');
          } else {
            console.log('Alternative approach succeeded, found:', testData);
          }
        } else {
          console.log('Successfully fetched workspaces:', workspacesData);
          
          if (workspacesData && workspacesData.length > 0) {
            // Transform data to match our interface
            const transformedWorkspaces = workspacesData.map(ws => ({
              id: ws.id,
              name: ws.name,
              type: ws.business_type || 'Business',
              description: ws.description
            }));

            setBusinesses(transformedWorkspaces);
            
            // Update workspace dropdown
            const workspaceOptions = [
              { id: '', name: 'Select a business...' },
              ...transformedWorkspaces.map(ws => ({ id: ws.id, name: ws.name }))
            ];
            setWorkspaces(workspaceOptions);

            // Auto-select the first workspace if none is selected
            if (!activeWorkspace && transformedWorkspaces.length > 0) {
              console.log('Auto-selecting first workspace:', transformedWorkspaces[0].name);
              setActiveWorkspace(transformedWorkspaces[0].id);
            }
          } else {
            console.log('No workspaces found in database');
            setBusinesses([]);
            setWorkspaces([{ id: '', name: 'Select a business...' }]);
          }
        }
      } catch (error) {
        console.error('Unexpected error fetching workspaces:', error);
      } finally {
        setIsLoadingWorkspaces(false);
      }
    };

    fetchWorkspaces();
  }, [user]); // Remove activeWorkspace dependency to avoid infinite loop

  // Fetch expenses when workspace changes
  useEffect(() => {
    if (activeWorkspace && user && !isRefreshingExpenses) {
      fetchExpenses();
      fetchCategoriesAndPaymentMethods();
    }
  }, [activeWorkspace, user]); // Remove fetchExpenses from dependencies to prevent infinite loops

  // Fetch expenses from database
  const fetchExpenses = async () => {
    if (!activeWorkspace) return;

    try {
      setIsLoadingExpenses(true);
      
      // First, try to fetch expenses without joins to see if the basic query works
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('workspace_id', activeWorkspace)
        .order('created_at', { ascending: false })
        .limit(100);

      if (expensesError) {
        console.error('Error fetching expenses:', expensesError);
        console.error('Error details:', expensesError.message, expensesError.details, expensesError.hint);
      } else {
        console.log('Raw expenses data:', expensesData);
        console.log('Number of expenses fetched:', expensesData?.length || 0);
        
        // Transform the data to match our interface
        const transformedExpenses = expensesData?.map(expense => ({
          ...expense,
          // Since we're not joining categories/payment_methods, set default values
          category_name: 'Uncategorized', // We'll fetch this separately if needed
          payment_method_name: 'Not specified', // We'll fetch this separately if needed
          // Map database fields to our interface
          merchant: expense.merchant,
          amount: expense.amount,
          txn_date: expense.txn_date,
          global_category_id: expense.global_category_id,
          category_confidence: expense.category_confidence || 0,
          payment_method_id: expense.payment_method_id,
          source: expense.source,
          status: expense.status,
          notes: expense.notes,
          workspace_id: expense.workspace_id,
          user_id: expense.user_id,
          currency: expense.currency,
          is_reimbursable: expense.is_reimbursable,
          created_at: expense.created_at
        })) || [];

        console.log('Transformed expenses:', transformedExpenses);
        setExpenses(transformedExpenses);
        
        // If we have expenses, try to fetch category and payment method names
        if (transformedExpenses.length > 0) {
          await enrichExpensesWithNames(transformedExpenses);
        }
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setIsLoadingExpenses(false);
    }
  };

  // Function to enrich expenses with category and payment method names
  const enrichExpensesWithNames = async (expenses: Expense[]) => {
    try {
      // Get unique category and payment method IDs
      const categoryIds = [...new Set(expenses.map(e => e.global_category_id).filter(Boolean))];
      const paymentMethodIds = [...new Set(expenses.map(e => e.payment_method_id).filter(Boolean))];
      
      // Fetch category names from global_categories table
      if (categoryIds.length > 0) {
        const { data: categoryData, error: categoryError } = await supabase
          .from('global_categories')
          .select('id, name')
          .in('id', categoryIds);
          
        if (!categoryError && categoryData) {
          const categoryMap = new Map(categoryData.map(c => [c.id, c.name]));
          setExpenses(prev => prev.map(expense => ({
            ...expense,
            category_name: expense.global_category_id ? (categoryMap.get(expense.global_category_id) || 'Uncategorized') : 'Uncategorized'
          })));
        }
      }
      
      // Fetch payment method names
      if (paymentMethodIds.length > 0) {
        const { data: paymentMethodData, error: paymentMethodError } = await supabase
          .from('payment_methods')
          .select('id, name')
          .in('id', paymentMethodIds);
          
        if (!paymentMethodError && paymentMethodData) {
          const paymentMethodMap = new Map(paymentMethodData.map(pm => [pm.id, pm.name]));
          setExpenses(prev => prev.map(expense => ({
            ...expense,
            payment_method_name: expense.payment_method_id ? (paymentMethodMap.get(expense.payment_method_id) || 'Not specified') : 'Not specified'
          })));
        }
      }
    } catch (error) {
      console.error('Error enriching expenses with names:', error);
    }
  };

  // Fetch categories and payment methods
  const fetchCategoriesAndPaymentMethods = async () => {
    if (!activeWorkspace) return;

    try {
      console.log('🔍 Starting to fetch categories for dashboard workspace:', activeWorkspace);
      
      // Try to fetch categories from the new global categories system first
      console.log('📡 Attempting to fetch global categories for dashboard...');
      const { data: globalCategoriesData, error: globalCategoriesError } = await supabase
        .from('workspace_category_mappings')
        .select(`
          id,
          global_categories!inner(
            id,
            name,
            color
          )
        `)
        .eq('workspace_id', activeWorkspace)
        .eq('is_active', true)
        .order('name', { foreignTable: 'global_categories' });

      console.log('📊 Dashboard global categories response:', { data: globalCategoriesData, error: globalCategoriesError });

      if (!globalCategoriesError && globalCategoriesData && globalCategoriesData.length > 0) {
        // FIXED: Use the global_categories.id instead of the mapping id
        const transformedCategories = globalCategoriesData.map((item: any) => ({
          id: item.global_categories.id, // Use the actual category ID, not the mapping ID
          name: item.global_categories.name,
          color: item.global_categories.color
        }));
        
        setCategories(transformedCategories);
        console.log('✅ Successfully fetched global categories for dashboard:', transformedCategories.length, transformedCategories);
      } else {
        console.log('⚠️ Global categories failed or empty for dashboard, falling back to old method');
        console.log('❌ Error details:', globalCategoriesError);
        console.log('📊 Data received:', globalCategoriesData);
        
        // FIXED: Use global_categories table directly instead of old categories table
        console.log('📡 Attempting to fetch global categories directly for dashboard...');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('global_categories')
          .select('id, name, color')
          .order('name');
        
        if (fallbackError) {
          console.error('❌ Direct global categories fetch failed for dashboard:', fallbackError);
          // Set empty categories array as last resort
          setCategories([]);
        } else {
          setCategories(fallbackData || []);
          console.log('✅ Fetched global categories directly for dashboard:', fallbackData?.length || 0);
        }
      }

      // Fetch payment methods (unchanged)
      const { data: paymentMethodsData, error: paymentMethodsError } = await supabase
        .from('payment_methods')
        .select('id, name, type')
        .eq('workspace_id', activeWorkspace)
        .order('name');

      if (paymentMethodsError) {
        console.error('Error fetching payment methods:', paymentMethodsError);
      } else {
        setPaymentMethods(paymentMethodsData || []);
      }
    } catch (error) {
      console.error('Error fetching categories/payment methods:', error);
    }
  };

  // Refresh dashboard data
  const refreshDashboard = async () => {
    if (activeWorkspace && user) {
      setIsLoadingDashboard(true);
      await Promise.all([
        fetchExpenses(),
        fetchCategoriesAndPaymentMethods()
      ]);
      setIsLoadingDashboard(false);
    }
  };

  // Handle new expense added (called from ManualExpensePage)
  const handleExpenseAdded = () => {
    // Don't refresh dashboard immediately to avoid interfering with local state changes
    // The new expense will be fetched on the next natural refresh cycle
    console.log('New expense added - will be fetched on next refresh cycle');
  };

  // Computed values - filtered by active workspace
  const workspaceExpenses = expenses.filter(e => !activeWorkspace || e.workspace_id === activeWorkspace);
  const unreviewedExpenses = workspaceExpenses.filter(e => e.status === 'unreviewed');
  const reviewedExpenses = workspaceExpenses.filter(e => e.status === 'reviewed');

  // Calculate monthly totals
  const getCurrentMonthExpenses = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    console.log('Calculating current month expenses...');
    console.log('Current month/year:', currentMonth, currentYear);
    console.log('Total workspace expenses:', workspaceExpenses.length);
    
    const currentMonthExpenses = workspaceExpenses.filter(expense => {
      const expenseDate = new Date(expense.txn_date);
      const isCurrentMonth = expenseDate.getMonth() === currentMonth && 
                           expenseDate.getFullYear() === currentYear;
      
      if (isCurrentMonth) {
        console.log('Found current month expense:', expense.merchant, expense.amount, expense.txn_date);
      }
      
      return isCurrentMonth;
    });
    
    console.log('Current month expenses count:', currentMonthExpenses.length);
    return currentMonthExpenses;
  };

  const currentMonthExpenses = getCurrentMonthExpenses();
  const thisMonthTotal = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Calculate last month total for comparison
  const getLastMonthExpenses = () => {
    const now = new Date();
    const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    
    return workspaceExpenses.filter(expense => {
      const expenseDate = new Date(expense.txn_date);
      return expenseDate.getMonth() === lastMonth && 
             expenseDate.getFullYear() === lastMonthYear;
    });
  };

  const lastMonthExpenses = getLastMonthExpenses();
  const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Calculate percentage change
  const percentageChange = lastMonthTotal > 0 
    ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 
    : 0;

  // Get top categories by spending
  const getTopCategories = () => {
    const categoryTotals = currentMonthExpenses.reduce((acc, expense) => {
      const categoryName = expense.category_name || 'Uncategorized';
      acc[categoryName] = (acc[categoryName] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([name, total]) => ({
        name,
        total,
        percentage: (total / thisMonthTotal) * 100
      }));
  };

  const topCategories = getTopCategories();

  // Get recent expenses (last 10)
  const recentExpenses = workspaceExpenses.slice(0, 10);
 // console.log('Recent expenses (first 10):', recentExpenses);

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get confidence color for category chips
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'bg-green-100 text-green-700 border-green-200';
    if (confidence >= 70) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  // Check if actions should be disabled
  const isActionsDisabled = !activeWorkspace;

  // Handle workspace selection
  const handleWorkspaceChange = (workspaceId: string) => {
    setActiveWorkspace(workspaceId);
    setWorkspaceDropdownOpen(false);
    // Store in user preferences (localStorage for demo)
    if (workspaceId) {
      localStorage.setItem('last_active_business_id', workspaceId);
    }
  };

  // Load last active workspace on mount
  useEffect(() => {
    const lastWorkspace = localStorage.getItem('last_active_business_id');
    if (lastWorkspace && businesses.find(b => b.id === lastWorkspace)) {
      setActiveWorkspace(lastWorkspace);
    }
  }, [businesses]);

  // Handle disabled action clicks
  const handleDisabledAction = () => {
    setShowBusinessModal(true);
  };

  // Focus workspace selector
  const focusWorkspaceSelector = () => {
    setShowBusinessModal(false);
    workspaceSelectorRef.current?.focus();
  };

  // Handle business creation
  const handleBusinessCreated = (newBusiness: any) => {
    // Add the new business to the lists
    const newWorkspace = { id: newBusiness.id, name: newBusiness.name };
    const newBusinessItem = { 
      id: newBusiness.id, 
      name: newBusiness.name, 
      type: 'business' 
    };
    
    setWorkspaces(prev => [...prev.filter(w => w.id !== ''), newWorkspace]);
    setBusinesses(prev => [...prev, newBusinessItem]);
    
    // Auto-select the new business
    setActiveWorkspace(newBusiness.id);
    
    // Close the modal
    setShowCreateBusinessModal(false);
  };

  // File upload handling
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!activeWorkspace) {
      handleDisabledAction();
      return;
    }
    
    setIsUploading(true);
    
    // Simulate OCR processing
    setTimeout(() => {
      const newExpense: Expense = {
        id: Date.now().toString(),
        merchant: 'New Receipt',
        amount: Math.random() * 100,
        txn_date: new Date().toISOString().split('T')[0],
        global_category_id: 'cat1', // AI categorization
        category_confidence: Math.floor(Math.random() * 30) + 70,
        source: 'upload',
        status: 'unreviewed',
        workspace_id: activeWorkspace,
        user_id: user?.id,
        currency: 'INR',
        is_reimbursable: false,
        created_at: new Date().toISOString()
      };
      
      setExpenses(prev => [newExpense, ...prev]);
      setIsUploading(false);
    }, 2000);
  };

  // Voice recording
  const handleVoiceRecord = () => {
    if (!activeWorkspace) {
      handleDisabledAction();
      return;
    }
    
    setIsRecording(true);
    setTimeout(() => {
      const newExpense: Expense = {
        id: Date.now().toString(),
        merchant: 'Voice Entry',
        amount: Math.random() * 50,
        txn_date: new Date().toISOString().split('T')[0],
        global_category_id: 'cat2', // AI categorization
        category_confidence: Math.floor(Math.random() * 25) + 75,
        source: 'voice',
        status: 'unreviewed',
        workspace_id: activeWorkspace,
        user_id: user?.id,
        currency: 'INR',
        is_reimbursable: false,
        created_at: new Date().toISOString()
      };
      
      setExpenses(prev => [newExpense, ...prev]);
      setIsRecording(false);
    }, 3000);
  };

  // Handle camera capture
  const handleCameraCapture = () => {
    if (!activeWorkspace) {
      handleDisabledAction();
      return;
    }
    // Camera capture logic would go here
    console.log('Camera capture initiated');
  };

  // Handle manual entry
  const handleManualEntry = () => {
    if (!activeWorkspace) {
      handleDisabledAction();
      return;
    }
    if (!activeWorkspace) {
      handleDisabledAction();
      return;
    }
    // Navigate to manual entry page
    setCurrentView('manual-entry');
  };

  // Expense actions
  // NOTE: When integrated with Supabase, these operations will be automatically
  // subject to RLS policies that ensure users can only modify expenses from
  // workspaces they're members of, providing secure workspace isolation
  const acceptExpense = async (id: string) => {
    try {
      console.log('Accepting expense:', id);
      
      // Set flag to prevent fetchExpenses from running
      setIsRefreshingExpenses(true);
      
      // Update the database first
      const { error } = await supabase
        .from('expenses')
        .update({ status: 'reviewed' })
        .eq('id', id)
        .eq('workspace_id', activeWorkspace);

      if (error) {
        console.error('Error updating expense status:', error);
        setIsRefreshingExpenses(false);
        return;
      }

      // If database update succeeds, update local state
      setExpenses(prev => prev.map(e => 
        e.id === id ? { ...e, status: 'reviewed' as const } : e
      ));

      console.log('Expense status updated successfully in database');
      
      // Reset flag after a short delay to allow UI updates to settle
      setTimeout(() => setIsRefreshingExpenses(false), 100);
    } catch (error) {
      console.error('Error accepting expense:', error);
      setIsRefreshingExpenses(false);
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      console.log('Deleting expense:', id);
      
      // Set flag to prevent fetchExpenses from running
      setIsRefreshingExpenses(true);
      
      // Delete from database first
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('workspace_id', activeWorkspace);

      if (error) {
        console.error('Error deleting expense:', error);
        setIsRefreshingExpenses(false);
        return;
      }

      // If database delete succeeds, update local state
      setExpenses(prev => prev.filter(e => e.id !== id));
      
      console.log('Expense deleted successfully from database');
      
      // Reset flag after a short delay to allow UI updates to settle
      setTimeout(() => setIsRefreshingExpenses(false), 100);
    } catch (error) {
      console.error('Error deleting expense:', error);
      setIsRefreshingExpenses(false);
    }
  };

  // Update expense business
  const updateExpenseBusiness = (expenseId: string, businessId: string) => {
    // RLS will ensure this expense belongs to user's active workspace
    const business = businesses.find(b => b.id === businessId);
    setExpenses(prev => prev.map(e => 
      e.id === expenseId 
        ? { ...e, workspace_id: businessId }
        : e
    ));
  };

  // Update expense category
  const updateExpenseCategory = (expenseId: string, categoryId: string) => {
    // RLS will ensure this expense belongs to user's active workspace
    const category = categories.find(c => c.id === categoryId);
    setExpenses(prev => prev.map(e => 
      e.id === expenseId 
        ? { ...e, global_category_id: categoryId, category_name: category?.name }
        : e
    ));
  };

  // Update expense payment method
  const updateExpensePaymentMethod = (expenseId: string, paymentMethodId: string) => {
    // RLS will ensure this expense belongs to user's active workspace
    const paymentMethod = paymentMethods.find(pm => pm.id === paymentMethodId);
    setExpenses(prev => prev.map(e => 
      e.id === expenseId 
        ? { ...e, payment_method_id: paymentMethodId, payment_method_name: paymentMethod?.name }
        : e
    ));
  };

  // Helper function to check if all items are selected
  const isAllSelected = selectedExpenses.length === unreviewedExpenses.length && unreviewedExpenses.length > 0;
  
  // Helper function to select all unreviewed expenses
  const selectAllExpenses = () => {
    const allExpenseIds = unreviewedExpenses.map(expense => expense.id);
    setSelectedExpenses(allExpenseIds);
  };
  
  // Helper function to clear all selections
  const clearAllSelections = () => {
    setSelectedExpenses([]);
  };
  
  // Helper function to handle individual expense selection
  const handleExpenseSelection = (expenseId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedExpenses(prev => [...prev, expenseId]);
    } else {
      setSelectedExpenses(prev => prev.filter(id => id !== expenseId));
    }
  };
  
  // Keyboard shortcut for select all (Ctrl/Cmd + A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        if (currentView === 'inbox' && unreviewedExpenses.length > 0) {
          if (isAllSelected) {
            clearAllSelections();
          } else {
            selectAllExpenses();
          }
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentView, unreviewedExpenses, isAllSelected]);

  // Bulk actions
  const handleBulkAccept = async () => {
    try {
      const workspaceSelectedExpenses = selectedExpenses.filter(id => {
        const expense = expenses.find(e => e.id === id);
        return expense && (!activeWorkspace || expense.workspace_id === activeWorkspace);
      });

      if (workspaceSelectedExpenses.length === 0) return;

      console.log('Bulk accepting expenses:', workspaceSelectedExpenses);

      // Set flag to prevent fetchExpenses from running
      setIsRefreshingExpenses(true);

      // Update all selected expenses in database
      const { error } = await supabase
        .from('expenses')
        .update({ status: 'reviewed' })
        .in('id', workspaceSelectedExpenses)
        .eq('workspace_id', activeWorkspace);

      if (error) {
        console.error('Error bulk updating expenses:', error);
        setIsRefreshingExpenses(false);
        return;
      }

      // Update local state
      setExpenses(prev => prev.map(e => 
        workspaceSelectedExpenses.includes(e.id) ? { ...e, status: 'reviewed' as const } : e
      ));
      
      setSelectedExpenses([]);
      console.log('Bulk accept completed successfully in database');
      
      // Reset flag after a short delay to allow UI updates to settle
      setTimeout(() => setIsRefreshingExpenses(false), 100);
    } catch (error) {
      console.error('Error in bulk accept:', error);
      setIsRefreshingExpenses(false);
    }
  };

  const handleBulkDelete = async () => {
    try {
      const workspaceSelectedExpenses = selectedExpenses.filter(id => {
        const expense = expenses.find(e => e.id === id);
        return expense && (!activeWorkspace || expense.workspace_id === activeWorkspace);
      });

      if (workspaceSelectedExpenses.length === 0) return;

      console.log('Bulk deleting expenses:', workspaceSelectedExpenses);

      // Set flag to prevent fetchExpenses from running
      setIsRefreshingExpenses(true);

      // Delete all selected expenses from database
      const { error } = await supabase
        .from('expenses')
        .delete()
        .in('id', workspaceSelectedExpenses)
        .eq('workspace_id', activeWorkspace);

      if (error) {
        console.error('Error bulk deleting expenses:', error);
        setIsRefreshingExpenses(false);
        return;
      }

      // Update local state
      setExpenses(prev => prev.filter(e => !workspaceSelectedExpenses.includes(e.id)));
      setSelectedExpenses([]);
      
      console.log('Bulk delete completed successfully in database');
      
      // Reset flag after a short delay to allow UI updates to settle
      setTimeout(() => setIsRefreshingExpenses(false), 100);
    } catch (error) {
      console.error('Error in bulk delete:', error);
      setIsRefreshingExpenses(false);
    }
  };

  // Filter expenses
  // NOTE: When integrated with Supabase, the base expense list will already be
  // filtered by RLS to only include expenses from workspaces the user is a member of.
  // The activeWorkspace filter here provides additional UI-level filtering for
  // single-workspace views and ensures consistent user experience.
  const filteredExpenses = reviewedExpenses.filter(expense => {
    const matchesSearch = expense.merchant.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || expense.category_name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get active workspace name
  const activeWorkspaceName = activeWorkspace 
    ? businesses.find(b => b.id === activeWorkspace)?.name || 'Unknown Business'
    : 'Select a business...';

  // Check if user is authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-brand-light-beige flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-brand-dark-teal rounded-lg flex items-center justify-center mx-auto mb-4">
            <Brain className="w-5 h-5 text-white animate-pulse" />
          </div>
          <p className="text-brand-text-dark">Please log in to access your account</p>
        </div>
      </div>
    );
  }

  // Show manual entry page
  if (currentView === 'manual-entry') {
    const ManualExpensePage = React.lazy(() => import('./ManualExpensePage'));
    return (
      <React.Suspense fallback={
        <div className="min-h-screen bg-brand-light-beige flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 bg-brand-dark-teal rounded-lg flex items-center justify-center mx-auto mb-4">
              <Brain className="w-5 h-5 text-white animate-pulse" />
            </div>
            <p className="text-brand-text-dark">Loading...</p>
          </div>
        </div>
      }>
        <ManualExpensePage 
          onBack={() => setCurrentView('dashboard')}
          activeWorkspaceId={activeWorkspace}
          currentUser={user}
          onExpenseAdded={handleExpenseAdded}
        />
      </React.Suspense>
    );
  }

  // Show profile page
  if (currentView === 'profile') {
    const ProfilePage = React.lazy(() => import('./ProfilePage'));
    return (
      <React.Suspense fallback={
        <div className="min-h-screen bg-brand-light-beige flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 bg-brand-dark-teal rounded-lg flex items-center justify-center mx-auto mb-4">
              <Brain className="w-5 h-5 text-white animate-pulse" />
            </div>
            <p className="text-brand-text-dark">Loading...</p>
          </div>
        </div>
      }>
        <ProfilePage 
          onBack={() => setCurrentView('dashboard')}
          user={user}
        />
      </React.Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-brand-light-beige">
      {/* Top Bar */}
      <header className="bg-white border-b border-brand-soft-gray/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-brand-dark-teal rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-brand-text-dark">Expense IQ</span>
            </div>

            {/* Center Controls */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Workspace Switcher */}
              <div className="relative">
                <button 
                  ref={workspaceSelectorRef}
                  onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
                  disabled={isLoadingWorkspaces}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                    isLoadingWorkspaces
                      ? 'border-brand-soft-gray/30 bg-brand-soft-gray/10 cursor-not-allowed'
                      : activeWorkspace 
                      ? 'border-brand-muted-teal/50 hover:border-brand-muted-teal' 
                      : 'border-yellow-300 bg-yellow-50 hover:border-yellow-400'
                  }`}
                >
                  <span className={`text-sm font-medium ${
                    isLoadingWorkspaces 
                      ? 'text-brand-soft-gray' 
                      : activeWorkspace ? 'text-brand-text-dark' : 'text-yellow-700'
                  }`}>
                    {isLoadingWorkspaces ? 'Loading...' : activeWorkspaceName}
                  </span>
                  <ChevronDown className="w-4 h-4 text-brand-soft-gray" />
                </button>
                
                {workspaceDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-brand-soft-gray/20 py-2 z-50">
                    {workspaces.map((workspace) => (
                      <button
                        key={workspace.id}
                        onClick={() => handleWorkspaceChange(workspace.id)}
                        disabled={workspace.id === ''}
                        className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                          workspace.id === activeWorkspace
                            ? 'bg-brand-dark-teal/10 text-brand-dark-teal font-medium'
                            : workspace.id === ''
                            ? 'text-brand-soft-gray cursor-not-allowed'
                            : 'text-brand-text-dark hover:bg-brand-soft-gray/10'
                        }`}
                      >
                        {workspace.name}
                      </button>
                    ))}
                    
                    {/* Divider */}
                    <hr className="my-2 border-brand-soft-gray/20" />
                    
                    {/* Create New Business Button */}
                    <button
                      onClick={() => {
                        setWorkspaceDropdownOpen(false);
                        setShowCreateBusinessModal(true);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-brand-dark-teal hover:bg-brand-dark-teal/10 transition-colors flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create New Business</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Date Range Picker */}
              <div className="relative">
                <button className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-brand-soft-gray/30 hover:border-brand-muted-teal transition-colors">
                  <Calendar className="w-4 h-4 text-brand-soft-gray" />
                  <span className="text-sm font-medium text-brand-text-dark">{dateRange}</span>
                  <ChevronDown className="w-4 h-4 text-brand-soft-gray" />
                </button>
              </div>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-brand-soft-gray/10 transition-colors"
              >
                <div className="w-8 h-8 bg-brand-dark-teal rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <ChevronDown className="w-4 h-4 text-brand-soft-gray" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-brand-soft-gray/20 py-2 z-50">
                  <button 
                    onClick={() => setCurrentView('profile')}
                    className="w-full px-4 py-2 text-left text-sm text-brand-text-dark hover:bg-brand-soft-gray/10 flex items-center space-x-2"
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-brand-text-dark hover:bg-brand-soft-gray/10 flex items-center space-x-2">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                  <hr className="my-2 border-brand-soft-gray/20" />
                  <button
                    onClick={onLogout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Primary Action Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 space-y-4 sm:space-y-0">
          {/* Add Expense Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowAddDropdown(!showAddDropdown)}
              disabled={isActionsDisabled}
              title={isActionsDisabled ? "Select a business to start adding expenses" : ""}
              className={`px-6 py-3 rounded-xl font-semibold focus:ring-2 focus:ring-offset-2 transition-all shadow-lg flex items-center space-x-2 ${
                isActionsDisabled
                  ? 'bg-brand-soft-gray text-brand-text-muted cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-600 transform hover:scale-105 hover:shadow-xl'
              }`}
            >
              <Plus className="w-5 h-5" />
              <span>Add Expense</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showAddDropdown && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-brand-soft-gray/20 py-2 z-50">
                <button
                  onClick={() => {
                    setShowAddDropdown(false);
                    isActionsDisabled ? handleDisabledAction() : fileInputRef.current?.click();
                  }}
                  disabled={isActionsDisabled}
                  className="w-full px-4 py-3 text-left hover:bg-brand-soft-gray/10 flex items-center space-x-3"
                >
                  <Upload className="w-5 h-5 text-brand-dark-teal" />
                  <div>
                    <div className="font-medium text-brand-text-dark">Upload Receipt</div>
                    <div className="text-sm text-brand-text-muted">Drag & drop or click to upload</div>
                  </div>
                </button>
                
                <button 
                  onClick={() => {
                    setShowAddDropdown(false);
                    isActionsDisabled ? handleDisabledAction() : handleCameraCapture();
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-brand-soft-gray/10 flex items-center space-x-3">
                  <Camera className="w-5 h-5 text-brand-dark-teal" />
                  <div>
                    <div className="font-medium text-brand-text-dark">Camera Capture</div>
                    <div className="text-sm text-brand-text-muted">Take photo with camera</div>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    setShowAddDropdown(false);
                    isActionsDisabled ? handleDisabledAction() : handleVoiceRecord();
                  }}
                  disabled={isRecording || isActionsDisabled}
                  className="w-full px-4 py-3 text-left hover:bg-brand-soft-gray/10 flex items-center space-x-3 disabled:opacity-50"
                >
                  <Mic className={`w-5 h-5 text-brand-dark-teal ${isRecording ? 'animate-pulse' : ''}`} />
                  <div>
                    <div className="font-medium text-brand-text-dark">
                      {isRecording ? 'Recording...' : 'Voice Capture'}
                    </div>
                    <div className="text-sm text-brand-text-muted">Press and hold to record</div>
                  </div>
                </button>
                
                <button 
                  onClick={() => {
                    setShowAddDropdown(false);
                    isActionsDisabled ? handleDisabledAction() : handleManualEntry();
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-brand-soft-gray/10 flex items-center space-x-3">
                  <Edit3 className="w-5 h-5 text-brand-dark-teal" />
                  <div>
                    <div className="font-medium text-brand-text-dark">Manual Entry</div>
                    <div className="text-sm text-brand-text-muted">Enter expense details</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="flex items-center space-x-4">
            <button className="text-brand-muted-teal hover:text-brand-dark-teal font-medium transition-colors">
              Manage Categories
            </button>
            <button className="text-brand-muted-teal hover:text-brand-dark-teal font-medium transition-colors flex items-center space-x-1">
              <Download className="w-4 h-4" />
              <span>Export Data</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-brand-soft-gray/10 p-1 rounded-xl w-fit">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              currentView === 'dashboard'
                ? 'bg-white text-brand-dark-teal shadow-sm'
                : 'text-brand-text-muted hover:text-brand-dark-teal'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setCurrentView('inbox')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${
              currentView === 'inbox'
                ? 'bg-white text-brand-dark-teal shadow-sm'
                : 'text-brand-text-muted hover:text-brand-dark-teal'
            }`}
          >
            <span>Inbox</span>
            {unreviewedExpenses.length > 0 && (
              <span className="bg-brand-dark-teal text-white text-xs px-2 py-1 rounded-full">
                {unreviewedExpenses.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setCurrentView('expenses')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              currentView === 'expenses'
                ? 'bg-white text-brand-dark-teal shadow-sm'
                : 'text-brand-text-muted hover:text-brand-dark-teal'
            }`}
          >
            All Expenses
          </button>
          <button
            onClick={() => setCurrentView('profile')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              currentView === 'profile'
                ? 'bg-white text-brand-dark-teal shadow-sm'
                : 'text-brand-text-muted hover:text-brand-dark-teal'
            }`}
          >
            Profile
          </button>
        </div>

        {/* Dashboard View */}
        {currentView === 'dashboard' && (
          <div className="space-y-8">
            {/* Business Selection or Creation Prompt */}
            {!activeWorkspace ? (
              <div className="bg-white rounded-2xl shadow-sm border border-brand-soft-gray/20 p-8 text-center">
                <div className="w-20 h-20 bg-brand-dark-teal/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Building className="w-10 h-10 text-brand-dark-teal" />
                </div>
                <h2 className="text-2xl font-bold text-brand-text-dark mb-4">
                  Welcome to Expense IQ!
                </h2>
                <p className="text-lg text-brand-text-muted mb-6 max-w-2xl mx-auto">
                  To get started, you need to create your first business workspace. This will be where you track all your expenses and manage your financial data.
                </p>
                
                {businesses.length > 1 ? (
                  /* User has businesses but none selected */
                  <div className="space-y-4">
                    <p className="text-brand-text-muted">Or select an existing business:</p>
                    <div className="flex justify-center">
                      <button
                        onClick={() => setWorkspaceDropdownOpen(true)}
                        className="px-6 py-3 border border-brand-muted-teal text-brand-muted-teal rounded-lg hover:border-brand-dark-teal hover:text-brand-dark-teal transition-colors"
                      >
                        Select Business
                      </button>
                    </div>
                  </div>
                ) : (
                  /* No businesses exist yet */
                  <div className="space-y-4">
                    <button
                      onClick={() => setShowCreateBusinessModal(true)}
                      className="px-8 py-4 bg-brand-dark-teal text-white rounded-xl font-semibold hover:bg-brand-dark-teal/90 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      <Building className="w-5 h-5 inline mr-2" />
                      Create Your First Business
                    </button>
                    <p className="text-sm text-brand-text-muted">
                      It only takes a minute to set up
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Business is selected - show normal dashboard */
              <>
                                 {isLoadingDashboard || isLoadingExpenses ? (
                   <div className="flex justify-center items-center py-16">
                     <Loader2 className="w-12 h-12 text-brand-dark-teal animate-spin" />
                   </div>
                 ) : (
                  <>
                                    {/* Dashboard Header with Refresh */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-brand-text-dark">Dashboard Overview</h2>
                  <button
                    onClick={refreshDashboard}
                    disabled={isLoadingDashboard}
                    className="flex items-center space-x-2 px-4 py-2 bg-brand-dark-teal text-white rounded-lg hover:bg-brand-dark-teal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RotateCw className={`w-4 h-4 ${isLoadingDashboard ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {/* Insights Snapshot */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                             <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-soft-gray/20">
                         <div className="flex items-center space-x-3 mb-4">
                           <div className="w-10 h-10 bg-brand-dark-teal/10 rounded-lg flex items-center justify-center">
                             <DollarSign className="w-5 h-5 text-brand-dark-teal" />
                           </div>
                           <div>
                             <h3 className="font-semibold text-brand-text-dark">This Month</h3>
                             <p className="text-2xl font-bold text-brand-dark-teal">
                               {thisMonthTotal > 0 ? formatCurrency(thisMonthTotal) : '₹0.00'}
                             </p>
                           </div>
                         </div>
                         {thisMonthTotal > 0 ? (
                           <p className={`text-sm ${percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                             {percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(1)}% from last month
                           </p>
                         ) : (
                           <p className="text-sm text-brand-text-muted">No expenses this month</p>
                         )}
                       </div>

                                             <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-soft-gray/20">
                         <div className="flex items-center space-x-3 mb-4">
                           <div className="w-10 h-10 bg-brand-dark-teal/10 rounded-lg flex items-center justify-center">
                             <TrendingUp className="w-5 h-5 text-brand-dark-teal" />
                           </div>
                           <div>
                             <h3 className="font-semibold text-brand-text-dark">Top Categories</h3>
                           </div>
                         </div>
                         {topCategories.length === 0 ? (
                           <div className="text-center py-4">
                             <p className="text-sm text-brand-text-muted">No expenses this month</p>
                           </div>
                         ) : (
                           <div className="space-y-1">
                             {topCategories.map((category, index) => (
                               <p key={index} className="text-sm text-brand-text-muted">
                                 {category.name} ({category.percentage.toFixed(0)}%)
                               </p>
                             ))}
                           </div>
                         )}
                       </div>

                                             <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-soft-gray/20">
                         <div className="flex items-center space-x-3 mb-4">
                           <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                             <Clock className="w-5 h-5 text-yellow-600" />
                           </div>
                           <div>
                             <h3 className="font-semibold text-brand-text-dark">Needs Attention</h3>
                             <p className="text-2xl font-bold text-yellow-600">{unreviewedExpenses.length}</p>
                           </div>
                         </div>
                         {unreviewedExpenses.length === 0 ? (
                           <p className="text-sm text-green-600">All caught up!</p>
                         ) : (
                           <p className="text-sm text-brand-text-muted">Items awaiting review</p>
                         )}
                       </div>
                    </div>

                                         {/* Recent Activity */}
                     <div className="bg-white rounded-2xl shadow-sm border border-brand-soft-gray/20 p-6">
                       <h3 className="text-lg font-semibold text-brand-text-dark mb-4">Recent Activity</h3>
                       {recentExpenses.length === 0 ? (
                         <div className="text-center py-8">
                           <div className="w-16 h-16 bg-brand-soft-gray/20 rounded-full flex items-center justify-center mx-auto mb-4">
                             <FileText className="w-8 h-8 text-brand-soft-gray" />
                           </div>
                           <p className="text-brand-text-muted mb-2">No expenses yet</p>
                           <p className="text-sm text-brand-text-muted">Add your first expense to see it here</p>
                         </div>
                       ) : (
                         <div className="space-y-3">
                           {recentExpenses.map((expense) => (
                             <div key={expense.id} className="flex items-center justify-between py-2">
                               <div className="flex items-center space-x-3">
                                 <div className="w-8 h-8 bg-brand-dark-teal/10 rounded-lg flex items-center justify-center">
                                   <FileText className="w-4 h-4 text-brand-dark-teal" />
                                 </div>
                                 <div>
                                   <p className="font-medium text-brand-text-dark">{expense.merchant}</p>
                                   <p className="text-sm text-brand-text-muted">{formatDate(expense.txn_date)}</p>
                                 </div>
                               </div>
                               <div className="text-right">
                                 <p className="font-semibold text-brand-text-dark">{formatCurrency(expense.amount, expense.currency)}</p>
                                 <p className="text-sm text-brand-text-muted capitalize">{expense.status}</p>
                               </div>
                             </div>
                           ))}
                         </div>
                       )}
                     </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Inbox View */}
        {currentView === 'inbox' && (
          <div className="space-y-6">
            {/* Bulk Actions */}
            {selectedExpenses.length > 0 && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-xl shadow-sm flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    {selectedExpenses.length} item{selectedExpenses.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleBulkAccept}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <Check className="w-4 h-4" />
                    Accept All
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete All
                  </button>
                </div>
              </div>
            )}

                        {/* Select All Button */}
            {unreviewedExpenses.length > 0 && (
              <div className={`p-4 rounded-xl shadow-sm border transition-all duration-200 ${
                selectedExpenses.length > 0 
                  ? 'bg-brand-dark-teal/5 border-brand-dark-teal/20' 
                  : 'bg-white border-brand-soft-gray/20'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          selectAllExpenses();
                        } else {
                          clearAllSelections();
                        }
                      }}
                      className="rounded border-brand-soft-gray/50 text-brand-dark-teal focus:ring-brand-dark-teal w-4 h-4"
                    />
                    <label 
                      className="text-sm font-medium text-brand-text-dark cursor-pointer hover:text-brand-dark-teal transition-colors"
                      onClick={() => {
                        if (isAllSelected) {
                          clearAllSelections();
                        } else {
                          selectAllExpenses();
                        }
                      }}
                    >
                      {isAllSelected ? 'Deselect All' : 'Select All'} ({unreviewedExpenses.length} items)
                    </label>
                    <span className="text-xs text-brand-text-muted">
                      ⌘A to toggle
                    </span>
                  </div>
                  
                  {selectedExpenses.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-brand-text-muted">
                        {selectedExpenses.length} of {unreviewedExpenses.length} selected
                      </span>
                      <button
                        onClick={clearAllSelections}
                        className="text-sm text-brand-text-muted hover:text-brand-text-dark transition-colors px-2 py-1 rounded hover:bg-brand-soft-gray/20"
                      >
                        Clear Selection
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Unreviewed Expenses */}
            {unreviewedExpenses.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-brand-soft-gray/20 p-12 text-center">
                <div className="w-16 h-16 bg-brand-dark-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-brand-dark-teal" />
                </div>
                <h3 className="text-lg font-semibold text-brand-text-dark mb-2">All caught up!</h3>
                <p className="text-brand-text-muted">No expenses need your attention right now.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {unreviewedExpenses.map((expense) => (
                  <div key={expense.id} className="bg-white rounded-xl shadow-sm border border-brand-soft-gray/20 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <input
                          type="checkbox"
                          checked={selectedExpenses.includes(expense.id)}
                          onChange={(e) => handleExpenseSelection(expense.id, e.target.checked)}
                          className="mt-1 rounded border-brand-soft-gray/50 text-brand-dark-teal focus:ring-brand-dark-teal w-4 h-4"
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-semibold text-brand-text-dark">{expense.merchant}</h4>
                            <span className="text-2xl font-bold text-brand-dark-teal">${expense.amount.toFixed(2)}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getConfidenceColor(expense.category_confidence)}`}>
                              {expense.category_confidence}% confident
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-brand-text-muted mb-4">
                            <span>{formatDate(expense.txn_date)}</span>
                            <span className="capitalize">{expense.source}</span>
                            <span className="text-brand-dark-teal">{expense.category_name}</span>
                          </div>

                          {/* AI Category Chip */}
                          <div className="mb-4">
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getConfidenceColor(expense.category_confidence)}`}>
                              <Brain className="w-3 h-3 mr-1" />
                              {expense.category_name} ({expense.category_confidence}%)
                            </div>
                          </div>

                          {/* Quick Edit Fields */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            {/* Business Selector */}
                            <select 
                              value={expense.workspace_id}
                              onChange={(e) => updateExpenseBusiness(expense.id, e.target.value)}
                              className="px-3 py-2 border border-brand-soft-gray/30 rounded-lg focus:ring-2 focus:ring-brand-dark-teal focus:border-transparent"
                            >
                              {businesses.map(business => (
                                <option key={business.id} value={business.id}>{business.name}</option>
                              ))}
                            </select>
                            
                            {/* Category Selector */}
                            <select 
                              value={expense.global_category_id}
                              onChange={(e) => updateExpenseCategory(expense.id, e.target.value)}
                              className="px-3 py-2 border border-brand-soft-gray/30 rounded-lg focus:ring-2 focus:ring-brand-dark-teal focus:border-transparent"
                            >
                              {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
                            </select>
                            
                            {/* Payment Method */}
                            <select 
                              value={expense.payment_method_id}
                              onChange={(e) => updateExpensePaymentMethod(expense.id, e.target.value)}
                              className="px-3 py-2 border border-brand-soft-gray/30 rounded-lg focus:ring-2 focus:ring-brand-dark-teal focus:border-transparent"
                            >
                              <option value="">Payment method</option>
                              {paymentMethods.map(method => (
                                <option key={method.id} value={method.id}>{method.name}</option>
                              ))}
                            </select>
                          </div>
                          
                          {/* Notes Field */}
                          <input
                            type="text"
                            placeholder="Add notes..."
                            value={expense.notes || ''}
                            onChange={(e) => {
                              setExpenses(prev => prev.map(e => 
                                e.id === expense.id ? { ...e, notes: e.notes || e.notes === '' ? e.notes : e.notes } : e
                              ));
                            }}
                            className="w-full px-3 py-2 border border-brand-soft-gray/30 rounded-lg focus:ring-2 focus:ring-brand-dark-teal focus:border-transparent mb-4"
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        {/* Receipt preview is handled by a separate modal */}
                        
                        <button
                          onClick={() => acceptExpense(expense.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                          Accept
                        </button>
                        
                        <button className="border border-brand-muted-teal text-brand-muted-teal px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-muted-teal hover:text-white transition-colors">
                          Edit
                        </button>
                        
                        <button
                          onClick={() => deleteExpense(expense.id)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Expenses Table View */}
        {currentView === 'expenses' && (
          <div className="space-y-6">
            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-brand-soft-gray/20">
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-brand-soft-gray" />
                  <input
                    type="text"
                    placeholder="Search expenses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-brand-soft-gray/30 rounded-lg focus:ring-2 focus:ring-brand-dark-teal focus:border-transparent"
                  />
                </div>
                
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-brand-soft-gray/30 rounded-lg focus:ring-2 focus:ring-brand-dark-teal focus:border-transparent"
                >
                  <option value="">All categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
                
                <button className="flex items-center space-x-2 px-4 py-2 border border-brand-soft-gray/30 rounded-lg hover:border-brand-muted-teal transition-colors">
                  <Filter className="w-4 h-4" />
                  <span>More Filters</span>
                </button>
              </div>
            </div>

            {/* Expenses Table */}
            <div className="bg-white rounded-xl shadow-sm border border-brand-soft-gray/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-brand-soft-gray/10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-muted uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-muted uppercase tracking-wider">Merchant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-muted uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-muted uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-muted uppercase tracking-wider">Payment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-muted uppercase tracking-wider">Tags</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-muted uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-soft-gray/20">
                    {filteredExpenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-brand-soft-gray/5">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-dark">
                          {formatDate(expense.txn_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-brand-text-dark">{expense.merchant}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getConfidenceColor(expense.category_confidence)}`}>
                            {expense.category_name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-brand-text-dark">
                          ${expense.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-muted">
                          {expense.payment_method_name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {/* Tags are not directly stored in the expense table, but could be added */}
                          {/* {expense.tags?.map(tag => (
                            <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-brand-warm-beige/30 text-brand-dark-teal mr-1">
                              {tag}
                            </span>
                          ))} */}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-muted">
                          <div className="flex items-center space-x-2">
                            {/* Receipt preview is handled by a separate modal */}
                            <button className="text-brand-muted-teal hover:text-brand-dark-teal">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button className="text-brand-soft-gray hover:text-brand-muted-teal">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Business Selection Modal */}
      {showBusinessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-brand-text-dark mb-2">
                Please choose a business first
              </h3>
              <p className="text-brand-text-muted mb-6">
                You need to select a business workspace before adding expenses.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowBusinessModal(false)}
                  className="flex-1 px-4 py-2 border border-brand-soft-gray/30 text-brand-text-muted rounded-lg hover:bg-brand-soft-gray/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={focusWorkspaceSelector}
                  className="flex-1 px-4 py-2 bg-brand-dark-teal text-white rounded-lg hover:bg-brand-dark-teal/90 transition-colors"
                >
                  Select Business
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Preview Panel */}
      {showReceiptPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-brand-soft-gray/20">
              <h3 className="text-lg font-semibold text-brand-text-dark">Receipt Preview</h3>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-brand-muted-teal hover:text-brand-dark-teal rounded-lg hover:bg-brand-soft-gray/10 transition-colors">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button className="p-2 text-brand-muted-teal hover:text-brand-dark-teal rounded-lg hover:bg-brand-soft-gray/10 transition-colors">
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button className="p-2 text-brand-muted-teal hover:text-brand-dark-teal rounded-lg hover:bg-brand-soft-gray/10 transition-colors">
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowReceiptPreview(null)}
                  className="p-2 text-brand-muted-teal hover:text-brand-dark-teal rounded-lg hover:bg-brand-soft-gray/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 bg-brand-soft-gray/10 flex items-center justify-center min-h-96">
              <div className="text-center">
                <FileText className="w-16 h-16 text-brand-soft-gray mx-auto mb-4" />
                <p className="text-brand-text-muted">Receipt preview would appear here</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="fixed bottom-4 right-4 bg-white rounded-xl shadow-lg border border-brand-soft-gray/20 p-4 z-50">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-dark-teal"></div>
            <div>
              <p className="font-medium text-brand-text-dark">Processing receipt...</p>
              <p className="text-sm text-brand-text-muted">Extracting data with AI</p>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        multiple
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
      />

      {/* Click outside handlers */}
      {workspaceDropdownOpen && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setWorkspaceDropdownOpen(false)}
        />
      )}
      {showAddDropdown && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setShowAddDropdown(false)}
        />
      )}

      {/* Business Creation Modal */}
      <BusinessModal
        isOpen={showCreateBusinessModal}
        onClose={() => setShowCreateBusinessModal(false)}
        onBusinessCreated={handleBusinessCreated}
        user={user}
      />
    </div>
  );
};

export default AccountPage;