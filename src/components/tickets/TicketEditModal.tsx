import React, { useState } from 'react';
import { updateTicket } from '../../services/ticketsApi';
import type { Ticket } from '../../types/ticket';
import styles from './TicketEditModal.module.scss';

interface TicketEditModalProps {
  ticket: Ticket;
  onClose: () => void;
  onSuccess: (updated: Ticket) => void;
}

const TicketEditModal: React.FC<TicketEditModalProps> = ({
  ticket,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    status: ticket.status,
    priority: ticket.priority,
    assigneeName: ticket.assigneeName || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const updated = await updateTicket(ticket.id, {
        status: formData.status,
        priority: formData.priority,
        assigneeName: formData.assigneeName || undefined,
      });

      onSuccess(updated);
      onClose();
      
      alert('✅ Cập nhật ticket thành công!');
      
    } catch (err: any) {
      console.error('❌ Update error:', err);
      setError(err.message || 'Không thể cập nhật ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <i className="fas fa-edit"></i>
            <div>
              <h2>Chỉnh sửa ticket</h2>
              <p className={styles.ticketCode}>Mã: {ticket.code}</p>
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.modalBody}>
          {error && (
            <div className={styles.errorAlert}>
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}

          <div className={styles.formGrid}>
            {/* Status */}
            <div className={styles.formGroup}>
              <label htmlFor="status">
                Trạng thái <span className={styles.required}>*</span>
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                required
              >
                <option value="NEW">Mới</option>
                <option value="IN_REVIEW">Đang xem xét</option>
                <option value="WAITING_CUSTOMER">Chờ khách hàng</option>
                <option value="RESOLVED">Đã giải quyết</option>
                <option value="CLOSED">Đã đóng</option>
                <option value="REJECTED">Từ chối</option>
              </select>
            </div>

            {/* Priority */}
            <div className={styles.formGroup}>
              <label htmlFor="priority">
                Độ ưu tiên <span className={styles.required}>*</span>
              </label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                required
              >
                <option value="LOW">Thấp</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="HIGH">Cao</option>
                <option value="URGENT">Khẩn cấp</option>
              </select>
            </div>

            {/* Assignee */}
            <div className={styles.formGroup}>
              <label htmlFor="assignee">
                Người xử lý
              </label>
              <input
                id="assignee"
                type="text"
                value={formData.assigneeName}
                onChange={(e) => setFormData({ ...formData, assigneeName: e.target.value })}
                placeholder="Nhập tên người xử lý..."
              />
            </div>
          </div>

          {/* Ticket Info (Read-only) */}
          <div className={styles.ticketInfo}>
            <h4>Thông tin ticket</h4>
            <div className={styles.infoGrid}>
              <div>
                <label>Tiêu đề:</label>
                <p>{ticket.title}</p>
              </div>
              <div>
                <label>Khách hàng:</label>
                <p>{ticket.customerName}</p>
              </div>
              <div>
                <label>Loại:</label>
                <p>{ticket.type === 'FEEDBACK' ? 'Phản hồi' : 'Khiếu nại'}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={styles.modalFooter}>
            <button 
              type="button" 
              className={styles.cancelButton}
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </button>
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? (
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
          </div>
        </form>
      </div>
    </div>
  );
};

export default TicketEditModal;
