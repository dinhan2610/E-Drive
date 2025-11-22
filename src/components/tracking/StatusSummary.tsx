import type { TrackingItem, DeliveryStatus } from "../../types/tracking";
import styles from "../../styles/TrackingStyles/StatusSummary.module.scss";

interface StatusSummaryProps {
  tracking: TrackingItem;
}

const statusConfig: Record<DeliveryStatus, { color: string; bgColor: string; icon: JSX.Element }> = {
  CONFIRMED: {
    color: "#3b82f6",
    bgColor: "rgba(59, 130, 246, 0.1)",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  },
  ALLOCATED: {
    color: "#8b5cf6",
    bgColor: "rgba(139, 92, 246, 0.1)",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  },
  IN_TRANSIT: {
    color: "#14b8a6",
    bgColor: "rgba(20, 184, 166, 0.1)",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  },
  AT_DEALER: {
    color: "#6366f1",
    bgColor: "rgba(99, 102, 241, 0.1)",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  },
  SCHEDULED: {
    color: "#f97316",
    bgColor: "rgba(249, 115, 22, 0.1)",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  },
  DELIVERED: {
    color: "#22c55e",
    bgColor: "rgba(34, 197, 94, 0.1)",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  },
  ON_HOLD: {
    color: "#9ca3af",
    bgColor: "rgba(156, 163, 175, 0.1)",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  },
  CANCELLED: {
    color: "#ef4444",
    bgColor: "rgba(239, 68, 68, 0.1)",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  }
};

export default function StatusSummary({ tracking }: StatusSummaryProps) {
  const config = statusConfig[tracking.status];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`Đã sao chép: ${text}`);
  };

  const formatRelativeTime = (isoDate: string) => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <div className={styles.card}>
      <div className={styles.statusBadge} style={{ backgroundColor: config.bgColor, color: config.color }}>
        <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {config.icon}
        </svg>
        <span className={styles.statusText}>{tracking.statusText}</span>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Thông tin đơn hàng</h3>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Mã đơn</span>
            <div className={styles.infoValue}>
              <span className={styles.code}>{tracking.code}</span>
              <button
                className={styles.copyBtn}
                onClick={() => copyToClipboard(tracking.code)}
                aria-label="Sao chép mã đơn"
              >
                <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Khách hàng</span>
            <span className={styles.infoValue}>{tracking.customerName}</span>
          </div>

          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Số điện thoại</span>
            <span className={styles.infoValue}>{tracking.customerPhoneMasked}</span>
          </div>

          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Cập nhật</span>
            <span className={styles.infoValue}>{formatRelativeTime(tracking.updatedAt)}</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Đại lý phụ trách</h3>
        <div className={styles.dealerInfo}>
          <div className={styles.dealerIcon}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className={styles.dealerDetails}>
            <div className={styles.dealerName}>{tracking.dealerName}</div>
            {tracking.dealerPhone && (
              <a href={`tel:${tracking.dealerPhone}`} className={styles.dealerPhone}>
                <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {tracking.dealerPhone}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
