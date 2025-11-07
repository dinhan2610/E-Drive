import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Product } from '../types/product';
import { getProfile } from '../services/profileApi';
import { createOrder, getOrdersByDealer, type CreateOrderRequest, type Order } from '../services/orderApi';
import { confirmDelivery, DeliveryApiError } from '../services/deliveryApi';
import { fetchVehiclesFromApi, convertVehicleToProduct } from '../services/vehicleApi';
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
  const initialTab = (location.state?.activeTab as 'create' | 'list') || 'create';
  
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
  
  // Discount policies state
  const [discountPolicies, setDiscountPolicies] = useState<DiscountPolicy[]>([]);
  const [isLoadingDiscounts, setIsLoadingDiscounts] = useState(true);
  
  // Tab management
  const [activeTab, setActiveTab] = useState<'create' | 'list'>(initialTab);
  
  // Orders list
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [confirmingOrderId, setConfirmingOrderId] = useState<number | string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  
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
        
        // Auto-fill dealer information from profile API
        setFormData(prev => ({
          ...prev,
          dealerName: profile.agencyName || profile.fullName || '',
          dealerCode: profile.dealerId ? `DL${String(profile.dealerId).padStart(6, '0')}` : '',
          contactPerson: profile.contactPerson || profile.fullName || '',
          email: profile.email || '',
          phone: profile.agencyPhone || profile.phoneNumber || '',
          address: profile.streetAddress || '',
          ward: profile.ward || '',
          district: profile.district || '',
          city: profile.city || '',
        }));

        console.log('✅ Dealer profile loaded:', profile);
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

  // Load orders when switching to list tab
  useEffect(() => {
    if (activeTab === 'list' && currentDealerId) {
      loadOrders();
    }
  }, [activeTab, currentDealerId]);

  const loadOrders = async () => {
    if (!currentDealerId) {
      console.warn('⚠️ No dealer ID available, cannot load orders');
      return;
    }
    
    setIsLoadingOrders(true);
    try {
      console.log('🔄 Loading orders for dealer:', currentDealerId);
      const fetchedOrders = await getOrdersByDealer(currentDealerId);
      setOrders(fetchedOrders);
      console.log('✅ Orders loaded:', fetchedOrders);
    } catch (error: any) {
      console.error('❌ Error loading orders:', error);
      alert('Không thể tải danh sách đơn hàng: ' + error.message);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleConfirmDelivery = async (orderId: number | string) => {
    if (!window.confirm('Bạn xác nhận đã nhận đủ hàng cho đơn hàng này?')) {
      return;
    }

    setConfirmingOrderId(orderId);
    try {
      console.log(`🚚 Confirming delivery for order ${orderId}...`);
      await confirmDelivery(orderId);
      
      alert('✅ Đã xác nhận nhận hàng thành công!');
      
      // Reload orders to get updated status
      await loadOrders();
    } catch (error: any) {
      console.error('❌ Error confirming delivery:', error);
      
      if (error instanceof DeliveryApiError) {
        if (error.code === 'ORDER_NOT_FOUND') {
          alert('Không tìm thấy đơn hàng. Vui lòng kiểm tra lại.');
        } else if (error.code === 'FORBIDDEN') {
          alert('Bạn không có quyền xác nhận đơn hàng này.');
        } else {
          alert(`Lỗi: ${error.message}`);
        }
      } else {
        alert('Không thể xác nhận nhận hàng. Vui lòng thử lại.');
      }
    } finally {
      setConfirmingOrderId(null);
    }
  };

  const handleViewOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetail(true);
  };

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
    console.log('🚗 fetchVehicles called');
    setIsLoadingVehicles(true);
    try {
      console.log('📡 Calling fetchVehiclesFromApi...');
      const { vehicles } = await fetchVehiclesFromApi({ size: 100 });
      console.log('✅ Fetched vehicles:', vehicles);
      console.log('📊 Number of vehicles:', vehicles.length);
      
      // Convert API vehicles to Product format
      const products = vehicles.map(convertVehicleToProduct);
      console.log('🔄 Converted products:', products);
      setAvailableVehicles(products);
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
        quantity: product.quantity
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
      
      // Reload orders list
      await loadOrders();
      
      // Switch to list tab after short delay
      setTimeout(() => {
        setActiveTab('list');
      }, 2000);
      
    } catch (error: any) {
      console.error('Error creating order:', error);
      alert(`Lỗi khi tạo đơn hàng: ${error.message || 'Vui lòng thử lại'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    // Navigate to home or order list page
    navigate('/');
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

          {/* Tabs */}
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === 'create' ? styles.active : ''}`}
              onClick={() => setActiveTab('create')}
            >
              📝 Tạo đơn hàng mới
            </button>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === 'list' ? styles.active : ''}`}
              onClick={() => setActiveTab('list')}
            >
              📦 Đơn hàng của tôi
            </button>
          </div>

          {/* Create Order Form */}
          {activeTab === 'create' && (
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
                            :
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
          )}

          {/* Orders List */}
          {activeTab === 'list' && (
            <div className={styles.ordersList}>
              <h2>Đơn hàng của tôi</h2>
              
              {isLoadingOrders ? (
                <div className={styles.loading}>
                  <i className="fas fa-spinner fa-spin"></i>
                  <p>Đang tải danh sách đơn hàng...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className={styles.emptyState}>
                  <i className="fas fa-inbox"></i>
                  <p>Chưa có đơn hàng nào</p>
                  <button 
                    type="button"
                    onClick={() => setActiveTab('create')}
                    className={styles.createButton}
                  >
                    Tạo đơn hàng mới
                  </button>
                </div>
              ) : (
                <div className={styles.ordersGrid}>
                  {orders.map(order => (
                    <div 
                      key={order.orderId} 
                      className={styles.orderCard}
                      onClick={() => handleViewOrderDetail(order)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className={styles.orderHeader}>
                        <h3>Đơn hàng #{order.orderId}</h3>
                        <span className={`${styles.status} ${styles[order.orderStatus.toLowerCase()]}`}>
                          {order.orderStatus}
                        </span>
                      </div>
                      
                      <div className={styles.orderInfo}>
                        <div className={styles.infoRow}>
                          <span className={styles.label}>Tổng tiền:</span>
                          <span className={styles.value}>{formatPrice(order.grandTotal)}</span>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.label}>Ngày giao dự kiến:</span>
                          <span className={styles.value}>{order.desiredDeliveryDate}</span>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.label}>Địa chỉ giao hàng:</span>
                          <span className={styles.value}>{order.deliveryAddress}</span>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.label}>Thanh toán:</span>
                          <span className={`${styles.value} ${styles[order.paymentStatus.toLowerCase()]}`}>
                            {order.paymentStatus}
                          </span>
                        </div>
                      </div>

                      <div className={styles.orderActions} onClick={(e) => e.stopPropagation()}>
                        {order.orderStatus === 'SHIPPED' && (
                          <button
                            type="button"
                            onClick={() => handleConfirmDelivery(order.orderId)}
                            disabled={confirmingOrderId === order.orderId}
                            className={styles.confirmButton}
                          >
                            {confirmingOrderId === order.orderId ? (
                              <>
                                <i className="fas fa-spinner fa-spin"></i>
                                Đang xác nhận...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-check-circle"></i>
                                Xác nhận đã nhận hàng
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      <SuccessModal
        isOpen={showSuccess}
        onClose={handleSuccessClose}
        title="Đặt hàng thành công!"
        message="Đơn hàng của bạn đã được gửi thành công và đang chờ Admin duyệt. Chúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất."
      />

      {/* Order Detail Modal */}
      {showOrderDetail && selectedOrder && (
        <div className={styles.modalOverlay} onClick={() => setShowOrderDetail(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Chi tiết đơn hàng #{selectedOrder.orderId}</h2>
              <button onClick={() => setShowOrderDetail(false)} className={styles.closeBtn}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Order Status */}
              <div className={styles.detailSection}>
                <h3>Trạng thái</h3>
                <div className={styles.statusRow}>
                  <div>
                    <span className={styles.label}>Đơn hàng:</span>
                    <span className={`${styles.badge} ${styles[selectedOrder.orderStatus.toLowerCase()]}`}>
                      {selectedOrder.orderStatus}
                    </span>
                  </div>
                  <div>
                    <span className={styles.label}>Thanh toán:</span>
                    <span className={`${styles.badge} ${styles[selectedOrder.paymentStatus.toLowerCase()]}`}>
                      {selectedOrder.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              {selectedOrder.orderItems && selectedOrder.orderItems.length > 0 && (
                <div className={styles.detailSection}>
                  <h3>Danh sách xe</h3>
                  <div className={styles.itemsList}>
                    {selectedOrder.orderItems.map((item, index) => (
                      <div key={index} className={styles.orderItem}>
                        <div className={styles.itemInfo}>
                          <strong>{item.vehicleName || `Vehicle #${item.vehicleId}`}</strong>
                          <span className={styles.itemQuantity}>Số lượng: {item.quantity}</span>
                        </div>
                        <div className={styles.itemPrice}>
                          <div>{formatPrice(item.unitPrice)} x {item.quantity}</div>
                          <strong>{formatPrice(item.unitPrice * item.quantity)}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pricing Breakdown */}
              <div className={styles.detailSection}>
                <h3>Tổng quan thanh toán</h3>
                <div className={styles.pricingBreakdown}>
                  <div className={styles.priceRow}>
                    <span>Tạm tính:</span>
                    <span>{formatPrice(selectedOrder.subtotal)}</span>
                  </div>
                  {selectedOrder.dealerDiscount > 0 && (
                    <div className={styles.priceRow}>
                      <span>Chiết khấu đại lý:</span>
                      <span className={styles.discount}>-{formatPrice(selectedOrder.dealerDiscount)}</span>
                    </div>
                  )}
                  <div className={styles.priceRow}>
                    <span>VAT (10%):</span>
                    <span>{formatPrice(selectedOrder.vatAmount)}</span>
                  </div>
                  <div className={`${styles.priceRow} ${styles.total}`}>
                    <strong>Tổng cộng:</strong>
                    <strong className={styles.totalPrice}>{formatPrice(selectedOrder.grandTotal)}</strong>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div className={styles.detailSection}>
                <h3>Thông tin giao hàng</h3>
                <div className={styles.deliveryInfo}>
                  <div className={styles.infoItem}>
                    <i className="fas fa-calendar"></i>
                    <div>
                      <strong>Ngày giao dự kiến</strong>
                      <span>{selectedOrder.desiredDeliveryDate}</span>
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <i className="fas fa-map-marker-alt"></i>
                    <div>
                      <strong>Địa chỉ giao hàng</strong>
                      <span>{selectedOrder.deliveryAddress}</span>
                    </div>
                  </div>
                  {selectedOrder.deliveryNote && (
                    <div className={styles.infoItem}>
                      <i className="fas fa-sticky-note"></i>
                      <div>
                        <strong>Ghi chú</strong>
                        <span>{selectedOrder.deliveryNote}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button onClick={() => setShowOrderDetail(false)} className={styles.closeButton}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Selection Modal */}
      {showProductSelector && (
        <div className={styles.modalOverlay} onClick={() => setShowProductSelector(false)}>
          <div className={styles.vehicleModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <i className="fas fa-car"></i>
                <h2>Chọn xe cần đặt hàng</h2>
              </div>
              <button
                type="button"
                className={styles.closeModalBtn}
                onClick={() => setShowProductSelector(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.dropdownContainer}>
                <label htmlFor="vehicleSelect">
                  <i className="fas fa-car"></i>
                  Chọn xe
                </label>
                <select
                  id="vehicleSelect"
                  className={styles.vehicleDropdown}
                  onChange={(e) => {
                    const vehicleId = e.target.value;
                    console.log('🚗 Selected vehicle ID:', vehicleId);
                    if (vehicleId) {
                      const vehicle = availableVehicles.find(v => v.id === vehicleId);
                      console.log('🔍 Found vehicle:', vehicle);
                      if (vehicle) {
                        handleAddProduct(vehicle);
                        setShowProductSelector(false);
                      }
                    }
                  }}
                  disabled={isLoadingVehicles}
                  defaultValue=""
                >
                  <option value="" disabled>
                    {isLoadingVehicles ? 'Đang tải...' : 'Chọn xe từ danh sách'}
                  </option>
                  {availableVehicles.map(vehicle => {
                    console.log('🎨 Rendering option:', vehicle);
                    return (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.name} - {vehicle.variant} - {formatPrice(vehicle.price)}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DealerOrderPage;
