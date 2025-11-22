import React from 'react';
import type { CarType } from '../../constants/CarDatas';
import CarCard from './CarCard';
import styles from '../../styles/CompareStyle/_compare.module.scss';

interface SlotProps {
  car: CarType | null;
  onSelect: () => void;
  onRemove: () => void;
  index: number;
}

const Slot: React.FC<SlotProps> = ({ car, onSelect, onRemove, index }) => {
  if (car) {
    return (
      <div className={`${styles.slot} ${styles.slotFilled}`}>
        <CarCard car={car} onRemove={onRemove} />
      </div>
    );
  }

  return (
    <div 
      className={`${styles.slot} ${styles.slotEmpty}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-label={`Chọn xe cho vị trí ${index + 1}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <div className={styles.addIcon}>
        <i className="fas fa-plus" />
      </div>
      <div className={styles.addText}>Thêm xe để so sánh</div>
      <div className={styles.addSubtext}>
        Nhấn để chọn từ danh sách xe điện cao cấp
      </div>
    </div>
  );
};

export default Slot;