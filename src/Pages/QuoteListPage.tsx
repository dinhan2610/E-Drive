import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listQuotations, getQuotation, type QuotationResponse } from '../services/quotationApi';
import { getProfile } from '../services/profileApi';
import styles from '../styles/OrderStyles/QuoteManagement.module.scss';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import ReactDOM from 'react-dom/client';
import QuotePDFTemplate from '../components/QuotePDFTemplate';

// ==========================================
// INTERFACES - Đầy đủ cho PDF & Modal
// ==========================================

/**
 * Interface mở rộng chứa TẤT CẢ thông tin cần thiết
 * Kế thừa từ QuotationResponse và bổ sung các field từ Vehicle, Customer, Pricing
 */
export interface QuotationDetailData extends QuotationResponse {
  // Thông tin báo giá
  quotationNumber?: string;
  quotationDate?: string;
  status?: 'pending' | 'sent' | 'accepted' | 'rejected';
  validUntil?: string;
  
  // Thông tin khách hàng
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  customerCity?: string;
  
  // Thông tin xe
  vehicleName?: string;        // VF 5 Plus
  vehicleModel?: string;        // VF 5
  vehicleVersion?: string;      // Plus
  vehicleColor?: string;
  vehicleYear?: number;
  
  // Giá cơ bản
  basePrice?: number;           // Giá niêm yết
  quantity?: number;            // Số lượng
  subtotal?: number;            // Tổng giá xe (basePrice * quantity)
  
  // Dịch vụ bổ sung
  tintFilmPrice?: number;
  wallboxChargerPrice?: number;
  warrantyExtensionPrice?: number;
  ppfPrice?: number;
  ceramicCoatingPrice?: number;
  camera360Price?: number;
  servicesTotal?: number;       // Tổng dịch vụ
  
  // Khuyến mãi & Thuế
  promotionName?: string;
  promotionDiscount?: number;   // Số tiền giảm
  discountPercent?: number;     // % giảm giá
  
  taxableAmount?: number;       // Số tiền chịu thuế
  vatRate?: number;             // Thuế VAT %
  vatAmount?: number | null;    // Số tiền VAT (có thể null từ API)
  
  // Tổng kết
  grandTotal?: number;          // TỔNG CỘNG
  depositRequired?: number;     // Tiền đặt cọc
  
  // Ghi chú
  notes?: string;
  termsAndConditions?: string;
  
  // Thông tin đại lý
  dealerName?: string;
  dealerAddress?: string;
  dealerPhone?: string;
  dealerEmail?: string;
}

interface Quote {
  id: string;
  quoteNumber: string;
  date: string;
  customerName: string;
  productName: string;
  productVariant: string;
  totalPrice: number;
  quantity: number;
  status: 'pending' | 'sent' | 'accepted' | 'rejected';
}

const QuoteListPage: React.FC = () => {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [dealerInfo, setDealerInfo] = useState<{ id: number; name?: string } | null>(null);

  // Get dealer info from profile API
  useEffect(() => {
    const fetchDealerInfo = async () => {
      try {
        console.log('🔍 Fetching dealer info from /api/profile/me...');
        const profile = await getProfile();
        console.log('✅ Profile data:', profile);
        console.log('🏢 Dealer ID from profile:', profile.dealerId);
        
        setDealerInfo({
          id: profile.dealerId,
          name: profile.agencyName || `Đại lý #${profile.dealerId}`
        });
      } catch (error) {
        console.error('❌ Failed to fetch profile:', error);
        // Fallback to token if profile fails
        const token = localStorage.getItem('accessToken');
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const dealerId = payload.dealerId || payload.dealer_id || 1;
            setDealerInfo({ id: dealerId, name: `Đại lý #${dealerId}` });
          } catch {
            setDealerInfo({ id: 1, name: 'Đại lý #1' });
          }
        } else {
          setDealerInfo({ id: 1, name: 'Đại lý #1' });
        }
      }
    };
    
    fetchDealerInfo();
  }, []);

  useEffect(() => {
    // Check if user is logged in
    const accessToken = localStorage.getItem('accessToken');
    const legacyToken = localStorage.getItem('token');
    
    const token = accessToken || legacyToken;
    if (!token) {
      console.error('❌ No token found - user needs to login again');
      setErrorMessage('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để xem danh sách báo giá.');
      setIsLoading(false);
      return;
    }
    
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const quotations = await listQuotations();
      
      // Check if empty (user might not have permission or no quotes yet)
      if (quotations.length === 0) {
        setQuotes([]);
        setErrorMessage('');
        setIsLoading(false);
        return;
      }
      
      // Map API response to local Quote interface
      // Note: New API has minimal fields, so we use fallback values
      const mappedQuotes: Quote[] = quotations.map((q: QuotationResponse) => ({
        id: String(q.quotationId),
        quoteNumber: `BG-${q.quotationId}`,
        date: q.createdAt ? new Date(q.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        customerName: `Khách hàng #${q.customerId}`, // API doesn't return customer name
        productName: `Xe #${q.vehicleId}`, // API doesn't return vehicle name
        productVariant: '',
        totalPrice: 0, // API doesn't return price
        quantity: 1,
        status: 'pending' // Default status since it's not in API response
      }));
      
      setQuotes(mappedQuotes);
      
    } catch (error: any) {
      console.error('❌ Error loading quotations:', error);
      setErrorMessage(error.message || 'Không thể tải danh sách báo giá');
      
      // Don't use fallback mock data - show empty state instead
      setQuotes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number | undefined | null): string => {
    if (price === undefined || price === null || isNaN(price)) {
      return '0 ₫';
    }
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Chờ gửi', class: styles.statusPending },
      sent: { label: 'Đã gửi', class: styles.statusSent },
      accepted: { label: 'Đã chấp nhận', class: styles.statusAccepted },
      rejected: { label: 'Đã từ chối', class: styles.statusRejected },
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return <span className={`${styles.statusBadge} ${config.class}`}>{config.label}</span>;
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesStatus = filterStatus === 'all' || quote.status === filterStatus;
    return matchesStatus;
  });

  /**
   * Enrich API data với thông tin đầy đủ
   * TODO: Khi backend cung cấp đủ data, bỏ phần mock này
   */
  const enrichQuotationData = async (baseData: QuotationResponse): Promise<QuotationDetailData> => {
    // TODO: Gọi API để lấy thêm thông tin Vehicle và Customer
    // const vehicle = await getVehicle(baseData.vehicleId);
    // const customer = await getCustomer(baseData.customerId);
    
    // Tạm thời mock data để UI hoạt động
    const enriched: QuotationDetailData = {
      ...baseData,
      
      // Thông tin báo giá
      quotationNumber: `BG-${String(baseData.quotationId).padStart(6, '0')}`,
      quotationDate: baseData.createdAt || new Date().toISOString(),
      status: 'pending',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      
      // Mock thông tin khách hàng
      customerName: 'Nguyễn Văn An',
      customerPhone: '0901234567',
      customerEmail: 'nguyenvanan@email.com',
      customerAddress: '123 Đường Lê Lợi, Phường Bến Nghé',
      customerCity: 'TP. Hồ Chí Minh',
      
      // Mock thông tin xe
      vehicleName: 'VinFast VF 5 Plus',
      vehicleModel: 'VF 5',
      vehicleVersion: 'Plus',
      vehicleColor: 'Xanh Đại Dương',
      vehicleYear: 2024,
      
      // Giá cơ bản
      basePrice: 468000000,
      quantity: 1,
      subtotal: 468000000,
      
      // Dịch vụ bổ sung (tính theo additionalServices)
      tintFilmPrice: baseData.additionalServices.hasTintFilm ? 5000000 : 0,
      wallboxChargerPrice: baseData.additionalServices.hasWallboxCharger ? 15000000 : 0,
      warrantyExtensionPrice: baseData.additionalServices.hasWarrantyExtension ? 20000000 : 0,
      ppfPrice: baseData.additionalServices.hasPPF ? 35000000 : 0,
      ceramicCoatingPrice: baseData.additionalServices.hasCeramicCoating ? 12000000 : 0,
      camera360Price: baseData.additionalServices.has360Camera ? 8000000 : 0,
      
      // Khuyến mãi
      promotionName: 'Khuyến mãi mua xe tháng 11',
      promotionDiscount: 10000000,
      discountPercent: 2.1,
      
      // Thuế
      vatRate: 10,
    };
    
    // Tính tổng dịch vụ
    enriched.servicesTotal = (
      (enriched.tintFilmPrice || 0) +
      (enriched.wallboxChargerPrice || 0) +
      (enriched.warrantyExtensionPrice || 0) +
      (enriched.ppfPrice || 0) +
      (enriched.ceramicCoatingPrice || 0) +
      (enriched.camera360Price || 0)
    );
    
    // Tính số tiền chịu thuế
    enriched.taxableAmount = (
      (enriched.subtotal || 0) + 
      (enriched.servicesTotal || 0) - 
      (enriched.promotionDiscount || 0)
    );
    
    // Tính VAT
    enriched.vatAmount = Math.round((enriched.taxableAmount || 0) * (enriched.vatRate || 0) / 100);
    
    // Tính tổng cộng
    enriched.grandTotal = (enriched.taxableAmount || 0) + (enriched.vatAmount || 0);
    
    // Tiền đặt cọc (10%)
    enriched.depositRequired = Math.round((enriched.grandTotal || 0) * 0.1);
    
    // Ghi chú
    enriched.notes = 'Giá chưa bao gồm chi phí đăng ký và bảo hiểm xe. Vui lòng liên hệ để được tư vấn chi tiết.';
    enriched.termsAndConditions = 'Báo giá có hiệu lực trong 30 ngày kể từ ngày phát hành.';
    
    // Thông tin đại lý
    enriched.dealerName = dealerInfo?.name || 'VinFast E-Drive';
    enriched.dealerAddress = '458 Minh Khai, Hai Bà Trưng, Hà Nội';
    enriched.dealerPhone = '1900 23 23 89';
    enriched.dealerEmail = 'contact@vinfastedrive.vn';
    
    return enriched;
  };

  // Handler: Send email to customer
  const handleSendEmail = async (quoteId: string) => {
    try {
      // TODO: Implement send email functionality
      // This could generate PDF and send via email API
      const baseData = await getQuotation(Number(quoteId));
      const enrichedData = await enrichQuotationData(baseData);
      
      // For now, just show success message
      alert(`✉️ Gửi báo giá #${enrichedData.quotationNumber} đến ${enrichedData.customerEmail || enrichedData.customerName}`);
      
      // TODO: Call email API
      // await sendQuotationEmail(quoteId, enrichedData.customerEmail);
    } catch (error: any) {
      console.error('❌ Error sending email:', error);
      alert('Không thể gửi email. Vui lòng thử lại.');
    }
  };

  // Helper function - will be needed when PDF generation is updated
  // const removeVietnameseAccents = (str: string): string => {
  //   return str
  //     .normalize('NFD')
  //     .replace(/[\u0300-\u036f]/g, '')
  //     .replace(/đ/g, 'd')
  //     .replace(/Đ/g, 'D');
  // };

  /**
   * Generate multi-page PDF từ HTML sử dụng html2canvas
   * Tối ưu: Gọi API /api/quotations/{id} để lấy dữ liệu đầy đủ và chính xác nhất
   */
  const generatePDF = async (quoteData: QuotationDetailData) => {
    try {
      console.log('🔄 Fetching latest quotation data from API...');
      
      // Gọi API để lấy dữ liệu chi tiết mới nhất
      const latestData = await getQuotation(quoteData.quotationId);
      console.log('✅ Latest quotation data:', latestData);
      
      // Map dữ liệu từ API sang QuotationDetailData
      const pdfData: QuotationDetailData = {
        ...latestData,
        quotationNumber: `QUOTE-${latestData.quotationId}`,
        quotationDate: latestData.createdAt,
        status: latestData.quotationStatus?.toLowerCase() as any || 'pending',
        validUntil: latestData.createdAt ? new Date(new Date(latestData.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        
        // Customer info
        customerName: latestData.customerFullName,
        customerPhone: latestData.customerPhone,
        customerEmail: latestData.customerEmail,
        customerAddress: latestData.customerAddress,
        
        // Vehicle info
        vehicleName: `${latestData.modelName} ${latestData.version}`,
        vehicleModel: latestData.modelName,
        vehicleVersion: latestData.version,
        vehicleYear: latestData.manufactureYear,
        
        // Pricing
        basePrice: latestData.unitPrice,
        quantity: 1,
        subtotal: latestData.unitPrice,
        
        // Services
        tintFilmPrice: latestData.additionalServices.hasTintFilm ? latestData.additionalServices.tintFilmPrice : 0,
        wallboxChargerPrice: latestData.additionalServices.hasWallboxCharger ? latestData.additionalServices.wallboxChargerPrice : 0,
        warrantyExtensionPrice: latestData.additionalServices.hasWarrantyExtension ? latestData.additionalServices.warrantyExtensionPrice : 0,
        ppfPrice: latestData.additionalServices.hasPPF ? latestData.additionalServices.ppfPrice : 0,
        ceramicCoatingPrice: latestData.additionalServices.hasCeramicCoating ? latestData.additionalServices.ceramicCoatingPrice : 0,
        camera360Price: latestData.additionalServices.has360Camera ? latestData.additionalServices.camera360Price : 0,
        servicesTotal: latestData.additionalServices.totalServicesPrice || 0,
        
        // Discount & Total
        promotionDiscount: latestData.promotionDiscountAmount || 0,
        promotionName: latestData.promotionDiscountAmount ? 'Khuyến mãi' : undefined,
        discountPercent: undefined, // API không trả về %
        
        // VAT calculation
        taxableAmount: latestData.grandTotal ? latestData.grandTotal / 1.1 : 0,
        vatRate: 10,
        vatAmount: latestData.vatAmount || (latestData.grandTotal ? latestData.grandTotal - (latestData.grandTotal / 1.1) : 0),
        grandTotal: latestData.grandTotal,
        depositRequired: latestData.grandTotal ? latestData.grandTotal * 0.1 : 0,
        
        // Dealer info
        dealerName: latestData.dealerName,
        dealerPhone: '1900 23 23 89',
        dealerEmail: 'contact@vinfastedrive.vn',
        dealerAddress: '458 Minh Khai, Hai Bà Trưng, Hà Nội',
      };
      
      console.log('📝 Starting multi-page PDF generation with html2canvas...');
      
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
      
      // Capture HTML thành canvas với chất lượng cao
      const canvas = await html2canvas(pdfElement, {
        scale: 2, // Tăng độ phân giải gấp đôi
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794, // Chiều rộng A4 (210mm) tại 96 DPI
      });
      
      console.log('📝 Creating multi-page PDF from canvas...');
      
      // Tạo PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Kích thước A4: 210mm x 297mm
      const pageWidth = 210;
      const pageHeight = 297;
      
      // Tính toán kích thước ảnh
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      
      // Tính số trang cần thiết
      const totalPages = Math.ceil(imgHeight / pageHeight);
      
      console.log(`📄 Content height: ${imgHeight.toFixed(2)}mm, splitting into ${totalPages} page(s)`);
      
      // Chia canvas thành nhiều trang
      for (let i = 0; i < totalPages; i++) {
        // Thêm trang mới (trừ trang đầu tiên)
        if (i > 0) {
          pdf.addPage();
        }
        
        // Tạo canvas tạm cho từng trang
        const pageCanvas = document.createElement('canvas');
        const pageCtx = pageCanvas.getContext('2d');
        
        if (!pageCtx) continue;
        
        // Tính kích thước canvas cho trang này
        const scale = canvas.width / imgWidth;
        pageCanvas.width = canvas.width;
        pageCanvas.height = Math.min(pageHeight * scale, canvas.height - i * pageHeight * scale);
        
        // Vẽ phần canvas tương ứng với trang này
        pageCtx.drawImage(
          canvas,
          0, // sourceX
          i * pageHeight * scale, // sourceY
          canvas.width, // sourceWidth
          pageCanvas.height, // sourceHeight
          0, // destX
          0, // destY
          canvas.width, // destWidth
          pageCanvas.height // destHeight
        );
        
        // Convert sang image data và thêm vào PDF
        const pageImgData = pageCanvas.toDataURL('image/png');
        const actualHeight = Math.min(pageHeight, imgHeight - i * pageHeight);
        
        pdf.addImage(pageImgData, 'PNG', 0, 0, imgWidth, actualHeight);
        
        console.log(`✅ Added page ${i + 1}/${totalPages}`);
      }
      
      // Xóa container tạm
      document.body.removeChild(tempDiv);
      
      // Tạo tên file
      const fileName = `BaoGia_${pdfData.quotationNumber}_${pdfData.customerName?.replace(/\s+/g, '_') || 'KhachHang'}.pdf`;
      
      console.log(`✅ Multi-page PDF generated successfully: ${fileName} (${totalPages} page(s))`);
      pdf.save(fileName);
      
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      alert('Có lỗi xảy ra khi tạo file PDF. Vui lòng thử lại.');
    }
  };

  const handleDownloadPDF = async (quoteId: string) => {
    try {
      // Fetch full quote details first
      const baseData = await getQuotation(Number(quoteId));
      const enrichedData = await enrichQuotationData(baseData);
      await generatePDF(enrichedData);
    } catch (error: any) {
      console.error('❌ Error downloading PDF:', error);
      alert(error.message || 'Không thể tải PDF. Vui lòng thử lại.');
    }
  };

  /* OLD PDF CODE - Commented out because API structure changed
  const generatePDF_OLD = async (quoteData: QuotationResponse) => {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Add custom font for Vietnamese (using default font with unicode support)
      pdf.setFont('helvetica');
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPos = margin;

      // Header - Company Logo/Name
      pdf.setFontSize(24);
      pdf.setTextColor(255, 77, 48);
      pdf.text('E-DRIVE', pageWidth / 2, yPos, { align: 'center' });
      yPos += 8;

      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text('XE DIEN THONG MINH - TUONG LAI XANH', pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

      // Title
      pdf.setFontSize(20);
      pdf.setTextColor(0, 0, 0);
      pdf.text('BAO GIA XE DIEN', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      // Quote Number
      pdf.setFontSize(12);
      pdf.setTextColor(255, 77, 48);
      pdf.text(`So bao gia: BG-${quoteData.quotationId}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

      // Divider line
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      // Customer Information Section
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text('THONG TIN KHACH HANG', margin, yPos);
      yPos += 8;

      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);
      
      const customerInfo = [
        `Ho ten: ${removeVietnameseAccents(quoteData.customerFullName)}`,
        `Dien thoai: ${quoteData.phone}`,
        `Email: ${quoteData.email}`,
        `Dia chi: ${removeVietnameseAccents(quoteData.fullAddress)}`
      ];

      customerInfo.forEach(info => {
        pdf.text(info, margin + 5, yPos);
        yPos += 6;
      });

      if (quoteData.notes) {
        yPos += 2;
        pdf.text(`Ghi chu: ${removeVietnameseAccents(quoteData.notes)}`, margin + 5, yPos);
        yPos += 6;
      }

      yPos += 8;

      // Vehicle Information Section
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text('THONG TIN XE', margin, yPos);
      yPos += 8;

      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);
      pdf.text(`Model: ${removeVietnameseAccents(quoteData.vehicleModel)}`, margin + 5, yPos);
      yPos += 6;
      pdf.text(`Don gia: ${formatPrice(quoteData.unitPrice)}`, margin + 5, yPos);
      yPos += 12;

      // Pricing Table
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text('CHI TIET GIA', margin, yPos);
      yPos += 8;

      // Table data
      const tableData: any[] = [
        ['Gia xe (don gia)', formatPrice(quoteData.unitPrice)],
        ['Tong gia tri xe', formatPrice(quoteData.vehicleSubtotal)]
      ];

      // Add optional services
      if (quoteData.includeInsurancePercent) {
        tableData.push(['Bao hiem', 'Da bao gom']);
      }
      if (quoteData.includeWarrantyExtension) {
        tableData.push(['Bao hanh mo rong', 'Da bao gom']);
      }
      if (quoteData.includeAccessories) {
        tableData.push(['Phu kien', 'Da bao gom']);
      }

      tableData.push(['Tong dich vu', formatPrice(quoteData.serviceTotal)]);

      if (quoteData.discountAmount > 0) {
        tableData.push([
          `Giam gia (${quoteData.discountRate}%)`,
          `-${formatPrice(quoteData.discountAmount)}`
        ]);
      }

      tableData.push(['Tam tinh', formatPrice(quoteData.taxableBase)]);
      tableData.push([
        `Thue VAT (${quoteData.vatRate}%)`,
        formatPrice(quoteData.vatAmount)
      ]);

      // Use autotable for pricing
      autoTable(pdf, {
        startY: yPos,
        head: [],
        body: tableData,
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 11,
          cellPadding: 5,
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        columnStyles: {
          0: { cellWidth: 120 },
          1: { cellWidth: 'auto', halign: 'right', fontStyle: 'bold' }
        },
        theme: 'grid'
      });

      // Get Y position after table
      yPos = (pdf as any).lastAutoTable?.finalY || yPos + 100;
      yPos += 5;

      // Total Section - Highlighted
      pdf.setFillColor(255, 77, 48);
      pdf.rect(margin, yPos, pageWidth - 2 * margin, 15, 'F');
      
      pdf.setFontSize(16);
      pdf.setTextColor(255, 255, 255);
      pdf.text('TONG CONG', margin + 5, yPos + 10);
      pdf.text(formatPrice(quoteData.grandTotal), pageWidth - margin - 5, yPos + 10, { align: 'right' });
      
      yPos += 25;

      // Footer - Notes
      if (yPos < pageHeight - 40) {
        yPos = pageHeight - 40;
      }

      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Bao gia nay co hieu luc trong 30 ngay ke tu ngay phat hanh.', pageWidth / 2, yPos, { align: 'center' });
      yPos += 5;
      pdf.text('Xin cam on quy khach da tin tuong E-Drive!', pageWidth / 2, yPos, { align: 'center' });

      // Signature Section
      yPos += 10;
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      pdf.text('KHACH HANG', margin + 30, yPos);
      pdf.text('DAI DIEN E-DRIVE', pageWidth - margin - 50, yPos);
      yPos += 4;
      
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text('(Ky va ghi ro ho ten)', margin + 20, yPos);
      pdf.text('(Ky va dong dau)', pageWidth - margin - 45, yPos);

      // Save PDF
      const customerNameClean = removeVietnameseAccents(quoteData.customerFullName).replace(/\s+/g, '_');
      const fileName = `BaoGia_BG${quoteData.quotationId}_${customerNameClean}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      alert('Có lỗi xảy ra khi tạo file PDF. Vui lòng thử lại.');
    }
  };
  */ // End of OLD PDF CODE

  return (
    <>
      <div className={styles.pageWrapper}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <div className={styles.headerIcon}>
                <i className="fas fa-file-invoice-dollar"></i>
              </div>
              <div className={styles.headerText}>
                <h1>Quản lý báo giá xe điện</h1>
                <p>
                  Theo dõi và quản lý toàn bộ báo giá cho khách hàng
                  {dealerInfo && (
                    <span className={styles.dealerBadge}>
                      <i className="fas fa-store"></i>
                      Đại lý #{dealerInfo.id}
                      {dealerInfo.name && ` - ${dealerInfo.name}`}
                    </span>
                  )}
                </p>
              </div>
              <button 
                className={styles.createButton}
                onClick={() => navigate('/quotes/create')}
                title="Tạo báo giá mới"
              >
                <i className="fas fa-plus-circle"></i>
                <span>Tạo báo giá mới</span>
              </button>
            </div>
          </div>

          <div className={styles.filterSection}>
            <div className={styles.filterButtons}>
              <button 
                className={`${styles.filterButton} ${filterStatus === 'all' ? styles.active : ''}`}
                onClick={() => setFilterStatus('all')}
              >
                Tất cả ({quotes.length})
              </button>
              <button 
                className={`${styles.filterButton} ${filterStatus === 'pending' ? styles.active : ''}`}
                onClick={() => setFilterStatus('pending')}
              >
                Chờ gửi ({quotes.filter(q => q.status === 'pending').length})
              </button>
              <button 
                className={`${styles.filterButton} ${filterStatus === 'sent' ? styles.active : ''}`}
                onClick={() => setFilterStatus('sent')}
              >
                Đã gửi ({quotes.filter(q => q.status === 'sent').length})
              </button>
              <button 
                className={`${styles.filterButton} ${filterStatus === 'accepted' ? styles.active : ''}`}
                onClick={() => setFilterStatus('accepted')}
              >
                Đã chấp nhận ({quotes.filter(q => q.status === 'accepted').length})
              </button>
              <button 
                className={`${styles.filterButton} ${filterStatus === 'rejected' ? styles.active : ''}`}
                onClick={() => setFilterStatus('rejected')}
              >
                Đã từ chối ({quotes.filter(q => q.status === 'rejected').length})
              </button>
            </div>
          </div>

          {/* Error State */}
          {errorMessage ? (
            <div className={styles.errorState}>
              <i className="fas fa-exclamation-triangle"></i>
              <h3>Không thể tải dữ liệu</h3>
              <p>{errorMessage}</p>
              <button onClick={() => {
                localStorage.clear();
                navigate('/');
              }}>
                <i className="fas fa-sign-in-alt"></i>
                Đăng nhập lại
              </button>
            </div>
          ) : isLoading ? (
            <div className={styles.loading}>
              <i className="fas fa-spinner fa-spin"></i>
              <p>Đang tải...</p>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Khách hàng</th>
                    <th>Xe</th>
                    <th>Ngày tạo</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuotes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={styles.emptyState}>
                        <i className="fas fa-inbox"></i>
                        <p>Không có dữ liệu</p>
                      </td>
                    </tr>
                  ) : (
                    filteredQuotes.map((quote) => (
                      <tr key={quote.id}>
                        <td>#{quote.quoteNumber}</td>
                        <td>
                          <div className={styles.customerInfo}>
                            <div className={styles.customerName}>{quote.customerName}</div>
                            <div className={styles.customerPhone}>
                              <i className="fas fa-phone"></i>
                              ID: {quote.id}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.vehicleInfo}>
                            <div className={styles.vehicleName}>{quote.productName}</div>
                            {quote.productVariant && (
                              <div className={styles.vehiclePrice}>{quote.productVariant}</div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className={styles.dateInfo}>
                            <div className={styles.date}>{formatDate(quote.date)}</div>
                          </div>
                        </td>
                        <td>
                          {getStatusBadge(quote.status)}
                        </td>
                        <td>
                          <div className={styles.actions}>
                            <button 
                              className={`${styles.actionButton} ${styles.download}`}
                              title="Tải PDF"
                              onClick={() => handleDownloadPDF(quote.id)}
                            >
                              <i className="fas fa-download"></i>
                            </button>
                            <button 
                              className={`${styles.actionButton} ${styles.email}`}
                              title="Gửi email cho khách hàng"
                              onClick={() => handleSendEmail(quote.id)}
                            >
                              <i className="fas fa-envelope"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default QuoteListPage;
