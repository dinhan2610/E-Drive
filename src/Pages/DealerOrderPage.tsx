import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Product } from '../types/product';
import { getProfile } from '../services/profileApi';
import Footer from '../components/Footer';
import { SuccessModal } from '../components/SuccessModal';
import styles from '../styles/OrderStyles/DealerOrderPage.module.scss';

interface DealerOrderForm {
  // Dealer Info
  dealerName: string;
  dealerCode: string;
  contactPerson: string;
  email: string;
  phone: string;
  
  // Dealer Address
  address: string;
  ward: string;
  district: string;
  city: string;
  
  // Order Details
  selectedProducts: Array<{
    productId: string;
    productName: string;
    variant: string;
    quantity: number;
    unitPrice: number;
    image: string;
  }>;
  
  // Delivery
  preferredDeliveryDate: string;
  deliveryAddress: string;
  deliveryNote: string;
  
  // Payment
  paymentMethod: 'bank-transfer' | 'credit' | 'cod';
  
  // Additional
  notes: string;
  urgentOrder: boolean;
}

const DealerOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const incomingProduct = location.state?.product as Product | undefined;
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  
  const [formData, setFormData] = useState<DealerOrderForm>({
    dealerName: '',
    dealerCode: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    ward: '',
    district: '',
    city: '',
    selectedProducts: [],
    preferredDeliveryDate: '',
    deliveryAddress: '',
    deliveryNote: '',
    paymentMethod: 'bank-transfer',
    notes: '',
    urgentOrder: false,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showProductSelector, setShowProductSelector] = useState(false);

  // Auto-load profile data
  useEffect(() => {
    const loadDealerProfile = async () => {
      try {
        const profile = await getProfile();
        
        // Auto-fill dealer information
        setFormData(prev => ({
          ...prev,
          dealerName: profile.fullName || '',
          dealerCode: profile.dealerId ? `DL${String(profile.dealerId).padStart(6, '0')}` : '',
          contactPerson: profile.fullName || '',
          email: profile.email || '',
          phone: profile.phone || '',
          // Keep existing address fields empty or use from localStorage if available
        }));

        console.log('✅ Dealer profile loaded:', profile);
      } catch (error) {
        console.warn('⚠️ Could not load profile, trying localStorage fallback');
        
        // Fallback to localStorage
        const userData = localStorage.getItem('e-drive-user');
        if (userData) {
          try {
            const user = JSON.parse(userData);
            setFormData(prev => ({
              ...prev,
              dealerName: user.fullName || user.dealerName || '',
              dealerCode: user.dealerCode || '',
              contactPerson: user.fullName || user.name || '',
              email: user.email || '',
              phone: user.phone || '',
              address: user.address || '',
            }));
            console.log('✅ Dealer info loaded from localStorage');
          } catch (parseError) {
            console.error('Failed to parse user data:', parseError);
          }
        }
      }
    };

    loadDealerProfile();
  }, []);

  // Auto-add product from navigation state
  useEffect(() => {
    if (incomingProduct) {
      const newProduct = {
        productId: incomingProduct.id,
        productName: incomingProduct.name,
        variant: incomingProduct.variant || 'Standard',
        quantity: 1,
        unitPrice: incomingProduct.price || 0,
        image: incomingProduct.image || 'default-image.jpg',
      };

      setFormData(prev => ({
        ...prev,
        selectedProducts: [newProduct],
      }));
    }
  }, [incomingProduct]);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setIsLoadingVehicles(true);
    try {
      const response = await fetch('http://localhost:8080/api/vehicles');
      if (!response.ok) throw new Error('Failed to fetch vehicles');
      
      const data = await response.json();
      const vehicles = Array.isArray(data) ? data : data.content || [];
      setAvailableVehicles(vehicles);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      setAvailableVehicles([]);
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddProduct = (vehicle: any) => {
    const existingProduct = formData.selectedProducts.find(
      p => p.productId === vehicle.id
    );

    if (existingProduct) {
      alert('Sản phẩm đã được thêm vào đơn hàng');
      return;
    }

    const newProduct = {
      productId: vehicle.id,
      productName: vehicle.name,
      variant: vehicle.variant || 'Standard',
      quantity: 1,
      unitPrice: vehicle.price || 0,
      image: vehicle.image || 'default-image.jpg',
    };

    setFormData(prev => ({
      ...prev,
      selectedProducts: [...prev.selectedProducts, newProduct],
    }));
    
    setShowProductSelector(false);
    setSearchTerm('');
  };

  const handleUpdateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setFormData(prev => {
      const updated = [...prev.selectedProducts];
      updated[index].quantity = newQuantity;
      return { ...prev, selectedProducts: updated };
    });
  };

  const handleRemoveProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.filter((_, i) => i !== index),
    }));
  };

  const calculateTotal = () => {
    const subtotal = formData.selectedProducts.reduce(
      (sum, product) => sum + (product.unitPrice * product.quantity),
      0
    );
    const discount = subtotal * 0.05; // 5% dealer discount
    const vat = (subtotal - discount) * 0.1; // 10% VAT
    const total = subtotal - discount + vat;

    return {
      subtotal,
      discount,
      vat,
      total,
    };
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.selectedProducts.length === 0) {
      alert('Vui lòng chọn ít nhất một sản phẩm');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Dealer order submitted:', formData);
    console.log('Order total:', calculateTotal());

    setIsSubmitting(false);
    setShowSuccess(true);
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    // Navigate to home or order list page
    navigate('/');
  };

  const filteredVehicles = availableVehicles.filter(vehicle =>
    vehicle.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.variant?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pricing = calculateTotal();

  return (
    <>
      <div className={styles.wrap}>
        <div className={styles.container}>
          

          <div className={styles.header}>
            
            <h1>Đặt hàng xe từ hãng</h1>
            <p>Dành cho đại lý - Đặt hàng số lượng lớn với giá ưu đãi</p>
          </div>

          <div className={styles.content}>
            {/* Left: Form */}
            <form className={styles.form} onSubmit={handleSubmit}>
              {/* Dealer Information */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <div className={styles.headerLeft}>
                    <i className="fas fa-building"></i>
                    <h2>Thông tin đại lý</h2>
                  </div>
                  
                </div>
                
                <div className={styles.infoCard}>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <label>Tên đại lý</label>
                      <div className={styles.infoValue}>{formData.dealerName || '---'}</div>
                    </div>

                    <div className={styles.infoItem}>
                      <label>Mã đại lý</label>
                      <div className={styles.infoValue}>{formData.dealerCode || '---'}</div>
                    </div>

                    <div className={styles.infoItem}>
                      <label>Số điện thoại</label>
                      <div className={styles.infoValue}>{formData.phone || '---'}</div>
                    </div>

                    <div className={styles.infoItem}>
                      <label>Email</label>
                      <div className={styles.infoValue}>{formData.email || '---'}</div>
                    </div>
                  </div>
                </div>

                {/* Hidden inputs to maintain form data */}
                <input type="hidden" name="dealerName" value={formData.dealerName} />
                <input type="hidden" name="dealerCode" value={formData.dealerCode} />
                <input type="hidden" name="phone" value={formData.phone} />
                <input type="hidden" name="email" value={formData.email} />
              </section>

              {/* Address */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <i className="fas fa-map-marker-alt"></i>
                  <h2>Địa chỉ đại lý</h2>
                </div>
                <div className={styles.grid}>
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label htmlFor="address">
                      Địa chỉ cụ thể <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      placeholder="Số nhà, tên đường"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="ward">
                      Phường/Xã <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      id="ward"
                      name="ward"
                      value={formData.ward}
                      onChange={handleInputChange}
                      required
                      placeholder="Phường 1"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="district">
                      Quận/Huyện <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      id="district"
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      required
                      placeholder="Quận 1"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="city">
                      Tỉnh/Thành phố <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      placeholder="TP. Hồ Chí Minh"
                    />
                  </div>
                </div>
              </section>

              {/* Product Selection */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <i className="fas fa-car"></i>
                  <h2>Xe đã chọn</h2>
                  
                </div>

              

                {formData.selectedProducts.length > 0 && (
                  <div className={styles.selectedProducts}>
                    {formData.selectedProducts.map((product, index) => (
                      <div key={index} className={styles.selectedProduct}>
                        <img src={product.image} alt={product.productName} />
                        <div className={styles.productInfo}>
                          <h4>{product.productName}</h4>
                          <p>{product.variant}</p>
                          <span className={styles.unitPrice}>
                            {formatPrice(product.unitPrice)}
                          </span>
                        </div>
                        <div className={styles.quantityControl}>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(index, product.quantity - 1)}
                          >
                            <i className="fas fa-minus"></i>
                          </button>
                          <input
                            type="number"
                            value={product.quantity}
                            onChange={(e) => handleUpdateQuantity(index, parseInt(e.target.value) || 1)}
                            min="1"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(index, product.quantity + 1)}
                          >
                            <i className="fas fa-plus"></i>
                          </button>
                        </div>
                        <div className={styles.productTotal}>
                          {formatPrice(product.unitPrice * product.quantity)}
                        </div>
                        <button
                          type="button"
                          className={styles.removeButton}
                          onClick={() => handleRemoveProduct(index)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    ))}

                    {/* Tổng quan đơn hàng */}
                    <div className={styles.orderSummaryInline}>
                      <div className={styles.summaryStats}>
                        <div className={styles.statItem}>
                          <i className="fas fa-car"></i>
                          <div>
                            <span>Số lượng xe</span>
                            <strong>
                              {formData.selectedProducts.reduce((sum, p) => sum + p.quantity, 0)}
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div className={styles.summaryPricing}>
                        <div className={styles.priceRow}>
                          <span>Tạm tính:</span>
                          <strong>{formatPrice(pricing.subtotal)}</strong>
                        </div>
                        
                        <div className={styles.priceRow}>
                          <span>Chiết khấu đại lý (5%):</span>
                          <strong className={styles.discount}>
                            -{formatPrice(pricing.discount)}
                          </strong>
                        </div>

                        <div className={styles.priceRow}>
                          <span>VAT (10%):</span>
                          <strong>{formatPrice(pricing.vat)}</strong>
                        </div>

                        <div className={styles.divider}></div>

                        <div className={`${styles.priceRow} ${styles.total}`}>
                          <span>Tổng thanh toán:</span>
                          <strong className={styles.totalPrice}>
                            {formatPrice(formData.urgentOrder ? pricing.total * 1.05 : pricing.total)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {showProductSelector && (
                  <div className={styles.productSelector}>
                    <div className={styles.searchBox}>
                      <i className="fas fa-search"></i>
                      <input
                        type="text"
                        placeholder="Tìm kiếm xe..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    {isLoadingVehicles ? (
                      <div className={styles.loading}>Đang tải...</div>
                    ) : (
                      <div className={styles.productList}>
                        {filteredVehicles.map(vehicle => (
                          <div
                            key={vehicle.id}
                            className={styles.productItem}
                            onClick={() => handleAddProduct(vehicle)}
                          >
                            <img src={vehicle.image} alt={vehicle.name} />
                            <div className={styles.productItemInfo}>
                              <h4>{vehicle.name}</h4>
                              <p>{vehicle.variant}</p>
                              <span className={styles.price}>
                                {formatPrice(vehicle.price)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

               
              </section>

              {/* Delivery Information */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <i className="fas fa-shipping-fast"></i>
                  <h2>Thông tin giao hàng</h2>
                </div>
                <div className={styles.grid}>
                  <div className={styles.formGroup}>
                    <label htmlFor="preferredDeliveryDate">
                      Ngày giao hàng mong muốn
                    </label>
                    <input
                      type="date"
                      id="preferredDeliveryDate"
                      name="preferredDeliveryDate"
                      value={formData.preferredDeliveryDate}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label htmlFor="deliveryAddress">
                      Địa chỉ giao hàng (nếu khác địa chỉ đại lý)
                    </label>
                    <input
                      type="text"
                      id="deliveryAddress"
                      name="deliveryAddress"
                      value={formData.deliveryAddress}
                      onChange={handleInputChange}
                      placeholder="Để trống nếu giao tại địa chỉ đại lý"
                    />
                  </div>

                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label htmlFor="deliveryNote">
                      Ghi chú giao hàng
                    </label>
                    <textarea
                      id="deliveryNote"
                      name="deliveryNote"
                      value={formData.deliveryNote}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Yêu cầu đặc biệt về giao hàng..."
                    />
                  </div>
                </div>

                
              </section>

              {/* Payment Method */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <i className="fas fa-credit-card"></i>
                  <h2>Phương thức thanh toán</h2>
                </div>

                <div className={styles.paymentOptions}>
                  <label className={styles.radioCard}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank-transfer"
                      checked={formData.paymentMethod === 'bank-transfer'}
                      onChange={handleInputChange}
                    />
                    <div className={styles.radioContent}>
                      <div className={styles.radioHeader}>
                        <i className="fas fa-university"></i>
                        <span>Thanh toán trực tuyến</span>
                      </div>
                      
                    </div>
                  </label>

                 

                  <label className={styles.radioCard}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === 'cod'}
                      onChange={handleInputChange}
                    />
                    <div className={styles.radioContent}>
                      <div className={styles.radioHeader}>
                        <i className="fas fa-money-bill-wave"></i>
                        <span>Thanh toán khi nhận hàng</span>
                      </div>
                      
                    </div>
                  </label>
                </div>
              </section>

              

              {/* Submit */}
              <div className={styles.submitSection}>
                <button
                  type="button"
                  className={styles.backButton}
                  onClick={() => navigate('/')}
                >
                  <i className="fas fa-arrow-left"></i>
                  Quay lại
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isSubmitting || formData.selectedProducts.length === 0}
                >
                  {isSubmitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check-circle"></i>
                      Xác nhận đặt hàng
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <SuccessModal
        isOpen={showSuccess}
        onClose={handleSuccessClose}
        title="Đặt hàng thành công!"
        message={`Đơn hàng của bạn đã được ghi nhận. Chúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất. Mã đơn hàng: DH-${Date.now()}`}
      />

      <Footer />
    </>
  );
};

export default DealerOrderPage;
