import React, { useState, useRef, useEffect } from 'react';
import '../styles/ChatBoxStyles/_chatbox.scss';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isTyping?: boolean;
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

  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Xe điện và sản phẩm
    if (lowerMessage.includes('xe điện') || lowerMessage.includes('ô tô điện')) {
      return 'E-Drive có đa dạng dòng xe điện từ sedan, SUV đến hatchback. Tất cả đều được trang bị công nghệ pin tiên tiến, hệ thống sạc nhanh và có thể di chuyển 300-500km một lần sạc. Bạn muốn tìm hiểu về dòng xe nào?';
    }
    
    // Giá cả
    if (lowerMessage.includes('giá') || lowerMessage.includes('bao nhiêu tiền')) {
      return 'Giá xe điện E-Drive dao động từ 800 triệu đến 2.5 tỷ VNĐ tùy theo dòng xe. Chúng tôi có nhiều gói tài chính hỗ trợ 0% lãi suất. Bạn có muốn tôi tư vấn chi tiết về gói tài chính không?';
    }
    
    // Đặt lịch lái thử
    if (lowerMessage.includes('lái thử') || lowerMessage.includes('test drive')) {
      return 'Tuyệt vời! Bạn có thể đặt lịch lái thử miễn phí tại showroom. Chỉ cần click vào nút "Đặt lịch lái thử" trên trang web hoặc tôi có thể hướng dẫn bạn đặt lịch ngay bây giờ. Bạn muốn lái thử xe nào?';
    }
    
    // Pin và sạc
    if (lowerMessage.includes('pin') || lowerMessage.includes('sạc') || lowerMessage.includes('charging')) {
      return 'Pin xe điện E-Drive có tuổi thọ 8-10 năm với bảo hành 8 năm. Thời gian sạc nhanh từ 30-80% chỉ 30 phút. Chúng tôi có mạng lưới trạm sạc rộng khắp và hỗ trợ lắp đặt sạc tại nhà. Bạn cần biết thêm gì về hệ thống sạc?';
    }
    
    // Bảo hành
    if (lowerMessage.includes('bảo hành') || lowerMessage.includes('warranty')) {
      return 'E-Drive cung cấp bảo hành toàn diện: 3 năm hoặc 100,000km cho xe, 8 năm cho pin, và bảo dưỡng miễn phí 2 năm đầu. Chúng tôi có 50+ trung tâm bảo dưỡng toàn quốc.';
    }
    
    // Địa chỉ showroom
    if (lowerMessage.includes('showroom') || lowerMessage.includes('địa chỉ') || lowerMessage.includes('ở đâu')) {
      return 'E-Drive có showroom tại Hà Nội, TP.HCM, Đà Nẵng và các tỉnh lớn. Showroom chính tại TP.HCM: 123 Đường Xe Điện, Quận 1. Bạn muốn biết địa chỉ showroom gần nhất không?';
    }
    
    // Liên hệ
    if (lowerMessage.includes('liên hệ') || lowerMessage.includes('hotline') || lowerMessage.includes('gọi')) {
      return 'Bạn có thể liên hệ với chúng tôi qua:\n📞 Hotline: 1900-EDRIVE\n📧 Email: support@e-drive.vn\n🕒 Giờ làm việc: 8:00-18:00 (T2-T7)\nHoặc để lại thông tin, chúng tôi sẽ gọi lại trong 24h.';
    }
    
    // Chào hỏi
    if (lowerMessage.includes('xin chào') || lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return 'Xin chào! Rất vui được hỗ trợ bạn. Tôi có thể giúp bạn tìm hiểu về xe điện, giá cả, đặt lịch lái thử, hoặc giải đáp thắc mắc. Bạn quan tâm đến vấn đề gì?';
    }
    
    // Cảm ơn
    if (lowerMessage.includes('cảm ơn') || lowerMessage.includes('thanks') || lowerMessage.includes('thank you')) {
      return 'Không có gì! Rất vui được hỗ trợ bạn. Nếu có thêm thắc mắc gì về xe điện E-Drive, đừng ngần ngại hỏi nhé. Chúc bạn một ngày tốt lành! 😊';
    }
    
    // Mặc định
    return 'Cảm ơn bạn đã liên hệ! Tôi có thể hỗ trợ bạn về:\n\n🚗 Thông tin xe điện và các dòng sản phẩm\n💰 Giá cả và gói tài chính\n🔋 Hệ thống pin và sạc\n🛠️ Bảo hành và bảo dưỡng\n📍 Địa chỉ showroom\n📞 Đặt lịch lái thử\n\nBạn muốn tìm hiểu về vấn đề nào?';
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateAIResponse(inputText),
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
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
                  {message.text.split('\n').map((line, index) => (
                    <React.Fragment key={index}>
                      {line}
                      {index < message.text.split('\n').length - 1 && <br />}
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