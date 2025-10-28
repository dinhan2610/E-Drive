import React, { useState, useEffect } from 'react';
import { updateTestDrive, type TestDrive } from '../../services/testDriveApi';
import styles from './TestDriveEditModal.module.scss';

interface TestDriveEditModalProps {
  testDrive: TestDrive;
  onClose: () => void;
  onSuccess: (updated: TestDrive) => void;
}

const TestDriveEditModal: React.FC<TestDriveEditModalProps> = ({
  testDrive,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    status: testDrive.status,
    cancelReason: testDrive.cancelReason || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Format datetime for input - split into date and time
    try {
      const dateObj = new Date(testDrive.scheduleDatetime);
      const dateStr = dateObj.toISOString().slice(0, 10); // YYYY-MM-DD
      const timeStr = dateObj.toTimeString().slice(0, 5); // HH:MM
      setFormData(prev => ({ ...prev, date: dateStr, time: timeStr }));
    } catch (err) {
      console.error('Error formatting date:', err);
    }
  }, [testDrive]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate
      if (!formData.date || !formData.time) {
        throw new Error('Vui lòng chọn đầy đủ ngày và giờ lái thử');
      }

      // Combine date and time
      const datetime = new Date(`${formData.date}T${formData.time}`);
      
      // Validate day of week (Monday = 1, Sunday = 0)
      const dayOfWeek = datetime.getDay();
      if (dayOfWeek === 0) {
        throw new Error('Không thể đặt lịch vào Chủ nhật. Vui lòng chọn từ Thứ 2 đến Thứ 7.');
      }
      
      // Validate time (8:00 - 17:00)
      const [hours, minutes] = formData.time.split(':').map(Number);
      const timeInMinutes = hours * 60 + minutes;
      const startTime = 8 * 60; // 8:00 = 480 minutes
      const endTime = 17 * 60; // 17:00 = 1020 minutes
      
      if (timeInMinutes < startTime || timeInMinutes > endTime) {
        throw new Error('Giờ lái thử phải trong khoảng 8:00 - 17:00');
      }

      if (formData.status === 'CANCELLED' && !formData.cancelReason) {
        throw new Error('Vui lòng nhập lý do hủy');
      }
      
      // Call API
      const updated = await updateTestDrive(testDrive.testdriveId, {
        customerId: testDrive.customerId,
        dealerId: testDrive.dealerId,
        vehicleId: testDrive.vehicleId,
        scheduleDatetime: datetime.toISOString(),
        status: formData.status,
        cancelReason: formData.cancelReason || undefined
      });

      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Không thể cập nhật lịch lái thử');
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
            <h2>Chỉnh sửa lịch lái thử #{testDrive.testdriveId}</h2>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Body with Table Layout */}
        <div className={styles.modalBody}>
          {error && (
            <div className={styles.errorAlert}>
              <i className="fas fa-exclamation-circle"></i>
              <span>{error}</span>
            </div>
          )}

          {/* Information Table */}
          <div className={styles.tableSection}>
            <h3 className={styles.sectionTitle}>
              <i className="fas fa-info-circle"></i>
              Thông tin lịch hẹn
            </h3>
            <table className={styles.infoTable}>
              <tbody>
                <tr>
                  <td className={styles.labelCol}>
                    <i className="fas fa-hashtag"></i>
                    Mã lịch hẹn
                  </td>
                  <td className={styles.valueCol}>#{testDrive.testdriveId}</td>
                </tr>
                <tr>
                  <td className={styles.labelCol}>
                    <i className="fas fa-user"></i>
                    Khách hàng
                  </td>
                  <td className={styles.valueCol}>
                    <div className={styles.customerInfo}>
                      <strong>{testDrive.customerName}</strong>
                      <span className={styles.subInfo}>ID: {testDrive.customerId}</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className={styles.labelCol}>
                    <i className="fas fa-car"></i>
                    Xe điện
                  </td>
                  <td className={styles.valueCol}>
                    <div className={styles.vehicleInfo}>
                      <strong>{testDrive.vehicleModel}</strong>
                      <span className={styles.subInfo}>ID: {testDrive.vehicleId}</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className={styles.labelCol}>
                    <i className="fas fa-store"></i>
                    Đại lý
                  </td>
                  <td className={styles.valueCol}>
                    <strong>{testDrive.dealerName}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSubmit} className={styles.editForm}>
            <div className={styles.tableSection}>
              <h3 className={styles.sectionTitle}>
                <i className="fas fa-edit"></i>
                Thông tin cần cập nhật
              </h3>
              <table className={styles.infoTable}>
                <tbody>
                  <tr>
                    <td className={styles.labelCol}>
                      <i className="fas fa-calendar-day"></i>
                      Ngày lái thử
                    </td>
                    <td className={styles.valueCol}>
                      <div className={styles.datePickerWrapper}>
                        <input
                          type="date"
                          className={styles.dateInput}
                          value={formData.date}
                          onChange={(e) => {
                            const selectedDate = new Date(e.target.value);
                            // Check if Sunday
                            if (selectedDate.getDay() === 0) {
                              setError('Không thể chọn Chủ nhật. Vui lòng chọn từ Thứ 2 đến Thứ 7.');
                              return;
                            }
                            setError('');
                            setFormData({...formData, date: e.target.value});
                          }}
                          onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                          required
                          min={new Date().toISOString().slice(0, 10)}
                        />
                        <i className="fas fa-calendar-alt" onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          input?.showPicker?.();
                        }}></i>
                      </div>
                      <small className={styles.helperText}>
                        <i className="fas fa-info-circle"></i>
                        Chỉ nhận lịch từ Thứ 2 đến Thứ 7
                      </small>
                    </td>
                  </tr>
                  <tr>
                    <td className={styles.labelCol}>
                      <i className="fas fa-clock"></i>
                      Giờ lái thử
                    </td>
                    <td className={styles.valueCol}>
                      <div className={styles.timePickerWrapper}>
                        <input
                          type="time"
                          className={styles.timeInput}
                          value={formData.time}
                          onChange={(e) => {
                            const [hours] = e.target.value.split(':').map(Number);
                            if (hours < 8 || hours > 17) {
                              setError('Giờ lái thử phải trong khoảng 8:00 - 17:00');
                              return;
                            }
                            setError('');
                            setFormData({...formData, time: e.target.value});
                          }}
                          onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                          min="08:00"
                          max="17:00"
                          required
                        />
                        <i className="fas fa-clock" onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          input?.showPicker?.();
                        }}></i>
                      </div>
                      <small className={styles.helperText}>
                        <i className="fas fa-info-circle"></i>
                        Giờ hoạt động: 8:00 sáng - 5:00 chiều
                      </small>
                    </td>
                  </tr>
                  <tr>
                    <td className={styles.labelCol}>
                      <i className="fas fa-flag"></i>
                      Trạng thái
                    </td>
                    <td className={styles.valueCol}>
                      <select
                        className={`${styles.statusSelect} ${styles[formData.status.toLowerCase()]}`}
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                      >
                        <option value="PENDING">Chờ xác nhận</option>
                        <option value="CONFIRMED">Đã xác nhận</option>
                        <option value="COMPLETED">Hoàn thành</option>
                        <option value="CANCELLED">Đã hủy</option>
                        <option value="NO_SHOW">Không đến</option>
                      </select>
                    </td>
                  </tr>
                  {formData.status === 'CANCELLED' && (
                    <tr>
                      <td className={styles.labelCol}>
                        <i className="fas fa-comment-slash"></i>
                        Lý do hủy
                      </td>
                      <td className={styles.valueCol}>
                        <textarea
                          className={styles.reasonTextarea}
                          placeholder="Nhập lý do hủy..."
                          value={formData.cancelReason}
                          onChange={(e) => setFormData({...formData, cancelReason: e.target.value})}
                          rows={3}
                          required
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={onClose}
                disabled={loading}
              >
                <i className="fas fa-times"></i>
                Hủy bỏ
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
    </div>
  );
};

export default TestDriveEditModal;
