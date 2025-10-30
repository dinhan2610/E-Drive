import styles from "../../styles/TrackingStyles/SupportCTA.module.scss";

interface SupportCTAProps {
  dealerName: string;
  dealerPhone?: string;
}

export default function SupportCTA({ dealerName, dealerPhone }: SupportCTAProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <svg className={styles.headerIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <div>
          <h3 className={styles.title}>Cần hỗ trợ?</h3>
          <p className={styles.subtitle}>Liên hệ cố vấn giao xe của bạn</p>
        </div>
      </div>

      <div className={styles.actions}>
        {dealerPhone && (
          <a href={`tel:${dealerPhone}`} className={`${styles.actionBtn} ${styles.phone}`}>
            <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <div className={styles.actionContent}>
              <span className={styles.actionLabel}>Gọi điện</span>
              <span className={styles.actionValue}>{dealerPhone}</span>
            </div>
          </a>
        )}

        {dealerPhone && (
          <a 
            href={`https://zalo.me/${dealerPhone.replace(/\D/g, '')}`} 
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.actionBtn} ${styles.zalo}`}
          >
            <svg className={styles.icon} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 2.237.738 4.304 1.986 5.97L2.05 21.95l4.013-1.937C7.727 21.262 9.787 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm3.5 13.5h-7c-.276 0-.5-.224-.5-.5s.224-.5.5-.5h7c.276 0 .5.224.5.5s-.224.5-.5.5zm0-3h-7c-.276 0-.5-.224-.5-.5s.224-.5.5-.5h7c.276 0 .5.224.5.5s-.224.5-.5.5zm0-3h-7c-.276 0-.5-.224-.5-.5s.224-.5.5-.5h7c.276 0 .5.224.5.5s-.224.5-.5.5z"/>
            </svg>
            <div className={styles.actionContent}>
              <span className={styles.actionLabel}>Chat Zalo</span>
              <span className={styles.actionValue}>Nhắn tin ngay</span>
            </div>
          </a>
        )}

        <a 
          href={`mailto:support@edrive.com?subject=Hỗ trợ đơn hàng - ${dealerName}`}
          className={`${styles.actionBtn} ${styles.email}`}
        >
          <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <div className={styles.actionContent}>
            <span className={styles.actionLabel}>Email</span>
            <span className={styles.actionValue}>support@edrive.com</span>
          </div>
        </a>
      </div>

      <div className={styles.footer}>
        <svg className={styles.footerIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Thời gian hỗ trợ: 8:00 - 20:00 hàng ngày</span>
      </div>
    </div>
  );
}
