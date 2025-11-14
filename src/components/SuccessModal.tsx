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
          icon: 'fas fa-car',
          iconBg: 'linear-gradient(135deg, #ff4d30 0%, #ff6b47 100%)',
          iconShadow: 'rgba(255, 77, 48, 0.4)',
          mainTitle: title || 'Chào mừng đến với E-Drive!',
          subtitle: userName ? `Xin chào ${userName}!` : 'Tài khoản đã được tạo thành công!',
          description: message || 'Bạn đã trở thành thành viên của E-Drive. Hãy khám phá những chiếc xe tuyệt vời và trải nghiệm dịch vụ đẳng cấp!',
          buttonText: 'Bắt đầu khám phá',
          bgColor: '#ff4d30'
        };
      case 'login':
        return {
          icon: 'fas fa-circle-check',
          iconBg: 'linear-gradient(135deg, #ff4d30 0%, #ff6b47 100%)',
          iconShadow: 'rgba(255, 77, 48, 0.4)',
          mainTitle: title || 'Chào mừng trở lại E-Drive!',
          subtitle: userName ? `Xin chào ${userName}!` : 'Đăng nhập thành công!',
          description: message || 'Sẵn sàng khám phá những chiếc xe tuyệt vời và trải nghiệm dịch vụ chất lượng cao nhất!',
          buttonText: 'Bắt đầu khám phá',
          bgColor: '#ff4d30'
        };
      default:
        return {
          icon: 'fas fa-check-circle',
          iconBg: 'linear-gradient(135deg, #ff4d30 0%, #ff6b47 100%)',
          iconShadow: 'rgba(255, 77, 48, 0.4)',
          mainTitle: title || 'Đặt lịch thành công!',
          subtitle: '',
          description: message || 'Chúng tôi sẽ liên hệ với bạn để xác nhận lịch hẹn trong thời gian sớm nhất. Cảm ơn bạn đã tin tưởng E-Drive!',
          buttonText: 'Hoàn tất',
          bgColor: '#ff4d30'
        };
    }
  };

  const content = getModalContent();

  // Add CSS animations - memoize to avoid recreation
  React.useEffect(() => {
    if (isOpen && !document.head.querySelector('#success-modal-animations')) {
      const style = document.createElement('style');
      style.id = 'success-modal-animations';
      style.textContent = `
        @keyframes modalFadeIn {
          0% {
            opacity: 0;
            transform: scale(0.85) translateY(-30px);
            filter: blur(2px);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.02) translateY(-5px);
            filter: blur(0.5px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: blur(0);
          }
        }
        
        @keyframes successScale {
          0% {
            opacity: 0;
            transform: scale(0.2) rotate(-10deg);
          }
          50% {
            opacity: 1;
            transform: scale(1.1) rotate(5deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }
        
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
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
        
        @keyframes fadeIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, [isOpen]);

  const modalContent = (
    <div style={{
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '999999',
      pointerEvents: 'all',
      backdropFilter: 'blur(12px)',
      animation: 'fadeIn 0.2s ease-out'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#fefefe',
        padding: '3.5rem 3rem',
        borderRadius: '32px',
        maxWidth: '520px',
        width: '92%',
        textAlign: 'center' as const,
        boxShadow: '0 50px 100px rgba(255, 77, 48, 0.15), 0 20px 40px rgba(0, 0, 0, 0.1)',
        pointerEvents: 'all',
        animation: 'modalFadeIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        position: 'relative',
        overflow: 'hidden',
        border: '2px solid rgba(255, 77, 48, 0.1)',
        fontFamily: '"Roboto", sans-serif'
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
          width: '140px',
          height: '140px',
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
            <i className={content.icon}></i>
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
            fontSize: '2.2rem',
            fontWeight: '800',
            margin: '0 0 0.5rem 0',
            background: `linear-gradient(135deg, ${content.bgColor}, #2d3748)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'fadeInUp 0.5s ease-out 0.3s both',
            fontFamily: '"Roboto", sans-serif',
            letterSpacing: '-0.02em'
          }}>
            {content.mainTitle}
          </h2>
          
          {content.subtitle && (
            <h3 style={{
              color: content.bgColor,
              marginBottom: '1rem',
              fontSize: '1.35rem',
              fontWeight: '600',
              margin: '0 0 1.2rem 0',
              animation: 'fadeInUp 0.5s ease-out 0.4s both',
              fontFamily: '"Roboto", sans-serif',
              letterSpacing: '-0.01em'
            }}>
              {content.subtitle}
            </h3>
          )}
          
          <p style={{
            color: '#64748b',
            marginBottom: '2.5rem',
            lineHeight: '1.7',
            fontSize: '1rem',
            margin: '0 0 2.5rem 0',
            animation: 'fadeInUp 0.5s ease-out 0.5s both',
            fontFamily: '"Roboto", sans-serif',
            fontWeight: '400'
          }}>
            {content.description}
          </p>
        </div>

        {/* Action Button */}
        <button onClick={handleContinue} style={{
          background: `linear-gradient(135deg, ${content.bgColor}, ${content.bgColor}dd)`,
          color: 'white',
          border: 'none',
          padding: '18px 40px',
          borderRadius: '16px',
          fontSize: '1.05rem',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          fontFamily: '"Roboto", sans-serif',
          letterSpacing: '0.01em',
          boxShadow: `0 8px 24px ${content.iconShadow}`,
          position: 'relative',
          zIndex: 1,
          animation: 'bounceIn 0.6s ease-out 0.6s both'
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