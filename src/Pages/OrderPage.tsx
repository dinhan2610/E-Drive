import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Product } from '../types/product';
import { formatPrice } from '../utils/productUtils';
import { createOrder, OrderApiError } from '../services/orderApi';
import { SuccessModal } from '../components/SuccessModal';
import styles from '../styles/OrderStyles/OrderPage.module.scss';

interface OrderForm {
  // Customer Info
  fullName: string;
  email: string;
  phone: string;
  idCard: string;
  dateOfBirth: string;
  
  // Address
  address: string;
  ward: string;
  district: string;
  city: string;
  
  // Payment
  paymentMethod: 'full' | 'installment';
  installmentPlan?: '12' | '24' | '36' | '48';
  downPayment?: number;
  
  // Additional
  notes: string;
  wantsInsurance: boolean;
  wantsTestDrive: boolean;
}

const OrderPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const product = location.state?.product as Product;
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<OrderForm>({
    fullName: '',
    email: '',
    phone: '',
    idCard: '',
    dateOfBirth: '',
    address: '',
    ward: '',
    district: '',
    city: '',
    paymentMethod: 'full',
    notes: '',
    wantsInsurance: true,
    wantsTestDrive: false,
  });

  useEffect(() => {
    if (!product) {
      navigate('/products');
    }
    window.scrollTo(0, 0);
  }, [product, navigate]);

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

  const calculateInstallment = () => {
    if (formData.paymentMethod !== 'installment' || !formData.installmentPlan) {
      return null;
    }
    
    const downPayment = formData.downPayment || product.price * 0.2; // 20% minimum
    const loanAmount = product.price - downPayment;
    const months = parseInt(formData.installmentPlan);
    const interestRate = 0.08; // 8% annual
    const monthlyRate = interestRate / 12;
    
    const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                           (Math.pow(1 + monthlyRate, months) - 1);
    
    return {
      downPayment,
      monthlyPayment,
      totalPayment: downPayment + (monthlyPayment * months),
      months
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare full delivery address
      const fullAddress = `${formData.address}, ${formData.ward}, ${formData.district}, ${formData.city}`;
      
      // Calculate delivery date (7 days from now as default)
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 7);
      const desiredDeliveryDate = deliveryDate.toISOString().split('T')[0];

      // Create order via API with new format
      const order = await createOrder({
        orderItems: [
          {
            vehicleId: typeof product.id === 'string' ? parseInt(product.id) : product.id,
            quantity: 1
          }
        ],
        desiredDeliveryDate,
        deliveryNote: formData.notes || 'Không có ghi chú',
        deliveryAddress: fullAddress
      });

      setShowSuccess(true);
      
    } catch (error) {
      console.error('Error creating order:', error);
      if (error instanceof OrderApiError) {
        alert(`Lỗi: ${error.message}`);
      } else {
        alert('Không thể tạo đơn hàng. Vui lòng thử lại sau.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    navigate('/products');
  };

  if (!product) {
    return null;
  }

  const installmentCalc = calculateInstallment();

  return (
    <>
      <div className={styles.wrap}>
        <div className={styles.container}>
          {/* Breadcrumb */}
          <nav className={styles.breadcrumb}>
            <button onClick={() => navigate('/')}>Trang chủ</button>
            <span>/</span>
            <button onClick={() => navigate('/products')}>Sản phẩm</button>
            <span>/</span>
            <button onClick={() => navigate(`/products/${product.id}`)}>
              {product.name}
            </button>
            <span>/</span>
            <span className={styles.current}>Đặt hàng</span>
          </nav>

          <div className={styles.header}>
            <h1>Đặt hàng xe điện</h1>
            <p>Hoàn tất thông tin để đặt hàng {product.name}</p>
          </div>

          <div className={styles.content}>
            {/* Left: Form */}
            <form className={styles.form} onSubmit={handleSubmit}>
              {/* Customer Information */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <i className="fas fa-user"></i>
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

                  <div className={styles.formGroup}>
                    <label htmlFor="idCard">
                      CCCD/CMND <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      id="idCard"
                      name="idCard"
                      value={formData.idCard}
                      onChange={handleInputChange}
                      required
                      placeholder="001234567890"
                      pattern="[0-9]{9,12}"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="dateOfBirth">
                      Ngày sinh <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="date"
                      id="dateOfBirth"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </section>

              {/* Address */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <i className="fas fa-map-marker-alt"></i>
                  <h2>Địa chỉ giao xe</h2>
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
                      <p>Thanh toán 100% giá trị xe</p>
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
                      <p>Thanh toán theo tháng với lãi suất ưu đãi</p>
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
                          <option value="12">12 tháng</option>
                          <option value="24">24 tháng</option>
                          <option value="36">36 tháng</option>
                          <option value="48">48 tháng</option>
                        </select>
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="downPayment">
                          Trả trước (tối thiểu 20%)
                        </label>
                        <input
                          type="number"
                          id="downPayment"
                          name="downPayment"
                          value={formData.downPayment || ''}
                          onChange={handleInputChange}
                          min={product.price * 0.2}
                          max={product.price * 0.8}
                          placeholder={formatPrice(product.price * 0.2)}
                        />
                      </div>
                    </div>

                    {installmentCalc && (
                      <div className={styles.installmentSummary}>
                        <div className={styles.summaryItem}>
                          <span>Trả trước:</span>
                          <strong>{formatPrice(installmentCalc.downPayment)}</strong>
                        </div>
                        <div className={styles.summaryItem}>
                          <span>Góp hàng tháng:</span>
                          <strong>{formatPrice(installmentCalc.monthlyPayment)}</strong>
                        </div>
                        <div className={styles.summaryItem}>
                          <span>Tổng thanh toán:</span>
                          <strong>{formatPrice(installmentCalc.totalPayment)}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Additional Options */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <i className="fas fa-plus-circle"></i>
                  <h2>Dịch vụ bổ sung</h2>
                </div>

                <div className={styles.checkboxGroup}>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      name="wantsInsurance"
                      checked={formData.wantsInsurance}
                      onChange={handleInputChange}
                    />
                    <span className={styles.checkmark}></span>
                    <div className={styles.checkboxContent}>
                      <strong>Bảo hiểm xe điện toàn diện</strong>
                      <p>Bảo vệ toàn diện cho xe của bạn với mức phí ưu đãi</p>
                    </div>
                  </label>

                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      name="wantsTestDrive"
                      checked={formData.wantsTestDrive}
                      onChange={handleInputChange}
                    />
                    <span className={styles.checkmark}></span>
                    <div className={styles.checkboxContent}>
                      <strong>Đăng ký lái thử trước khi nhận xe</strong>
                      <p>Trải nghiệm xe trước khi hoàn tất đơn hàng</p>
                    </div>
                  </label>
                </div>
              </section>

              {/* Notes */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <i className="fas fa-comment"></i>
                  <h2>Ghi chú</h2>
                </div>
                <div className={styles.formGroup}>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Thêm ghi chú cho đơn hàng..."
                  />
                </div>
              </section>

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
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check"></i>
                      Xác nhận đặt hàng
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Right: Order Summary */}
            <aside className={styles.sidebar}>
              <div className={styles.summary}>
                <h3>Thông tin đơn hàng</h3>
                
                <div className={styles.productInfo}>
                  <img src={product.image} alt={product.name} />
                  <div className={styles.productDetails}>
                    <h4>{product.name}</h4>
                    <p>{product.variant}</p>
                  </div>
                </div>

                <div className={styles.divider}></div>

                <div className={styles.priceDetails}>
                  <div className={styles.priceRow}>
                    <span>Giá xe:</span>
                    <strong>{formatPrice(product.price)}</strong>
                  </div>
                  
                  {formData.wantsInsurance && (
                    <div className={styles.priceRow}>
                      <span>Bảo hiểm:</span>
                      <strong>Liên hệ</strong>
                    </div>
                  )}

                  {formData.paymentMethod === 'installment' && installmentCalc && (
                    <>
                      <div className={styles.divider}></div>
                      <div className={styles.priceRow}>
                        <span>Trả trước:</span>
                        <strong>{formatPrice(installmentCalc.downPayment)}</strong>
                      </div>
                      <div className={styles.priceRow}>
                        <span>Góp {installmentCalc.months} tháng:</span>
                        <strong>{formatPrice(installmentCalc.monthlyPayment)}/tháng</strong>
                      </div>
                    </>
                  )}

                  <div className={styles.divider}></div>

                  <div className={`${styles.priceRow} ${styles.total}`}>
                    <span>Tổng cộng:</span>
                    <strong className={styles.totalPrice}>
                      {formData.paymentMethod === 'installment' && installmentCalc
                        ? formatPrice(installmentCalc.totalPayment)
                        : formatPrice(product.price)}
                    </strong>
                  </div>
                </div>

                <div className={styles.benefits}>
                  <h4>Quyền lợi khách hàng</h4>
                  <ul>
                    <li>
                      <i className="fas fa-check-circle"></i>
                      <span>Bảo hành chính hãng {product.warranty}</span>
                    </li>
                    <li>
                      <i className="fas fa-check-circle"></i>
                      <span>Hỗ trợ vận chuyển toàn quốc</span>
                    </li>
                    <li>
                      <i className="fas fa-check-circle"></i>
                      <span>Bảo dưỡng miễn phí 1 năm</span>
                    </li>
                    <li>
                      <i className="fas fa-check-circle"></i>
                      <span>Tư vấn sử dụng 24/7</span>
                    </li>
                  </ul>
                </div>

                <div className={styles.support}>
                  <i className="fas fa-headset"></i>
                  <div>
                    <strong>Cần hỗ trợ?</strong>
                    <p>Hotline: 1900 xxxx</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <SuccessModal
        isOpen={showSuccess}
        onClose={handleSuccessClose}
        title="Đặt hàng thành công!"
        message={`Cảm ơn bạn đã đặt hàng ${product.name}. Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.`}
      />

      
    </>
  );
};

export default OrderPage;
