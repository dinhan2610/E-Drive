import React from 'react';
import { toVND } from '../../utils/currency';
import styles from './DownPaymentInput.module.scss';

interface DownPaymentInputProps {
  carPrice: number;
  value: number;
  onValueChange: (value: number) => void;
}

const DownPaymentInput: React.FC<DownPaymentInputProps> = ({
  carPrice,
  value,
  onValueChange,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const percent = parseFloat(inputValue) || 30;
    
    // Giới hạn: tối thiểu 30%, tối đa 90%
    if (percent >= 30 && percent <= 90) {
      onValueChange(percent);
    } else if (percent < 30) {
      onValueChange(30);
    } else if (percent > 90) {
      onValueChange(90);
    }
  };

  return (
    <div className={styles.downPaymentInput}>
      <label className={styles.label}>
        <i className="fas fa-percent"></i>
        Trả trước (%)
      </label>
      
      <div className={styles.inputWrapper}>
        <input
          type="number"
          className={styles.input}
          value={value}
          onChange={handleInputChange}
          placeholder="30"
          min="30"
          max="90"
          step="5"
        />
        <span className={styles.suffix}>%</span>
      </div>

      <div className={styles.hint}>
        <i className="fas fa-info-circle"></i>
        Số tiền: {toVND((carPrice * value) / 100)} (Tối thiểu 30%, tối đa 90%)
      </div>
    </div>
  );
};

export default DownPaymentInput;