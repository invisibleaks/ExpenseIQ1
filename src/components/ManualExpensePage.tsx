import React, { useState, useEffect } from 'react';
import { ArrowLeft, DollarSign, Calendar, Building, FileText, AlertCircle, CheckCircle, Loader2, Tag, CreditCard, Receipt, Brain, Sparkles, Edit3 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { aiCategorizationService, AICategorizationResult, ExpenseContext } from '../lib/ai-categorization';

interface ManualExpensePageProps {
  onBack: () => void;
  activeWorkspaceId: string | null;
  currentUser: { id: string } | null;
  onExpenseAdded?: () => void;
}

interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  type: string;
}

interface FormData {
  date: string;
  merchant: string;
  amount: string;
  description: string;
  categoryId: string;
  customCategory: string;
  paymentMethodId: string;
  notes: string;
  isReimbursable: boolean;
}

interface FormErrors {
  merchant?: string;
  amount?: string;
  description?: string;
  categoryId?: string;
  customCategory?: string;
  submit?: string;
}

const ManualExpensePage: React.FC<ManualExpensePageProps> = ({
  onBack,
  activeWorkspaceId,
  currentUser,
  onExpenseAdded
}) => {
  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split('T')[0], // Today's date
    merchant: '',
    amount: '',
    description: '',
    categoryId: '',
    customCategory: '',
    paymentMethodId: '',
    notes: '',
    isReimbursable: false
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isAIAvailable, setIsAIAvailable] = useState(false);
  const [isAICategorizing, setIsAICategorizing] = useState(false);
  const [aiResult, setAiResult] = useState<AICategorizationResult | null>(null);
  const [showAIBadge, setShowAIBadge] = useState(false);

  // Check if form should be disabled
  const isFormDisabled = !activeWorkspaceId || !currentUser;
  
  // Check if "Other" category is selected
  const isOtherCategorySelected = formData.categoryId && categories.find(cat => cat.id === formData.categoryId)?.name === 'Other';
  
  // Check if AI categorization is available
  useEffect(() => {
    const isAvailable = aiCategorizationService.isAvailable();
    const serviceInfo = aiCategorizationService.getServiceInfo();
    console.log('🤖 AI Categorization Service Status:', serviceInfo);
    setIsAIAvailable(isAvailable);
  }, []);

  // Debug: Check Supabase configuration
  React.useEffect(() => {
    console.log('ManualExpensePage Debug Info:', {
      activeWorkspaceId,
      currentUser: currentUser?.id,
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing',
      supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
      openaiKey: import.meta.env.VITE_OPENAI_API_KEY ? 'Set' : 'Missing'
    });
  }, [activeWorkspaceId, currentUser]);

  // Fetch categories and payment methods when workspace changes
  useEffect(() => {
    if (activeWorkspaceId) {
      fetchCategoriesAndPaymentMethods();
    }
  }, [activeWorkspaceId]);

  // Auto-categorize when merchant, amount, and description are filled
  useEffect(() => {
    console.log('🔍 Auto-categorization trigger check:', {
      isAIAvailable,
      merchant: formData.merchant.trim(),
      amount: formData.amount.trim(),
      description: formData.description.trim(),
      isAICategorizing,
      shouldTrigger: isAIAvailable && formData.merchant.trim() && formData.amount.trim() && formData.description.trim() && !isAICategorizing
    });

    if (isAIAvailable && formData.merchant.trim() && formData.amount.trim() && formData.description.trim() && !isAICategorizing) {
      console.log('🚀 Triggering AI categorization in 1 second...');
      // Debounce the AI categorization to avoid too many API calls
      const timer = setTimeout(() => {
        autoCategorizeExpense();
      }, 1000); // Wait 1 second after user stops typing

      return () => clearTimeout(timer);
    }
  }, [formData.merchant, formData.amount, formData.description, isAIAvailable, isAICategorizing]);

  const fetchCategoriesAndPaymentMethods = async () => {
    if (!activeWorkspaceId) return;
    
    setIsLoadingData(true);
    try {
      console.log('🔍 Starting to fetch categories for workspace:', activeWorkspaceId);
      
      // Try to fetch categories from the new global categories system first
      console.log('📡 Attempting to fetch global categories...');
      const { data: globalCategoriesData, error: globalCategoriesError } = await supabase
        .from('workspace_category_mappings')
        .select(`
          id,
          global_categories!inner(
            id,
            name,
            description,
            color,
            icon
          )
        `)
        .eq('workspace_id', activeWorkspaceId)
        .eq('is_active', true)
        .order('name', { foreignTable: 'global_categories' });

      console.log('📊 Global categories response:', { data: globalCategoriesData, error: globalCategoriesError });

      if (!globalCategoriesError && globalCategoriesData && globalCategoriesData.length > 0) {
        // FIXED: Use the global_categories.id instead of the mapping id
        const transformedCategories = globalCategoriesData.map((item: any) => ({
          id: item.global_categories.id, // Use the actual category ID, not the mapping ID
          name: item.global_categories.name,
          description: item.global_categories.description,
          color: item.global_categories.color,
          icon: item.global_categories.icon
        }));
        
        setCategories(transformedCategories);
        console.log('✅ Successfully fetched global categories:', transformedCategories.length, transformedCategories);
      } else {
        console.log('⚠️ Global categories failed or empty, falling back to old method');
        console.log('❌ Error details:', globalCategoriesError);
        console.log('📊 Data received:', globalCategoriesData);
        
        // FIXED: Use global_categories table directly instead of old categories table
        console.log('📡 Attempting to fetch global categories directly...');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('global_categories')
          .select('id, name, description, color, icon')
          .order('name');
        
        if (fallbackError) {
          console.error('❌ Direct global categories fetch failed:', fallbackError);
          // Set empty categories array as last resort
          setCategories([]);
        } else {
          setCategories(fallbackData || []);
          console.log('✅ Fetched global categories directly:', fallbackData?.length || 0);
        }
      }

      // Fetch payment methods (unchanged)
      const { data: paymentMethodsData, error: paymentMethodsError } = await supabase
        .from('payment_methods')
        .select('id, name, description, type')
        .eq('workspace_id', activeWorkspaceId)
        .order('name');

      if (paymentMethodsError) {
        console.error('Error fetching payment methods', paymentMethodsError);
      } else {
        setPaymentMethods(paymentMethodsData || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Auto-categorize expense using AI
  const autoCategorizeExpense = async () => {
    if (!formData.merchant.trim() || !formData.amount.trim() || !formData.description.trim() || !isAIAvailable) return;

    setIsAICategorizing(true);
    try {
      const expense: ExpenseContext = {
        merchant: formData.merchant,
        amount: parseFloat(formData.amount) || 0,
        currency: 'INR',
        date: formData.date,
        description: formData.description,
        notes: formData.notes
      };

      console.log('🚀 Starting AI categorization for expense:', expense);
      const result = await aiCategorizationService.categorizeExpense(expense);
      console.log('🤖 AI categorization result:', result);
      setAiResult(result);
      
      // Auto-apply AI suggestions
      applyAISuggestions(result);
      
      // Show AI badge briefly
      setShowAIBadge(true);
      setTimeout(() => setShowAIBadge(false), 3000);

    } catch (error) {
      console.error('AI categorization failed:', error);
      // Silently fail - user can still categorize manually
    } finally {
      setIsAICategorizing(false);
    }
  };

  // Apply AI suggestions to the form
  const applyAISuggestions = (result: AICategorizationResult) => {
    console.log('🤖 Applying AI suggestions:', result);
    console.log('📊 Available categories:', categories);
    console.log('💳 Available payment methods:', paymentMethods);
    
    // Enhanced category matching with multiple strategies
    let matchedCategory = null;
    
    // Strategy 1: Exact case-insensitive match
    matchedCategory = categories.find(cat => 
      cat.name.toLowerCase() === result.category.toLowerCase()
    );
    
    // Strategy 2: Partial match (if exact fails)
    if (!matchedCategory) {
      matchedCategory = categories.find(cat => 
        cat.name.toLowerCase().includes(result.category.toLowerCase()) ||
        result.category.toLowerCase().includes(cat.name.toLowerCase())
      );
    }
    
    // Strategy 3: Fuzzy matching for common variations
    if (!matchedCategory) {
      const categoryVariations: Record<string, string[]> = {
        'Office Supplies': ['office supplies', 'office', 'supplies', 'stationary', 'stationery', 'printer', 'desk', 'chair', 'mugs', 'software'],
        'Food & Dining': ['food & dining', 'food', 'dining', 'meals', 'restaurant', 'lunch', 'coffee', 'cafe', 'starbucks'],
        'Transportation': ['transportation', 'transport', 'travel', 'commute', 'uber', 'lyft', 'taxi', 'gas'],
        'Utilities': ['utilities', 'utility', 'bills', 'services', 'water', 'electric', 'internet', 'water bill'],
        'Entertainment': ['entertainment', 'entertain', 'leisure', 'recreation'],
        'Healthcare': ['healthcare', 'health', 'medical', 'doctor'],
        'Travel': ['travel', 'trip', 'vacation', 'business travel'],
        'Shopping': ['shopping', 'retail', 'purchase', 'buy', 'amazon', 'walmart', 'target'],
        'Education': ['education', 'learning', 'training', 'course'],
        'Insurance': ['insurance', 'insure', 'coverage', 'policy'],
        'Taxes': ['taxes', 'tax', 'taxation', 'irs'],
        'Other': ['other', 'miscellaneous', 'misc', 'general', 'paid ads']
      };
      
      const variations = categoryVariations[result.category] || [];
      matchedCategory = categories.find(cat => 
        variations.some(variation => 
          cat.name.toLowerCase().includes(variation.toLowerCase())
        )
      );
    }
    
    if (matchedCategory) {
      console.log('✅ Found matching category:', matchedCategory);
      setFormData(prev => ({
        ...prev,
        categoryId: matchedCategory.id,
        customCategory: ''
      }));
    } else {
      console.log('❌ No category match found for:', result.category);
      console.log('🔍 Available category names:', categories.map(c => c.name));
      
      // Set to "Other" category if available
      const otherCategory = categories.find(cat => 
        cat.name.toLowerCase() === 'other'
      );
      if (otherCategory) {
        setFormData(prev => ({
          ...prev,
          categoryId: otherCategory.id,
          customCategory: result.category // Store AI suggestion as custom category
        }));
      }
    }

    // Find the payment method ID that matches the AI suggestion
    if (result.suggestedPaymentMethod) {
      const suggestedPaymentMethod = paymentMethods.find(pm => 
        pm.name.toLowerCase() === result.suggestedPaymentMethod!.toLowerCase()
      );
      if (suggestedPaymentMethod) {
        console.log('✅ Found matching payment method:', suggestedPaymentMethod);
        setFormData(prev => ({
          ...prev,
          paymentMethodId: suggestedPaymentMethod.id
        }));
      } else {
        console.log('❌ No payment method match found for:', result.suggestedPaymentMethod);
      }
    }
  };

  // Validation functions
  const validateMerchant = (merchant: string): string | undefined => {
    if (!merchant.trim()) return 'Merchant name is required';
    if (merchant.trim().length < 2) return 'Merchant name must be at least 2 characters';
    return undefined;
  };

  const validateAmount = (amount: string): string | undefined => {
    if (!amount.trim()) return 'Amount is required';
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return 'Please enter a valid number';
    if (numAmount <= 0) return 'Amount must be greater than 0';
    if (numAmount > 999999.99) return 'Amount is too large';
    return undefined;
  };

  const validateDescription = (description: string): string | undefined => {
    if (!description.trim()) return 'Description is required';
    if (description.trim().length < 5) return 'Description must be at least 5 characters';
    if (description.trim().length > 500) return 'Description must be less than 500 characters';
    return undefined;
  };

  const validateCategory = (categoryId: string): string | undefined => {
    if (!categoryId) return 'Category is required';
    return undefined;
  };

  const validateCustomCategory = (customCategory: string): string | undefined => {
    if (isOtherCategorySelected && !customCategory.trim()) {
      return 'Please specify what type of expense this is';
    }
    if (isOtherCategorySelected && customCategory.trim().length < 2) {
      return 'Custom category must be at least 2 characters';
    }
    return undefined;
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // Clear custom category when a non-Other category is selected
      if (name === 'categoryId') {
        const selectedCategory = categories.find(cat => cat.id === value);
        if (selectedCategory?.name !== 'Other') {
          setFormData(prev => ({ ...prev, customCategory: '' }));
        }
      }

      // Clear AI result when user manually changes category or payment method
      if (name === 'categoryId' || name === 'paymentMethodId') {
        setAiResult(null);
      }
    }

    // Clear submit error when user starts typing
    if (errors.submit) {
      setErrors(prev => ({ ...prev, submit: undefined }));
    }

          // Real-time validation for touched fields
      if (touched[name]) {
        let error: string | undefined;
        if (name === 'merchant') error = validateMerchant(value);
        if (name === 'amount') error = validateAmount(value);
        if (name === 'description') error = validateDescription(value);
        if (name === 'categoryId') error = validateCategory(value);
        if (name === 'customCategory') error = validateCustomCategory(value);
        setErrors(prev => ({ ...prev, [name]: error }));
      }
  };

  // Handle field blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    let error: string | undefined;
    if (name === 'merchant') error = validateMerchant(value);
    if (name === 'amount') error = validateAmount(value);
    if (name === 'description') error = validateDescription(value);
    if (name === 'categoryId') error = validateCategory(value);
    if (name === 'customCategory') error = validateCustomCategory(value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  // Clear form
  const clearForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      merchant: '',
      amount: '',
      description: '',
      categoryId: '',
      customCategory: '',
      paymentMethodId: '',
      notes: '',
      isReimbursable: false
    });
    setErrors({});
    setTouched({});
    setAiResult(null);
  };

  // Show success toast
  const showToast = () => {
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isFormDisabled) return;

    // Mark all required fields as touched
    setTouched({ merchant: true, amount: true, categoryId: true, customCategory: true });

    // Validate all fields
    const merchantError = validateMerchant(formData.merchant);
    const amountError = validateAmount(formData.amount);
    const categoryError = validateCategory(formData.categoryId);
    const customCategoryError = validateCustomCategory(formData.customCategory);

    setErrors({
      merchant: merchantError,
      amount: amountError,
      categoryId: categoryError,
      customCategory: customCategoryError
    });

    // Check if there are validation errors
    if (merchantError || amountError || categoryError || customCategoryError) return;

    setIsSubmitting(true);

    try {
      // Debug: Log the data being inserted
      const insertData = {
        workspace_id: activeWorkspaceId,
        user_id: currentUser!.id,
        source: 'manual', // Default source for manual entry
        status: 'unreviewed',
        txn_date: formData.date,
        merchant: formData.merchant.trim(),
        amount: parseFloat(formData.amount),
        description: formData.description.trim(),
        currency: 'INR', // Default currency
        global_category_id: formData.categoryId || null, // FIXED: Use global_category_id instead of category_id
        category_confidence: aiResult?.confidence || null,
        category_source: aiResult ? 'ai' : 'manual',
        payment_method_id: formData.paymentMethodId || null,
        payment_method_source: aiResult ? 'ai' : 'manual',
        payment_method_confidence: aiResult?.confidence || null,
        notes: formData.notes.trim() || null,
        is_reimbursable: formData.isReimbursable
      };
      
      console.log('🔍 Debug: Form data before submission:', formData);
      console.log('🔍 Debug: AI result:', aiResult);
      console.log('🔍 Debug: Attempting to insert expense:', insertData);
      console.log('🔍 Debug: Category ID being saved:', formData.categoryId);
      console.log('🔍 Debug: Available categories:', categories);
      
      // Insert into Supabase
      const { error } = await supabase
        .from('expenses')
        .insert(insertData);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Success
      showToast();
      clearForm();
      
      // Notify parent component that expense was added
      if (onExpenseAdded) {
        onExpenseAdded();
      }

    } catch (error: any) {
      console.error('Error saving expense:', error);
      
      // Provide more specific error messages
      let errorMessage = "Couldn't save. Please try again.";
      
      if (error?.message) {
        if (error.message.includes('RLS')) {
          errorMessage = "Access denied. Please check your workspace permissions.";
        } else if (error.message.includes('foreign key')) {
          errorMessage = "Invalid workspace or user. Please refresh and try again.";
        } else if (error.message.includes('type')) {
          errorMessage = "Invalid data format. Please check your entries.";
        } else {
          errorMessage = error.message;
        }
      }
      
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get field status for styling
  const getFieldStatus = (fieldName: string) => {
    if (!touched[fieldName]) return 'default';
    if (errors[fieldName as keyof FormErrors]) return 'error';
    if (formData[fieldName as keyof FormData]) return 'success';
    return 'default';
  };

  return (
    <div className="min-h-screen bg-brand-light-beige">
      {/* Header */}
      <header className="bg-brand-darker-teal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Back Button */}
            <button 
              onClick={onBack}
              className="flex items-center space-x-2 text-brand-muted-teal hover:text-brand-warm-beige transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Dashboard</span>
            </button>

            {/* Title */}
            <h1 className="text-xl font-bold text-brand-text-light">Add Expense</h1>

            {/* Spacer */}
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Disabled Banner */}
          {isFormDisabled && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <p className="text-sm text-yellow-700 font-medium">
                  Select a business to add expenses.
                </p>
              </div>
            </div>
          )}

          {/* Loading Data Banner */}
          {isLoadingData && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <p className="text-sm text-blue-700 font-medium">
                  Loading categories and payment methods...
                </p>
              </div>
            </div>
          )}

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-brand-soft-gray/20 p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-brand-dark-teal/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <DollarSign className="w-6 h-6 text-brand-dark-teal" />
              </div>
              <h2 className="text-xl font-bold text-brand-text-dark">Manual Entry</h2>
              <p className="text-sm text-brand-text-muted">Add expense details manually</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Date Field */}
              <div>
                <label htmlFor="date" className="block text-sm font-semibold text-brand-text-dark mb-2">
                  Date <span className="text-brand-muted-teal">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-brand-soft-gray" />
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    disabled={isFormDisabled || isSubmitting}
                    className="w-full pl-10 pr-4 py-3 border border-brand-soft-gray/50 rounded-xl focus:ring-2 focus:ring-brand-dark-teal focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    required
                  />
                </div>
              </div>

              {/* Merchant Field */}
              <div>
                <label htmlFor="merchant" className="block text-sm font-semibold text-brand-text-dark mb-2">
                  Merchant <span className="text-brand-muted-teal">*</span>
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-brand-soft-gray" />
                  <input
                    type="text"
                    id="merchant"
                    name="merchant"
                    value={formData.merchant}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    disabled={isFormDisabled || isSubmitting}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-brand-dark-teal focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                      getFieldStatus('merchant') === 'error' 
                        ? 'border-red-500 bg-red-50' 
                        : getFieldStatus('merchant') === 'success'
                        ? 'border-green-500 bg-green-50'
                        : 'border-brand-soft-gray/50 hover:border-brand-muted-teal'
                    }`}
                    placeholder="Enter merchant name"
                    required
                  />
                </div>
                {errors.merchant && touched.merchant && (
                  <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.merchant}</span>
                  </p>
                )}
              </div>

              {/* Amount Field */}
              <div>
                <label htmlFor="amount" className="block text-sm font-semibold text-brand-text-dark mb-2">
                  Amount <span className="text-brand-muted-teal">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-brand-soft-gray" />
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    disabled={isFormDisabled || isSubmitting}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-brand-dark-teal focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                      getFieldStatus('amount') === 'error' 
                        ? 'border-red-500 bg-red-50' 
                        : getFieldStatus('amount') === 'success'
                        ? 'border-green-500 bg-green-50'
                        : 'border-brand-soft-gray/50 hover:border-brand-muted-teal'
                    }`}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    max="999999.99"
                    required
                  />
                </div>
                {errors.amount && touched.amount && (
                  <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.amount}</span>
                  </p>
                )}
              </div>

              {/* Description Field */}
              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-brand-text-dark mb-2">
                  Description <span className="text-brand-muted-teal">*</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-brand-soft-gray" />
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    disabled={isFormDisabled || isSubmitting}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-brand-dark-teal focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all resize-none ${
                      getFieldStatus('description') === 'error' 
                        ? 'border-red-500 bg-red-50' 
                        : getFieldStatus('description') === 'success'
                        ? 'border-green-500 bg-green-50'
                        : 'border-brand-soft-gray/50 hover:border-brand-muted-teal'
                    }`}
                    placeholder="Describe what this expense was for (e.g., 'Ride from airport to downtown', 'Monthly subscription for design software')"
                    rows={3}
                    required
                  />
                </div>
                {errors.description && touched.description && (
                  <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.description}</span>
                  </p>
                )}
              </div>

              {/* AI Categorization Status */}
              {isAIAvailable && (isAICategorizing || aiResult) && (
                <div className={`p-4 rounded-xl border transition-all duration-300 ${
                  isAICategorizing 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    {isAICategorizing ? (
                      <>
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                        <div>
                          <p className="text-sm font-medium text-blue-800">AI is categorizing your expense...</p>
                          <p className="text-xs text-blue-600">Analyzing merchant, amount, and description</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Brain className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-green-800">AI Categorization Complete</p>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-green-600">
                                {(aiResult?.confidence || 0) * 100}% confidence
                              </span>
                              <button
                                type="button"
                                onClick={() => setAiResult(null)}
                                className="text-xs text-green-600 hover:text-green-800 underline"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-green-600">
                            Category: {aiResult?.category} • Payment: {aiResult?.suggestedPaymentMethod}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}



              {/* Category Field */}
              <div>
                <label htmlFor="categoryId" className="block text-sm font-semibold text-brand-text-dark mb-2">
                  Category <span className="text-brand-muted-teal">*</span>
                  {aiResult && (
                    <span className="text-xs text-green-600 ml-2">(AI suggested: {aiResult.category})</span>
                  )}
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-brand-soft-gray" />
                  <select
                    id="categoryId"
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    disabled={isFormDisabled || isSubmitting || isLoadingData}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-brand-dark-teal focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                      getFieldStatus('categoryId') === 'error' 
                        ? 'border-red-500 bg-red-50' 
                        : getFieldStatus('categoryId') === 'success'
                        ? 'border-green-500 bg-green-50'
                        : 'border-brand-soft-gray/50 hover:border-brand-muted-teal'
                    }`}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.categoryId && touched.categoryId && (
                  <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.categoryId}</span>
                  </p>
                )}
                {categories.length === 0 && !isLoadingData && (
                  <p className="mt-2 text-sm text-yellow-600 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>No categories found. Please create categories first.</span>
                  </p>
                )}
              </div>

              {/* Custom Category Field (when "Other" is selected) */}
              {isOtherCategorySelected && (
                <div>
                  <label htmlFor="customCategory" className="block text-sm font-semibold text-brand-text-dark mb-2">
                    Specify Category <span className="text-brand-muted-teal">*</span>
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-brand-soft-gray" />
                    <input
                      type="text"
                      id="customCategory"
                      name="customCategory"
                      value={formData.customCategory}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      disabled={isFormDisabled || isSubmitting}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-brand-dark-teal focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                        getFieldStatus('customCategory') === 'error' 
                          ? 'border-red-500 bg-red-50' 
                          : getFieldStatus('customCategory') === 'success'
                          ? 'border-green-500 bg-green-50'
                          : 'border-brand-soft-gray/50 hover:border-brand-muted-teal'
                      }`}
                      placeholder="e.g., Gym Membership, Subscription Service, etc."
                      required
                    />
                  </div>
                  {errors.customCategory && touched.customCategory && (
                    <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.customCategory}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Payment Method Field */}
              <div>
                <label htmlFor="paymentMethodId" className="block text-sm font-semibold text-brand-text-dark mb-2">
                  Payment Method <span className="text-brand-soft-gray">(optional)</span>
                  {aiResult?.suggestedPaymentMethod && (
                    <span className="text-xs text-green-600 ml-2">(AI suggested: {aiResult.suggestedPaymentMethod})</span>
                  )}
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-brand-soft-gray" />
                  <select
                    id="paymentMethodId"
                    name="paymentMethodId"
                    value={formData.paymentMethodId}
                    onChange={handleInputChange}
                    disabled={isFormDisabled || isSubmitting || isLoadingData}
                    className="w-full pl-10 pr-4 py-3 border border-brand-soft-gray/50 rounded-xl focus:ring-2 focus:ring-brand-dark-teal focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <option value="">Select a payment method (optional)</option>
                    {paymentMethods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.name}
                      </option>
                    ))}
                  </select>
                </div>
                {paymentMethods.length === 0 && !isLoadingData && (
                  <p className="mt-2 text-sm text-yellow-600 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>No payment methods found. You can still add expenses without selecting one.</span>
                  </p>
                )}
              </div>

              {/* Reimbursable Checkbox */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isReimbursable"
                  name="isReimbursable"
                  checked={formData.isReimbursable}
                  onChange={handleInputChange}
                  disabled={isFormDisabled || isSubmitting}
                  className="w-4 h-4 text-brand-dark-teal border-brand-soft-gray rounded focus:ring-brand-dark-teal focus:ring-2 disabled:opacity-50"
                />
                <label htmlFor="isReimbursable" className="text-sm font-medium text-brand-text-dark">
                  This expense is reimbursable
                </label>
              </div>

              {/* Notes Field */}
              <div>
                <label htmlFor="notes" className="block text-sm font-semibold text-brand-text-dark mb-2">
                  Notes <span className="text-brand-soft-gray">(optional)</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-brand-soft-gray" />
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    disabled={isFormDisabled || isSubmitting}
                    className="w-full pl-10 pr-4 py-3 border border-brand-soft-gray/50 rounded-xl focus:ring-2 focus:ring-brand-dark-teal focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all resize-none"
                    placeholder="Add any additional notes..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.submit}</span>
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isFormDisabled || isSubmitting || !!errors.merchant || !!errors.amount || !!errors.categoryId || (isOtherCategorySelected && !!errors.customCategory) || isLoadingData}
                className="w-full bg-brand-dark-teal text-white py-3 px-6 rounded-xl font-semibold hover:bg-brand-dark-teal/90 focus:ring-2 focus:ring-brand-dark-teal focus:ring-offset-2 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Add Expense</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center space-x-1 z-50 animate-in slide-in-from-bottom-2">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Expense added successfully!</span>
        </div>
      )}

      {/* AI Badge (briefly shown after categorization) */}
      {showAIBadge && (
        <div className="fixed bottom-4 left-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl shadow-lg z-50 animate-in slide-in-from-bottom-2">
          <div className="flex items-center space-x-2">
            <Brain className="w-4 h-4" />
            <Sparkles className="w-3 h-3" />
            <span className="text-sm font-medium">AI categorized your expense!</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualExpensePage;