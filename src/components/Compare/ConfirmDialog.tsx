import React from 'react';
import styles from './ConfirmDialog.module.scss';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Huỷ bỏ',
  onConfirm,
  onCancel,
  variant = 'info',
}) => {
  return (
    <div className={styles.dialogOverlay}>
      <div className={styles.dialogBox}>
        <h3 className={styles.title}>{title}</h3>

        <div className={styles.content}>
          <p className={styles.message}>{message}</p>
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelButton} onClick={onCancel}>
            {cancelText}
          </button>
          <button className={`${styles.confirmButton} ${styles[variant]}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
