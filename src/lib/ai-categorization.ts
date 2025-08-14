// AI Categorization Service using OpenAI
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
  private apiKey: string | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || null;
    this.isConfigured = !!this.apiKey;
    
    if (!this.isConfigured) {
      console.warn('OpenAI API key not found. AI categorization will be disabled.');
    }
  }

  /**
   * Check if AI categorization is available
   */
  isAvailable(): boolean {
    return this.isConfigured;
  }

  /**
   * Categorize an expense using OpenAI
   */
  async categorizeExpense(expense: ExpenseContext): Promise<AICategorizationResult> {
    if (!this.isAvailable()) {
      throw new Error('AI categorization is not configured. Please add VITE_OPENAI_API_KEY to your environment variables.');
    }

    try {
      const prompt = this.buildPrompt(expense);
      const response = await this.callOpenAI(prompt);
      
      return this.parseAIResponse(response);
    } catch (error) {
      console.error('AI categorization failed:', error);
      // Fallback to rule-based categorization
      return this.fallbackCategorization(expense);
    }
  }

  /**
   * Build the prompt for OpenAI
   */
  private buildPrompt(expense: ExpenseContext): string {
    const categories = DEFAULT_CATEGORIES.join(', ');
    
    return `You are an expense categorization expert. Analyze the following expense and categorize it into one of these categories: ${categories}

Expense Details:
- Merchant: ${expense.merchant}
- Amount: ${expense.currency} ${expense.amount}
- Description: ${expense.description || 'Not provided'}
- Date: ${expense.date || 'Not specified'}
- Notes: ${expense.notes || 'None'}

Please respond in this exact JSON format:
{
  "category": "exact_category_name_from_list",
  "confidence": 0.95,
  "reasoning": "Brief explanation of why this category was chosen",
  "suggestedPaymentMethod": "Credit Card"
}

Rules:
1. Choose the most specific and appropriate category from the list
2. Confidence should be between 0.7 and 1.0
3. Reasoning should be clear and concise
4. Suggested payment method should be one of: Credit Card, Debit Card, Cash, Bank Transfer, Digital Wallet
5. If the expense doesn't clearly fit any category, use "Other" with lower confidence
6. Use the description field as the primary source for categorization when available

Example response:
{
  "category": "Transportation",
  "confidence": 0.95,
  "reasoning": "Ride-sharing service based on merchant 'Uber' and description 'Ride from airport to downtown'",
  "suggestedPaymentMethod": "Credit Card"
}`;
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(prompt: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expense categorization expert. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  /**
   * Parse the AI response
   */
  private parseAIResponse(response: string): AICategorizationResult {
    try {
      // Clean the response (remove markdown formatting if present)
      const cleanResponse = response.replace(/```json\s*|\s*```/g, '').trim();
      const parsed = JSON.parse(cleanResponse);
      
      // Validate the response
      if (!parsed.category || !parsed.confidence || !parsed.reasoning) {
        throw new Error('Invalid AI response format');
      }

      // Ensure category is from our allowed list
      if (!DEFAULT_CATEGORIES.includes(parsed.category)) {
        parsed.category = 'Other';
        parsed.confidence = Math.max(parsed.confidence * 0.8, 0.7);
        parsed.reasoning = `AI suggested "${parsed.category}" but it's not in our category list, so using "Other"`;
      }

      return {
        category: parsed.category,
        confidence: Math.max(0.7, Math.min(1.0, parsed.confidence)),
        reasoning: parsed.reasoning,
        suggestedPaymentMethod: parsed.suggestedPaymentMethod
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('AI response parsing failed');
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
   * Get suggested categories for a merchant (for autocomplete)
   */
  async getCategorySuggestions(merchant: string): Promise<string[]> {
    if (!this.isAvailable()) {
      return this.getFallbackSuggestions(merchant);
    }

    try {
      const prompt = `Given this merchant name: "${merchant}", suggest the top 3 most likely expense categories from this list: ${DEFAULT_CATEGORIES.join(', ')}. Respond with just the category names separated by commas.`;
      
      const response = await this.callOpenAI(prompt);
      const suggestions = response.split(',').map(s => s.trim()).filter(s => DEFAULT_CATEGORIES.includes(s));
      
      return suggestions.length > 0 ? suggestions : this.getFallbackSuggestions(merchant);
    } catch (error) {
      return this.getFallbackSuggestions(merchant);
    }
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
}

// Export singleton instance
export const aiCategorizationService = new AICategorizationService();

// Export types for use in components
export type { AICategorizationResult, ExpenseContext };
