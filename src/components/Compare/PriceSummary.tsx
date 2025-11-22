import React from 'react';
import type { ContractFormData } from '../../types/contract';
import styles from './PriceSummary.module.scss';

interface PriceSummaryProps {
  formData: ContractFormData;
  onFieldChange: (field: keyof ContractFormData, value: number) => void;
}

const PriceSummary: React.FC<PriceSummaryProps> = ({ formData, onFieldChange }) => {
  const calculateTotal = () => {
    const { subtotal, discount, taxPercent, fees } = formData;
    const afterDiscount = subtotal - discount;
    const tax = afterDiscount * (taxPercent / 100);
    return afterDiscount + tax + fees;
  };

  const total = calculateTotal();

  return (
    <div className={styles.priceSummary}>
      <h3 className={styles.title}>Tổng quan giá</h3>

      <div className={styles.priceRow}>
        <label>Giá xe (VNĐ) *</label>
        <input
          type="number"
          value={formData.subtotal}
          onChange={(e) => onFieldChange('subtotal', parseFloat(e.target.value) || 0)}
          min={0}
        />
      </div>

      <div className={styles.priceRow}>
        <label>Giảm giá (VNĐ)</label>
        <input
          type="number"
          value={formData.discount}
          onChange={(e) => onFieldChange('discount', parseFloat(e.target.value) || 0)}
          min={0}
        />
      </div>

      <div className={styles.priceRow}>
        <label>Thuế (%)</label>
        <input
          type="number"
          value={formData.taxPercent}
          onChange={(e) => onFieldChange('taxPercent', parseFloat(e.target.value) || 0)}
          min={0}
          max={100}
          step={0.1}
        />
      </div>

      <div className={styles.priceRow}>
        <label>Phí khác (VNĐ)</label>
        <input
          type="number"
          value={formData.fees}
          onChange={(e) => onFieldChange('fees', parseFloat(e.target.value) || 0)}
          min={0}
        />
      </div>

      <div className={styles.divider}></div>

      <div className={styles.calculation}>
        <div className={styles.calcRow}>
          <span>Sau giảm giá:</span>
          <span>{(formData.subtotal - formData.discount).toLocaleString('vi-VN')} VNĐ</span>
        </div>
        <div className={styles.calcRow}>
          <span>Thuế ({formData.taxPercent}%):</span>
          <span>
            {((formData.subtotal - formData.discount) * (formData.taxPercent / 100)).toLocaleString(
              'vi-VN'
            )}{' '}
            VNĐ
          </span>
        </div>
        <div className={styles.calcRow}>
          <span>Phí khác:</span>
          <span>{formData.fees.toLocaleString('vi-VN')} VNĐ</span>
        </div>
      </div>

      <div className={styles.divider}></div>

      <div className={styles.totalRow}>
        <span>Tổng cộng:</span>
        <span className={styles.totalAmount}>{total.toLocaleString('vi-VN')} VNĐ</span>
      </div>
    </div>
  );
};

export default PriceSummary;
