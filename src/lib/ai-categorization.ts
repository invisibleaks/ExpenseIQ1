// AI Categorization Service using Supabase Edge Functions
// This service automatically categorizes expenses based on merchant name and amount

export interface AICategorizationResult {
  category: string;
  confidence: number;
  reasoning: string;
  suggestedPaymentMethod?: string;
}

export interface ExpenseContext {
  merchant: string;
  amount: number;
  currency: string;
  date?: string;
  description?: string;
  notes?: string;
}

// Default categories that the AI can choose from
export const DEFAULT_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Office Supplies',
  'Utilities',
  'Entertainment',
  'Healthcare',
  'Travel',
  'Shopping',
  'Education',
  'Insurance',
  'Taxes',
  'Other'
];

// Payment method suggestions based on common patterns
export const PAYMENT_METHOD_PATTERNS = {
  'Food & Dining': ['Credit Card', 'Cash', 'Digital Wallet'],
  'Transportation': ['Credit Card', 'Digital Wallet', 'Cash'],
  'Office Supplies': ['Credit Card', 'Bank Transfer'],
  'Utilities': ['Bank Transfer', 'Credit Card'],
  'Entertainment': ['Credit Card', 'Digital Wallet', 'Cash'],
  'Healthcare': ['Credit Card', 'Cash', 'Insurance'],
  'Travel': ['Credit Card', 'Bank Transfer'],
  'Shopping': ['Credit Card', 'Digital Wallet', 'Cash'],
  'Education': ['Bank Transfer', 'Credit Card'],
  'Insurance': ['Bank Transfer', 'Credit Card'],
  'Taxes': ['Bank Transfer', 'Credit Card'],
  'Other': ['Credit Card', 'Cash', 'Bank Transfer']
};

class AICategorizationService {
  private supabaseUrl: string | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || null;
    this.isConfigured = !!this.supabaseUrl;
    
    if (!this.isConfigured) {
      console.warn('Supabase URL not found. AI categorization will be disabled.');
    }
  }

  /**
   * Check if AI categorization is available
   */
  isAvailable(): boolean {
    return this.isConfigured;
  }

  /**
   * Categorize an expense using Supabase Edge Function
   */
  async categorizeExpense(expense: ExpenseContext): Promise<AICategorizationResult> {
    if (!this.isAvailable()) {
      throw new Error('AI categorization is not configured. Please check your Supabase configuration.');
    }

    try {
      // Get the current session for authentication
      const { supabase } = await import('./supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add authorization header if user is authenticated
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`${this.supabaseUrl}/functions/v1/ai-categorization`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ expense })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Edge function error response:', errorText);
        throw new Error(`Edge function error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Validate the response
      if (!result.category || !result.confidence || !result.reasoning) {
        throw new Error('Invalid response from AI categorization service');
      }

      return result;
    } catch (error) {
      console.error('AI categorization failed:', error);
      // Fallback to rule-based categorization
      return this.fallbackCategorization(expense);
    }
  }

  /**
   * Get suggested categories for a merchant (for autocomplete)
   * This now uses the Edge Function for better AI-powered suggestions
   */
  async getCategorySuggestions(merchant: string): Promise<string[]> {
    if (!this.isAvailable() || !merchant.trim()) {
      return this.getFallbackSuggestions(merchant);
    }

    try {
      // Get the current session for authentication
      const { supabase } = await import('./supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add authorization header if user is authenticated
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      // Create a minimal expense context for suggestions
      const expenseContext: ExpenseContext = {
        merchant: merchant.trim(),
        amount: 0,
        currency: 'USD',
        description: 'Category suggestion request'
      };

      const response = await fetch(`${this.supabaseUrl}/functions/v1/ai-categorization`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          expense: expenseContext,
          requestType: 'suggestions' // Add a flag to indicate this is for suggestions
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.suggestions && Array.isArray(result.suggestions)) {
          return result.suggestions;
        }
      }

      // Fallback to rule-based suggestions if Edge Function doesn't support suggestions yet
      return this.getFallbackSuggestions(merchant);
    } catch (error) {
      console.error('Failed to get AI category suggestions:', error);
      return this.getFallbackSuggestions(merchant);
    }
  }

  /**
   * Get multiple expense categorizations in batch (useful for bulk imports)
   */
  async categorizeExpensesBatch(expenses: ExpenseContext[]): Promise<AICategorizationResult[]> {
    if (!this.isAvailable()) {
      throw new Error('AI categorization is not configured. Please check your Supabase configuration.');
    }

    if (expenses.length === 0) {
      return [];
    }

    try {
      // Get the current session for authentication
      const { supabase } = await import('./supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add authorization header if user is authenticated
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`${this.supabaseUrl}/functions/v1/ai-categorization`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          expenses,
          requestType: 'batch'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Batch categorization error response:', errorText);
        throw new Error(`Batch categorization failed: ${response.status} ${response.statusText}`);
      }

      const results = await response.json();
      
      // Validate the batch response
      if (!Array.isArray(results)) {
        throw new Error('Invalid batch response from AI categorization service');
      }

      return results.map(result => {
        if (!result.category || !result.confidence || !result.reasoning) {
          // Fallback for any invalid results in the batch
          return this.fallbackCategorization({
            merchant: result.merchant || 'Unknown',
            amount: result.amount || 0,
            currency: result.currency || 'USD'
          });
        }
        return result;
      });
    } catch (error) {
      console.error('Batch AI categorization failed:', error);
      // Fallback to individual categorization for each expense
      return Promise.all(expenses.map(expense => this.fallbackCategorization(expense)));
    }
  }

  /**
   * Fallback categorization using rule-based logic
   */
  private fallbackCategorization(expense: ExpenseContext): AICategorizationResult {
    const merchant = expense.merchant.toLowerCase();
    const amount = expense.amount;

    // Rule-based categorization
    let category = 'Other';
    let confidence = 0.7;
    let reasoning = 'Fallback categorization based on merchant name patterns';

    // Food & Dining patterns
    if (merchant.includes('restaurant') || merchant.includes('cafe') || 
        merchant.includes('food') || merchant.includes('pizza') || 
        merchant.includes('burger') || merchant.includes('coffee') ||
        merchant.includes('starbucks') || merchant.includes('mcdonalds') ||
        merchant.includes('kfc') || merchant.includes('subway')) {
      category = 'Food & Dining';
      confidence = 0.9;
      reasoning = 'Merchant name indicates food service';
    }
    // Transportation patterns
    else if (merchant.includes('uber') || merchant.includes('lyft') || 
             merchant.includes('taxi') || merchant.includes('gas') ||
             merchant.includes('fuel') || merchant.includes('petrol') ||
             merchant.includes('metro') || merchant.includes('bus')) {
      category = 'Transportation';
      confidence = 0.9;
      reasoning = 'Merchant name indicates transportation service';
    }
    // Office Supplies patterns
    else if (merchant.includes('staples') || merchant.includes('office') ||
             merchant.includes('amazon') || merchant.includes('walmart') ||
             merchant.includes('target')) {
      category = 'Office Supplies';
      confidence = 0.8;
      reasoning = 'Merchant name indicates retail/general store';
    }
    // Utilities patterns
    else if (merchant.includes('electric') || merchant.includes('water') ||
             merchant.includes('gas') || merchant.includes('internet') ||
             merchant.includes('phone') || merchant.includes('mobile')) {
      category = 'Utilities';
      confidence = 0.9;
      reasoning = 'Merchant name indicates utility service';
    }

    // Payment method suggestion based on category
    const suggestedPaymentMethod = PAYMENT_METHOD_PATTERNS[category as keyof typeof PAYMENT_METHOD_PATTERNS]?.[0] || 'Credit Card';

    return {
      category,
      confidence,
      reasoning,
      suggestedPaymentMethod
    };
  }

  /**
   * Fallback category suggestions
   */
  private getFallbackSuggestions(merchant: string): string[] {
    const suggestions = ['Other'];
    
    if (merchant.toLowerCase().includes('food') || merchant.toLowerCase().includes('restaurant')) {
      suggestions.unshift('Food & Dining');
    }
    if (merchant.toLowerCase().includes('uber') || merchant.toLowerCase().includes('taxi')) {
      suggestions.unshift('Transportation');
    }
    if (merchant.toLowerCase().includes('amazon') || merchant.toLowerCase().includes('walmart')) {
      suggestions.unshift('Office Supplies');
    }
    
    return suggestions.slice(0, 3);
  }

  /**
   * Get service status and configuration info
   */
  getServiceInfo() {
    return {
      isAvailable: this.isAvailable(),
      supabaseUrl: this.supabaseUrl,
      edgeFunctionUrl: this.supabaseUrl ? `${this.supabaseUrl}/functions/v1/ai-categorization` : null,
      categories: DEFAULT_CATEGORIES,
      paymentMethods: Object.keys(PAYMENT_METHOD_PATTERNS)
    };
  }
}

// Export singleton instance
export const aiCategorizationService = new AICategorizationService();

// Export types for use in components
export type { AICategorizationResult, ExpenseContext };
