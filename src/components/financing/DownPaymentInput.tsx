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
    const percent = parseFloat(inputValue) || 0;
    
    if (percent >= 0 && percent <= 100) {
      onValueChange(percent);
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
          placeholder="20"
          min="0"
          max="100"
          step="5"
        />
        <span className={styles.suffix}>%</span>
      </div>

      <div className={styles.hint}>
        <i className="fas fa-info-circle"></i>
        Số tiền: {toVND((carPrice * value) / 100)}
      </div>
    </div>
  );
};

export default DownPaymentInput;