import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchVehiclesFromApi, groupVehiclesByModel } from '../services/vehicleApi';
import { listPromotions } from '../services/promotionsApi';
import { fetchDealers } from '../services/dealerApi';
import type { Product, ColorVariant } from '../types/product';
import type { Promotion } from '../types/promotion';
import './_CreateQuote.scss';

// ============================================
// TYPESCRIPT INTERFACES
// ============================================

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  type: 'individual' | 'business';
  idCardFront?: string; // Base64 or URL
  idCardBack?: string; // Base64 or URL
}

interface VehicleConfig {
  vehicleId: number; // ID from API
  model: string; // modelName from API
  variant: string; // version from API
  color: string; // color name
  colorId: number; // colorId from API
  colorHex: string;
  imageUrl?: string;
  basePrice: number; // priceRetail or finalPrice
}

interface PaymentDetails {
  method: 'full' | 'installment';
  downPayment: number;
  loanTerm: number; // months
  interestRate: number;
  monthlyPayment: number;
}

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  icon: string;
  description: string;
  category: 'protection' | 'charging' | 'warranty' | 'accessory';
}

interface QuoteState {
  customer: Customer | null;
  vehicle: VehicleConfig;
  promotions: number[]; // Array of promoId
  payment: PaymentDetails;
  notes: string;
  validityDays: number;
  addedServices: ServiceItem[];
}

// ============================================
// CONSTANTS
// ============================================

const LOAN_TERMS = [12, 18, 24, 36, 48, 60];
const MIN_DOWN_PAYMENT_PERCENT = 15;
const MAX_DOWN_PAYMENT_PERCENT = 80;
const MOCK_ON_ROAD_FEE = 20000000; // 20 triệu VND - Phí lăn bánh tạm tính

const MOCK_ADDON_SERVICES: ServiceItem[] = [
  {
    id: 'tint-film',
    name: 'Phim cách nhiệt cao cấp',
    price: 8500000,
    icon: 'fa-sun',
    description: 'Phim 3M chống nóng, chống tia UV 99%',
    category: 'protection'
  },
  {
    id: 'wallbox-7kw',
    name: 'Bộ sạc Wallbox 7kW',
    price: 15000000,
    icon: 'fa-charging-station',
    description: 'Sạc nhanh tại nhà, tiết kiệm thời gian',
    category: 'charging'
  },
  {
    id: 'extended-warranty',
    name: 'Gói bảo hành mở rộng 2 năm',
    price: 25000000,
    icon: 'fa-shield-alt',
    description: 'Gia hạn bảo hành thêm 2 năm hoặc 50.000km',
    category: 'warranty'
  },
  {
    id: 'ppf-full',
    name: 'PPF toàn xe',
    price: 45000000,
    icon: 'fa-car-side',
    description: 'Phim bảo vệ sơn chống xước, chống ố vàng',
    category: 'protection'
  },
  {
    id: 'ceramic-coating',
    name: 'Phủ Ceramic 9H',
    price: 12000000,
    icon: 'fa-sparkles',
    description: 'Bảo vệ sơn xe, tăng độ bóng lâu dài',
    category: 'protection'
  },
  {
    id: 'dashcam-360',
    name: 'Camera hành trình 360°',
    price: 18000000,
    icon: 'fa-video',
    description: 'Camera 4K, góc quay toàn cảnh, ghi hình 24/7',
    category: 'accessory'
  }
];

// Terms & Conditions
const QUOTATION_TERMS: string[] = [
  "Báo giá này có hiệu lực trong vòng 07 ngày kể từ ngày phát hành.",
  "Giá trên đã bao gồm thuế VAT, nhưng chưa bao gồm lệ phí trước bạ, phí đăng ký, đăng kiểm và các chi phí lăn bánh khác.",
  "Các chương trình khuyến mãi (nếu có) được áp dụng theo điều kiện và thời hạn của E-Drive tại thời điểm xuất hóa đơn.",
  "Màu sắc xe và phụ kiện có thể có sự chênh lệch nhỏ so với hình ảnh minh họa do điều kiện ánh sáng.",
  "Khoản tiền đặt cọc sẽ không được hoàn lại nếu khách hàng đơn phương hủy bỏ giao dịch.",
  "Thời gian giao xe dự kiến có thể thay đổi tùy thuộc vào lịch sản xuất của nhà máy và tình hình vận chuyển.",
  "Các gói dịch vụ cộng thêm có thể có điều khoản riêng. Vui lòng tham khảo hợp đồng chi tiết.",
  "Đây là báo giá tham khảo và không có giá trị pháp lý như một hợp đồng mua bán chính thức."
];

// ============================================
// MAIN COMPONENT
// ============================================

const CreateQuotePage: React.FC = () => {
  const navigate = useNavigate();
  
  // Check authentication on mount
  useEffect(() => {
    const userStr = localStorage.getItem('e-drive-user');
    if (!userStr || userStr === '{}' || userStr === 'null') {
      console.warn('⚠️ No user found - redirecting to login');
      alert('Vui lòng đăng nhập để tạo báo giá');
      navigate('/login');
    }
  }, [navigate]);
  
  // State Management
  const [quote, setQuote] = useState<QuoteState>({
    customer: null,
    vehicle: {
      vehicleId: 0,
      model: '',
      variant: '',
      color: '',
      colorId: 0,
      colorHex: '',
      imageUrl: '',
      basePrice: 0,
    },
    promotions: [],
    payment: {
      method: 'full',
      downPayment: 0,
      loanTerm: 12,
      interestRate: 8.5,
      monthlyPayment: 0,
    },
    notes: '',
    validityDays: 30,
    addedServices: [],
  });
  
  // Down payment percentage (15-80%)
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(0);

  // Accordion states for sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    customer: true,
    vehicle: true,
    promotions: false,
    services: false,
    payment: false,
    notes: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [idCardFrontPreview, setIdCardFrontPreview] = useState<string>('');
  const [idCardBackPreview, setIdCardBackPreview] = useState<string>('');

  // API Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loadingPromotions, setLoadingPromotions] = useState(false);
  const [dealerId, setDealerId] = useState<number | null>(null);

  // Refs
  const fileInputFrontRef = useRef<HTMLInputElement>(null);
  const fileInputBackRef = useRef<HTMLInputElement>(null);

  // Fetch dealerId from username (JWT token)
  useEffect(() => {
    const fetchDealerId = async () => {
      try {
        const userStr = localStorage.getItem('e-drive-user');
        if (!userStr) return;
        
        const user = JSON.parse(userStr);
        const dealers = await fetchDealers();
        
        if (dealers.length === 0) {
          console.error('❌ No dealers found');
          return;
        }
        
        // Try multiple matching strategies
        let matchedDealer = dealers.find(d => d.dealerEmail === user.email)
          || dealers.find(d => d.dealerName === user.username)
          || (user.sub && dealers.find(d => d.dealerId.toString() === user.sub))
          || null;
        
        // For dealer_manager role: extract dealerId from username pattern (d1_manager)
        if (!matchedDealer && user.role === 'dealer_manager') {
          const match = user.username.match(/^d(\d+)_/);
          if (match) {
            const extractedDealerId = parseInt(match[1]);
            matchedDealer = dealers.find(d => d.dealerId === extractedDealerId) || null;
          }
        }
        
        if (matchedDealer) {
          console.log('✅ Dealer matched:', matchedDealer.dealerId, '-', matchedDealer.dealerName);
          setDealerId(matchedDealer.dealerId);
        } else {
          console.error('❌ No dealer found for user:', user.username);
        }
      } catch (err: any) {
        console.error('❌ Error fetching dealerId:', err);
        console.error('❌ Error details:', err.message, err.stack);
      }
    };
    
    fetchDealerId();
  }, []);

  // Fetch vehicles and colors from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch vehicles from API
        const vehiclesData = await fetchVehiclesFromApi({ status: 'AVAILABLE' });
        console.log('📦 Fetched vehicles:', vehiclesData.vehicles.length);

        // Group vehicles by model+version to create products
        const groupedProducts = groupVehiclesByModel(vehiclesData.vehicles);
        setProducts(groupedProducts);

        console.log('✅ Data loaded successfully');
      } catch (err) {
        console.error('❌ Error fetching data:', err);
        setError('Không thể tải dữ liệu xe. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch promotions based on dealerId (fetched from dealers API)
  useEffect(() => {
    if (!dealerId) {
      console.log('⏳ Waiting for dealerId...');
      return;
    }
    
    console.log('🚀 useEffect: Starting promotions fetch...');
    
    const fetchPromotionsData = async () => {
      try {
        setLoadingPromotions(true);
        
        console.log('🎁 Fetching promotions for dealer:', dealerId);
        const response = await listPromotions(dealerId);
        console.log('📦 Raw API Response:', response);        const items = response?.items || (response as any)?.data?.items || response;
        console.log('📋 Extracted items:', items);
        console.log('📋 Total promotions from API:', items?.length || 0);
        
        if (!items || !Array.isArray(items)) {
          console.error('❌ API response is not an array:', typeof items);
          setPromotions([]);
          return;
        }
        
        if (items.length > 0) {
          console.log('🔍 Sample promotion:', items[0]);
        } else {
          console.warn('⚠️ No promotions found for dealer:', dealerId);
        }
        
        // Filter active promotions (within date range)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const activePromotions = items.filter((promo: Promotion) => {
          const startDate = new Date(promo.startDate);
          const endDate = new Date(promo.endDate);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          return today >= startDate && today <= endDate;
        });

        setPromotions(activePromotions);
        console.log('✅ Loaded', activePromotions.length, 'active promotions for dealer', dealerId);
      } catch (err: any) {
        console.error('❌ Error fetching promotions:', err);
        console.error('❌ Error message:', err?.message);
        console.error('❌ Error stack:', err?.stack);
        setPromotions([]);
      } finally {
        setLoadingPromotions(false);
        console.log('🏁 Promotions fetch completed');
      }
    };

    fetchPromotionsData();
  }, [dealerId]);

  // Cost Summary Calculation
  const costSummary = useMemo(() => {
    const listPrice = quote.vehicle.basePrice;
    
    // Calculate promotion discounts (only from promotions API)
    let promoDiscount = 0;
    quote.promotions.forEach(promoId => {
      const promo = promotions.find(p => p.promoId === promoId);
      if (promo) {
        // Check if promotion applies to this vehicle
        if (promo.vehicleIds.length === 0 || promo.vehicleIds.includes(quote.vehicle.vehicleId)) {
          if (promo.discountType === 'AMOUNT') {
            promoDiscount += promo.discountValue;
          } else if (promo.discountType === 'PERCENTAGE') {
            promoDiscount += (listPrice * promo.discountValue) / 100;
          }
        }
      }
    });

    const totalDiscount = promoDiscount; // Only promotion discounts
    const subtotal = listPrice - totalDiscount;
    
    // Calculate total service cost
    const totalServiceCost = quote.addedServices.reduce((sum, item) => sum + item.price, 0);
    
    // Subtotal before on-road fee
    const subTotal = Math.max(0, subtotal + totalServiceCost);
    
    // On-road fee (lăn bánh)
    const onRoadFee = quote.vehicle.vehicleId > 0 ? MOCK_ON_ROAD_FEE : 0;
    
    // Final on-road total
    const finalOnRoadTotal = subTotal + onRoadFee;
    
    // For payment calculation (without on-road fee)
    const finalTotal = subTotal;

    // Calculate installment details
    let monthlyPayment = 0;
    let totalInterest = 0;
    let totalPayment = 0;
    
    if (quote.payment.method === 'installment') {
      const loanAmount = finalTotal - quote.payment.downPayment;
      const numPayments = quote.payment.loanTerm; // Number of months
      
      if (loanAmount > 0 && numPayments > 0) {
        // Since there's no actual interest rate yet, just divide evenly
        monthlyPayment = loanAmount / numPayments;
        totalPayment = loanAmount; // No interest, so total = loan amount
        totalInterest = 0;
        
        // Round up to ensure full loan is covered
        monthlyPayment = Math.ceil(monthlyPayment);
      }
    }

    return {
      listPrice,
      promoDiscount,
      totalDiscount,
      subtotal,
      totalServiceCost,
      subTotal,
      onRoadFee,
      finalOnRoadTotal,
      finalTotal,
      monthlyPayment,
      totalInterest,
      totalPayment,
    };
  }, [quote, promotions]);

  // Auto-adjust down payment when total changes
  useEffect(() => {
    if (quote.payment.method === 'installment' && costSummary.subtotal > 0) {
      const minDownPayment = costSummary.subtotal * (MIN_DOWN_PAYMENT_PERCENT / 100);
      const maxDownPayment = costSummary.subtotal * (MAX_DOWN_PAYMENT_PERCENT / 100);
      
      // If down payment is 0, set to minimum (first time switching to installment)
      if (quote.payment.downPayment === 0) {
        setQuote(prev => ({
          ...prev,
          payment: { ...prev.payment, downPayment: minDownPayment }
        }));
        setDownPaymentPercent(MIN_DOWN_PAYMENT_PERCENT);
      } else {
        // Update percent state based on current down payment
        const currentPercent = Math.round((quote.payment.downPayment / costSummary.subtotal) * 100);
        
        // Only adjust if outside valid range
        if (quote.payment.downPayment < minDownPayment) {
          setQuote(prev => ({
            ...prev,
            payment: { ...prev.payment, downPayment: minDownPayment }
          }));
          setDownPaymentPercent(MIN_DOWN_PAYMENT_PERCENT);
        } else if (quote.payment.downPayment > maxDownPayment) {
          setQuote(prev => ({
            ...prev,
            payment: { ...prev.payment, downPayment: maxDownPayment }
          }));
          setDownPaymentPercent(MAX_DOWN_PAYMENT_PERCENT);
        } else {
          setDownPaymentPercent(currentPercent);
        }
      }
    } else if (quote.payment.method === 'full') {
      // Reset when switching back to full payment
      if (quote.payment.downPayment !== 0) {
        setQuote(prev => ({
          ...prev,
          payment: { ...prev.payment, downPayment: 0 }
        }));
        setDownPaymentPercent(0);
      }
    }
  }, [costSummary.subtotal, quote.payment.method, quote.payment.downPayment]);

  // Event Handlers
  const handleCustomerInputChange = useCallback((field: keyof Customer, value: string) => {
    setQuote(prev => ({
      ...prev,
      customer: prev.customer ? { ...prev.customer, [field]: value } : null,
    }));
    setValidationErrors(prev => ({ ...prev, [field]: '' }));
  }, []);

  const handleImageUpload = useCallback((type: 'front' | 'back', file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (type === 'front') {
          setIdCardFrontPreview(base64String);
          setQuote(prev => ({
            ...prev,
            customer: prev.customer ? { ...prev.customer, idCardFront: base64String } : null,
          }));
        } else {
          setIdCardBackPreview(base64String);
          setQuote(prev => ({
            ...prev,
            customer: prev.customer ? { ...prev.customer, idCardBack: base64String } : null,
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleRemoveImage = useCallback((type: 'front' | 'back') => {
    if (type === 'front') {
      setIdCardFrontPreview('');
      setQuote(prev => ({
        ...prev,
        customer: prev.customer ? { ...prev.customer, idCardFront: '' } : null,
      }));
    } else {
      setIdCardBackPreview('');
      setQuote(prev => ({
        ...prev,
        customer: prev.customer ? { ...prev.customer, idCardBack: '' } : null,
      }));
    }
  }, []);

  const handleModelChange = useCallback((productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      // Reset vehicle config when model changes
      setQuote(prev => ({
        ...prev,
        vehicle: {
          vehicleId: 0,
          model: product.name,
          variant: product.variant,
          color: '',
          colorId: 0,
          colorHex: '',
          basePrice: 0,
        },
      }));
      setValidationErrors(prev => ({ ...prev, model: '', variant: '', color: '' }));
    }
  }, [products]);

  const handleColorSelect = useCallback((colorVariant: ColorVariant) => {
    if (selectedProduct) {
      setQuote(prev => ({
        ...prev,
        vehicle: {
          vehicleId: colorVariant.vehicleId,
          model: selectedProduct.name,
          variant: selectedProduct.variant,
          color: colorVariant.color,
          colorId: 0, // Will be set from colors array if needed
          colorHex: colorVariant.colorHex,
          imageUrl: colorVariant.imageUrl,
          basePrice: colorVariant.finalPrice > 0 ? colorVariant.finalPrice : colorVariant.priceRetail,
        },
      }));
      setValidationErrors(prev => ({ ...prev, color: '' }));
    }
  }, [selectedProduct]);

  // Filter promotions applicable to selected vehicle
  const applicablePromotions = useMemo(() => {
    if (quote.vehicle.vehicleId === 0) {
      return promotions;
    }
    
    return promotions.filter(promo => 
      promo.vehicleIds.length === 0 || promo.vehicleIds.includes(quote.vehicle.vehicleId)
    );
  }, [promotions, quote.vehicle.vehicleId]);

  const handlePromotionToggle = useCallback((promoId: number) => {
    setQuote(prev => ({
      ...prev,
      promotions: prev.promotions.includes(promoId)
        ? prev.promotions.filter(p => p !== promoId)
        : [...prev.promotions, promoId],
    }));
  }, []);

  // Handle service toggle
  const handleServiceToggle = useCallback((service: ServiceItem) => {
    setQuote(prev => ({
      ...prev,
      addedServices: prev.addedServices.some(s => s.id === service.id)
        ? prev.addedServices.filter(s => s.id !== service.id)
        : [...prev.addedServices, service],
    }));
  }, []);

  // Toggle section expansion
  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  // Handle down payment percentage change
  const handleDownPaymentPercentChange = useCallback((percent: number) => {
    const clampedPercent = Math.max(MIN_DOWN_PAYMENT_PERCENT, Math.min(MAX_DOWN_PAYMENT_PERCENT, percent));
    setDownPaymentPercent(clampedPercent);
    // Calculate based on subtotal (after promotions, before registration fee)
    const amount = Math.round((costSummary.subtotal * clampedPercent) / 100);
    setQuote(prev => ({
      ...prev,
      payment: { ...prev.payment, downPayment: amount }
    }));
  }, [costSummary.subtotal]);

  const validateQuote = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    // Validate customer fields
    if (!quote.customer?.name || quote.customer.name.trim() === '') {
      errors.name = 'Vui lòng nhập tên khách hàng';
    }

    if (!quote.customer?.phone || quote.customer.phone.trim() === '') {
      errors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9]{10,11}$/.test(quote.customer.phone.replace(/\s/g, ''))) {
      errors.phone = 'Số điện thoại không hợp lệ';
    }

    if (!quote.customer?.email || quote.customer.email.trim() === '') {
      errors.email = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(quote.customer.email)) {
      errors.email = 'Email không hợp lệ';
    }

    if (!quote.customer?.address || quote.customer.address.trim() === '') {
      errors.address = 'Vui lòng nhập địa chỉ';
    }

    if (!quote.vehicle.model) {
      errors.model = 'Vui lòng chọn mẫu xe';
    }

    if (!quote.vehicle.variant) {
      errors.variant = 'Vui lòng chọn phiên bản';
    }

    if (!quote.vehicle.color) {
      errors.color = 'Vui lòng chọn màu sắc';
    }

    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      // Scroll to first error
      const firstError = document.querySelector('.validation-error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }

    return true;
  }, [quote]);

  const handleSave = useCallback(async (action: 'draft' | 'send') => {
    // Validate for send action
    if (action === 'send' && !validateQuote()) {
      return;
    }

    // For draft, only require customer basic info
    if (action === 'draft' && (!quote.customer?.name || !quote.customer?.phone)) {
      setValidationErrors({ 
        name: !quote.customer?.name ? 'Cần có tên để lưu nháp' : '',
        phone: !quote.customer?.phone ? 'Cần có SĐT để lưu nháp' : ''
      });
      return;
    }

    setIsSaving(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const message = action === 'draft' 
        ? 'Đã lưu nháp báo giá thành công!' 
        : 'Đã tạo và gửi báo giá thành công!';
      
      setSuccessMessage(message);
      setShowSuccessModal(true);
      
      // Auto close modal and redirect after 2 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
        navigate('/quotes');
      }, 2000);
    } catch (error) {
      alert('Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setIsSaving(false);
    }
  }, [quote, validateQuote, navigate]);

  const handleBack = useCallback(() => {
    if (window.confirm('Bạn có chắc muốn quay lại? Các thay đổi chưa lưu sẽ bị mất.')) {
      navigate('/quotes');
    }
  }, [navigate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // ============================================
  // RENDER JSX
  // ============================================

  // Check if user is logged in
  const userStr = localStorage.getItem('e-drive-user');
  const isAuthenticated = userStr && userStr !== '{}' && userStr !== 'null';

  if (!isAuthenticated) {
    return (
      <div className="create-quote-page">
        <div className="auth-required">
          <div className="auth-required-content">
            <i className="fas fa-lock"></i>
            <h2>Yêu Cầu Đăng Nhập</h2>
            <p>Vui lòng đăng nhập để tạo báo giá</p>
            <button className="btn-primary" onClick={() => navigate('/login')}>
              <i className="fas fa-sign-in-alt"></i>
              Đăng Nhập
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-quote-page">
      {/* Header */}
      <div className="page-header">
        <button className="btn-back" onClick={handleBack} disabled={isSaving}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <div className="header-content">
          <h2>
            <i className="fas fa-file-invoice"></i>
            Tạo Báo Giá Mới
          </h2>
          <p>Tạo báo giá chi tiết cho khách hàng</p>
        </div>
        <div className="page-actions">
          <button
            className="btn-secondary"
            onClick={() => handleSave('draft')}
            disabled={isSaving}
          >
            <i className="fas fa-save"></i>
            Lưu Nháp
          </button>
          <button
            className="btn-primary"
            onClick={() => handleSave('send')}
            disabled={isSaving || !quote.customer || !quote.vehicle.model}
          >
            {isSaving ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Đang xử lý...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane"></i>
                Tạo & Gửi Báo Giá
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="quote-content-layout">
        {/* Left Column - Form */}
        <div className="form-column">
          {/* Card 1: Customer */}
          <div className="card">
            <div 
              className={`card-header accordion-header ${expandedSections.customer ? 'expanded' : ''}`}
              onClick={() => toggleSection('customer')}
            >
              <div className="header-left">
                <i className="fas fa-user-circle"></i>
                <h4>Thông Tin Khách Hàng</h4>
              </div>
              <i className={`fas fa-chevron-${expandedSections.customer ? 'up' : 'down'} toggle-icon`}></i>
            </div>
            <div className={`card-body accordion-body ${expandedSections.customer ? 'expanded' : 'collapsed'}`}>
              <div className="customer-form">
                <div className="detail-row">
                  <div className="detail-item">
                    <label>Tên khách hàng <span className="required">*</span></label>
                    {validationErrors.name && (
                      <div className="validation-error">
                        <i className="fas fa-exclamation-circle"></i>
                        {validationErrors.name}
                      </div>
                    )}
                    <input
                      type="text"
                      className={`form-input ${validationErrors.name ? 'error' : ''}`}
                      placeholder="Nhập họ tên đầy đủ"
                      value={quote.customer?.name || ''}
                      onChange={(e) => handleCustomerInputChange('name', e.target.value)}
                    />
                  </div>
                  <div className="detail-item">
                    <label>Số điện thoại <span className="required">*</span></label>
                    {validationErrors.phone && (
                      <div className="validation-error">
                        <i className="fas fa-exclamation-circle"></i>
                        {validationErrors.phone}
                      </div>
                    )}
                    <input
                      type="tel"
                      className={`form-input ${validationErrors.phone ? 'error' : ''}`}
                      placeholder="Nhập số điện thoại"
                      value={quote.customer?.phone || ''}
                      onChange={(e) => handleCustomerInputChange('phone', e.target.value)}
                    />
                  </div>
                </div>

                <div className="detail-row">
                  <div className="detail-item">
                    <label>Email <span className="required">*</span></label>
                    {validationErrors.email && (
                      <div className="validation-error">
                        <i className="fas fa-exclamation-circle"></i>
                        {validationErrors.email}
                      </div>
                    )}
                    <input
                      type="email"
                      className={`form-input ${validationErrors.email ? 'error' : ''}`}
                      placeholder="Nhập địa chỉ email"
                      value={quote.customer?.email || ''}
                      onChange={(e) => handleCustomerInputChange('email', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Địa chỉ <span className="required">*</span></label>
                  {validationErrors.address && (
                    <div className="validation-error">
                      <i className="fas fa-exclamation-circle"></i>
                      {validationErrors.address}
                    </div>
                  )}
                  <textarea
                    className={`form-textarea ${validationErrors.address ? 'error' : ''}`}
                    rows={2}
                    placeholder="Nhập địa chỉ đầy đủ"
                    value={quote.customer?.address || ''}
                    onChange={(e) => handleCustomerInputChange('address', e.target.value)}
                  />
                </div>

                {/* ID Card Upload */}
                <div className="id-card-section">
                  <label className="section-label">
                    <i className="fas fa-id-card"></i>
                    CCCD/CMND (2 mặt)
                  </label>
                  <div className="id-card-grid">
                    {/* Front Side */}
                    <div className="id-card-upload">
                      <input
                        type="file"
                        ref={fileInputFrontRef}
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload('front', file);
                        }}
                        style={{ display: 'none' }}
                      />
                      {idCardFrontPreview ? (
                        <div className="image-preview">
                          <img src={idCardFrontPreview} alt="CCCD mặt trước" />
                          <button
                            type="button"
                            className="remove-image-btn"
                            onClick={() => handleRemoveImage('front')}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                          <div className="image-label">Mặt trước</div>
                        </div>
                      ) : (
                        <div
                          className="upload-placeholder"
                          onClick={() => fileInputFrontRef.current?.click()}
                        >
                          <i className="fas fa-cloud-upload-alt"></i>
                          <span>Tải ảnh mặt trước</span>
                          <small>Kéo thả hoặc click để chọn</small>
                        </div>
                      )}
                    </div>

                    {/* Back Side */}
                    <div className="id-card-upload">
                      <input
                        type="file"
                        ref={fileInputBackRef}
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload('back', file);
                        }}
                        style={{ display: 'none' }}
                      />
                      {idCardBackPreview ? (
                        <div className="image-preview">
                          <img src={idCardBackPreview} alt="CCCD mặt sau" />
                          <button
                            type="button"
                            className="remove-image-btn"
                            onClick={() => handleRemoveImage('back')}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                          <div className="image-label">Mặt sau</div>
                        </div>
                      ) : (
                        <div
                          className="upload-placeholder"
                          onClick={() => fileInputBackRef.current?.click()}
                        >
                          <i className="fas fa-cloud-upload-alt"></i>
                          <span>Tải ảnh mặt sau</span>
                          <small>Kéo thả hoặc click để chọn</small>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Vehicle Configuration */}
          <div className="card">
            <div 
              className={`card-header accordion-header ${expandedSections.vehicle ? 'expanded' : ''}`}
              onClick={() => toggleSection('vehicle')}
            >
              <div className="header-left">
                <i className="fas fa-car"></i>
                <h4>Cấu Hình Xe</h4>
              </div>
              <i className={`fas fa-chevron-${expandedSections.vehicle ? 'up' : 'down'} toggle-icon`}></i>
            </div>
            <div className={`card-body accordion-body ${expandedSections.vehicle ? 'expanded' : 'collapsed'}`}>
              {loading ? (
                <div className="loading-state">
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', color: '#ff4d30' }}></i>
                  <p>Đang tải dữ liệu xe...</p>
                </div>
              ) : error ? (
                <div className="error-state">
                  <i className="fas fa-exclamation-triangle" style={{ fontSize: '32px', color: '#ef4444' }}></i>
                  <p>{error}</p>
                  <button className="btn-secondary" onClick={() => window.location.reload()}>
                    <i className="fas fa-redo"></i>
                    Thử lại
                  </button>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label>Mẫu xe <span className="required">*</span></label>
                    {validationErrors.model && (
                      <div className="validation-error">
                        <i className="fas fa-exclamation-circle"></i>
                        {validationErrors.model}
                      </div>
                    )}
                    <select
                      className={`form-select ${validationErrors.model ? 'error' : ''}`}
                      value={selectedProduct?.id || ''}
                      onChange={(e) => handleModelChange(e.target.value)}
                    >
                      <option value="">Chọn mẫu xe</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} - {formatCurrency(product.price)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedProduct && selectedProduct.colorVariants && selectedProduct.colorVariants.length > 0 && (
                    <>
                      <div className="form-group">
                        <label>Chọn màu sắc <span className="required">*</span></label>
                        {validationErrors.color && (
                          <div className="validation-error">
                            <i className="fas fa-exclamation-circle"></i>
                            {validationErrors.color}
                          </div>
                        )}
                        <div className="color-swatches">
                          {selectedProduct.colorVariants.map(colorVariant => (
                            <div
                              key={colorVariant.vehicleId}
                              className={`color-swatch ${quote.vehicle.vehicleId === colorVariant.vehicleId ? 'selected' : ''} ${!colorVariant.inStock ? 'out-of-stock' : ''}`}
                              onClick={() => colorVariant.inStock && handleColorSelect(colorVariant)}
                            >
                              <div
                                className="color-circle"
                                style={{ background: colorVariant.colorGradient || colorVariant.colorHex }}
                              >
                                {quote.vehicle.vehicleId === colorVariant.vehicleId && (
                                  <i className="fas fa-check"></i>
                                )}
                                {!colorVariant.inStock && (
                                  <div className="stock-badge">Hết hàng</div>
                                )}
                              </div>
                              <span className="color-name">{colorVariant.color}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {quote.vehicle.vehicleId > 0 && (
                        <div className="vehicle-preview">
                          <div className="preview-image">
                            {quote.vehicle.imageUrl ? (
                              <img src={quote.vehicle.imageUrl} alt={quote.vehicle.model} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                            ) : (
                              <i className="fas fa-car" style={{ fontSize: '64px', color: quote.vehicle.colorHex }}></i>
                            )}
                          </div>
                          <div className="preview-info">
                            <h5>{quote.vehicle.model}</h5>
                            <p className="preview-color">
                              Màu: {quote.vehicle.color}
                            </p>
                            <p className="preview-price">{formatCurrency(quote.vehicle.basePrice)}</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Card 3: Promotions (API Only) */}
          <div className="card">
            <div 
              className={`card-header accordion-header ${expandedSections.promotions ? 'expanded' : ''}`}
              onClick={() => toggleSection('promotions')}
            >
              <div className="header-left">
                <i className="fas fa-gift"></i>
                <h4>Khuyến Mãi</h4>
              </div>
              <i className={`fas fa-chevron-${expandedSections.promotions ? 'up' : 'down'} toggle-icon`}></i>
            </div>

            <div className={`card-body accordion-body ${expandedSections.promotions ? 'expanded' : 'collapsed'}`}>
              {loadingPromotions ? (
                <div className="promotions-loading">
                  <div className="spinner"></div>
                  <p>Đang tải khuyến mãi...</p>
                </div>
              ) : quote.vehicle.vehicleId === 0 ? (
                <div className="no-promotions">
                  <i className="fas fa-car"></i>
                  <p>Vui lòng chọn xe để xem các khuyến mãi áp dụng</p>
                </div>
              ) : applicablePromotions.length > 0 ? (
                <div className="promotion-section">
                  <div className="promotion-info">
                    <i className="fas fa-info-circle"></i>
                    <span>Các khuyến mãi áp dụng cho <strong>{quote.vehicle.model}</strong></span>
                  </div>
                  <div className="promotion-cards">
                    {applicablePromotions.map(promo => {
                      // Check if promotion is expiring soon (within 7 days)
                      const endDate = new Date(promo.endDate);
                      const today = new Date();
                      const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
                      const isExpiringSoon = daysUntilExpiry <= 7 && daysUntilExpiry > 0;
                      
                      const isSelected = quote.promotions.includes(promo.promoId);

                      return (
                        <div
                          key={promo.promoId}
                          className={`promotion-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => handlePromotionToggle(promo.promoId)}
                        >
                          <div className="promo-checkbox">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                            />
                          </div>
                          <div className="promo-content">
                            <div className="promo-header">
                              <h5 className="promo-title">{promo.title}</h5>
                              <div className="promo-badges">
                                {promo.discountType === 'PERCENTAGE' ? (
                                  <span className="badge badge-percentage">
                                    -{promo.discountValue}%
                                  </span>
                                ) : (
                                  <span className="badge badge-amount">
                                    -{formatCurrency(promo.discountValue)}
                                  </span>
                                )}
                                {isExpiringSoon && (
                                  <span className="badge badge-warning">
                                    <i className="fas fa-clock"></i> Còn {daysUntilExpiry} ngày
                                  </span>
                                )}
                              </div>
                            </div>
                            {promo.description && (
                              <p className="promo-description">{promo.description}</p>
                            )}
                            <div className="promo-footer">
                              <span className="promo-dates">
                                <i className="far fa-calendar"></i> 
                                {new Date(promo.startDate).toLocaleDateString('vi-VN')} - {new Date(promo.endDate).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="no-promotions">
                  <i className="fas fa-tag"></i>
                  <p>Không có khuyến mãi cho xe <strong>{quote.vehicle.model}</strong></p>
                  <small>Vui lòng chọn xe khác hoặc liên hệ để biết thêm thông tin</small>
                </div>
              )}
            </div>
          </div>

          {/* Card 3.5: Add-on Services & Accessories */}
          <div className="card">
            <div 
              className={`card-header accordion-header ${expandedSections.services ? 'expanded' : ''}`}
              onClick={() => toggleSection('services')}
            >
              <div className="header-left">
                <i className="fas fa-boxes"></i>
                <h4>Dịch Vụ & Phụ Kiện Cộng Thêm</h4>
                {quote.addedServices.length > 0 && (
                  <span className="service-count-badge">{quote.addedServices.length} đã chọn</span>
                )}
              </div>
              <i className={`fas fa-chevron-${expandedSections.services ? 'up' : 'down'} toggle-icon`}></i>
            </div>
            <div className={`card-body accordion-body ${expandedSections.services ? 'expanded' : 'collapsed'}`}>
              <div className="service-grid">
                {MOCK_ADDON_SERVICES.map(service => {
                  const isSelected = quote.addedServices.some(s => s.id === service.id);
                  return (
                    <div
                      key={service.id}
                      className={`service-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleServiceToggle(service)}
                    >
                      <div className="service-checkbox">
                        <div className="checkbox-icon">
                          {isSelected ? (
                            <i className="fas fa-check-circle"></i>
                          ) : (
                            <i className="far fa-circle"></i>
                          )}
                        </div>
                      </div>
                      <div className="service-content">
                        <div className="service-icon">
                          <i className={`fas ${service.icon}`}></i>
                        </div>
                        <div className="service-info">
                          <h5 className="service-name">{service.name}</h5>
                          <p className="service-description">{service.description}</p>
                          <div className="service-price">{formatCurrency(service.price)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {quote.addedServices.length === 0 && (
                <div className="service-hint">
                  <i className="fas fa-info-circle"></i>
                  <p>Chọn các dịch vụ và phụ kiện để nâng cao trải nghiệm sử dụng xe</p>
                </div>
              )}
            </div>
          </div>

          {/* Card 4: Payment */}
          <div className="card">
            <div 
              className={`card-header accordion-header ${expandedSections.payment ? 'expanded' : ''}`}
              onClick={() => toggleSection('payment')}
            >
              <div className="header-left">
                <i className="fas fa-credit-card"></i>
                <h4>Hình Thức Thanh Toán</h4>
              </div>
              <i className={`fas fa-chevron-${expandedSections.payment ? 'up' : 'down'} toggle-icon`}></i>
            </div>
            <div className={`card-body accordion-body ${expandedSections.payment ? 'expanded' : 'collapsed'}`}>
              <div className="payment-methods">
                <label className={`radio-card ${quote.payment.method === 'full' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="full"
                    checked={quote.payment.method === 'full'}
                    onChange={() => setQuote(prev => ({ ...prev, payment: { ...prev.payment, method: 'full' } }))}
                  />
                  <div className="radio-content">
                    <i className="fas fa-money-bill-wave"></i>
                    <span>Trả Thẳng</span>
                    <small>Thanh toán 100%</small>
                  </div>
                </label>

                <label className={`radio-card ${quote.payment.method === 'installment' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="installment"
                    checked={quote.payment.method === 'installment'}
                    onChange={() => setQuote(prev => ({ ...prev, payment: { ...prev.payment, method: 'installment' } }))}
                  />
                  <div className="radio-content">
                    <i className="fas fa-calendar-check"></i>
                    <span>Trả Góp</span>
                    <small>Linh hoạt kỳ hạn</small>
                  </div>
                </label>
              </div>

              {quote.payment.method === 'installment' && (
                <div className="installment-options">
                  {/* Down Payment Percentage */}
                  <div className="form-group">
                    <label>
                      Thanh toán trả góp
                      <span className="label-hint">(Tỷ lệ trả trước: {MIN_DOWN_PAYMENT_PERCENT}% - {MAX_DOWN_PAYMENT_PERCENT}%)</span>
                    </label>
                    
                    <div className="payment-input-row">
                      <div className="input-box">
                        <label className="input-label">Tỷ lệ trả trước</label>
                        <div className="input-with-unit-compact">
                          <input
                            type="number"
                            className="form-input percent-input-compact"
                            min={MIN_DOWN_PAYMENT_PERCENT}
                            max={MAX_DOWN_PAYMENT_PERCENT}
                            step={5}
                            value={downPaymentPercent}
                            onChange={(e) => handleDownPaymentPercentChange(Number(e.target.value))}
                          />
                          <span className="input-unit-compact">%</span>
                        </div>
                      </div>
                      
                      <div className="amount-box">
                        <label className="input-label">Số tiền trả trước</label>
                        <div className="amount-value-compact">{formatCurrency(quote.payment.downPayment)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Loan Term */}
                  <div className="form-group">
                    <label>Kỳ hạn vay</label>
                    <div className="loan-term-grid">
                      {LOAN_TERMS.map(term => {
                        const isActive = quote.payment.loanTerm === term;
                        const years = term / 12;
                        const displayText = term < 24 ? `${term} tháng` : `${years} năm`;
                        return (
                          <button
                            key={term}
                            type="button"
                            className={`term-btn ${isActive ? 'active' : ''}`}
                            onClick={() => setQuote(prev => ({
                              ...prev,
                              payment: { ...prev.payment, loanTerm: term }
                            }))}
                          >
                            <i className="fas fa-calendar-check"></i>
                            <span>{displayText}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="installment-summary">
                    <div className="summary-header">
                      <i className="fas fa-calculator"></i>
                      <span>Tóm tắt thanh toán</span>
                    </div>
                    <div className="summary-row">
                      <span>
                        <i className="fas fa-money-bill-wave"></i>
                        Số tiền vay
                      </span>
                      <strong>{formatCurrency(costSummary.finalTotal - quote.payment.downPayment)}</strong>
                    </div>
                    <div className="summary-row">
                      <span>
                        <i className="fas fa-percent"></i>
                        Lãi suất 
                      </span>
                      <strong className="rate-text">Theo quy định của Ngân hàng tại thời điểm giải ngân</strong>
                    </div>
                    
                    <div className="summary-row total-all">
                      <span>
                        <i className="fas fa-calculator"></i>
                        Tổng thanh toán dự tính (Chưa gồm lãi suất)
                      </span>
                      <strong className="grand-total">{formatCurrency(costSummary.totalPayment || 0)}</strong>
                    </div>
                    <div className="summary-row highlight">
                      <span>
                        <i className="fas fa-hand-holding-dollar"></i>
                        Trả hàng tháng
                      </span>
                      <strong className="amount">{formatCurrency(costSummary.monthlyPayment)}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 5: Additional Info */}
          <div className="card">
            <div 
              className={`card-header accordion-header ${expandedSections.notes ? 'expanded' : ''}`}
              onClick={() => toggleSection('notes')}
            >
              <div className="header-left">
                <i className="fas fa-info-circle"></i>
                <h4>Thông Tin Bổ Sung</h4>
              </div>
              <i className={`fas fa-chevron-${expandedSections.notes ? 'up' : 'down'} toggle-icon`}></i>
            </div>
            <div className={`card-body accordion-body ${expandedSections.notes ? 'expanded' : 'collapsed'}`}>
              <div className="form-group">
                <label>Ghi chú</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="Nhập ghi chú về báo giá..."
                  value={quote.notes}
                  onChange={(e) => setQuote(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Preview */}
        <div className="preview-column">
          {/* PDF Preview */}
          <div className="card pdf-preview">
            <div className="card-header">
              <i className="fas fa-file-pdf"></i>
              <h4>Bản Xem Trước</h4>
            </div>
            <div className="card-body">
              <div className="preview-document">
                {/* Header */}
                <div className="preview-header">
                  <div className="preview-logo">
                    <i className="fas fa-bolt-lightning"></i>
                    <span className="logo-text">E-DRIVE</span>
                  </div>
                  <h3 className="preview-title">BÁO GIÁ XE ĐIỆN</h3>
                </div>

                {/* Customer Info */}
                <div className="preview-section customer-info">
                  <h4>THÔNG TIN KHÁCH HÀNG</h4>
                  <div className="info-grid">
                    <span>Khách hàng:</span>
                    <span>{quote.customer?.name || 'Chưa nhập'}</span>
                    <span>Điện thoại:</span>
                    <span>{quote.customer?.phone || 'Chưa nhập'}</span>
                    <span>Email:</span>
                    <span>{quote.customer?.email || 'Chưa nhập'}</span>
                    <span>Ngày báo giá:</span>
                    <span>{new Date().toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>

                {/* Vehicle Info */}
                <div className="preview-section vehicle-info">
                  <h4>THÔNG TIN XE</h4>
                  <div className="info-grid">
                    <span>Model:</span>
                    <span>{quote.vehicle.model || 'Chưa chọn'}</span>
                    <span>Phiên bản:</span>
                    <span>{quote.vehicle.variant || 'Chưa chọn'}</span>
                    <span>Màu sắc:</span>
                    <span>{quote.vehicle.color || 'Chưa chọn'}</span>
                  </div>
                </div>

                {/* Pricing */}
                <div className="preview-section price-summary">
                  <h4>CHI TIẾT GIÁ</h4>
                  <div className="price-lines">
                    <div className="line-item">
                      <span>Giá niêm yết:</span>
                      <span>{formatCurrency(costSummary.listPrice)}</span>
                    </div>
                    
                    {costSummary.promoDiscount > 0 && (
                      <div className="line-item discount">
                        <span>Giảm giá khuyến mãi ({quote.promotions.length}):</span>
                        <span>-{formatCurrency(costSummary.promoDiscount)}</span>
                      </div>
                    )}
                    
                    {quote.addedServices.length > 0 && (
                      <>
                        <div className="service-section-header">
                          <span>Dịch vụ cộng thêm ({quote.addedServices.length}):</span>
                        </div>
                        {quote.addedServices.map((service) => (
                          <div key={service.id} className="line-item service-detail">
                            <span>• {service.name}</span>
                            <span>+{formatCurrency(service.price)}</span>
                          </div>
                        ))}
                        <div className="line-item service-total">
                          <span>Tổng dịch vụ:</span>
                          <span>+{formatCurrency(costSummary.totalServiceCost)}</span>
                        </div>
                      </>
                    )}

                    <hr className="line-divider" />
                    
                    <div className="line-item sub-total">
                      <strong>TỔNG CỘNG (Chưa lăn bánh):</strong>
                      <strong>{formatCurrency(costSummary.subTotal)}</strong>
                    </div>

                    {costSummary.onRoadFee > 0 && (
                      <div className="line-item on-road-fee">
                        <span>Phí lăn bánh (tạm tính):</span>
                        <span>{formatCurrency(costSummary.onRoadFee)}</span>
                      </div>
                    )}

                    <hr className="line-divider" />

                    <div className="line-item final-total">
                      <strong>TỔNG GIÁ (TẠM TÍNH):</strong>
                      <strong>{formatCurrency(costSummary.finalOnRoadTotal)}</strong>
                    </div>
                  </div>
                  
                  <div className="price-note">
                    <i className="fas fa-info-circle"></i>
                    <span>Phí lăn bánh bao gồm: Trước bạ, đăng ký, đăng kiểm, biển số, bảo hiểm</span>
                  </div>
                </div>

                {/* Installment Info */}
                {quote.payment.method === 'installment' && quote.payment.downPayment > 0 && (
                  <div className="preview-section installment-info">
                    <h4>THÔNG TIN TRẢ GÓP</h4>
                    <div className="installment-grid">
                      <div className="installment-item">
                        <span className="label">Trả trước:</span>
                        <span className="value">{formatCurrency(quote.payment.downPayment)}</span>
                      </div>
                      <div className="installment-item">
                        <span className="label">Số tiền vay:</span>
                        <span className="value">{formatCurrency(costSummary.finalOnRoadTotal - quote.payment.downPayment)}</span>
                      </div>
                      <div className="installment-item">
                        <span className="label">Kỳ hạn:</span>
                        <span className="value">{quote.payment.loanTerm} tháng</span>
                      </div>
                      <div className="installment-item">
                        <span className="label">Lãi suất:</span>
                        <span className="value">Theo quy định của Ngân hàng</span>
                      </div>
                      <div className="installment-item highlight">
                        <span className="label">Trả hàng tháng (dự tính):</span>
                        <span className="value">{formatCurrency(costSummary.monthlyPayment)}</span>
                      </div>
                    </div>
                    <div className="installment-note">
                      <i className="fas fa-exclamation-triangle"></i>
                      <span>Số tiền trả góp hàng tháng là ước tính, chưa bao gồm lãi suất. Lãi suất thực tế sẽ do ngân hàng quyết định tại thời điểm giải ngân.</span>
                    </div>
                  </div>
                )}

                {/* Customer Notes */}
                {quote.notes && quote.notes.trim() !== '' && (
                  <div className="preview-section customer-notes">
                    <h4>GHI CHÚ</h4>
                    <div className="notes-content">
                      <i className="fas fa-sticky-note"></i>
                      <p>{quote.notes}</p>
                    </div>
                  </div>
                )}

                {/* Terms & Conditions */}
                <div className="preview-terms-section">
                  <div className="terms-header">
                    <i className="fas fa-file-contract"></i>
                    <h6 className="terms-title">Điều Khoản & Điều Kiện</h6>
                  </div>
                  <ol className="terms-list">
                    {QUOTATION_TERMS.map((term, index) => (
                      <li key={index}>
                        <span className="term-number"></span>
                        <span className="term-text">{term}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="terms-note">
                    <i className="fas fa-info-circle"></i>
                    <span>Vui lòng đọc kỹ các điều khoản trước khi quyết định mua xe.</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="preview-footer">
                  <p>Trân trọng cảm ơn quý khách!</p>
                  <p className="company-info">E-DRIVE - Giải pháp xe điện thông minh</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="success-modal" onClick={(e) => e.stopPropagation()}>
            <div className="success-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <h3>Thành công!</h3>
            <p>{successMessage}</p>
            <div className="modal-loader">
              <div className="loader-bar"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateQuotePage;
