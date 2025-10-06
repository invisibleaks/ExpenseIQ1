import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

interface ConversationContext {
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

interface ConversationResponse {
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
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json()
    const { userMessage, context, requestType } = body
    
    if (requestType !== 'conversation' || !userMessage || !context) {
      return new Response(JSON.stringify({ error: 'Invalid request format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const response = await processConversation(userMessage, context)
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })

  } catch (error) {
    console.error('Error in conversational AI:', error)
    
    return new Response(JSON.stringify({ 
      error: 'Conversation processing failed',
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

async function processConversation(
  userMessage: string, 
  context: ConversationContext
): Promise<ConversationResponse> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured')
  }

  // Build the conversation history
  const messages = [
    ...context.messages,
    {
      role: 'user' as const,
      content: userMessage
    }
  ]

  // Create the prompt for expense extraction and conversation
  const systemPrompt = buildConversationPrompt(context)
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          ...messages.slice(-10) // Keep last 10 messages for context
        ],
        temperature: 0.3,
        max_tokens: 800,
        tools: [
          {
            type: 'function',
            function: {
              name: 'process_expense_conversation',
              description: 'Process user message and extract expense information',
              parameters: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    description: 'Natural response to the user'
                  },
                  extractedData: {
                    type: 'object',
                    properties: {
                      amount: { type: 'string', description: 'Expense amount (numbers only)' },
                      merchant: { type: 'string', description: 'Merchant or business name' },
                      description: { type: 'string', description: 'What was purchased' },
                      date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
                      category: { type: 'string', description: 'Expense category' },
                      notes: { type: 'string', description: 'Additional notes' }
                    }
                  },
                  nextStep: {
                    type: 'string',
                    enum: ['initial', 'collecting', 'confirming', 'editing', 'complete'],
                    description: 'Next conversation step'
                  },
                  isComplete: {
                    type: 'boolean',
                    description: 'Whether expense is ready to save'
                  },
                  needsUserInput: {
                    type: 'boolean',
                    description: 'Whether user input is needed'
                  },
                  suggestedActions: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Suggested actions for the user'
                  }
                },
                required: ['message', 'extractedData', 'nextStep', 'isComplete', 'needsUserInput']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'process_expense_conversation' } }
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('OpenAI raw response:', JSON.stringify(data, null, 2))
    
    const toolCalls = data.choices[0]?.message?.tool_calls
    
    if (!toolCalls || toolCalls.length === 0) {
      throw new Error('No tool calls in OpenAI response')
    }
    
    const functionCall = toolCalls[0]?.function
    if (!functionCall || functionCall.name !== 'process_expense_conversation') {
      throw new Error('Invalid OpenAI response format')
    }

    const result = JSON.parse(functionCall.arguments)
    console.log('Parsed function arguments:', result)
    
    // Validate and clean the response
    return {
      message: result.message || 'I need more information about your expense.',
      extractedData: {
        ...context.currentExpense,
        ...result.extractedData
      },
      nextStep: result.nextStep || 'collecting',
      isComplete: result.isComplete || false,
      needsUserInput: result.needsUserInput !== false,
      suggestedActions: result.suggestedActions || undefined
    }

  } catch (error) {
    console.error('OpenAI conversation processing failed:', error)
    throw error
  }
}

function buildConversationPrompt(context: ConversationContext): string {
  const categoryNames = context.availableCategories.map(cat => cat.name).join(', ')
  const currentExpense = JSON.stringify(context.currentExpense, null, 2)
  
  return `You are an AI assistant specialized in helping users add expense entries through natural conversation.

CURRENT CONTEXT:
- Conversation Step: ${context.conversationStep}
- Current Expense Data: ${currentExpense}
- Available Categories: ${categoryNames}

YOUR ROLE:
1. Extract expense information from user messages
2. Guide users through the expense entry process
3. Handle corrections and updates naturally
4. Provide clear, helpful responses

EXTRACTION GUIDELINES:
- Amount: Extract numbers, handle "USD 1000", "$50", "fifty dollars", etc.
- Merchant: Business names, stores, service providers
- Description: What was purchased or the purpose of the expense
- Date: Parse "yesterday", "last week", "29th Sep 2025", relative dates
- Category: Match to available categories based on context
- Notes: Additional context or details

CONVERSATION FLOW:
1. INITIAL: Welcome and ask for expense details
2. COLLECTING: Extract info and ask for missing details
3. CONFIRMING: Show summary and ask for confirmation
4. EDITING: Handle corrections and updates
5. COMPLETE: Ready to save

RESPONSE STYLE:
- Natural and conversational
- Clear and helpful
- Proactive in asking for missing information
- Patient with corrections
- Confident in suggestions but flexible

EXAMPLES:
User: "I bought lunch at McDonald's for $12 yesterday"
→ Extract: amount="12", merchant="McDonald's", description="lunch", date="2025-10-05"
→ Response: "Great! I found $12 at McDonald's for lunch yesterday. I'd suggest 'Food & Dining' category. Should I save this expense?"

User: "Change the amount to $15"
→ Update: amount="15" (keep other data)
→ Response: "Updated the amount to $15. Here's your expense: $15 at McDonald's for lunch yesterday, Food & Dining category. Should I save this now?"

User: "No, change the date to last week"
→ Update: date="2025-09-29" (calculate last week)
→ Response: "Updated the date to last week. Your expense: $15 at McDonald's for lunch on 29/09/2025, Food & Dining category. Ready to save?"

IMPORTANT:
- Always merge new data with existing expense data
- Calculate relative dates accurately (yesterday, last week, etc.)
- Suggest appropriate categories based on merchant/description
- Be helpful but don't overwhelm with too many questions at once
- Handle "yes/no" responses appropriately in confirmation step`
}
