import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { VehicleApiResponse, ColorVariant } from '../../types/product';
import { fetchVehiclesFromApi } from '../../services/vehicleApi';
import { toVND } from '../../utils/currency';
import { getColorStyle } from '../../utils/colorMapping';
import styles from './CarPicker.module.scss';

// Model group interface
interface VehicleModel {
  modelName: string;
  version: string;
  colorVariants: ColorVariant[];
  specs: {
    rangeKm: number;
    batteryCapacityKwh: number;
  };
}

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
  const [selectedModel, setSelectedModel] = useState<VehicleModel | null>(null);
  const [selectedColor, setSelectedColor] = useState<ColorVariant | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load vehicles from API
  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const { vehicles: data } = await fetchVehiclesFromApi({ size: 1000, status: 'AVAILABLE' });
      setVehicles(data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  // Group vehicles by model+version
  const modelGroups = useMemo(() => {
    const grouped = new Map<string, VehicleModel>();
    
    vehicles.forEach(vehicle => {
      const key = `${vehicle.modelName}-${vehicle.version}`;
      
      if (!grouped.has(key)) {
        grouped.set(key, {
          modelName: vehicle.modelName,
          version: vehicle.version,
          colorVariants: [],
          specs: {
            rangeKm: vehicle.rangeKm,
            batteryCapacityKwh: vehicle.batteryCapacityKwh,
          },
        });
      }
      
      const model = grouped.get(key)!;
      const colorStyle = getColorStyle(vehicle.color);
      
      model.colorVariants.push({
        vehicleId: vehicle.vehicleId,
        color: vehicle.color,
        colorHex: colorStyle.solid,
        colorGradient: colorStyle.gradient,
        priceRetail: vehicle.priceRetail,
        finalPrice: vehicle.finalPrice > 0 ? vehicle.finalPrice : vehicle.priceRetail,
        imageUrl: vehicle.imageUrl,
        inStock: vehicle.status === 'AVAILABLE',
      });
    });
    
    return Array.from(grouped.values());
  }, [vehicles]);

  // Filter models based on search
  const filteredModels = search
    ? modelGroups.filter(model =>
        model.modelName.toLowerCase().includes(search.toLowerCase()) ||
        model.version.toLowerCase().includes(search.toLowerCase())
      )
    : modelGroups;

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

  const handleModelSelect = (model: VehicleModel) => {
    setSelectedModel(model);
    setSelectedColor(null); // Reset color when changing model
    setIsOpen(false);
    setSearch('');
    setFocusedIndex(-1);
  };

  const handleColorSelect = (colorVariant: ColorVariant) => {
    if (!colorVariant.inStock || !selectedModel) return;
    
    setSelectedColor(colorVariant);
    
    // Find the full vehicle data and notify parent
    const fullVehicle = vehicles.find(v => v.vehicleId === colorVariant.vehicleId);
    if (fullVehicle) {
      onChange(fullVehicle);
    }
  };

  const handleClear = () => {
    setSelectedModel(null);
    setSelectedColor(null);
    setSearch('');
    onChange(null as any);
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
        setFocusedIndex(prev => Math.min(prev + 1, filteredModels.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && filteredModels[focusedIndex]) {
          handleModelSelect(filteredModels[focusedIndex]);
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
      {/* Step 1: Model Selection */}
      <label htmlFor="car-search" className={styles.label}>
        <i className="fas fa-car"></i>
        Chọn mẫu xe
      </label>
      
      {!selectedModel ? (
        <>
          <div className={styles.inputWrapper}>
            <input
              ref={inputRef}
              id="car-search"
              type="text"
              className={styles.searchInput}
              placeholder="Tìm kiếm mẫu xe..."
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

          {isOpen && (
            <div
              id="car-dropdown"
              className={styles.dropdown}
              role="listbox"
              aria-label="Danh sách mẫu xe"
            >
              {loading ? (
                <div className={styles.loadingState}>
                  <i className="fas fa-spinner fa-spin"></i>
                  <p>Đang tải...</p>
                </div>
              ) : filteredModels.length === 0 ? (
                <div className={styles.emptyState}>
                  <i className="fas fa-search"></i>
                  <p>Không tìm thấy mẫu xe phù hợp</p>
                </div>
              ) : (
                filteredModels.map((model, index) => (
                  <button
                    key={`${model.modelName}-${model.version}`}
                    type="button"
                    className={`${styles.option} ${focusedIndex === index ? styles.focused : ''}`}
                    onClick={() => handleModelSelect(model)}
                    onMouseEnter={() => setFocusedIndex(index)}
                    role="option"
                  >
                    <div className={styles.optionInfo}>
                      <span className={styles.optionName}>
                        {model.modelName} {model.version}
                      </span>
                      <span className={styles.optionDetails}>
                        {model.specs.rangeKm}km • {model.specs.batteryCapacityKwh}kWh • {model.colorVariants.length} màu
                      </span>
                    </div>
                    <span className={styles.optionPrice}>{toVND(model.colorVariants[0]?.finalPrice || 0)}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </>
      ) : (
        <div className={styles.selectedCar}>
          <div className={styles.selectedInfo}>
            <span className={styles.selectedName}>
              {selectedModel.modelName} {selectedModel.version}
            </span>
            <span className={styles.selectedDetails}>
              {selectedModel.specs.rangeKm}km • {selectedModel.specs.batteryCapacityKwh}kWh
            </span>
          </div>
          <button
            type="button"
            className={styles.clearButton}
            onClick={handleClear}
            aria-label="Xóa lựa chọn"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Step 2: Color Selection */}
      {selectedModel && (
        <div className={styles.colorSection}>
          <label className={styles.label} style={{ marginTop: '20px' }}>
            <i className="fas fa-palette"></i>
            Chọn màu sắc
          </label>

          <div className={styles.colorSwatches}>
            {selectedModel.colorVariants.map(colorVariant => (
              <div
                key={colorVariant.vehicleId}
                className={`${styles.colorSwatch} ${selectedColor?.vehicleId === colorVariant.vehicleId ? styles.selected : ''} ${!colorVariant.inStock ? styles.outOfStock : ''}`}
                onClick={() => handleColorSelect(colorVariant)}
              >
                <div
                  className={styles.colorCircle}
                  style={{ background: colorVariant.colorGradient || colorVariant.colorHex }}
                >
                  {selectedColor?.vehicleId === colorVariant.vehicleId && (
                    <i className="fas fa-check"></i>
                  )}
                  {!colorVariant.inStock && (
                    <div className={styles.stockBadge}>Hết hàng</div>
                  )}
                </div>
                <span className={styles.colorName}>{colorVariant.color}</span>
              </div>
            ))}
          </div>

          {/* Vehicle Preview */}
          {selectedColor && (
            <div className={styles.vehiclePreview}>
              <div className={styles.previewImage}>
                {selectedColor.imageUrl ? (
                  <img src={selectedColor.imageUrl} alt={selectedColor.color} />
                ) : (
                  <i className="fas fa-car" style={{ fontSize: '64px', color: selectedColor.colorHex }}></i>
                )}
              </div>
              <div className={styles.previewInfo}>
                <h5>{selectedModel.modelName} {selectedModel.version}</h5>
                <p className={styles.previewColor}>Màu: {selectedColor.color}</p>
                <p className={styles.previewPrice}>{toVND(selectedColor.finalPrice)}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CarPicker;
