import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Product } from '../types/product';
import { getProfile, getDealerProfile } from '../services/profileApi';
import { createOrder, type CreateOrderRequest } from '../services/orderApi';
import { fetchVehiclesFromApi, groupVehiclesByModel } from '../services/vehicleApi';
import { fetchActiveDiscountPolicies } from '../services/discountApi';
import type { DiscountPolicy } from '../types/discount';
import { SuccessModal } from '../components/SuccessModal';
import styles from '../styles/OrderStyles/DealerOrderPage.module.scss';

interface DealerOrderForm {
  // Dealer Info
  dealerName: string;
  dealerCode: string;
  contactPerson: string;
  email: string;
  phone: string;
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
    color?: string;
  }>;
  
  // Delivery
  preferredDeliveryDate: string;
  deliveryAddress: string;
  deliveryNote: string;
  
  // Payment
  paymentMethod: 'bank-transfer';
  
  // Additional
  notes: string;
  urgentOrder: boolean;
}

const DealerOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const incomingProduct = location.state?.product as Product | undefined;
  
  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (!token) {
      console.warn('No access token found, redirecting to login');
      navigate('/login', { replace: true });
      return;
    }
  }, [navigate]);
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableVehicles, setAvailableVehicles] = useState<Product[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [currentDealerId, setCurrentDealerId] = useState<number | null>(null);
  
  // State for vehicle and color selection
  const [selectedVehicle, setSelectedVehicle] = useState<Product | null>(null);
  const [selectedColorIndex, setSelectedColorIndex] = useState<number>(0);
  
  // Discount policies state
  const [discountPolicies, setDiscountPolicies] = useState<DiscountPolicy[]>([]);
  const [isLoadingDiscounts, setIsLoadingDiscounts] = useState(true);
  
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

  const [showProductSelector, setShowProductSelector] = useState(false);

  // Auto-load profile data
  useEffect(() => {
    const loadDealerProfile = async () => {
      try {
        console.log('🔄 Loading dealer profile...');
        const profile = await getProfile();
        
        // Store dealerId for debugging
        setCurrentDealerId(profile.dealerId || null);
        console.log('✅ Current dealer ID:', profile.dealerId);
        
        // If dealerId exists, fetch real-time data from dealer API
        let dealerData = profile;
        if (profile.dealerId) {
          console.log('🔄 Fetching real-time dealer data...');
          dealerData = await getDealerProfile(profile.dealerId);
          console.log('✅ Real-time dealer data loaded:', dealerData);
        }
        
        // Auto-fill dealer information from dealer API (more up-to-date)
        setFormData(prev => ({
          ...prev,
          dealerName: dealerData.agencyName || dealerData.fullName || '',
          dealerCode: dealerData.dealerId ? `DL${String(dealerData.dealerId).padStart(6, '0')}` : '',
          contactPerson: dealerData.contactPerson || dealerData.fullName || '',
          email: dealerData.email || '',
          phone: dealerData.agencyPhone || dealerData.phoneNumber || '',
          address: dealerData.streetAddress || '',
          ward: dealerData.ward || '',
          district: dealerData.district || '',
          city: dealerData.city || '',
        }));

        console.log('✅ Dealer profile loaded and populated');
      } catch (error: any) {
        console.error('❌ Error loading profile:', error);
        
        // Don't redirect if just API error, only if 401 (handled by interceptor)
        // Try localStorage fallback
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

  // Load discount policies on mount
  useEffect(() => {
    const loadDiscountPolicies = async () => {
      setIsLoadingDiscounts(true);
      try {
        console.log('💰 Loading active discount policies...');
        const policies = await fetchActiveDiscountPolicies();
        setDiscountPolicies(policies);
        console.log('✅ Discount policies loaded:', policies);
      } catch (error: any) {
        console.error('❌ Error loading discount policies:', error);
        // Fallback to empty array if error
        setDiscountPolicies([]);
      } finally {
        setIsLoadingDiscounts(false);
      }
    };
    
    loadDiscountPolicies();
  }, []);

  // Auto-add product from navigation state
  useEffect(() => {
    if (incomingProduct) {
      console.log('📦 Incoming product from navigation:', incomingProduct);
      
      // Lấy hình ảnh đúng theo màu đã chọn
      let productImage = incomingProduct.image || 'default-image.jpg';
      
      if (incomingProduct.selectedColor && incomingProduct.colorVariants && incomingProduct.colorVariants.length > 0) {
        const selectedColorVariant = incomingProduct.colorVariants.find(
          (cv: any) => cv.color === incomingProduct.selectedColor
        );
        if (selectedColorVariant && selectedColorVariant.imageUrl) {
          productImage = selectedColorVariant.imageUrl;
          console.log('🎨 Using color-specific image from navigation:', productImage, 'for color:', incomingProduct.selectedColor);
        }
      }

      const newProduct = {
        productId: incomingProduct.id,
        productName: incomingProduct.name,
        variant: incomingProduct.variant || 'Standard',
        quantity: 1,
        unitPrice: incomingProduct.price || 0,
        image: productImage,
        color: incomingProduct.selectedColor,
      };

      console.log('✅ Auto-added product with correct color image:', newProduct);

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
    console.log('🚗 fetchVehicles called');
    setIsLoadingVehicles(true);
    try {
      console.log('📡 Calling fetchVehiclesFromApi...');
      const { vehicles } = await fetchVehiclesFromApi({ size: 100 });
      console.log('✅ Fetched vehicles:', vehicles);
      console.log('📊 Number of vehicles:', vehicles.length);
      
      // Group vehicles by model and variant - each group will have color variants
      const groupedProducts = groupVehiclesByModel(vehicles);
      console.log('🔄 Grouped products by model:', groupedProducts);
      console.log('� Number of unique models:', groupedProducts.length);
      
      setAvailableVehicles(groupedProducts);
    } catch (error) {
      console.error('❌ Error fetching vehicles:', error);
      setAvailableVehicles([]);
    } finally {
      setIsLoadingVehicles(false);
      console.log('✅ Loading complete');
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
    console.log('🛒 handleAddProduct called with vehicle:', vehicle);
    
    const existingProduct = formData.selectedProducts.find(
      p => p.productId === vehicle.id
    );

    if (existingProduct) {
      alert('Sản phẩm đã được thêm vào đơn hàng');
      return;
    }

    // Lấy hình ảnh đúng theo màu đã chọn
    let productImage = vehicle.image || 'default-image.jpg';
    
    if (vehicle.selectedColor && vehicle.colorVariants && vehicle.colorVariants.length > 0) {
      const selectedColorVariant = vehicle.colorVariants.find(
        (cv: any) => cv.color === vehicle.selectedColor
      );
      if (selectedColorVariant && selectedColorVariant.imageUrl) {
        productImage = selectedColorVariant.imageUrl;
        console.log('🎨 Using color-specific image:', productImage, 'for color:', vehicle.selectedColor);
      }
    }

    const newProduct = {
      productId: vehicle.id,
      productName: vehicle.name,
      variant: vehicle.variant || 'Standard',
      quantity: 1,
      unitPrice: vehicle.price || 0,
      image: productImage,
      color: vehicle.selectedColor,
    };

    console.log('✅ Created newProduct:', newProduct);

    setFormData(prev => ({
      ...prev,
      selectedProducts: [...prev.selectedProducts, newProduct],
    }));
    
    setShowProductSelector(false);
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
    
    // Calculate total quantity of all products
    const totalQuantity = formData.selectedProducts.reduce(
      (sum, product) => sum + product.quantity,
      0
    );
    
    // Find applicable discount policy based on total quantity
    let discountRate = 0;
    let appliedDiscountPolicy: DiscountPolicy | null = null;
    
    if (discountPolicies.length > 0) {
      // Sort policies by minQuantity descending to get the best applicable discount
      const sortedPolicies = [...discountPolicies].sort((a, b) => b.minQuantity - a.minQuantity);
      
      for (const policy of sortedPolicies) {
        if (totalQuantity >= policy.minQuantity && totalQuantity <= policy.maxQuantity) {
          discountRate = policy.discountRate;
          appliedDiscountPolicy = policy;
          console.log(`✅ Applied discount: ${discountRate}% for ${totalQuantity} vehicles (${policy.description})`);
          break;
        }
      }
    }
    
    const discount = subtotal * discountRate; // Dynamic discount based on quantity
    const vat = (subtotal - discount) * 0.1; // 10% VAT
    const total = subtotal - discount + vat;

    return {
      subtotal,
      discount,
      discountRate,
      totalQuantity,
      appliedDiscountPolicy,
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

    if (!formData.preferredDeliveryDate) {
      alert('Vui lòng chọn ngày giao hàng mong muốn');
      return;
    }

    if (!formData.deliveryAddress && !formData.address) {
      alert('Vui lòng nhập địa chỉ giao hàng');
      return;
    }

    setIsSubmitting(true);

    try {
      // Build full delivery address
      const fullDeliveryAddress = formData.deliveryAddress || 
        `${formData.address}, ${formData.ward}, ${formData.district}, ${formData.city}`.trim();

      // Prepare order items array
      const orderItems = formData.selectedProducts.map(product => ({
        vehicleId: parseInt(product.productId),
        quantity: product.quantity,
        color: product.color
      }));

      const orderRequest: CreateOrderRequest = {
        orderItems: orderItems,
        desiredDeliveryDate: formData.preferredDeliveryDate,
        deliveryNote: formData.deliveryNote || '',
        deliveryAddress: fullDeliveryAddress,
      };

      console.log('Creating order with data:', orderRequest);
      console.log('Current dealer ID:', currentDealerId);
      const createdOrder = await createOrder(orderRequest);
      console.log('Order created successfully:', createdOrder);
      console.log('Created order ID:', createdOrder.orderId);

      // Show success message
      setShowSuccess(true);
      
      // Reset form and switch to orders list
      setFormData({
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
        urgentOrder: false
      });
      
      // Show success modal
      setShowSuccess(true);
      
    } catch (error: any) {
      console.error('Error creating order:', error);
      alert(`Lỗi khi tạo đơn hàng: ${error.message || 'Vui lòng thử lại'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    // Navigate to home or products page
    navigate('/products');
  };

  const pricing = calculateTotal();

  return (
    <>
      <div className={styles.wrap}>
        <div className={styles.container}>
          

          <div className={styles.header}>
            
            <h1>Đặt hàng xe từ hãng</h1>
            <p>Dành cho đại lý - Đặt hàng số lượng lớn với giá ưu đãi</p>
          </div>

          {/* Create Order Form */}
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
                      <label><i className="fas fa-store"></i> Tên đại lý</label>
                      <div className={styles.infoValue}>{formData.dealerName || '---'}</div>
                    </div>

                    <div className={styles.infoItem}>
                      <label><i className="fas fa-id-card"></i> Mã đại lý</label>
                      <div className={styles.infoValue}>{formData.dealerCode || '---'}</div>
                    </div>

                    <div className={styles.infoItem}>
                      <label><i className="fas fa-user"></i> Người liên hệ</label>
                      <div className={styles.infoValue}>{formData.contactPerson || '---'}</div>
                    </div>

                    <div className={styles.infoItem}>
                      <label><i className="fas fa-phone"></i> Số điện thoại</label>
                      <div className={styles.infoValue}>{formData.phone || '---'}</div>
                    </div>

                    <div className={styles.infoItem}>
                      <label><i className="fas fa-envelope"></i> Email</label>
                      <div className={styles.infoValue}>{formData.email || '---'}</div>
                    </div>

                    <div className={`${styles.infoItem} ${styles.fullWidth}`}>
                      <label><i className="fas fa-map-marker-alt"></i> Địa chỉ</label>
                      <div className={styles.infoValue}>
                        {formData.address && formData.ward && formData.district && formData.city
                          ? `${formData.address}, ${formData.ward}, ${formData.district}, ${formData.city}`
                          : formData.address || '---'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hidden inputs to maintain form data */}
                <input type="hidden" name="dealerName" value={formData.dealerName} />
                <input type="hidden" name="dealerCode" value={formData.dealerCode} />
                <input type="hidden" name="contactPerson" value={formData.contactPerson} />
                <input type="hidden" name="phone" value={formData.phone} />
                <input type="hidden" name="email" value={formData.email} />
              </section>

             

              {/* Product Selection */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <i className="fas fa-car"></i>
                  <h2>Xe đã chọn</h2>
                  <button
                    type="button"
                    className={styles.addProductButton}
                    onClick={(e) => {
                      e.preventDefault();
                      console.log('🔘 Add button clicked!');
                      console.log('Current showProductSelector:', showProductSelector);
                      setShowProductSelector(!showProductSelector);
                      if (!showProductSelector) {
                        console.log('📡 Fetching vehicles...');
                        fetchVehicles(); // Refresh vehicle list when opening
                      }
                    }}
                  >
                    <i className="fas fa-plus"></i>
                    Thêm xe
                  </button>
                </div>

              

                {formData.selectedProducts.length > 0 ? (
                  <div className={styles.selectedProducts}>
                    {formData.selectedProducts.map((product, index) => (
                      <div key={index} className={styles.selectedProduct}>
                        <img src={product.image} alt={product.productName} />
                        <div className={styles.productInfo}>
                          <div className={styles.productMainInfo}>
                            <h4>{product.productName}</h4>
                            <span className={styles.productVariant}>{product.variant}</span>
                          </div>
                          {product.color && (
                            <div className={styles.productColor}>
                              <i className="fas fa-palette"></i>
                              {product.color}
                            </div>
                          )}
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
                          <span>
                            Chiết khấu
                            {isLoadingDiscounts && <small> (đang tải...)</small>}
                            {pricing.discountRate > 0 && ` (${pricing.discountRate*100}%)`}
                            {pricing.appliedDiscountPolicy && (
                              <small style={{ display: 'block', fontSize: '0.85em', color: '#666' }}>
                                {pricing.appliedDiscountPolicy.description}
                              </small>
                            )}
                            {!isLoadingDiscounts && pricing.discountRate === 0 && pricing.totalQuantity > 0 && (
                              <small style={{ display: 'block', fontSize: '0.85em', color: '#999' }}>
                                Không có chính sách chiết khấu phù hợp
                              </small>
                            )}
                            
                          </span>
                          <strong className={styles.discount}>
                            {pricing.discount > 0 ? `-${formatPrice(pricing.discount)}` : formatPrice(0)}
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
                ) : (
                  <div className={styles.emptyProductState}>
                    <i className="fas fa-car"></i>
                    <p>Chưa có xe nào được chọn</p>
                    <span>Nhấn nút "Thêm xe" để bắt đầu đặt hàng</span>
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

              {/* Submit */}
              <div className={styles.submitSection}>
                
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
                      Đặt hàng
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
        message="Đơn hàng của bạn đã được gửi thành công và đang chờ Admin duyệt. Chúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất."
      />

      {/* Vehicle Selection Modal */}
      {showProductSelector && (
        <div className={styles.modalOverlay} onClick={() => setShowProductSelector(false)}>
          <div className={styles.vehicleModal} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.closeModalBtn}
              onClick={() => setShowProductSelector(false)}
            >
              <i className="fas fa-times"></i>
            </button>

            <div className={styles.modalBody}>
              <div className={styles.dropdownContainer}>
                <label htmlFor="vehicleSelect">
                  <i className="fas fa-car"></i>
                  Chọn mẫu xe
                </label>
                <select
                  id="vehicleSelect"
                  className={styles.vehicleDropdown}
                  onChange={(e) => {
                    const vehicleId = e.target.value;
                    if (vehicleId) {
                      const vehicle = availableVehicles.find(v => v.id === vehicleId);
                      if (vehicle) {
                        setSelectedVehicle(vehicle);
                        setSelectedColorIndex(0); // Reset to first color
                      }
                    } else {
                      setSelectedVehicle(null);
                      setSelectedColorIndex(0);
                    }
                  }}
                  disabled={isLoadingVehicles}
                  value={selectedVehicle?.id || ''}
                >
                  <option value="">
                    {isLoadingVehicles ? 'Đang tải...' : 'Chọn mẫu xe từ danh sách'}
                  </option>
                  {availableVehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.name} - {vehicle.variant}
                    </option>
                  ))}
                </select>
              </div>

              {selectedVehicle && selectedVehicle.colorVariants && selectedVehicle.colorVariants.length > 0 && (
                <div className={styles.colorSelectionContainer}>
                  <label>
                    <i className="fas fa-palette"></i>
                    Chọn màu sắc ({selectedVehicle.colorVariants.length} màu có sẵn)
                  </label>
                  <div className={styles.colorOptions}>
                    {selectedVehicle.colorVariants.map((colorVariant, index) => {
                      const isSelected = selectedColorIndex === index;
                      const isAvailable = colorVariant.inStock;
                      return (
                        <div
                          key={colorVariant.vehicleId}
                          className={`${styles.colorOption} ${isSelected ? styles.selected : ''} ${!isAvailable ? styles.outOfStock : ''}`}
                          onClick={() => isAvailable && setSelectedColorIndex(index)}
                          title={!isAvailable ? 'Màu này hiện đang hết hàng' : ''}
                        >
                          <div 
                            className={styles.colorCircle}
                            style={{ 
                              background: colorVariant.colorGradient || colorVariant.colorHex 
                            }}
                          />
                          <div className={styles.colorInfo}>
                            <span className={styles.colorName}>{colorVariant.color}</span>
                            <span className={styles.colorPrice}>
                              {formatPrice(colorVariant.finalPrice > 0 ? colorVariant.finalPrice : colorVariant.priceRetail)}
                            </span>
                            {!isAvailable && (
                              <span className={styles.outOfStockBadge}>Hết hàng</span>
                            )}
                          </div>
                          {isSelected && (
                            <i className="fas fa-check-circle"></i>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedVehicle && selectedVehicle.colorVariants && selectedVehicle.colorVariants[selectedColorIndex] && (
                <div className={styles.previewContainer}>
                  <label>
                    <i className="fas fa-image"></i>
                    Xem trước
                  </label>
                  <div className={styles.vehiclePreview}>
                    <img 
                      src={
                        selectedVehicle.colorVariants[selectedColorIndex].imageUrl || 
                        selectedVehicle.image
                      } 
                      alt={`${selectedVehicle.name} - ${selectedVehicle.colorVariants[selectedColorIndex].color}`}
                    />
                    <div className={styles.previewInfo}>
                      <h4>{selectedVehicle.name} {selectedVehicle.variant}</h4>
                      <p className={styles.previewColor}>
                        <i className="fas fa-palette"></i>
                        Màu: {selectedVehicle.colorVariants[selectedColorIndex].color}
                      </p>
                      <p className={styles.previewPrice}>
                        <i className="fas fa-tag"></i>
                        {formatPrice(
                          selectedVehicle.colorVariants[selectedColorIndex].finalPrice > 0
                            ? selectedVehicle.colorVariants[selectedColorIndex].finalPrice 
                            : selectedVehicle.colorVariants[selectedColorIndex].priceRetail
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => {
                    setShowProductSelector(false);
                    setSelectedVehicle(null);
                    setSelectedColorIndex(0);
                  }}
                  className={styles.cancelButton}
                >
                  <i className="fas fa-times"></i>
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedVehicle && selectedVehicle.colorVariants && selectedVehicle.colorVariants[selectedColorIndex]) {
                      const colorVariant = selectedVehicle.colorVariants[selectedColorIndex];
                      
                      if (!colorVariant.inStock) {
                        alert('Màu này hiện đang hết hàng. Vui lòng chọn màu khác.');
                        return;
                      }
                      
                      const vehicleToAdd = {
                        ...selectedVehicle,
                        id: colorVariant.vehicleId.toString(), // Use specific vehicleId for this color
                        selectedColor: colorVariant.color,
                        price: colorVariant.finalPrice > 0 ? colorVariant.finalPrice : colorVariant.priceRetail,
                        image: colorVariant.imageUrl || selectedVehicle.image,
                      };
                      handleAddProduct(vehicleToAdd);
                      setSelectedVehicle(null);
                      setSelectedColorIndex(0);
                    } else {
                      alert('Vui lòng chọn xe và màu sắc');
                    }
                  }}
                  className={styles.addButton}
                  disabled={!selectedVehicle || !selectedVehicle.colorVariants || !selectedVehicle.colorVariants[selectedColorIndex] || !selectedVehicle.colorVariants[selectedColorIndex].inStock}
                >
                  <i className="fas fa-plus"></i>
                  Thêm vào đơn hàng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DealerOrderPage;
