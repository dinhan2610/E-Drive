import React, { useState, useEffect } from 'react';
import { getAllOrders } from '../../services/ordersApi';
import type { OrderLite } from '../../types/order';
import styles from './OrderPicker.module.scss';

interface OrderPickerProps {
  selectedOrderId?: string;
  onSelect: (order: OrderLite | null) => void;
}

const OrderPicker: React.FC<OrderPickerProps> = ({ selectedOrderId, onSelect }) => {
  const [orders, setOrders] = useState<OrderLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllOrders();
      setOrders(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const term = searchTerm.toLowerCase();
    return (
      order.code.toLowerCase().includes(term) ||
      order.customer.name.toLowerCase().includes(term) ||
      order.vehicle.model.toLowerCase().includes(term)
    );
  });

  return (
    <div className={styles.orderPicker}>
      <div className={styles.header}>
        <h3>Chọn đơn hàng</h3>
        <input
          type="text"
          placeholder="Tìm mã đơn, khách hàng, xe..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {loading && <div className={styles.loading}>Đang tải...</div>}
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.orderList}>
        {filteredOrders.map((order) => (
          <div
            key={order.id}
            className={`${styles.orderCard} ${selectedOrderId === order.id ? styles.selected : ''}`}
            onClick={() => onSelect(order)}
          >
            <div className={styles.orderCode}>{order.code}</div>
            <div className={styles.customerName}>{order.customer.name}</div>
            <div className={styles.vehicleInfo}>
              {order.vehicle.model} {order.vehicle.variant}
            </div>
            <div className={styles.price}>
              {order.money.subtotal.toLocaleString('vi-VN')} VNĐ
            </div>
            <div className={styles.status}>{order.status}</div>
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 && !loading && (
        <div className={styles.empty}>Không tìm thấy đơn hàng nào</div>
      )}
    </div>
  );
};

export default OrderPicker;
