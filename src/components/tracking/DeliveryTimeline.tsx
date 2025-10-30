import type { TrackingItem } from "../../types/tracking";
import styles from "../../styles/TrackingStyles/DeliveryTimeline.module.scss";

interface DeliveryTimelineProps {
  milestones: TrackingItem["milestones"];
  currentStatus: string;
}

export default function DeliveryTimeline({ milestones, currentStatus }: DeliveryTimelineProps) {
  const formatDate = (isoDate?: string) => {
    if (!isoDate) return null;
    const date = new Date(isoDate);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getCurrentIndex = () => {
    return milestones.findIndex(m => m.key === currentStatus);
  };

  const currentIndex = getCurrentIndex();

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Lộ trình giao xe</h3>
      <div className={styles.timeline}>
        {milestones.map((milestone, index) => {
          const isCompleted = milestone.at !== undefined;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div
              key={milestone.key}
              className={`${styles.milestone} ${isCompleted ? styles.completed : ""} ${isCurrent ? styles.current : ""} ${isPending ? styles.pending : ""}`}
            >
              <div className={styles.iconWrapper}>
                <div className={styles.icon}>
                  {isCompleted ? (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isCurrent ? (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <div className={styles.dot}></div>
                  )}
                </div>
                {index < milestones.length - 1 && <div className={styles.line}></div>}
              </div>

              <div className={styles.content}>
                <div className={styles.header}>
                  <span className={styles.label}>{milestone.label}</span>
                  {milestone.at && (
                    <span className={styles.date}>{formatDate(milestone.at)}</span>
                  )}
                </div>
                {milestone.note && (
                  <div className={styles.note}>
                    <svg className={styles.noteIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {milestone.note}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
