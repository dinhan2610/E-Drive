import React, { useState } from 'react';
import type { ContractPayload } from '../../types/contract';
import type { OrderLite } from '../../types/order';
import styles from './ContractForm.module.scss';

interface ContractFormProps {
  payload: ContractPayload;
  onChange: (payload: Partial<ContractPayload>) => void;
  errors?: Record<string, string>;
  orderData?: OrderLite | null; // Add order data prop
}

const ContractForm: React.FC<ContractFormProps> = ({ orderData }) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className={styles.form}>
      {/* Order Information Section - Readonly */}
      {orderData && (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>
            <i className="fas fa-file-invoice"></i>
            Thông tin đơn hàng
          </h4>

          <div className={styles.readonlyGrid}>
            <div className={styles.readonlyField}>
              <label className={styles.label}>Mã đơn hàng:</label>
              <div className={styles.readonlyValue}>#{orderData.id}</div>
            </div>

            <div className={styles.readonlyField}>
              <label className={styles.label}>Đại lý:</label>
              <div className={styles.readonlyValue}>{orderData.dealer.name}</div>
            </div>

            <div className={styles.readonlyField}>
              <label className={styles.label}>Ngày đặt:</label>
              <div className={styles.readonlyValue}>{formatDate(orderData.orderDate)}</div>
            </div>

            <div className={styles.readonlyField}>
              <label className={styles.label}>Ngày giao dự kiến:</label>
              <div className={styles.readonlyValue}>{formatDate(orderData.desiredDeliveryDate)}</div>
            </div>
          </div>
        </section>
      )}

      {/* Order Items Table - Readonly */}
      {orderData && orderData.orderItems && orderData.orderItems.length > 0 && (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>
            <i className="fas fa-car"></i>
            Danh sách xe
          </h4>

          <div className={styles.tableWrapper}>
            <table className={styles.orderItemsTable}>
              <thead>
                <tr>
                  <th>Tên xe</th>
                  <th>Màu sắc</th>
                  <th>Số lượng</th>
                  <th>Đơn giá</th>
                  <th>Tạm tính</th>
                  <th>Chiết khấu</th>
                  <th>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {orderData.orderItems.map((item, index) => {
                  // Parse vehicle name and version for display
                  const displayName = item.vehicleName || 'N/A';
                  const vehicleVersion = item.vehicleVersion || '';
                  const fullVehicleName = vehicleVersion 
                    ? `${displayName} - ${vehicleVersion}`
                    : displayName;
                  
                  // Debug log
                  console.log('🎨 ContractForm item:', {
                    vehicleName: item.vehicleName,
                    vehicleVersion: item.vehicleVersion,
                    color: item.color,
                    fullVehicleName
                  });
                  
                  return (
                    <tr key={index}>
                      <td>{fullVehicleName}</td>
                      <td className={styles.textCenter}>{item.color || 'Chưa xác định'}</td>
                      <td className={styles.textCenter}>{item.quantity}</td>
                      <td className={styles.textRight}>{formatCurrency(item.unitPrice)}</td>
                      <td className={styles.textRight}>{formatCurrency(item.itemSubtotal)}</td>
                      <td className={styles.textRight}>-{formatCurrency(item.itemDiscount)}</td>
                      <td className={styles.textRight}><strong>{formatCurrency(item.itemTotal)}</strong></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Payment Overview - Readonly */}
      {orderData && (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>
            <i className="fas fa-receipt"></i>
            Tổng quan thanh toán
          </h4>

          <div className={styles.paymentOverview}>
            <div className={styles.paymentRow}>
              <span className={styles.label}>Tạm tính:</span>
              <span className={styles.value}>{formatCurrency(orderData.money.subtotal)}</span>
            </div>
            <div className={styles.paymentRow}>
              <span className={styles.label}>Chiết khấu đại lý:</span>
              <span className={styles.value}>-{formatCurrency(orderData.money.discount)}</span>
            </div>
            <div className={styles.paymentRow}>
              <span className={styles.label}>VAT ({orderData.money.taxPercent}%):</span>
              <span className={styles.value}>{formatCurrency((orderData.money.subtotal - orderData.money.discount) * orderData.money.taxPercent / 100)}</span>
            </div>
            <div className={`${styles.paymentRow} ${styles.totalRow}`}>
              <span className={styles.label}><strong>Tổng cộng:</strong></span>
              <span className={styles.value}><strong>{formatCurrency(orderData.money.total)}</strong></span>
            </div>
          </div>
        </section>
      )}

      {/* Delivery Information - Readonly */}
      {orderData && orderData.deliveryAddress && (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>
            <i className="fas fa-shipping-fast"></i>
            Thông tin giao hàng
          </h4>

          <div className={styles.readonlyField}>
            <label className={styles.label}>Địa chỉ:</label>
            <div className={styles.readonlyValue}>{orderData.deliveryAddress}</div>
          </div>

          {orderData.deliveryNote && (
            <div className={styles.readonlyField}>
              <label className={styles.label}>Ghi chú:</label>
              <div className={styles.readonlyValue}>{orderData.deliveryNote}</div>
            </div>
          )}
        </section>
      )}

      {/* Payment Methods & Conditions - Accordion */}
      <section className={styles.section}>
        <h4 
          className={`${styles.sectionTitle} ${styles.accordion}`}
          onClick={() => toggleSection('payment')}
        >
          <i className="fas fa-credit-card"></i>
          Phương thức & điều kiện thanh toán
          <i className={`fas fa-chevron-${expandedSections['payment'] ? 'up' : 'down'} ${styles.chevron}`}></i>
        </h4>
        
        {expandedSections['payment'] && (
          <div className={styles.accordionContent}>
            <div className={styles.contentBlock}>
              <p data-icon="💳"><strong>Phương thức thanh toán:</strong></p>
              <ul>
                <li>Tiền mặt tại showroom</li>
                <li>Chuyển khoản ngân hàng (thông tin tài khoản kèm theo)</li>
                <li>VNPAY (quét mã QR)</li>
                <li>Thẻ tín dụng/ghi nợ (Visa, Mastercard, JCB)</li>
              </ul>
            </div>
            
            <div className={styles.contentBlock}>
              <p data-icon="📅"><strong>Tiến độ thanh toán:</strong></p>
              <ul>
                <li>100% trước khi đăng ký xe (đối với khách hàng mua trực tiếp)</li>
                <li>Hoặc: 70% trước khi giao xe, 30% còn lại khi bàn giao hoàn tất</li>
                <li>Đặt cọc: Tối thiểu 20% giá trị xe để giữ chỗ</li>
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* Warranty & Maintenance - Accordion */}
      <section className={styles.section}>
        <h4 
          className={`${styles.sectionTitle} ${styles.accordion}`}
          onClick={() => toggleSection('warranty')}
        >
          <i className="fas fa-shield-alt"></i>
          Bảo hành – bảo dưỡng – pin
          <i className={`fas fa-chevron-${expandedSections['warranty'] ? 'up' : 'down'} ${styles.chevron}`}></i>
        </h4>
        
        {expandedSections['warranty'] && (
          <div className={styles.accordionContent}>
            <div className={styles.contentBlock}>
              <p data-icon="🛡️"><strong>Bảo hành tổng thể:</strong></p>
              <ul>
                <li>Thời hạn: 3 năm hoặc 100.000 km (tùy điều kiện nào đến trước)</li>
                <li>Áp dụng cho: Khung xe, động cơ điện, hệ thống điện</li>
              </ul>
            </div>
            
            <div className={styles.contentBlock}>
              <p data-icon="🔋"><strong>Bảo hành pin:</strong></p>
              <ul>
                <li>Thời hạn: 8 năm hoặc 160.000 km</li>
                <li>Tiêu chí: Dung lượng pin còn tối thiểu 70% so với ban đầu</li>
                <li>Bảo hành miễn phí thay thế nếu suy giảm vượt mức quy định</li>
              </ul>
            </div>

            <div className={styles.contentBlock}>
              <p data-icon="🔧"><strong>Bảo dưỡng định kỳ:</strong></p>
              <ul>
                <li>Kiểm tra miễn phí: 1.000 km, 5.000 km đầu tiên</li>
                <li>Bảo dưỡng định kỳ: Mỗi 10.000 km hoặc 6 tháng</li>
              </ul>
            </div>

            <div className={styles.contentBlock}>
              <p data-icon="⚠️"><strong>Điều kiện từ chối bảo hành:</strong></p>
              <ul>
                <li>Sử dụng không đúng hướng dẫn, cải tạo, thay đổi kết cấu xe</li>
                <li>Bảo dưỡng không đúng lịch hoặc tại garage không ủy quyền</li>
                <li>Tai nạn, ngập nước, hỏa hoạn do lỗi người dùng</li>
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* Appendix & Documents - Accordion */}
      <section className={styles.section}>
        <h4 
          className={`${styles.sectionTitle} ${styles.accordion}`}
          onClick={() => toggleSection('appendix')}
        >
          <i className="fas fa-paperclip"></i>
          Phụ lục/Đính kèm
          <i className={`fas fa-chevron-${expandedSections['appendix'] ? 'up' : 'down'} ${styles.chevron}`}></i>
        </h4>
        
        {expandedSections['appendix'] && (
          <div className={styles.accordionContent}>
            <div className={styles.contentBlock}>
              <p data-icon="📄"><strong>Tài liệu kèm theo:</strong></p>
              <ul>
                <li>Phụ lục giá chi tiết (bảng tính tiền)</li>
                <li>Biên bản bàn giao xe (checklist ngoại thất/nội thất/phụ kiện/2 chìa khóa)</li>
                <li>Hóa đơn/phiếu thu (đặt cọc, thanh toán)</li>
                <li>Giấy chứng nhận bảo hiểm</li>
                <li>Hướng dẫn sạc/bảo quản pin</li>
                <li>Hồ sơ đăng ký (bản sao CCCD/MST/ủy quyền)</li>
              </ul>
            </div>

            <div className={styles.contentBlock}>
              <p data-icon="🆘"><strong>Dịch vụ hỗ trợ:</strong></p>
              <ul>
                <li>Cứu hộ – hỗ trợ 24/7 (trong phạm vi bảo hành)</li>
                <li>Hotline: 1900-xxxx</li>
                <li>Ứng dụng di động: Hỗ trợ giám sát xe, đặt lịch bảo dưỡng</li>
              </ul>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default ContractForm;
