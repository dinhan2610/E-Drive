import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getOrdersByDealer,
  formatOrderStatus,
  formatPaymentStatus,
  getOrderStatusClass,
  getPaymentStatusClass,
  uploadOrderBill,
  getBillPreview,
  cancelOrder,
  type Order,
  OrderApiError 
} from '../services/orderApi';
import { getProfile } from '../services/profileApi';
import { downloadContractPdf, getAllContracts } from '../services/contractsApi';
import type { Contract } from '../types/contract';
import { useContractCheck } from '../hooks/useContractCheck';
import styles from '../styles/OrderStyles/OrderManagement.module.scss';

// ===== UTILITY FUNCTIONS =====
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Chưa có';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  } catch {
    return dateString;
  }
};

const formatDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Chưa có';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

const OrderManagementPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Order data state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentDealerId, setCurrentDealerId] = useState<number | null>(null);
  
  // Search and filter state
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Modal and UI state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  
  // Download state
  const [downloadingContractId, setDownloadingContractId] = useState<number | string | null>(null);
  const [uploadingBillOrderId, setUploadingBillOrderId] = useState<number | string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<number | string | null>(null);
  
  // File input ref for bill upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedOrderIdForUpload, setSelectedOrderIdForUpload] = useState<number | string | null>(null);
  
  // Track which orders have bills (persisted in localStorage)
  const [billExistence, setBillExistence] = useState<Record<string, boolean>>(() => {
    const stored = localStorage.getItem('orderBillExistence');
    return stored ? JSON.parse(stored) : {};
  });
  
  // Use contract check hook for optimized one-contract-per-order lookup
  const { hasContract, getContractId } = useContractCheck();
  
  // Contracts state to check status
  const [contracts, setContracts] = useState<Contract[]>([]);
  
  // Helper function to get contract status
  const getContractStatus = (orderId: number | string): string | null => {
    const contract = contracts.find(c => c.orderId === String(orderId));
    return contract?.status || null;
  };
  
  // Helper to check if order has bill (sync check from cache)
  const hasBill = (orderId: number | string): boolean => {
    return billExistence[String(orderId)] === true;
  };

  // ===== LOAD DEALER PROFILE =====
  useEffect(() => {
    const loadDealerProfile = async () => {
      try {
        const profile = await getProfile();
        if (profile.dealerId) {
          setCurrentDealerId(profile.dealerId);
          console.log('✅ Dealer logged in - ID:', profile.dealerId);
        } else {
          console.warn('⚠️ No dealerId in profile');
        }
      } catch (error) {
        console.error('❌ Error loading dealer profile:', error);
      }
    };
    
    loadDealerProfile();
  }, []);

  // ===== LOAD ORDERS DATA =====
  const loadOrders = useCallback(async () => {
    if (!currentDealerId) return;
    
    setLoading(true);
    try {
      const fetchedOrders = await getOrdersByDealer(currentDealerId);
      
      // Sort orders by newest first
      const sortedOrders = [...fetchedOrders].sort((a, b) => {
        const dateA = new Date(a.orderDate || 0).getTime();
        const dateB = new Date(b.orderDate || 0).getTime();
        return dateB - dateA;
      });
      
      setOrders(sortedOrders);
    } catch (error: any) {
      console.error('❌ Error loading orders:', error);
      if (error instanceof OrderApiError) {
        alert(`Lỗi tải đơn hàng: ${error.message}`);
      } else {
        alert('Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.');
      }
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [currentDealerId]);

  // Load data when dealerId is available
  useEffect(() => {
    if (currentDealerId) {
      loadOrders();
      loadContracts();
    }
  }, [currentDealerId, loadOrders]);
  
  // Load all contracts to check status
  const loadContracts = async () => {
    try {
      const allContracts = await getAllContracts();
      setContracts(allContracts);
      console.log('✅ Contracts loaded:', allContracts.length);
    } catch (error) {
      console.error('❌ Error loading contracts:', error);
      setContracts([]);
    }
  };

  // ===== HANDLERS =====
  const handleViewDetail = async (order: Order) => {
    try {
      console.log('👁️ Loading order details:', order.orderId);
      // Gọi API getOrderById để lấy chi tiết đầy đủ
      const { getOrderById } = await import('../services/orderApi');
      const fullOrderData = await getOrderById(order.orderId);
      setSelectedOrder(fullOrderData);
      setShowDetailModal(true);
      console.log('✅ Order details loaded successfully');
    } catch (error: any) {
      console.error('❌ Error loading order details:', error);
      // Fallback: hiển thị data hiện có
      setSelectedOrder(order);
      setShowDetailModal(true);
    }
  };

  const handleViewContract = async (orderId: number | string) => {
    try {
      setDownloadingContractId(orderId);
      console.log('📄 Order:', orderId, '→ Checking contract...');
      
      // Use optimized O(1) lookup to get contractId directly
      const contractId = getContractId(String(orderId));
      
      console.log('🎯 Contract mapping:', orderId, '→', contractId || 'NOT FOUND');
      
      if (!contractId) {
        // Nếu chưa có hợp đồng -> Hiển thị thông báo chờ hãng tạo
        console.log('⏳ No contract found for order:', orderId, '- Waiting for dealer to create contract...');
        setDownloadingContractId(null);
        alert('⏳ Đơn hàng đang chờ hãng tạo hợp đồng.\n\nVui lòng liên hệ với hãng để biết thêm chi tiết.');
        return;
      }
      
      console.log('✅ Contract ID found:', contractId, '- Downloading PDF...');
      
      // Download PDF directly using contractId (optimized!)
      console.log('📥 Downloading contract PDF...');
      const pdfBlob = await downloadContractPdf(contractId);
      console.log('✅ PDF downloaded successfully, size:', (pdfBlob.size / 1024).toFixed(2), 'KB');
      
      // Auto-download file PDF
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `Hop-dong-${contractId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup blob URL
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      
      console.log('💾 PDF downloaded for contract:', contractId);
    } catch (error: any) {
      console.error('❌ Error downloading contract PDF:', error);
      alert(error.message || 'Không thể tải hợp đồng. Vui lòng thử lại.');
    } finally {
      setDownloadingContractId(null);
    }
  };

  const handleViewBill = async (orderId: number | string) => {
    try {
      console.log('📄 Opening bill for order:', orderId);
      
      // Fetch bill from API
      const billBlob = await getBillPreview(orderId);
      
      // Create blob URL and open in new tab
      const blobUrl = URL.createObjectURL(billBlob);
      window.open(blobUrl, '_blank');
      
      // Cleanup blob URL after a short delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      
      console.log('✅ Bill opened successfully');
    } catch (error: any) {
      console.error('❌ Error opening bill:', error);
      
      let errorMessage = 'Không thể mở hóa đơn. Vui lòng thử lại.';
      
      if (error.code === 'BILL_NOT_FOUND') {
        errorMessage = '⚠️ Chưa có hóa đơn cho đơn hàng này. Vui lòng upload hóa đơn trước.';
      } else if (error.code === 'FORBIDDEN') {
        errorMessage = '🚫 Bạn không có quyền xem hóa đơn này.';
      } else if (error.message) {
        errorMessage = `❌ ${error.message}`;
      }
      
      alert(errorMessage);
    }
  };
  
  const handleUploadBill = (orderId: number | string) => {
    // Open file picker for bill upload
    setSelectedOrderIdForUpload(orderId);
    fileInputRef.current?.click();
  };
  
  const handleCancelClick = (order: Order) => {
    setOrderToCancel(order);
    setShowCancelModal(true);
    setCancelReason('');
  };
  
  const handleCancelConfirm = async () => {
    if (!orderToCancel) return;
    
    try {
      setCancellingOrderId(orderToCancel.orderId);
      await cancelOrder(orderToCancel.orderId, cancelReason.trim());
      
      alert(`✅ Đã hủy đơn hàng #${orderToCancel.orderId} thành công!`);
      
      setShowCancelModal(false);
      setOrderToCancel(null);
      setCancelReason('');
      
      await loadOrders();
    } catch (error: any) {
      console.error('❌ Error cancelling order:', error);
      
      let errorMessage = 'Không thể hủy đơn hàng. Vui lòng thử lại.';
      if (error.message) {
        errorMessage = `❌ ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedOrderIdForUpload) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert('⚠️ Vui lòng chọn file ảnh (PNG, JPG) hoặc PDF');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('⚠️ Kích thước file không được vượt quá 10MB');
      return;
    }

    try {
      setUploadingBillOrderId(selectedOrderIdForUpload);
      console.log('📤 Uploading bill for order:', selectedOrderIdForUpload, 'File:', file.name);

      await uploadOrderBill(selectedOrderIdForUpload, file);

      alert(`✅ Đã upload hóa đơn "${file.name}" cho đơn hàng #${selectedOrderIdForUpload} thành công!`);
      console.log('✅ Bill uploaded successfully');
      
      // Mark bill as existing
      const orderIdStr = String(selectedOrderIdForUpload);
      const newBillExistence = { ...billExistence, [orderIdStr]: true };
      setBillExistence(newBillExistence);
      localStorage.setItem('orderBillExistence', JSON.stringify(newBillExistence));
      
      // Reload orders to reflect changes
      await loadOrders();
    } catch (error: any) {
      console.error('❌ Error uploading bill:', error);
      
      // Show detailed error message
      let errorMessage = 'Không thể upload hóa đơn. Vui lòng thử lại.';
      
      if (error.code === 'FORBIDDEN') {
        errorMessage = '🚫 Bạn không có quyền upload hóa đơn cho đơn hàng này.\n\nĐây có thể là đơn hàng của dealer khác.';
      } else if (error.code === 'INVALID_FILE') {
        errorMessage = `⚠️ ${error.message}`;
      } else if (error.code === 'ORDER_NOT_FOUND') {
        errorMessage = '❌ Không tìm thấy đơn hàng này.';
      } else if (error.message) {
        errorMessage = `❌ ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setUploadingBillOrderId(null);
      setSelectedOrderIdForUpload(null);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // ===== FILTER & SORT LOGIC =====
  const filteredOrders = orders.filter(order => {
    // Date range filter
    if (dateFrom || dateTo) {
      const orderDate = order.orderDate ? new Date(order.orderDate) : null;
      if (!orderDate) return false;
      
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (orderDate < fromDate) return false;
      }
      
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (orderDate > toDate) return false;
      }
    }
    
    return true;
  });

  return (
    <div className={styles.pageWrapper}>
      {/* Hidden file input for bill upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,application/pdf"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
      
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerIcon}>
              <i className="fas fa-boxes"></i>
            </div>
            <div className={styles.headerText}>
              <h1>Quản lý đơn hàng</h1>
              <p>Theo dõi và quản lý toàn bộ đơn đặt hàng xe điện</p>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className={styles.filterSection}>
          <div 
            className={`${styles.filterHeader} ${isFilterOpen ? styles.active : ''}`}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            title={isFilterOpen ? 'Ẩn bộ lọc' : 'Hiển thị bộ lọc'}
          >
            <div className={styles.filterTitle}>
              <i className={`fas fa-filter ${isFilterOpen ? styles.iconActive : ''}`}></i>
              {(dateFrom || dateTo) && (
                <span className={styles.activeFilterBadge}></span>
              )}
            </div>
            <i className={`fas fa-chevron-${isFilterOpen ? 'up' : 'down'} ${styles.chevronIcon}`}></i>
          </div>
          
          {isFilterOpen && (
            <div className={styles.filterContent}>
              <div className={styles.filterGroup}>
            {/* Date Range Filter */}
            <div className={styles.dateFilterGroup}>
              <input
                className={styles.dateInput}
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                max={dateTo || undefined}
                placeholder="Từ ngày"
              />
              <input
                className={styles.dateInput}
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                min={dateFrom || undefined}
                placeholder="Đến ngày"
              />
              
              {/* Quick Date Filters */}
              <div className={styles.quickFilters}>
                <button
                  className={styles.quickFilterBtn}
                  onClick={() => {
                    const today = new Date();
                    setDateFrom(today.toISOString().split('T')[0]);
                    setDateTo(today.toISOString().split('T')[0]);
                  }}
                  title="Hôm nay"
                >
                  <i className="fas fa-calendar-day"></i>
                  Hôm nay
                </button>
                <button
                  className={styles.quickFilterBtn}
                  onClick={() => {
                    const today = new Date();
                    const weekAgo = new Date(today);
                    weekAgo.setDate(today.getDate() - 7);
                    setDateFrom(weekAgo.toISOString().split('T')[0]);
                    setDateTo(today.toISOString().split('T')[0]);
                  }}
                  title="7 ngày qua"
                >
                  <i className="fas fa-calendar-week"></i>
                  7 ngày
                </button>
                <button
                  className={styles.quickFilterBtn}
                  onClick={() => {
                    const today = new Date();
                    const monthAgo = new Date(today);
                    monthAgo.setDate(today.getDate() - 30);
                    setDateFrom(monthAgo.toISOString().split('T')[0]);
                    setDateTo(today.toISOString().split('T')[0]);
                  }}
                  title="30 ngày qua"
                >
                  <i className="fas fa-calendar-alt"></i>
                  30 ngày
                </button>
                {(dateFrom || dateTo) && (
                  <button
                    className={`${styles.quickFilterBtn} ${styles.clearBtn}`}
                    onClick={() => {
                      setDateFrom('');
                      setDateTo('');
                    }}
                    title="Xóa lọc ngày"
                  >
                    <i className="fas fa-times"></i>
                    Xóa
                  </button>
                )}
              </div>
            </div>
            
            
          </div>
            </div>
          )}
          
          {/* Filter Results Info - Always visible */}
          <div className={styles.filterResults}>
            <i className="fas fa-info-circle"></i>
            <span>
              Hiển thị <strong>{filteredOrders.length}</strong> / {orders.length} đơn hàng{(dateFrom || dateTo) && ` từ ${dateFrom ? new Date(dateFrom).toLocaleDateString('vi-VN') : '...'} đến ${dateTo ? new Date(dateTo).toLocaleDateString('vi-VN') : '...'}`}
            </span>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className={styles.loading}>
            <i className="fas fa-spinner fa-spin"></i>
            <p>Đang tải...</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Ngày đặt</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Thanh toán</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={styles.emptyState}>
                      <i className="fas fa-inbox"></i>
                      <p>Không có dữ liệu</p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.orderId}>
                      <td className={styles.tableCell}>
                        <span className={styles.orderId} title={`#${order.orderId}`}>
                          #{order.orderId}
                        </span>
                      </td>
                      <td className={styles.tableCell}>
                        {order.orderDate ? new Date(order.orderDate).toLocaleDateString('vi-VN') : 'N/A'}
                      </td>
                      <td className={styles.tableCell}>
                        <span className={styles.price}>
                          {formatPrice(order.grandTotal)}
                        </span>
                      </td>
                      <td className={styles.tableCell}>
                        <span className={`${styles.statusBadge} ${styles[getOrderStatusClass(order.orderStatus)]}`}>
                          {formatOrderStatus(order.orderStatus)}
                        </span>
                      </td>
                      <td className={styles.tableCell}>
                        <span className={`${styles.paymentBadge} ${styles[getPaymentStatusClass(order.paymentStatus)]}`}>
                          {formatPaymentStatus(order.paymentStatus)}
                        </span>
                      </td>
                      <td className={styles.tableCell}>
                        <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                          {/* Cancel order - Show only for non-cancelled orders */}
                          {(order.orderStatus === 'PENDING' || order.orderStatus === 'CONFIRMED' || order.orderStatus === 'CHỜ_DUYỆT') && (
                            <button
                              className={`${styles.actionButton} ${styles.cancel}`}
                              title="Hủy đơn hàng"
                              onClick={() => handleCancelClick(order)}
                              disabled={cancellingOrderId === order.orderId}
                            >
                              {cancellingOrderId === order.orderId ? (
                                <i className="fas fa-spinner fa-spin"></i>
                              ) : (
                                <i className="fas fa-times-circle"></i>
                              )}
                            </button>
                          )}
                          
                          {/* Xem chi tiết */}
                          <button
                            className={`${styles.actionButton} ${styles.view}`}
                            title="Xem chi tiết"
                            onClick={() => handleViewDetail(order)}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          
                          {/* Xem hợp đồng */}
                          <button
                            className={styles.contractButton}
                            title={hasContract(String(order.orderId)) ? "📄 Tải PDF hợp đồng" : "📝 Chờ hãng tạo hợp đồng"}
                            onClick={() => handleViewContract(order.orderId)}
                            disabled={downloadingContractId === order.orderId}
                            style={{
                              backgroundColor: hasContract(String(order.orderId)) ? '#10b981' : '#6366f1'
                            }}
                          >
                            {downloadingContractId === order.orderId ? (
                              <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                              <i className={hasContract(String(order.orderId)) ? "fas fa-file-pdf" : "fas fa-file-contract"}></i>
                            )}
                          </button>
                          
                          {/* Ký hợp đồng - Show when status is SIGNING */}
                          {hasContract(String(order.orderId)) && getContractStatus(order.orderId) === 'SIGNING' && (
                            <button
                              className={styles.signButton}
                              title="✍️ Ký hợp đồng điện tử"
                              onClick={() => {
                                const contractId = getContractId(String(order.orderId));
                                if (contractId) {
                                  navigate(`/contracts/sign/${contractId}`);
                                } else {
                                  alert('Không tìm thấy mã hợp đồng');
                                }
                              }}
                              style={{
                                backgroundColor: '#0ea5e9',
                                color: 'white'
                              }}
                            >
                              <i className="fas fa-signature"></i>
                            </button>
                          )}
                          
                          {/* View Bill - visible when bill exists */}
                          {hasContract(String(order.orderId)) && getContractStatus(order.orderId) === 'ACTIVE' && hasBill(order.orderId) && (
                            <button
                              className={`${styles.actionButton} ${styles.viewBill}`}
                              title="Xem hóa đơn"
                              onClick={() => handleViewBill(order.orderId)}
                            >
                              <i className="fas fa-file-invoice"></i>
                            </button>
                          )}
                          
                          {/* Upload Bill - always visible after contract is ACTIVE (signed) */}
                          {hasContract(String(order.orderId)) && getContractStatus(order.orderId) === 'ACTIVE' && (
                            <button
                              className={`${styles.actionButton} ${styles.upload}`}
                              title={order.billUrl ? 'Tải lại hóa đơn' : 'Upload hóa đơn'}
                              onClick={() => handleUploadBill(order.orderId)}
                              disabled={uploadingBillOrderId === order.orderId}
                            >
                              {uploadingBillOrderId === order.orderId ? (
                                <i className="fas fa-spinner fa-spin"></i>
                              ) : (
                                <i className="fas fa-paperclip"></i>
                              )}
                            </button>
                          )}
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

    {/* Cancel Order Confirmation Modal */}
    {showCancelModal && orderToCancel && (
      <div className={styles.modalOverlay} onClick={() => setShowCancelModal(false)}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
          <div className={styles.modalHeader}>
            <div className={styles.modalHeaderLeft}>
              <div className={styles.modalIcon} style={{ backgroundColor: '#fee2e2' }}>
                <i className="fas fa-exclamation-triangle" style={{ color: '#dc2626' }}></i>
              </div>
              <div className={styles.modalHeaderText}>
                <h2>Xác nhận hủy đơn hàng</h2>
                <p className={styles.orderId}>#{orderToCancel.orderId}</p>
              </div>
            </div>
            <button onClick={() => setShowCancelModal(false)} className={styles.closeBtn}>
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className={styles.modalBody}>
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
              <p style={{ color: '#991b1b', fontSize: '14px', margin: 0 }}>
                <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
                Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác.
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                Lý do hủy đơn (tùy chọn):
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nhập lý do hủy đơn hàng..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCancelModal(false)}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                <i className="fas fa-times" style={{ marginRight: '8px' }}></i>
                Hủy bỏ
              </button>
              <button
                onClick={handleCancelConfirm}
                disabled={cancellingOrderId === orderToCancel.orderId}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: cancellingOrderId === orderToCancel.orderId ? '#9ca3af' : '#dc2626',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: cancellingOrderId === orderToCancel.orderId ? 'not-allowed' : 'pointer'
                }}
              >
                {cancellingOrderId === orderToCancel.orderId ? (
                  <>
                    <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                    Đang hủy...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check" style={{ marginRight: '8px' }}></i>
                    Xác nhận hủy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Order Detail Modal */}
    {showDetailModal && selectedOrder && (
      <div className={styles.modalOverlay} onClick={() => setShowDetailModal(false)}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          {/* Modal Header */}
          <div className={styles.modalHeader}>
            <div className={styles.modalHeaderLeft}>
              <div className={styles.modalIcon}>
                <i className="fas fa-file-invoice"></i>
              </div>
              <div className={styles.modalHeaderText}>
                <h2>Chi tiết đơn hàng</h2>
                <p className={styles.orderId}>#{selectedOrder.orderId}</p>
              </div>
            </div>
            <button onClick={() => setShowDetailModal(false)} className={styles.closeBtn}>
              <i className="fas fa-times"></i>
            </button>
          </div>

          {/* Modal Body */}
          <div className={styles.modalBody}>
            {/* Status Cards Row */}
            <div className={styles.statusCards}>
              <div className={styles.statusCard}>
                <div className={styles.statusCardIcon}>
                  <i className="fas fa-shopping-cart"></i>
                </div>
                <div className={styles.statusCardContent}>
                  <span className={styles.statusCardLabel}>Trạng thái đơn</span>
                  <span className={`${styles.statusBadge} ${styles[getOrderStatusClass(selectedOrder.orderStatus)]}`}>
                    {formatOrderStatus(selectedOrder.orderStatus)}
                  </span>
                </div>
              </div>

              <div className={styles.statusCard}>
                <div className={styles.statusCardIcon}>
                  <i className="fas fa-credit-card"></i>
                </div>
                <div className={styles.statusCardContent}>
                  <span className={styles.statusCardLabel}>Thanh toán</span>
                  <span className={`${styles.statusBadge} ${styles[getPaymentStatusClass(selectedOrder.paymentStatus)]}`}>
                    {formatPaymentStatus(selectedOrder.paymentStatus)}
                  </span>
                </div>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className={styles.modalGrid}>
              {/* Left Column */}
              <div className={styles.modalColumn}>
                {/* Order Info Card */}
                <div className={styles.infoCard}>
                  <div className={styles.infoCardHeader}>
                    <i className="fas fa-info-circle"></i>
                    <h3>Thông tin đơn hàng</h3>
                  </div>
                  <div className={styles.infoCardBody}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>
                        <i className="fas fa-store"></i>
                        Đại lý
                      </span>
                      <span className={styles.infoValue}>{selectedOrder.dealerName || 'N/A'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>
                        <i className="fas fa-calendar-plus"></i>
                        Ngày đặt
                      </span>
                      <span className={styles.infoValue}>{formatDateTime(selectedOrder.orderDate)}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>
                        <i className="fas fa-calendar-check"></i>
                        Ngày giao dự kiến
                      </span>
                      <span className={styles.infoValue}>{formatDate(selectedOrder.desiredDeliveryDate)}</span>
                    </div>
                    {selectedOrder.actualDeliveryDate && (
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>
                          <i className="fas fa-truck"></i>
                          Ngày giao thực tế
                        </span>
                        <span className={styles.infoValue}>{formatDateTime(selectedOrder.actualDeliveryDate)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delivery Address Card */}
                <div className={styles.infoCard}>
                  <div className={styles.infoCardHeader}>
                    <i className="fas fa-map-marker-alt"></i>
                    <h3>Địa chỉ giao hàng</h3>
                  </div>
                  <div className={styles.infoCardBody}>
                    <div className={styles.addressBox}>
                      <i className="fas fa-map-pin"></i>
                      <p>{selectedOrder.deliveryAddress}</p>
                    </div>
                    {selectedOrder.deliveryNote && (
                      <div className={styles.noteBox}>
                        <i className="fas fa-sticky-note"></i>
                        <div>
                          <strong>Ghi chú:</strong>
                          <p>{selectedOrder.deliveryNote}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className={styles.modalColumn}>
                {/* Order Items Card */}
                {selectedOrder.orderItems && selectedOrder.orderItems.length > 0 && (
                  <div className={styles.infoCard}>
                    <div className={styles.infoCardHeader}>
                      <i className="fas fa-car"></i>
                      <h3>Danh sách xe ({selectedOrder.orderItems.length})</h3>
                    </div>
                    <div className={styles.infoCardBody}>
                      <div className={styles.itemsList}>
                        {selectedOrder.orderItems.map((item, index) => (
                          <div key={index} className={styles.orderItem}>
                            <div className={styles.itemLeft}>
                              <div className={styles.itemIcon}>
                                <i className="fas fa-car-side"></i>
                              </div>
                              <div className={styles.itemInfo}>
                                <strong className={styles.itemName}>{item.vehicleName}</strong>
                                {item.color && (
                                  <div className={styles.itemColor}>
                                    <i className="fas fa-palette"></i>
                                    {item.color}
                                  </div>
                                )}
                                <span className={styles.itemQuantity}>
                                  <i className="fas fa-box"></i>
                                  {item.quantity} xe × {formatPrice(item.unitPrice)}
                                </span>
                              </div>
                            </div>
                            <div className={styles.itemRight}>
                              {item.itemDiscount > 0 && (
                                <div className={styles.itemDiscount}>
                                  -{formatPrice(item.itemDiscount)}
                                </div>
                              )}
                              <strong className={styles.itemTotal}>
                                {formatPrice(item.itemTotal)}
                              </strong>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Pricing Summary Card */}
                <div className={styles.infoCard}>
                  <div className={styles.infoCardHeader}>
                    <i className="fas fa-calculator"></i>
                    <h3>Tổng quan thanh toán</h3>
                  </div>
                  <div className={styles.infoCardBody}>
                    <div className={styles.pricingBreakdown}>
                      <div className={styles.priceRow}>
                        <span>Tạm tính:</span>
                        <span>{formatPrice(selectedOrder.subtotal)}</span>
                      </div>
                      {selectedOrder.dealerDiscount > 0 && (
                        <div className={styles.priceRow}>
                          <span>Chiết khấu:</span>
                          <span className={styles.discountAmount}>-{formatPrice(selectedOrder.dealerDiscount)}</span>
                        </div>
                      )}
                      <div className={styles.priceRow}>
                        <span>VAT (10%):</span>
                        <span>{formatPrice(selectedOrder.vatAmount)}</span>
                      </div>
                      <div className={styles.priceDivider}></div>
                      <div className={styles.priceRowTotal}>
                        <span>Tổng cộng:</span>
                        <strong className={styles.totalPrice}>{formatPrice(selectedOrder.grandTotal)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className={styles.modalFooter}>
            <button
              className={styles.closeButton}
              onClick={() => setShowDetailModal(false)}
            >
              <i className="fas fa-times"></i>
              Đóng
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

export default OrderManagementPage;
