import { useState, useEffect } from "react";
import { trackByPhoneWithOtp } from "../../services/trackingApi";
import type { TrackingItem } from "../../types/tracking";
import styles from "../../styles/TrackingStyles/TrackingPage.module.scss";

export default function TrackingPage() {
  const [orders, setOrders] = useState<TrackingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statusConfig = {
    CONFIRMED: { color: "#3b82f6", label: "Đã xác nhận" },
    ALLOCATED: { color: "#8b5cf6", label: "Đã phân bổ xe" },
    IN_TRANSIT: { color: "#14b8a6", label: "Đang vận chuyển" },
    AT_DEALER: { color: "#6366f1", label: "Đã về đại lý" },
    SCHEDULED: { color: "#f97316", label: "Đã hẹn giao" },
    DELIVERED: { color: "#22c55e", label: "Đã giao xe" },
    ON_HOLD: { color: "#9ca3af", label: "Tạm dừng" },
    CANCELLED: { color: "#ef4444", label: "Đã hủy" }
  };

  // Load all orders on mount
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Mock: load multiple orders (in production, this would be an API call to get all orders)
      const results = await trackByPhoneWithOtp("0912345678", "123456");
      setOrders(results);
    } catch (err) {
      setError("Không thể tải danh sách đơn hàng. Vui lòng thử lại.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`Đã sao chép: ${text}`);
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Theo dõi tình trạng đơn hàng</h1>
          <p className={styles.pageSubtitle}>
            Danh sách tất cả đơn hàng hiện tại
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className={styles.error}>
            <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Orders Table */}
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Đang tải danh sách đơn hàng...</p>
          </div>
        ) : (
          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <h2 className={styles.tableTitle}>Danh sách đơn hàng</h2>
              <span className={styles.tableCount}>{orders.length} đơn hàng</span>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Khách hàng</th>
                    <th>Xe</th>
                    <th>Màu sắc</th>
                    <th>VIN</th>
                    <th>Trạng thái</th>
                    <th>Đại lý</th>
                    <th>Lịch giao</th>
                    <th>Cập nhật</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const config = statusConfig[order.status];
                    return (
                      <tr key={order.id}>
                        <td>
                          <div className={styles.codeCell}>
                            <span className={styles.code}>{order.code}</span>
                            <button
                              className={styles.copyBtn}
                              onClick={() => copyToClipboard(order.code)}
                              aria-label="Sao chép"
                            >
                              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td>
                          <div className={styles.customerCell}>
                            <span className={styles.name}>{order.customerName}</span>
                            <span className={styles.phone}>{order.customerPhoneMasked}</span>
                          </div>
                        </td>
                        <td>
                          <div className={styles.vehicleCell}>
                            <span className={styles.model}>{order.vehicle.model}</span>
                            {order.vehicle.variant && (
                              <span className={styles.variant}>{order.vehicle.variant}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={styles.color}>{order.vehicle.color || "—"}</span>
                        </td>
                        <td>
                          {order.vehicle.vin ? (
                            <div className={styles.vinCell}>
                              <span className={styles.vin}>{order.vehicle.vin}</span>
                              <button
                                className={styles.copyBtn}
                                onClick={() => copyToClipboard(order.vehicle.vin!)}
                                aria-label="Sao chép VIN"
                              >
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <span className={styles.noData}>Chưa có</span>
                          )}
                        </td>
                        <td>
                          <span
                            className={styles.statusBadge}
                            style={{ backgroundColor: `${config.color}15`, color: config.color }}
                          >
                            {config.label}
                          </span>
                        </td>
                        <td>
                          <div className={styles.dealerCell}>
                            <span className={styles.dealerName}>{order.dealerName}</span>
                            {order.dealerPhone && (
                              <a href={`tel:${order.dealerPhone}`} className={styles.dealerPhone}>
                                {order.dealerPhone}
                              </a>
                            )}
                          </div>
                        </td>
                        <td>
                          {order.appointment?.date ? (
                            <span className={styles.date}>{formatDate(order.appointment.date)}</span>
                          ) : (
                            <span className={styles.noData}>Chưa hẹn</span>
                          )}
                        </td>
                        <td>
                          <span className={styles.date}>{formatDate(order.updatedAt)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
