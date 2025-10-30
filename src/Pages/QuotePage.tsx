import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Product } from '../types/product';
import { formatPrice } from '../utils/productUtils';
import { fetchVehiclesFromApi, convertVehicleToProduct } from '../services/vehicleApi';
import { 
  createQuotation, 
  type QuotationRequest 
} from '../services/quotationApi';
import Footer from '../components/Footer';
import styles from '../styles/OrderStyles/QuotePage.module.scss';
import modalStyles from '../styles/OrderStyles/QuoteSuccessModal.module.scss';

interface QuoteForm {
  // Customer Info
  fullName: string;
  email: string;
  phone: string;
  company?: string;
  
  // Address
  address: string;
  ward: string;
  district: string;
  city: string;
  
  // Quote Details
  quantity: number;
  paymentMethod: 'full' | 'installment';
  installmentPlan?: '12' | '24' | '36' | '48';
  downPayment?: number;
  
  // Additional
  notes: string;
  includeInsurance: boolean;
  includeWarrantyExtension: boolean;
  includeAccessories: boolean;
}

const QuotePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const incomingProduct = location.state?.product as Product | undefined;
  
  // Tab management
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(incomingProduct || null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [createdQuoteData, setCreatedQuoteData] = useState<any>(null);
  
  const [formData, setFormData] = useState<QuoteForm>({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    ward: '',
    district: '',
    city: '',
    quantity: 1,
    paymentMethod: 'full',
    notes: '',
    includeInsurance: false,
    includeWarrantyExtension: false,
    includeAccessories: false,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Load available products from vehicleApi
    const loadProducts = async () => {
      try {
        const { vehicles } = await fetchVehiclesFromApi({
          page: 0,
          size: 100,
          status: 'AVAILABLE'
        });
        
        const products = vehicles.map(convertVehicleToProduct);
        setAvailableProducts(products);
      } catch (error) {
        console.error('❌ Error loading products:', error);
      } finally {
        setIsLoadingProducts(false);
      }
    };
    
    loadProducts();
  }, []);

  const handleSelectProduct = (productId: string) => {
    const product = availableProducts.find(p => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      const numValue = parseInt(value) || 0;
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const calculatePricing = () => {
    if (!selectedProduct) {
      return {
        basePrice: 0,
        insurancePrice: 0,
        warrantyPrice: 0,
        accessoriesPrice: 0,
        subtotal: 0,
        vat: 0,
        total: 0,
        installmentDetails: null
      };
    }

    const basePrice = selectedProduct.price * formData.quantity;
    const insurancePrice = formData.includeInsurance ? basePrice * 0.03 : 0; // 3% of base price
    const warrantyPrice = formData.includeWarrantyExtension ? 50000000 * formData.quantity : 0; // 50M per car
    const accessoriesPrice = formData.includeAccessories ? 30000000 * formData.quantity : 0; // 30M per car
    
    const subtotal = basePrice + insurancePrice + warrantyPrice + accessoriesPrice;
    const vat = subtotal * 0.1; // 10% VAT
    const total = subtotal + vat;

    let installmentDetails = null;
    if (formData.paymentMethod === 'installment' && formData.installmentPlan) {
      const downPayment = formData.downPayment || total * 0.3; // 30% minimum for dealers
      const loanAmount = total - downPayment;
      const months = parseInt(formData.installmentPlan);
      const interestRate = 0.06; // 6% annual for bulk orders
      const monthlyRate = interestRate / 12;
      
      const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                             (Math.pow(1 + monthlyRate, months) - 1);
      
      installmentDetails = {
        downPayment,
        monthlyPayment,
        totalPayment: downPayment + (monthlyPayment * months),
        months,
      };
    }

    return {
      basePrice,
      insurancePrice,
      warrantyPrice,
      accessoriesPrice,
      subtotal,
      vat,
      total,
      installmentDetails,
    };
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct) {
      setErrorMessage('Vui lòng chọn sản phẩm trước khi tạo báo giá');
      return;
    }

    // Check if user is logged in
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setErrorMessage('Vui lòng đăng nhập để sử dụng tính năng này.');
      setShowLoginPrompt(true);
      return;
    }

    // Validate required fields
    if (!formData.fullName || !formData.phone || !formData.email) {
      setErrorMessage('Vui lòng điền đầy đủ thông tin khách hàng');
      return;
    }

    setIsGenerating(true);
    setErrorMessage('');

    try {
      const requestData: QuotationRequest = {
        vehicleId: Number(selectedProduct.id),
        includeInsurancePercent: formData.includeInsurance,
        includeWarrantyExtension: formData.includeWarrantyExtension,
        includeAccessories: formData.includeAccessories,
        customerFullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        street: formData.address,
        ward: formData.ward,
        district: formData.district,
        city: formData.city,
        notes: formData.notes
      };

      const result = await createQuotation(requestData);
      
      setCreatedQuoteData(result);
      setShowSuccess(true);
      
      // Reset form after successful creation
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        company: '',
        address: '',
        ward: '',
        district: '',
        city: '',
        quantity: 1,
        paymentMethod: 'full',
        notes: '',
        includeInsurance: false,
        includeWarrantyExtension: false,
        includeAccessories: false,
      });
      setSelectedProduct(null);
      
    } catch (error: any) {
      console.error('❌ Create quotation error:', error);
      setErrorMessage(error.message || 'Không thể tạo báo giá. Vui lòng thử lại.');
      
      // Show login prompt if auth error
      if (error.message?.includes('đăng nhập')) {
        setShowLoginPrompt(true);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const pricing = calculatePricing();

  return (
    <>
      <div className={styles.wrap}>
        <div className={styles.container}>
        
          <div className={styles.header}>
            <h1>Tạo báo giá xe điện</h1>
            <p>Điền thông tin để tạo báo giá chính thức</p>
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === 'create' ? styles.active : ''}`}
              onClick={() => setActiveTab('create')}
            >
              📝 Tạo báo giá
            </button>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === 'list' ? styles.active : ''}`}
              onClick={() => navigate('/quotes')}
            >
              📋 Báo giá đã tạo
            </button>
          </div>

          {/* Create Quote Form */}
          {activeTab === 'create' && (
          <div className={styles.content}>
            {/* Left: Form */}
            <form className={styles.form} onSubmit={handleSubmit}>
              
              {/* Product Selection */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <i className="fas fa-car"></i>
                  <h2>Chọn sản phẩm</h2>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="product">
                    Sản phẩm <span className={styles.required}>*</span>
                  </label>
                  {isLoadingProducts ? (
                    <div className={styles.loading}>
                      <i className="fas fa-spinner fa-spin"></i>
                      Đang tải danh sách xe...
                    </div>
                  ) : (
                    <select
                      id="product"
                      className={styles.productSelect}
                      value={selectedProduct?.id || ''}
                      onChange={(e) => handleSelectProduct(e.target.value)}
                      required
                    >
                      <option value="">-- Chọn xe để tạo báo giá --</option>
                      {availableProducts.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} - {product.variant} ({formatPrice(product.price)})
                        </option>
                      ))}
                    </select>
                  )}
                  {selectedProduct && (
                    <div className={styles.selectedProductInfo}>
                      <img src={selectedProduct.image} alt={selectedProduct.name} />
                      <div>
                        <p><strong>{selectedProduct.name} - {selectedProduct.variant}</strong></p>
                        <p className={styles.price}>{formatPrice(selectedProduct.price)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Customer Information */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <i className="fas fa-user-tie"></i>
                  <h2>Thông tin khách hàng</h2>
                </div>
                <div className={styles.grid}>
                  <div className={styles.formGroup}>
                    <label htmlFor="fullName">
                      Họ và tên <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      placeholder="Nguyễn Văn A"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="company">
                      Tên công ty (nếu có)
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      placeholder="Công ty TNHH ABC"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="phone">
                      Số điện thoại <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      placeholder="0912345678"
                      pattern="[0-9]{10}"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="email">
                      Email <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
              </section>

              {/* Address */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <i className="fas fa-map-marker-alt"></i>
                  <h2>Địa chỉ</h2>
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

              {/* Quote Details */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <i className="fas fa-shopping-cart"></i>
                  <h2>Dịch vụ chính hãng</h2>
                </div>

                <div className={styles.checkboxGroup}>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      name="includeInsurance"
                      checked={formData.includeInsurance}
                      onChange={handleInputChange}
                    />
                    <span className={styles.checkmark}></span>
                    <div className={styles.checkboxContent}>
                      <strong>Bảo hiểm xe điện (3% giá trị xe)</strong>
                      <p>Bảo vệ toàn diện cho xe với mức phí ưu đãi</p>
                    </div>
                  </label>

                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      name="includeWarrantyExtension"
                      checked={formData.includeWarrantyExtension}
                      onChange={handleInputChange}
                    />
                    <span className={styles.checkmark}></span>
                    <div className={styles.checkboxContent}>
                      <strong>Gia hạn bảo hành (50,000,000 VNĐ/xe)</strong>
                      <p>Kéo dài thời gian bảo hành thêm 2 năm</p>
                    </div>
                  </label>

                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      name="includeAccessories"
                      checked={formData.includeAccessories}
                      onChange={handleInputChange}
                    />
                    <span className={styles.checkmark}></span>
                    <div className={styles.checkboxContent}>
                      <strong>Phụ kiện đi kèm (30,000,000 VNĐ/xe)</strong>
                      <p>Bộ phụ kiện cao cấp: thảm lót, camera 360°, cảm biến</p>
                    </div>
                  </label>
                </div>
              </section>

              {/* Payment Method */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <i className="fas fa-credit-card"></i>
                  <h2>Hình thức thanh toán</h2>
                </div>

                <div className={styles.paymentOptions}>
                  <label className={styles.radioCard}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="full"
                      checked={formData.paymentMethod === 'full'}
                      onChange={handleInputChange}
                    />
                    <div className={styles.radioContent}>
                      <div className={styles.radioHeader}>
                        <i className="fas fa-money-bill-wave"></i>
                        <span>Thanh toán toàn bộ</span>
                      </div>
                      <p>Thanh toán 100% giá trị đơn hàng</p>
                    </div>
                  </label>

                  <label className={styles.radioCard}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="installment"
                      checked={formData.paymentMethod === 'installment'}
                      onChange={handleInputChange}
                    />
                    <div className={styles.radioContent}>
                      <div className={styles.radioHeader}>
                        <i className="fas fa-calendar-alt"></i>
                        <span>Trả góp</span>
                      </div>
                      <p>Lãi suất ưu đãi 6%/năm cho đơn hàng số lượng lớn</p>
                    </div>
                  </label>
                </div>

                {formData.paymentMethod === 'installment' && (
                  <div className={styles.installmentDetails}>
                    <div className={styles.grid}>
                      <div className={styles.formGroup}>
                        <label htmlFor="installmentPlan">
                          Thời gian trả góp <span className={styles.required}>*</span>
                        </label>
                        <select
                          id="installmentPlan"
                          name="installmentPlan"
                          value={formData.installmentPlan}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Chọn kỳ hạn</option>
                          <option value="6">6 tháng</option>
                          <option value="12">12 tháng</option>
                          <option value="24">24 tháng</option>
                          <option value="36">36 tháng</option>
                          <option value="48">48 tháng</option>
                        </select>
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="downPayment">
                          Trả trước (tối thiểu 30%)
                        </label>
                        <input
                          type="number"
                          id="downPayment"
                          name="downPayment"
                          value={formData.downPayment || ''}
                          onChange={handleInputChange}
                          min={pricing.total * 0.3}
                          max={pricing.total * 0.8}
                          placeholder={formatPrice(pricing.total * 0.3)}
                        />
                      </div>
                    </div>

                    {pricing.installmentDetails && (
                      <div className={styles.installmentSummary}>
                        <div className={styles.summaryItem}>
                          <span>Trả trước:</span>
                          <strong>{formatPrice(pricing.installmentDetails.downPayment)}</strong>
                        </div>
                        <div className={styles.summaryItem}>
                          <span>Góp hàng tháng:</span>
                          <strong>{formatPrice(pricing.installmentDetails.monthlyPayment)}</strong>
                        </div>
                        <div className={styles.summaryItem}>
                          <span>Tổng thanh toán:</span>
                          <strong>{formatPrice(pricing.installmentDetails.totalPayment)}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Error Message */}
              {errorMessage && (
                <div className={styles.errorMessage}>
                  <i className="fas fa-exclamation-circle"></i>
                  <div className={styles.errorContent}>
                    <span>{errorMessage}</span>
                    {showLoginPrompt && (
                      <button 
                        className={styles.loginButton}
                        onClick={() => navigate('/', { state: { openAuth: true } })}
                      >
                        <i className="fas fa-sign-in-alt"></i>
                        Đăng nhập ngay
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className={styles.submitSection}>
                <button
                  type="button"
                  className={styles.backButton}
                  onClick={() => navigate(-1)}
                >
                  <i className="fas fa-arrow-left"></i>
                  Quay lại
                </button>
                
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isGenerating || !selectedProduct}
                >
                  {isGenerating ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Đang tạo báo giá...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane"></i>
                      Tạo báo giá
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Right: Quote Summary */}
           
              
                

             
          </div>
          )}
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className={modalStyles.modalOverlay} onClick={() => setShowSuccess(false)}>
          <div className={modalStyles.successModal} onClick={(e) => e.stopPropagation()}>
            <div className={modalStyles.modalIcon}>
              <div className={modalStyles.checkmarkCircle}>
                <i className="fas fa-check"></i>
              </div>
            </div>
            
            <h2 className={modalStyles.modalTitle}>Tạo báo giá thành công!</h2>
            <p className={modalStyles.modalMessage}>
              Báo giá đã được lưu vào hệ thống. Bạn có thể xem lại trong danh sách báo giá.
            </p>

            {createdQuoteData && (
              <div className={modalStyles.quoteInfo}>
                <div className={modalStyles.infoRow}>
                  <span className={modalStyles.label}>Mã báo giá:</span>
                  <span className={modalStyles.value}>BG-{createdQuoteData.quotationId}</span>
                </div>
                <div className={modalStyles.infoRow}>
                  <span className={modalStyles.label}>Xe:</span>
                  <span className={modalStyles.value}>{createdQuoteData.vehicleModel}</span>
                </div>
                <div className={modalStyles.infoRow}>
                  <span className={modalStyles.label}>Khách hàng:</span>
                  <span className={modalStyles.value}>{createdQuoteData.customerFullName}</span>
                </div>
                <div className={modalStyles.infoRow}>
                  <span className={modalStyles.label}>Tổng giá trị:</span>
                  <span className={modalStyles.valueHighlight}>{formatPrice(createdQuoteData.grandTotal)}</span>
                </div>
              </div>
            )}

            <div className={modalStyles.modalActions}>
              <button
                className={modalStyles.viewListButton}
                onClick={() => {
                  setShowSuccess(false);
                  navigate('/quotes');
                }}
              >
                <i className="fas fa-list"></i>
                Xem danh sách báo giá
              </button>
              
              <button
                className={modalStyles.createNewButton}
                onClick={() => setShowSuccess(false)}
              >
                <i className="fas fa-plus"></i>
                Tạo báo giá mới
              </button>
            </div>

            <button 
              className={modalStyles.closeButton}
              onClick={() => setShowSuccess(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default QuotePage;
