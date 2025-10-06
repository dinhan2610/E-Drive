import React, { useState, useEffect, useRef } from 'react';
import type { CarType } from '../../constants/CarDatas';
import styles from '../../styles/CompareStyle/_compare.module.scss';

interface CarPickerProps {
  cars: CarType[];
  onSelect: (car: CarType) => void;
  onClose: () => void;
  selectedCars: (CarType | null)[];
}

const CarPicker: React.FC<CarPickerProps> = ({ cars, onSelect, onClose, selectedCars }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCars, setFilteredCars] = useState(cars);
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter cars based on search term
  useEffect(() => {
    const filtered = cars.filter(car =>
      car.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.mark.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.model.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCars(filtered);
  }, [searchTerm, cars]);

  // Focus search input when modal opens
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Trap focus within modal
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(price * 1000000); // Convert to millions for realistic pricing
  };

  const isCarSelected = (car: CarType) => {
    return selectedCars.some(selected => selected?.name === car.name);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div 
        className={styles.modal}
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className={styles.modalHeader}>
          <h2 id="modal-title" className={styles.modalTitle}>
            Chọn xe để so sánh
          </h2>
          <p className={styles.modalSubtitle}>
            Chọn từ {cars.length} mẫu xe điện cao cấp
          </p>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Đóng"
            title="Đóng hộp thoại"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        <div className={styles.modalContent}>
          <div className={styles.searchWrapper}>
            <div className={styles.searchBox}>
              <i className="fas fa-search" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Tìm kiếm theo tên xe, hãng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
              {searchTerm && (
                <button
                  className={styles.clearSearch}
                  onClick={() => setSearchTerm('')}
                  aria-label="Xóa tìm kiếm"
                >
                  <i className="fas fa-times" />
                </button>
              )}
            </div>
          </div>

          <div className={styles.carGrid}>
            {filteredCars.length > 0 ? (
              filteredCars.map((car, index) => (
                <div
                  key={index}
                  className={`${styles.carOption} ${isCarSelected(car) ? styles.carOptionSelected : ''}`}
                  onClick={() => !isCarSelected(car) && onSelect(car)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Chọn xe ${car.name}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (!isCarSelected(car)) {
                        onSelect(car);
                      }
                    }
                  }}
                >
                  {isCarSelected(car) && (
                    <div className={styles.selectedBadge}>
                      <i className="fas fa-check" />
                      Đã chọn
                    </div>
                  )}
                  
                  <img 
                    src={car.img} 
                    alt={car.name} 
                    className={styles.carImageSmall}
                    loading="lazy" 
                  />
                  
                  <div className={styles.carDetails}>
                    <div className={styles.carNameSmall} title={car.name}>
                      {car.name}
                    </div>
                    <div className={styles.carMarkModel}>
                      {car.mark} {car.model}
                    </div>
                    <div className={styles.carPriceSmall}>
                      {formatPrice(car.price)}
                    </div>
                    <div className={styles.carYear}>
                      Năm SX: {car.year}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.noResults}>
                <i className="fas fa-search" />
                <h3>Không tìm thấy xe nào</h3>
                <p>Thử tìm kiếm với từ khóa khác</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarPicker;