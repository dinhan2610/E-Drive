import type { TrackingItem } from "../../types/tracking";
import styles from "../../styles/TrackingStyles/DeliveryAppointment.module.scss";
import { useState } from "react";
import { requestReschedule } from "../../services/trackingApi";

interface DeliveryAppointmentProps {
  appointment?: TrackingItem["appointment"];
  orderId: string;
  onRescheduleSuccess?: () => void;
}

export default function DeliveryAppointment({ appointment, orderId, onRescheduleSuccess }: DeliveryAppointmentProps) {
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleNote, setRescheduleNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const handleSubmitReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleDate) return;

    setSubmitting(true);
    try {
      const result = await requestReschedule(orderId, {
        date: new Date(rescheduleDate).toISOString(),
        note: rescheduleNote
      });
      alert(result.message);
      setShowRescheduleForm(false);
      setRescheduleDate("");
      setRescheduleNote("");
      onRescheduleSuccess?.();
    } catch (error) {
      alert("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!appointment) {
    return (
      <div className={styles.card}>
        <h3 className={styles.title}>Lịch giao xe</h3>
        <div className={styles.noAppointment}>
          <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>Chưa thiết lập lịch giao xe</p>
          <span>Chúng tôi sẽ thông báo khi xe sẵn sàng giao</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Lịch giao xe</h3>

      {!showRescheduleForm ? (
        <div className={styles.appointmentInfo}>
          {appointment.date && (
            <div className={styles.infoSection}>
              <div className={styles.iconWrapper}>
                <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className={styles.infoContent}>
                <span className={styles.label}>Thời gian</span>
                <span className={styles.value}>{formatDate(appointment.date)}</span>
              </div>
            </div>
          )}

          {appointment.location && (
            <div className={styles.infoSection}>
              <div className={styles.iconWrapper}>
                <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className={styles.infoContent}>
                <span className={styles.label}>Địa điểm</span>
                <span className={styles.value}>{appointment.location}</span>
              </div>
            </div>
          )}

          {appointment.contact && (
            <div className={styles.infoSection}>
              <div className={styles.iconWrapper}>
                <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className={styles.infoContent}>
                <span className={styles.label}>Cố vấn giao xe</span>
                <span className={styles.value}>{appointment.contact}</span>
              </div>
            </div>
          )}

          {appointment.canRequestChange && (
            <button
              className={styles.rescheduleBtn}
              onClick={() => setShowRescheduleForm(true)}
            >
              <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Yêu cầu đổi lịch
            </button>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmitReschedule} className={styles.rescheduleForm}>
          <div className={styles.formGroup}>
            <label htmlFor="rescheduleDate" className={styles.formLabel}>
              Thời gian mong muốn
            </label>
            <input
              id="rescheduleDate"
              type="datetime-local"
              className={styles.formInput}
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
              required
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="rescheduleNote" className={styles.formLabel}>
              Ghi chú (không bắt buộc)
            </label>
            <textarea
              id="rescheduleNote"
              className={styles.formTextarea}
              placeholder="Lý do hoặc yêu cầu đặc biệt..."
              value={rescheduleNote}
              onChange={(e) => setRescheduleNote(e.target.value)}
              rows={3}
            />
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => setShowRescheduleForm(false)}
              disabled={submitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={submitting || !rescheduleDate}
            >
              {submitting ? (
                <>
                  <span className={styles.spinner}></span>
                  Đang gửi...
                </>
              ) : (
                "Gửi yêu cầu"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
