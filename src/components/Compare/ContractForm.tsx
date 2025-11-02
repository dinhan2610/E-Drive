import React from 'react';
import type { ContractFormData, ContractValidationErrors } from '../../types/contract';
import styles from './ContractForm.module.scss';

interface ContractFormProps {
  formData: ContractFormData;
  errors: ContractValidationErrors;
  onChange: (field: keyof ContractFormData, value: any) => void;
}

const ContractForm: React.FC<ContractFormProps> = ({ formData, errors, onChange }) => {
  return (
    <div className={styles.contractForm}>
      {/* Buyer Information Section */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Thông tin người mua</h3>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Họ và tên *</label>
            <input
              type="text"
              value={formData.buyerName}
              onChange={(e) => onChange('buyerName', e.target.value)}
              className={errors.buyer?.name ? styles.inputError : ''}
            />
            {errors.buyer?.name && <span className={styles.errorText}>{errors.buyer.name}</span>}
          </div>

          <div className={styles.formGroup}>
            <label>Số điện thoại *</label>
            <input
              type="tel"
              value={formData.buyerPhone}
              onChange={(e) => onChange('buyerPhone', e.target.value)}
              className={errors.buyer?.phone ? styles.inputError : ''}
            />
            {errors.buyer?.phone && <span className={styles.errorText}>{errors.buyer.phone}</span>}
          </div>

          <div className={styles.formGroup}>
            <label>Email *</label>
            <input
              type="email"
              value={formData.buyerEmail}
              onChange={(e) => onChange('buyerEmail', e.target.value)}
              className={errors.buyer?.email ? styles.inputError : ''}
            />
            {errors.buyer?.email && <span className={styles.errorText}>{errors.buyer.email}</span>}
          </div>

          <div className={styles.formGroup}>
            <label>CCCD/Passport *</label>
            <input
              type="text"
              value={formData.buyerIdNumber}
              onChange={(e) => onChange('buyerIdNumber', e.target.value)}
              className={errors.buyer?.idNumber ? styles.inputError : ''}
            />
            {errors.buyer?.idNumber && (
              <span className={styles.errorText}>{errors.buyer.idNumber}</span>
            )}
          </div>

          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label>Địa chỉ *</label>
            <textarea
              value={formData.buyerAddress}
              onChange={(e) => onChange('buyerAddress', e.target.value)}
              className={errors.buyer?.address ? styles.inputError : ''}
              rows={2}
            />
            {errors.buyer?.address && (
              <span className={styles.errorText}>{errors.buyer.address}</span>
            )}
          </div>
        </div>
      </section>

      {/* Vehicle Information Section */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Thông tin xe</h3>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Model xe *</label>
            <input
              type="text"
              value={formData.vehicleModel}
              onChange={(e) => onChange('vehicleModel', e.target.value)}
              className={errors.vehicle?.model ? styles.inputError : ''}
            />
            {errors.vehicle?.model && (
              <span className={styles.errorText}>{errors.vehicle.model}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label>Phiên bản</label>
            <input
              type="text"
              value={formData.vehicleVariant || ''}
              onChange={(e) => onChange('vehicleVariant', e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Màu sắc</label>
            <input
              type="text"
              value={formData.vehicleColor || ''}
              onChange={(e) => onChange('vehicleColor', e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Năm sản xuất *</label>
            <input
              type="number"
              value={formData.vehicleYear}
              onChange={(e) => onChange('vehicleYear', parseInt(e.target.value))}
              className={errors.vehicle?.year ? styles.inputError : ''}
            />
            {errors.vehicle?.year && (
              <span className={styles.errorText}>{errors.vehicle.year}</span>
            )}
          </div>

          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label>Số VIN</label>
            <input
              type="text"
              value={formData.vehicleVin || ''}
              onChange={(e) => onChange('vehicleVin', e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Terms Section */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Điều khoản hợp đồng</h3>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Ngày ký hợp đồng *</label>
            <input
              type="date"
              value={formData.signDate}
              onChange={(e) => onChange('signDate', e.target.value)}
              className={errors.terms?.signDate ? styles.inputError : ''}
            />
            {errors.terms?.signDate && (
              <span className={styles.errorText}>{errors.terms.signDate}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label>Ngày giao xe *</label>
            <input
              type="date"
              value={formData.deliveryDate}
              onChange={(e) => onChange('deliveryDate', e.target.value)}
              className={errors.terms?.deliveryDate ? styles.inputError : ''}
            />
            {errors.terms?.deliveryDate && (
              <span className={styles.errorText}>{errors.terms.deliveryDate}</span>
            )}
          </div>

          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label>Địa điểm giao xe</label>
            <input
              type="text"
              value={formData.deliveryLocation || ''}
              onChange={(e) => onChange('deliveryLocation', e.target.value)}
            />
          </div>

          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label>Điều khoản bảo hành</label>
            <textarea
              value={formData.warrantyTerms || ''}
              onChange={(e) => onChange('warrantyTerms', e.target.value)}
              rows={3}
              placeholder="Bảo hành 3 năm hoặc 100,000 km..."
            />
          </div>

          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label>Ghi chú</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => onChange('notes', e.target.value)}
              rows={2}
              placeholder="Ghi chú thêm..."
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContractForm;
