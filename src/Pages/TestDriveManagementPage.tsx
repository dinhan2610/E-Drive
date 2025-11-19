import React, { useState, useEffect } from 'react';
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
    case 'PENDING': return 'Chờ xác nhận';
    case 'APPROVED': return 'Đã xác nhận';
    case 'COMPLETED': return 'Hoàn thành';
    case 'CANCELLED': return 'Đã hủy';
    default: return status;
  }
};

const TestDriveManagementPage: React.FC = () => {
  const [testDrives, setTestDrives] = useState<TestDrive[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTestDrive, setSelectedTestDrive] = useState<TestDrive | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [dealerInfo, setDealerInfo] = useState<{ id: number; name?: string } | null>(null);
  const [dealerConfirmations, setDealerConfirmations] = useState<Record<number, 'PENDING' | 'APPROVED'>>({});
  const [updatingConfirmation, setUpdatingConfirmation] = useState<number | null>(null);
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
    
    try {
      setUpdatingConfirmation(testDrive.testdriveId);
      
      // Use PATCH API with dealer confirmation status
      const updated = await updateTestDriveStatus(
        testDrive.dealerId,
        testDrive.testdriveId,
        {
          status: newStatus as 'PENDING' | 'APPROVED' | 'COMPLETED' | 'CANCELLED'
        }
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
      const notification = document.createElement('div');
      notification.textContent = `✓ Đã cập nhật: ${getStatusLabel(newStatus)}`;
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
      
    } catch (error: any) {
      console.error('❌ Error updating confirmation:', error);
      alert(`❌ ${error.message || 'Không thể cập nhật xác nhận'}`);
    } finally {
      setUpdatingConfirmation(null);
    }
  };

  const filteredTestDrives = filterStatus === 'ALL' 
    ? testDrives 
    : testDrives.filter(td => td.status === filterStatus);

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
          </div>
        </div>

        <div className={styles.filterSection}>
          <div className={styles.filterButtons}>
            <button 
              className={`${styles.filterButton} ${filterStatus === 'ALL' ? styles.active : ''}`}
              onClick={() => setFilterStatus('ALL')}
            >
              Tất cả ({testDrives.length})
            </button>
                        <button 
              className={`${styles.filterButton} ${filterStatus === 'PENDING' ? styles.active : ''}`}
              onClick={() => setFilterStatus('PENDING')}
            >
              Chờ xác nhận ({testDrives.filter(td => td.status === 'PENDING').length})
            </button>
            <button 
              className={`${styles.filterButton} ${filterStatus === 'APPROVED' ? styles.active : ''}`}
              onClick={() => setFilterStatus('APPROVED')}
            >
              Đã xác nhận ({testDrives.filter(td => td.status === 'APPROVED').length})
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
                  <th>Khách hàng</th>
                  <th>Xe lái thử</th>
                  <th>Thời gian</th>
                  <th>Xác nhận đại lý</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredTestDrives.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={styles.emptyState}>
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
                          <span className={`${styles.statusBadge} ${styles[testDrive.status?.toLowerCase() || 'pending']}`}>
                            {getStatusLabel(testDrive.status)}
                          </span>
                        ) : (
                          <select 
                            className={`${styles.statusSelect} ${styles[dealerConfirmations[testDrive.testdriveId] || testDrive.status?.toLowerCase() || 'pending']} ${updatingConfirmation === testDrive.testdriveId ? styles.updating : ''}`}
                            value={dealerConfirmations[testDrive.testdriveId] || testDrive.status || 'PENDING'}
                            onChange={(e) => handleDealerConfirmationChange(testDrive, e.target.value)}
                            disabled={updatingConfirmation === testDrive.testdriveId}
                          >
                            <option value="PENDING">Chờ xác nhận</option>
                            <option value="APPROVED">Đã xác nhận</option>
                          </select>
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
                            title="Chỉnh sửa"
                            onClick={() => handleEdit(testDrive)}
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
      </div>
    </div>
  );
};

export default TestDriveManagementPage;
