import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Product } from '../types/product';
import { formatPrice } from '../utils/productUtils';
import { fetchVehiclesFromApi, convertVehicleToProduct } from '../services/vehicleApi';
import Footer from '../components/Footer';
import { SuccessModal } from '../components/SuccessModal';
import styles from '../styles/OrderStyles/QuotePage.module.scss';

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
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(incomingProduct || null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  
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

  const generatePDF = async () => {
    if (!selectedProduct) {
      alert('Vui lòng chọn sản phẩm trước khi tạo báo giá');
      return;
    }

    setIsGenerating(true);

    try {
      // Import jsPDF and html2canvas dynamically
      const jsPDF = (await import('jspdf')).default;
      const html2canvas = (await import('html2canvas')).default;

      const pricing = calculatePricing();
      const quoteNumber = `BG-${Date.now()}`;
      const quoteDate = new Date().toLocaleDateString('vi-VN');

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Header with gradient background
      pdf.setFillColor(255, 77, 48);
      pdf.rect(0, 0, pageWidth, 40, 'F');
      
      // Company Logo/Name
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('E-DRIVE', 20, 20);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Future Electric Vehicles', 20, 28);
      pdf.text('Hotline: (0123) 456 789 | Email: contact@e-drive.vn', 20, 34);

      // Quote Number & Date
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Số: ${quoteNumber}`, pageWidth - 70, 20);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Ngày: ${quoteDate}`, pageWidth - 70, 28);

      // Title
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('BẢNG BÁO GIÁ', pageWidth / 2, 55, { align: 'center' });

      let yPos = 70;

      // Customer Information
      pdf.setFillColor(248, 249, 250);
      pdf.rect(15, yPos, pageWidth - 30, 8, 'F');
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('THÔNG TIN KHÁCH HÀNG', 20, yPos + 5);
      
      yPos += 12;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Họ tên: ${formData.fullName}`, 20, yPos);
      yPos += 6;
      if (formData.company) {
        pdf.text(`Công ty: ${formData.company}`, 20, yPos);
        yPos += 6;
      }
      pdf.text(`Email: ${formData.email}`, 20, yPos);
      yPos += 6;
      pdf.text(`Điện thoại: ${formData.phone}`, 20, yPos);
      yPos += 6;
      pdf.text(`Địa chỉ: ${formData.address}, ${formData.ward}, ${formData.district}, ${formData.city}`, 20, yPos);
      
      yPos += 12;

      // Product Information
      pdf.setFillColor(248, 249, 250);
      pdf.rect(15, yPos, pageWidth - 30, 8, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.text('CHI TIẾT SẢN PHẨM', 20, yPos + 5);
      
      yPos += 12;
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Sản phẩm: ${selectedProduct.name} ${selectedProduct.variant}`, 20, yPos);
      yPos += 6;
      pdf.text(`Số lượng: ${formData.quantity} xe`, 20, yPos);
      yPos += 6;
      pdf.text(`Đơn giá: ${formatPrice(selectedProduct.price)}`, 20, yPos);
      
      yPos += 12;

      // Pricing Table
      pdf.setFillColor(248, 249, 250);
      pdf.rect(15, yPos, pageWidth - 30, 8, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.text('CHI TIẾT GIÁ', 20, yPos + 5);
      
      yPos += 12;
      pdf.setFont('helvetica', 'normal');
      
      // Table headers
      pdf.setDrawColor(222, 226, 230);
      pdf.line(20, yPos, pageWidth - 20, yPos);
      yPos += 1;
      
      const items = [
        { label: 'Giá xe cơ bản', value: formatPrice(pricing.basePrice) },
      ];
      
      if (formData.includeInsurance) {
        items.push({ label: 'Bảo hiểm (3%)', value: formatPrice(pricing.insurancePrice) });
      }
      if (formData.includeWarrantyExtension) {
        items.push({ label: 'Gia hạn bảo hành', value: formatPrice(pricing.warrantyPrice) });
      }
      if (formData.includeAccessories) {
        items.push({ label: 'Phụ kiện đi kèm', value: formatPrice(pricing.accessoriesPrice) });
      }
      
      items.forEach(item => {
        yPos += 6;
        pdf.text(item.label, 20, yPos);
        pdf.text(item.value, pageWidth - 20, yPos, { align: 'right' });
      });
      
      yPos += 8;
      pdf.line(20, yPos, pageWidth - 20, yPos);
      yPos += 6;
      pdf.text('Tạm tính:', 20, yPos);
      pdf.text(formatPrice(pricing.subtotal), pageWidth - 20, yPos, { align: 'right' });
      
      yPos += 6;
      pdf.text('VAT (10%):', 20, yPos);
      pdf.text(formatPrice(pricing.vat), pageWidth - 20, yPos, { align: 'right' });
      
      yPos += 8;
      pdf.setDrawColor(255, 77, 48);
      pdf.setLineWidth(1);
      pdf.line(20, yPos, pageWidth - 20, yPos);
      yPos += 6;
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(255, 77, 48);
      pdf.text('TỔNG CỘNG:', 20, yPos);
      pdf.text(formatPrice(pricing.total), pageWidth - 20, yPos, { align: 'right' });
      
      yPos += 10;

      // Installment Details
      if (pricing.installmentDetails) {
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('PHƯƠNG THỨC TRẢ GÓP:', 20, yPos);
        yPos += 6;
        
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Trả trước: ${formatPrice(pricing.installmentDetails.downPayment)}`, 25, yPos);
        yPos += 5;
        pdf.text(`Góp ${pricing.installmentDetails.months} tháng: ${formatPrice(pricing.installmentDetails.monthlyPayment)}/tháng`, 25, yPos);
        yPos += 5;
        pdf.text(`Tổng thanh toán: ${formatPrice(pricing.installmentDetails.totalPayment)}`, 25, yPos);
        yPos += 8;
      }

      // Notes
      if (formData.notes) {
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'bold');
        pdf.text('GHI CHÚ:', 20, yPos);
        yPos += 6;
        pdf.setFont('helvetica', 'normal');
        const splitNotes = pdf.splitTextToSize(formData.notes, pageWidth - 40);
        pdf.text(splitNotes, 20, yPos);
        yPos += splitNotes.length * 5 + 5;
      }

      // Terms & Conditions
      yPos += 5;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ĐIỀU KHOẢN & ĐIỀU KIỆN:', 20, yPos);
      yPos += 5;
      
      pdf.setFont('helvetica', 'normal');
      const terms = [
        '• Báo giá có hiệu lực trong 30 ngày kể từ ngày phát hành',
        '• Giá chưa bao gồm chi phí vận chuyển và lắp đặt',
        '• Thời gian giao hàng: 15-30 ngày làm việc kể từ ngày đặt cọc',
        '• Đặt cọc tối thiểu 30% giá trị đơn hàng',
        '• Bảo hành chính hãng theo quy định nhà sản xuất',
      ];
      
      terms.forEach(term => {
        pdf.text(term, 20, yPos);
        yPos += 5;
      });

      // Footer with signatures
      if (yPos > pageHeight - 60) {
        pdf.addPage();
        yPos = 20;
      } else {
        yPos = pageHeight - 55;
      }

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      
      // Customer signature
      pdf.text('KHÁCH HÀNG', 40, yPos);
      pdf.text('(Ký và ghi rõ họ tên)', 35, yPos + 5);
      
      // Company signature
      pdf.text('ĐẠI DIỆN E-DRIVE', pageWidth - 80, yPos);
      pdf.text('(Ký và đóng dấu)', pageWidth - 75, yPos + 5);

      // Save PDF
      const fileName = `BaoGia_${selectedProduct.name.replace(/\s+/g, '_')}_${quoteNumber}.pdf`;
      pdf.save(fileName);

      console.log('✅ PDF generated:', fileName);
      setShowSuccess(true);
      
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      alert('Có lỗi xảy ra khi tạo báo giá. Vui lòng thử lại.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct) {
      alert('Vui lòng chọn sản phẩm trước khi tạo báo giá');
      return;
    }

    await generatePDF();
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
  };

  const pricing = calculatePricing();

  return (
    <>
      <div className={styles.wrap}>
        <div className={styles.container}>
        
          <div className={styles.header}>
           
            <h1>Tạo báo giá xe điện</h1>
            <p>
              {selectedProduct 
                ? `Điền thông tin để tạo báo giá chính thức cho ${selectedProduct.name}` 
                : 'Chọn sản phẩm và điền thông tin để tạo báo giá'}
            </p>
          </div>

          {/* Product Selector Dropdown - Only show when no product selected */}
          {!selectedProduct && (
            <div className={styles.productSelectorSection}>
              <div className={styles.selectorHeader}>
                <h3>
                  <i className="fas fa-car"></i>
                  Chọn sản phẩm cần báo giá
                </h3>
              </div>
              {isLoadingProducts ? (
                <div className={styles.loading}>
                  <i className="fas fa-spinner fa-spin"></i>
                  Đang tải danh sách xe...
                </div>
              ) : (
                <div className={styles.dropdownWrapper}>
                  <select 
                    className={styles.productDropdown}
                    onChange={(e) => handleSelectProduct(e.target.value)}
                    defaultValue=""
                  >
                    <option value="" disabled>-- Chọn xe để tạo báo giá --</option>
                    {availableProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {product.variant} ({formatPrice(product.price)})
                      </option>
                    ))}
                  </select>
                  <i className="fas fa-chevron-down"></i>
                </div>
              )}
            </div>
          )}

          {selectedProduct && (
            <>
              {/* Selected Product Banner */}
              <div className={styles.selectedProductBanner}>
                <div className={styles.bannerContent}>
                  <img src={selectedProduct.image} alt={selectedProduct.name} />
                  <div className={styles.bannerInfo}>
                    <span className={styles.label}>Đang tạo báo giá cho:</span>
                    <h3>{selectedProduct.name} - {selectedProduct.variant}</h3>
                    <p className={styles.price}>{formatPrice(selectedProduct.price)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.changeProductButton}
                  onClick={() => {
                    setSelectedProduct(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <i className="fas fa-exchange-alt"></i>
                  Đổi sản phẩm
                </button>
              </div>

              <div className={styles.content}>
            {/* Left: Form */}
            <form className={styles.form} onSubmit={handleSubmit}>
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
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Đang tạo PDF...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-file-pdf"></i>
                      Tạo báo giá PDF
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Right: Quote Summary */}
           
              
                

             
          </div>
          </>
          )}
        </div>
      </div>

      <SuccessModal
        isOpen={showSuccess}
        onClose={handleSuccessClose}
        title="Tạo báo giá thành công!"
        message="File PDF báo giá đã được tải xuống. Vui lòng kiểm tra thư mục Downloads."
      />

      <Footer />
    </>
  );
};

export default QuotePage;
