import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import * as pdfParse from "https://esm.sh/pdf-parse@1.1.1"

interface PDFProcessingRequest {
  fileData: string; // base64-encoded PDF data
  fileName: string;
  userId?: string;
}

interface PDFProcessingResult {
  merchant: string;
  amount: number;
  description: string;
  date?: string;
  notes?: string;
  confidence: number;
  extractedText: string;
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
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // Get the request body
    const body = await req.json()
    const { fileData, fileName, userId }: PDFProcessingRequest = body
    
    // Validate required fields
    if (!fileData || !fileName) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields',
        message: 'fileData and fileName are required'
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // Get OpenAI API key from environment (only needed for AI analysis)
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    
    if (!openaiApiKey) {
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key not configured',
        message: 'Please configure OPENAI_API_KEY environment variable for AI analysis'
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    // Process the PDF
    const result = await processPDFWithPdfParse(fileData, fileName, openaiApiKey, userId)
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })

  } catch (error) {
    console.error('Error in PDF processing:', error)
    
    return new Response(JSON.stringify({ 
      error: 'PDF processing failed',
      message: error.message || 'Unknown error occurred during PDF processing'
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
})

async function processPDFWithPdfParse(
  fileData: string, 
  fileName: string, 
  apiKey: string, 
  userId?: string
): Promise<PDFProcessingResult> {
  try {
    console.log(`📄 Processing PDF: ${fileName} for user: ${userId || 'anonymous'}`)
    
    // Step 1: Extract text from PDF using pdf-parse
    const extractedText = await extractTextFromPDF(fileData, apiKey)
    
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text could be extracted from the PDF')
    }

    console.log('📝 Extracted text length:', extractedText.length)
    
    // Step 2: Analyze the extracted text for receipt data using AI
    const receiptData = await analyzeReceiptText(extractedText, apiKey)
    
    console.log('✅ PDF processing completed successfully')
    return {
      ...receiptData,
      extractedText
    }
    
  } catch (error) {
    console.error('❌ Error processing PDF with pdf-parse:', error)
    
    // Return fallback response
    return {
      merchant: 'Unknown',
      amount: 0,
      description: 'Could not process receipt',
      confidence: 0.7,
      extractedText: '',
      notes: `Processing failed: ${error.message}`
    }
  }
}

async function extractTextFromPDF(fileData: string, apiKey: string): Promise<string> {
  try {
    console.log('📄 Extracting text from PDF using pdf-parse...')
    
    // Convert base64 to buffer
    const pdfBuffer = Uint8Array.from(atob(fileData), c => c.charCodeAt(0))
    
    // Parse PDF using pdf-parse
    const pdfData = await pdfParse(pdfBuffer)
    
    if (!pdfData || !pdfData.text) {
      throw new Error('No text could be extracted from the PDF')
    }
    
    const extractedText = pdfData.text.trim()
    
    if (extractedText.length === 0) {
      throw new Error('PDF appears to be empty or contains no extractable text')
    }
    
    console.log(`✅ Successfully extracted ${extractedText.length} characters from PDF`)
    return extractedText
    
  } catch (error) {
    console.error('❌ PDF text extraction failed:', error)
    throw new Error(`PDF text extraction failed: ${error.message}`)
  }
}

async function analyzeReceiptText(text: string, apiKey: string): Promise<Omit<PDFProcessingResult, 'extractedText'>> {
  const prompt = `You are a receipt analysis expert. Analyze the following extracted text from a receipt/invoice and extract structured information.

Extracted Text:
${text}

Please respond in this exact JSON format:
{
  "merchant": "Business/store name",
  "amount": 123.45,
  "description": "Brief description of what was purchased",
  "date": "2024-01-15",
  "notes": "Any additional relevant information",
  "confidence": 0.95
}

Rules:
1. merchant: Extract the business/store name (required)
2. amount: Extract the total amount as a number (required, use 0 if not found)
3. description: Summarize what was purchased (required)
4. date: Extract date in YYYY-MM-DD format (optional, omit if not clear)
5. notes: Any additional relevant information like payment method, tax info, etc. (optional)
6. confidence: Your confidence in the extraction (0.7-1.0, required)

Important:
- If you can't find a clear total amount, use the largest monetary value you can identify
- For merchant, prefer the business name over generic terms like "Receipt" or "Invoice"
- For description, be concise but descriptive
- Only include date if you're confident about it
- Set confidence lower if the text is unclear or incomplete`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a receipt analysis expert. Always respond with valid JSON in the exact format requested.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 500
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('OpenAI analysis API error:', response.status, errorText)
    throw new Error(`OpenAI analysis API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  const aiResponse = data.choices[0]?.message?.content || ''
  
  return parseReceiptAnalysis(aiResponse)
}

function parseReceiptAnalysis(response: string): Omit<PDFProcessingResult, 'extractedText'> {
  try {
    // Clean the response (remove markdown formatting if present)
    const cleanResponse = response.replace(/```json\s*|\s*```/g, '').trim()
    const parsed = JSON.parse(cleanResponse)
    
    // Validate required fields
    if (!parsed.merchant || typeof parsed.amount !== 'number' || !parsed.description || typeof parsed.confidence !== 'number') {
      throw new Error('Invalid AI response format - missing required fields')
    }

    // Validate and constrain values
    const result: Omit<PDFProcessingResult, 'extractedText'> = {
      merchant: String(parsed.merchant).trim() || 'Unknown',
      amount: Math.max(0, Number(parsed.amount) || 0),
      description: String(parsed.description).trim() || 'Receipt processing',
      confidence: Math.max(0.7, Math.min(1.0, Number(parsed.confidence) || 0.7))
    }

    // Add optional fields if present and valid
    if (parsed.date && typeof parsed.date === 'string') {
      const dateStr = parsed.date.trim()
      // Basic date validation (YYYY-MM-DD format)
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        result.date = dateStr
      }
    }

    if (parsed.notes && typeof parsed.notes === 'string') {
      const notesStr = parsed.notes.trim()
      if (notesStr.length > 0) {
        result.notes = notesStr
      }
    }

    return result
    
  } catch (error) {
    console.error('Failed to parse receipt analysis response:', error)
    console.error('Raw response:', response)
    
    // Return fallback result
    return {
      merchant: 'Unknown',
      amount: 0,
      description: 'Receipt processing failed',
      confidence: 0.7,
      notes: `Parsing error: ${error.message}`
    }
  }
}



