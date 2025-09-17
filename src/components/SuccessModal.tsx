import React from 'react';
import { createPortal } from 'react-dom';
import type { FC } from 'react';
import '../styles/SuccesModal/_index.scss';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  onContinue?: () => void; // Optional continue callback
}

export const SuccessModal: FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  onContinue
}) => {
  if (!isOpen) {
    return null;
  }

  const handleContinue = () => {
    console.log("SuccessModal handleContinue called");
    if (onContinue) {
      onContinue();
    }
    // Don't call onClose() here - let onContinue handle the modal state
  };
  
  const modalContent = (
    <div style={{
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '999999',
      pointerEvents: 'all'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'white',
        padding: '2.5rem',
        borderRadius: '16px',
        maxWidth: '520px',
        width: '90%',
        textAlign: 'center' as const,
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
        pointerEvents: 'all',
        animation: 'modalFadeIn 0.3s ease-out'
      }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        
        {/* Success Icon - Professional design */}
        <div style={{
          width: '100px',
          height: '100px',
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem auto',
          position: 'relative',
          boxShadow: '0 20px 40px rgba(16, 185, 129, 0.3)',
          animation: 'successPulse 2s infinite'
        }}>
          {/* Checkmark with animation */}
          <div style={{
            fontSize: '48px',
            color: 'white',
            fontWeight: 'bold',
            animation: 'checkmarkBounce 0.6s ease-out 0.3s both'
          }}>
            ✓
          </div>
          
          {/* Success particles */}
          <div style={{
            position: 'absolute',
            top: '-10px',
            right: '10px',
            width: '8px',
            height: '8px',
            backgroundColor: '#fbbf24',
            borderRadius: '50%',
            animation: 'particle1 3s infinite'
          }}></div>
          <div style={{
            position: 'absolute',
            top: '15px',
            right: '-8px',
            width: '6px',
            height: '6px',
            backgroundColor: '#f59e0b',
            borderRadius: '50%',
            animation: 'particle2 3s infinite 0.5s'
          }}></div>
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '-5px',
            width: '10px',
            height: '10px',
            backgroundColor: '#ff4d30',
            borderRadius: '50%',
            animation: 'particle3 3s infinite 1s'
          }}></div>
        </div>

        <h3 style={{
          color: '#1e293b',
          marginBottom: '1rem',
          fontSize: '1.75rem',
          fontWeight: '700',
          margin: '0 0 1rem 0'
        }}>
          {title}
        </h3>
        <p style={{
          color: '#64748b',
          marginBottom: '2rem',
          lineHeight: '1.6',
          fontSize: '16px',
          margin: '0 0 2rem 0'
        }}>
          {message}
        </p>

        {/* Buttons Container */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap' as const
        }}>
          <button onClick={handleContinue} style={{
            backgroundColor: '#ff4d30',
            color: 'white',
            border: 'none',
            padding: '14px 28px',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            minWidth: '160px'
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = '#fa4226';
            (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = '#ff4d30';
            (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
          }}>
            Tiếp tục đăng ký
          </button>

          <button onClick={onClose} style={{
            backgroundColor: 'transparent',
            color: '#64748b',
            border: '2px solid #e2e8f0',
            padding: '14px 28px',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            minWidth: '120px'
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.borderColor = '#cbd5e1';
            (e.target as HTMLButtonElement).style.backgroundColor = '#f8fafc';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.borderColor = '#e2e8f0';
            (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
          }}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );

  // Add CSS animation keyframes to document head
  if (!document.head.querySelector('#modal-animations')) {
    const style = document.createElement('style');
    style.id = 'modal-animations';
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
      
      @keyframes successPulse {
        0%, 100% {
          transform: scale(1);
          box-shadow: 0 20px 40px rgba(16, 185, 129, 0.3);
        }
        50% {
          transform: scale(1.05);
          box-shadow: 0 25px 50px rgba(16, 185, 129, 0.4);
        }
      }
      
      @keyframes checkmarkBounce {
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
        0%, 100% {
          transform: translateY(0px) scale(1);
          opacity: 0.7;
        }
        50% {
          transform: translateY(-10px) scale(1.2);
          opacity: 1;
        }
      }
      
      @keyframes particle2 {
        0%, 100% {
          transform: translateX(0px) scale(1);
          opacity: 0.6;
        }
        50% {
          transform: translateX(8px) scale(1.1);
          opacity: 1;
        }
      }
      
      @keyframes particle3 {
        0%, 100% {
          transform: rotate(0deg) scale(1);
          opacity: 0.8;
        }
        50% {
          transform: rotate(180deg) scale(1.3);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }

  return createPortal(modalContent, document.body);
};
