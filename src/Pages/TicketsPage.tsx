import React, { useState, useEffect } from 'react';
import { listFeedbacks, deleteFeedback } from '../services/feedbackApi';
import { getProfile } from '../services/profileApi';
import type { Feedback } from '../types/feedback';
import styles from '../styles/TicketsStyles/TicketsPage.module.scss';

const formatDate = (datetime: string) => {
  try {
    const date = new Date(datetime);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return datetime;
  }
};

const TicketsPage: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterRating, setFilterRating] = useState<number | undefined>(undefined);
  const [dealerId, setDealerId] = useState<number | null>(null);

  useEffect(() => {
    loadDealerProfile();
  }, []);

  useEffect(() => {
    if (dealerId !== null) {
      loadFeedbacks();
    }
  }, [dealerId]);

  const loadDealerProfile = async () => {
    try {
      console.log('🔍 [Tickets] Loading dealer profile...');
      const profile = await getProfile();
      console.log('✅ [Tickets] Dealer ID:', profile.dealerId);
      setDealerId(profile.dealerId);
    } catch (error) {
      console.error('❌ [Tickets] Error loading dealer profile:', error);
    }
  };

  const loadFeedbacks = async () => {
    if (dealerId === null) {
      console.log('⏳ [Tickets] Waiting for dealer ID...');
      return;
    }

    try {
      setIsLoading(true);
      console.log(`📋 [Tickets] Loading feedbacks for dealer ${dealerId}...`);
      
      const data = await listFeedbacks({ 
        page: 0, 
        size: 100,
        dealerId: dealerId
      });
      
      console.log(`✅ [Tickets] Loaded ${data.content?.length || 0} feedbacks`);
      setFeedbacks(data.content);
    } catch (error) {
      console.error('❌ [Tickets] Error loading feedbacks:', error);
      alert('❌ Không thể tải danh sách phản hồi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFeedback = async (feedback: Feedback) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa phản hồi #${feedback.feedbackId} không?\n\nNội dung: "${feedback.content.substring(0, 50)}..."`)) return;
    
    try {
      await deleteFeedback(feedback.feedbackId);
      setFeedbacks(prev => prev.filter(f => f.feedbackId !== feedback.feedbackId));
      alert('✅ Đã xóa phản hồi thành công!');
    } catch (error: any) {
      console.error('Delete error:', error);
      alert(`❌ ${error.message || 'Không thể xóa phản hồi'}`);
    }
  };

  const handleViewDetail = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setShowDetailModal(true);
  };

  const filteredFeedbacks = filterRating 
    ? feedbacks.filter(f => f.rating === filterRating)
    : feedbacks;

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerIcon}>
              <i className="fas fa-star"></i>
            </div>
            <div className={styles.headerText}>
              <h1>Quản lý phản hồi khách hàng</h1>
              <p>Theo dõi và quản lý các đánh giá và phản hồi từ khách hàng</p>
            </div>
          </div>
        </div>

        <div className={styles.filterSection}>
          <div className={styles.filterButtons}>
            <button 
              className={`${styles.filterButton} ${!filterRating ? styles.active : ''}`}
              onClick={() => setFilterRating(undefined)}
            >
              Tất cả ({feedbacks.length})
            </button>
            <button 
              className={`${styles.filterButton} ${filterRating === 5 ? styles.active : ''}`}
              onClick={() => setFilterRating(5)}
            >
              ⭐ 5 sao ({feedbacks.filter(f => f.rating === 5).length})
            </button>
            <button 
              className={`${styles.filterButton} ${filterRating === 4 ? styles.active : ''}`}
              onClick={() => setFilterRating(4)}
            >
              ⭐ 4 sao ({feedbacks.filter(f => f.rating === 4).length})
            </button>
            <button 
              className={`${styles.filterButton} ${filterRating === 3 ? styles.active : ''}`}
              onClick={() => setFilterRating(3)}
            >
              ⭐ 3 sao ({feedbacks.filter(f => f.rating === 3).length})
            </button>
            <button 
              className={`${styles.filterButton} ${filterRating && filterRating <= 2 ? styles.active : ''}`}
              onClick={() => setFilterRating(2)}
            >
              ⭐ ≤ 2 sao ({feedbacks.filter(f => f.rating <= 2).length})
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
                  <th>ID</th>
                  <th>Đánh giá</th>
                  <th>Nội dung</th>
                  <th>Khách hàng</th>
                  <th>Đại lý</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeedbacks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles.emptyState}>
                      <i className="fas fa-inbox"></i>
                      <p>Không có dữ liệu</p>
                    </td>
                  </tr>
                ) : (
                  filteredFeedbacks.map(feedback => (
                    <tr key={feedback.feedbackId}>
                      <td className={styles.idCell}>#{feedback.feedbackId}</td>
                      <td>
                        <div className={styles.ratingCell}>
                          <div className={styles.stars}>
                            {'⭐'.repeat(feedback.rating)}
                          </div>
                          <span className={styles.ratingNumber}>({feedback.rating}/5)</span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.contentCell}>
                          {feedback.content.length > 100 
                            ? `${feedback.content.substring(0, 100)}...` 
                            : feedback.content}
                        </div>
                      </td>
                      <td className={styles.customerCell}>
                        <div>ID: #{feedback.customerId}</div>
                        {feedback.customerName && <div className={styles.customerName}>{feedback.customerName}</div>}
                      </td>
                      <td className={styles.dealerCell}>
                        <div>ID: #{feedback.dealerId}</div>
                        {feedback.dealerName && <div className={styles.dealerName}>{feedback.dealerName}</div>}
                      </td>
                      <td className={styles.dateCell}>{formatDate(feedback.createdAt)}</td>
                      <td>
                        <div className={styles.actions}>
                          <button 
                            className={`${styles.actionButton} ${styles.view}`}
                            title="Xem chi tiết"
                            onClick={() => handleViewDetail(feedback)}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button 
                            className={`${styles.actionButton} ${styles.delete}`}
                            title="Xóa"
                            onClick={() => handleDeleteFeedback(feedback)}
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

        {/* Detail Modal */}
        {showDetailModal && selectedFeedback && (
          <div className={styles.modalOverlay} onClick={() => setShowDetailModal(false)}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>
                  <i className="fas fa-star"></i>
                  Chi tiết phản hồi #{selectedFeedback.feedbackId}
                </h2>
                <button className={styles.closeButton} onClick={() => setShowDetailModal(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.detailRow}>
                  <label>
                    <i className="fas fa-star-half-alt"></i>
                    Đánh giá
                  </label>
                  <div className={styles.ratingDetail}>
                    <div className={styles.stars}>
                      {'⭐'.repeat(selectedFeedback.rating)}
                    </div>
                    <span>({selectedFeedback.rating}/5 sao)</span>
                  </div>
                </div>
                <div className={styles.detailRow}>
                  <label>
                    <i className="fas fa-comment-dots"></i>
                    Nội dung phản hồi
                  </label>
                  <div className={styles.contentDetail}>{selectedFeedback.content}</div>
                </div>
                <div className={styles.detailRow}>
                  <label>
                    <i className="fas fa-user"></i>
                    Thông tin khách hàng
                  </label>
                  <div>
                    ID: #{selectedFeedback.customerId}
                    {selectedFeedback.customerName && ` - ${selectedFeedback.customerName}`}
                  </div>
                </div>
                <div className={styles.detailRow}>
                  <label>
                    <i className="fas fa-store"></i>
                    Thông tin đại lý
                  </label>
                  <div>
                    ID: #{selectedFeedback.dealerId}
                    {selectedFeedback.dealerName && ` - ${selectedFeedback.dealerName}`}
                  </div>
                </div>
                <div className={styles.detailRow}>
                  <label>
                    <i className="fas fa-calendar-alt"></i>
                    Ngày tạo
                  </label>
                  <div>{formatDate(selectedFeedback.createdAt)}</div>
                </div>
                {selectedFeedback.response && (
                  <>
                    <div className={styles.detailRow}>
                      <label>
                        <i className="fas fa-reply"></i>
                        Phản hồi từ đại lý
                      </label>
                      <div className={styles.responseDetail}>{selectedFeedback.response}</div>
                    </div>
                    {selectedFeedback.respondedAt && (
                      <div className={styles.detailRow}>
                        <label>
                          <i className="fas fa-clock"></i>
                          Ngày phản hồi
                        </label>
                        <div>{formatDate(selectedFeedback.respondedAt)}</div>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className={styles.modalFooter}>
                <button 
                  className={styles.deleteButton}
                  onClick={() => {
                    setShowDetailModal(false);
                    handleDeleteFeedback(selectedFeedback);
                  }}
                >
                  <i className="fas fa-trash"></i>
                  Xóa phản hồi
                </button>
                <button className={styles.closeBtn} onClick={() => setShowDetailModal(false)}>
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketsPage;
