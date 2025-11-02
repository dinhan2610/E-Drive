import React from 'react';
import type { ContractPayload } from '../../types/contract';
import styles from './PdfPreview.module.scss';

interface PdfPreviewProps {
  payload: ContractPayload;
  contractNo?: string;
}

const PdfPreview = React.forwardRef<HTMLDivElement, PdfPreviewProps>(({ payload, contractNo }, ref) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={styles.preview}>
      <div className={styles.previewArea}>
        <div ref={ref} className={styles.printArea}>
          {/* Header - Company Info */}
          <div className={styles.docHeader}>
            <div className={styles.leftSection}>
              <h2 className={styles.companyName}>CÔNG TY E-DRIVE VIỆT NAM</h2>
              <div className={styles.companyDetails}>
                <p>{payload.manufacturer?.address || '123 Đường Xe Điện, Quận 1, TP.HCM'}</p>
                <p>Điện thoại: {payload.manufacturer?.phone || '(0123) 456 789'}</p>
                <p>Email: {payload.manufacturer?.email || 'contact@e-drive.vn'}</p>
                <p>Mã số thuế: {payload.manufacturer?.taxCode || '0123456789'}</p>
              </div>
            </div>
            
            <div className={styles.centerSection}>
              <h1 className={styles.contractTitle}>HỢP ĐỒNG MUA BÁN<br/>XE Ô TÔ ĐIỆN</h1>
              <div className={styles.contractNumber}>
                <span>Số:</span> <strong>{contractNo || 'CT-DRAFT'}</strong>
              </div>
            </div>
          </div>

          {/* Parties */}
          <section className={styles.docSection}>
            <h5>BÊN BÁN (BÊN A) - HÃNG SẢN XUẤT</h5>
            {payload.manufacturer ? (
              <>
                <p><strong>Tên công ty:</strong> {payload.manufacturer.name || 'E-DRIVE VIETNAM'}</p>
                <p><strong>Địa chỉ:</strong> {payload.manufacturer.address || '123 Đường Xe Điện, Quận 1, TP.HCM'}</p>
                <p><strong>Điện thoại:</strong> {payload.manufacturer.phone || '(0123) 456 789'}</p>
                <p><strong>Email:</strong> {payload.manufacturer.email || 'contact@e-drive.vn'}</p>
                <p><strong>Mã số thuế:</strong> {payload.manufacturer.taxCode || '0123456789'}</p>
              </>
            ) : (
              <>
                <p><strong>Tên công ty:</strong> E-DRIVE VIETNAM</p>
                <p><strong>Địa chỉ:</strong> 123 Đường Xe Điện, Quận 1, TP.HCM</p>
                <p><strong>Điện thoại:</strong> (0123) 456 789</p>
                <p><strong>Email:</strong> contact@e-drive.vn</p>
                <p><strong>Mã số thuế:</strong> 0123456789</p>
              </>
            )}
          </section>

          <section className={styles.docSection}>
            <h5>BÊN MUA (BÊN B) - ĐẠI LÝ</h5>
            <p><strong>Tên đại lý:</strong> {payload.dealer.name}</p>
            {payload.order?.deliveryAddress && <p><strong>Địa chỉ:</strong> {payload.order.deliveryAddress}</p>}
          </section>

          {/* Vehicle */}
          <section className={styles.docSection}>
            <h5>THÔNG TIN XE</h5>
            <div className={styles.table}>
              <div className={styles.row}>
                <span className={styles.key}>Model:</span>
                <span className={styles.val}>{payload.vehicle.model}</span>
              </div>
              {payload.vehicle.variant && (
                <div className={styles.row}>
                  <span className={styles.key}>Phiên bản:</span>
                  <span className={styles.val}>{payload.vehicle.variant}</span>
                </div>
              )}
              {payload.vehicle.color && (
                <div className={styles.row}>
                  <span className={styles.key}>Màu sắc:</span>
                  <span className={styles.val}>{payload.vehicle.color}</span>
                </div>
              )}
              {payload.vehicle.vin && (
                <div className={styles.row}>
                  <span className={styles.key}>Số khung (VIN):</span>
                  <span className={styles.val}>{payload.vehicle.vin}</span>
                </div>
              )}
              {payload.order?.orderItems && payload.order.orderItems.length > 0 && (
                <div className={styles.row}>
                  <span className={styles.key}>Số lượng:</span>
                  <span className={styles.val}>{payload.order.orderItems[0].quantity} xe</span>
                </div>
              )}
            </div>
          </section>

          {/* Order Info */}
          <section className={styles.docSection}>
            <h5>THÔNG TIN ĐƠN HÀNG</h5>
            <div className={styles.table}>
              {payload.order?.orderDate && (
                <div className={styles.row}>
                  <span className={styles.key}>Ngày đặt hàng:</span>
                  <span className={styles.val}>{formatDate(payload.order.orderDate)}</span>
                </div>
              )}
              {payload.order?.desiredDeliveryDate && (
                <div className={styles.row}>
                  <span className={styles.key}>Ngày giao dự kiến:</span>
                  <span className={styles.val}>{formatDate(payload.order.desiredDeliveryDate)}</span>
                </div>
              )}
              {payload.order?.paymentStatus && (
                <div className={styles.row}>
                  <span className={styles.key}>Trạng thái thanh toán:</span>
                  <span className={styles.val}>{payload.order.paymentStatus}</span>
                </div>
              )}
            </div>
          </section>

          {/* Delivery Info */}
          <section className={styles.docSection}>
            <h5>THÔNG TIN GIAO HÀNG</h5>
            <div className={styles.table}>
              {payload.order?.deliveryAddress && (
                <div className={styles.row}>
                  <span className={styles.key}>Địa chỉ giao hàng:</span>
                  <span className={styles.val}>{payload.order.deliveryAddress}</span>
                </div>
              )}
              {payload.terms.deliveryDate && (
                <div className={styles.row}>
                  <span className={styles.key}>Ngày giao xe:</span>
                  <span className={styles.val}>{formatDate(payload.terms.deliveryDate)}</span>
                </div>
              )}
              {payload.terms.deliveryLocation && (
                <div className={styles.row}>
                  <span className={styles.key}>Địa điểm giao:</span>
                  <span className={styles.val}>{payload.terms.deliveryLocation}</span>
                </div>
              )}
              {payload.order?.deliveryNote && (
                <div className={styles.row}>
                  <span className={styles.key}>Ghi chú giao hàng:</span>
                  <span className={styles.val}>{payload.order.deliveryNote}</span>
                </div>
              )}
            </div>
          </section>

          {/* Pricing */}
          <section className={styles.docSection}>
            <h5>GIÁ TRỊ HỢP ĐỒNG</h5>
            <div className={styles.pricing}>
              <div className={styles.row}>
                <span>Giá niêm yết:</span>
                <span>{formatCurrency(payload.pricing.subtotal)}</span>
              </div>
              <div className={styles.row}>
                <span>Giảm giá:</span>
                <span>-{formatCurrency(payload.pricing.discount)}</span>
              </div>
              <div className={styles.row}>
                <span>Thuế VAT ({payload.pricing.taxPercent}%):</span>
                <span>
                  {formatCurrency(
                    (payload.pricing.subtotal - payload.pricing.discount) *
                      (payload.pricing.taxPercent / 100)
                  )}
                </span>
              </div>
              <div className={styles.row}>
                <span>Phí khác:</span>
                <span>{formatCurrency(payload.pricing.fees || 0)}</span>
              </div>
              <div className={`${styles.row} ${styles.total}`}>
                <strong>Tổng cộng:</strong>
                <strong>{formatCurrency(payload.pricing.total)}</strong>
              </div>
              {payload.pricing.paidTotal !== undefined && payload.pricing.paidTotal > 0 && (
                <>
                  <div className={`${styles.row} ${styles.paid}`}>
                    <span>Đã thanh toán:</span>
                    <span>{formatCurrency(payload.pricing.paidTotal)}</span>
                  </div>
                  <div className={`${styles.row} ${styles.remaining}`}>
                    <span>Còn lại:</span>
                    <span>{formatCurrency(payload.pricing.remaining || 0)}</span>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Payment Methods & Conditions */}
          <section className={styles.docSection}>
            <h5>PHƯƠNG THỨC & ĐIỀU KIỆN THANH TOÁN</h5>
            
            <div className={styles.subsection}>
              <p><strong>Phương thức thanh toán:</strong></p>
              <ul>
                <li>Tiền mặt tại showroom</li>
                <li>Chuyển khoản ngân hàng (thông tin tài khoản kèm theo)</li>
                <li>VNPAY (quét mã QR)</li>
                <li>Thẻ tín dụng/ghi nợ (Visa, Mastercard, JCB)</li>
              </ul>
            </div>
            
            <div className={styles.subsection}>
              <p><strong>Tiến độ thanh toán:</strong></p>
              <ul>
                <li>100% trước khi đăng ký xe (đối với khách hàng mua trực tiếp)</li>
                <li>Hoặc: 70% trước khi giao xe, 30% còn lại khi bàn giao hoàn tất</li>
                <li>Đặt cọc: Tối thiểu 20% giá trị xe để giữ chỗ</li>
              </ul>
            </div>
          </section>

          {/* Warranty & Maintenance */}
          <section className={styles.docSection}>
            <h5>BẢO HÀNH – BẢO DƯỠNG – PIN</h5>
            
            <div className={styles.subsection}>
              <p><strong>Bảo hành tổng thể:</strong></p>
              <ul>
                <li>Thời hạn: 3 năm hoặc 100.000 km (tùy điều kiện nào đến trước)</li>
                <li>Áp dụng cho: Khung xe, động cơ điện, hệ thống điện</li>
              </ul>
            </div>
            
            <div className={styles.subsection}>
              <p><strong>Bảo hành pin:</strong></p>
              <ul>
                <li>Thời hạn: 8 năm hoặc 160.000 km</li>
                <li>Tiêu chí: Dung lượng pin còn tối thiểu 70% so với ban đầu</li>
                <li>Bảo hành miễn phí thay thế nếu suy giảm vượt mức quy định</li>
              </ul>
            </div>

            <div className={styles.subsection}>
              <p><strong>Bảo dưỡng định kỳ:</strong></p>
              <ul>
                <li>Kiểm tra miễn phí: 1.000 km, 5.000 km đầu tiên</li>
                <li>Bảo dưỡng định kỳ: Mỗi 10.000 km hoặc 6 tháng</li>
              </ul>
            </div>

            <div className={styles.subsection}>
              <p><strong>Điều kiện từ chối bảo hành:</strong></p>
              <ul>
                <li>Sử dụng không đúng hướng dẫn, cải tạo, thay đổi kết cấu xe</li>
                <li>Bảo dưỡng không đúng lịch hoặc tại garage không ủy quyền</li>
                <li>Tai nạn, ngập nước, hỏa hoạn do lỗi người dùng</li>
              </ul>
            </div>
          </section>

          {/* Appendix & Documents */}
          <section className={styles.docSection}>
            <h5>PHỤ LỤC/ĐÍNH KÈM</h5>
            
            <div className={styles.subsection}>
              <p><strong>Tài liệu kèm theo:</strong></p>
              <ul>
                <li>Phụ lục giá chi tiết (bảng tính tiền)</li>
                <li>Biên bản bàn giao xe (checklist ngoại thất/nội thất/phụ kiện/2 chìa khóa)</li>
                <li>Hóa đơn/phiếu thu (đặt cọc, thanh toán)</li>
                <li>Giấy chứng nhận bảo hiểm</li>
                <li>Hướng dẫn sạc/bảo quản pin</li>
                <li>Hồ sơ đăng ký (bản sao CCCD/MST/ủy quyền)</li>
              </ul>
            </div>

            <div className={styles.subsection}>
              <p><strong>Dịch vụ hỗ trợ:</strong></p>
              <ul>
                <li>Cứu hộ – hỗ trợ 24/7 (trong phạm vi bảo hành)</li>
                <li>Hotline: 1900-1111</li>
                <li>Ứng dụng di động: Hỗ trợ giám sát xe, đặt lịch bảo dưỡng</li>
              </ul>
            </div>
          </section>

          {/* Signatures */}
          <div className={styles.signatures}>
            <div className={styles.signBox}>
              <p>
                <strong>BÊN BÁN</strong>
              </p>
              <p className={styles.signName}>E-Drive VietNam</p>
              
            </div>
            <div className={styles.signBox}>
              <p>
                <strong>BÊN MUA</strong>
              </p>
              <p className={styles.signLine}>(Ký và ghi rõ họ tên)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

PdfPreview.displayName = 'PdfPreview';

export default PdfPreview;
