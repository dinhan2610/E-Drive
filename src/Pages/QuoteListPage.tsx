import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listQuotations, exportQuotationPDF, updateQuotationStatus, sendQuotationEmail, type QuotationResponse } from '../services/quotationApi';
import { getProfile } from '../services/profileApi';
import { canEditQuoteStatus } from '../utils/roleUtils';
import styles from '../styles/OrderStyles/QuoteManagement.module.scss';

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
  customerPhone: string;
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
      const mappedQuotes: Quote[] = quotations.map((q: QuotationResponse) => ({
        id: String(q.quotationId),
        quoteNumber: `BG-${q.quotationId}`,
        date: q.createdAt ? new Date(q.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        customerName: q.customerFullName || `Khách hàng #${q.customerId}`,
        customerPhone: q.customerPhone || 'Chưa cập nhật',
        productName: q.modelName ? `${q.modelName}${q.version ? ' ' + q.version : ''}` : `Xe #${q.vehicleId}`,
        productVariant: q.version || '',
        totalPrice: q.grandTotal || 0,
        quantity: 1,
        status: (q.quotationStatus?.toLowerCase() as 'pending' | 'sent' | 'accepted' | 'rejected') || 'pending'
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

    const handleStatusChange = async (quoteId: string, newStatus: string) => {
    try {
      // Map UI status to backend status (chỉ ACCEPTED và REJECTED)
      const statusMap: Record<string, 'ACCEPTED' | 'REJECTED'> = {
        'accepted': 'ACCEPTED',
        'rejected': 'REJECTED'
      };
      
      const backendStatus = statusMap[newStatus];
      if (!backendStatus) {
        throw new Error('Trạng thái không hợp lệ');
      }
      
      console.log(`🔄 Updating quotation #${quoteId} to status: ${backendStatus}`);
      
      // Nếu là huỷ, yêu cầu nhập lý do
      let rejectionReason: string | undefined;
      if (newStatus === 'rejected') {
        const reason = prompt('Vui lòng nhập lý do huỷ báo giá:');
        if (!reason || reason.trim() === '') {
          alert('Bạn phải nhập lý do huỷ!');
          return;
        }
        rejectionReason = reason;
      }
      
      // Gọi API cập nhật
      await updateQuotationStatus({
        quotationId: Number(quoteId),
        status: backendStatus,
        rejectionReason
      });
      
      // Cập nhật state local
      setQuotes(prev =>
        prev.map(q =>
          q.id === quoteId ? { ...q, status: newStatus as 'pending' | 'sent' | 'accepted' | 'rejected' } : q
        )
      );
      
      console.log(`✅ Updated quote ${quoteId} status to ${newStatus}`);
      alert('✅ Cập nhật trạng thái thành công!');
    } catch (error: any) {
      console.error('❌ Error updating status:', error);
      alert(error.response?.data?.message || 'Không thể cập nhật trạng thái. Vui lòng thử lại.');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Chờ xử lý', class: styles.statusPending },
      sent: { label: 'Đã gửi', class: styles.statusSent },
      accepted: { label: 'Đã xác nhận', class: styles.statusAccepted },
      rejected: { label: 'Huỷ', class: styles.statusRejected },
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return <span className={`${styles.statusBadge} ${config.class}`}>{config.label}</span>;
  };

  const renderStatusDropdown = (quote: Quote) => {
    const canEdit = canEditQuoteStatus();
    
    // Staff hoặc trạng thái đã được xác nhận/huỷ: Show read-only badge
    const isStatusLocked = quote.status === 'accepted' || quote.status === 'rejected';
    
    if (!canEdit || isStatusLocked) {
      return getStatusBadge(quote.status);
    }
    
    // Manager/Dealer với trạng thái pending: Show editable dropdown
    return (
      <select
        className={`${styles.statusSelect} ${styles.statusPending}`}
        value={quote.status}
        onChange={(e) => handleStatusChange(quote.id, e.target.value)}
        onClick={(e) => e.stopPropagation()}
        title="Chọn trạng thái báo giá (chỉ có thể thay đổi một lần)"
      >
        <option value="pending">Chờ xử lý</option>
        <option value="accepted">Đã xác nhận</option>
        <option value="rejected">Huỷ</option>
      </select>
    );
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesStatus = filterStatus === 'all' || quote.status === filterStatus;
    return matchesStatus;
  });

  // Handler: Send email to customer
  const handleSendEmail = async (quoteId: string) => {
    // Confirm trước khi gửi
    if (!confirm('📧 Bạn có chắc chắn muốn gửi email báo giá cho khách hàng?')) {
      return;
    }

    try {
      console.log('📧 Sending email for quotation:', quoteId);
      
      // Gọi email qua API
      const result = await sendQuotationEmail(Number(quoteId));
      
      console.log('✅ Email sent successfully:', result);
      
      // Hiển thị thông báo thành công
      alert('✅ Gửi email báo giá thành công!\n\nEmail đã được gửi đến khách hàng kèm file PDF báo giá.');
      
    } catch (error: any) {
      console.error('❌ Error sending email:', error);
      alert(`❌ ${error.message || 'Không thể gửi email. Vui lòng thử lại.'}`);
    }
  };

  const handleDownloadPDF = async (quoteId: string) => {
    try {
      console.log('📥 Downloading PDF for quotation:', quoteId);
      
      // Use backend PDF generation API
      const pdfBlob = await exportQuotationPDF(Number(quoteId));
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Bao-Gia-${quoteId}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ PDF downloaded successfully');
    } catch (error: any) {
      console.error('❌ Error downloading PDF:', error);
      alert(error.message || 'Không thể tải PDF. Vui lòng thử lại.');
    }
  };

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
                              {quote.customerPhone}
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
                          {renderStatusDropdown(quote)}
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
