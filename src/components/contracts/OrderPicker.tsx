import React, { useState, useEffect, useCallback } from 'react';
import { searchOrdersForContract } from '../../services/ordersApi';
import type { OrderLite } from '../../types/order';
import styles from './OrderPicker.module.scss';

interface OrderPickerProps {
  onSelect: (order: OrderLite) => void;
  selectedOrderId?: string;
}

const OrderPicker: React.FC<OrderPickerProps> = ({ onSelect, selectedOrderId }) => {
  const [orders, setOrders] = useState<OrderLite[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderLite[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [debounceTimer, setDebounceTimer] = useState<number | null>(null);

  // Load orders on mount
  useEffect(() => {
    loadOrders();
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceTimer) clearTimeout(debounceTimer);

    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    setDebounceTimer(timer);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [searchQuery]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const data = await searchOrdersForContract();
      // Filter only orders without contract
      const available = data.filter(o => !o.hasContract);
      setOrders(available);
      setFilteredOrders(available);
    } catch (error: any) {
      console.error('Failed to load orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setFilteredOrders(orders);
        return;
      }

      try {
        const data = await searchOrdersForContract(query);
        const available = data.filter(o => !o.hasContract);
        setFilteredOrders(available);
      } catch (error: any) {
        console.error('Search failed:', error);
      }
    },
    [orders]
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const maskPhone = (phone?: string) => {
    if (!phone || phone.length < 4) return phone;
    return phone.slice(0, -4) + '****';
  };

  return (
    <div className={styles.picker}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <i className="fas fa-list-ul"></i>
          Chọn đơn đặt hàng
        </h3>
        <p className={styles.subtitle}>Chỉ hiển thị đơn chưa có hợp đồng</p>
      </div>

      <div className={styles.search}>
        <i className="fas fa-search"></i>
        <input
          type="text"
          placeholder="Tìm mã đơn, tên khách, SĐT, model..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
        {searchQuery && (
          <button
            className={styles.clearBtn}
            onClick={() => setSearchQuery('')}
            aria-label="Xóa tìm kiếm"
          >
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>

      <div className={styles.orderList}>
        {isLoading ? (
          <div className={styles.loading}>
            <i className="fas fa-spinner fa-spin"></i>
            <p>Đang tải...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className={styles.empty}>
            <i className="fas fa-inbox"></i>
            <p>Không tìm thấy đơn hàng</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div
              key={order.id}
              className={`${styles.orderCard} ${
                selectedOrderId === order.id ? styles.selected : ''
              }`}
              onClick={() => onSelect(order)}
            >
              <div className={styles.cardHeader}>
                <span className={styles.orderCode}>{order.code}</span>
                <span className={`${styles.statusBadge} ${styles[order.status.toLowerCase()]}`}>
                  {order.status}
                </span>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.infoRow}>
                  <i className="fas fa-user"></i>
                  <span>{order.customer.name}</span>
                </div>
                <div className={styles.infoRow}>
                  <i className="fas fa-phone"></i>
                  <span>{maskPhone(order.customer.phone)}</span>
                </div>
                <div className={styles.infoRow}>
                  <i className="fas fa-store"></i>
                  <span>{order.dealer.name}</span>
                </div>
                <div className={styles.infoRow}>
                  <i className="fas fa-car"></i>
                  <span>
                    {order.vehicle.model}
                    {order.vehicle.variant && ` ${order.vehicle.variant}`}
                    {order.vehicle.color && ` - ${order.vehicle.color}`}
                  </span>
                </div>
                {order.vehicle.vin && (
                  <div className={styles.infoRow}>
                    <i className="fas fa-barcode"></i>
                    <span className={styles.vin}>{order.vehicle.vin}</span>
                  </div>
                )}
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.moneyInfo}>
                  <div className={styles.moneyRow}>
                    <span>Tổng tiền:</span>
                    <strong>{formatCurrency(order.money.total)}</strong>
                  </div>
                  {order.money.paidTotal > 0 && (
                    <div className={styles.moneyRow}>
                      <span>Đã thu:</span>
                      <span className={styles.paid}>{formatCurrency(order.money.paidTotal)}</span>
                    </div>
                  )}
                  {order.money.remaining > 0 && (
                    <div className={styles.moneyRow}>
                      <span>Còn lại:</span>
                      <span className={styles.remaining}>
                        {formatCurrency(order.money.remaining)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrderPicker;
