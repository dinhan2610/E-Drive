import React, { useState, useEffect } from 'react';
import { getDealerInventory, updateDealerInventory } from '../services/inventoryApi';
import { getProfile } from '../services/profileApi';
import { getCurrentUser } from '../utils/authUtils';
import styles from '../styles/InventoryStyles/DealerInventory.module.scss';
import ConfirmDialog from '../components/ConfirmDialog';
import SuccessNotification from '../components/SuccessNotification';

interface DealerInventoryItem {
  vehicleId: number;
  modelName: string;
  version: string;
  colorName: string;
  quantity: number;
}

interface Notification {
  isVisible: boolean;
  message: string;
  type: 'success' | 'error';
}

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
}

const DealerInventoryPage: React.FC = () => {
  // State Management
  const [dealerId, setDealerId] = useState<number | null>(null);
  const [inventory, setInventory] = useState<DealerInventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<DealerInventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');
  
  // Modal States
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<DealerInventoryItem | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(0);
  const [editError, setEditError] = useState<string>('');
  
  // Notification & Dialog
  const [notification, setNotification] = useState<Notification>({
    isVisible: false,
    message: '',
    type: 'success'
  });
  
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {}
  });

  // Fetch dealerId from API on mount
  useEffect(() => {
    const fetchDealerId = async () => {
      try {
        const user = getCurrentUser();
        if (!user) {
          console.warn('⚠️ No user found');
          return;
        }
        
        console.log('👤 Current user:', user.username, '- Role:', user.role);
        
        // Fetch dealer profile from API
        try {
          const profile = await getProfile();
          console.log('✅ Dealer profile loaded:', profile);
          setDealerId(profile.dealerId);
          return;
        } catch (profileError: any) {
          console.warn('⚠️ Failed to fetch profile:', profileError.message);
        }
        
        // Fallback: Extract dealerId from username pattern (d1_manager, d1_staff, etc.)
        const usernameMatch = user.username?.match(/^d(\d+)_/);
        if (usernameMatch) {
          const extractedDealerId = parseInt(usernameMatch[1]);
          console.log('✅ Dealer ID extracted from username:', extractedDealerId);
          setDealerId(extractedDealerId);
          return;
        }
        
        console.warn('⚠️ Could not determine dealer ID');
      } catch (err: any) {
        console.error('❌ Error fetching dealerId:', err.message);
      }
    };
    
    fetchDealerId();
  }, []);

  // Load Inventory
  const loadInventory = async () => {
    if (dealerId === null) {
      console.log('⏳ Waiting for dealerId to load inventory...');
      return;
    }

    try {
      setIsLoading(true);
      console.log('🔄 Loading inventory for dealer:', dealerId);
      const data = await getDealerInventory(dealerId);
      console.log('✅ Inventory loaded:', data);
      setInventory(data);
      setFilteredInventory(data);
    } catch (error: any) {
      console.error('❌ Error loading inventory:', error);
      setNotification({
        isVisible: true,
        message: error.message || 'Không thể tải dữ liệu kho hàng',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load inventory when dealerId is available
  useEffect(() => {
    if (dealerId !== null) {
      loadInventory();
    }
  }, [dealerId]);

  // Filter and search
  useEffect(() => {
    let filtered = [...inventory];

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(item => {
        if (filterStatus === 'out-of-stock') return item.quantity === 0;
        if (filterStatus === 'low-stock') return item.quantity > 0 && item.quantity <= 20;
        if (filterStatus === 'in-stock') return item.quantity > 20;
        return true;
      });
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.modelName.toLowerCase().includes(search) ||
        item.version.toLowerCase().includes(search) ||
        item.colorName.toLowerCase().includes(search)
      );
    }

    setFilteredInventory(filtered);
  }, [searchTerm, filterStatus, inventory]);

  // Calculate statistics
  const totalQuantity = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const totalModels = inventory.length;
  const inStockCount = inventory.filter(item => item.quantity > 20).length;
  const lowStockCount = inventory.filter(item => item.quantity > 0 && item.quantity <= 20).length;
  const outOfStockCount = inventory.filter(item => item.quantity === 0).length;

  // Get stock status
  const getStockStatus = (quantity: number): { label: string; className: string } => {
    if (quantity === 0) return { label: 'Hết hàng', className: styles.inactive };
    if (quantity <= 20) return { label: 'Sắp hết', className: styles.warning };
    return { label: 'Còn hàng', className: styles.active };
  };

  // Format vehicle display name
  const formatVehicleDisplayName = (item: DealerInventoryItem): string => {
    return `${item.modelName} ${item.version} - ${item.colorName}`;
  };

  // Handle view item
  const handleViewItem = (item: DealerInventoryItem) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  // Handle edit item
  const handleEditItem = (item: DealerInventoryItem) => {
    setSelectedItem(item);
    setEditQuantity(item.quantity);
    setEditError('');
    setShowEditModal(true);
  };

  // Handle update quantity
  const handleUpdateQuantity = async () => {
    if (!selectedItem) return;

    // Validation
    if (editQuantity < 0) {
      setEditError('Số lượng không được âm');
      return;
    }

    if (dealerId === null) {
      setNotification({
        isVisible: true,
        message: 'Không tìm thấy thông tin đại lý',
        type: 'error'
      });
      return;
    }

    setIsUpdating(true);
    try {
      await updateDealerInventory(dealerId, selectedItem.vehicleId, editQuantity);
      setShowEditModal(false);
      setSelectedItem(null);
      setNotification({
        isVisible: true,
        message: 'Cập nhật số lượng thành công!',
        type: 'success'
      });
      await loadInventory();
    } catch (error: any) {
      setNotification({
        isVisible: true,
        message: error.message || 'Cập nhật thất bại',
        type: 'error'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div className={styles.pageWrapper}>
        <div className={styles.container}>
          {/* Page Header */}
          <div className={styles.pageHeader}>
            <h1>Kho Hàng Đại Lý</h1>
            <div className={styles.summaryBadges}>
              <div className={styles.summaryBadge}>
                <i className="fas fa-warehouse"></i>
                <span>Tổng: <strong>{totalQuantity}</strong> xe</span>
              </div>
              <div className={styles.summaryBadge}>
                <i className="fas fa-car"></i>
                <span>Loại: <strong>{totalModels}</strong></span>
              </div>
            </div>
          </div>

        
         
          {/* Filters and Search */}
          <div className={styles.filterSection}>
            {/* Search Bar */}
            <div className={styles.searchBox}>
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Tìm kiếm theo tên xe, phiên bản, màu sắc..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter Buttons */}
            <div className={styles.filterButtons}>
              <button
                className={`${styles.filterButton} ${filterStatus === 'all' ? styles.active : ''}`}
                onClick={() => setFilterStatus('all')}
              >
                <i className="fas fa-list"></i>
                Tất cả ({inventory.length})
              </button>
              <button
                className={`${styles.filterButton} ${filterStatus === 'in-stock' ? styles.active : ''}`}
                onClick={() => setFilterStatus('in-stock')}
              >
                <i className="fas fa-check-circle"></i>
                Còn hàng ({inStockCount})
              </button>
              <button
                className={`${styles.filterButton} ${filterStatus === 'low-stock' ? styles.active : ''}`}
                onClick={() => setFilterStatus('low-stock')}
              >
                <i className="fas fa-exclamation-triangle"></i>
                Sắp hết ({lowStockCount})
              </button>
              <button
                className={`${styles.filterButton} ${filterStatus === 'out-of-stock' ? styles.active : ''}`}
                onClick={() => setFilterStatus('out-of-stock')}
              >
                <i className="fas fa-times-circle"></i>
                Hết hàng ({outOfStockCount})
              </button>
            </div>
            
          </div>

          {/* Inventory Table */}
          <div className={styles.tableWrapper}>
            <div className={styles.tableContainer}>
              <table>
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Tên xe</th>
                  <th>Phiên bản</th>
                  <th>Màu sắc</th>
                  <th>Số lượng tồn kho</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '60px' }}>
                      <i className="fas fa-spinner fa-spin" style={{ fontSize: '36px', color: '#ff4d30', marginBottom: '16px', display: 'block' }}></i>
                      <p style={{ color: '#888', fontSize: '14px' }}>Đang tải dữ liệu kho hàng...</p>
                    </td>
                  </tr>
                ) : filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
                      <i className="fas fa-inbox" style={{ fontSize: '48px', marginBottom: '16px', display: 'block', color: '#d1d5db' }}></i>
                      <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                        {searchTerm || filterStatus !== 'all' ? 'Không tìm thấy kết quả' : 'Kho hàng trống'}
                      </p>
                      <p style={{ fontSize: '14px', color: '#9ca3af' }}>
                        {searchTerm || filterStatus !== 'all' 
                          ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                          : 'Chưa có sản phẩm nào trong kho'
                        }
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item, index) => {
                    const status = getStockStatus(item.quantity);
                    return (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: '#1f2937' }}>
                            {item.modelName}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '14px', color: '#6b7280' }}>
                            {item.version}
                          </div>
                        </td>
                        <td>
                          <div style={{
                            display: 'inline-block',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            background: '#f3f4f6',
                            color: '#374151',
                            fontSize: '13px',
                            fontWeight: 600
                          }}>
                            {item.colorName}
                          </div>
                        </td>
                        <td>
                          <div style={{
                            display: 'inline-block',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            background: item.quantity > 50 
                              ? '#d1fae5' 
                              : item.quantity > 20 
                                ? '#fef3c7' 
                                : item.quantity > 0
                                  ? '#fee2e2'
                                  : '#f3f4f6',
                            color: item.quantity > 50 
                              ? '#065f46' 
                              : item.quantity > 20 
                                ? '#92400e' 
                                : item.quantity > 0
                                  ? '#991b1b'
                                  : '#6b7280',
                            fontWeight: 700,
                            fontSize: '14px'
                          }}>
                            {item.quantity} xe
                          </div>
                        </td>
                        <td>
                          <span className={`${styles.statusBadge} ${status.className}`}>
                            {status.label}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              className={styles.viewButton}
                              title="Xem chi tiết"
                              onClick={() => handleViewItem(item)}
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              className={styles.editButton}
                              title="Cập nhật số lượng"
                              onClick={() => handleEditItem(item)}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>

      {/* View Modal */}
        {showViewModal && selectedItem && (
          <div className={styles.modalOverlay} onClick={() => {
            setShowViewModal(false);
            setSelectedItem(null);
          }}>
            <div className={styles.modal} style={{ maxWidth: '650px', margin: '20px' }} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>
                  <i className="fas fa-eye"></i>
                  Chi tiết xe trong kho
                </h2>
                <button
                  className={styles.closeButton}
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedItem(null);
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className={styles.modalBody} style={{ padding: '24px', maxHeight: 'calc(90vh - 180px)', overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{
                    padding: '24px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '12px',
                    color: 'white',
                    textAlign: 'center'
                  }}>
                    <h3 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px', margin: 0 }}>
                      {formatVehicleDisplayName(selectedItem)}
                    </h3>
                    <p style={{ fontSize: '14px', opacity: 0.9, margin: '8px 0 0 0' }}>Thông tin chi tiết xe trong kho</p>
                  </div>

                  <div className={styles.detailGrid}>
                    <div className={styles.detailItem}>
                      <label><i className="fas fa-car"></i> Tên xe</label>
                      <span>{selectedItem.modelName}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <label><i className="fas fa-tag"></i> Phiên bản</label>
                      <span>{selectedItem.version}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <label><i className="fas fa-palette"></i> Màu sắc</label>
                      <span>{selectedItem.colorName}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <label><i className="fas fa-boxes"></i> Số lượng tồn kho</label>
                      <span style={{ 
                        fontSize: '18px', 
                        fontWeight: 700,
                        color: selectedItem.quantity > 20 ? '#10b981' : selectedItem.quantity > 0 ? '#f59e0b' : '#ef4444'
                      }}>
                        {selectedItem.quantity} xe
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <label><i className="fas fa-info-circle"></i> Trạng thái</label>
                      <span className={`${styles.statusBadge} ${getStockStatus(selectedItem.quantity).className}`}>
                        {getStockStatus(selectedItem.quantity).label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedItem(null);
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal - Temporarily disabled */}
        {showEditModal && selectedItem && (
          <div className={styles.modalOverlay} onClick={() => {
            setShowEditModal(false);
            setSelectedItem(null);
            setEditQuantity(0);
            setEditError('');
          }}>
            <div className={styles.modal} style={{ maxWidth: '650px', margin: '20px' }} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>
                  <i className="fas fa-edit"></i>
                  Cập nhật số lượng tồn kho
                </h2>
                <button
                  className={styles.closeButton}
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedItem(null);
                    setEditQuantity(0);
                    setEditError('');
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className={styles.modalBody} style={{ padding: '24px', maxHeight: 'calc(90vh - 180px)', overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Vehicle Info */}
                  <div style={{
                    padding: '20px',
                    background: '#f3f4f6',
                    borderRadius: '10px',
                    border: '2px solid #e5e7eb'
                  }}>
                    <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#374151', margin: '0 0 16px 0' }}>
                      <i className="fas fa-car" style={{ marginRight: '8px', color: '#ff4d30' }}></i>
                      Thông tin xe
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '14px' }}>
                      <div style={{ padding: '8px 0' }}>
                        <strong style={{ display: 'block', marginBottom: '4px', color: '#6b7280' }}>Tên xe:</strong>
                        <span style={{ color: '#1f2937' }}>{selectedItem.modelName}</span>
                      </div>
                      <div style={{ padding: '8px 0' }}>
                        <strong style={{ display: 'block', marginBottom: '4px', color: '#6b7280' }}>Phiên bản:</strong>
                        <span style={{ color: '#1f2937' }}>{selectedItem.version}</span>
                      </div>
                      <div style={{ padding: '8px 0' }}>
                        <strong style={{ display: 'block', marginBottom: '4px', color: '#6b7280' }}>Màu sắc:</strong>
                        <span style={{ color: '#1f2937' }}>{selectedItem.colorName}</span>
                      </div>
                      <div style={{ padding: '8px 0' }}>
                        <strong style={{ display: 'block', marginBottom: '4px', color: '#6b7280' }}>Số lượng hiện tại:</strong>
                        <span style={{ color: '#ff4d30', fontWeight: 700, fontSize: '16px' }}>{selectedItem.quantity} xe</span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Input */}
                  <div className={styles.formGroup}>
                    <label style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block', color: '#374151' }}>
                      Số lượng mới <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="number"
                      value={editQuantity}
                      onChange={(e) => {
                        setEditQuantity(parseInt(e.target.value) || 0);
                        setEditError('');
                      }}
                      min="0"
                      placeholder="Nhập số lượng xe"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: editError ? '2px solid #ef4444' : '2px solid #e5e7eb',
                        borderRadius: '10px',
                        fontSize: '14px'
                      }}
                    />
                    {editError && (
                      <span style={{ color: '#ef4444', fontSize: '13px', marginTop: '4px', display: 'block' }}>
                        <i className="fas fa-exclamation-circle"></i> {editError}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedItem(null);
                    setEditQuantity(0);
                    setEditError('');
                  }}
                >
                  Hủy
                </button>
                <button
                  className={styles.primaryButton}
                  onClick={handleUpdateQuantity}
                  disabled={isUpdating}
                  style={{ opacity: isUpdating ? 0.7 : 1, cursor: isUpdating ? 'not-allowed' : 'pointer' }}
                >
                  {isUpdating ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Đang cập nhật...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i>
                      Cập nhật
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Dialog */}
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          type={confirmDialog.type}
          onConfirm={confirmDialog.onConfirm}
          onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        />

        {/* Success Notification */}
        <SuccessNotification
          isVisible={notification.isVisible}
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(prev => ({ ...prev, isVisible: false }))}
        />
    </div>
    </>
  );
};

export default DealerInventoryPage;
