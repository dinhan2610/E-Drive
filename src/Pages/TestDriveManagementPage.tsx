import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTestDrivesByDealer, deleteTestDrive, updateTestDriveStatus, type TestDrive, TestDriveApiError } from '../services/testDriveApi';
import { getProfile } from '../services/profileApi';
import { getCurrentUserRole } from '../utils/roleUtils';
import TestDriveDetailModal from '../components/testDrive/TestDriveDetailModal';
import TestDriveEditModal from '../components/testDrive/TestDriveEditModal';
import styles from '../styles/TestDriveStyles/TestDriveManagement.module.scss';

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
    case 'PENDING': return 'Chờ xử lý';
    case 'APPROVED': return 'Đã xác nhận';
    case 'COMPLETED': return 'Hoàn thành';
    case 'CANCELLED': return 'Huỷ';
    default: return status;
  }
};

const TestDriveManagementPage: React.FC = () => {
  const [testDrives, setTestDrives] = useState<TestDrive[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTestDrive, setSelectedTestDrive] = useState<TestDrive | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [dealerInfo, setDealerInfo] = useState<{ id: number; name?: string } | null>(null);
  const [dealerConfirmations, setDealerConfirmations] = useState<Record<number, 'PENDING' | 'APPROVED'>>({});
  const [updatingConfirmation, setUpdatingConfirmation] = useState<number | null>(null);
  const [updatingStaffStatus, setUpdatingStaffStatus] = useState<number | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancellingTestDrive, setCancellingTestDrive] = useState<TestDrive | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [userRole] = useState<'dealer' | 'staff'>(getCurrentUserRole() as 'dealer' | 'staff');

  // Get dealer info from profile API
  useEffect(() => {
    const fetchDealerInfo = async () => {
      try {
        console.log('🔍 Fetching dealer info from /api/profile/me...');
        const profile = await getProfile();
        console.log('✅ Profile data:', profile);
        console.log('🏢 Dealer ID from profile:', profile.dealerId);
        
        setDealerInfo({
          id: profile.dealerId,
          name: profile.agencyName || `Đại lý #${profile.dealerId}`
        });
      } catch (error) {
        console.error('❌ Failed to fetch profile:', error);
        // Fallback to token if profile fails
        const token = localStorage.getItem('accessToken');
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const dealerId = payload.dealerId || payload.dealer_id || 1;
            setDealerInfo({ id: dealerId, name: `Đại lý #${dealerId}` });
          } catch {
            setDealerInfo({ id: 1, name: 'Đại lý #1' });
          }
        } else {
          setDealerInfo({ id: 1, name: 'Đại lý #1' });
        }
      }
    };
    
    fetchDealerInfo();
  }, []);

  useEffect(() => {
    if (dealerInfo?.id) {
      loadTestDrives();
    }
  }, [dealerInfo?.id]);

  const loadTestDrives = async () => {
    if (!dealerInfo?.id) return;
    
    try {
      setIsLoading(true);
      console.log('🔍 Loading test drives for dealer ID:', dealerInfo.id);
      const data = await getTestDrivesByDealer(dealerInfo.id);
      console.log(`✅ Loaded ${data.length} test drives for dealer ${dealerInfo.id}`);
      
      // Log all unique statuses in the data
      const uniqueStatuses = [...new Set(data.map(td => td.status))];
      console.log('📊 Available statuses in backend data:', uniqueStatuses);
      
      // Log each test drive with its current status
      console.table(data.map(td => ({
        ID: td.testdriveId,
        Status: td.status,
        Customer: td.customerName,
        Vehicle: td.vehicleModel
      })));
      
      setTestDrives(data);
    } catch (error: any) {
      console.error('Error loading test drives:', error);
      
      if (error instanceof TestDriveApiError) {
        alert(`❌ ${error.message}`);
      } else {
        alert('❌ Không thể tải danh sách lái thử');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTestDrive = async (testDrive: TestDrive) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa lịch lái thử #${testDrive.testdriveId} của khách hàng ${testDrive.customerName} không?`)) return;
    
    try {
      // Pass dealerId for fallback endpoint support
      await deleteTestDrive(testDrive.testdriveId, testDrive.dealerId);
      
      // Update local state
      setTestDrives(prev => prev.filter(td => td.testdriveId !== testDrive.testdriveId));
      
      alert('✅ Đã xóa lịch lái thử thành công!');
    } catch (error: any) {
      console.error('Delete error:', error);
      alert(`❌ ${error.message || 'Không thể xóa lịch lái thử'}`);
    }
  };

  const handleViewDetail = (testDrive: TestDrive) => {
    setSelectedTestDrive(testDrive);
    setShowDetailModal(true);
  };

  const handleEdit = (testDrive: TestDrive) => {
    setSelectedTestDrive(testDrive);
    setShowEditModal(true);
  };

  const handleEditFromDetail = () => {
    setShowDetailModal(false);
    setShowEditModal(true);
  };

  const handleEditSuccess = (updated: TestDrive) => {
    setTestDrives(prev => prev.map(td => 
      td.testdriveId === updated.testdriveId ? updated : td
    ));
    loadTestDrives(); // Reload to get fresh data
  };

  const handleDealerConfirmationChange = async (testDrive: TestDrive, newStatus: string) => {
    if (updatingConfirmation === testDrive.testdriveId) return; // Prevent double-click
    
    // If selecting CANCELLED, show dialog to get reason
    if (newStatus === 'CANCELLED') {
      setCancellingTestDrive(testDrive);
      setShowCancelDialog(true);
      return;
    }
    
    try {
      setUpdatingConfirmation(testDrive.testdriveId);
      
      const payload: any = {
        status: newStatus as 'PENDING' | 'APPROVED' | 'CANCELLED'
      };
      
      // Use PATCH API with dealer confirmation status
      const updated = await updateTestDriveStatus(
        testDrive.dealerId,
        testDrive.testdriveId,
        payload
      );
      
      // Update local state
      setDealerConfirmations(prev => ({
        ...prev,
        [testDrive.testdriveId]: newStatus as 'PENDING' | 'APPROVED'
      }));
      
      setTestDrives(prev => prev.map(td => 
        td.testdriveId === testDrive.testdriveId ? updated : td
      ));
      
      // Show success notification
      showNotification(`✓ Đã cập nhật xác nhận: ${getStatusLabel(newStatus)}`);
      
    } catch (error: any) {
      console.error('❌ Error updating confirmation:', error);
      alert(`❌ ${error.message || 'Không thể cập nhật xác nhận'}`);
    } finally {
      setUpdatingConfirmation(null);
    }
  };

  const handleStaffStatusChange = async (testDrive: TestDrive, newStatus: string) => {
    if (updatingStaffStatus === testDrive.testdriveId) return; // Prevent double-click
    
    // If selecting CANCELLED, show dialog to get reason
    if (newStatus === 'CANCELLED') {
      setCancellingTestDrive(testDrive);
      setShowCancelDialog(true);
      return;
    }
    
    try {
      setUpdatingStaffStatus(testDrive.testdriveId);
      
      // Use PATCH API with staff status field only
      const updated = await updateTestDriveStatus(
        testDrive.dealerId,
        testDrive.testdriveId,
        {
          statusForStaff: newStatus as 'PENDING' | 'COMPLETED' | 'CANCELLED' // Staff processing field
        }
      );
      
      setTestDrives(prev => prev.map(td => 
        td.testdriveId === testDrive.testdriveId ? updated : td
      ));
      
      // Show success notification
      showNotification(`✓ Đã cập nhật trạng thái: ${getStatusLabel(newStatus)}`);
      
    } catch (error: any) {
      console.error('❌ Error updating staff status:', error);
      alert(`❌ ${error.message || 'Không thể cập nhật trạng thái'}`);
    } finally {
      setUpdatingStaffStatus(null);
    }
  };

  const handleCancelWithReason = async () => {
    if (!cancellingTestDrive || !cancelReason.trim()) {
      alert('⚠️ Vui lòng nhập lý do hủy');
      return;
    }
    
    try {
      // Determine if this is from staff or manager based on current action
      const isStaffCancelling = updatingStaffStatus === cancellingTestDrive.testdriveId || userRole === 'staff';
      
      if (isStaffCancelling) {
        setUpdatingStaffStatus(cancellingTestDrive.testdriveId);
      } else {
        setUpdatingConfirmation(cancellingTestDrive.testdriveId);
      }
      
      // Build payload based on who is cancelling
      const payload: any = {
        cancelReason: cancelReason.trim()
      };
      
      if (isStaffCancelling) {
        // Staff cancels: Update both statusForStaff and status
        payload.statusForStaff = 'CANCELLED';
        payload.status = 'CANCELLED';
      } else {
        // Manager cancels: Update both status and statusForStaff
        payload.status = 'CANCELLED';
        payload.statusForStaff = 'CANCELLED';
      }
      
      const updated = await updateTestDriveStatus(
        cancellingTestDrive.dealerId,
        cancellingTestDrive.testdriveId,
        payload
      );
      
      setTestDrives(prev => prev.map(td => 
        td.testdriveId === cancellingTestDrive.testdriveId ? updated : td
      ));
      
      showNotification(`✓ Đã hủy lịch lái thử`);
      
      // Close dialog and reset
      setShowCancelDialog(false);
      setCancellingTestDrive(null);
      setCancelReason('');
      
    } catch (error: any) {
      console.error('❌ Error cancelling test drive:', error);
      alert(`❌ ${error.message || 'Không thể hủy lịch lái thử'}`);
    } finally {
      setUpdatingStaffStatus(null);
      setUpdatingConfirmation(null);
    }
  };

  const showNotification = (message: string) => {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #28a745;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  };

  const filteredTestDrives = testDrives.filter(td => {
    // Filter by search query
    const matchesSearch = !searchQuery || 
      td.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      td.vehicleModel?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      td.testdriveId?.toString().includes(searchQuery) ||
      td.customerId?.toString().includes(searchQuery);
    
    return matchesSearch;
  });

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerIcon}>
              <i className="fas fa-car-side"></i>
            </div>
            <div className={styles.headerText}>
              <h1>Quản lý lịch hẹn lái thử</h1>
              <p>
                Theo dõi và quản lý toàn bộ yêu cầu đăng ký lái thử xe điện
                {dealerInfo && (
                  <span className={styles.dealerBadge}>
                    <i className="fas fa-store"></i>
                    Đại lý #{dealerInfo.id}
                    {dealerInfo.name && ` - ${dealerInfo.name}`}
                  </span>
                )}
              </p>
            </div>
            <Link to="/test-drive" className={styles.createButton} title="Tạo lịch mới">
              <i className="fas fa-plus"></i>
            </Link>
          </div>
        </div>

        {/* Filters Section */}
        <div className={styles.filtersSection}>
          <div className={styles.filtersContainer}>
            {/* Search Box */}
            <div className={styles.searchBox}>
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Tìm kiếm khách hàng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              {searchQuery && (
                <button
                  type="button"
                  className={styles.clearSearch}
                  onClick={() => setSearchQuery('')}
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
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
                  <th>Khách hàng</th>
                  <th>Xe lái thử</th>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>
                  <th>Xác nhận đại lý</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredTestDrives.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles.emptyState}>
                      <i className="fas fa-inbox"></i>
                      <p>Không có dữ liệu</p>
                    </td>
                  </tr>
                ) : (
                  filteredTestDrives.map(testDrive => (
                    <tr key={testDrive.testdriveId}>
                      <td>#{testDrive.testdriveId}</td>
                      <td>
                        <div className={styles.customerInfo}>
                          <div className={styles.customerName}>{testDrive.customerName}</div>
                          <div className={styles.customerId}>ID: {testDrive.customerId}</div>
                        </div>
                      </td>
                      <td>{testDrive.vehicleModel}</td>
                      <td>
                        <div className={styles.timeInfo}>
                          <div className={styles.date}>{formatDate(testDrive.scheduleDatetime)}</div>
                          <div className={styles.time}>{formatTime(testDrive.scheduleDatetime)}</div>
                        </div>
                      </td>
                      <td>
                        {userRole === 'staff' ? (
                          // Staff: Show badge for final states, dropdown for others
                          (testDrive.statusForStaff === 'COMPLETED' || testDrive.statusForStaff === 'CANCELLED') ? (
                            <span className={`${styles.statusBadge} ${styles[testDrive.statusForStaff?.toLowerCase() || testDrive.status?.toLowerCase() || 'pending']}`}>
                              {getStatusLabel(testDrive.statusForStaff || testDrive.status || 'PENDING')}
                            </span>
                          ) : (
                            <select 
                              className={`${styles.statusSelect} ${styles[testDrive.statusForStaff?.toLowerCase() || testDrive.status?.toLowerCase() || 'pending']} ${updatingStaffStatus === testDrive.testdriveId ? styles.updating : ''}`}
                              value={testDrive.statusForStaff || testDrive.status || 'PENDING'}
                              onChange={(e) => handleStaffStatusChange(testDrive, e.target.value)}
                              disabled={
                                updatingStaffStatus === testDrive.testdriveId ||
                                testDrive.status !== 'APPROVED' // Staff can only update when manager approved
                              }
                              title={
                                testDrive.status !== 'APPROVED' 
                                  ? 'Chỉ cập nhật được khi Manager đã xác nhận'
                                  : 'Staff cập nhật trạng thái xử lý'
                              }
                            >
                              <option value="PENDING">Chờ xử lý</option>
                              <option value="COMPLETED">Hoàn thành</option>
                              <option value="CANCELLED">Huỷ</option>
                            </select>
                          )
                        ) : (
                          <span className={`${styles.statusBadge} ${styles[testDrive.statusForStaff?.toLowerCase() || testDrive.status?.toLowerCase() || 'pending']}`}>
                            {getStatusLabel(testDrive.statusForStaff || testDrive.status || 'PENDING')}
                          </span>
                        )}
                      </td>
                      <td>
                        {userRole === 'staff' ? (
                          <span className={`${styles.statusBadge} ${styles[testDrive.status?.toLowerCase() || 'pending']}`}>
                            {getStatusLabel(testDrive.status || 'PENDING')}
                          </span>
                        ) : (
                          // Manager: Show badge for final states, dropdown for others
                          (testDrive.statusForStaff === 'COMPLETED' || testDrive.status === 'CANCELLED') ? (
                            <span className={`${styles.statusBadge} ${styles[testDrive.status?.toLowerCase() || 'pending']}`}>
                              {getStatusLabel(testDrive.status || 'PENDING')}
                            </span>
                          ) : (
                            <select 
                              className={`${styles.statusSelect} ${styles[dealerConfirmations[testDrive.testdriveId] || testDrive.status?.toLowerCase() || 'pending']} ${updatingConfirmation === testDrive.testdriveId ? styles.updating : ''}`}
                              value={dealerConfirmations[testDrive.testdriveId] || testDrive.status || 'PENDING'}
                              onChange={(e) => handleDealerConfirmationChange(testDrive, e.target.value)}
                              disabled={updatingConfirmation === testDrive.testdriveId}
                              title="Manager cập nhật xác nhận đại lý"
                            >
                              <option value="PENDING">Chờ xử lý</option>
                              <option value="APPROVED">Đã xác nhận</option>
                              <option value="CANCELLED">Huỷ</option>
                            </select>
                          )
                        )}
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button 
                            className={`${styles.actionButton} ${styles.view}`}
                            title="Xem chi tiết"
                            onClick={() => handleViewDetail(testDrive)}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button 
                            className={`${styles.actionButton} ${styles.edit}`}
                            title={
                              testDrive.statusForStaff === 'COMPLETED'
                                ? 'Không thể chỉnh sửa lịch đã hoàn thành'
                                : testDrive.statusForStaff === 'CANCELLED' || testDrive.status === 'CANCELLED'
                                ? 'Không thể chỉnh sửa lịch đã hủy'
                                : 'Chỉnh sửa (Status sẽ reset về PENDING)'
                            }
                            onClick={() => handleEdit(testDrive)}
                            disabled={
                              testDrive.statusForStaff === 'COMPLETED' ||
                              testDrive.statusForStaff === 'CANCELLED' ||
                              testDrive.status === 'CANCELLED'
                            }
                            style={{
                              opacity: testDrive.statusForStaff === 'COMPLETED' || testDrive.statusForStaff === 'CANCELLED' || testDrive.status === 'CANCELLED' ? 0.4 : 1,
                              cursor: testDrive.statusForStaff === 'COMPLETED' || testDrive.statusForStaff === 'CANCELLED' || testDrive.status === 'CANCELLED' ? 'not-allowed' : 'pointer'
                            }}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button 
                            className={`${styles.actionButton} ${styles.delete}`}
                            title="Xóa"
                            onClick={() => handleDeleteTestDrive(testDrive)}
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
        {showDetailModal && selectedTestDrive && (
          <TestDriveDetailModal
            testDrive={selectedTestDrive}
            onClose={() => setShowDetailModal(false)}
            onEdit={handleEditFromDetail}
          />
        )}

        {showEditModal && selectedTestDrive && (
          <TestDriveEditModal
            testDrive={selectedTestDrive}
            onClose={() => setShowEditModal(false)}
            onSuccess={handleEditSuccess}
          />
        )}

        {/* Cancel Reason Dialog */}
        {showCancelDialog && cancellingTestDrive && (
          <div className={styles.modalOverlay} onClick={() => {
            setShowCancelDialog(false);
            setCancellingTestDrive(null);
            setCancelReason('');
          }}>
            <div className={styles.cancelDialog} onClick={(e) => e.stopPropagation()}>
              <div className={styles.dialogHeader}>
                <h3>
                  <i className="fas fa-ban"></i>
                  Hủy lịch lái thử
                </h3>
                <button 
                  className={styles.closeButton}
                  onClick={() => {
                    setShowCancelDialog(false);
                    setCancellingTestDrive(null);
                    setCancelReason('');
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div className={styles.dialogBody}>
                <p className={styles.cancelInfo}>
                  <strong>Khách hàng:</strong> {cancellingTestDrive.customerName}
                  <br />
                  <strong>Xe:</strong> {cancellingTestDrive.vehicleModel}
                  <br />
                  <strong>Thời gian:</strong> {formatDate(cancellingTestDrive.scheduleDatetime)} - {formatTime(cancellingTestDrive.scheduleDatetime)}
                </p>
                
                <label className={styles.inputLabel}>
                  <i className="fas fa-comment"></i>
                  Lý do hủy <span className={styles.required}>*</span>
                </label>
                <textarea
                  className={styles.cancelReasonInput}
                  placeholder="Nhập lý do hủy lịch lái thử..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={4}
                  autoFocus
                />
              </div>
              
              <div className={styles.dialogFooter}>
                <button 
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowCancelDialog(false);
                    setCancellingTestDrive(null);
                    setCancelReason('');
                  }}
                >
                  <i className="fas fa-arrow-left"></i>
                  Quay lại
                </button>
                <button 
                  className={styles.confirmButton}
                  onClick={handleCancelWithReason}
                  disabled={!cancelReason.trim() || updatingStaffStatus === cancellingTestDrive.testdriveId}
                >
                  {updatingStaffStatus === cancellingTestDrive.testdriveId ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check"></i>
                      Xác nhận hủy
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestDriveManagementPage;
