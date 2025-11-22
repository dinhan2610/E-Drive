import React from 'react';
import type { FinancingResult } from '../../utils/financing';
import { toVND } from '../../utils/currency';
import styles from './SummaryCard.module.scss';

interface SummaryCardProps {
  carName: string;
  result: FinancingResult;
  months: number;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ carName, result, months }) => {
  return (
    <div className={styles.summaryCard}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <i className="fas fa-calculator"></i>
          Kết quả tính toán
        </h3>
        <span className={styles.badge}>
          <i className="fas fa-percentage"></i>
          0% lãi suất
        </span>
      </div>

      <div className={styles.carInfo}>
        <i className="fas fa-car"></i>
        <span>{carName}</span>
      </div>

      <div className={styles.details}>
        <div className={styles.row}>
          <span className={styles.rowLabel}>
            <i className="fas fa-tag"></i>
            Giá xe
          </span>
          <span className={styles.rowValue}>{toVND(result.dp + result.loanAmount)}</span>
        </div>

        <div className={styles.row}>
          <span className={styles.rowLabel}>
            <i className="fas fa-hand-holding-usd"></i>
            Trả trước
          </span>
          <span className={styles.rowValue}>{toVND(result.dp)}</span>
        </div>

        <div className={styles.divider}></div>

        <div className={styles.row}>
          <span className={styles.rowLabel}>
            <i className="fas fa-money-bill-wave"></i>
            Số tiền vay
          </span>
          <span className={styles.rowValue}>{toVND(result.loanAmount)}</span>
        </div>

        <div className={styles.row}>
          <span className={styles.rowLabel}>
            <i className="fas fa-calendar-check"></i>
            Kỳ hạn
          </span>
          <span className={styles.rowValue}>{months} tháng</span>
        </div>

        <div className={styles.highlight}>
          <div className={styles.highlightLabel}>
            <i className="fas fa-coins"></i>
            Số tiền trả hằng tháng
          </div>
          <div className={styles.highlightValue}>{toVND(result.monthly)}</div>
        </div>

        <div className={styles.divider}></div>

        <div className={styles.row}>
          <span className={styles.rowLabel}>
            <i className="fas fa-wallet"></i>
            Tổng phải trả
          </span>
          <span className={styles.rowValue}>{toVND(result.totalPayable)}</span>
        </div>

        <div className={styles.savings}>
          <i className="fas fa-gift"></i>
          <span>Tiết kiệm {toVND(0)} với lãi suất 0%</span>
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;
