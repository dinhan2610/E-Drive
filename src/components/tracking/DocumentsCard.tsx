import type { TrackingItem } from "../../types/tracking";
import styles from "../../styles/TrackingStyles/DocumentsCard.module.scss";

interface DocumentsCardProps {
  documents?: TrackingItem["documents"];
}

const statusConfig = {
  READY: {
    color: "#22c55e",
    bgColor: "rgba(34, 197, 94, 0.1)",
    label: "Sẵn sàng",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  },
  MISSING: {
    color: "#ef4444",
    bgColor: "rgba(239, 68, 68, 0.1)",
    label: "Thiếu",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  },
  PENDING: {
    color: "#f59e0b",
    bgColor: "rgba(245, 158, 11, 0.1)",
    label: "Đang xử lý",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  }
};

export default function DocumentsCard({ documents }: DocumentsCardProps) {
  if (!documents || documents.length === 0) {
    return (
      <div className={styles.card}>
        <h3 className={styles.title}>Tài liệu</h3>
        <div className={styles.noDocuments}>
          <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>Chưa có tài liệu</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Tài liệu</h3>
      <div className={styles.documentsList}>
        {documents.map((doc, index) => {
          const config = statusConfig[doc.status || "PENDING"];
          
          return (
            <div key={index} className={styles.document}>
              <div className={styles.documentIcon}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              
              <div className={styles.documentContent}>
                <div className={styles.documentName}>{doc.name}</div>
                <div className={styles.documentStatus} style={{ backgroundColor: config.bgColor, color: config.color }}>
                  <svg className={styles.statusIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {config.icon}
                  </svg>
                  {config.label}
                </div>
              </div>

              {doc.url && doc.status === "READY" && (
                <a
                  href={doc.url}
                  className={styles.downloadBtn}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Tải xuống ${doc.name}`}
                >
                  <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
