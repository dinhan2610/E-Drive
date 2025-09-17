import React, { useState, useEffect } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

interface AuthManagerProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onAuthSuccess?: (userData: any) => void;
}

const AuthManager: React.FC<AuthManagerProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onAuthSuccess
}) => {
  const [currentMode, setCurrentMode] = useState<'login' | 'register'>(initialMode);

  // Đồng bộ currentMode với initialMode khi props thay đổi
  useEffect(() => {
    setCurrentMode(initialMode);
  }, [initialMode]);

  const handleSwitchToRegister = () => {
    setCurrentMode('register');
  };

  const handleSwitchToLogin = () => {
    setCurrentMode('login');
  };

  const handleLoginSuccess = (userData: any) => {
    if (onAuthSuccess) {
      onAuthSuccess(userData);
    }
  };

  const handleRegisterSuccess = (userData: any) => {
    if (onAuthSuccess) {
      onAuthSuccess(userData);
    }
  };

  const handleClose = () => {
    // Reset về initial mode khi đóng modal
    setCurrentMode(initialMode);
    onClose();
  };

  // Đảm bảo modal luôn hiển thị đúng form khi mở
  useEffect(() => {
    if (isOpen) {
      setCurrentMode(initialMode);
    }
  }, [isOpen, initialMode]);

  return (
    <>
      {currentMode === 'login' ? (
        <LoginForm
          isOpen={isOpen}
          onClose={handleClose}
          onSwitchToRegister={handleSwitchToRegister}
          onLoginSuccess={handleLoginSuccess}
        />
      ) : (
        <RegisterForm
          isOpen={isOpen}
          onClose={handleClose}
          onSwitchToLogin={handleSwitchToLogin}
          onRegisterSuccess={handleRegisterSuccess}
        />
      )}
    </>
  );
};

export default AuthManager;