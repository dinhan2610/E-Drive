import React, { useState } from 'react';
import type { PaymentScheduleItem } from '../../utils/financing';
import { toVND } from '../../utils/currency';
import styles from './ScheduleTable.module.scss';

interface ScheduleTableProps {
  schedule: PaymentScheduleItem[];
}

const ScheduleTable: React.FC<ScheduleTableProps> = ({ schedule }) => {
  const [showAll, setShowAll] = useState(false);
  const displayItems = showAll ? schedule : schedule.slice(0, 12);
  const hasMore = schedule.length > 12;

  return (
    <div className={styles.scheduleTable}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <i className="fas fa-table"></i>
          Lịch trả góp chi tiết
        </h3>
        <span className={styles.count}>
          {schedule.length} kỳ thanh toán
        </span>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>
                <i className="fas fa-hashtag"></i>
                Kỳ
              </th>
              <th>
                <i className="fas fa-calendar-day"></i>
                Tháng
              </th>
              <th>
                <i className="fas fa-money-bill"></i>
                Trả hàng tháng
              </th>
              <th>
                <i className="fas fa-chart-line"></i>
                Dư nợ còn lại
              </th>
            </tr>
          </thead>
          <tbody>
            {displayItems.map((item) => (
              <tr 
                key={item.period}
              >
                <td className={styles.period}>
                  <span className={styles.periodBadge}>{item.period}</span>
                </td>
                <td className={styles.month}>Tháng {item.period}</td>
                <td className={styles.payment}>{toVND(item.monthly)}</td>
                <td className={styles.remaining}>
                  {toVND(item.remaining)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <button
          type="button"
          className={styles.toggleButton}
          onClick={() => setShowAll(!showAll)}
        >
          <i className={`fas fa-chevron-${showAll ? 'up' : 'down'}`}></i>
          {showAll ? 'Thu gọn' : `Xem thêm ${schedule.length - 12} kỳ`}
        </button>
      )}

      <div className={styles.footer}>
        <div className={styles.footerItem}>
          <i className="fas fa-info-circle"></i>
          <span>Số tiền trả hàng tháng cố định với lãi suất 0%</span>
        </div>
      </div>
    </div>
  );
};

export default ScheduleTable;
