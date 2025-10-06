import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Paperclip, Camera } from 'lucide-react';

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const canSend = message.trim().length > 0 && !disabled && !isProcessing;

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        {/* Action Buttons - Left Side */}
        <div className="flex items-center space-x-2">
          {/* Voice Input Button */}
          {onVoiceInput && (
            <button
              type="button"
              onClick={onVoiceInput}
              disabled={disabled || isProcessing}
              className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Voice input"
            >
              <Mic className="w-5 h-5" />
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

        {/* Text Input */}
        <div className="flex-1 relative">
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
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!canSend}
          className={`p-3 rounded-2xl transition-all transform ${
            canSend
              ? 'bg-blue-500 hover:bg-blue-600 text-white hover:scale-105 shadow-lg hover:shadow-xl'
              : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
          }`}
          title="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="mt-2 flex items-center justify-center">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span>Processing your request...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInputArea;
