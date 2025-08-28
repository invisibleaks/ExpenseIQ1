import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface VoiceInputButtonProps {
  onVoiceResult: (result: VoiceInputResult) => void;
  disabled?: boolean;
}

export interface VoiceInputResult {
  text: string;
  confidence: number;
  error?: string;
}

const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({ onVoiceResult, disabled = false }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
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
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    // Event handlers
    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setSuccess(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const confidence = event.results[0][0].confidence;
      
      setIsListening(false);
      setIsProcessing(true);
      
      // Process the result
      setTimeout(() => {
        const result: VoiceInputResult = {
          text: transcript,
          confidence: confidence
        };
        
        onVoiceResult(result);
        setIsProcessing(false);
        setSuccess(true);
        
        // Reset success state after a moment
        setTimeout(() => setSuccess(false), 2000);
      }, 500);
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
  }, [isSupported, onVoiceResult]);

  const startListening = () => {
    if (!recognitionRef.current || disabled) return;
    
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

  if (!isSupported) {
    return (
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-yellow-600" />
          <span className="text-sm text-yellow-700">
            Speech recognition not supported in this browser
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Voice Input Button */}
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        disabled={disabled || isProcessing}
        className={`w-full flex items-center justify-center space-x-3 py-3 px-6 rounded-xl font-semibold transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg ${
          isListening
            ? 'bg-red-500 text-white hover:bg-red-600'
            : success
            ? 'bg-green-500 text-white hover:bg-green-600'
            : 'bg-brand-dark-teal text-white hover:bg-brand-dark-teal/90'
        }`}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processing...</span>
          </>
        ) : success ? (
          <>
            <CheckCircle className="w-5 h-5" />
            <span>Voice Captured!</span>
          </>
        ) : isListening ? (
          <>
            <MicOff className="w-5 h-5" />
            <span>Click to Stop</span>
          </>
        ) : (
          <>
            <Mic className="w-5 h-5" />
            <span>Click to Speak</span>
          </>
        )}
      </button>

      {/* Status Messages */}
      {isListening && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-blue-700 font-medium">
              Listening... Speak now!
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-600 text-center">
          <strong>Voice Input Tips:</strong><br />
          Say something like: "I spent $25 on lunch at McDonald's yesterday"
        </p>
      </div>
    </div>
  );
};

export default VoiceInputButton;
export type { VoiceInputResult };
