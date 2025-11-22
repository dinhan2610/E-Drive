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
  const [countdown, setCountdown] = useState(5);

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

  // Auto redirect to dealer-order page after 5 seconds
  useEffect(() => {
    if (!loading && (result || error)) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/dealer-order', { state: { activeTab: 'list' } });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [loading, result, error, navigate]);

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
            <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
              Tự động chuyển về đơn hàng sau {countdown} giây...
            </p>
            <div className={styles.resultActions}>
              <button onClick={() => navigate('/dealer-order', { state: { activeTab: 'list' } })} className={styles.btnSecondary}>
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

  // VNPay success: vnp_ResponseCode === '00'
  // vnp_TransactionStatus may not always be present, so check it optionally
  const isSuccess = result?.vnp_ResponseCode === '00';
  const orderId = getOrderIdFromInfo(result?.vnp_OrderInfo);
  
  console.log('🔍 Payment result:', result);
  console.log('✅ isSuccess:', isSuccess);

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
              <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                Tự động chuyển về đơn hàng sau {countdown} giây...
              </p>

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
                <button 
                  onClick={() => navigate('/dealer-order', { state: { activeTab: 'list' } })} 
                  className={styles.btnSecondary}
                >
                  Xem đơn hàng của tôi
                </button>
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
              <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                Tự động chuyển về đơn hàng sau {countdown} giây...
              </p>

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
                <button 
                  onClick={() => navigate('/dealer-order', { state: { activeTab: 'list' } })} 
                  className={styles.btnSecondary}
                >
                  Về đơn hàng của tôi
                </button>
                <button onClick={() => navigate('/')} className={styles.btnPrimary}>
                  Về trang chủ
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
