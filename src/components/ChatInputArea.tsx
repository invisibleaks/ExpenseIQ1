import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Paperclip, Camera, Square } from 'lucide-react';

// Voice input types
interface VoiceInputResult {
  text: string;
  confidence: number;
}

type VoiceState = 'idle' | 'recording' | 'processing';

interface ChatInputAreaProps {
  onSendMessage: (message: string) => void;
  onVoiceInput?: () => void;
  onFileUpload?: () => void;
  onCameraCapture?: () => void;
  disabled?: boolean;
  placeholder?: string;
  isProcessing?: boolean;
}

const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  onSendMessage,
  onVoiceInput,
  onFileUpload,
  onCameraCapture,
  disabled = false,
  placeholder = "Type your message...",
  isProcessing = false
}) => {
  const [message, setMessage] = useState('');
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const voiceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if browser supports speech recognition
  const isVoiceSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  // Initialize speech recognition (only once)
  useEffect(() => {
    if (!isVoiceSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    const recognition = recognitionRef.current;
    
    // Configure recognition settings
    recognition.continuous = false;
    recognition.interimResults = true; // Enable live transcript
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    // Event handlers
    recognition.onstart = () => {
      console.log('🎤 Voice recording started');
      setVoiceState('recording');
      setVoiceTranscript('');
      setInterimTranscript('');
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimText = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimText += transcript;
        }
      }
      
      if (finalTranscript) {
        setVoiceTranscript(prev => prev + finalTranscript);
      }
      setInterimTranscript(interimText);
    };

    recognition.onend = () => {
      console.log('🎤 Voice recording ended');
      
      // Clear the timeout
      if (voiceTimeoutRef.current) {
        clearTimeout(voiceTimeoutRef.current);
        voiceTimeoutRef.current = null;
      }
      
      setVoiceState('processing');
      
      // Auto-send the transcript after a short delay
      setTimeout(() => {
        setVoiceState(currentState => {
          if (currentState === 'processing') {
            // Get the latest transcript values
            setVoiceTranscript(currentTranscript => {
              setInterimTranscript(currentInterim => {
                const finalText = currentTranscript || currentInterim;
                if (finalText.trim()) {
                  onSendMessage(finalText.trim());
                }
                return '';
              });
              return '';
            });
            return 'idle';
          }
          return currentState;
        });
      }, 500);
    };

    recognition.onerror = (event) => {
      console.error('🎤 Speech recognition error:', event.error);
      
      // Clear the timeout
      if (voiceTimeoutRef.current) {
        clearTimeout(voiceTimeoutRef.current);
        voiceTimeoutRef.current = null;
      }
      
      setVoiceState('idle');
      setVoiceTranscript('');
      setInterimTranscript('');
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (voiceTimeoutRef.current) {
        clearTimeout(voiceTimeoutRef.current);
        voiceTimeoutRef.current = null;
      }
    };
  }, [isVoiceSupported, onSendMessage]); // Remove state dependencies to prevent recreation

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled && !isProcessing) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Voice control functions
  const startVoiceRecording = () => {
    if (!recognitionRef.current || !isVoiceSupported || disabled || isProcessing) return;
    
    try {
      console.log('🎤 Starting voice recording');
      recognitionRef.current.start();
      
      // Set a timeout to automatically stop recording after 30 seconds
      voiceTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Voice recording timeout - auto stopping');
        stopVoiceRecording();
      }, 30000);
    } catch (error) {
      console.error('Failed to start voice recording:', error);
    }
  };

  const stopVoiceRecording = () => {
    if (!recognitionRef.current) return;
    
    try {
      console.log('🛑 Stopping voice recording manually');
      
      // Clear the timeout
      if (voiceTimeoutRef.current) {
        clearTimeout(voiceTimeoutRef.current);
        voiceTimeoutRef.current = null;
      }
      
      setVoiceState('processing');
      recognitionRef.current.stop();
      
      // Note: Don't send message here - let the onend handler do it
      // This prevents duplicate sends when manually stopping
    } catch (error) {
      console.error('Failed to stop voice recording:', error);
      setVoiceState('idle');
      setVoiceTranscript('');
      setInterimTranscript('');
    }
  };

  const handleVoiceClick = () => {
    console.log('🎤 Voice button clicked, current state:', voiceState);
    if (voiceState === 'recording') {
      stopVoiceRecording();
    } else if (voiceState === 'idle') {
      startVoiceRecording();
    }
  };

  const canSend = message.trim().length > 0 && !disabled && !isProcessing;
  const isInVoiceMode = voiceState !== 'idle';
  const displayText = isInVoiceMode ? 
    (voiceTranscript + interimTranscript) : message;

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        {/* Action Buttons - Left Side */}
        <div className="flex items-center space-x-2">
          {/* Voice Input Button */}
          {isVoiceSupported && (
            <button
              type="button"
              onClick={handleVoiceClick}
              disabled={disabled || isProcessing || voiceState === 'processing'}
              className={`p-2 rounded-lg transition-all transform ${
                voiceState === 'recording'
                  ? 'bg-red-500 text-white animate-pulse scale-110 shadow-lg'
                  : voiceState === 'processing'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={
                voiceState === 'recording' 
                  ? 'Stop recording' 
                  : voiceState === 'processing'
                  ? 'Processing...'
                  : 'Start voice input'
              }
            >
              {voiceState === 'recording' ? (
                <Square className="w-5 h-5" />
              ) : voiceState === 'processing' ? (
                <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>
          )}

          {/* File Upload Button */}
          {onFileUpload && (
            <button
              type="button"
              onClick={onFileUpload}
              disabled={disabled || isProcessing}
              className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Upload receipt"
            >
              <Paperclip className="w-5 h-5" />
            </button>
          )}

          {/* Camera Button */}
          {onCameraCapture && (
            <button
              type="button"
              onClick={onCameraCapture}
              disabled={disabled || isProcessing}
              className="p-2 text-gray-500 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Take photo"
            >
              <Camera className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Text Input / Voice Display */}
        <div className="flex-1 relative">
          {isInVoiceMode ? (
            /* Voice Mode - Live Transcript Display */
            <div className={`w-full px-4 py-3 pr-12 border rounded-2xl min-h-[48px] flex items-center transition-all ${
              voiceState === 'recording'
                ? 'border-red-300 bg-red-50 dark:bg-red-900/10 dark:border-red-600'
                : 'border-blue-300 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-600'
            }`}>
              {voiceState === 'recording' && (
                <div className="flex items-center space-x-2 mr-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-red-600 dark:text-red-400 font-medium">Recording...</span>
                </div>
              )}
              
              <div className="flex-1">
                {displayText ? (
                  <div className="text-gray-900 dark:text-gray-100">
                    {voiceTranscript && (
                      <span className="font-medium">{voiceTranscript}</span>
                    )}
                    {interimTranscript && (
                      <span className="text-gray-500 italic">{interimTranscript}</span>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-500 dark:text-gray-400 italic">
                    {voiceState === 'recording' ? 'Speak now...' : 'Processing voice input...'}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Text Mode - Normal Input */
            <>
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isProcessing ? "Processing..." : placeholder}
                disabled={disabled || isProcessing}
                className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all max-h-32 min-h-[48px]"
                rows={1}
              />
              
              {/* Character count (optional) */}
              {message.length > 100 && (
                <div className="absolute bottom-1 right-14 text-xs text-gray-400">
                  {message.length}/500
                </div>
              )}
            </>
          )}
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!canSend || isInVoiceMode}
          className={`p-3 rounded-2xl transition-all transform ${
            canSend && !isInVoiceMode
              ? 'bg-blue-500 hover:bg-blue-600 text-white hover:scale-105 shadow-lg hover:shadow-xl'
              : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
          }`}
          title={isInVoiceMode ? 'Voice input active' : 'Send message'}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      {/* Status Indicators */}
      {isProcessing && (
        <div className="mt-2 flex items-center justify-center">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span>Processing your request...</span>
          </div>
        </div>
      )}

      {voiceState === 'recording' && (
        <div className="mt-2 flex items-center justify-center">
          <div className="flex items-center space-x-2 text-sm text-red-600 dark:text-red-400">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span>Listening... Click the stop button or stop speaking to finish</span>
          </div>
        </div>
      )}

      {voiceState === 'processing' && (
        <div className="mt-2 flex items-center justify-center">
          <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
            <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-500 border-t-transparent"></div>
            <span>Processing voice input...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInputArea;
