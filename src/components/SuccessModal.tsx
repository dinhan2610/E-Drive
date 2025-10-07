import React from 'react';
import { createPortal } from 'react-dom';
import type { FC } from 'react';
import '../styles/SuccesModal/_successmodal.scss';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  type?: 'success' | 'register' | 'login';
  userName?: string;
  onContinue?: () => void;
}

export const SuccessModal: FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'success',
  userName,
  onContinue
}) => {
  if (!isOpen) {
    return null;
  }

  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    } else {
      onClose();
    }
  };

  // Dynamic content based on type
  const getModalContent = () => {
    switch (type) {
      case 'register':
        return {
          icon: '🎉',
          iconBg: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
          iconShadow: 'rgba(139, 92, 246, 0.3)',
          mainTitle: title || 'Đăng ký thành công!',
          subtitle: userName ? `Chào mừng ${userName}!` : 'Chào mừng bạn!',
          description: message || 'Tài khoản của bạn đã được tạo thành công. Chúng tôi rất vui khi bạn tham gia cùng chúng tôi!',
          buttonText: 'Bắt đầu khám phá',
          bgColor: '#8B5CF6'
        };
      case 'login':
        return {
          icon: '👋',
          iconBg: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
          iconShadow: 'rgba(6, 182, 212, 0.3)',
          mainTitle: title || 'Đăng nhập thành công!',
          subtitle: userName ? `Xin chào ${userName}!` : 'Chào mừng trở lại!',
          description: message || 'Chúng tôi rất vui được gặp lại bạn. Hãy tiếp tục hành trình khám phá xe của bạn!',
          buttonText: 'Tiếp tục',
          bgColor: '#06B6D4'
        };
      default:
        return {
          icon: '✓',
          iconBg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          iconShadow: 'rgba(16, 185, 129, 0.3)',
          mainTitle: title || 'Thành công!',
          subtitle: '',
          description: message || 'Thao tác đã được thực hiện thành công.',
          buttonText: 'Tiếp tục',
          bgColor: '#10B981'
        };
    }
  };

  const content = getModalContent();

  // Add CSS animations
  React.useEffect(() => {
    if (!document.head.querySelector('#success-modal-animations')) {
      const style = document.createElement('style');
      style.id = 'success-modal-animations';
      style.textContent = `
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes successScale {
          from {
            opacity: 0;
            transform: scale(0.3);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes iconBounce {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes particle1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 1; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.7; }
        }
        
        @keyframes particle2 {
          0%, 100% { transform: translateX(0px) scale(1); opacity: 1; }
          50% { transform: translateX(15px) scale(1.2); opacity: 0.8; }
        }
        
        @keyframes particle3 {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 1; }
          50% { transform: translateY(-15px) translateX(-10px); opacity: 0.6; }
        }
        
        @keyframes particle4 {
          0%, 100% { transform: rotate(0deg) translateY(0px); opacity: 0.8; }
          50% { transform: rotate(90deg) translateY(-12px); opacity: 0.4; }
        }
        
        @keyframes particle5 {
          0%, 100% { transform: scale(1) translateX(0px); opacity: 0.9; }
          50% { transform: scale(0.8) translateX(18px); opacity: 0.3; }
        }
        
        @keyframes particle6 {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.7; }
          50% { transform: translateY(-25px) rotate(-90deg); opacity: 0.2; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const modalContent = (
    <div style={{
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '999999',
      pointerEvents: 'all',
      backdropFilter: 'blur(8px)'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'white',
        padding: '3rem 2.5rem',
        borderRadius: '24px',
        maxWidth: '480px',
        width: '90%',
        textAlign: 'center' as const,
        boxShadow: '0 32px 64px rgba(0, 0, 0, 0.2)',
        pointerEvents: 'all',
        animation: 'modalFadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden'
      }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        
        {/* Background decoration */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: `radial-gradient(circle, ${content.bgColor}10 0%, transparent 70%)`,
          pointerEvents: 'none'
        }} />

        {/* Success Icon */}
        <div style={{
          width: '120px',
          height: '120px',
          background: content.iconBg,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 2rem auto',
          position: 'relative',
          boxShadow: `0 24px 48px ${content.iconShadow}`,
          animation: 'successScale 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
        }}>
          <div style={{
            fontSize: '56px',
            animation: 'iconBounce 0.8s ease-out 0.2s both'
          }}>
            {content.icon}
          </div>
          
          {/* Floating particles */}
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: `${6 + Math.random() * 4}px`,
              height: `${6 + Math.random() * 4}px`,
              backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][i],
              borderRadius: '50%',
              top: `${20 + Math.random() * 60}%`,
              left: `${20 + Math.random() * 60}%`,
              animation: `particle${i + 1} 3s infinite ${i * 0.5}s`,
              pointerEvents: 'none'
            }} />
          ))}
        </div>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{
            color: '#1e293b',
            marginBottom: '0.5rem',
            fontSize: '2rem',
            fontWeight: '800',
            margin: '0 0 0.5rem 0',
            background: `linear-gradient(135deg, ${content.bgColor}, #1e293b)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            {content.mainTitle}
          </h2>
          
          {content.subtitle && (
            <h3 style={{
              color: content.bgColor,
              marginBottom: '1rem',
              fontSize: '1.25rem',
              fontWeight: '600',
              margin: '0 0 1rem 0'
            }}>
              {content.subtitle}
            </h3>
          )}
          
          <p style={{
            color: '#64748b',
            marginBottom: '2.5rem',
            lineHeight: '1.7',
            fontSize: '16px',
            margin: '0 0 2.5rem 0'
          }}>
            {content.description}
          </p>
        </div>

        {/* Action Button */}
        <button onClick={handleContinue} style={{
          background: `linear-gradient(135deg, ${content.bgColor}, ${content.bgColor}dd)`,
          color: 'white',
          border: 'none',
          padding: '16px 32px',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: `0 8px 24px ${content.iconShadow}`,
          position: 'relative',
          zIndex: 1
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
          (e.target as HTMLButtonElement).style.boxShadow = `0 12px 32px ${content.iconShadow}`;
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
          (e.target as HTMLButtonElement).style.boxShadow = `0 8px 24px ${content.iconShadow}`;
        }}>
          {content.buttonText}
        </button>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};