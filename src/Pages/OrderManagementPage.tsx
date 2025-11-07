import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getOrdersByDealer,
  formatOrderStatus,
  formatPaymentStatus,
  uploadOrderBill,
  type Order,
  OrderApiError 
} from '../services/orderApi';
import { getProfile } from '../services/profileApi';
import { downloadContractPdf } from '../services/contractsApi';
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
  // Order data state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentDealerId, setCurrentDealerId] = useState<number | null>(null);
  
  // Search and filter state
  const [filterStatus, setFilterStatus] = useState<'ALL' | string>('ALL');
  
  // Modal and UI state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Download state
  const [downloadingContractId, setDownloadingContractId] = useState<number | string | null>(null);
  const [uploadingBillOrderId, setUploadingBillOrderId] = useState<number | string | null>(null);
  
  // File input ref for bill upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedOrderIdForUpload, setSelectedOrderIdForUpload] = useState<number | string | null>(null);
  
  // Use contract check hook for optimized one-contract-per-order lookup
  const { hasContract, getContractId } = useContractCheck();

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
    if (!currentDealerId) {
      console.warn('⚠️ No dealerId available, skipping order load');
      return;
    }
    
    setLoading(true);
    try {
      console.log(`🔄 Loading orders for dealer ${currentDealerId}...`);
      const fetchedOrders = await getOrdersByDealer(currentDealerId);
      
      // Sort orders by newest first
      const sortedOrders = [...fetchedOrders].sort((a, b) => {
        const dateA = new Date(a.orderDate || 0).getTime();
        const dateB = new Date(b.orderDate || 0).getTime();
        return dateB - dateA; // newest first
      });
      
      setOrders(sortedOrders);
      console.log('✅ Orders loaded successfully:', sortedOrders.length);
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
    }
  }, [currentDealerId, loadOrders]);

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

  const handleViewFiles = async (orderId: number | string) => {
    // Open file picker for bill upload
    setSelectedOrderIdForUpload(orderId);
    fileInputRef.current?.click();
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

  // Handler for status filter
  const handleStatusFilter = (status: string) => {
    setFilterStatus(status);
  };

  // ===== FILTER & SORT LOGIC =====
  const filteredOrders = orders.filter(order => {
    // Status filter
    if (filterStatus !== 'ALL' && order.orderStatus !== filterStatus) {
      return false;
    }
    return true;
  });

  // ===== STATISTICS =====
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.orderStatus === 'PENDING').length,
    confirmed: orders.filter(o => o.orderStatus === 'CONFIRMED').length,
    processing: orders.filter(o => o.orderStatus === 'PROCESSING').length,
    shipped: orders.filter(o => o.orderStatus === 'SHIPPED').length,
    delivered: orders.filter(o => o.orderStatus === 'DELIVERED').length,
    cancelled: orders.filter(o => o.orderStatus === 'CANCELLED').length,
  };

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
          <div className={styles.filterButtons}>
            <button 
              className={`${styles.filterButton} ${filterStatus === 'ALL' ? styles.active : ''}`}
              onClick={() => handleStatusFilter('ALL')}
            >
              Tất cả ({stats.total})
            </button>
            <button 
              className={`${styles.filterButton} ${filterStatus === 'PENDING' ? styles.active : ''}`}
              onClick={() => handleStatusFilter('PENDING')}
            >
              Chờ xử lý ({stats.pending})
            </button>
            <button 
              className={`${styles.filterButton} ${filterStatus === 'CONFIRMED' ? styles.active : ''}`}
              onClick={() => handleStatusFilter('CONFIRMED')}
            >
              Đã xác nhận ({stats.confirmed})
            </button>
            <button 
              className={`${styles.filterButton} ${filterStatus === 'PROCESSING' ? styles.active : ''}`}
              onClick={() => handleStatusFilter('PROCESSING')}
            >
              Đang xử lý ({stats.processing})
            </button>
            <button 
              className={`${styles.filterButton} ${filterStatus === 'SHIPPED' ? styles.active : ''}`}
              onClick={() => handleStatusFilter('SHIPPED')}
            >
              Đang giao ({stats.shipped})
            </button>
            <button 
              className={`${styles.filterButton} ${filterStatus === 'DELIVERED' ? styles.active : ''}`}
              onClick={() => handleStatusFilter('DELIVERED')}
            >
              Đã giao ({stats.delivered})
            </button>
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
                  <th>Địa chỉ</th>
                  <th>SL xe</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Thanh toán</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles.emptyState}>
                      <i className="fas fa-inbox"></i>
                      <p>Không có dữ liệu</p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.orderId}>
                      <td className={styles.tableCell}>
                        <span className={styles.orderId} title={`#${order.orderId}`}>
                          #{String(order.orderId).length > 8 
                            ? `${String(order.orderId).substring(0, 8)}...` 
                            : order.orderId}
                        </span>
                      </td>
                      <td className={styles.tableCell}>
                        <span className={styles.address} title={order.deliveryAddress}>
                          {order.deliveryAddress}
                        </span>
                      </td>
                      <td className={`${styles.tableCell} ${styles.centerAlign}`}>
                        {order.orderItems?.length || 0}
                      </td>
                      <td className={styles.tableCell}>
                        <span className={styles.price}>
                          {formatPrice(order.grandTotal)}
                        </span>
                      </td>
                      <td className={styles.tableCell}>
                        <span className={`${styles.statusBadge} ${styles[order.orderStatus.toLowerCase()]}`}>
                          {formatOrderStatus(order.orderStatus)}
                        </span>
                      </td>
                      <td className={styles.tableCell}>
                        <span className={`${styles.paymentBadge} ${styles[order.paymentStatus.toLowerCase()]}`}>
                          {formatPaymentStatus(order.paymentStatus)}
                        </span>
                      </td>
                      <td className={styles.tableCell}>
                        <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
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
                          
                          {/* Upload hóa đơn */}
                          <button
                            className={`${styles.actionButton} ${styles.upload}`}
                            title="Upload hóa đơn"
                            onClick={() => handleViewFiles(order.orderId)}
                            disabled={uploadingBillOrderId === order.orderId}
                          >
                            {uploadingBillOrderId === order.orderId ? (
                              <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                              <i className="fas fa-paperclip"></i>
                            )}
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
                  <span className={`${styles.statusBadge} ${styles[selectedOrder.orderStatus.toLowerCase()]}`}>
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
                  <span className={`${styles.statusBadge} ${styles[selectedOrder.paymentStatus.toLowerCase()]}`}>
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
