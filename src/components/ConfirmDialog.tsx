import React from 'react';
import { createPortal } from 'react-dom';
import '../styles/ConfirmDialog.scss';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'success' | 'danger' | 'warning' | 'info';
  icon?: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  type = 'info',
  icon
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getIcon = () => {
    if (icon) return icon;
    switch (type) {
      case 'success':
        return 'fas fa-check-circle';
      case 'danger':
        return 'fas fa-exclamation-triangle';
      case 'warning':
        return 'fas fa-exclamation-circle';
      default:
        return 'fas fa-info-circle';
    }
  };

  const modalContent = (
    <div className="confirm-overlay" onClick={onClose}>
      <div className={`confirm-dialog ${type}`} onClick={(e) => e.stopPropagation()}>
        <div className="confirm-header">
          <div className={`confirm-icon ${type}`}>
            <i className={getIcon()}></i>
          </div>
          <h3>{title}</h3>
        </div>

        <div className="confirm-body">
          <p>{message}</p>
        </div>

        <div className="confirm-footer">
          <button 
            className="confirm-btn cancel-btn" 
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button 
            className={`confirm-btn confirm-btn-${type}`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ConfirmDialog;

