import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../services/chatApi';
import '../styles/ChatBoxStyles/_chatbox.scss';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ChatBoxProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({ isOpen = false, onToggle }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Xin chào! Tôi là E-Drive Assistant. Tôi có thể giúp bạn tìm hiểu về xe điện, đặt lịch lái thử, hoặc giải đáp các thắc mắc. Bạn cần hỗ trợ gì?',
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(!isOpen);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMinimized]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputText.trim();
    setInputText('');
    setIsTyping(true);

    try {
      // Call real API
      const aiResponseText = await sendChatMessage(messageToSend);
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('❌ Error getting AI response:', error);
      
      // Fallback error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau hoặc liên hệ hotline: 1900-EDRIVE',
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleChatBox = () => {
    setIsMinimized(!isMinimized);
    if (onToggle) onToggle();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function to safely format message text
  const formatMessageText = (text: any): string => {
    if (text === null || text === undefined) return '';
    if (typeof text === 'string') return text;
    if (typeof text === 'object') return JSON.stringify(text);
    return String(text);
  };

  const quickQuestions = [
    'Giá xe điện bao nhiêu?',
    'Đặt lịch lái thử',
    'Thông tin về pin',
    'Địa chỉ showroom'
  ];

  const handleQuickQuestion = (question: string) => {
    setInputText(question);
    setTimeout(() => handleSendMessage(), 100);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div 
        className={`chat-float-button ${isMinimized ? '' : 'hidden'}`}
        onClick={toggleChatBox}
      >
        <i className="fas fa-message"></i>
        <span className="notification-dot"></span>
      </div>

      {/* Chat Box */}
      <div className={`chatbox-container ${isMinimized ? 'minimized' : 'open'}`}>
        {/* Header */}
        <div className="chatbox-header">
          <div className="header-info">
                        <div className="ai-avatar">              <i className="fas fa-wand-magic-sparkles"></i>            </div>
            <div className="header-text">
              <h4>E-Drive Assistant</h4>
                            <div className="online-status">                <i className="fas fa-circle-dot"></i>                Trực tuyến              </div>
            </div>
          </div>
          <div className="header-actions">
            <button 
              className="minimize-btn"
              onClick={toggleChatBox}
              aria-label="Thu nhỏ chat"
            >
              <i className="fas fa-xmark"></i>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="chatbox-messages">
          {messages.length === 1 && (
            <div className="quick-questions">
              <p>Các câu hỏi thường gặp:</p>
              <div className="quick-buttons">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    className="quick-btn"
                    onClick={() => handleQuickQuestion(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.sender === 'user' ? 'user-message' : 'ai-message'}`}
            >
              {message.sender === 'ai' && (
                <div className="message-avatar">
                  <i className="fas fa-wand-magic-sparkles"></i>
                </div>
              )}
              <div className="message-content">
                <div className="message-text">
                  {formatMessageText(message.text).split('\n').map((line, index, array) => (
                    <React.Fragment key={index}>
                      {line}
                      {index < array.length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
                <div className="message-time">
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="message ai-message typing-message">
              <div className="message-avatar">
                <i className="fas fa-wand-magic-sparkles"></i>
              </div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="chatbox-input">
          <div className="input-container">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập câu hỏi của bạn..."
              disabled={isTyping}
            />
            <button
              className="send-btn"
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isTyping}
              aria-label="Gửi tin nhắn"
            >
              <i className="fas fa-arrow-up"></i>
            </button>
          </div>
          <div className="input-footer">
            <span>Powered by E-Drive AI</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatBox;