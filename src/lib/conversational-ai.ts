// Conversational AI Service for Natural Expense Processing
// Uses OpenAI GPT to handle natural language conversation about expenses

export interface ConversationContext {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  currentExpense: {
    amount?: string;
    merchant?: string;
    description?: string;
    date?: string;
    category?: string;
    notes?: string;
  };
  conversationStep: 'initial' | 'collecting' | 'confirming' | 'editing' | 'complete';
  availableCategories: Array<{
    id: string;
    name: string;
  }>;
}

export interface ConversationResponse {
  message: string;
  extractedData: {
    amount?: string;
    merchant?: string;
    description?: string;
    date?: string;
    category?: string;
    notes?: string;
  };
  nextStep: 'initial' | 'collecting' | 'confirming' | 'editing' | 'complete';
  isComplete: boolean;
  needsUserInput: boolean;
  suggestedActions?: string[];
}

class ConversationalAIService {
  private supabaseUrl: string | null = null;
  private openaiApiKey: string | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || null;
    this.openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY || null;
    this.isConfigured = !!(this.supabaseUrl && this.openaiApiKey);
    
    if (!this.isConfigured) {
      console.warn('Conversational AI is not configured. Missing:', {
        supabaseUrl: !this.supabaseUrl ? 'VITE_SUPABASE_URL' : 'OK',
        openaiKey: !this.openaiApiKey ? 'VITE_OPENAI_API_KEY' : 'OK'
      });
    }
  }

  /**
   * Check if conversational AI is available
   */
  isAvailable(): boolean {
    return this.isConfigured;
  }

  /**
   * Process a user message in the context of expense conversation
   */
  async processMessage(
    userMessage: string, 
    context: ConversationContext
  ): Promise<ConversationResponse> {
    console.log('🤖 ConversationalAI processMessage called');
    console.log('📊 Service available:', this.isAvailable());
    console.log('💬 User message:', userMessage);
    console.log('🔧 Context:', context);
    
    if (!this.isAvailable()) {
      console.log('⚠️ AI service not available, using fallback');
      return this.getFallbackResponse(userMessage, context);
    }

    try {
      console.log('🌐 Calling Supabase Edge Function...');
      // Use Supabase Edge Function for conversational processing
      const { supabase } = await import('./supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`${this.supabaseUrl}/functions/v1/conversational-ai`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userMessage,
          context,
          requestType: 'conversation'
        })
      });

      console.log('📡 API Response status:', response.status);
      console.log('📡 API Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Conversational AI API error:', response.status, response.statusText);
        console.error('❌ Error response body:', errorText);
        return this.getFallbackResponse(userMessage, context);
      }

      const result = await response.json();
      console.log('✅ API Response result:', result);
      return result;

    } catch (error) {
      console.error('Conversational AI processing failed:', error);
      return this.getFallbackResponse(userMessage, context);
    }
  }

  /**
   * Initialize a new conversation
   */
  initializeConversation(availableCategories: Array<{id: string; name: string}>): ConversationContext {
    return {
      messages: [
        {
          role: 'system',
          content: this.getSystemPrompt(availableCategories)
        }
      ],
      currentExpense: {},
      conversationStep: 'initial',
      availableCategories
    };
  }

  /**
   * Get the system prompt for the conversational AI
   */
  private getSystemPrompt(categories: Array<{id: string; name: string}>): string {
    const categoryNames = categories.map(cat => cat.name).join(', ');
    
    return `You are an AI assistant specialized in helping users add expense entries through natural conversation. Your goal is to extract expense information from user messages and guide them through the process.

AVAILABLE CATEGORIES: ${categoryNames}

CONVERSATION FLOW:
1. INITIAL: Greet user and ask for expense details
2. COLLECTING: Extract information and ask for missing details
3. CONFIRMING: Show summary and ask for confirmation
4. EDITING: Handle corrections and updates
5. COMPLETE: Expense is ready to save

EXTRACTION RULES:
- Amount: Look for currency symbols, numbers, "USD", "dollars", etc.
- Merchant: Business names, store names, service providers
- Description: What was purchased or the purpose
- Date: "yesterday", "today", specific dates, relative dates
- Category: Match to available categories or suggest based on context

RESPONSE FORMAT:
Always respond with natural, helpful language. Be conversational but efficient.

EXAMPLES:
User: "I bought lunch at McDonald's for $12 yesterday"
Response: "Great! I found: $12 at McDonald's for lunch yesterday. I'd suggest 'Food & Dining' category. Should I save this expense?"

User: "Change the date to last week"
Response: "Updated the date to last week. Here's your expense: [show updated summary]. Should I save this now?"

PERSONALITY:
- Friendly and helpful
- Clear and concise
- Proactive in asking for missing information
- Patient with corrections and changes
- Confident in suggestions but open to user preferences

Remember: Always extract as much information as possible from each message, but ask for clarification when needed.`;
  }

  /**
   * Fallback response when AI is not available
   */
  private getFallbackResponse(userMessage: string, context: ConversationContext): ConversationResponse {
    // Simple rule-based fallback
    const message = userMessage.toLowerCase();
    
    // Basic extraction patterns
    const amountMatch = message.match(/\$?(\d+(?:\.\d{2})?)/);
    const amount = amountMatch ? amountMatch[1] : undefined;
    
    const merchantPatterns = [
      /(?:at|from)\s+([a-zA-Z][a-zA-Z\s&'.-]+?)(?:\s+for|\s+\$|\s*$)/i,
      /([a-zA-Z][a-zA-Z\s&'.-]+?)(?:\s+for\s+\$)/i
    ];
    
    let merchant = undefined;
    for (const pattern of merchantPatterns) {
      const match = message.match(pattern);
      if (match) {
        merchant = match[1].trim();
        break;
      }
    }

    // Basic date handling
    let date = undefined;
    if (message.includes('yesterday')) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      date = yesterday.toISOString().split('T')[0];
    } else if (message.includes('today')) {
      date = new Date().toISOString().split('T')[0];
    }

    // Merge with existing data
    const extractedData = {
      ...context.currentExpense,
      ...(amount && { amount }),
      ...(merchant && { merchant }),
      ...(date && { date })
    };

    // Determine next step and response
    const hasRequiredData = extractedData.amount && extractedData.merchant;
    
    let responseMessage = '';
    let nextStep: ConversationResponse['nextStep'] = 'collecting';
    
    if (context.conversationStep === 'initial') {
      if (hasRequiredData) {
        responseMessage = `I found: $${extractedData.amount} at ${extractedData.merchant}. What category should this be?`;
        nextStep = 'confirming';
      } else {
        responseMessage = "I need more details. Please tell me the amount and where you spent it.";
        nextStep = 'collecting';
      }
    } else if (context.conversationStep === 'confirming') {
      if (message.includes('yes') || message.includes('save')) {
        responseMessage = "Perfect! Your expense is ready to save.";
        nextStep = 'complete';
      } else if (message.includes('no') || message.includes('change')) {
        responseMessage = "What would you like to change?";
        nextStep = 'editing';
      } else {
        responseMessage = "Should I save this expense? Say 'yes' to confirm or 'no' to make changes.";
        nextStep = 'confirming';
      }
    }

    return {
      message: responseMessage,
      extractedData,
      nextStep,
      isComplete: nextStep === 'complete',
      needsUserInput: nextStep !== 'complete',
      suggestedActions: nextStep === 'editing' ? ['Change amount', 'Change merchant', 'Change date'] : undefined
    };
  }

  /**
   * Get service status
   */
  getServiceInfo() {
    return {
      isAvailable: this.isAvailable(),
      supabaseUrl: this.supabaseUrl,
      openaiApiKey: this.openaiApiKey ? 'Set' : 'Missing',
      edgeFunctionUrl: this.supabaseUrl ? `${this.supabaseUrl}/functions/v1/conversational-ai` : null
    };
  }
}

// Export singleton instance
export const conversationalAIService = new ConversationalAIService();

// Export types
export type { ConversationContext, ConversationResponse };
