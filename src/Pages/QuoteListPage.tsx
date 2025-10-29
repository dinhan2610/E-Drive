import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import styles from '../styles/OrderStyles/QuoteListPage.module.scss';

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

  useEffect(() => {
    // Load quotes from localStorage or API
    loadQuotes();
  }, []);

  const loadQuotes = () => {
    setIsLoading(true);
    // Simulate loading from localStorage
    const savedQuotes = localStorage.getItem('quotes');
    if (savedQuotes) {
      setQuotes(JSON.parse(savedQuotes));
    } else {
      // Mock data for demo
      setQuotes([
        {
          id: '1',
          quoteNumber: 'BG-2025-001',
          date: '2025-01-15',
          customerName: 'Nguyễn Văn A',
          productName: 'E-Drive Model S',
          productVariant: 'Premium',
          totalPrice: 850000000,
          quantity: 1,
          status: 'sent'
        },
        {
          id: '2',
          quoteNumber: 'BG-2025-002',
          date: '2025-01-20',
          customerName: 'Trần Thị B',
          productName: 'E-Drive Model X',
          productVariant: 'Standard',
          totalPrice: 650000000,
          quantity: 2,
          status: 'pending'
        },
      ]);
    }
    setIsLoading(false);
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

  const handleViewQuote = (quoteId: string) => {
    // Navigate to quote detail page (to be implemented)
    console.log('View quote:', quoteId);
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
                  : 'Chưa có báo giá nào được tạo'}
              </p>
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
                    <button className={styles.downloadButton}>
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
      <Footer />
    </>
  );
};

export default QuoteListPage;
