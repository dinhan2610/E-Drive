import React, { useState, useEffect } from 'react';
import { getTestDrivesByDealer, cancelTestDrive, completeTestDrive, confirmTestDrive, deleteTestDrive, type TestDrive, TestDriveApiError } from '../services/testDriveApi';
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
  switch (status) {
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
  const [loading, setLoading] = useState(true);
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
      setLoading(true);
      
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
        alert(error.message);
      } else {
        alert('Không thể tải danh sách lái thử');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmTestDrive = async (id: number) => {
    try {
      const updated = await confirmTestDrive(id);
      setTestDrives(prev => prev.map(td => td.testdriveId === id ? { ...td, status: updated.status } : td));
      alert('Đã xác nhận lịch lái thử thành công!');
    } catch (error: any) {
      alert(error.message || 'Không thể xác nhận lịch lái thử');
    }
  };

  const handleCompleteTestDrive = async (id: number) => {
    try {
      const updated = await completeTestDrive(id);
      setTestDrives(prev => prev.map(td => td.testdriveId === id ? { ...td, status: updated.status } : td));
      alert('Đã đánh dấu hoàn thành lịch lái thử!');
    } catch (error: any) {
      alert(error.message || 'Không thể hoàn thành lịch lái thử');
    }
  };

  const handleCancelTestDrive = async (id: number) => {
    const reason = prompt('Nhập lý do hủy:');
    if (!reason) return;
    
    try {
      const updated = await cancelTestDrive(id, reason);
      setTestDrives(prev => prev.map(td => td.testdriveId === id ? { ...td, status: updated.status } : td));
      alert('Đã hủy lịch lái thử thành công!');
    } catch (error: any) {
      alert(error.message || 'Không thể hủy lịch lái thử');
    }
  };

  const handleDeleteTestDrive = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa lịch lái thử này không?')) return;
    
    try {
      await deleteTestDrive(id);
      setTestDrives(prev => prev.filter(td => td.testdriveId !== id));
      alert('Đã xóa lịch lái thử thành công!');
    } catch (error: any) {
      alert(error.message || 'Không thể xóa lịch lái thử');
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

        {loading ? (
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
                          {testDrive.status === 'PENDING' && (
                            <button 
                              className={`${styles.actionButton} ${styles.confirm}`}
                              title="Xác nhận"
                              onClick={() => handleConfirmTestDrive(testDrive.testdriveId)}
                            >
                              <i className="fas fa-check"></i>
                            </button>
                          )}
                          {testDrive.status === 'CONFIRMED' && (
                            <button 
                              className={`${styles.actionButton} ${styles.complete}`}
                              title="Hoàn thành"
                              onClick={() => handleCompleteTestDrive(testDrive.testdriveId)}
                            >
                              <i className="fas fa-flag-checkered"></i>
                            </button>
                          )}
                          {testDrive.status !== 'CANCELLED' && testDrive.status !== 'COMPLETED' && (
                            <button 
                              className={`${styles.actionButton} ${styles.cancel}`}
                              title="Hủy"
                              onClick={() => handleCancelTestDrive(testDrive.testdriveId)}
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          )}
                          {(testDrive.status === 'CANCELLED' || testDrive.status === 'COMPLETED') && (
                            <button 
                              className={`${styles.actionButton} ${styles.delete}`}
                              title="Xóa"
                              onClick={() => handleDeleteTestDrive(testDrive.testdriveId)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestDriveManagementPage;
