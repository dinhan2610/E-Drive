import React, { useState } from 'react';
import type { Product } from '../../types/product';
import { formatPrice } from '../../utils/productUtils';
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

  const handleViewDetails = () => {
    console.log('🔍 ProductCard - View Details clicked');
    console.log('📦 Product:', item);
    console.log('🔗 onViewDetails function:', onViewDetails);
    
    if (onViewDetails) {
      onViewDetails(item);
    } else {
      console.warn('⚠️ onViewDetails prop is not provided');
    }
  };

  const handleContactDealer = () => {
    if (onContactDealer) {
      onContactDealer(item);
    }
  };

  const getBadgeClass = (tag: string): string => {
    const tagLower = tag.toLowerCase();
    if (tagLower.includes('bán chạy') || tagLower.includes('popular')) return styles.popular;
    if (tagLower.includes('ưu đãi') || tagLower.includes('discount')) return styles.discount;
    if (tagLower.includes('trả góp')) return styles.installment;
    if (tagLower.includes('hết hàng') || tagLower.includes('out of stock')) return styles.outOfStock;
    return styles.popular; // default
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
        
        {item.tags && item.tags.length > 0 && (
          <div className={styles.badges}>
            {item.tags.slice(0, 2).map((tag, index) => (
              <span key={index} className={`${styles.badge} ${getBadgeClass(tag)}`}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.title}>
          <h3>{item.name}</h3>
          <div className={styles.variant}>{item.variant}</div>
        </div>

        <div className={styles.pricing}>
          <p className={styles.price}>
            {formatPrice(item.price)}
            {item.originalPrice && (
              <span className={styles.originalPrice}>
                {formatPrice(item.originalPrice)}
              </span>
            )}
          </p>
        </div>

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