import React from 'react';
import { type QuotationDetailData } from '../Pages/QuoteListPage';
import styles from './QuotePDFTemplate.module.scss';

interface QuotePDFTemplateProps {
  data: QuotationDetailData;
}

/**
 * Component PDF Template - Được render ẩn và chuyển thành PDF
 * Sử dụng HTML/CSS thông thường -> html2canvas -> jsPDF
 * Ưu điểm: Font Tiếng Việt 100% chính xác, layout không bao giờ bể
 */
const QuotePDFTemplate: React.FC<QuotePDFTemplateProps> = ({ data }) => {
  const formatPrice = (price: number | undefined | null): string => {
    if (price === undefined || price === null || isNaN(price)) {
      return '0 ₫';
    }
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className={styles.pdfContainer} id="pdf-content">
      <div className={styles.pageWrapper}>
        {/* ============================================ */}
        {/* HEADER */}
        {/* ============================================ */}
        <div className={styles.header}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <i className="fas fa-car-side"></i>
            </div>
            <div className={styles.logoText}>
              <h1>VinFast E-Drive</h1>
              <p>Đại lý ủy quyền chính thức</p>
            </div>
          </div>
          <div className={styles.companyInfo}>
            <p><strong>{data.dealerName || 'VinFast E-Drive'}</strong></p>
            <p>{data.dealerAddress || '458 Minh Khai, Hai Bà Trưng, Hà Nội'}</p>
            <p>Điện thoại: {data.dealerPhone || '1900 23 23 89'}</p>
            <p>Email: {data.dealerEmail || 'contact@vinfastedrive.vn'}</p>
          </div>
        </div>

      {/* ============================================ */}
      {/* TITLE */}
      {/* ============================================ */}
      <div className={styles.title}>
        <h2>BÁO GIÁ XE ĐIỆN</h2>
        <p className={styles.quoteNumber}>Số: {data.quotationNumber}</p>
      </div>

      {/* ============================================ */}
      {/* QUOTE INFO */}
      {/* ============================================ */}
      <div className={styles.quoteInfo}>
        <div className={styles.infoRow}>
          <span className={styles.label}>Ngày báo giá:</span>
          <span className={styles.value}>{formatDate(data.quotationDate)}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>Hiệu lực đến:</span>
          <span className={styles.value}>{formatDate(data.validUntil)}</span>
        </div>
      </div>

      {/* ============================================ */}
      {/* CUSTOMER INFO */}
      {/* ============================================ */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <i className="fas fa-user-circle"></i>
          Thông tin khách hàng
        </h3>
        <div className={styles.grid2}>
          <div className={styles.gridItem}>
            <span className={styles.label}>Họ và tên:</span>
            <span className={styles.value}>{data.customerName || 'N/A'}</span>
          </div>
          <div className={styles.gridItem}>
            <span className={styles.label}>Số điện thoại:</span>
            <span className={styles.value}>{data.customerPhone || 'N/A'}</span>
          </div>
          <div className={styles.gridItem}>
            <span className={styles.label}>Email:</span>
            <span className={styles.value}>{data.customerEmail || 'N/A'}</span>
          </div>
          <div className={styles.gridItem}>
            <span className={styles.label}>Địa chỉ:</span>
            <span className={styles.value}>
              {data.customerAddress || 'N/A'}
              {data.customerCity && `, ${data.customerCity}`}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* VEHICLE INFO */}
      {/* ============================================ */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <i className="fas fa-car"></i>
          Thông tin xe
        </h3>
        <div className={styles.vehicleBox}>
          <div className={styles.vehicleName}>{data.vehicleName || 'N/A'}</div>
          <div className={styles.vehicleDetails}>
            <span><i className="fas fa-palette"></i> Màu sắc: {data.vehicleColor || 'N/A'}</span>
            <span><i className="fas fa-calendar"></i> Năm sản xuất: {data.vehicleYear || 'N/A'}</span>
            {data.vehicleModel && <span><i className="fas fa-car-side"></i> Model: {data.vehicleModel}</span>}
            {data.vehicleVersion && <span><i className="fas fa-tag"></i> Phiên bản: {data.vehicleVersion}</span>}
          </div>
          <div className={styles.vehicleDetails}>
            <span><i className="fas fa-credit-card"></i> Phương thức thanh toán: {data.paymentMethod === 'TRẢ_THẲNG' ? 'Trả thẳng' : 'Trả góp'}</span>
            {data.quantity && data.quantity > 1 && (
              <span><i className="fas fa-boxes"></i> Số lượng: {data.quantity} xe</span>
            )}
          </div>
          <div className={styles.basePrice}>
            <span>Giá niêm yết:</span>
            <span>{formatPrice(data.basePrice)}</span>
          </div>
          {data.quantity && data.quantity > 1 && data.subtotal && (
            <div className={styles.basePrice}>
              <span>Tổng giá trị xe ({data.quantity} xe):</span>
              <span>{formatPrice(data.subtotal)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* SERVICES */}
      {/* ============================================ */}
      {(data.servicesTotal || 0) > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <i className="fas fa-plus-circle"></i>
            Dịch vụ bổ sung
          </h3>
          <table className={styles.servicesTable}>
            <tbody>
              {data.additionalServices.hasTintFilm && (
                <tr>
                  <td><i className="fas fa-tint"></i> Dán phim cách nhiệt</td>
                  <td className={styles.price}>{formatPrice(data.tintFilmPrice)}</td>
                </tr>
              )}
              {data.additionalServices.hasWallboxCharger && (
                <tr>
                  <td><i className="fas fa-charging-station"></i> Wallbox sạc 7kW</td>
                  <td className={styles.price}>{formatPrice(data.wallboxChargerPrice)}</td>
                </tr>
              )}
              {data.additionalServices.hasWarrantyExtension && (
                <tr>
                  <td><i className="fas fa-shield-alt"></i> Bảo hành mở rộng</td>
                  <td className={styles.price}>{formatPrice(data.warrantyExtensionPrice)}</td>
                </tr>
              )}
              {data.additionalServices.hasPPF && (
                <tr>
                  <td><i className="fas fa-layer-group"></i> Dán PPF toàn xe</td>
                  <td className={styles.price}>{formatPrice(data.ppfPrice)}</td>
                </tr>
              )}
              {data.additionalServices.hasCeramicCoating && (
                <tr>
                  <td><i className="fas fa-gem"></i> Phủ Ceramic</td>
                  <td className={styles.price}>{formatPrice(data.ceramicCoatingPrice)}</td>
                </tr>
              )}
              {data.additionalServices.has360Camera && (
                <tr>
                  <td><i className="fas fa-video"></i> Camera 360 độ</td>
                  <td className={styles.price}>{formatPrice(data.camera360Price)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ============================================ */}
      {/* PRICE BREAKDOWN */}
      {/* ============================================ */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <i className="fas fa-calculator"></i>
          Chi tiết giá
        </h3>
        <table className={styles.priceTable}>
          <tbody>
            <tr>
              <td>Giá xe cơ bản{data.quantity && data.quantity > 1 ? ` (x${data.quantity})` : ''}</td>
              <td className={styles.price}>{formatPrice(data.quantity && data.quantity > 1 ? data.subtotal : data.basePrice)}</td>
            </tr>
            {(data.servicesTotal || 0) > 0 && (
              <tr>
                <td>Tổng dịch vụ bổ sung</td>
                <td className={styles.price}>{formatPrice(data.servicesTotal)}</td>
              </tr>
            )}
            {(data.promotionDiscount || 0) > 0 && (
              <tr className={styles.discount}>
                <td>
                  <i className="fas fa-tag"></i> {data.promotionName || 'Khuyến mãi'}
                  {data.discountPercent && ` (-${data.discountPercent}%)`}
                </td>
                <td className={styles.price}>-{formatPrice(data.promotionDiscount)}</td>
              </tr>
            )}
            <tr className={styles.divider}>
              <td colSpan={2}></td>
            </tr>
            <tr>
              <td>Tạm tính (chưa VAT)</td>
              <td className={styles.price}>{formatPrice(data.taxableAmount)}</td>
            </tr>
            <tr>
              <td>Thuế VAT ({data.vatRate || 10}%)</td>
              <td className={styles.price}>{formatPrice(data.vatAmount)}</td>
            </tr>
            <tr className={styles.divider}>
              <td colSpan={2}></td>
            </tr>
            <tr className={styles.total}>
              <td><strong>TỔNG CỘNG</strong></td>
              <td className={styles.price}><strong>{formatPrice(data.grandTotal)}</strong></td>
            </tr>
            <tr className={styles.deposit}>
              <td><i className="fas fa-hand-holding-usd"></i> Tiền đặt cọc (10%)</td>
              <td className={styles.price}>{formatPrice(data.depositRequired)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ============================================ */}
      {/* PAYMENT & ADDITIONAL INFO */}
      {/* ============================================ */}

      {/* ============================================ */}
      {/* NOTES */}
      {/* ============================================ */}
      {data.notes && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <i className="fas fa-sticky-note"></i>
            Ghi chú
          </h3>
          <div className={styles.notes}>
            {data.notes}
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* TERMS & CONDITIONS */}
      {/* ============================================ */}
      {data.termsAndConditions && (
        <div className={styles.termsSection}>
          <h3 className={styles.sectionTitle}>
            <i className="fas fa-file-contract"></i>
            Điều khoản & Điều kiện
          </h3>
          <ol className={styles.termsList}>
            {data.termsAndConditions.split('\n').map((term, index) => (
              term.trim() && <li key={index}>{term.trim()}</li>
            ))}
          </ol>
          <div className={styles.termsNote}>
            <i className="fas fa-info-circle"></i>
            <span>Vui lòng đọc kỹ các điều khoản trước khi quyết định mua xe.</span>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* FOOTER */}
      {/* ============================================ */}
      <div className={styles.footer}>
        <p>Xin cảm ơn Quý khách đã tin tưởng lựa chọn VinFast E-Drive!</p>
        <p>Mọi thắc mắc vui lòng liên hệ: {data.dealerPhone || '1900 23 23 89'}</p>
      </div>
      </div>
    </div>
  );
};

export default QuotePDFTemplate;
