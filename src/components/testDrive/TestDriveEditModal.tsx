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
    time: ''
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
      
      // Call API with proper payload
      console.log('📝 Updating test drive #' + testDrive.testdriveId);
      console.log('⚠️ Status will reset to PENDING (requires manager approval)');
      
      const updated = await updateTestDrive(testDrive.testdriveId, {
        customerId: testDrive.customerId,
        dealerId: testDrive.dealerId,
        vehicleId: testDrive.vehicleId,
        scheduleDatetime: datetime.toISOString(),
        status: 'PENDING', // Reset to PENDING - requires manager approval again
        cancelReason: undefined // Clear cancel reason on edit
      });

      console.log('✅ Update successful:', updated);
      
      // Notify parent component with updated data
      onSuccess(updated);
      onClose();
      
      // Show success message
      alert('✅ Cập nhật lịch lái thử thành công!');
      
    } catch (err: any) {
      console.error('❌ Update error:', err);
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
            <h2>Chỉnh sửa lịch lái thử </h2>
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

          {/* Information Section - Grid Layout */}
          <div className={styles.infoSection}>
            <h3 className={styles.sectionTitle}>
              <i className="fas fa-info-circle"></i>
              Thông tin lịch hẹn
            </h3>
            <div className={styles.summaryGrid}>
              <div className={styles.infoItem}>
                <label><i className="fas fa-hashtag"></i> Mã lịch hẹn</label>
                <p>#{testDrive.testdriveId}</p>
              </div>
              <div className={styles.infoItem}>
                <label><i className="fas fa-user"></i> Khách hàng</label>
                <p>{testDrive.customerName}</p>
                <span className={styles.subtext}>ID: {testDrive.customerId}</span>
              </div>
              <div className={styles.infoItem}>
                <label><i className="fas fa-car"></i> Xe điện</label>
                <p>{testDrive.vehicleModel}</p>
                <span className={styles.subtext}>ID: {testDrive.vehicleId}</span>
              </div>
              <div className={styles.infoItem}>
                <label><i className="fas fa-store"></i> Đại lý</label>
                <p>{testDrive.dealerName}</p>
                <span className={styles.subtext}>ID: {testDrive.dealerId}</span>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSubmit} className={styles.editForm}>
            <div className={styles.editSection}>
              <h3 className={styles.sectionTitle}>
                <i className="fas fa-edit"></i>
                Cập nhật lịch hẹn
              </h3>
              <div className={styles.editGrid}>
                {/* Date Input */}
                <div className={styles.formGroup}>
                  <label>
                    <i className="fas fa-calendar-day"></i>
                    Ngày lái thử
                  </label>
                  <div className={styles.datePickerWrapper}>
                    <input
                      type="date"
                      className={styles.dateInput}
                      value={formData.date}
                      onChange={(e) => {
                        const selectedDate = new Date(e.target.value);
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
                    Thứ 2 - Thứ 7
                  </small>
                </div>

                {/* Time Input */}
                <div className={styles.formGroup}>
                  <label>
                    <i className="fas fa-clock"></i>
                    Giờ lái thử
                  </label>
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
                    8:00 - 17:00
                  </small>
                </div>
              </div>
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
