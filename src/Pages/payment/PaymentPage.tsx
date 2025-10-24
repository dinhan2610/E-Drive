// Payment Page Component
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { startVnPay, payCash } from '../../services/paymentApi';
import { getOrderById } from '../../services/orderApi';
import type { Order } from '../../services/orderApi';
import type { CashRequest } from '../../types/payment';
import styles from './PaymentPage.module.scss';

type PaymentMethod = 'VNPAY' | 'CASH';

const PaymentPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('VNPAY');
  const [cashAmount, setCashAmount] = useState<string>('');
  const [cashNote, setCashNote] = useState('');
  const [cashResult, setCashResult] = useState<any>(null);

  // Load order data
  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) {
        setError('Không tìm thấy mã đơn hàng');
        setLoading(false);
        return;
      }

      try {
        const data = await getOrderById(parseInt(orderId));
        setOrder(data);
        // Set default cash amount to grand total
        setCashAmount(data.grandTotal.toString());
      } catch (err: any) {
        setError(err.message || 'Không thể tải thông tin đơn hàng');
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  // Handle VNPAY payment
  const handleVnPayPayment = async () => {
    if (!order) return;

    setProcessing(true);
    setError(null);

    try {
      const result = await startVnPay(order.orderId);
      // Redirect to VNPAY payment URL
      window.location.href = result.paymentUrl;
    } catch (err: any) {
      setError(err.message || 'Không thể khởi tạo thanh toán VNPAY');
      setProcessing(false);
    }
  };

  // Handle Cash payment
  const handleCashPayment = async () => {
    if (!order) return;

    const amount = parseFloat(cashAmount);
    
    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      setError('Số tiền không hợp lệ');
      return;
    }

    setProcessing(true);
    setError(null);
    setCashResult(null);

    try {
      const payload: CashRequest = {
        orderId: order.orderId,
        amount: amount,
        note: cashNote || undefined,
      };

      const result = await payCash(payload);
      setCashResult(result);
      
      // Reload order to update status
      const updatedOrder = await getOrderById(order.orderId);
      setOrder(updatedOrder);
    } catch (err: any) {
      setError(err.message || 'Không thể xử lý thanh toán tiền mặt');
    } finally {
      setProcessing(false);
    }
  };

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className={styles.wrap}>
        <div className={styles.loading}>
          <i className="fas fa-spinner fa-spin"></i>
          <p>Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className={styles.wrap}>
        <div className={styles.error}>
          <i className="fas fa-exclamation-circle"></i>
          <h2>Có lỗi xảy ra</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/orders')} className={styles.btnBack}>
            Quay lại danh sách đơn hàng
          </button>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const isPaidFull = order.paymentStatus === 'PAID';
  const remaining = order.grandTotal - (order.grandTotal * 0); // Calculate remaining from order

  return (
    <div className={styles.wrap}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <button onClick={() => navigate(`/orders/${order.orderId}`)} className={styles.btnBack}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <div>
            <h1>Thanh toán đơn hàng</h1>
            <p className={styles.orderCode}>Mã đơn: <strong>#{order.orderId}</strong></p>
          </div>
        </div>

        <div className={styles.layout}>
          {/* Left: Payment Methods */}
          <div className={styles.methods}>
            {/* Error Alert */}
            {error && (
              <div className={styles.alert}>
                <i className="fas fa-exclamation-triangle"></i>
                <span>{error}</span>
                <button onClick={() => setError(null)} className={styles.alertClose}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
            )}

            {/* Paid Full Banner */}
            {isPaidFull && (
              <div className={styles.successBanner}>
                <i className="fas fa-check-circle"></i>
                <div>
                  <strong>Đơn hàng đã thanh toán đầy đủ</strong>
                  <p>Cảm ơn bạn đã mua hàng tại E-Drive!</p>
                </div>
              </div>
            )}

            {/* Payment Method Selection */}
            {!isPaidFull && (
              <>
                <h2>Chọn phương thức thanh toán</h2>

                <div className={styles.methodCards}>
                  {/* VNPAY Card */}
                  <div 
                    className={`${styles.methodCard} ${selectedMethod === 'VNPAY' ? styles.active : ''}`}
                    onClick={() => setSelectedMethod('VNPAY')}
                  >
                    <div className={styles.methodIcon}>
                      <i className="fas fa-credit-card"></i>
                    </div>
                    <div className={styles.methodInfo}>
                      <h3>VNPAY</h3>
                      <p>Thanh toán qua cổng VNPAY, hỗ trợ thẻ ATM, VISA, MasterCard</p>
                    </div>
                    {selectedMethod === 'VNPAY' && (
                      <i className="fas fa-check-circle" style={{ color: '#ff4d30' }}></i>
                    )}
                  </div>

                  {/* Cash Card */}
                  <div 
                    className={`${styles.methodCard} ${selectedMethod === 'CASH' ? styles.active : ''}`}
                    onClick={() => setSelectedMethod('CASH')}
                  >
                    <div className={styles.methodIcon}>
                      <i className="fas fa-money-bill-wave"></i>
                    </div>
                    <div className={styles.methodInfo}>
                      <h3>Tiền mặt</h3>
                      <p>Thanh toán trực tiếp bằng tiền mặt tại cửa hàng</p>
                    </div>
                    {selectedMethod === 'CASH' && (
                      <i className="fas fa-check-circle" style={{ color: '#ff4d30' }}></i>
                    )}
                  </div>
                </div>

                {/* VNPAY Payment */}
                {selectedMethod === 'VNPAY' && (
                  <div className={styles.paymentForm}>
                    <div className={styles.vnpayInfo}>
                      <i className="fas fa-info-circle"></i>
                      <p>Bạn sẽ được chuyển đến cổng thanh toán VNPAY để hoàn tất giao dịch</p>
                    </div>
                    <button 
                      onClick={handleVnPayPayment}
                      disabled={processing}
                      className={styles.btnPrimary}
                    >
                      {processing ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-shield-alt"></i>
                          Thanh toán qua VNPAY
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Cash Payment */}
                {selectedMethod === 'CASH' && (
                  <div className={styles.paymentForm}>
                    <div className={styles.formGroup}>
                      <label htmlFor="cashAmount">Số tiền thu (VND) *</label>
                      <input
                        type="number"
                        id="cashAmount"
                        value={cashAmount}
                        onChange={(e) => setCashAmount(e.target.value)}
                        placeholder="Nhập số tiền"
                        disabled={processing}
                      />
                      <small>Số tiền cần thanh toán: {formatVND(order.grandTotal)}</small>
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="cashNote">Ghi chú (tùy chọn)</label>
                      <textarea
                        id="cashNote"
                        value={cashNote}
                        onChange={(e) => setCashNote(e.target.value)}
                        placeholder="Nhập ghi chú nếu có"
                        rows={3}
                        disabled={processing}
                      />
                    </div>

                    <button 
                      onClick={handleCashPayment}
                      disabled={processing || !cashAmount}
                      className={styles.btnPrimary}
                    >
                      {processing ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check"></i>
                          Xác nhận thanh toán
                        </>
                      )}
                    </button>

                    {/* Cash Payment Result */}
                    {cashResult && (
                      <div className={styles.cashResult}>
                        <h3>
                          <i className="fas fa-check-circle"></i>
                          Thanh toán thành công
                        </h3>
                        <div className={styles.resultGrid}>
                          <div>
                            <span>Số tiền đã thu:</span>
                            <strong>{formatVND(cashResult.paidNow)}</strong>
                          </div>
                          <div>
                            <span>Tiền thối:</span>
                            <strong>{formatVND(cashResult.changeAmount)}</strong>
                          </div>
                          <div>
                            <span>Còn lại:</span>
                            <strong className={cashResult.remaining === 0 ? styles.success : ''}>
                              {formatVND(cashResult.remaining)}
                            </strong>
                          </div>
                          <div>
                            <span>Trạng thái:</span>
                            <span className={styles.badge}>{cashResult.paymentStatus}</span>
                          </div>
                        </div>
                        {cashResult.remaining === 0 && (
                          <div className={styles.fullPaidNote}>
                            🎉 Đơn hàng đã được thanh toán đầy đủ!
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right: Order Summary */}
          <div className={styles.summary}>
            <div className={styles.summaryCard}>
              <h3>Thông tin đơn hàng</h3>
              
              <div className={styles.summaryRow}>
                <span>Mã đơn:</span>
                <strong>#{order.orderId}</strong>
              </div>

              <div className={styles.summaryRow}>
                <span>Trạng thái:</span>
                <span className={`${styles.badge} ${styles[order.orderStatus.toLowerCase()]}`}>
                  {order.orderStatus}
                </span>
              </div>

              <div className={styles.divider}></div>

              <div className={styles.summaryRow}>
                <span>Tạm tính:</span>
                <span>{formatVND(order.subtotal)}</span>
              </div>

              <div className={styles.summaryRow}>
                <span>Chiết khấu:</span>
                <span>-{formatVND(order.dealerDiscount)}</span>
              </div>

              <div className={styles.summaryRow}>
                <span>VAT (10%):</span>
                <span>{formatVND(order.vatAmount)}</span>
              </div>

              <div className={styles.divider}></div>

              <div className={styles.summaryRow}>
                <span>Tổng cộng:</span>
                <strong className={styles.total}>{formatVND(order.grandTotal)}</strong>
              </div>

              <div className={styles.summaryRow}>
                <span>Trạng thái thanh toán:</span>
                <span className={`${styles.badge} ${styles[order.paymentStatus.toLowerCase()]}`}>
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
