import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackByPhoneWithOtp } from '../services/trackingApi';
import type { TrackingItem } from '../types/tracking';
import OrderDetailModal from '../components/order/OrderDetailModal';
import OrderEditModal from '../components/order/OrderEditModal';
import styles from '../styles/OrderStyles/OrderManagement.module.scss';

const formatDate = (datetime: string) => {
  try {
    const date = new Date(datetime);
    return date.toLocaleDateString('vi-VN');
  } catch {
    return datetime;
  }
};

const formatTime = (datetime: string) => {
  try {
    const date = new Date(datetime);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return datetime;
  }
};

const getStatusLabel = (status: string) => {
  switch(status) {
    case 'CONFIRMED': return 'Đã xác nhận';
    case 'ALLOCATED': return 'Đã phân bổ xe';
    case 'IN_TRANSIT': return 'Đang vận chuyển';
    case 'AT_DEALER': return 'Đã về đại lý';
    case 'SCHEDULED': return 'Đã hẹn giao';
    case 'DELIVERED': return 'Đã giao xe';
    case 'ON_HOLD': return 'Tạm dừng';
    case 'CANCELLED': return 'Đã hủy';
    default: return status;
  }
};

const OrderManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<TrackingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<TrackingItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      
      // Mock data - trong thực tế sẽ gọi API để lấy tất cả đơn hàng
      const data = await trackByPhoneWithOtp("0912345678", "123456");
      setOrders(data);
    } catch (error: any) {
      console.error('Error loading orders:', error);
      alert('❌ Không thể tải danh sách đơn hàng');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOrder = async (order: TrackingItem) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa đơn hàng ${order.code} không?`)) return;
    
    try {
      // TODO: Implement delete API
      setOrders(prev => prev.filter(o => o.id !== order.id));
      alert('✅ Đã xóa đơn hàng thành công!');
    } catch (error: any) {
      console.error('Delete error:', error);
      alert(`❌ ${error.message || 'Không thể xóa đơn hàng'}`);
    }
  };

  const handleViewDetail = (order: TrackingItem) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleEdit = (order: TrackingItem) => {
    setSelectedOrder(order);
    setShowEditModal(true);
  };

  const handleEditFromDetail = () => {
    setShowDetailModal(false);
    setShowEditModal(true);
  };

  const handleEditSuccess = (updated: TrackingItem) => {
    setOrders(prev => prev.map(o => 
      o.id === updated.id ? updated : o
    ));
    loadOrders(); // Reload to get fresh data
  };

  const filteredOrders = filterStatus === 'ALL' 
    ? orders 
    : orders.filter(o => o.status === filterStatus);

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerIcon}>
              <i className="fas fa-shipping-fast"></i>
            </div>
            <div className={styles.headerText}>
              <h1>Quản lý tình trạng đơn hàng</h1>
              <p>Theo dõi và quản lý toàn bộ đơn hàng xe điện</p>
            </div>
          </div>
        </div>

        <div className={styles.filterSection}>
          <div className={styles.filterButtons}>
            <button 
              className={`${styles.filterButton} ${filterStatus === 'ALL' ? styles.active : ''}`}
              onClick={() => setFilterStatus('ALL')}
            >
              Tất cả ({orders.length})
            </button>
            <button 
              className={`${styles.filterButton} ${filterStatus === 'CONFIRMED' ? styles.active : ''}`}
              onClick={() => setFilterStatus('CONFIRMED')}
            >
              Đã xác nhận ({orders.filter(o => o.status === 'CONFIRMED').length})
            </button>
            <button 
              className={`${styles.filterButton} ${filterStatus === 'IN_TRANSIT' ? styles.active : ''}`}
              onClick={() => setFilterStatus('IN_TRANSIT')}
            >
              Đang vận chuyển ({orders.filter(o => o.status === 'IN_TRANSIT').length})
            </button>
            <button 
              className={`${styles.filterButton} ${filterStatus === 'SCHEDULED' ? styles.active : ''}`}
              onClick={() => setFilterStatus('SCHEDULED')}
            >
              Đã hẹn giao ({orders.filter(o => o.status === 'SCHEDULED').length})
            </button>
            <button 
              className={`${styles.filterButton} ${filterStatus === 'DELIVERED' ? styles.active : ''}`}
              onClick={() => setFilterStatus('DELIVERED')}
            >
              Đã giao xe ({orders.filter(o => o.status === 'DELIVERED').length})
            </button>
          </div>
        </div>

        {isLoading ? (
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
                  <th>Khách hàng</th>
                  <th>Xe</th>
                  <th>Màu sắc</th>
                  <th>VIN</th>
                  <th>Đại lý</th>
                  <th>Lịch giao</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className={styles.emptyState}>
                      <i className="fas fa-inbox"></i>
                      <p>Không có dữ liệu</p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr key={order.id}>
                      <td>
                        <div className={styles.codeCell}>
                          <span className={styles.code}>{order.code}</span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.customerInfo}>
                          <div className={styles.customerName}>{order.customerName}</div>
                          <div className={styles.customerPhone}>{order.customerPhoneMasked}</div>
                        </div>
                      </td>
                      <td>
                        <div className={styles.vehicleInfo}>
                          <div className={styles.model}>{order.vehicle.model}</div>
                          {order.vehicle.variant && (
                            <div className={styles.variant}>{order.vehicle.variant}</div>
                          )}
                        </div>
                      </td>
                      <td>{order.vehicle.color || '—'}</td>
                      <td>
                        {order.vehicle.vin ? (
                          <div className={styles.vinCell}>
                            <span className={styles.vin}>{order.vehicle.vin}</span>
                          </div>
                        ) : (
                          <span className={styles.noData}>Chưa có</span>
                        )}
                      </td>
                      <td>
                        <div className={styles.dealerInfo}>
                          <div className={styles.dealerName}>{order.dealerName}</div>
                          {order.dealerPhone && (
                            <div className={styles.dealerPhone}>{order.dealerPhone}</div>
                          )}
                        </div>
                      </td>
                      <td>
                        {order.appointment?.date ? (
                          <div className={styles.timeInfo}>
                            <div className={styles.date}>{formatDate(order.appointment.date)}</div>
                            <div className={styles.time}>{formatTime(order.appointment.date)}</div>
                          </div>
                        ) : (
                          <span className={styles.noData}>Chưa hẹn</span>
                        )}
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[order.status.toLowerCase()]}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button 
                            className={`${styles.actionButton} ${styles.view}`}
                            title="Xem chi tiết"
                            onClick={() => handleViewDetail(order)}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button 
                            className={`${styles.actionButton} ${styles.edit}`}
                            title="Chỉnh sửa"
                            onClick={() => handleEdit(order)}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button 
                            className={`${styles.actionButton} ${styles.contract}`}
                            title="Tạo hợp đồng"
                            onClick={() => navigate(`/admin/contracts/new?orderId=${order.id}`)}
                          >
                            <i className="fas fa-file-contract"></i>
                          </button>
                          <button 
                            className={`${styles.actionButton} ${styles.delete}`}
                            title="Xóa"
                            onClick={() => handleDeleteOrder(order)}
                          >
                            <i className="fas fa-trash"></i>
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

        {/* Modals */}
        {showDetailModal && selectedOrder && (
          <OrderDetailModal
            order={selectedOrder}
            onClose={() => setShowDetailModal(false)}
            onEdit={handleEditFromDetail}
          />
        )}

        {showEditModal && selectedOrder && (
          <OrderEditModal
            order={selectedOrder}
            onClose={() => setShowEditModal(false)}
            onSuccess={handleEditSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default OrderManagementPage;
