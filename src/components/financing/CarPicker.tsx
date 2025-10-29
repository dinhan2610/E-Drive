import React, { useState, useRef, useEffect } from 'react';
import type { VehicleApiResponse } from '../../types/product';
import { fetchVehiclesFromApi } from '../../services/vehicleApi';
import { toVND } from '../../utils/currency';
import styles from './CarPicker.module.scss';

interface CarPickerProps {
  value?: VehicleApiResponse;
  onChange: (car: VehicleApiResponse) => void;
}

const CarPicker: React.FC<CarPickerProps> = ({ value, onChange }) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [vehicles, setVehicles] = useState<VehicleApiResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load vehicles from API
  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const { vehicles: data } = await fetchVehiclesFromApi({ size: 100, status: 'AVAILABLE' });
      setVehicles(data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter vehicles based on search
  const filteredVehicles = search
    ? vehicles.filter(car =>
        car.modelName.toLowerCase().includes(search.toLowerCase()) ||
        car.version.toLowerCase().includes(search.toLowerCase()) ||
        car.color.toLowerCase().includes(search.toLowerCase())
      )
    : vehicles;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (car: VehicleApiResponse) => {
    onChange(car);
    setIsOpen(false);
    setSearch('');
    setFocusedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsOpen(true);
        setFocusedIndex(0);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, filteredVehicles.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && filteredVehicles[focusedIndex]) {
          handleSelect(filteredVehicles[focusedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
    }
  };

  return (
    <div className={styles.carPicker} ref={dropdownRef}>
      <label htmlFor="car-search" className={styles.label}>
        <i className="fas fa-car"></i>
        Chọn mẫu xe
      </label>
      
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          id="car-search"
          type="text"
          className={styles.searchInput}
          placeholder="Tìm kiếm xe theo tên, phiên bản..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls="car-dropdown"
        />
        <i className={`fas fa-search ${styles.searchIcon}`}></i>
      </div>

      {value && !isOpen && (
        <div className={styles.selectedCar}>
          <div className={styles.selectedInfo}>
            <span className={styles.selectedName}>
              {value.modelName} {value.version}
            </span>
            <span className={styles.selectedDetails}>
              {value.color} • {value.rangeKm}km
            </span>
            <span className={styles.selectedPrice}>{toVND(value.priceRetail)}</span>
          </div>
          <button
            type="button"
            className={styles.clearButton}
            onClick={() => {
              onChange(null as any);
              setSearch('');
            }}
            aria-label="Xóa lựa chọn"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {isOpen && (
        <div
          id="car-dropdown"
          className={styles.dropdown}
          role="listbox"
          aria-label="Danh sách xe"
        >
          {loading ? (
            <div className={styles.loadingState}>
              <i className="fas fa-spinner fa-spin"></i>
              <p>Đang tải...</p>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className={styles.emptyState}>
              <i className="fas fa-search"></i>
              <p>Không tìm thấy xe phù hợp</p>
            </div>
          ) : (
            filteredVehicles.map((car, index) => (
              <button
                key={car.vehicleId}
                type="button"
                className={`${styles.option} ${focusedIndex === index ? styles.focused : ''}`}
                onClick={() => handleSelect(car)}
                onMouseEnter={() => setFocusedIndex(index)}
                role="option"
                aria-selected={value?.vehicleId === car.vehicleId}
              >
                <div className={styles.optionInfo}>
                  <span className={styles.optionName}>
                    {car.modelName} {car.version}
                  </span>
                  <span className={styles.optionDetails}>
                    {car.color} • {car.rangeKm}km • {car.batteryCapacityKwh}kWh
                  </span>
                </div>
                <span className={styles.optionPrice}>{toVND(car.priceRetail)}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CarPicker;
