import type { TrackingItem } from "../../types/tracking";
import styles from "../../styles/TrackingStyles/VehicleCard.module.scss";
import { useState } from "react";

interface VehicleCardProps {
  vehicle: TrackingItem["vehicle"];
}

export default function VehicleCard({ vehicle }: VehicleCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`Đã sao chép VIN: ${text}`);
  };

  return (
    <div className={styles.card}>
      <div className={styles.imageWrapper}>
        {!imageLoaded && (
          <div className={styles.imageSkeleton}>
            <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <img
          src={vehicle.image || "https://via.placeholder.com/800x450?text=Vehicle"}
          alt={vehicle.model}
          className={`${styles.image} ${imageLoaded ? styles.loaded : ""}`}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
        />
        <div className={styles.badge}>
          <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          Xe của bạn
        </div>
      </div>

      <div className={styles.content}>
        <h3 className={styles.model}>{vehicle.model}</h3>
        <div className={styles.details}>
          {vehicle.variant && (
            <div className={styles.detail}>
              <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span className={styles.label}>Phiên bản:</span>
              <span className={styles.value}>{vehicle.variant}</span>
            </div>
          )}
          {vehicle.color && (
            <div className={styles.detail}>
              <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              <span className={styles.label}>Màu sắc:</span>
              <span className={styles.value}>{vehicle.color}</span>
            </div>
          )}
        </div>

        {vehicle.vin ? (
          <div className={styles.vinSection}>
            <div className={styles.vinHeader}>
              <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className={styles.vinLabel}>Số VIN</span>
            </div>
            <div className={styles.vinValue}>
              <span className={styles.vin}>{vehicle.vin}</span>
              <button
                className={styles.copyBtn}
                onClick={() => copyToClipboard(vehicle.vin!)}
                aria-label="Sao chép VIN"
              >
                <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.noVin}>
            <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>VIN sẽ được cập nhật khi xe được phân bổ</span>
          </div>
        )}
      </div>
    </div>
  );
}
