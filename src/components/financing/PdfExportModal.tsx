import { createPortal } from 'react-dom';
import type { FC } from 'react';
import styles from './PdfExportModal.module.scss';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error' | 'loading';
  fileName?: string;
}

export const PdfExportModal: FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  type,
  fileName
}) => {
  if (!isOpen) {
    return null;
  }

  const getModalContent = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'fas fa-file-pdf',
          iconBg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          iconShadow: 'rgba(16, 185, 129, 0.3)',
          title: 'Xuất PDF thành công!',
          message: fileName 
            ? `File "${fileName}" đã được tải xuống thành công.`
            : 'File PDF đã được tải xuống thành công.',
          buttonText: 'Đóng'
        };
      case 'error':
        return {
          icon: 'fas fa-exclamation-circle',
          iconBg: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
          iconShadow: 'rgba(239, 68, 68, 0.3)',
          title: 'Có lỗi xảy ra!',
          message: 'Không thể xuất file PDF. Vui lòng thử lại sau.',
          buttonText: 'Đóng'
        };
      case 'loading':
        return {
          icon: 'fas fa-spinner fa-spin',
          iconBg: 'linear-gradient(135deg, #ff4d30 0%, #ff6b47 100%)',
          iconShadow: 'rgba(255, 77, 48, 0.3)',
          title: 'Đang xuất PDF...',
          message: 'Vui lòng đợi trong giây lát.',
          buttonText: null
        };
    }
  };

  const content = getModalContent();

  const modalContent = (
    <div className={styles.modalOverlay} onClick={type === 'loading' ? undefined : onClose}>
      <div 
        className={`${styles.modalContent} ${styles[type]}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div 
          className={styles.iconWrapper}
          style={{
            background: content.iconBg,
            boxShadow: `0 10px 40px ${content.iconShadow}`
          }}
        >
          <i className={content.icon}></i>
        </div>

        {/* Content */}
        <h2 className={styles.title}>{content.title}</h2>
        <p className={styles.message}>{content.message}</p>

        {/* Button */}
        {content.buttonText && (
          <button 
            className={styles.button}
            onClick={onClose}
          >
            {content.buttonText}
          </button>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default PdfExportModal;
