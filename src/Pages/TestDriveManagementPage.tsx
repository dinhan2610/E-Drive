import React, { useState, useEffect } from 'react';
import { getTestDrivesByDealer, deleteTestDrive, type TestDrive, TestDriveApiError } from '../services/testDriveApi';
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
    case 'CONFIRMED': return 'Đã xác nhận';
    case 'COMPLETED': return 'Hoàn thành';
    case 'CANCELLED': return 'Đã hủy';
    case 'NO_SHOW': return 'Không đến';
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

  useEffect(() => {
    // Helper function to set token from console
    (window as any).setTestToken = (token: string) => {
      localStorage.setItem('accessToken', token);
      localStorage.setItem('token', token);
      console.log('✅ Token set successfully! Reload to test API.');
      console.log('Token:', token.substring(0, 30) + '...');
    };
    
    // Log current token status
    const currentToken = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (currentToken) {
      console.log('🔑 Current token:', currentToken.substring(0, 30) + '...');
    } else {
      console.log('⚠️ No token found. Use: setTestToken("your-token-here")');
    }
    
    loadTestDrives();
  }, []);

  const loadTestDrives = async () => {
    try {
      setIsLoading(true);
      
      // Lấy dealerId từ localStorage
      const userData = localStorage.getItem('e-drive-user');
      let dealerId = 1; // Default
      
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user.dealerId) {
            dealerId = user.dealerId;
          }
        } catch (error) {
          console.error('Failed to parse user data:', error);
        }
      }
      
      console.log('Loading test drives for dealer:', dealerId);
      const data = await getTestDrivesByDealer(dealerId);
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
              <p>Theo dõi và quản lý toàn bộ yêu cầu đăng ký lái thử xe điện</p>
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
              className={`${styles.filterButton} ${filterStatus === 'CONFIRMED' ? styles.active : ''}`}
              onClick={() => setFilterStatus('CONFIRMED')}
            >
              Đã xác nhận ({testDrives.filter(td => td.status === 'CONFIRMED').length})
            </button>
            <button 
              className={`${styles.filterButton} ${filterStatus === 'COMPLETED' ? styles.active : ''}`}
              onClick={() => setFilterStatus('COMPLETED')}
            >
              Hoàn thành ({testDrives.filter(td => td.status === 'COMPLETED').length})
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
                  <th>Liên hệ</th>
                  <th>Xe lái thử</th>
                  <th>Đại lý</th>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredTestDrives.length === 0 ? (
                  <tr>
                    <td colSpan={8} className={styles.emptyState}>
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
                      <td>
                        <div className={styles.contactInfo}>
                          <div>Customer: {testDrive.customerId}</div>
                          <div>Dealer: {testDrive.dealerId}</div>
                        </div>
                      </td>
                      <td>{testDrive.vehicleModel}</td>
                      <td>{testDrive.dealerName}</td>
                      <td>
                        <div className={styles.timeInfo}>
                          <div className={styles.date}>{formatDate(testDrive.scheduleDatetime)}</div>
                          <div className={styles.time}>{formatTime(testDrive.scheduleDatetime)}</div>
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[testDrive.status.toLowerCase()]}`}>
                          {getStatusLabel(testDrive.status)}
                        </span>
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
