import React, { useState, useEffect } from 'react';
import { getAllContracts, submitContract } from '../services/contractsApi';
import type { Contract } from '../types/contract';
import styles from '../styles/ContractStyles/ContractManagement.module.scss';
import AdminLayout from '../components/AdminLayout';

const formatDate = (datetime: string) => {
  try {
    const date = new Date(datetime);
    return date.toLocaleDateString('vi-VN');
  } catch {
    return datetime;
  }
};

const getStatusLabel = (status: string) => {
  switch(status) {
    case 'DRAFT': return 'Nháp';
    case 'SIGNING': return 'Đang ký';
    case 'ACTIVE': return 'Đang hiệu lực';
    case 'COMPLETED': return 'Hoàn thành';
    case 'CANCELLED': return 'Đã hủy';
    default: return status;
  }
};

const ContractManagementPage: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      setIsLoading(true);
      const data = await getAllContracts();
      // Ensure data is an array
      const contractsArray = Array.isArray(data) ? data : [];
      setContracts(contractsArray);
    } catch (error: any) {
      console.error('Error loading contracts:', error);
      setContracts([]); // Set empty array on error
      alert('❌ Không thể tải danh sách hợp đồng');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetail = (contract: Contract) => {
    setSelectedContract(contract);
    setShowDetailModal(true);
  };

  const handleSubmitToCustomer = async (contract: Contract) => {
    if (!confirm(`Bạn có chắc chắn muốn gửi hợp đồng #${contract.id} cho khách hàng không?`)) return;
    
    try {
      setSubmitting(contract.id);
      await submitContract(Number(contract.id));
      
      // Reload contracts
      await loadContracts();
      
      alert('✅ Đã gửi hợp đồng cho khách hàng thành công!');
    } catch (error: any) {
      console.error('Submit error:', error);
      alert(`❌ ${error.message || 'Không thể gửi hợp đồng'}`);
    } finally {
      setSubmitting(null);
    }
  };

  const handleViewContract = (contract: Contract) => {
    // Navigate to contract detail or open PDF
    if (contract.pdfUrl) {
      window.open(contract.pdfUrl, '_blank');
    } else {
      alert('Hợp đồng chưa có file PDF');
    }
  };

  const filteredContracts = filterStatus === 'ALL' 
    ? contracts 
    : contracts.filter(c => c.status === filterStatus);

  return (
    <AdminLayout 
      activeTab="contracts"
      onTabChange={() => {}}
      counters={{
        cars: 0,
        dealers: 0,
        unverifiedDealers: 0,
        bookings: 0,
        testDrives: 0
      }}
    >
      <div className={styles.pageWrapper}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.headerIcon}>
              <i className="fas fa-file-contract"></i>
            </div>
            <div className={styles.headerText}>
              <h1>Quản lý hợp đồng</h1>
              <p>Theo dõi và quản lý toàn bộ hợp đồng mua bán xe điện</p>
            </div>
          </div>

        <div className={styles.filterSection}>
          <div className={styles.filterButtons}>
            <button 
              className={`${styles.filterButton} ${filterStatus === 'ALL' ? styles.active : ''}`}
              onClick={() => setFilterStatus('ALL')}
            >
              Tất cả ({contracts.length})
            </button>
            <button 
              className={`${styles.filterButton} ${filterStatus === 'DRAFT' ? styles.active : ''}`}
              onClick={() => setFilterStatus('DRAFT')}
            >
              Nháp ({contracts.filter(c => c.status === 'DRAFT').length})
            </button>
            <button 
              className={`${styles.filterButton} ${filterStatus === 'SIGNING' ? styles.active : ''}`}
              onClick={() => setFilterStatus('SIGNING')}
            >
              Đang ký ({contracts.filter(c => c.status === 'SIGNING').length})
            </button>
            <button 
              className={`${styles.filterButton} ${filterStatus === 'ACTIVE' ? styles.active : ''}`}
              onClick={() => setFilterStatus('ACTIVE')}
            >
              Hiệu lực ({contracts.filter(c => c.status === 'ACTIVE').length})
            </button>
            <button 
              className={`${styles.filterButton} ${filterStatus === 'COMPLETED' ? styles.active : ''}`}
              onClick={() => setFilterStatus('COMPLETED')}
            >
              Hoàn thành ({contracts.filter(c => c.status === 'COMPLETED').length})
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
                  <th>Mã HĐ</th>
                  <th>Đơn hàng</th>
                  <th>Khách hàng</th>
                  <th>Xe</th>
                  <th>Đại lý</th>
                  <th>Ngày tạo</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className={styles.emptyState}>
                      <i className="fas fa-inbox"></i>
                      <p>Không có dữ liệu</p>
                    </td>
                  </tr>
                ) : (
                  filteredContracts.map(contract => (
                    <tr key={contract.id}>
                      <td>
                        <div className={styles.contractId}>
                          #{contract.id}
                        </div>
                      </td>
                      <td>
                        <div className={styles.orderId}>
                          {contract.orderId?.length > 12 ? 
                            `${contract.orderId.substring(0, 12)}...` : 
                            contract.orderId || 'N/A'
                          }
                        </div>
                      </td>
                      <td>
                        <div className={styles.customerInfo}>
                          <div className={styles.customerName}>{contract.buyer?.name || 'N/A'}</div>
                          <div className={styles.customerPhone}>{contract.buyer?.phone || ''}</div>
                        </div>
                      </td>
                      <td>
                        <div className={styles.vehicleInfo}>
                          <div className={styles.vehicleModel}>{contract.vehicle?.model || 'N/A'}</div>
                          <div className={styles.vehicleVariant}>{contract.vehicle?.variant || ''}</div>
                        </div>
                      </td>
                      <td>{contract.dealer?.name || 'N/A'}</td>
                      <td>
                        <div className={styles.dateInfo}>
                          {formatDate(contract.createdAt)}
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[contract.status.toLowerCase()]}`}>
                          {getStatusLabel(contract.status)}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button 
                            className={`${styles.actionButton} ${styles.view}`}
                            title="Xem chi tiết"
                            onClick={() => handleViewDetail(contract)}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button 
                            className={`${styles.actionButton} ${styles.contract}`}
                            title="Xem hợp đồng"
                            onClick={() => handleViewContract(contract)}
                          >
                            <i className="fas fa-file-pdf"></i>
                          </button>
                          {contract.status === 'DRAFT' && (
                            <button 
                              className={`${styles.actionButton} ${styles.submit}`}
                              title="Gửi cho khách hàng"
                              onClick={() => handleSubmitToCustomer(contract)}
                              disabled={submitting === contract.id}
                            >
                              {submitting === contract.id ? (
                                <i className="fas fa-spinner fa-spin"></i>
                              ) : (
                                <i className="fas fa-paper-plane"></i>
                              )}
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

        {/* Detail Modal - TODO: Create ContractDetailModal component */}
        {showDetailModal && selectedContract && (
          <div className={styles.modalOverlay} onClick={() => setShowDetailModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>
                  <i className="fas fa-file-contract"></i>
                  Chi tiết hợp đồng
                </h2>
                <button onClick={() => setShowDetailModal(false)} className={styles.closeBtn}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.detailSection}>
                  <h3>Thông tin hợp đồng</h3>
                  <div className={styles.detailGrid}>
                    <div className={styles.detailItem}>
                      <span className={styles.label}>Mã hợp đồng:</span>
                      <span className={styles.value}>#{selectedContract.id}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.label}>Mã đơn hàng:</span>
                      <span className={styles.value}>{selectedContract.orderId}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.label}>Trạng thái:</span>
                      <span className={`${styles.statusBadge} ${styles[selectedContract.status.toLowerCase()]}`}>
                        {getStatusLabel(selectedContract.status)}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.label}>Ngày tạo:</span>
                      <span className={styles.value}>{formatDate(selectedContract.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.detailSection}>
                  <h3>Thông tin khách hàng</h3>
                  <div className={styles.detailGrid}>
                    <div className={styles.detailItem}>
                      <span className={styles.label}>Họ tên:</span>
                      <span className={styles.value}>{selectedContract.buyer?.name || 'N/A'}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.label}>Số điện thoại:</span>
                      <span className={styles.value}>{selectedContract.buyer?.phone || 'N/A'}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.label}>Email:</span>
                      <span className={styles.value}>{selectedContract.buyer?.email || 'N/A'}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.label}>Địa chỉ:</span>
                      <span className={styles.value}>{selectedContract.buyer?.address || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.detailSection}>
                  <h3>Thông tin xe</h3>
                  <div className={styles.detailGrid}>
                    <div className={styles.detailItem}>
                      <span className={styles.label}>Mẫu xe:</span>
                      <span className={styles.value}>{selectedContract.vehicle?.model || 'N/A'}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.label}>Phiên bản:</span>
                      <span className={styles.value}>{selectedContract.vehicle?.variant || 'N/A'}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.label}>Màu sắc:</span>
                      <span className={styles.value}>{selectedContract.vehicle?.color || 'N/A'}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.label}>VIN:</span>
                      <span className={styles.value}>{selectedContract.vehicle?.vin || 'Chưa cập nhật'}</span>
                    </div>
                  </div>
                </div>

                {selectedContract.pricing && (
                  <div className={styles.detailSection}>
                    <h3>Thông tin giá</h3>
                    <div className={styles.pricingInfo}>
                      <div className={styles.priceRow}>
                        <span>Giá niêm yết:</span>
                        <span>{selectedContract.pricing.subtotal?.toLocaleString('vi-VN')} ₫</span>
                      </div>
                      <div className={styles.priceRow}>
                        <span>Chiết khấu:</span>
                        <span className={styles.discount}>-{selectedContract.pricing.discount?.toLocaleString('vi-VN')} ₫</span>
                      </div>
                      <div className={styles.priceRow}>
                        <span>Phí khác:</span>
                        <span>{selectedContract.pricing.fees?.toLocaleString('vi-VN') || 0} ₫</span>
                      </div>
                      <div className={styles.priceRowTotal}>
                        <span>Tổng cộng:</span>
                        <span className={styles.total}>{selectedContract.pricing.total?.toLocaleString('vi-VN')} ₫</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </AdminLayout>
  );
};

export default ContractManagementPage;
