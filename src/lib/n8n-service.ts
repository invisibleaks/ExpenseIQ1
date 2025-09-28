import { ReceiptProcessingResult } from './receipt-processing';

// n8n webhook response interface
export interface N8nPdfResponse {
  success: boolean;
  data?: {
    merchant?: string;
    amount?: number;
    description?: string;
    date?: string;
    notes?: string;
    confidence?: number;
    extractedText?: string;
  };
  error?: string;
  message?: string;
}

// n8n service configuration
export class N8nService {
  private readonly N8N_WEBHOOK_URL = 'http://localhost:5678/webhook-test/pdf_receipt_processor';
  private readonly REQUEST_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_RETRIES = 2;

  // Check if n8n service is available
  async isN8nAvailable(): Promise<boolean> {
    try {
      console.log('🔍 Checking n8n availability...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for health check
      
      // Use the base webhook URL without the query parameter for health check
      const response = await fetch(this.N8N_WEBHOOK_URL, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // n8n webhook should respond even to GET requests (though it might return an error)
      // The fact that we get a response means n8n is running
      console.log('✅ n8n service is available');
      return true;
      
    } catch (error) {
      console.warn('⚠️ n8n service not available:', error);
      return false;
    }
  }

  // Send PDF to n8n workflow for processing
  async processPdfWithN8n(file: File, userId?: string): Promise<ReceiptProcessingResult> {
    console.log('📡 Sending PDF to n8n workflow for processing...', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      userId: userId
    });
    
    try {
      // Prepare FormData for file upload (matching the curl example)
      const formData = new FormData();
      formData.append('Receipt', file);
      
      // Add query parameter for file (as shown in the curl example)
      const urlWithParams = `${this.N8N_WEBHOOK_URL}?file=null`;
      console.log('🔗 Request URL:', urlWithParams);
      
      // Send to n8n with retry logic
      const result = await this.sendWithRetry(formData, urlWithParams);
      console.log('📥 Received result from n8n:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'n8n processing failed - success flag is false');
      }

      if (!result.data) {
        throw new Error('n8n processing failed - no data in response');
      }

      // Transform n8n response to our expected format
      const processedResult: ReceiptProcessingResult = {
        merchant: result.data.merchant || 'Unknown Merchant',
        amount: result.data.amount || 0,
        description: result.data.description || 'PDF Receipt',
        date: result.data.date,
        notes: result.data.notes || 'Processed via n8n workflow',
        confidence: result.data.confidence || 0.8,
        extractedText: result.data.extractedText || `PDF processed: ${file.name}`
      };

      console.log('✅ PDF processed successfully via n8n:', processedResult);
      return processedResult;

    } catch (error) {
      console.error('❌ n8n PDF processing failed:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        fileName: file.name,
        fileSize: file.size
      });
      throw error;
    }
  }

  // Send request to n8n with retry logic
  private async sendWithRetry(formData: FormData, url: string, retryCount = 0): Promise<N8nPdfResponse> {
    try {
      console.log(`📤 Sending PDF to n8n (attempt ${retryCount + 1}/${this.MAX_RETRIES + 1})...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);
      
      const response = await fetch(url, {
        method: 'POST',
        // Don't set Content-Type header - let the browser set it automatically for FormData
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`n8n webhook returned ${response.status}: ${response.statusText}`);
      }

      // Get the raw response text first for debugging
      const responseText = await response.text();
      console.log('🔍 Raw n8n response:', responseText);

      let parsedResponse: any;
      try {
        parsedResponse = JSON.parse(responseText);
        console.log('🔍 Parsed n8n response:', parsedResponse);
      } catch (parseError) {
        console.error('❌ Failed to parse n8n response as JSON:', parseError);
        throw new Error(`Invalid JSON response from n8n: ${responseText}`);
      }

      // Handle different response formats from n8n
      let normalizedResponse: N8nPdfResponse;
      
      if (parsedResponse.success !== undefined) {
        // Already in expected format
        normalizedResponse = parsedResponse;
      } else if (parsedResponse.merchant || parsedResponse.amount || parsedResponse.description) {
        // Direct data response - wrap it in expected format
        console.log('🔄 Converting direct data response to expected format');
        normalizedResponse = {
          success: true,
          data: {
            merchant: parsedResponse.merchant,
            amount: parsedResponse.amount,
            description: parsedResponse.description,
            date: parsedResponse.date,
            notes: parsedResponse.notes,
            confidence: parsedResponse.confidence,
            extractedText: parsedResponse.extractedText
          }
        };
      } else {
        // Unknown format
        console.warn('⚠️ Unknown response format from n8n:', parsedResponse);
        throw new Error(`Unexpected response format from n8n: ${JSON.stringify(parsedResponse)}`);
      }
      
      if (!normalizedResponse.success) {
        throw new Error(normalizedResponse.error || 'n8n processing failed');
      }

      console.log('✅ Normalized n8n response:', normalizedResponse);
      return normalizedResponse;

    } catch (error) {
      console.error(`❌ n8n request failed (attempt ${retryCount + 1}):`, error);
      
      // Retry if we haven't exceeded max retries
      if (retryCount < this.MAX_RETRIES) {
        console.log(`🔄 Retrying in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.sendWithRetry(formData, url, retryCount + 1);
      }
      
      // All retries exhausted
      throw error;
    }
  }

  // Test connection to n8n
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const isAvailable = await this.isN8nAvailable();
      
      if (isAvailable) {
        return {
          success: true,
          message: 'n8n service is running and accessible'
        };
      } else {
        return {
          success: false,
          message: 'n8n service is not available. Please ensure n8n is running on localhost:5678'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Export singleton instance
export const n8nService = new N8nService();

