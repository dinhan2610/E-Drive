import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { CarType } from '../../constants/CarDatas';
import styles from '../../styles/CompareStyle/_compare.module.scss';

interface ColorVariant {
  vehicleId: number;
  color: string;
  colorHex: string;
  colorGradient?: string;
  inStock: boolean;
  priceRetail: number;
  finalPrice: number;
  imageUrl?: string;
}

interface VehicleModel {
  modelName: string;
  version: string;
  mark: string;
  year: number;
  colorVariants: (CarType & ColorVariant)[];
  baseImage: string;
  basePrice: number;
}

interface CarPickerProps {
  cars: CarType[];
  onSelect: (car: CarType) => void;
  onClose: () => void;
  selectedCars: (CarType | null)[];
}

const CarPicker: React.FC<CarPickerProps> = ({ cars, onSelect, onClose, selectedCars }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModel, setSelectedModel] = useState<VehicleModel | null>(null);
  const [selectedColor, setSelectedColor] = useState<(CarType & ColorVariant) | null>(null);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Group vehicles by model + version with color variants
  const modelGroups = useMemo(() => {
    const grouped = new Map<string, VehicleModel>();
    
    cars.forEach(car => {
      const key = `${car.name}-${car.model}`;
      
      if (!grouped.has(key)) {
        grouped.set(key, {
          modelName: car.name,
          version: car.model,
          mark: car.mark,
          year: car.year,
          colorVariants: [],
          baseImage: car.img,
          basePrice: car.price,
        });
      }
      
      const model = grouped.get(key)!;
      
      // Add as color variant (assuming each car in array is different color)
      model.colorVariants.push({
        ...car,
        vehicleId: model.colorVariants.length + 1,
        color: car.fuel || `Màu ${model.colorVariants.length + 1}`, // Use fuel as temp color name
        colorHex: getColorHex(model.colorVariants.length),
        inStock: true,
        priceRetail: car.price,
        finalPrice: car.price,
        imageUrl: car.img,
      });
    });
    
    return Array.from(grouped.values());
  }, [cars]);

  // Helper to generate color hex (temporary - should come from API)
  function getColorHex(index: number): string {
    const colors = [
      '#FFFFFF', '#000000', '#C0C0C0', '#FF0000', '#0000FF',
      '#808080', '#FFD700', '#8B4513', '#00FF00', '#FFA500'
    ];
    return colors[index % colors.length];
  }

  // Filter models based on search term
  const filteredModels = useMemo(() => {
    if (!searchTerm) return modelGroups;
    
    return modelGroups.filter(model =>
      model.modelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.version.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.mark.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, modelGroups]);

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
    }).format(price * 1000000);
  };

  const isCarSelected = (car: CarType) => {
    return selectedCars.some(selected => selected?.name === car.name);
  };

  const isLightColor = (hex: string): boolean => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma > 200;
  };

  const getBorderColor = (hex: string): string => {
    if (hex === '#FFFFFF' || hex === '#ffffff') return '#d1d5db';
    if (isLightColor(hex)) return '#94a3b8';
    return hex;
  };

  const handleModelSelect = (model: VehicleModel) => {
    setSelectedModel(model);
    // Auto-select first available color
    const firstAvailable = model.colorVariants.find(v => v.inStock);
    setSelectedColor(firstAvailable || model.colorVariants[0]);
  };

  const handleColorSelect = (variant: CarType & ColorVariant) => {
    setSelectedColor(variant);
  };

  const handleConfirmSelection = () => {
    if (selectedColor) {
      onSelect(selectedColor);
    }
  };

  const handleBack = () => {
    setSelectedModel(null);
    setSelectedColor(null);
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
            {selectedModel ? 'Chọn màu xe' : 'Chọn mẫu xe'}
          </h2>
          <p className={styles.modalSubtitle}>
            {selectedModel 
              ? `${selectedModel.modelName} ${selectedModel.version} - ${selectedModel.colorVariants.length} màu có sẵn`
              : `Chọn từ ${modelGroups.length} mẫu xe điện cao cấp`
            }
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
          {/* Search box - only show when selecting model */}
          {!selectedModel && (
            <div className={styles.searchWrapper}>
              <div className={styles.searchBox}>
                <i className="fas fa-search" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Tìm kiếm theo tên xe, phiên bản..."
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
          )}

          {/* Step 1: Model Selection Grid */}
          {!selectedModel && (
            <div className={styles.carGrid}>
              {filteredModels.length > 0 ? (
                filteredModels.map((model, index) => (
                  <div
                    key={index}
                    className={styles.carOption}
                    onClick={() => handleModelSelect(model)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Chọn xe ${model.modelName} ${model.version}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleModelSelect(model);
                      }
                    }}
                  >
                    <img 
                      src={model.baseImage} 
                      alt={`${model.modelName} ${model.version}`}
                      className={styles.carImageSmall}
                      loading="lazy" 
                    />
                    
                    <div className={styles.carDetails}>
                      <div className={styles.carNameSmall} title={`${model.modelName} ${model.version}`}>
                        {model.modelName}
                      </div>
                      <div className={styles.carMarkModel}>
                        {model.version}
                      </div>
                      <div className={styles.carPriceSmall}>
                        {formatPrice(model.basePrice)}
                      </div>
                      <div className={styles.colorBadge}>
                        <i className="fas fa-palette" />
                        {model.colorVariants.length} màu
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
          )}

          {/* Step 2: Color Selection */}
          {selectedModel && (
            <div className={styles.colorSelectionContainer}>
              <button className={styles.backButton} onClick={handleBack}>
                <i className="fas fa-arrow-left" />
                Quay lại chọn mẫu xe
              </button>

              <div className={styles.selectedModelInfo}>
                <img 
                  src={selectedColor?.img || selectedModel.baseImage} 
                  alt={selectedModel.modelName}
                  className={styles.previewImage}
                />
                <div className={styles.modelDetails}>
                  <h3>{selectedModel.modelName}</h3>
                  <p className={styles.version}>{selectedModel.version}</p>
                  <p className={styles.selectedColorName}>
                    Màu: <strong>{selectedColor?.color || 'Chọn màu'}</strong>
                  </p>
                  <p className={styles.price}>
                    {selectedColor ? formatPrice(selectedColor.price) : formatPrice(selectedModel.basePrice)}
                  </p>
                </div>
              </div>

              <div className={styles.colorPickerSection}>
                <h4 className={styles.colorPickerTitle}>
                  <i className="fas fa-palette" />
                  Chọn màu xe ({selectedModel.colorVariants.length} màu có sẵn)
                </h4>
                
                <div className={styles.colorGrid}>
                  {selectedModel.colorVariants.map((variant) => {
                    const isSelected = selectedColor?.vehicleId === variant.vehicleId;
                    const borderColor = getBorderColor(variant.colorHex);
                    
                    return (
                      <button
                        key={variant.vehicleId}
                        type="button"
                        className={`${styles.colorOption} ${
                          isSelected ? styles.colorOptionActive : ''
                        } ${!variant.inStock ? styles.colorOptionOutOfStock : ''}`}
                        onClick={() => handleColorSelect(variant)}
                        disabled={!variant.inStock}
                      >
                        <div 
                          className={styles.colorCircle}
                          style={{ 
                            background: variant.colorGradient || variant.colorHex,
                            border: `3px solid ${isSelected ? '#ff4d30' : borderColor}`,
                            boxShadow: isSelected ? 
                              '0 0 0 4px rgba(255, 77, 48, 0.2), 0 4px 20px rgba(255, 77, 48, 0.4)' : 
                              '0 2px 10px rgba(0, 0, 0, 0.15)',
                          }}
                        >
                          {isSelected && (
                            <i className="fas fa-check" style={{ 
                              color: isLightColor(variant.colorHex) ? '#1e293b' : '#fff',
                              fontSize: '20px',
                              fontWeight: 'bold',
                            }}></i>
                          )}
                          {!variant.inStock && (
                            <div className={styles.outOfStockBadge}>Hết hàng</div>
                          )}
                        </div>
                        <span className={styles.colorName}>{variant.color}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.actionButtons}>
                <button 
                  className={styles.confirmButton}
                  onClick={handleConfirmSelection}
                  disabled={!selectedColor || !selectedColor.inStock}
                >
                  <i className="fas fa-check-circle" />
                  Chọn xe này
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarPicker;