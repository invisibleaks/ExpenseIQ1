import React, { useEffect, useRef } from 'react';
import ChatMessage, { ChatMessageData } from './ChatMessage';

interface ChatMessageListProps {
  messages: ChatMessageData[];
  isLoading?: boolean;
  autoScroll?: boolean;
}

const ChatMessageList: React.FC<ChatMessageListProps> = ({ 
  messages, 
  isLoading = false,
  autoScroll = true 
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [messages, autoScroll]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-gray-50 dark:bg-gray-900"
      style={{ maxHeight: 'calc(100vh - 200px)' }}
    >
      {/* Welcome message or empty state */}
      {messages.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center h-full text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">💬</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Let's add your expense!
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md">
            Just tell me what you spent money on. I can understand natural language like 
            "I bought lunch at McDonald's for $12" or "Paid $50 for office supplies at Staples"
          </p>
        </div>
      )}

      {/* Messages */}
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-start space-x-3 mb-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-teal-500 text-white flex items-center justify-center">
            <span className="text-sm">🤖</span>
          </div>
          <div className="flex-1 max-w-xs">
            <div className="inline-block px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-sm shadow-sm">
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-500 ml-2">Thinking...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessageList;
