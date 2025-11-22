import React, { useState, useEffect } from 'react';
import type { CarType } from '../constants/CarDatas';
import Slot from '../components/Compare/Slot.tsx';
import CarPicker from '../components/Compare/CarPicker.tsx';
import SpecTable from '../components/Compare/SpecTable.tsx';
import styles from '../styles/CompareStyle/_compare.module.scss';
import { fetchVehiclesFromApi, convertVehicleToProduct } from '../services/vehicleApi';
import type { Product } from '../types/product';

// Convert Product to CarType for compare page
function convertProductToCarType(product: Product): CarType {
  return {
    name: product.name,
    price: product.price / 1000000, // Convert to millions
    img: product.image,
    model: product.variant,
    mark: product.name.split(' ')[0], // First word as brand
    year: new Date().getFullYear(),
    doors: "4/5",
    air: "Yes",
    transmission: "Tự động",
    fuel: "Xe Điện",
  };
}

const Compare: React.FC = () => {
  const [selected, setSelected] = useState<(CarType | null)[]>([null, null, null, null]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
  const [availableCars, setAvailableCars] = useState<CarType[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch vehicles from API
  useEffect(() => {
    const loadVehicles = async () => {
      try {
        setLoading(true);
        const { vehicles } = await fetchVehiclesFromApi({ size: 100, status: 'AVAILABLE' });
        const products = vehicles.map(convertVehicleToProduct);
        const cars = products.map(convertProductToCarType);
        setAvailableCars(cars);
      } catch (error) {
        console.error('Error loading vehicles:', error);
        setAvailableCars([]);
      } finally {
        setLoading(false);
      }
    };

    loadVehicles();
  }, []);

  const handleSelect = (index: number, car: CarType) => {
    const next = [...selected];
    next[index] = car;
    setSelected(next);
    setPickerOpen(false);
    setActiveSlotIndex(null);
  };

  const handleRemove = (index: number) => {
    const next = [...selected];
    next[index] = null;
    setSelected(next);
  };

  const handleOpenPicker = (index: number) => {
    setActiveSlotIndex(index);
    setPickerOpen(true);
  };

  const handleClosePicker = () => {
    setPickerOpen(false);
    setActiveSlotIndex(null);
  };

  const selectedCars = selected.filter((car): car is CarType => car !== null);
  const showSpecTable = selectedCars.length >= 2;

  return (
    <div className={styles.comparePage}>
      {/* Header Section */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContainer}>
          <div className={styles.headerContent}>
            <div className={styles.headerTop}>
              <h1 className={styles.pageTitle}>
                <i className="fas fa-chart-line" />
                So sánh mẫu xe
              </h1>
              <p className={styles.pageSubtitle}>
                Chọn tối đa 4 mẫu xe để so sánh chi tiết các thông số kỹ thuật và tính năng
              </p>
            </div>

            <div className={styles.progressSection}>
              <div className={styles.progressCard}>
                <div className={styles.progressHeader}>
                  <span className={styles.progressLabel}>
                    <i className="fas fa-car" />
                    Đã chọn
                  </span>
                  <span className={styles.progressCount}>
                    <strong>{selectedCars.length}</strong>
                    <span>/4</span>
                  </span>
                </div>
                <div className={styles.progressBarWrapper}>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill}
                      style={{ width: `${(selectedCars.length / 4) * 100}%` }}
                    />
                  </div>
                  <span className={styles.progressPercent}>
                    {Math.round((selectedCars.length / 4) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <div className={styles.contentContainer}>
          {/* Selection Section */}
          <div className={styles.selectionSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <i className="fas fa-car-side" />
                Chọn xe để so sánh
              </h2>
              {selectedCars.length > 0 && (
                <button 
                  className={styles.clearAllBtn}
                  onClick={() => setSelected([null, null, null, null])}
                >
                  <i className="fas fa-times-circle" />
                  Xóa tất cả
                </button>
              )}
            </div>

            <div className={styles.slotsGrid}>
              {selected.map((car, index) => (
                <Slot
                  key={index}
                  car={car}
                  onSelect={() => handleOpenPicker(index)}
                  onRemove={() => handleRemove(index)}
                  index={index}
                />
              ))}
            </div>
          </div>

          {/* Comparison Table Section */}
          {showSpecTable && (
            <div className={styles.comparisonSection}>
              <SpecTable selectedCars={selectedCars} />
            </div>
          )}

          {/* Empty State */}
          {selectedCars.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <i className="fas fa-cars" />
              </div>
              <h3 className={styles.emptyTitle}>Chưa có xe nào được chọn</h3>
              <p className={styles.emptyText}>
                Nhấn vào các ô bên trên để chọn xe từ danh sách và bắt đầu so sánh
              </p>
            </div>
          )}

          {/* Hint for minimum selection */}
          {selectedCars.length === 1 && (
            <div className={styles.hintBox}>
              <i className="fas fa-info-circle" />
              <span>Chọn thêm ít nhất 1 xe nữa để bắt đầu so sánh</span>
            </div>
          )}
        </div>
      </div>

      {/* Car Picker Modal */}
      {pickerOpen && activeSlotIndex !== null && (
        <CarPicker
          cars={availableCars}
          onSelect={(car: CarType) => handleSelect(activeSlotIndex, car)}
          onClose={handleClosePicker}
          selectedCars={selected}
        />
      )}

      {/* Loading State */}
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}>
            <i className="fas fa-spinner fa-spin" />
            <span>Đang tải danh sách xe...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Compare;