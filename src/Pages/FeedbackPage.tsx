import React, { useState, useEffect } from 'react';
import { listFeedbacks, deleteFeedback } from '../services/feedbackApi';
import { getProfile } from '../services/profileApi';
import type { Feedback } from '../types/feedback';
import styles from '../styles/FeedbackStyles/FeedbackPage.module.scss';

const formatDate = (datetime: string): string => {
  try {
    const date = new Date(datetime);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  } catch {
    return datetime;
  }
};

const getRatingStars = (rating: number): string => {
  const filled = '★'.repeat(rating);
  const empty = '☆'.repeat(5 - rating);
  return filled + empty;
};

const getRatingColor = (rating: number): string => {
  if (rating >= 4) return '#10b981';
  if (rating >= 3) return '#f59e0b';
  return '#ef4444';
};

const getRatingLabel = (rating: number): string => {
  if (rating === 5) return 'Xuất sắc';
  if (rating === 4) return 'Tốt';
  if (rating === 3) return 'Trung bình';
  if (rating === 2) return 'Kém';
  return 'Rất kém';
};

const FeedbackPage: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [filterRating, setFilterRating] = useState<number | undefined>(undefined);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [dealerId, setDealerId] = useState<number | null>(null);
  const [dealerName, setDealerName] = useState<string>('');

  const pageSize = 10;

  useEffect(() => {
    loadDealerProfile();
  }, []);

  useEffect(() => {
    if (dealerId !== null) {
      loadFeedbacks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealerId, currentPage, filterRating]);

  const loadDealerProfile = async () => {
    try {
      console.log('🔍 Loading dealer profile...');
      const profile = await getProfile();
      console.log('✅ Profile data:', profile);
      console.log('🏢 Dealer ID:', profile.dealerId);
      
      setDealerId(profile.dealerId);
      setDealerName(profile.agencyName || profile.fullName);
    } catch (error) {
      console.error('❌ Error loading dealer profile:', error);
      alert('❌ Không thể tải thông tin đại lý');
    }
  };

  const loadFeedbacks = async () => {
    if (dealerId === null) {
      console.log('⏳ Waiting for dealer ID...');
      return;
    }

    try {
      setIsLoading(true);
      console.log(`📋 Loading feedbacks for dealer ${dealerId}...`);
      
      const response = await listFeedbacks({
        page: currentPage,
        size: pageSize,
        rating: filterRating,
        dealerId: dealerId
      });
      
      console.log(`✅ Loaded ${response.content?.length || 0} feedbacks for dealer ${dealerId}`);
      
      setFeedbacks(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error('❌ Error loading feedbacks:', error);
      alert('❌ Không thể tải danh sách phản hồi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (feedback: Feedback) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa phản hồi #${feedback.feedbackId}?\n\nHành động này không thể hoàn tác.`)) {
      return;
    }
    
    try {
      await deleteFeedback(feedback.feedbackId);
      alert('✅ Đã xóa phản hồi thành công!');
      loadFeedbacks();
    } catch (error: any) {
      console.error('Delete error:', error);
      alert(`❌ ${error.message || 'Không thể xóa phản hồi'}`);
    }
  };

  const handleViewDetail = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setShowDetailModal(true);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFilterChange = (rating: string) => {
    const ratingValue = rating === 'ALL' ? undefined : parseInt(rating);
    setFilterRating(ratingValue);
    setCurrentPage(0);
  };

  const stats = {
    total: totalElements,
    excellent: feedbacks.filter(f => f.rating === 5).length,
    good: feedbacks.filter(f => f.rating === 4).length,
    average: feedbacks.filter(f => f.rating === 3).length,
    poor: feedbacks.filter(f => f.rating <= 2).length,
    avgRating: feedbacks.length > 0 
      ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
      : '0.0'
  };

  return (
    <div className={styles.feedbackPage}>
      <div className={styles.pageHeader}>
        <div className={styles.headerTop}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <i className="fas fa-star"></i>
            </div>
            <div className={styles.headerText}>
              <h1 className={styles.pageTitle}>Quản lý Phản hồi Khách hàng</h1>
              <p className={styles.pageSubtitle}>
                Theo dõi đánh giá và phản hồi từ khách hàng về trải nghiệm lái thử xe điện
              </p>
            </div>
          </div>
          {dealerId !== null && (
            <div className={styles.dealerBadge}>
              <i className="fas fa-store"></i>
              <span>{dealerName || `Dealer #${dealerId}`} (ID: {dealerId})</span>
            </div>
          )}
        </div>

        <div className={styles.statsContainer}>
          <div className={styles.statsCard} style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
            <div className={styles.statsIcon}>
              <i className="fas fa-comments"></i>
            </div>
            <div className={styles.statsContent}>
              <div className={styles.statsValue}>{stats.total}</div>
              <div className={styles.statsLabel}>Tổng phản hồi</div>
            </div>
          </div>

          <div className={styles.statsCard} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <div className={styles.statsIcon}>
              <i className="fas fa-star"></i>
            </div>
            <div className={styles.statsContent}>
              <div className={styles.statsValue}>{stats.avgRating} ★</div>
              <div className={styles.statsLabel}>Đánh giá TB</div>
            </div>
          </div>

          <div className={styles.statsCard} style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' }}>
            <div className={styles.statsIcon}>
              <i className="fas fa-trophy"></i>
            </div>
            <div className={styles.statsContent}>
              <div className={styles.statsValue}>{stats.excellent}</div>
              <div className={styles.statsLabel}>5 sao</div>
            </div>
          </div>

          <div className={styles.statsCard} style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
            <div className={styles.statsIcon}>
              <i className="fas fa-thumbs-up"></i>
            </div>
            <div className={styles.statsContent}>
              <div className={styles.statsValue}>{stats.good}</div>
              <div className={styles.statsLabel}>4 sao</div>
            </div>
          </div>

          <div className={styles.statsCard} style={{ background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)' }}>
            <div className={styles.statsIcon}>
              <i className="fas fa-meh"></i>
            </div>
            <div className={styles.statsContent}>
              <div className={styles.statsValue}>{stats.average}</div>
              <div className={styles.statsLabel}>3 sao</div>
            </div>
          </div>

          <div className={styles.statsCard} style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
            <div className={styles.statsIcon}>
              <i className="fas fa-exclamation-circle"></i>
            </div>
            <div className={styles.statsContent}>
              <div className={styles.statsValue}>{stats.poor}</div>
              <div className={styles.statsLabel}>≤ 2 sao</div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.contentContainer}>
          <div className={styles.filterBar}>
            <div className={styles.filterSection}>
              <div className={styles.filterTitle}>
                <i className="fas fa-filter"></i>
                <span>Bộ lọc</span>
              </div>
              <select 
                value={filterRating || 'ALL'} 
                onChange={(e) => handleFilterChange(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="ALL">📊 Tất cả đánh giá</option>
                <option value="5">⭐⭐⭐⭐⭐ Xuất sắc (5 sao)</option>
                <option value="4">⭐⭐⭐⭐ Tốt (4 sao)</option>
                <option value="3">⭐⭐⭐ Trung bình (3 sao)</option>
                <option value="2">⭐⭐ Kém (2 sao)</option>
                <option value="1">⭐ Rất kém (1 sao)</option>
              </select>
            </div>

            <div className={styles.resultSection}>
              <div className={styles.resultBadge}>
                <i className="fas fa-list-ul"></i>
                <span>Hiển thị <strong>{feedbacks.length}</strong> / <strong>{totalElements}</strong> kết quả</span>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p className={styles.loadingText}>Đang tải dữ liệu...</p>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className={styles.emptyContainer}>
              <div className={styles.emptyIcon}>
                <i className="fas fa-inbox"></i>
              </div>
              <h3 className={styles.emptyTitle}>Chưa có phản hồi nào</h3>
              <p className={styles.emptyText}>
                {filterRating 
                  ? 'Không tìm thấy phản hồi phù hợp với bộ lọc đã chọn'
                  : 'Chưa có khách hàng nào gửi phản hồi về dịch vụ của bạn'}
              </p>
            </div>
          ) : (
            <>
              <div className={styles.tableContainer}>
                <table className={styles.feedbackTable}>
                  <thead>
                    <tr>
                      <th className={styles.colId}>ID</th>
                      <th className={styles.colRating}>Đánh giá</th>
                      <th className={styles.colContent}>Nội dung phản hồi</th>
                      <th className={styles.colCustomer}>Khách hàng</th>
                      <th className={styles.colDate}>Thời gian</th>
                      <th className={styles.colActions}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedbacks.map((feedback) => (
                      <tr key={feedback.feedbackId}>
                        <td>
                          <div className={styles.idCell}>#{feedback.feedbackId}</div>
                        </td>
                        <td>
                          <div className={styles.ratingCell} style={{ 
                            background: `linear-gradient(135deg, ${getRatingColor(feedback.rating)}15 0%, ${getRatingColor(feedback.rating)}05 100%)`,
                            borderColor: getRatingColor(feedback.rating)
                          }}>
                            <div className={styles.ratingStars} style={{ color: getRatingColor(feedback.rating) }}>
                              {getRatingStars(feedback.rating)}
                            </div>
                            <div className={styles.ratingScore} style={{ color: getRatingColor(feedback.rating) }}>
                              {feedback.rating}/5
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.contentCell}>
                            <p>{feedback.content}</p>
                          </div>
                        </td>
                        <td>
                          <div className={styles.customerCell}>
                            <i className="fas fa-user-circle"></i>
                            <span>ID: {feedback.customerId}</span>
                          </div>
                        </td>
                        <td>
                          <div className={styles.dateCell}>
                            <i className="fas fa-clock"></i>
                            <span>{formatDate(feedback.createdAt)}</span>
                          </div>
                        </td>
                        <td>
                          <div className={styles.actionCell}>
                            <button
                              onClick={() => handleViewDetail(feedback)}
                              className={styles.btnView}
                              title="Xem chi tiết"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              onClick={() => handleDelete(feedback)}
                              className={styles.btnDelete}
                              title="Xóa phản hồi"
                            >
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className={styles.paginationContainer}>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                    className={styles.paginationButton}
                  >
                    <i className="fas fa-chevron-left"></i>
                    <span>Trước</span>
                  </button>
                  
                  <div className={styles.paginationPages}>
                    {[...Array(Math.min(totalPages, 7))].map((_, index) => {
                      let pageNum;
                      if (totalPages <= 7) {
                        pageNum = index;
                      } else if (currentPage < 4) {
                        pageNum = index;
                      } else if (currentPage > totalPages - 4) {
                        pageNum = totalPages - 7 + index;
                      } else {
                        pageNum = currentPage - 3 + index;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`${styles.paginationPage} ${currentPage === pageNum ? styles.active : ''}`}
                        >
                          {pageNum + 1}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages - 1}
                    className={styles.paginationButton}
                  >
                    <span>Sau</span>
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showDetailModal && selectedFeedback && (
        <div className={styles.modalOverlay} onClick={() => setShowDetailModal(false)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderLeft}>
                <div className={styles.modalHeaderIcon}>
                  <i className="fas fa-comment-dots"></i>
                </div>
                <div>
                  <h2 className={styles.modalTitle}>Chi tiết phản hồi</h2>
                  <p className={styles.modalSubtitle}>ID: #{selectedFeedback.feedbackId}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDetailModal(false)}
                className={styles.modalClose}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.modalRatingSection}>
                <div className={styles.modalRatingCard} style={{ 
                  background: `linear-gradient(135deg, ${getRatingColor(selectedFeedback.rating)} 0%, ${getRatingColor(selectedFeedback.rating)}dd 100%)`
                }}>
                  <div className={styles.modalRatingStars}>
                    {getRatingStars(selectedFeedback.rating)}
                  </div>
                  <div className={styles.modalRatingScore}>{selectedFeedback.rating}/5</div>
                  <div className={styles.modalRatingLabel}>{getRatingLabel(selectedFeedback.rating)}</div>
                </div>
              </div>

              <div className={styles.modalInfoGrid}>
                <div className={styles.modalInfoCard}>
                  <div className={styles.modalInfoIcon} style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
                    <i className="fas fa-user"></i>
                  </div>
                  <div className={styles.modalInfoContent}>
                    <div className={styles.modalInfoLabel}>Khách hàng</div>
                    <div className={styles.modalInfoValue}>ID: {selectedFeedback.customerId}</div>
                  </div>
                </div>

                <div className={styles.modalInfoCard}>
                  <div className={styles.modalInfoIcon} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                    <i className="fas fa-store"></i>
                  </div>
                  <div className={styles.modalInfoContent}>
                    <div className={styles.modalInfoLabel}>Đại lý</div>
                    <div className={styles.modalInfoValue}>ID: {selectedFeedback.dealerId}</div>
                  </div>
                </div>

                <div className={styles.modalInfoCard}>
                  <div className={styles.modalInfoIcon} style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                    <i className="fas fa-calendar-alt"></i>
                  </div>
                  <div className={styles.modalInfoContent}>
                    <div className={styles.modalInfoLabel}>Ngày gửi</div>
                    <div className={styles.modalInfoValue}>{formatDate(selectedFeedback.createdAt)}</div>
                  </div>
                </div>
              </div>

              <div className={styles.modalContentSection}>
                <div className={styles.modalContentHeader}>
                  <i className="fas fa-comment-alt"></i>
                  <span>Nội dung phản hồi</span>
                </div>
                <div className={styles.modalContentBox}>
                  {selectedFeedback.content}
                </div>
              </div>
            </div>
            
            <div className={styles.modalFooter}>
              <button 
                onClick={() => setShowDetailModal(false)}
                className={styles.modalBtnClose}
              >
                <i className="fas fa-times"></i>
                <span>Đóng</span>
              </button>
              <button 
                onClick={() => {
                  setShowDetailModal(false);
                  handleDelete(selectedFeedback);
                }}
                className={styles.modalBtnDelete}
              >
                <i className="fas fa-trash-alt"></i>
                <span>Xóa phản hồi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackPage;