import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import ChatMessageList from './ChatMessageList';
import ChatInputArea from './ChatInputArea';
import { ChatMessageData } from './ChatMessage';
import { supabase } from '../lib/supabase';
import { conversationalAIService, ConversationContext, ConversationResponse } from '../lib/conversational-ai';

// Reuse interfaces from AddExpenseModal
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

interface ConversationalExpenseChatProps {
  isOpen: boolean;
  onClose: () => void;
  activeWorkspaceId: string | null;
  currentUser: { id: string } | null;
  onExpenseAdded?: () => void;
}

// Enhanced text parsing utilities
class ExpenseParser {
  static parseDate(text: string): string | null {
    const today = new Date();
    const textLower = text.toLowerCase();
    
    // Handle relative dates
    if (textLower.includes('yesterday')) {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      return yesterday.toISOString().split('T')[0];
    }
    
    if (textLower.includes('today')) {
      return today.toISOString().split('T')[0];
    }
    
    // Handle "X days ago"
    const daysAgoMatch = textLower.match(/(\d+)\s*days?\s*ago/);
    if (daysAgoMatch) {
      const daysAgo = parseInt(daysAgoMatch[1]);
      const date = new Date(today);
      date.setDate(today.getDate() - daysAgo);
      return date.toISOString().split('T')[0];
    }
    
    // Handle "last week"
    if (textLower.includes('last week')) {
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);
      return lastWeek.toISOString().split('T')[0];
    }
    
    // Handle specific date formats like "29th Sep 2025", "Sep 29 2025", "29/09/2025"
    const datePatterns = [
      // "29th Sep 2025", "29 Sep 2025"
      /(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*(\d{4})?/i,
      // "Sep 29 2025", "September 29 2025"
      /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?\s*(\d{4})?/i,
      // "29/09/2025", "29-09-2025"
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
      // "2025-09-29" (ISO format)
      /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/
    ];
    
    const monthNames = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };
    
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        let day, month, year;
        
        if (pattern.source.includes('jan|feb|mar')) {
          // Month name patterns
          if (match[1] && isNaN(parseInt(match[1]))) {
            // "Sep 29 2025" format
            month = monthNames[match[1].toLowerCase().slice(0, 3) as keyof typeof monthNames];
            day = parseInt(match[2]);
            year = match[3] ? parseInt(match[3]) : today.getFullYear();
          } else {
            // "29th Sep 2025" format
            day = parseInt(match[1]);
            month = monthNames[match[2].toLowerCase().slice(0, 3) as keyof typeof monthNames];
            year = match[3] ? parseInt(match[3]) : today.getFullYear();
          }
        } else if (pattern.source.includes('(\\d{4})[')) {
          // ISO format "2025-09-29"
          year = parseInt(match[1]);
          month = parseInt(match[2]) - 1; // Month is 0-indexed
          day = parseInt(match[3]);
        } else {
          // "29/09/2025" format
          day = parseInt(match[1]);
          month = parseInt(match[2]) - 1; // Month is 0-indexed
          year = parseInt(match[3]);
        }
        
        if (day && month !== undefined && year) {
          const parsedDate = new Date(year, month, day);
          if (!isNaN(parsedDate.getTime())) {
            return parsedDate.toISOString().split('T')[0];
          }
        }
      }
    }
    
    return null;
  }

  static detectFieldEdit(text: string): { field: string; value?: string } | null {
    const textLower = text.toLowerCase();
    
    // Detect field editing intentions
    if (textLower.includes('change') || textLower.includes('edit') || textLower.includes('update')) {
      if (textLower.includes('date')) {
        const dateValue = ExpenseParser.parseDate(text);
        return { field: 'date', value: dateValue || undefined };
      }
      if (textLower.includes('amount') || textLower.includes('price') || textLower.includes('cost')) {
        const amountValue = ExpenseParser.extractAmount(text);
        return { field: 'amount', value: amountValue || undefined };
      }
      if (textLower.includes('merchant') || textLower.includes('store') || textLower.includes('shop')) {
        const merchantValue = ExpenseParser.extractMerchant(text);
        return { field: 'merchant', value: merchantValue || undefined };
      }
      if (textLower.includes('description') || textLower.includes('item') || textLower.includes('product')) {
        const descriptionValue = ExpenseParser.extractDescription(text);
        return { field: 'description', value: descriptionValue || undefined };
      }
      if (textLower.includes('category')) {
        return { field: 'category' };
      }
    }
    
    // Direct field updates without "change" keyword
    if (textLower.match(/^(date|amount|merchant|description|category):/)) {
      const [field, ...valueParts] = text.split(':');
      const value = valueParts.join(':').trim();
      return { field: field.toLowerCase(), value };
    }
    
    return null;
  }

  static extractAmount(text: string): string | null {
    // Look for patterns like $12, $12.50, USD 1000, 12.50, etc.
    const amountPatterns = [
      /\$(\d+(?:,\d{3})*(?:\.\d{2})?)/,  // $1000, $1,000, $1000.50
      /USD\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,  // USD 1000, USD 1,000
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:dollars?|bucks?|USD|\$)/i,  // 1000 dollars, 1000 USD
      /(?:cost|paid|spent|was)\s*(?:\$|USD)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,  // cost $1000, paid USD 1000
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:for|on)/i  // 1000 for
    ];
    
    for (const pattern of amountPatterns) {
      const match = text.match(pattern);
      if (match) {
        // Remove commas from the amount
        return match[1].replace(/,/g, '');
      }
    }
    return null;
  }

  static extractMerchant(text: string): string | null {
    // Look for patterns like "at McDonald's", "from Amazon", etc.
    const merchantPatterns = [
      /(?:at|from|to)\s+([A-Za-z][A-Za-z\s&'.-]+?)(?:\s+for|\s+\$|\s*$)/i,
      /([A-Za-z][A-Za-z\s&'.-]+?)(?:\s+for\s+\$|\s+cost)/i,
      /bought.*?(?:at|from)\s+([A-Za-z][A-Za-z\s&'.-]+)/i
    ];
    
    for (const pattern of merchantPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    return null;
  }

  static extractDescription(text: string): string | null {
    // Look for what was bought/paid for
    const descriptionPatterns = [
      /(?:bought|purchased|paid for|got)\s+([^$]+?)(?:\s+(?:at|from|for\s*\$))/i,
      /(\w+(?:\s+\w+)*)\s+(?:at|from)/i,
      /for\s+([^$]+?)(?:\s+at|\s*$)/i
    ];
    
    for (const pattern of descriptionPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    return null;
  }

  static async suggestCategoryWithAI(
    merchant: string, 
    description: string, 
    amount: number,
    categories: Category[]
  ): Promise<{ categoryId: string; confidence: number } | null> {
    try {
      // Use the existing AI categorization service
      const aiCategorizationService = await import('../lib/ai-categorization');
      
      if (aiCategorizationService.aiCategorizationService.isAvailable()) {
        const expenseContext = {
          merchant,
          amount,
          description,
          date: new Date().toISOString().split('T')[0],
          currency: 'INR'
        };
        
        const aiResult = await aiCategorizationService.aiCategorizationService.categorizeExpense(expenseContext);
        
        if (aiResult && !('error' in aiResult) && aiResult.category) {
          // Find the category ID that matches the AI suggestion
          const suggestedCategory = categories.find(cat => cat.name === aiResult.category);
          if (suggestedCategory) {
            return {
              categoryId: suggestedCategory.id,
              confidence: aiResult.confidence || 0.8
            };
          }
        }
      }
    } catch (error) {
      console.error('AI categorization failed:', error);
    }
    
    return null;
  }
}

const ConversationalExpenseChat: React.FC<ConversationalExpenseChatProps> = ({
  isOpen,
  onClose,
  activeWorkspaceId,
  currentUser,
  onExpenseAdded
}) => {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expenseData, setExpenseData] = useState<Partial<FormData>>({
    date: new Date().toISOString().split('T')[0],
    isReimbursable: false
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [conversationStep, setConversationStep] = useState<'initial' | 'collecting' | 'confirming' | 'editing' | 'complete'>('initial');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [conversationContext, setConversationContext] = useState<ConversationContext | null>(null);
  
  const messageIdCounter = useRef(0);
  const processingRef = useRef<Set<string>>(new Set()); // Track messages being processed

  // Load categories and payment methods
  useEffect(() => {
    if (activeWorkspaceId && currentUser && isOpen) {
      loadFormData();
    }
  }, [activeWorkspaceId, currentUser, isOpen]);

  // Initialize conversation context when categories are loaded
  useEffect(() => {
    if (categories.length > 0 && !conversationContext) {
      const context = conversationalAIService.initializeConversation(categories);
      setConversationContext(context);
      
      // Add welcome message
      if (conversationalAIService.isAvailable()) {
        addSystemMessage("Hi! I'm your AI expense assistant. Just tell me about your expense in natural language - like 'I bought lunch at McDonald's for $12 yesterday' or 'Paid USD 1000 for office supplies last week'.");
      } else {
        addSystemMessage("Hi! I'll help you add an expense. Just tell me what you spent money on - like 'I bought lunch at McDonald's for $12' or 'Paid $50 for office supplies'.");
      }
    }
  }, [categories, conversationContext]);

  const loadFormData = async () => {
    try {
      // Fetch categories (same logic as AddExpenseModal)
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

      let categories: Category[] = [];
      if (!globalCategoriesError && globalCategoriesData && globalCategoriesData.length > 0) {
        categories = globalCategoriesData.map((item: any) => ({
          id: item.global_categories.id,
          name: item.global_categories.name,
          description: item.global_categories.description,
          color: item.global_categories.color,
          icon: item.global_categories.icon
        }));
      } else {
        // Fallback to global categories
        const { data: fallbackData } = await supabase
          .from('global_categories')
          .select('id, name, description, color, icon')
          .order('name');
        categories = fallbackData || [];
      }

      // Fetch payment methods
      const { data: paymentMethodsData } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('workspace_id', activeWorkspaceId)
        .order('name');

      setCategories(categories);
      setPaymentMethods(paymentMethodsData || []);
    } catch (error) {
      console.error('Error loading form data:', error);
    }
  };

  const generateMessageId = () => {
    return `msg_${++messageIdCounter.current}`;
  };

  const addUserMessage = (content: string) => {
    const message: ChatMessageData = {
      id: generateMessageId(),
      type: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => {
      // Check if this exact message already exists (prevent duplicates)
      const isDuplicate = prev.some(msg => 
        msg.type === 'user' && 
        msg.content === content && 
        Math.abs(msg.timestamp.getTime() - message.timestamp.getTime()) < 5000 // Within 5 seconds
      );
      
      if (isDuplicate) {
        console.log('🚫 Duplicate user message detected, skipping:', content);
        return prev;
      }
      
      return [...prev, message];
    });
  };

  const addSystemMessage = (content: string) => {
    const message: ChatMessageData = {
      id: generateMessageId(),
      type: 'system',
      content,
      timestamp: new Date()
    };
    setMessages(prev => {
      // Check if this exact message already exists (prevent duplicates)
      const isDuplicate = prev.some(msg => 
        msg.type === 'system' && 
        msg.content === content && 
        Math.abs(msg.timestamp.getTime() - message.timestamp.getTime()) < 5000 // Within 5 seconds
      );
      
      if (isDuplicate) {
        console.log('🚫 Duplicate system message detected, skipping:', content);
        return prev;
      }
      
      return [...prev, message];
    });
  };

  const handleSendMessage = async (message: string) => {
    console.log('🚀 handleSendMessage called with:', message);
    
    // More robust duplicate prevention
    const messageKey = message.trim().toLowerCase();
    const now = Date.now();
    
    // Check if we're already processing this exact message
    if (processingRef.current.has(messageKey)) {
      console.log('⚠️ Message already being processed, skipping duplicate');
      return;
    }
    
    // Check if we recently processed this exact message (within last 10 seconds)
    const recentMessages = Array.from(processingRef.current).filter(key => 
      key.startsWith(messageKey) && 
      (now - parseInt(key.split('_').pop() || '0')) < 10000
    );
    
    if (recentMessages.length > 0) {
      console.log('⚠️ Recently processed similar message, skipping duplicate');
      return;
    }
    
    const uniqueKey = `${messageKey}_${now}`;
    processingRef.current.add(uniqueKey);
    
    // Add user message first
    addUserMessage(message);
    setIsProcessing(true);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      console.log('📝 About to call processUserMessage...');
      await processUserMessage(message);
      console.log('✅ processUserMessage completed');
    } catch (error) {
      console.error('❌ Error processing message:', error);
      addSystemMessage("Sorry, I had trouble processing that. Could you try again?");
    } finally {
      setIsProcessing(false);
      processingRef.current.delete(uniqueKey); // Clean up
      
      // Clean up old entries (older than 30 seconds)
      const cutoff = now - 30000;
      const keysToDelete = Array.from(processingRef.current).filter(key => {
        const timestamp = parseInt(key.split('_').pop() || '0');
        return timestamp < cutoff;
      });
      keysToDelete.forEach(key => processingRef.current.delete(key));
    }
  };

  const processUserMessage = async (message: string) => {
    // Initialize conversation context immediately if it's missing
    let currentContext = conversationContext;
    if (!currentContext) {
      console.log('Initializing conversation context...');
      currentContext = conversationalAIService.initializeConversation(categories);
      setConversationContext(currentContext);
    }

    try {
      // Use conversational AI to process the message
      const response: ConversationResponse = await conversationalAIService.processMessage(
        message, 
        currentContext
      );

      // Update conversation context (for internal tracking only)
      const updatedContext: ConversationContext = {
        ...currentContext,
        messages: [
          ...currentContext.messages,
          { role: 'user', content: message },
          { role: 'assistant', content: response.message }
        ],
        currentExpense: response.extractedData,
        conversationStep: response.nextStep
      };
      setConversationContext(updatedContext);

      // Update local expense data
      const updatedExpenseData = {
        date: response.extractedData.date || expenseData.date,
        merchant: response.extractedData.merchant || '',
        amount: response.extractedData.amount || '',
        description: response.extractedData.description || '',
        categoryId: response.extractedData.category ? 
          categories.find(cat => cat.name === response.extractedData.category)?.id || '' : '',
        customCategory: '',
        paymentMethodId: '',
        notes: response.extractedData.notes || '',
        isReimbursable: false
      };
      setExpenseData(updatedExpenseData);

      // Update conversation step
      setConversationStep(response.nextStep);

      // Add AI response to chat (only once)
      addSystemMessage(response.message);

      // Handle completion
      if (response.isComplete && response.nextStep === 'complete') {
        await saveExpense();
      }

    } catch (error) {
      console.error('Conversational AI processing failed:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        conversationContext: currentContext,
        userMessage: message
      });
      
      // Fallback to simple response
      addSystemMessage("I'm having trouble understanding. Could you please tell me the amount, merchant, and what you bought? For example: 'I spent $12 at McDonald's for lunch'");
    }
  };

  const handleFieldEdit = async (field: string, value: string | undefined, originalMessage: string) => {
    let updatedData = { ...expenseData };
    let updateMessage = "";
    
    switch (field) {
      case 'date':
        if (value) {
          updatedData.date = value;
          updateMessage = `Updated date to ${new Date(value).toLocaleDateString()}`;
        } else {
          const parsedDate = ExpenseParser.parseDate(originalMessage);
          if (parsedDate) {
            updatedData.date = parsedDate;
            updateMessage = `Updated date to ${new Date(parsedDate).toLocaleDateString()}`;
          } else {
            addSystemMessage("I couldn't understand the date. Please try formats like 'yesterday', '29th Sep 2025', or '29/09/2025'.");
            return;
          }
        }
        break;
        
      case 'amount':
        if (value) {
          updatedData.amount = value;
          updateMessage = `Updated amount to $${value}`;
        } else {
          const parsedAmount = ExpenseParser.extractAmount(originalMessage);
          if (parsedAmount) {
            updatedData.amount = parsedAmount;
            updateMessage = `Updated amount to $${parsedAmount}`;
          } else {
            addSystemMessage("I couldn't find an amount. Please specify like '$50' or 'USD 100'.");
            return;
          }
        }
        break;
        
      case 'merchant':
        if (value) {
          updatedData.merchant = value;
          updateMessage = `Updated merchant to ${value}`;
        } else {
          const parsedMerchant = ExpenseParser.extractMerchant(originalMessage);
          if (parsedMerchant) {
            updatedData.merchant = parsedMerchant;
            updateMessage = `Updated merchant to ${parsedMerchant}`;
          } else {
            addSystemMessage("I couldn't find a merchant name. Please specify where you spent the money.");
            return;
          }
        }
        break;
        
      case 'description':
        if (value) {
          updatedData.description = value;
          updateMessage = `Updated description to ${value}`;
        } else {
          const parsedDescription = ExpenseParser.extractDescription(originalMessage);
          if (parsedDescription) {
            updatedData.description = parsedDescription;
            updateMessage = `Updated description to ${parsedDescription}`;
          } else {
            addSystemMessage("I couldn't find a description. Please tell me what you bought.");
            return;
          }
        }
        break;
        
      case 'category':
        // For category, we'll need to trigger AI categorization or ask user to select
        if (updatedData.merchant && updatedData.description && updatedData.amount && categories.length > 0) {
          try {
            const aiSuggestion = await ExpenseParser.suggestCategoryWithAI(
              updatedData.merchant, 
              updatedData.description, 
              parseFloat(updatedData.amount),
              categories
            );
            if (aiSuggestion) {
              updatedData.categoryId = aiSuggestion.categoryId;
              const category = categories.find(cat => cat.id === aiSuggestion.categoryId);
              updateMessage = `Updated category to ${category?.name} (AI suggested)`;
            } else {
              addSystemMessage("I couldn't suggest a category. The current information will be used as-is.");
              return;
            }
          } catch (error) {
            addSystemMessage("I couldn't update the category. The current information will be used as-is.");
            return;
          }
        } else {
          addSystemMessage("I need merchant, description, and amount to suggest a category.");
          return;
        }
        break;
        
      default:
        addSystemMessage("I'm not sure which field you want to edit. Please be more specific.");
        return;
    }
    
    setExpenseData(updatedData);
    
    // Show updated summary
    let response = `${updateMessage}\n\nUpdated expense:\n`;
    if (updatedData.amount) response += `💰 Amount: $${updatedData.amount}\n`;
    if (updatedData.merchant) response += `🏪 Merchant: ${updatedData.merchant}\n`;
    if (updatedData.description) response += `📝 Description: ${updatedData.description}\n`;
    if (updatedData.categoryId) {
      const category = categories.find(cat => cat.id === updatedData.categoryId);
      response += `📂 Category: ${category?.name}\n`;
    }
    response += `📅 Date: ${new Date(updatedData.date).toLocaleDateString()}\n\n`;
    response += "Should I save this expense now?";
    
    addSystemMessage(response);
    setConversationStep('confirming');
    setEditingField(null);
  };

  const saveExpense = async () => {
    if (!activeWorkspaceId || !currentUser) {
      addSystemMessage("Sorry, there was an authentication error. Please try again.");
      return;
    }

    setIsSubmitting(true);
    addSystemMessage("Saving your expense...");

    try {
      // Validate required fields
      if (!expenseData.merchant?.trim()) {
        addSystemMessage("I need the merchant name to save the expense. Where did you spend the money?");
        setIsSubmitting(false);
        return;
      }
      
      if (!expenseData.amount || parseFloat(expenseData.amount) <= 0) {
        addSystemMessage("I need a valid amount to save the expense. How much did you spend?");
        setIsSubmitting(false);
        return;
      }
      
      if (!expenseData.description?.trim()) {
        addSystemMessage("I need a description to save the expense. What did you buy?");
        setIsSubmitting(false);
        return;
      }
      
      if (!expenseData.categoryId) {
        addSystemMessage("I need a category to save the expense. Let me try to suggest one based on your purchase.");
        setIsSubmitting(false);
        return;
      }

      const expenseDataToSave = {
        merchant: expenseData.merchant?.trim() || '',
        amount: parseFloat(expenseData.amount || '0'),
        description: expenseData.description?.trim() || '',
        txn_date: expenseData.date || new Date().toISOString().split('T')[0],
        global_category_id: expenseData.categoryId || null,
        payment_method_id: expenseData.paymentMethodId || null,
        notes: expenseData.notes?.trim() || null,
        is_reimbursable: expenseData.isReimbursable || false,
        workspace_id: activeWorkspaceId,
        user_id: currentUser?.id,
        currency: 'INR',
        source: 'manual', // Use 'manual' instead of 'chat' to match enum
        status: 'unreviewed' as const,
        category_confidence: expenseData.categoryId ? 0.8 : 0,
        category_source: expenseData.categoryId ? 'ai' : 'manual',
        payment_method_source: 'manual',
        receipt_url: null,
        extracted_text: null
      };

      console.log('💾 Submitting expense data from chat:', expenseDataToSave);
      
      const { error } = await supabase.from('expenses').insert([expenseDataToSave]);

      if (error) {
        console.error('Error creating expense:', error);
        let errorMessage = 'Sorry, there was an error saving your expense. Please try again.';
        
        // Provide more specific error messages
        if (error.message.includes('global_category_id')) {
          errorMessage = 'Please select a valid category.';
        } else if (error.message.includes('workspace_id')) {
          errorMessage = 'Invalid workspace. Please refresh and try again.';
        } else if (error.message.includes('user_id')) {
          errorMessage = 'Authentication error. Please log in again.';
        } else if (error.message.includes('payment_method_id')) {
          errorMessage = 'Invalid payment method selected.';
        }
        
        addSystemMessage(errorMessage);
        return;
      }

      addSystemMessage("✅ Expense saved successfully! You can add another expense or close this chat.");
      setConversationStep('complete');
      setShowSuccessToast(true);

      if (onExpenseAdded) {
        onExpenseAdded();
      }

      // Reset for next expense
      setTimeout(() => {
        setExpenseData({
          date: new Date().toISOString().split('T')[0],
          isReimbursable: false
        });
        setConversationStep('initial');
        setEditingField(null);
        
        // Reinitialize conversation context
        if (categories.length > 0) {
          const newContext = conversationalAIService.initializeConversation(categories);
          setConversationContext(newContext);
        }
        
        addSystemMessage("Ready for your next expense! What did you spend money on?");
      }, 3000);

    } catch (error) {
      console.error('Error submitting expense:', error);
      addSystemMessage("Sorry, there was an unexpected error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setMessages([]);
    setExpenseData({
      date: new Date().toISOString().split('T')[0],
      isReimbursable: false
    });
    setConversationStep('initial');
    setEditingField(null);
    setConversationContext(null);
    setIsProcessing(false);
    setIsSubmitting(false);
    setShowSuccessToast(false);
    processingRef.current.clear(); // Clear processing tracker
    onClose();
  };

  // Placeholder handlers for future integration
  const handleVoiceInput = () => {
    addSystemMessage("Voice input will be available in the next update! For now, please type your expense details.");
  };

  const handleFileUpload = () => {
    addSystemMessage("Receipt upload will be available in the next update! For now, please type your expense details.");
  };

  const handleCameraCapture = () => {
    addSystemMessage("Camera capture will be available in the next update! For now, please type your expense details.");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-500 to-teal-500">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-green-500 text-lg">💬</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Expense Chat</h2>
              <p className="text-sm text-green-100">AI-powered expense tracking</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:text-green-100 transition-colors p-2 hover:bg-white/10 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <ChatMessageList 
          messages={messages} 
          isLoading={isProcessing}
          autoScroll={true}
        />

        {/* Input Area */}
        <ChatInputArea
          onSendMessage={handleSendMessage}
          onVoiceInput={handleVoiceInput}
          onFileUpload={handleFileUpload}
          onCameraCapture={handleCameraCapture}
          disabled={isSubmitting}
          isProcessing={isProcessing}
          placeholder="Tell me about your expense..."
        />

        {/* Success Toast */}
        {showSuccessToast && (
          <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center space-x-2 z-50 animate-in slide-in-from-bottom-2">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Expense saved successfully!</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationalExpenseChat;
