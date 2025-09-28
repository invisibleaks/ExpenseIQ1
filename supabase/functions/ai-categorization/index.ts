import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Default categories that the AI can choose from
const DEFAULT_CATEGORIES = [
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
const PAYMENT_METHOD_PATTERNS = {
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

interface ExpenseContext {
  merchant: string;
  amount: number;
  currency: string;
  date?: string;
  description?: string;
  notes?: string;
}

interface AICategorizationResult {
  category: string;
  confidence: number;
  reasoning: string;
  suggestedPaymentMethod?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  }

  try {
    // Verify the request method
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get the request body
    const body = await req.json()
    const { expense, expenses, requestType } = body
    
    // Handle different request types
    if (requestType === 'batch' && Array.isArray(expenses)) {
      return await handleBatchCategorization(expenses)
    } else if (requestType === 'suggestions' && expense) {
      return await handleCategorySuggestions(expense)
    } else if (expense && expense.merchant) {
      return await handleSingleCategorization(expense)
    } else {
      return new Response(JSON.stringify({ error: 'Invalid request format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    console.error('Error in AI categorization:', error)
    
    return new Response(JSON.stringify({ 
      error: 'Categorization failed',
      message: error.message || 'Unknown error'
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
})

async function handleSingleCategorization(expense: ExpenseContext) {
  // Get OpenAI API key from environment
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  
  if (!openaiApiKey) {
    // Fallback to rule-based categorization if no API key
    const fallbackResult = fallbackCategorization(expense)
    return new Response(JSON.stringify(fallbackResult), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }

  try {
    // Call OpenAI for categorization
    const aiResult = await categorizeWithOpenAI(expense, openaiApiKey)
    
    return new Response(JSON.stringify(aiResult), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    console.error('OpenAI categorization failed:', error)
    // Fallback to rule-based categorization
    const fallbackResult = fallbackCategorization(expense)
    return new Response(JSON.stringify(fallbackResult), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}

async function handleBatchCategorization(expenses: ExpenseContext[]) {
  // Get OpenAI API key from environment
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  
  if (!openaiApiKey) {
    // Fallback to rule-based categorization for all expenses
    const fallbackResults = expenses.map(expense => fallbackCategorization(expense))
    return new Response(JSON.stringify(fallbackResults), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }

  try {
    // Process expenses in parallel for better performance
    const categorizationPromises = expenses.map(async (expense) => {
      try {
        return await categorizeWithOpenAI(expense, openaiApiKey)
      } catch (error) {
        console.error(`Failed to categorize expense for ${expense.merchant}:`, error)
        return fallbackCategorization(expense)
      }
    })

    const results = await Promise.all(categorizationPromises)
    
    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    console.error('Batch categorization failed:', error)
    // Fallback to rule-based categorization for all expenses
    const fallbackResults = expenses.map(expense => fallbackCategorization(expense))
    return new Response(JSON.stringify(fallbackResults), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}

async function handleCategorySuggestions(expense: ExpenseContext) {
  // Get OpenAI API key from environment
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  
  if (!openaiApiKey) {
    // Fallback to rule-based suggestions
    const fallbackSuggestions = getFallbackSuggestions(expense.merchant)
    return new Response(JSON.stringify({ suggestions: fallbackSuggestions }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }

  try {
    // Create a prompt for category suggestions
    const prompt = `Given this merchant name: "${expense.merchant}", suggest the top 3 most likely expense categories from this list: ${DEFAULT_CATEGORIES.join(', ')}. Respond with just the category names separated by commas.`
    
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
            content: 'You are an expense categorization expert. Respond with category names separated by commas.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 100
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content || ''
    
    // Parse the suggestions
    const suggestions = aiResponse.split(',').map(s => s.trim()).filter(s => DEFAULT_CATEGORIES.includes(s))
    
    // Ensure we have at least 3 suggestions
    const finalSuggestions = suggestions.length > 0 ? suggestions : getFallbackSuggestions(expense.merchant)
    
    return new Response(JSON.stringify({ suggestions: finalSuggestions.slice(0, 3) }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    console.error('AI suggestions failed:', error)
    // Fallback to rule-based suggestions
    const fallbackSuggestions = getFallbackSuggestions(expense.merchant)
    return new Response(JSON.stringify({ suggestions: fallbackSuggestions }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}

async function categorizeWithOpenAI(expense: ExpenseContext, apiKey: string): Promise<AICategorizationResult> {
  const prompt = buildPrompt(expense)
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
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
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  const aiResponse = data.choices[0]?.message?.content || ''
  
  return parseAIResponse(aiResponse)
}

function buildPrompt(expense: ExpenseContext): string {
  const categories = DEFAULT_CATEGORIES.join(', ')
  
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
}`
}

function parseAIResponse(response: string): AICategorizationResult {
  try {
    // Clean the response (remove markdown formatting if present)
    const cleanResponse = response.replace(/```json\s*|\s*```/g, '').trim()
    const parsed = JSON.parse(cleanResponse)
    
    // Validate the response
    if (!parsed.category || !parsed.confidence || !parsed.reasoning) {
      throw new Error('Invalid AI response format')
    }

    // Ensure category is from our allowed list
    if (!DEFAULT_CATEGORIES.includes(parsed.category)) {
      parsed.category = 'Other'
      parsed.confidence = Math.max(parsed.confidence * 0.8, 0.7)
      parsed.reasoning = `AI suggested "${parsed.category}" but it's not in our category list, so using "Other"`
    }

    return {
      category: parsed.category,
      confidence: Math.max(0.7, Math.min(1.0, parsed.confidence)),
      reasoning: parsed.reasoning,
      suggestedPaymentMethod: parsed.suggestedPaymentMethod
    }
  } catch (error) {
    console.error('Failed to parse AI response:', error)
    throw new Error('AI response parsing failed')
  }
}

function fallbackCategorization(expense: ExpenseContext): AICategorizationResult {
  const merchant = expense.merchant.toLowerCase()
  const amount = expense.amount

  // Rule-based categorization
  let category = 'Other'
  let confidence = 0.7
  let reasoning = 'Fallback categorization based on merchant name patterns'

  // Food & Dining patterns
  if (merchant.includes('restaurant') || merchant.includes('cafe') || 
      merchant.includes('food') || merchant.includes('pizza') || 
      merchant.includes('burger') || merchant.includes('coffee') ||
      merchant.includes('starbucks') || merchant.includes('mcdonalds') ||
      merchant.includes('kfc') || merchant.includes('subway')) {
    category = 'Food & Dining'
    confidence = 0.9
    reasoning = 'Merchant name indicates food service'
  }
  // Transportation patterns
  else if (merchant.includes('uber') || merchant.includes('lyft') || 
           merchant.includes('taxi') || merchant.includes('gas') ||
           merchant.includes('fuel') || merchant.includes('petrol') ||
           merchant.includes('metro') || merchant.includes('bus')) {
    category = 'Transportation'
    confidence = 0.9
    reasoning = 'Merchant name indicates transportation service'
  }
  // Office Supplies patterns
  else if (merchant.includes('staples') || merchant.includes('office') ||
           merchant.includes('amazon') || merchant.includes('walmart') ||
           merchant.includes('target')) {
    category = 'Office Supplies'
    confidence = 0.8
    reasoning = 'Merchant name indicates retail/general store'
  }
  // Utilities patterns
  else if (merchant.includes('electric') || merchant.includes('water') ||
           merchant.includes('gas') || merchant.includes('internet') ||
           merchant.includes('phone') || merchant.includes('mobile')) {
    category = 'Utilities'
    confidence = 0.9
    reasoning = 'Merchant name indicates utility service'
  }

  // Payment method suggestion based on category
  const suggestedPaymentMethod = PAYMENT_METHOD_PATTERNS[category as keyof typeof PAYMENT_METHOD_PATTERNS]?.[0] || 'Credit Card'

  return {
    category,
    confidence,
    reasoning,
    suggestedPaymentMethod
  }
}

function getFallbackSuggestions(merchant: string): string[] {
  const merchantLower = merchant.toLowerCase();
  const suggestions: string[] = [];

  // Food & Dining patterns
  if (merchantLower.includes('restaurant') || merchantLower.includes('cafe') || 
      merchantLower.includes('food') || merchantLower.includes('pizza') || 
      merchantLower.includes('burger') || merchantLower.includes('coffee') ||
      merchantLower.includes('starbucks') || merchantLower.includes('mcdonalds') ||
      merchantLower.includes('kfc') || merchantLower.includes('subway')) {
    suggestions.push('Food & Dining');
  }
  // Transportation patterns
  else if (merchantLower.includes('uber') || merchantLower.includes('lyft') || 
           merchantLower.includes('taxi') || merchantLower.includes('gas') ||
           merchantLower.includes('fuel') || merchantLower.includes('petrol') ||
           merchantLower.includes('metro') || merchantLower.includes('bus')) {
    suggestions.push('Transportation');
  }
  // Office Supplies patterns
  else if (merchantLower.includes('staples') || merchantLower.includes('office') ||
           merchantLower.includes('amazon') || merchantLower.includes('walmart') ||
           merchantLower.includes('target')) {
    suggestions.push('Office Supplies');
  }
  // Utilities patterns
  else if (merchantLower.includes('electric') || merchantLower.includes('water') ||
           merchantLower.includes('gas') || merchantLower.includes('internet') ||
           merchantLower.includes('phone') || merchantLower.includes('mobile')) {
    suggestions.push('Utilities');
  }

  // Add a few more generic suggestions
  if (suggestions.length < 3) {
    suggestions.push('Other');
  }
  if (suggestions.length < 3) {
    suggestions.push('Entertainment');
  }
  if (suggestions.length < 3) {
    suggestions.push('Healthcare');
  }
  if (suggestions.length < 3) {
    suggestions.push('Travel');
  }
  if (suggestions.length < 3) {
    suggestions.push('Shopping');
  }
  if (suggestions.length < 3) {
    suggestions.push('Education');
  }
  if (suggestions.length < 3) {
    suggestions.push('Insurance');
  }
  if (suggestions.length < 3) {
    suggestions.push('Taxes');
  }

  return suggestions;
}
