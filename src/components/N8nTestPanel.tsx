import React, { useState } from 'react';
import { receiptProcessingService } from '../lib/receipt-processing';
import { n8nService } from '../lib/n8n-service';
import { CheckCircle, XCircle, Loader2, TestTube, FileText, Upload } from 'lucide-react';

interface N8nTestPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const N8nTestPanel: React.FC<N8nTestPanelProps> = ({ isOpen, onClose }) => {
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [pdfTestResult, setPdfTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPdfTesting, setIsPdfTesting] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const testN8nConnection = async () => {
    setIsLoading(true);
    setTestResult(null);
    setDebugLogs([]);
    
    try {
      addDebugLog('Testing n8n connection...');
      const result = await n8nService.testConnection();
      addDebugLog(`Connection test result: ${result.success ? 'SUCCESS' : 'FAILED'} - ${result.message}`);
      setTestResult(result);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Test failed';
      addDebugLog(`Connection test error: ${errorMsg}`);
      setTestResult({
        success: false,
        message: errorMsg
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testPdfProcessing = async () => {
    setIsPdfTesting(true);
    setPdfTestResult(null);
    
    try {
      // Create a test file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf';
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          addDebugLog('No file selected');
          setIsPdfTesting(false);
          return;
        }
        
        addDebugLog(`Testing PDF processing with file: ${file.name} (${file.size} bytes)`);
        
        try {
          const result = await n8nService.processPdfWithN8n(file, 'test-user');
          addDebugLog('PDF processing successful!');
          setPdfTestResult({ success: true, data: result });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'PDF processing failed';
          addDebugLog(`PDF processing error: ${errorMsg}`);
          setPdfTestResult({ success: false, error: errorMsg });
        } finally {
          setIsPdfTesting(false);
        }
      };
      
      input.click();
    } catch (error) {
      addDebugLog(`PDF test setup error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsPdfTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <TestTube className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">n8n Debug Panel</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600">
            <strong>n8n Webhook URL:</strong><br />
            http://localhost:5678/webhook-test/pdf_receipt_processor
          </div>

          {/* Connection Test */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">1. Connection Test</h4>
            <button
              onClick={testN8nConnection}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Testing Connection...</span>
                </>
              ) : (
                <>
                  <TestTube className="w-4 h-4" />
                  <span>Test n8n Connection</span>
                </>
              )}
            </button>

            {testResult && (
              <div className={`p-3 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center space-x-2">
                  {testResult.success ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                    {testResult.success ? 'Connection Successful' : 'Connection Failed'}
                  </span>
                </div>
                <p className={`text-xs mt-1 ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                  {testResult.message}
                </p>
              </div>
            )}
          </div>

          {/* PDF Test */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">2. PDF Processing Test</h4>
            <button
              onClick={testPdfProcessing}
              disabled={isPdfTesting}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPdfTesting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing PDF...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>Test PDF Processing</span>
                </>
              )}
            </button>

            {pdfTestResult && (
              <div className={`p-3 rounded-lg ${pdfTestResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center space-x-2">
                  {pdfTestResult.success ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${pdfTestResult.success ? 'text-green-700' : 'text-red-700'}`}>
                    {pdfTestResult.success ? 'PDF Processing Successful' : 'PDF Processing Failed'}
                  </span>
                </div>
                {pdfTestResult.success ? (
                  <div className="mt-2 text-xs text-green-700">
                    <pre className="bg-green-100 p-2 rounded text-xs overflow-x-auto">
                      {JSON.stringify(pdfTestResult.data, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <p className="text-xs mt-1 text-red-600">
                    {pdfTestResult.error}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Debug Logs */}
          {debugLogs.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-800">Debug Logs</h4>
              <div className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs font-mono max-h-40 overflow-y-auto">
                {debugLogs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>Troubleshooting:</strong></p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>Ensure n8n is running on localhost:5678</li>
              <li>Check that your PDF processing workflow is active</li>
              <li>Verify the webhook URL matches exactly</li>
              <li>Check browser console for additional error details</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default N8nTestPanel;

