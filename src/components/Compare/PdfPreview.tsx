import React from 'react';
import type { ContractFormData } from '../../types/contract';
import styles from './PdfPreview.module.scss';

interface PdfPreviewProps {
  formData: ContractFormData;
}

const PdfPreview: React.FC<PdfPreviewProps> = ({ formData }) => {
  const calculateTotal = () => {
    const { subtotal, discount, taxPercent, fees } = formData;
    const afterDiscount = subtotal - discount;
    const tax = afterDiscount * (taxPercent / 100);
    return afterDiscount + tax + fees;
  };

  return (
    <div className={styles.pdfPreview}>
      <div className={styles.contractDocument}>
        <div className={styles.header}>
          <h1>HỢP ĐỒNG MUA BÁN XE Ô TÔ</h1>
          <div className={styles.contractCode}>Mã HĐ: {formData.orderCode}</div>
        </div>

        <section className={styles.section}>
          <h2>BÊN MUA (BÊN A)</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoRow}>
              <span className={styles.label}>Họ tên:</span>
              <span className={styles.value}>{formData.buyerName || '_______________'}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Điện thoại:</span>
              <span className={styles.value}>{formData.buyerPhone || '_______________'}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Email:</span>
              <span className={styles.value}>{formData.buyerEmail || '_______________'}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>CCCD/Passport:</span>
              <span className={styles.value}>{formData.buyerIdNumber || '_______________'}</span>
            </div>
            <div className={`${styles.infoRow} ${styles.fullWidth}`}>
              <span className={styles.label}>Địa chỉ:</span>
              <span className={styles.value}>{formData.buyerAddress || '_______________'}</span>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>BÊN BÁN (BÊN B)</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoRow}>
              <span className={styles.label}>Đại lý:</span>
              <span className={styles.value}>{formData.dealerName || '_______________'}</span>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>THÔNG TIN XE</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoRow}>
              <span className={styles.label}>Model:</span>
              <span className={styles.value}>{formData.vehicleModel || '_______________'}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Phiên bản:</span>
              <span className={styles.value}>{formData.vehicleVariant || '_______________'}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Màu sắc:</span>
              <span className={styles.value}>{formData.vehicleColor || '_______________'}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Năm sản xuất:</span>
              <span className={styles.value}>{formData.vehicleYear || '_______________'}</span>
            </div>
            <div className={`${styles.infoRow} ${styles.fullWidth}`}>
              <span className={styles.label}>Số VIN:</span>
              <span className={styles.value}>{formData.vehicleVin || '_______________'}</span>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>ĐIỀU KHOẢN HỢP ĐỒNG</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoRow}>
              <span className={styles.label}>Ngày ký:</span>
              <span className={styles.value}>{formData.signDate || '_______________'}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Ngày giao xe:</span>
              <span className={styles.value}>{formData.deliveryDate || '_______________'}</span>
            </div>
            <div className={`${styles.infoRow} ${styles.fullWidth}`}>
              <span className={styles.label}>Địa điểm giao:</span>
              <span className={styles.value}>
                {formData.deliveryLocation || '_______________'}
              </span>
            </div>
            <div className={`${styles.infoRow} ${styles.fullWidth}`}>
              <span className={styles.label}>Bảo hành:</span>
              <span className={styles.value}>{formData.warrantyTerms || '_______________'}</span>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>GIÁ TRỊ HỢP ĐỒNG</h2>
          <div className={styles.pricingTable}>
            <div className={styles.priceRow}>
              <span>Giá xe:</span>
              <span>{formData.subtotal.toLocaleString('vi-VN')} VNĐ</span>
            </div>
            <div className={styles.priceRow}>
              <span>Giảm giá:</span>
              <span>-{formData.discount.toLocaleString('vi-VN')} VNĐ</span>
            </div>
            <div className={styles.priceRow}>
              <span>Thuế ({formData.taxPercent}%):</span>
              <span>
                {(
                  (formData.subtotal - formData.discount) *
                  (formData.taxPercent / 100)
                ).toLocaleString('vi-VN')}{' '}
                VNĐ
              </span>
            </div>
            <div className={styles.priceRow}>
              <span>Phí khác:</span>
              <span>{formData.fees.toLocaleString('vi-VN')} VNĐ</span>
            </div>
            <div className={styles.totalRow}>
              <span>Tổng cộng:</span>
              <span>{calculateTotal().toLocaleString('vi-VN')} VNĐ</span>
            </div>
          </div>
        </section>

        {formData.notes && (
          <section className={styles.section}>
            <h2>GHI CHÚ</h2>
            <p className={styles.notes}>{formData.notes}</p>
          </section>
        )}

        <div className={styles.signatures}>
          <div className={styles.signatureBlock}>
            <div className={styles.signatureLabel}>BÊN MUA</div>
            <div className={styles.signatureLine}></div>
            <div className={styles.signatureName}>{formData.buyerName}</div>
          </div>
          <div className={styles.signatureBlock}>
            <div className={styles.signatureLabel}>BÊN BÁN</div>
            <div className={styles.signatureLine}></div>
            <div className={styles.signatureName}>{formData.dealerName}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfPreview;
