// Payment Return Page (VNPAY Callback)
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { handleVnPayReturn } from '../../services/paymentApi';
import type { VnPayReturnPayload } from '../../types/payment';
import styles from './PaymentPage.module.scss';

const PaymentReturnPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VnPayReturnPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processReturn = async () => {
      try {
        const data = await handleVnPayReturn(searchParams);
        setResult(data);
      } catch (err: any) {
        setError(err.message || 'Không thể xác thực giao dịch');
      } finally {
        setLoading(false);
      }
    };

    processReturn();
  }, [searchParams]);

  const formatVND = (amount: string | undefined) => {
    if (!amount) return '0 ₫';
    const num = parseInt(amount) / 100; // VNPAY returns amount in smallest unit
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(num);
  };

  const getOrderIdFromInfo = (orderInfo: string | undefined): string => {
    if (!orderInfo) return '';
    // Extract orderId from orderInfo (format: "Payment for order #123")
    const match = orderInfo.match(/#(\d+)/);
    return match ? match[1] : '';
  };

  if (loading) {
    return (
      <div className={styles.wrap}>
        <div className={styles.returnContainer}>
          <div className={styles.loading}>
            <i className="fas fa-spinner fa-spin"></i>
            <h2>Đang xác thực giao dịch...</h2>
            <p>Vui lòng đợi trong giây lát</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.wrap}>
        <div className={styles.returnContainer}>
          <div className={styles.resultCard}>
            <div className={styles.resultIcon} style={{ color: '#ff4444' }}>
              <i className="fas fa-times-circle"></i>
            </div>
            <h2>Giao dịch thất bại</h2>
            <p className={styles.errorMessage}>{error}</p>
            <div className={styles.resultActions}>
              <button onClick={() => navigate('/orders')} className={styles.btnSecondary}>
                Về danh sách đơn hàng
              </button>
              <button onClick={() => navigate('/')} className={styles.btnPrimary}>
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isSuccess = result?.vnp_ResponseCode === '00' && result?.vnp_TransactionStatus === '00';
  const orderId = getOrderIdFromInfo(result?.vnp_OrderInfo);

  return (
    <div className={styles.wrap}>
      <div className={styles.returnContainer}>
        <div className={styles.resultCard}>
          {isSuccess ? (
            <>
              <div className={styles.resultIcon} style={{ color: '#00C851' }}>
                <i className="fas fa-check-circle"></i>
              </div>
              <h2>Thanh toán thành công!</h2>
              <p>Giao dịch của bạn đã được xử lý thành công</p>

              <div className={styles.transactionDetails}>
                <div className={styles.detailRow}>
                  <span>Mã giao dịch:</span>
                  <strong>{result?.vnp_TransactionNo || 'N/A'}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Số tiền:</span>
                  <strong>{formatVND(result?.vnp_Amount)}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Ngân hàng:</span>
                  <strong>{result?.vnp_BankCode || 'N/A'}</strong>
                </div>
                {orderId && (
                  <div className={styles.detailRow}>
                    <span>Mã đơn hàng:</span>
                    <strong>#{orderId}</strong>
                  </div>
                )}
              </div>

              <div className={styles.resultActions}>
                {orderId && (
                  <button 
                    onClick={() => navigate(`/orders/${orderId}`)} 
                    className={styles.btnSecondary}
                  >
                    Xem đơn hàng
                  </button>
                )}
                <button onClick={() => navigate('/')} className={styles.btnPrimary}>
                  Về trang chủ
                </button>
              </div>
            </>
          ) : (
            <>
              <div className={styles.resultIcon} style={{ color: '#ff4444' }}>
                <i className="fas fa-times-circle"></i>
              </div>
              <h2>Thanh toán thất bại</h2>
              <p>Giao dịch của bạn không thể hoàn tất</p>

              <div className={styles.transactionDetails}>
                <div className={styles.detailRow}>
                  <span>Mã lỗi:</span>
                  <strong>{result?.vnp_ResponseCode || 'N/A'}</strong>
                </div>
                {result?.vnp_TransactionNo && (
                  <div className={styles.detailRow}>
                    <span>Mã tham chiếu:</span>
                    <strong>{result.vnp_TransactionNo}</strong>
                  </div>
                )}
              </div>

              <div className={styles.resultActions}>
                {orderId && (
                  <button 
                    onClick={() => navigate(`/orders/${orderId}/payment`)} 
                    className={styles.btnSecondary}
                  >
                    Thử lại
                  </button>
                )}
                <button onClick={() => navigate('/orders')} className={styles.btnPrimary}>
                  Về danh sách đơn hàng
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentReturnPage;
