import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../utils/authUtils';
import { fetchVehiclesFromApi, groupVehiclesByModel } from '../services/vehicleApi';
import { listPromotions } from '../services/promotionsApi';
import { fetchDealers } from '../services/dealerApi';
import { createQuotation, mapServicesToBoolean } from '../services/quotationApi';
import { listCustomers } from '../services/customersApi';
import type { Customer } from '../types/customer';
import type { Product, ColorVariant } from '../types/product';
import type { Promotion } from '../types/promotion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import ReactDOM from 'react-dom/client';
import QuotePDFTemplate from '../components/QuotePDFTemplate';
import type { QuotationDetailData } from './QuoteListPage';
import './_CreateQuote.scss';

// ============================================
// TYPESCRIPT INTERFACES
// ============================================

// Customer type imported from customerApi

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

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  icon: string;
  description: string;
  category: 'protection' | 'charging' | 'warranty' | 'accessory';
}

interface QuoteState {
  customerId: number | null; // Changed: Use customerId instead of Customer object
  vehicle: VehicleConfig;
  promotions: number[]; // Array of promoId
  paymentMethod: 'TRẢ_THẲNG'; // Hardcoded - no installment
  notes: string;
  validityDays: 7; // Hardcoded 7 days
  addedServices: ServiceItem[];
}

// ============================================
// CONSTANTS
// ============================================

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
  const location = useLocation();
  const preSelectedProduct = location.state?.product as Product | undefined;
  
  // Check authentication on mount
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      console.warn('⚠️ No user found - redirecting to login');
      alert('Vui lòng đăng nhập để tạo báo giá');
      navigate('/');
    }
  }, [navigate]);
  
  // State Management
  const [quote, setQuote] = useState<QuoteState>({
    customerId: null, // Changed from customer object to customerId
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
    paymentMethod: 'TRẢ_THẲNG', // Hardcoded
    notes: '',
    validityDays: 7, // Hardcoded 7 days
    addedServices: [],
  });
  
  // Customer list state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);

  // Accordion states for sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    customer: !preSelectedProduct, // Collapse if vehicle pre-selected
    vehicle: true, // Always expand vehicle section
    promotions: false,
    services: false,
    notes: false, // Removed payment accordion
  });

  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [createdQuotationId, setCreatedQuotationId] = useState<number | null>(null);

  // API Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loadingPromotions, setLoadingPromotions] = useState(false);
  const [dealerId, setDealerId] = useState<number | null>(null);

  // Fetch dealerId from username (JWT token)
  useEffect(() => {
    const fetchDealerId = async () => {
      try {
        const user = getCurrentUser();
        if (!user) {
          console.warn('⚠️ No user found');
          return;
        }
        
        console.log('👤 Current user:', user.username, '- Role:', user.role);
        
        // Extract dealerId from username pattern (d1_manager, d1_staff, etc.)
        // Pattern: d{dealerId}_{role}
        const usernameMatch = user.username?.match(/^d(\d+)_/);
        if (usernameMatch) {
          const extractedDealerId = parseInt(usernameMatch[1]);
          console.log('✅ Dealer ID extracted from username:', extractedDealerId);
          setDealerId(extractedDealerId);
          return;
        }
        
        // Fallback: Try to fetch from dealers API (may fail with 400 for non-admin users)
        try {
          const dealers = await fetchDealers();
          
          if (dealers.length === 0) {
            console.warn('⚠️ No dealers found from API');
            return;
          }
          
          // Try multiple matching strategies
          let matchedDealer = dealers.find(d => d.dealerEmail === user.email)
            || dealers.find(d => d.dealerName === user.username)
            || (user.sub && dealers.find(d => d.dealerId.toString() === user.sub))
            || null;
          
          if (matchedDealer) {
            console.log('✅ Dealer matched from API:', matchedDealer.dealerId, '-', matchedDealer.dealerName);
            setDealerId(matchedDealer.dealerId);
          } else {
            console.warn('⚠️ No dealer found for user:', user.username);
          }
        } catch (apiError: any) {
          // API call failed (likely 400/403) - use username extraction as fallback
          console.warn('⚠️ Dealers API failed (expected for staff/dealer roles):', apiError.message);
          console.log('💡 Using username pattern extraction as fallback');
        }
      } catch (err: any) {
        console.error('❌ Error fetching dealerId:', err.message);
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
  
  // Fetch customers for dropdown (must have dealerId first)
  useEffect(() => {
    const loadCustomers = async () => {
      if (!dealerId) {
        console.log('⏳ Waiting for dealerId to load customers...');
        return;
      }
      
      try {
        setIsLoadingCustomers(true);
        const response = await listCustomers(dealerId, {});
        console.log('👥 Raw API response:', response);
        
        // Handle different response formats
        const customerData = response.data || response || [];
        setCustomers(Array.isArray(customerData) ? customerData : []);
        console.log('👥 Fetched customers for dealer', dealerId, ':', customerData.length);
      } catch (err) {
        console.error('❌ Error fetching customers:', err);
        setCustomers([]); // Set empty array on error
      } finally {
        setIsLoadingCustomers(false);
      }
    };
    
    loadCustomers();
  }, [dealerId]); // Re-fetch when dealerId changes

  // Auto-select vehicle from navigation state (when clicking "Báo giá" from product page)
  useEffect(() => {
    if (!preSelectedProduct || products.length === 0) return;
    
    console.log('🎯 Auto-selecting product from navigation:', preSelectedProduct.name);
    
    // Find matching product in loaded products
    const matchedProduct = products.find(p => p.id === preSelectedProduct.id);
    if (!matchedProduct) {
      console.warn('⚠️ Pre-selected product not found in loaded products');
      return;
    }
    
    setSelectedProduct(matchedProduct);
    
    // Auto-select color variant if specified
    const selectedColorVariant = matchedProduct.colorVariants?.find(
      cv => cv.color === preSelectedProduct.selectedColor
    ) || matchedProduct.colorVariants?.[0];
    
    if (selectedColorVariant) {
      setQuote(prev => ({
        ...prev,
        vehicle: {
          vehicleId: selectedColorVariant.vehicleId,
          model: matchedProduct.name,
          variant: matchedProduct.variant,
          color: selectedColorVariant.color,
          colorId: selectedColorVariant.vehicleId, // Use vehicleId as colorId
          colorHex: selectedColorVariant.colorHex,
          imageUrl: selectedColorVariant.imageUrl || matchedProduct.image,
          basePrice: selectedColorVariant.finalPrice > 0 
            ? selectedColorVariant.finalPrice 
            : selectedColorVariant.priceRetail,
        },
      }));
      
      console.log('✅ Vehicle auto-selected:', {
        model: matchedProduct.name,
        color: selectedColorVariant.color,
        price: selectedColorVariant.finalPrice || selectedColorVariant.priceRetail
      });
      
      // Show success notification
      setSuccessMessage(`🚗 Đã chọn xe: ${matchedProduct.name} - Màu ${selectedColorVariant.color}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  }, [preSelectedProduct, products]);

  // Fetch promotions based on dealerId (fetched from dealers API)
  useEffect(() => {
    if (!dealerId) {
      console.log('⏳ Waiting for dealerId...');
      return;
    }
    
    console.log('🚀 useEffect: Starting promotions fetch...');
    console.log('🔑 Current dealerId:', dealerId);
    
    // Log current user info for debugging
    const user = getCurrentUser();
    if (user) {
      console.log('👤 Fetching promotions as:', user.username, '- Role:', user.role);
    }
    
    const fetchPromotionsData = async () => {
      try {
        setLoadingPromotions(true);
        
        console.log('🎁 Fetching promotions for dealer:', dealerId);
        const response = await listPromotions(dealerId);
        console.log('📦 Raw API Response:', response);
        
        // listPromotions returns { items: [], total: 0 }
        const items = response?.items || [];
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

    // Calculate total service cost
    const totalServiceCost = quote.addedServices.reduce((sum, item) => sum + item.price, 0);
    
    // Tính toán theo đúng logic thuế:
    // 1. Tạm tính (chưa VAT) = basePrice + services - discount
    // 2. VAT = Tạm tính × 10%
    // 3. Grand Total = Tạm tính + VAT
    const taxableAmount = listPrice + totalServiceCost - promoDiscount;
    const vatAmount = taxableAmount * 0.1;
    const grandTotal = taxableAmount + vatAmount;
    const depositRequired = grandTotal * 0.1; // Đặt cọc 10%

    return {
      listPrice,
      promoDiscount,
      totalServiceCost,
      taxableAmount,
      vatAmount,
      grandTotal,
      depositRequired,
    };
  }, [quote, promotions]);

  // Display Data - Dùng trực tiếp costSummary với thêm promotion name và percent
  const displayData = useMemo(() => {
    // Thêm promotion name và discount percent
    let promotionName = 'Khuyến mãi';
    let discountPercent: number | undefined = undefined;
    
    if (costSummary.promoDiscount > 0 && quote.promotions.length > 0) {
      const promo = promotions.find(p => quote.promotions.includes(p.promoId));
      if (promo) {
        promotionName = promo.title;
        if (promo.discountType === 'PERCENTAGE') {
          discountPercent = promo.discountValue;
        }
      }
    }
    
    return {
      ...costSummary,
      promotionName,
      discountPercent,
    };
  }, [costSummary, quote.promotions, promotions]);

  // Event Handlers
  const handleCustomerInputChange = useCallback((customerId: number) => {
    setQuote(prev => ({
      ...prev,
      customerId,
    }));
    setValidationErrors(prev => ({ ...prev, customer: '' }));
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

  const validateQuote = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    // Validate customer selection
    if (!quote.customerId) {
      errors.customer = 'Vui lòng chọn khách hàng';
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
    // Validate quote
    if (!validateQuote()) {
      return;
    }

    // Check dealerId
    if (!dealerId) {
      alert('Không tìm thấy thông tin dealer. Vui lòng đăng nhập lại.');
      return;
    }

    setIsSaving(true);
    
    try {
      // Prepare the request data
      const request = {
        vehicleId: quote.vehicle.vehicleId,
        customerId: quote.customerId!,
        paymentMethod: 'TRẢ_THẲNG' as const,
        additionalServices: mapServicesToBoolean(quote.addedServices.map(s => s.id)),
      };
      
      // Call the API
      const response = await createQuotation(request);
      
      console.log('✅ Quotation created:', response);
      
      // Lưu quotationId để có thể tạo PDF
      setCreatedQuotationId(response.quotationId);
      
      const message = action === 'draft' 
        ? 'Đã lưu nháp báo giá thành công!' 
        : 'Đã tạo và gửi báo giá thành công!';
      
      setSuccessMessage(message);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('❌ Error creating quotation:', error);
      alert('Có lỗi xảy ra khi tạo báo giá. Vui lòng thử lại!');
    } finally {
      setIsSaving(false);
    }
  }, [quote, validateQuote, navigate, dealerId]);

  const handleGeneratePDF = useCallback(async () => {
    if (!createdQuotationId) {
      alert('Không tìm thấy ID báo giá!');
      return;
    }

    try {
      console.log('📝 Generating PDF from current form data...');
      
      // Tìm thông tin customer
      const selectedCustomer = customers.find(c => c.customerId === quote.customerId);
      
      // Tạo dữ liệu PDF trực tiếp từ form và displayData
      const pdfData: QuotationDetailData = {
        quotationId: createdQuotationId,
        dealerId: dealerId || 0,
        quotationNumber: `QUOTE-${createdQuotationId}`,
        quotationDate: new Date().toISOString(),
        status: 'pending',
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        
        // Customer info từ form
        customerId: quote.customerId!,
        customerName: selectedCustomer?.fullName || 'N/A',
        customerPhone: selectedCustomer?.phone || 'N/A',
        customerEmail: selectedCustomer?.email || 'N/A',
        customerAddress: selectedCustomer?.address || 'N/A',
        
        // Vehicle info từ form
        vehicleId: quote.vehicle.vehicleId,
        vehicleName: `${quote.vehicle.model} ${quote.vehicle.variant}`,
        vehicleModel: quote.vehicle.model,
        vehicleVersion: quote.vehicle.variant,
        vehicleColor: quote.vehicle.color,
        vehicleYear: new Date().getFullYear(),
        paymentMethod: 'TRẢ_THẲNG',
        
        // Pricing từ displayData (đã tính toán chính xác)
        basePrice: displayData.listPrice,
        quantity: 1,
        subtotal: displayData.listPrice,
        
        // Services từ form
        additionalServices: {
          hasTintFilm: quote.addedServices.some(s => s.id === 'tint-film'),
          hasWallboxCharger: quote.addedServices.some(s => s.id === 'wallbox-7kw'),
          hasWarrantyExtension: quote.addedServices.some(s => s.id === 'extended-warranty'),
          hasPPF: quote.addedServices.some(s => s.id === 'ppf-full'),
          hasCeramicCoating: quote.addedServices.some(s => s.id === 'ceramic-coating'),
          has360Camera: quote.addedServices.some(s => s.id === 'dashcam-360'),
        },
        tintFilmPrice: quote.addedServices.find(s => s.id === 'tint-film')?.price || 0,
        wallboxChargerPrice: quote.addedServices.find(s => s.id === 'wallbox-7kw')?.price || 0,
        warrantyExtensionPrice: quote.addedServices.find(s => s.id === 'extended-warranty')?.price || 0,
        ppfPrice: quote.addedServices.find(s => s.id === 'ppf-full')?.price || 0,
        ceramicCoatingPrice: quote.addedServices.find(s => s.id === 'ceramic-coating')?.price || 0,
        camera360Price: quote.addedServices.find(s => s.id === 'dashcam-360')?.price || 0,
        servicesTotal: displayData.totalServiceCost,
        
        // Discount & Total từ displayData
        promotionDiscount: displayData.promoDiscount,
        promotionName: displayData.promotionName,
        discountPercent: displayData.discountPercent,
        
        // VAT calculation từ displayData
        taxableAmount: displayData.taxableAmount,
        vatRate: 10,
        vatAmount: displayData.vatAmount,
        grandTotal: displayData.grandTotal,
        depositRequired: displayData.depositRequired,
        
        // Notes
        notes: quote.notes,
        
        // Terms & Conditions
        termsAndConditions: QUOTATION_TERMS.join('\n'),
        
        // Dealer info
        dealerName: 'VinFast E-Drive',
        dealerPhone: '1900 23 23 89',
        dealerEmail: 'contact@vinfastedrive.vn',
        dealerAddress: '458 Minh Khai, Hai Bà Trưng, Hà Nội',
      };
      
      console.log('📊 PDF Data:', pdfData);
      
      console.log('📝 Starting PDF generation...');
      
      // Tạo container ẩn cho PDF template
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      document.body.appendChild(tempDiv);
      
      // Render React component vào container
      const root = ReactDOM.createRoot(tempDiv);
      root.render(<QuotePDFTemplate data={pdfData} />);
      
      // Đợi 500ms để component render xong
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const pdfElement = document.getElementById('pdf-content');
      if (!pdfElement) {
        throw new Error('Không tìm thấy PDF template element');
      }
      
      console.log('📸 Capturing PDF content as image...');
      
      // Capture HTML thành canvas
      const canvas = await html2canvas(pdfElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794,
      });
      
      console.log('📝 Creating multi-page PDF...');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = 210;
      const pageHeight = 297;
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      const totalPages = Math.ceil(imgHeight / pageHeight);
      
      for (let i = 0; i < totalPages; i++) {
        if (i > 0) pdf.addPage();
        
        const pageCanvas = document.createElement('canvas');
        const pageCtx = pageCanvas.getContext('2d');
        if (!pageCtx) continue;
        
        const scale = canvas.width / imgWidth;
        pageCanvas.width = canvas.width;
        pageCanvas.height = Math.min(pageHeight * scale, canvas.height - i * pageHeight * scale);
        
        pageCtx.drawImage(
          canvas,
          0,
          i * pageHeight * scale,
          canvas.width,
          pageCanvas.height,
          0,
          0,
          canvas.width,
          pageCanvas.height
        );
        
        const pageImgData = pageCanvas.toDataURL('image/png');
        const actualHeight = Math.min(pageHeight, imgHeight - i * pageHeight);
        pdf.addImage(pageImgData, 'PNG', 0, 0, imgWidth, actualHeight);
      }
      
      document.body.removeChild(tempDiv);
      
      const fileName = `BaoGia_${pdfData.quotationNumber}_${pdfData.customerName?.replace(/\s+/g, '_') || 'KhachHang'}.pdf`;
      pdf.save(fileName);
      
      console.log(`✅ PDF generated: ${fileName}`);
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      alert('Có lỗi xảy ra khi tạo PDF!');
    }
  }, [createdQuotationId, dealerId, quote, displayData, customers]);

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
  const user = getCurrentUser();
  const isAuthenticated = !!user;

  if (!isAuthenticated) {
    return (
      <div className="create-quote-page">
        <div className="auth-required">
          <div className="auth-required-content">
            <i className="fas fa-lock"></i>
            <h2>Yêu Cầu Đăng Nhập</h2>
            <p>Vui lòng đăng nhập để tạo báo giá</p>
            <button className="btn-primary" onClick={() => navigate('/')}>
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
            disabled={isSaving || !quote.customerId || !quote.vehicle.model}
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
                  <div className="detail-item" style={{ width: '100%' }}>
                    <label>Chọn khách hàng <span className="required">*</span></label>
                    {validationErrors.customer && (
                      <div className="validation-error">
                        <i className="fas fa-exclamation-circle"></i>
                        {validationErrors.customer}
                      </div>
                    )}
                    {isLoadingCustomers ? (
                      <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
                        <i className="fas fa-spinner fa-spin"></i> Đang tải danh sách khách hàng...
                      </div>
                    ) : (
                      <select
                        className={`form-input ${validationErrors.customer ? 'error' : ''}`}
                        value={quote.customerId || ''}
                        onChange={(e) => handleCustomerInputChange(Number(e.target.value))}
                        style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
                      >
                        <option value="">-- Chọn khách hàng --</option>
                        {customers && customers.length > 0 ? (
                          customers.map(customer => (
                            <option key={customer.customerId} value={customer.customerId}>
                              {customer.fullName} - {customer.phone} ({customer.email})
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>Không có khách hàng nào</option>
                        )}
                      </select>
                    )}
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

          {/* Card 4: Additional Info */}
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
                    <i className="fas fa-car-side"></i>
                    <div className="logo-text">
                      <h1>VinFast E-Drive</h1>
                      <p>Đại lý ủy quyền chính thức</p>
                    </div>
                  </div>
                  <div className="preview-company-info">
                    <p><strong>VinFast E-Drive</strong></p>
                    <p>458 Minh Khai, Hai Bà Trưng, Hà Nội</p>
                    <p>Điện thoại: 1900 23 23 89</p>
                    <p>Email: contact@vinfastedrive.vn</p>
                  </div>
                </div>

                {/* Title */}
                <div className="preview-title-section">
                  <h2>BÁO GIÁ XE ĐIỆN</h2>
                  <p className="quote-number">Số: {`QUOTE-${new Date().getTime()}`}</p>
                </div>

                {/* Quote Info */}
                <div className="preview-quote-info">
                  <div className="info-row">
                    <span className="label">Ngày báo giá:</span>
                    <span className="value">{new Date().toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Hiệu lực đến:</span>
                    <span className="value">{new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="preview-section customer-info">
                  <h4>
                    <i className="fas fa-user-circle"></i>
                    Thông tin khách hàng
                  </h4>
                  <div className="info-grid">
                    <div className="grid-item">
                      <span className="label">Họ và tên:</span>
                      <span className="value">{customers?.find(c => c.customerId === quote.customerId)?.fullName || 'N/A'}</span>
                    </div>
                    <div className="grid-item">
                      <span className="label">Số điện thoại:</span>
                      <span className="value">{customers?.find(c => c.customerId === quote.customerId)?.phone || 'N/A'}</span>
                    </div>
                    <div className="grid-item">
                      <span className="label">Email:</span>
                      <span className="value">{customers?.find(c => c.customerId === quote.customerId)?.email || 'N/A'}</span>
                    </div>
                    <div className="grid-item">
                      <span className="label">Địa chỉ:</span>
                      <span className="value">{customers?.find(c => c.customerId === quote.customerId)?.address || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Vehicle Info */}
                <div className="preview-section vehicle-info">
                  <h4>
                    <i className="fas fa-car"></i>
                    Thông tin xe
                  </h4>
                  <div className="vehicle-box">
                    <div className="vehicle-name">{quote.vehicle.model || 'N/A'}</div>
                    <div className="vehicle-details">
                      <span><i className="fas fa-palette"></i> Màu sắc: {quote.vehicle.color || 'N/A'}</span>
                      <span><i className="fas fa-calendar"></i> Năm sản xuất: {new Date().getFullYear()}</span>
                      {quote.vehicle.model && <span><i className="fas fa-car-side"></i> Model: {quote.vehicle.model}</span>}
                      {quote.vehicle.variant && <span><i className="fas fa-tag"></i> Phiên bản: {quote.vehicle.variant}</span>}
                    </div>
                    
                    <div className="base-price">
                      <span>Giá niêm yết:</span>
                      <span>{formatCurrency(displayData.listPrice)}</span>
                    </div>
                  </div>
                </div>

                {/* Services */}
                {quote.addedServices.length > 0 && (
                  <div className="preview-section services">
                    <h4>
                      <i className="fas fa-plus-circle"></i>
                      Dịch vụ bổ sung
                    </h4>
                    <table className="services-table">
                      <tbody>
                        {quote.addedServices.map((service) => (
                          <tr key={service.id}>
                            <td>
                              {service.name === 'Dán phim cách nhiệt' && <i className="fas fa-tint"></i>}
                              {service.name === 'Wallbox sạc 7kW' && <i className="fas fa-charging-station"></i>}
                              {service.name === 'Bảo hành mở rộng' && <i className="fas fa-shield-alt"></i>}
                              {service.name === 'Dán PPF toàn xe' && <i className="fas fa-layer-group"></i>}
                              {service.name === 'Phủ Ceramic' && <i className="fas fa-gem"></i>}
                              {service.name === 'Camera 360 độ' && <i className="fas fa-video"></i>}
                              {' '}{service.name}
                            </td>
                            <td className="price">{formatCurrency(service.price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Price Breakdown */}
                <div className="preview-section price-summary">
                  <h4>
                    <i className="fas fa-calculator"></i>
                    Chi tiết giá
                  </h4>
                  <table className="price-table">
                    <tbody>
                      <tr>
                        <td>Giá xe cơ bản</td>
                        <td className="price">{formatCurrency(displayData.listPrice)}</td>
                      </tr>
                      {displayData.totalServiceCost > 0 && (
                        <tr>
                          <td>Tổng dịch vụ bổ sung</td>
                          <td className="price">{formatCurrency(displayData.totalServiceCost)}</td>
                        </tr>
                      )}
                      {displayData.promoDiscount > 0 && (
                        <tr className="discount">
                          <td>
                            <i className="fas fa-tag"></i>{' '}
                            {displayData.promotionName}
                            {displayData.discountPercent && ` (-${displayData.discountPercent}%)`}
                          </td>
                          <td className="price">-{formatCurrency(displayData.promoDiscount)}</td>
                        </tr>
                      )}
                      <tr className="divider">
                        <td colSpan={2}></td>
                      </tr>
                      <tr>
                        <td>Tạm tính (chưa VAT)</td>
                        <td className="price">{formatCurrency(displayData.taxableAmount)}</td>
                      </tr>
                      <tr>
                        <td>Thuế VAT (10%)</td>
                        <td className="price">{formatCurrency(displayData.vatAmount)}</td>
                      </tr>
                      <tr className="divider">
                        <td colSpan={2}></td>
                      </tr>
                      <tr className="total">
                        <td><strong>TỔNG CỘNG</strong></td>
                        <td className="price"><strong>{formatCurrency(displayData.grandTotal)}</strong></td>
                      </tr>
                      <tr className="deposit">
                        <td><i className="fas fa-hand-holding-usd"></i> Tiền đặt cọc (10%)</td>
                        <td className="price">{formatCurrency(displayData.depositRequired)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

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
        <div className="modal-overlay" onClick={() => {
          setShowSuccessModal(false);
          navigate('/quotes');
        }}>
          <div className="success-modal" onClick={(e) => e.stopPropagation()}>
            <div className="success-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <h3>Thành công!</h3>
            <p>{successMessage}</p>
            <div className="modal-actions">
              <button 
                className="btn-generate-pdf"
                onClick={handleGeneratePDF}
              >
                <i className="fas fa-file-pdf"></i>
                Tạo PDF
              </button>
              <button 
                className="btn-view-list"
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate('/quotes');
                }}
              >
                <i className="fas fa-list"></i>
                Xem danh sách
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-select Success Toast */}
      {successMessage && !showSuccessModal && (
        <div className="toast-notification success">
          <div className="toast-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="toast-content">
            <div className="toast-message">{successMessage}</div>
          </div>
          <button className="toast-close" onClick={() => setSuccessMessage('')}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default CreateQuotePage;
