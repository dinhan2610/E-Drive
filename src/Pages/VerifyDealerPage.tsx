import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../services/authApi';
import '../styles/AuthStyles/_authforms.scss';

const VerifyDealerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyAccount = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('Token xác thực không hợp lệ hoặc không tồn tại.');
        return;
      }


      try {
        const result = await authApi.verifyDealer(token);
        
        if (result.success) {
          setStatus('success');
          setMessage(result.message || 'Xác thực tài khoản đại lý thành công! Hệ thống đã gửi email thông báo cho đại lý.');
          
          // Redirect to home after 5 seconds
          setTimeout(() => {
            navigate('/');
          }, 5000);
        } else {
          setStatus('error');
          setMessage(result.message || 'Xác thực thất bại. Vui lòng thử lại.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Có lỗi xảy ra trong quá trình xác thực. Vui lòng thử lại sau.');
        console.error('Verify error:', error);
      }
    };

    verifyAccount();
  }, [searchParams, navigate]);

  return (
    <div className="auth-overlay" style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div className="auth-modal" style={{ 
        maxWidth: '500px',
        width: '90%',
        padding: '3rem 2rem',
        textAlign: 'center'
      }}>
        <div className="auth-header">
          {status === 'loading' && (
            <>
              <div className="auth-logo" style={{ marginBottom: '1.5rem' }}>
                <div className="loading-spinner" style={{ 
                  width: '60px', 
                  height: '60px',
                  border: '4px solid rgba(255, 77, 48, 0.2)',
                  borderTopColor: '#ff4d30',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
              </div>
              <h2>Đang xác thực tài khoản...</h2>
              <p>Vui lòng đợi trong giây lát</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="auth-logo" style={{ marginBottom: '1.5rem' }}>
                <i className="fas fa-check-circle" style={{ 
                  fontSize: '4rem', 
                  color: '#10B981'
                }}></i>
              </div>
              <h2 style={{ color: '#10B981', marginBottom: '1rem' }}>Xác thực thành công!</h2>
              <p style={{ 
                fontSize: '1rem', 
                lineHeight: '1.6',
                color: '#64748b',
                marginBottom: '1.5rem'
              }}>
                {message}
              </p>
              <p style={{ 
                fontSize: '0.9rem',
                color: '#94a3b8'
              }}>
                Đang chuyển hướng về trang chủ...
              </p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="auth-logo" style={{ marginBottom: '1.5rem' }}>
                <i className="fas fa-exclamation-circle" style={{ 
                  fontSize: '4rem', 
                  color: '#EF4444'
                }}></i>
              </div>
              <h2 style={{ color: '#EF4444', marginBottom: '1rem' }}>Xác thực thất bại</h2>
              <p style={{ 
                fontSize: '1rem', 
                lineHeight: '1.6',
                color: '#64748b',
                marginBottom: '2rem'
              }}>
                {message}
              </p>
              <button 
                onClick={() => navigate('/')}
                style={{
                  background: 'linear-gradient(135deg, #ff4d30 0%, #ff6b47 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 32px',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 77, 48, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Về trang chủ
              </button>
            </>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default VerifyDealerPage;

