import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllQuotations, getQuotationById, type QuotationResponseData } from '../services/quotationApi';
import Footer from '../components/Footer';
import styles from '../styles/OrderStyles/QuoteListPage.module.scss';
import modalStyles from '../styles/OrderStyles/QuoteDetailModal.module.scss';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [selectedQuote, setSelectedQuote] = useState<QuotationResponseData | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

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
      const quotations = await getAllQuotations();
      
      // Check if empty (user might not have permission or no quotes yet)
      if (quotations.length === 0) {
        setQuotes([]);
        setErrorMessage('');
        setIsLoading(false);
        return;
      }
      
      // Map API response to local Quote interface
      const mappedQuotes: Quote[] = quotations.map((q: QuotationResponseData) => ({
        id: String(q.quotationId),
        quoteNumber: `BG-${q.quotationId}`,
        date: new Date().toISOString().split('T')[0], // Since createdAt is not in API response
        customerName: q.customerFullName,
        productName: q.vehicleModel || 'Xe điện E-Drive',
        productVariant: '',
        totalPrice: q.grandTotal || 0,
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

  const formatPrice = (price: number) => {
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
    const matchesSearch = quote.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.productName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleViewQuote = async (quoteId: string) => {
    setIsLoadingDetail(true);
    setShowDetailModal(true);
    
    try {
      const detail = await getQuotationById(Number(quoteId));
      setSelectedQuote(detail);
    } catch (error: any) {
      console.error('❌ Error loading quote detail:', error);
      alert(error.message || 'Không thể tải chi tiết báo giá');
      setShowDetailModal(false);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedQuote(null);
  };

  // Helper function to remove Vietnamese accents for PDF
  const removeVietnameseAccents = (str: string): string => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  };

  const generatePDF = async (quoteData: QuotationResponseData) => {
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

  const handleDownloadPDF = async (quoteId: string) => {
    try {
      // Fetch full quote details first
      const quoteDetail = await getQuotationById(Number(quoteId));
      await generatePDF(quoteDetail);
    } catch (error: any) {
      console.error('❌ Error downloading PDF:', error);
      alert(error.message || 'Không thể tải PDF. Vui lòng thử lại.');
    }
  };

  return (
    <>
      <div className={styles.wrap}>
        <div className={styles.container}>
          <div className={styles.header}>
            <button 
              className={styles.backButton}
              onClick={() => navigate('/quote')}
            >
              <i className="fas fa-arrow-left"></i>
              Quay lại
            </button>
            <div className={styles.headerContent}>
              <h1>
                <i className="fas fa-file-invoice"></i>
                Danh sách báo giá
              </h1>
              <p>Quản lý và theo dõi các báo giá đã tạo</p>
            </div>
          </div>

          {/* Error Banner - Show if no token */}
          {errorMessage && (
            <div className={styles.errorBanner}>
              <i className="fas fa-exclamation-triangle"></i>
              <span>{errorMessage}</span>
              <button 
                className={styles.loginButton}
                onClick={() => {
                  // Clear old session data
                  localStorage.clear();
                  // Redirect to home (where login form is)
                  navigate('/');
                }}
              >
                <i className="fas fa-sign-in-alt"></i>
                Đăng nhập ngay
              </button>
            </div>
          )}

          {/* Filters */}
          <div className={styles.filters}>
            <div className={styles.searchBox}>
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Tìm kiếm theo tên khách hàng, số báo giá, sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className={styles.statusFilter}>
              <label>Trạng thái:</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">Tất cả</option>
                <option value="pending">Chờ gửi</option>
                <option value="sent">Đã gửi</option>
                <option value="accepted">Đã chấp nhận</option>
                <option value="rejected">Đã từ chối</option>
              </select>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className={styles.errorBanner}>
              <i className="fas fa-exclamation-triangle"></i>
              <div>
                <strong>Lỗi tải dữ liệu</strong>
                <p>{errorMessage}</p>
              </div>
              <button onClick={loadQuotes} className={styles.retryButton}>
                <i className="fas fa-sync-alt"></i>
                Thử lại
              </button>
            </div>
          )}

          {/* Stats */}
          <div className={styles.stats}>
            <div className={styles.statCard}>
              <i className="fas fa-file-alt"></i>
              <div>
                <h3>{quotes.length}</h3>
                <p>Tổng báo giá</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <i className="fas fa-paper-plane"></i>
              <div>
                <h3>{quotes.filter(q => q.status === 'sent').length}</h3>
                <p>Đã gửi</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <i className="fas fa-check-circle"></i>
              <div>
                <h3>{quotes.filter(q => q.status === 'accepted').length}</h3>
                <p>Đã chấp nhận</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <i className="fas fa-clock"></i>
              <div>
                <h3>{quotes.filter(q => q.status === 'pending').length}</h3>
                <p>Chờ xử lý</p>
              </div>
            </div>
          </div>

          {/* Quote List */}
          {isLoading ? (
            <div className={styles.loading}>
              <i className="fas fa-spinner fa-spin"></i>
              <p>Đang tải dữ liệu...</p>
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className={styles.empty}>
              <i className="fas fa-inbox"></i>
              <h3>Không tìm thấy báo giá</h3>
              <p>
                {searchTerm || filterStatus !== 'all'
                  ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                  : quotes.length === 0 
                    ? 'Bạn chưa tạo báo giá nào. Hãy tạo báo giá đầu tiên!'
                    : 'Chưa có báo giá nào phù hợp với bộ lọc'}
              </p>
              {quotes.length === 0 && (
                <button 
                  className={styles.createButton}
                  onClick={() => navigate('/quote')}
                >
                  <i className="fas fa-plus"></i>
                  Tạo báo giá mới
                </button>
              )}
            </div>
          ) : (
            <div className={styles.quoteGrid}>
              {filteredQuotes.map((quote) => (
                <div key={quote.id} className={styles.quoteCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.quoteNumber}>
                      <i className="fas fa-hashtag"></i>
                      {quote.quoteNumber}
                    </div>
                    {getStatusBadge(quote.status)}
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.infoRow}>
                      <i className="fas fa-user"></i>
                      <div>
                        <span className={styles.label}>Khách hàng</span>
                        <span className={styles.value}>{quote.customerName}</span>
                      </div>
                    </div>

                    <div className={styles.infoRow}>
                      <i className="fas fa-car"></i>
                      <div>
                        <span className={styles.label}>Sản phẩm</span>
                        <span className={styles.value}>
                          {quote.productName} - {quote.productVariant}
                        </span>
                      </div>
                    </div>

                    <div className={styles.infoRow}>
                      <i className="fas fa-boxes"></i>
                      <div>
                        <span className={styles.label}>Số lượng</span>
                        <span className={styles.value}>{quote.quantity} xe</span>
                      </div>
                    </div>

                    <div className={styles.infoRow}>
                      <i className="fas fa-calendar-alt"></i>
                      <div>
                        <span className={styles.label}>Ngày tạo</span>
                        <span className={styles.value}>{formatDate(quote.date)}</span>
                      </div>
                    </div>

                    <div className={styles.priceRow}>
                      <span>Tổng giá trị</span>
                      <span className={styles.price}>{formatPrice(quote.totalPrice)}</span>
                    </div>
                  </div>

                  <div className={styles.cardFooter}>
                    <button 
                      className={styles.viewButton}
                      onClick={() => handleViewQuote(quote.id)}
                    >
                      <i className="fas fa-eye"></i>
                      Xem chi tiết
                    </button>
                    <button 
                      className={styles.downloadButton}
                      onClick={() => handleDownloadPDF(quote.id)}
                    >
                      <i className="fas fa-download"></i>
                      Tải PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quote Detail Modal */}
      {showDetailModal && (
        <div className={modalStyles.modalOverlay} onClick={closeDetailModal}>
          <div className={modalStyles.detailModal} onClick={(e) => e.stopPropagation()}>
            <button className={modalStyles.closeButton} onClick={closeDetailModal}>
              <i className="fas fa-times"></i>
            </button>

            {isLoadingDetail ? (
              <div className={modalStyles.loading}>
                <i className="fas fa-spinner fa-spin"></i>
                <p>Đang tải chi tiết báo giá...</p>
              </div>
            ) : selectedQuote ? (
              <>
                <div className={modalStyles.modalHeader}>
                  <div className={modalStyles.headerIcon}>
                    <i className="fas fa-file-invoice-dollar"></i>
                  </div>
                  <div className={modalStyles.headerContent}>
                    <h2>Chi tiết báo giá #{selectedQuote.quotationId}</h2>
                    <p>Thông tin đầy đủ về báo giá</p>
                  </div>
                </div>

                <div className={modalStyles.modalBody}>
                  {/* Customer Info */}
                  <section className={modalStyles.section}>
                    <div className={modalStyles.sectionTitle}>
                      <i className="fas fa-user-tie"></i>
                      <h3>Thông tin khách hàng</h3>
                    </div>
                    <div className={modalStyles.infoGrid}>
                      <div className={modalStyles.infoItem}>
                        <span className={modalStyles.label}>Họ tên:</span>
                        <span className={modalStyles.value}>{selectedQuote.customerFullName}</span>
                      </div>
                      <div className={modalStyles.infoItem}>
                        <span className={modalStyles.label}>Số điện thoại:</span>
                        <span className={modalStyles.value}>{selectedQuote.phone}</span>
                      </div>
                      <div className={modalStyles.infoItem}>
                        <span className={modalStyles.label}>Email:</span>
                        <span className={modalStyles.value}>{selectedQuote.email}</span>
                      </div>
                      <div className={modalStyles.infoItem}>
                        <span className={modalStyles.label}>Địa chỉ:</span>
                        <span className={modalStyles.value}>
                          {selectedQuote.fullAddress}
                        </span>
                      </div>
                      {selectedQuote.notes && (
                        <div className={`${modalStyles.infoItem} ${modalStyles.fullWidth}`}>
                          <span className={modalStyles.label}>Ghi chú:</span>
                          <span className={modalStyles.value}>{selectedQuote.notes}</span>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Vehicle Info */}
                  <section className={modalStyles.section}>
                    <div className={modalStyles.sectionTitle}>
                      <i className="fas fa-car"></i>
                      <h3>Thông tin xe</h3>
                    </div>
                    <div className={modalStyles.vehicleCard}>
                      <div className={modalStyles.vehicleInfo}>
                        <h4>{selectedQuote.vehicleModel}</h4>
                        <p className={modalStyles.vehiclePrice}>
                          Đơn giá: {formatPrice(selectedQuote.unitPrice)}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Pricing Breakdown */}
                  <section className={modalStyles.section}>
                    <div className={modalStyles.sectionTitle}>
                      <i className="fas fa-calculator"></i>
                      <h3>Chi tiết giá</h3>
                    </div>
                    <div className={modalStyles.pricingTable}>
                      <div className={modalStyles.priceRow}>
                        <span>Giá xe (đơn giá)</span>
                        <span className={modalStyles.amount}>{formatPrice(selectedQuote.unitPrice)}</span>
                      </div>
                      
                      <div className={modalStyles.priceRow}>
                        <span>Tổng giá trị xe</span>
                        <span className={modalStyles.amount}>{formatPrice(selectedQuote.vehicleSubtotal)}</span>
                      </div>
                      
                      {selectedQuote.includeInsurancePercent && (
                        <div className={modalStyles.priceRow}>
                          <span>
                            <i className="fas fa-shield-alt"></i>
                            Bảo hiểm
                          </span>
                          <span className={modalStyles.amount}>Đã bao gồm</span>
                        </div>
                      )}
                      
                      {selectedQuote.includeWarrantyExtension && (
                        <div className={modalStyles.priceRow}>
                          <span>
                            <i className="fas fa-tools"></i>
                            Bảo hành mở rộng
                          </span>
                          <span className={modalStyles.amount}>Đã bao gồm</span>
                        </div>
                      )}
                      
                      {selectedQuote.includeAccessories && (
                        <div className={modalStyles.priceRow}>
                          <span>
                            <i className="fas fa-puzzle-piece"></i>
                            Phụ kiện
                          </span>
                          <span className={modalStyles.amount}>Đã bao gồm</span>
                        </div>
                      )}

                      <div className={modalStyles.priceRow}>
                        <span>Tổng dịch vụ</span>
                        <span className={modalStyles.amount}>{formatPrice(selectedQuote.serviceTotal)}</span>
                      </div>
                      
                      {selectedQuote.discountAmount > 0 && (
                        <div className={`${modalStyles.priceRow} ${modalStyles.discount}`}>
                          <span>
                            <i className="fas fa-tag"></i>
                            Giảm giá ({selectedQuote.discountRate}%)
                          </span>
                          <span className={modalStyles.amount}>-{formatPrice(selectedQuote.discountAmount)}</span>
                        </div>
                      )}
                      
                      <div className={modalStyles.divider}></div>
                      
                      <div className={`${modalStyles.priceRow} ${modalStyles.subtotal}`}>
                        <span>Tạm tính</span>
                        <span className={modalStyles.amount}>{formatPrice(selectedQuote.taxableBase)}</span>
                      </div>
                      
                      <div className={modalStyles.priceRow}>
                        <span>Thuế VAT ({selectedQuote.vatRate}%)</span>
                        <span className={modalStyles.amount}>{formatPrice(selectedQuote.vatAmount)}</span>
                      </div>
                      
                      <div className={modalStyles.divider}></div>
                      
                      <div className={`${modalStyles.priceRow} ${modalStyles.total}`}>
                        <span>Tổng cộng</span>
                        <span className={modalStyles.totalAmount}>{formatPrice(selectedQuote.grandTotal)}</span>
                      </div>
                    </div>
                  </section>
                </div>

                <div className={modalStyles.modalFooter}>
                  <button 
                    className={modalStyles.downloadButton}
                    onClick={() => selectedQuote && generatePDF(selectedQuote)}
                  >
                    <i className="fas fa-download"></i>
                    Tải PDF
                  </button>
                  <button className={modalStyles.closeFooterButton} onClick={closeDetailModal}>
                    <i className="fas fa-times"></i>
                    Đóng
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default QuoteListPage;
