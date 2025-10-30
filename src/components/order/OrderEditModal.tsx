import React, { useState } from 'react';
import type { TrackingItem, DeliveryStatus } from '../../types/tracking';
import styles from '../../styles/OrderStyles/OrderEditModal.module.scss';

interface OrderEditModalProps {
  order: TrackingItem;
  onClose: () => void;
  onSuccess: (updated: TrackingItem) => void;
}

const OrderEditModal: React.FC<OrderEditModalProps> = ({ order, onClose, onSuccess }) => {
  const [status, setStatus] = useState<DeliveryStatus>(order.status);
  const [appointmentDate, setAppointmentDate] = useState(order.appointment?.date || '');
  const [appointmentLocation, setAppointmentLocation] = useState(order.appointment?.location || '');
  const [appointmentContact, setAppointmentContact] = useState(order.appointment?.contact || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSaving(true);
    
    try {
      // TODO: Call API to update order
      const updated: TrackingItem = {
        ...order,
        status,
        appointment: {
          date: appointmentDate,
          location: appointmentLocation,
          contact: appointmentContact,
          canRequestChange: order.appointment?.canRequestChange || false,
        },
        updatedAt: new Date().toISOString(),
      };
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSuccess(updated);
      alert('✅ Cập nhật đơn hàng thành công!');
      onClose();
    } catch (error) {
      console.error('Update error:', error);
      alert('❌ Không thể cập nhật đơn hàng');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <i className="fas fa-edit"></i>
            <div>
              <h2>Chỉnh sửa đơn hàng</h2>
              <p className={styles.orderCode}>{order.code}</p>
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {/* Customer Info (Read-only) */}
            <div className={styles.section}>
              <h3>
                <i className="fas fa-user"></i>
                Thông tin khách hàng
              </h3>
              <div className={styles.infoGrid}>
                <div className={styles.readOnlyField}>
                  <span className={styles.label}>Họ tên:</span>
                  <span className={styles.value}>{order.customerName}</span>
                </div>
                <div className={styles.readOnlyField}>
                  <span className={styles.label}>SĐT:</span>
                  <span className={styles.value}>{order.customerPhoneMasked}</span>
                </div>
              </div>
            </div>

            {/* Vehicle Info (Read-only) */}
            <div className={styles.section}>
              <h3>
                <i className="fas fa-car"></i>
                Thông tin xe
              </h3>
              <div className={styles.infoGrid}>
                <div className={styles.readOnlyField}>
                  <span className={styles.label}>Model:</span>
                  <span className={styles.value}>{order.vehicle.model}</span>
                </div>
                {order.vehicle.color && (
                  <div className={styles.readOnlyField}>
                    <span className={styles.label}>Màu:</span>
                    <span className={styles.value}>{order.vehicle.color}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status - Editable */}
            <div className={styles.section}>
              <h3>
                <i className="fas fa-info-circle"></i>
                Trạng thái đơn hàng
              </h3>
              <div className={styles.formGroup}>
                <label htmlFor="status">Trạng thái *</label>
                <select
                  id="status"
                  className={styles.select}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as DeliveryStatus)}
                  required
                >
                  <option value="CONFIRMED">Đã xác nhận</option>
                  <option value="ALLOCATED">Đã phân bổ xe</option>
                  <option value="IN_TRANSIT">Đang vận chuyển</option>
                  <option value="AT_DEALER">Đã về đại lý</option>
                  <option value="SCHEDULED">Đã hẹn giao</option>
                  <option value="DELIVERED">Đã giao xe</option>
                  <option value="ON_HOLD">Tạm dừng</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
              </div>
            </div>

            {/* Appointment - Editable */}
            <div className={styles.section}>
              <h3>
                <i className="fas fa-calendar-check"></i>
                Lịch hẹn giao xe
              </h3>
              <div className={styles.formGroup}>
                <label htmlFor="appointmentDate">Thời gian</label>
                <input
                  id="appointmentDate"
                  type="datetime-local"
                  className={styles.input}
                  value={appointmentDate ? new Date(appointmentDate).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="appointmentLocation">Địa điểm</label>
                <input
                  id="appointmentLocation"
                  type="text"
                  className={styles.input}
                  value={appointmentLocation}
                  onChange={(e) => setAppointmentLocation(e.target.value)}
                  placeholder="Nhập địa điểm giao xe"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="appointmentContact">Liên hệ</label>
                <input
                  id="appointmentContact"
                  type="text"
                  className={styles.input}
                  value={appointmentContact}
                  onChange={(e) => setAppointmentContact(e.target.value)}
                  placeholder="Nhập thông tin liên hệ"
                />
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Đang lưu...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i>
                  Lưu thay đổi
                </>
              )}
            </button>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={isSaving}
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderEditModal;
