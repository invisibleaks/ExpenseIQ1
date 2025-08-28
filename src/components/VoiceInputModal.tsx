import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, CheckCircle, AlertCircle, X, Volume2, VolumeX } from 'lucide-react';
import { VoiceInputResult } from './VoiceInputButton';

interface VoiceInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVoiceResult: (result: VoiceInputResult) => void;
}

const VoiceInputModal: React.FC<VoiceInputModalProps> = ({ isOpen, onClose, onVoiceResult }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check if browser supports speech recognition
  const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  useEffect(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    const recognition = recognitionRef.current;
    
    // Configure recognition settings
    recognition.continuous = false;
    recognition.interimResults = true; // Show interim results
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    // Event handlers
    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setSuccess(false);
      setTranscript('');
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      setTranscript(finalTranscript + interimTranscript);
      
      // If we have final results, process them
      if (finalTranscript) {
        const confidence = event.results[event.results.length - 1][0].confidence;
        
        setIsListening(false);
        setIsProcessing(true);
        
        // Process the result
        setTimeout(() => {
          const result: VoiceInputResult = {
            text: finalTranscript,
            confidence: confidence
          };
          
          onVoiceResult(result);
          setIsProcessing(false);
          setSuccess(true);
          
          // Close modal after success
          setTimeout(() => {
            onClose();
          }, 1500);
        }, 500);
      }
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      setIsProcessing(false);
      
      let errorMessage = 'Speech recognition failed';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone access denied. Please check permissions.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your connection.';
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }
      
      setError(errorMessage);
      
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    };

    recognition.onend = () => {
      if (isListening) {
        setIsListening(false);
      }
    };

    return () => {
      if (recognition.current) {
        recognition.current.stop();
      }
    };
  }, [isSupported, onVoiceResult, onClose]);

  const startListening = () => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.start();
    } catch (err) {
      setError('Failed to start speech recognition');
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.stop();
    } catch (err) {
      console.error('Error stopping recognition:', err);
    }
  };

  const handleClose = () => {
    if (isListening) {
      stopListening();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Voice Input</h2>
              <p className="text-sm text-gray-600">Speak your expense details</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!isSupported ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <span className="text-sm text-yellow-700">
                  Speech recognition not supported in this browser
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Voice Input Button */}
              <div className="text-center">
                <button
                  onClick={isListening ? stopListening : startListening}
                  disabled={isProcessing}
                  className={`w-24 h-24 rounded-full flex items-center justify-center transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg ${
                    isListening
                      ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                      : success
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600'
                  }`}
                >
                  {isProcessing ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : success ? (
                    <CheckCircle className="w-8 h-8" />
                  ) : isListening ? (
                    <MicOff className="w-8 h-8" />
                  ) : (
                    <Mic className="w-8 h-8" />
                  )}
                </button>
                
                <p className="mt-4 text-sm text-gray-600">
                  {isListening ? 'Click to stop listening' : 'Click to start speaking'}
                </p>
              </div>

              {/* Status Messages */}
              {isListening && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <div>
                      <p className="text-sm font-medium text-blue-800">Listening...</p>
                      <p className="text-xs text-blue-600">Speak clearly into your microphone</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Live Transcript */}
              {transcript && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Volume2 className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">What I heard:</span>
                  </div>
                  <p className="text-sm text-gray-800 bg-white p-3 rounded border">
                    {transcript}
                  </p>
                </div>
              )}

              {/* Error Messages */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700">
                      Voice input captured successfully! Processing...
                    </span>
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="text-sm font-medium text-gray-800 mb-2">Voice Input Tips:</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Speak clearly and at a normal pace</li>
                  <li>• Include the amount, merchant, and description</li>
                  <li>• Example: "I spent $25 on lunch at McDonald's yesterday"</li>
                  <li>• The form will be auto-filled with your voice input</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">
              {isListening ? 'Click the button to stop recording' : 'Click the button to start recording'}
            </p>
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceInputModal;
