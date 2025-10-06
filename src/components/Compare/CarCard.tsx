import React from 'react';
import type { CarType } from '../../constants/CarDatas';
import styles from '../../styles/CompareStyle/_compare.module.scss';

interface CarCardProps {
  car: CarType;
  onRemove: () => void;
}

const CarCard: React.FC<CarCardProps> = ({ car, onRemove }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className={styles.carCard}>
      <button
        className={styles.removeButton}
        onClick={onRemove}
        aria-label="Xóa xe khỏi so sánh"
        title="Xóa xe khỏi so sánh"
      >
        <i className="fas fa-times" />
      </button>
      
      <div className={styles.carImage}>
        <img src={car.img} alt={car.name} loading="lazy" />
      </div>
      
      <div className={styles.carInfo}>
        <div className={styles.carName}>{car.name}</div>
        <div className={styles.carPrice}>{formatPrice(car.price)}</div>
        
        <div className={styles.carSpecs}>
          <div className={styles.spec}>
            <i className="fas fa-calendar-alt icon" />
            <span>{car.year}</span>
          </div>
          <div className={styles.spec}>
            <i className="fas fa-door-open icon" />
            <span>{car.doors} cửa</span>
          </div>
          <div className={styles.spec}>
            <i className="fas fa-cogs icon" />
            <span>{car.transmission}</span>
          </div>
          <div className={styles.spec}>
            <i className="fas fa-gas-pump icon" />
            <span>{car.fuel}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarCard;