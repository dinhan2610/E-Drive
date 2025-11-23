import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Product, VehicleApiResponse } from '../types/product';
import { convertVehicleToProduct } from '../services/vehicleApi';
import { formatPrice } from '../utils/productUtils';
import { shouldShowQuoteButton } from '../utils/roleUtils';
import styles from '../styles/ProductsStyles/ProductDetail.module.scss';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);

  useEffect(() => {
    const fetchProductDetail = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:8080/api/vehicles/${id}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch product: ${response.status}`);
        }

        const data = await response.json();

        // Handle both array and wrapper response
        let vehicleData: VehicleApiResponse;
        if (Array.isArray(data)) {
          vehicleData = data[0];
        } else if (data.data) {
          vehicleData = Array.isArray(data.data) ? data.data[0] : data.data;
        } else {
          vehicleData = data;
        }

        const productData = convertVehicleToProduct(vehicleData);
        setProduct(productData);
      } catch (error) {
        console.error('❌ Error fetching product detail:', error);
        // Navigate back to products page if error
        setTimeout(() => navigate('/products'), 2000);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchProductDetail();
    }
  }, [id, navigate]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src = '/src/images/cars-big/audia1.jpg'; // Fallback image
  };

  const handleColorChange = (colorIndex: number) => {
    setSelectedColorIndex(colorIndex);
    
    if (product && product.colorVariants && product.colorVariants[colorIndex]) {
      const selectedVariant = product.colorVariants[colorIndex];
      
      // Update product with new color info
      const updatedProduct = {
        ...product,
        selectedColor: selectedVariant.color,
        price: selectedVariant.finalPrice > 0 ? selectedVariant.finalPrice : selectedVariant.priceRetail,
        originalPrice: selectedVariant.finalPrice > 0 ? selectedVariant.priceRetail : undefined,
        image: selectedVariant.imageUrl || product.image,
        images: [selectedVariant.imageUrl || product.image],
        inStock: selectedVariant.inStock,
      };
      
      setProduct(updatedProduct);
      setSelectedImage(0); // Reset to first image
    }
  };

  const handleOrder = () => {
    // Staff → Navigate to quote creation page (Báo giá)
    if (shouldShowQuoteButton()) {
      navigate('/quotes/create', { state: { product } });
    } else {
      // Dealer → Navigate to dealer order page (Đặt hàng)
      // Admin → Has separate interface, shouldn't reach here
      navigate('/dealer-order', { state: { product } });
    }
  };

  const handleTestDrive = () => {
    // Navigate to test drive page with product info pre-filled
    navigate('/test-drive', { state: { product } });
  };

  if (isLoading) {
    return (
      <>
        <div className={styles.wrap}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Đang tải thông tin xe...</p>
          </div>
        </div>
        
      </>
    );
  }

  if (!product) {
    return (
      <>
        <div className={styles.wrap}>
          <div className={styles.error}>
            <i className="fas fa-exclamation-triangle"></i>
            <h2>Không tìm thấy sản phẩm</h2>
            <p>Sản phẩm không tồn tại hoặc đã bị xóa.</p>
            <button onClick={() => navigate('/products')} className={styles.backButton}>
              Quay lại danh sách
            </button>
          </div>
        </div>
        
      </>
    );
  }

  return (
    <>
      <div className={styles.wrap}>
        <div className={styles.container}>
          

          {/* Main Content */}
          <div className={styles.content}>
            {/* Left: Images */}
            <div className={styles.gallery}>
              <div className={styles.mainImage}>
                <img 
                  src={product.images[selectedImage] || product.image} 
                  alt={product.name}
                  onError={handleImageError}
                />
                {!product.inStock && (
                  <div className={styles.outOfStockBadge}>Hết hàng</div>
                )}
              </div>
              
              {product.images.length > 1 && (
                <div className={styles.thumbnails}>
                  {product.images.map((img, index) => (
                    <button
                      key={index}
                      className={`${styles.thumbnail} ${selectedImage === index ? styles.active : ''}`}
                      onClick={() => setSelectedImage(index)}
                    >
                      <img src={img} alt={`${product.name} - ${index + 1}`} onError={handleImageError} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Info */}
            <div className={styles.info}>
              <div className={styles.header}>
                <div className={styles.tags}>
                  {product.tags.map((tag, index) => (
                    <span key={index} className={styles.tag}>{tag}</span>
                  ))}
                </div>
                <h1 className={styles.title}>{product.name}</h1>
                <p className={styles.variant}>{product.variant}</p>
              </div>

              <div className={styles.pricing}>
                <div className={styles.price}>{formatPrice(product.price)}</div>
                {product.originalPrice && product.originalPrice !== product.price && (
                  <div className={styles.originalPrice}>{formatPrice(product.originalPrice)}</div>
                )}
              </div>

              {/* Color Selection */}
              {product.colorVariants && product.colorVariants.length > 0 && (
                <div className={styles.colorSelection}>
                  <h3>
                    <i className="fas fa-palette"></i>
                    Chọn màu sắc ({product.colorVariants.length} màu)
                  </h3>
                  <div className={styles.colorOptions}>
                    {product.colorVariants.map((colorVariant, index) => (
                      <button
                        key={index}
                        className={`${styles.colorOption} ${selectedColorIndex === index ? styles.active : ''} ${!colorVariant.inStock ? styles.outOfStock : ''}`}
                        onClick={() => handleColorChange(index)}
                        disabled={!colorVariant.inStock}
                        title={colorVariant.inStock ? colorVariant.color : `${colorVariant.color} - Hết hàng`}
                      >
                        <div 
                          className={styles.colorCircle}
                          style={{ background: colorVariant.colorGradient || colorVariant.colorHex }}
                        />
                        <div className={styles.colorInfo}>
                          <span className={styles.colorName}>{colorVariant.color}</span>
                          <span className={styles.colorPrice}>
                            {formatPrice(colorVariant.finalPrice > 0 ? colorVariant.finalPrice : colorVariant.priceRetail)}
                          </span>
                          {!colorVariant.inStock && (
                            <span className={styles.outOfStockText}>Hết hàng</span>
                          )}
                        </div>
                        {selectedColorIndex === index && (
                          <i className="fas fa-check-circle"></i>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.specs}>
                <h3>Thông số kỹ thuật</h3>
                <div className={styles.specGrid}>
                  <div className={styles.specItem}>
                    <i className="fas fa-road"></i>
                    <div className={styles.specContent}>
                      <span className={styles.specLabel}>Quãng đường</span>
                      <span className={styles.specValue}>{product.rangeKm} km</span>
                    </div>
                  </div>
                  <div className={styles.specItem}>
                    <i className="fas fa-battery-full"></i>
                    <div className={styles.specContent}>
                      <span className={styles.specLabel}>Dung lượng pin</span>
                      <span className={styles.specValue}>{product.battery}</span>
                    </div>
                  </div>
                  <div className={styles.specItem}>
                    <i className="fas fa-cog"></i>
                    <div className={styles.specContent}>
                      <span className={styles.specLabel}>Động cơ</span>
                      <span className={styles.specValue}>{product.motor}</span>
                    </div>
                  </div>
                  <div className={styles.specItem}>
                    <i className="fas fa-bolt"></i>
                    <div className={styles.specContent}>
                      <span className={styles.specLabel}>Sạc nhanh</span>
                      <span className={styles.specValue}>{product.fastCharge}</span>
                    </div>
                  </div>
                  <div className={styles.specItem}>
                    <i className="fas fa-shield-alt"></i>
                    <div className={styles.specContent}>
                      <span className={styles.specLabel}>Bảo hành</span>
                      <span className={styles.specValue}>{product.warranty}</span>
                    </div>
                  </div>
                  <div className={styles.specItem}>
                    <i className="fas fa-sync-alt"></i>
                    <div className={styles.specContent}>
                      <span className={styles.specLabel}>Dẫn động</span>
                      <span className={styles.specValue}>{product.driveType}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.description}>
                <h3>Mô tả</h3>
                <p>{product.description}</p>
              </div>

              {product.features.length > 0 && (
                <div className={styles.features}>
                  <h3>Tính năng nổi bật</h3>
                  <ul>
                    {product.features.map((feature, index) => (
                      <li key={index}>
                        <i className="fas fa-check-circle"></i>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className={styles.actions}>
                <button 
                  className={styles.primaryButton}
                  onClick={handleOrder}
                  disabled={!product.inStock}
                >
                  <i className={shouldShowQuoteButton() ? "fas fa-file-invoice-dollar" : "fas fa-shopping-cart"}></i>
                  {product.inStock ? (shouldShowQuoteButton() ? 'Báo giá' : 'Đặt hàng ngay') : 'Hết hàng'}
                </button>
                <button 
                  className={styles.secondaryButton}
                  onClick={handleTestDrive}
                  disabled={!product.inStock}
                >
                  <i className="fas fa-car"></i>
                  Đăng ký lái thử
                </button>
                <button 
                  className={styles.ghostButton}
                  onClick={() => navigate('/products')}
                >
                  <i className="fas fa-arrow-left"></i>
                  Quay lại
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </>
  );
};

export default ProductDetailPage;
