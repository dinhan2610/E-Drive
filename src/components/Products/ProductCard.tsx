import React, { useState } from 'react';
import type { Product, ColorVariant } from '../../types/product';
import { formatPrice } from '../../utils/productUtils';
import { isLightColor, getBorderColor } from '../../utils/colorMapping';
import styles from '../../styles/ProductsStyles/ProductCard.module.scss';

interface ProductCardProps {
  item: Product;
  onViewDetails?: (product: Product) => void;
  onContactDealer?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  item, 
  onViewDetails, 
  onContactDealer 
}) => {
  const [imageSrc, setImageSrc] = useState(item.image);
  const [imageError, setImageError] = useState(false);
  const [selectedColorVariant, setSelectedColorVariant] = useState<ColorVariant | null>(
    item.colorVariants && item.colorVariants.length > 0 ? item.colorVariants[0] : null
  );

  const handleImageError = () => {
    if (!imageError) {
      setImageError(true);
      // Try fallback to existing images
      const fallbackImages = [
        '/src/images/cars-big/audia1.jpg',
        '/src/images/cars-big/bmw320.jpg',
        '/src/images/cars-big/golf6.jpg',
      ];
      const randomFallback = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
      setImageSrc(randomFallback);
    }
  };
  
  const handleColorSelect = (variant: ColorVariant) => {
    setSelectedColorVariant(variant);
    // Update image nếu có imageUrl
    if (variant.imageUrl) {
      setImageSrc(variant.imageUrl);
      setImageError(false);
    }
  };

  const handleViewDetails = () => {
    console.log('🔍 ProductCard - View Details clicked');
    console.log('📦 Product:', item);
    console.log('🎨 Selected Color:', selectedColorVariant);
    
    if (onViewDetails) {
      // Pass product với selected color info
      const productWithColor = {
        ...item,
        selectedColor: selectedColorVariant?.color || item.selectedColor,
        id: selectedColorVariant?.vehicleId.toString() || item.id,
      };
      onViewDetails(productWithColor);
    }
  };

  const handleContactDealer = () => {
    if (onContactDealer) {
      // Pass product với selected color info
      const productWithColor = {
        ...item,
        selectedColor: selectedColorVariant?.color || item.selectedColor,
        id: selectedColorVariant?.vehicleId.toString() || item.id,
        price: selectedColorVariant ? 
          (selectedColorVariant.finalPrice > 0 ? selectedColorVariant.finalPrice : selectedColorVariant.priceRetail) : 
          item.price,
        originalPrice: selectedColorVariant && selectedColorVariant.finalPrice > 0 && selectedColorVariant.finalPrice < selectedColorVariant.priceRetail ? 
          selectedColorVariant.priceRetail : 
          item.originalPrice,
      };
      onContactDealer(productWithColor);
    }
  };

  const containerClass = `${styles.card} ${!item.inStock ? styles.outOfStock : ''}`;

  return (
    <article className={containerClass}>
      <div className={styles.imageContainer}>
        <img 
          src={imageSrc} 
          alt={`${item.name} ${item.variant}`}
          loading="lazy"
          onError={handleImageError}
        />
      </div>

      <div className={styles.content}>
        <div className={styles.title}>
          <h3>{item.name}</h3>
          <div className={styles.variant}>{item.variant}</div>
        </div>

        <div className={styles.pricing}>
          <p className={styles.price}>
            {formatPrice(selectedColorVariant ? 
              (selectedColorVariant.finalPrice > 0 ? selectedColorVariant.finalPrice : selectedColorVariant.priceRetail) : 
              item.price
            )}
            {((selectedColorVariant && selectedColorVariant.finalPrice > 0 && selectedColorVariant.finalPrice < selectedColorVariant.priceRetail) || item.originalPrice) && (
              <span className={styles.originalPrice}>
                {formatPrice(selectedColorVariant ? selectedColorVariant.priceRetail : item.originalPrice!)}
              </span>
            )}
          </p>
        </div>

        {/* Color Selector */}
        {item.colorVariants && item.colorVariants.length > 1 && (
          <div className={styles.colorSelector}>
            <div className={styles.colorLabel}>
              <span>Màu xe: <strong>{selectedColorVariant?.color || item.selectedColor}</strong></span>
              <span className={styles.colorCount}>({item.colorVariants.length} màu)</span>
            </div>
            <div className={styles.colorOptions}>
              {item.colorVariants.map((variant) => {
                const isSelected = selectedColorVariant?.vehicleId === variant.vehicleId;
                const borderColor = getBorderColor(variant.colorHex);
                
                return (
                  <button
                    key={variant.vehicleId}
                    type="button"
                    className={`${styles.colorButton} ${
                      isSelected ? styles.active : ''
                    } ${!variant.inStock ? styles.outOfStock : ''}`}
                    style={{ 
                      background: variant.colorGradient || variant.colorHex,
                      border: `2px solid ${isSelected ? '#ff4d30' : borderColor}`,
                      boxShadow: isSelected ? 
                        '0 0 0 3px rgba(255, 77, 48, 0.2), 0 4px 16px rgba(255, 77, 48, 0.3)' : 
                        '0 2px 8px rgba(0, 0, 0, 0.15)',
                    }}
                    onClick={() => handleColorSelect(variant)}
                    title={`${variant.color}${!variant.inStock ? ' (Hết hàng)' : ''}`}
                    disabled={!variant.inStock}
                    aria-label={`Chọn màu ${variant.color}`}
                  >
                    {isSelected && (
                      <i className="fas fa-check" style={{ 
                        color: isLightColor(variant.colorHex) ? '#1e293b' : '#fff',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        textShadow: isLightColor(variant.colorHex) ? 
                          'none' : 
                          '0 1px 2px rgba(0, 0, 0, 0.5)',
                      }}></i>
                    )}
                    {!variant.inStock && (
                      <i className="fas fa-times" style={{ 
                        color: '#ef4444',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        textShadow: '0 0 3px rgba(255, 255, 255, 0.9), 0 0 6px rgba(255, 255, 255, 0.6)',
                      }}></i>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className={styles.specs}>
          <div className={styles.specsList}>
            <div className={styles.specItem}>
              <i className={`fas fa-road ${styles.icon}`} aria-hidden="true"></i>
              <span>{item.rangeKm} km</span>
            </div>
            <div className={styles.specItem}>
              <i className={`fas fa-battery-full ${styles.icon}`} aria-hidden="true"></i>
              <span>{item.battery}</span>
            </div>
            <div className={styles.specItem}>
              <i className={`fas fa-cog ${styles.icon}`} aria-hidden="true"></i>
              <span>{item.driveType}</span>
            </div>
            <div className={styles.specItem}>
              <i className={`fas fa-bolt ${styles.icon}`} aria-hidden="true"></i>
              <span>{item.fastCharge}</span>
            </div>
          </div>

          <div className={styles.mainSpecs}>
            <div className={styles.mainSpec}>
              <span className={styles.value}>{item.rangeKm}</span>
              <span className={styles.label}>km</span>
            </div>
            <div className={styles.mainSpec}>
              <span className={styles.value}>{item.battery}</span>
              <span className={styles.label}>Pin</span>
            </div>
            <div className={styles.mainSpec}>
              <span className={styles.value}>{item.warranty.split(' ')[0]}</span>
              <span className={styles.label}>Bảo hành</span>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button 
            type="button"
            className={`${styles.button} ${styles.ghost}`}
            onClick={handleViewDetails}
          >
            Chi tiết
          </button>
          <button 
            type="button"
            className={`${styles.button} ${styles.primary}`}
            onClick={handleContactDealer}
            disabled={!item.inStock}
          >
            {item.inStock ? 'Đặt hàng' : 'Hết hàng'}
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;