import React from 'react';
import styles from './SignLaunchDialog.module.scss';

interface SignLaunchDialogProps {
  email: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const SignLaunchDialog: React.FC<SignLaunchDialogProps> = ({ email, onConfirm, onCancel }) => {
  return (
    <div className={styles.dialogOverlay}>
      <div className={styles.dialogBox}>
        <h3 className={styles.title}>Xác nhận gửi email ký điện tử</h3>

        <div className={styles.content}>
          <p>
            Hệ thống sẽ gửi liên kết ký điện tử đến địa chỉ email:
            <br />
            <strong>{email}</strong>
          </p>
          <p className={styles.note}>Vui lòng kiểm tra hộp thư và làm theo hướng dẫn để ký.</p>
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelButton} onClick={onCancel}>
            Huỷ bỏ
          </button>
          <button className={styles.confirmButton} onClick={onConfirm}>
            Gửi email
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignLaunchDialog;
