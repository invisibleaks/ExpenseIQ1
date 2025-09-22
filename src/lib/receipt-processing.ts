import { supabase } from './supabase';
import { createWorker } from 'tesseract.js';

// Types for receipt processing
export interface ReceiptProcessingResult {
  merchant: string;
  amount: number;
  description: string;
  date?: string;
  notes?: string;
  confidence: number;
  extractedText: string;
  receiptUrl?: string;
}

export interface ReceiptProcessingError {
  error: string;
  message: string;
  fileName: string;
}

class ReceiptProcessingService {
  private readonly OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

  // Validate uploaded file
  validateFile(file: File): { isValid: boolean; error?: string } {
    if (!this.SUPPORTED_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: 'Unsupported file type. Please upload JPG, PNG, WebP, or PDF files.'
      };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: 'File too large. Please upload files smaller than 10MB.'
      };
    }

    return { isValid: true };
  }

  // Extract text from receipt image using Tesseract.js OCR
  private async extractTextFromFile(file: File): Promise<string> {
    try {
      console.log('🔍 Starting text extraction for:', file.name);
      
      // Handle PDF files using Supabase Edge Function
      if (file.type === 'application/pdf') {
        console.log('📄 PDF file detected - using Supabase Edge Function for processing');
        return await this.processPDFWithEdgeFunction(file);
      }

      // Create Tesseract worker
      const worker = await createWorker('eng');
      
      try {
        console.log('🤖 Tesseract worker initialized, processing image...');
        
        // Process the image file
        const { data: { text } } = await worker.recognize(file);
        
        console.log('📝 Raw OCR text extracted:', text.substring(0, 200) + '...');
        
        // Clean up the extracted text
        const cleanedText = text
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .join('\n');
        
        if (!cleanedText || cleanedText.length < 10) {
          throw new Error('OCR extracted very little text - image may be unclear');
        }
        
        console.log('✅ OCR processing completed successfully');
        return cleanedText;
        
      } finally {
        // Always terminate the worker to free up memory
        await worker.terminate();
      }
      
    } catch (error) {
      console.error('❌ Tesseract OCR processing failed:', error);
      
      // Provide fallback based on file name for better user experience
      const fileName = file.name.toLowerCase();
      let fallbackText = `RECEIPT - ${file.name}
Date: ${new Date().toLocaleDateString()}
Note: OCR processing failed - please verify details manually
`;

      // Add some context based on filename
      if (fileName.includes('starbucks') || fileName.includes('coffee')) {
        fallbackText += `Merchant: Starbucks
Category: Food & Beverage
Amount: Please verify manually`;
      } else if (fileName.includes('uber') || fileName.includes('taxi') || fileName.includes('lyft')) {
        fallbackText += `Merchant: Ride Service
Category: Transportation  
Amount: Please verify manually`;
      } else if (fileName.includes('office') || fileName.includes('supplies')) {
        fallbackText += `Merchant: Office Supplies
Category: Office Supplies
Amount: Please verify manually`;
      } else {
        fallbackText += `Merchant: Please verify manually
Amount: Please verify manually`;
      }
      
      return fallbackText;
    }
  }

  // Analyze extracted text using OpenAI
  private async analyzeReceiptText(extractedText: string): Promise<ReceiptProcessingResult> {
    try {
      console.log('🧠 Analyzing receipt text with AI...');
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are an expert at analyzing receipt text and extracting structured expense data. 
              
Parse the receipt text and extract the following information:
- merchant: The business name
- amount: The total amount (number only, no currency symbols)
- description: Brief description of what was purchased
- date: Date in YYYY-MM-DD format (if available)
- notes: Any additional relevant information

Return ONLY a valid JSON object with these fields. If information is unclear or missing, use reasonable defaults or leave empty string for optional fields.

Example:
{
  "merchant": "Starbucks",
  "amount": 5.94,
  "description": "Coffee",
  "date": "2024-01-15",
  "notes": "Business meeting coffee",
  "confidence": 0.95
}`
            },
            {
              role: 'user',
              content: `Analyze this receipt text and extract expense data:\n\n${extractedText}`
            }
          ],
          temperature: 0.1,
          max_tokens: 300
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content;

      if (!aiResponse) {
        throw new Error('No response from AI analysis');
      }

      try {
        const parsedResult = JSON.parse(aiResponse);
        
        return {
          merchant: parsedResult.merchant || 'Unknown Merchant',
          amount: parseFloat(parsedResult.amount) || 0,
          description: parsedResult.description || 'Receipt expense',
          date: parsedResult.date || undefined,
          notes: parsedResult.notes || '',
          confidence: parsedResult.confidence || 0.8,
          extractedText: extractedText
        };
      } catch (parseError) {
        console.error('❌ Failed to parse AI response:', aiResponse);
        throw new Error('Failed to parse receipt data from AI response');
      }

    } catch (error) {
      console.error('❌ AI analysis failed:', error);
      
      // Fallback analysis if AI fails
      return this.fallbackAnalysis(extractedText);
    }
  }

  // Fallback analysis if AI is unavailable
  private fallbackAnalysis(text: string): ReceiptProcessingResult {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Try to find merchant (usually first line)
    const merchant = lines[0] || 'Unknown Merchant';
    
    // Try to find total amount
    const totalRegex = /total[:\s]*\$?(\d+\.?\d*)/i;
    const amountMatch = text.match(totalRegex);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
    
    // Try to find date
    const dateRegex = /(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})/;
    const dateMatch = text.match(dateRegex);
    const date = dateMatch ? dateMatch[1] : undefined;
    
    return {
      merchant: merchant.replace(/[^a-zA-Z0-9\s]/g, '').trim(),
      amount: amount,
      description: 'Receipt expense',
      date: date,
      notes: 'Processed using fallback analysis',
      confidence: 0.6,
      extractedText: text
    };
  }

  // Process PDF receipt using Supabase Edge Function
  private async processPDFReceipt(file: File, userId?: string): Promise<ReceiptProcessingResult> {
    try {
      console.log('📡 Sending PDF to Supabase Edge Function for full processing...');
      
      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer();
      const base64String = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('pdf-processing', {
        body: {
          fileData: base64String,
          fileName: file.name,
          userId: userId
        }
      });
      
      if (error) {
        console.error('❌ PDF processing Edge Function error:', error);
        throw new Error(`PDF processing failed: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('No data returned from PDF processing');
      }
      
      // Upload file if user is provided
      let receiptUrl: string | undefined;
      if (userId) {
        try {
          receiptUrl = await this.uploadReceiptFile(file, userId);
        } catch (uploadError) {
          console.warn('⚠️ File upload failed, continuing without URL:', uploadError);
        }
      }
      
      const result: ReceiptProcessingResult = {
        merchant: data.merchant || 'Unknown',
        amount: data.amount || 0,
        description: data.description || 'Receipt processing',
        date: data.date,
        notes: data.notes,
        confidence: data.confidence || 0.7,
        extractedText: data.extractedText || '',
        receiptUrl: receiptUrl
      };
      
      console.log('✅ PDF processed successfully via Edge Function:', result);
      return result;
      
    } catch (error) {
      console.error('❌ PDF processing failed:', error);
      
      // Return fallback result
      const fallbackResult: ReceiptProcessingResult = {
        merchant: 'Unknown',
        amount: 0,
        description: 'PDF processing failed',
        confidence: 0.7,
        extractedText: `PDF RECEIPT - ${file.name}
Date: ${new Date().toLocaleDateString()}
Note: PDF processing failed - please verify details manually
File: ${file.name}`,
        notes: `Processing failed: ${error.message}`
      };
      
      // Upload file if user is provided
      if (userId) {
        try {
          const receiptUrl = await this.uploadReceiptFile(file, userId);
          fallbackResult.receiptUrl = receiptUrl;
        } catch (uploadError) {
          console.warn('⚠️ File upload failed, continuing without URL:', uploadError);
        }
      }
      
      return fallbackResult;
    }
  }

  // Process PDF using Supabase Edge Function (for text extraction only)
  private async processPDFWithEdgeFunction(file: File): Promise<string> {
    try {
      console.log('📡 Sending PDF to Supabase Edge Function for processing...');
      
      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer();
      const base64String = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('pdf-processing', {
        body: {
          fileData: base64String,
          fileName: file.name,
          userId: undefined // We'll get this from the main processReceipt method
        }
      });
      
      if (error) {
        console.error('❌ PDF processing Edge Function error:', error);
        throw new Error(`PDF processing failed: ${error.message}`);
      }
      
      if (!data || !data.extractedText) {
        throw new Error('No text extracted from PDF');
      }
      
      console.log('✅ PDF processed successfully via Edge Function');
      return data.extractedText;
      
    } catch (error) {
      console.error('❌ PDF processing failed:', error);
      
      // Return fallback text based on filename
      const fileName = file.name.toLowerCase();
      let fallbackText = `PDF RECEIPT - ${file.name}
Date: ${new Date().toLocaleDateString()}
Note: PDF processing failed - please verify details manually
File: ${file.name}`;

      // Add some context based on filename
      if (fileName.includes('starbucks') || fileName.includes('coffee')) {
        fallbackText += `
Merchant: Starbucks
Category: Food & Beverage
Amount: Please verify manually`;
      } else if (fileName.includes('uber') || fileName.includes('taxi') || fileName.includes('lyft')) {
        fallbackText += `
Merchant: Ride Service
Category: Transportation  
Amount: Please verify manually`;
      } else if (fileName.includes('office') || fileName.includes('supplies')) {
        fallbackText += `
Merchant: Office Supplies
Category: Office Supplies
Amount: Please verify manually`;
      } else {
        fallbackText += `
Merchant: Please verify manually
Amount: Please verify manually`;
      }
      
      return fallbackText;
    }
  }

  // Upload receipt file to Supabase storage
  private async uploadReceiptFile(file: File, userId: string): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `receipts/${userId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('receipts')
        .upload(filePath, file);

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('receipts')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('❌ File upload failed:', error);
      throw new Error('Failed to upload receipt file');
    }
  }

  // Main method to process a receipt file
  async processReceipt(file: File, userId?: string): Promise<ReceiptProcessingResult> {
    try {
      console.log('📄 Processing receipt:', file.name);

      // Validate file
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Handle PDF files using Edge Function (which returns full result)
      if (file.type === 'application/pdf') {
        console.log('📄 Processing PDF with Edge Function...');
        return await this.processPDFReceipt(file, userId);
      }

      // Extract text using OCR for images
      const extractedText = await this.extractTextFromFile(file);
      console.log('📝 Extracted text:', extractedText);

      // Analyze with AI
      const result = await this.analyzeReceiptText(extractedText);

      // Upload file if user is provided
      if (userId) {
        try {
          const receiptUrl = await this.uploadReceiptFile(file, userId);
          result.receiptUrl = receiptUrl;
        } catch (uploadError) {
          console.warn('⚠️ File upload failed, continuing without URL:', uploadError);
        }
      }

      console.log('✅ Receipt processed successfully:', result);
      return result;

    } catch (error) {
      console.error('❌ Receipt processing failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const receiptProcessingService = new ReceiptProcessingService();
