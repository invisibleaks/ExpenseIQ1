import { aiCategorizationService, ExpenseContext } from './ai-categorization';

export interface VoiceAnalysisResult {
  merchant: string;
  amount: number;
  description: string;
  date?: string;
  notes?: string;
  confidence: number;
  rawText: string;
  // AI categorization results
  aiCategory?: string;
  aiConfidence?: number;
  aiReasoning?: string;
  suggestedPaymentMethod?: string;
}

export interface VoiceAnalysisError {
  error: string;
  message: string;
  rawText: string;
}

class VoiceAnalysisService {
  /**
   * Analyze voice input text and extract expense details
   */
  async analyzeVoiceInput(voiceText: string): Promise<VoiceAnalysisResult | VoiceAnalysisError> {
    try {
      // Clean and normalize the input text
      const cleanedText = this.cleanVoiceText(voiceText);
      
      // Use OpenAI to extract structured information
      const extractedInfo = await this.extractExpenseInfo(cleanedText);
      
      if (!extractedInfo) {
        return {
          error: 'EXTRACTION_FAILED',
          message: 'Could not extract expense information from voice input',
          rawText: voiceText
        };
      }

      // Create expense context for AI categorization
      const expenseContext: ExpenseContext = {
        merchant: extractedInfo.merchant,
        amount: extractedInfo.amount,
        currency: 'INR', // Default currency
        date: extractedInfo.date,
        description: extractedInfo.description,
        notes: extractedInfo.notes
      };

      // Use existing AI categorization service
      const aiResult = await aiCategorizationService.categorizeExpense(expenseContext);

      return {
        merchant: extractedInfo.merchant,
        amount: extractedInfo.amount,
        description: extractedInfo.description,
        date: extractedInfo.date,
        notes: extractedInfo.notes,
        confidence: Math.min(extractedInfo.confidence * aiResult.confidence, 0.95),
        rawText: voiceText,
        // Include AI categorization results
        aiCategory: aiResult.category,
        aiConfidence: aiResult.confidence,
        aiReasoning: aiResult.reasoning,
        suggestedPaymentMethod: aiResult.suggestedPaymentMethod
      };

    } catch (error) {
      console.error('Voice analysis failed:', error);
      return {
        error: 'ANALYSIS_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        rawText: voiceText
      };
    }
  }

  /**
   * Clean and normalize voice input text
   */
  private cleanVoiceText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s$.,]/g, '') // Remove special characters except $, ., and ,
      .trim();
  }

  /**
   * Extract expense information using OpenAI
   */
  private async extractExpenseInfo(voiceText: string): Promise<any> {
    try {
      // Get OpenAI API key from environment
      const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!openaiApiKey) {
        // Fallback to rule-based extraction if no API key
        return this.fallbackExtraction(voiceText);
      }

      const prompt = `Extract expense information from this voice input: "${voiceText}"

Please respond with valid JSON in this exact format:
{
  "merchant": "merchant name",
  "amount": number (extract the amount, default to 0 if not found),
  "description": "what the expense was for",
  "date": "date if mentioned (YYYY-MM-DD format, or null if not specified)",
  "notes": "any additional notes or context",
  "confidence": number between 0.7 and 1.0
}

Examples:
- "I spent $25 on lunch at McDonald's yesterday" → {"merchant": "McDonald's", "amount": 25, "description": "lunch", "date": "yesterday", "notes": null, "confidence": 0.95}
- "Coffee from Starbucks $4.50" → {"merchant": "Starbucks", "amount": 4.50, "description": "coffee", "date": null, "notes": null, "confidence": 0.9}
- "Uber ride to airport cost me 35 dollars" → {"merchant": "Uber", "amount": 35, "description": "ride to airport", "date": null, "notes": null, "confidence": 0.9}

Rules:
1. Extract the exact merchant name mentioned
2. Convert all amounts to numbers
3. Create a clear description of what was purchased
4. If date is mentioned, try to convert to YYYY-MM-DD format
5. Set confidence based on how clear the information is
6. Always respond with valid JSON`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an expense data extraction expert. Always respond with valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 300
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || '';
      
      // Parse the JSON response
      const extracted = JSON.parse(aiResponse);
      
      // Validate the extracted data
      if (!extracted.merchant || !extracted.amount || !extracted.description) {
        throw new Error('Incomplete expense information extracted');
      }

      // Process the date if provided
      let processedDate = null;
      if (extracted.date && extracted.date !== 'null') {
        processedDate = this.processDate(extracted.date);
      }

      return {
        merchant: extracted.merchant,
        amount: parseFloat(extracted.amount) || 0,
        description: extracted.description,
        date: processedDate,
        notes: extracted.notes || null,
        confidence: Math.max(0.7, Math.min(1.0, extracted.confidence || 0.8))
      };

    } catch (error) {
      console.error('OpenAI extraction failed:', error);
      // Fallback to rule-based extraction
      return this.fallbackExtraction(voiceText);
    }
  }

  /**
   * Fallback rule-based extraction when OpenAI is not available
   */
  private fallbackExtraction(voiceText: string): any {
    const text = voiceText.toLowerCase();
    
    // Extract amount (look for currency symbols and numbers)
    const amountMatch = text.match(/(?:rs\.?|₹|inr|dollars?|\$)\s*(\d+(?:\.\d{2})?)/i) || 
                       text.match(/(\d+(?:\.\d{2})?)\s*(?:rs\.?|₹|inr|dollars?|\$)/i) ||
                       text.match(/(\d+(?:\.\d{2})?)/);
    
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
    
    // Extract merchant (look for common patterns)
    let merchant = 'Unknown';
    const merchantPatterns = [
      /(?:from|at|to)\s+([a-zA-Z\s]+?)(?:\s+(?:cost|spent|paid|bought))/i,
      /(?:spent|paid|bought|got)\s+(?:at|from)\s+([a-zA-Z\s]+)/i,
      /([a-zA-Z\s]+)\s+(?:restaurant|cafe|store|shop|service)/i
    ];
    
    for (const pattern of merchantPatterns) {
      const match = text.match(pattern);
      if (match && match[1].trim().length > 2) {
        merchant = match[1].trim();
        break;
      }
    }
    
    // Extract description
    let description = 'Expense';
    if (text.includes('lunch') || text.includes('dinner') || text.includes('breakfast')) {
      description = 'Meal';
    } else if (text.includes('coffee') || text.includes('tea')) {
      description = 'Beverage';
    } else if (text.includes('ride') || text.includes('uber') || text.includes('taxi')) {
      description = 'Transportation';
    } else if (text.includes('shopping') || text.includes('bought')) {
      description = 'Purchase';
    }
    
    // Extract date
    let date = null;
    if (text.includes('yesterday')) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      date = yesterday.toISOString().split('T')[0];
    } else if (text.includes('today')) {
      date = new Date().toISOString().split('T')[0];
    }
    
    return {
      merchant: merchant.charAt(0).toUpperCase() + merchant.slice(1),
      amount: amount,
      description: description,
      date: date,
      notes: null,
      confidence: 0.7
    };
  }

  /**
   * Process date strings to YYYY-MM-DD format
   */
  private processDate(dateString: string): string | null {
    try {
      const lowerDate = dateString.toLowerCase();
      
      if (lowerDate === 'today') {
        return new Date().toISOString().split('T')[0];
      }
      
      if (lowerDate === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
      }
      
      if (lowerDate === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
      }
      
      // Try to parse relative dates like "2 days ago", "last week", etc.
      const relativeDateMatch = lowerDate.match(/(\d+)\s+(day|week|month)s?\s+ago/i);
      if (relativeDateMatch) {
        const number = parseInt(relativeDateMatch[1]);
        const unit = relativeDateMatch[2];
        const date = new Date();
        
        if (unit === 'day') {
          date.setDate(date.getDate() - number);
        } else if (unit === 'week') {
          date.setDate(date.getDate() - (number * 7));
        } else if (unit === 'month') {
          date.setMonth(date.getMonth() - number);
        }
        
        return date.toISOString().split('T')[0];
      }
      
      // Try to parse the date string directly
      const parsedDate = new Date(dateString);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString().split('T')[0];
      }
      
      return null;
    } catch (error) {
      console.error('Date processing failed:', error);
      return null;
    }
  }
}

// Export singleton instance
export const voiceAnalysisService = new VoiceAnalysisService();
export type { VoiceAnalysisResult, VoiceAnalysisError };
