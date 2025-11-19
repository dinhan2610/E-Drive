import React, { useState, useEffect } from 'react';
import { 
  listServiceAccessories, 
  createServiceAccessory, 
  updateServiceAccessory,
  deleteServiceAccessory,
  toggleServiceAccessoryStatus,
  getServiceAccessoryStats,
  getCategoryLabel,
  getCategoryColor,
  getDefaultIcon,
  type ServiceAccessory,
  type ServiceCategory,
  type CreateServiceAccessoryDto
} from '../services/serviceAccessoryApi';
import { getProfile } from '../services/profileApi';
import styles from '../styles/ServiceAccessoryStyles/ServiceAccessoryManagement.module.scss';

// ===== UTILITY FUNCTIONS =====
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Chưa có';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  } catch {
    return dateString;
  }
};

const ServiceAccessoryManagementPage: React.FC = () => {
  // ===== STATE MANAGEMENT =====
  const [services, setServices] = useState<ServiceAccessory[]>([]);
  const [loading, setLoading] = useState(false);
  const [dealerInfo, setDealerInfo] = useState<{ id: number; name?: string } | null>(null);
  
  // Filter and search state
  const [filterCategory, setFilterCategory] = useState<ServiceCategory | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceAccessory | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<CreateServiceAccessoryDto>({
    name: '',
    description: '',
    price: 0,
    category: 'accessory',
    icon: 'fa-cube',
    isActive: true,
    dealerId: 0,
  });
  
  // Stats state
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    byCategory: {
      protection: 0,
      charging: 0,
      warranty: 0,
      accessory: 0,
    },
  });

  // ===== LOAD DEALER PROFILE =====
  useEffect(() => {
    const loadDealerProfile = async () => {
      try {
        const profile = await getProfile();
        if (profile.dealerId) {
          setDealerInfo({
            id: profile.dealerId,
            name: profile.agencyName || `Đại lý #${profile.dealerId}`
          });
        }
      } catch (error) {
        console.error('❌ Failed to fetch profile:', error);
        setDealerInfo({ id: 1, name: 'Đại lý #1' });
      }
    };
    
    loadDealerProfile();
  }, []);

  // ===== LOAD DATA =====
  useEffect(() => {
    if (dealerInfo?.id) {
      loadServices();
      loadStats();
    }
  }, [dealerInfo?.id, filterCategory, filterStatus, searchQuery]);

  const loadServices = async () => {
    if (!dealerInfo?.id) return;
    
    try {
      setLoading(true);
      const result = await listServiceAccessories({
        dealerId: dealerInfo.id,
        category: filterCategory === 'ALL' ? undefined : filterCategory,
        isActive: filterStatus === 'ALL' ? undefined : filterStatus === 'ACTIVE',
        search: searchQuery || undefined,
      });
      
      setServices(result.items || []);
    } catch (error) {
      console.error('Error loading services:', error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!dealerInfo?.id) return;
    
    try {
      const statsData = await getServiceAccessoryStats(dealerInfo.id);
      setStats(statsData as typeof stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // ===== HANDLERS =====
  const handleCreate = () => {
    setIsEditing(false);
    setFormData({
      name: '',
      description: '',
      price: 0,
      category: 'accessory',
      icon: getDefaultIcon('accessory'),
      isActive: true,
      dealerId: dealerInfo?.id || 0,
    });
    setShowFormModal(true);
  };

  const handleEdit = (service: ServiceAccessory) => {
    setIsEditing(true);
    setSelectedService(service);
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price,
      category: service.category,
      icon: service.icon,
      isActive: service.isActive,
      dealerId: service.dealerId,
    });
    setShowFormModal(true);
  };

  const handleViewDetail = (service: ServiceAccessory) => {
    setSelectedService(service);
    setShowDetailModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dealerInfo?.id) return;
    
    try {
      if (isEditing && selectedService) {
        await updateServiceAccessory(dealerInfo.id, selectedService.id, formData);
        alert('✅ Cập nhật dịch vụ/phụ kiện thành công!');
      } else {
        await createServiceAccessory({ ...formData, dealerId: dealerInfo.id });
        alert('✅ Tạo dịch vụ/phụ kiện thành công!');
      }
      
      setShowFormModal(false);
      loadServices();
      loadStats();
    } catch (error: any) {
      alert(`❌ ${error.message}`);
    }
  };

  const handleDelete = async (service: ServiceAccessory) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa "${service.name}" không?`)) return;
    
    if (!dealerInfo?.id) return;
    
    try {
      await deleteServiceAccessory(dealerInfo.id, service.id);
      alert('✅ Đã xóa dịch vụ/phụ kiện!');
      loadServices();
      loadStats();
    } catch (error: any) {
      alert(`❌ ${error.message}`);
    }
  };

  const handleToggleStatus = async (service: ServiceAccessory) => {
    if (!dealerInfo?.id) return;
    
    try {
      await toggleServiceAccessoryStatus(dealerInfo.id, service.id, !service.isActive);
      loadServices();
      loadStats();
    } catch (error: any) {
      alert(`❌ ${error.message}`);
    }
  };

  // ===== FILTERED DATA =====
  const filteredServices = services;

  // ===== RENDER =====
  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerIcon}>
              <i className="fa-solid fa-toolbox"></i>
            </div>
            <div className={styles.headerText}>
              <h1>Quản Lý Dịch Vụ & Phụ Kiện</h1>
              <p>
                Quản lý các dịch vụ bổ sung và phụ kiện cho báo giá
                {dealerInfo && (
                  <span className={styles.dealerBadge}>
                    <i className="fa-solid fa-store"></i>
                    {dealerInfo.name}
                  </span>
                )}
              </p>
            </div>
            <button className={styles.createButton} onClick={handleCreate}>
              <i className="fa-solid fa-plus"></i>
              <span>Thêm mới</span>
            </button>
          </div>
        </div>

        {/* Toolbar - Search and Filters */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, mô tả..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
         

          <div className={styles.statusFilters}>
            <button
              className={`${styles.statusButton} ${filterStatus === 'ALL' ? styles.active : ''}`}
              onClick={() => setFilterStatus('ALL')}
            >
              Tất cả
            </button>
            <button
              className={`${styles.statusButton} ${filterStatus === 'ACTIVE' ? styles.active : ''}`}
              onClick={() => setFilterStatus('ACTIVE')}
            >
              <i className="fa-solid fa-circle-check"></i>
              Hoạt động
            </button>
            <button
              className={`${styles.statusButton} ${filterStatus === 'INACTIVE' ? styles.active : ''}`}
              onClick={() => setFilterStatus('INACTIVE')}
            >
              <i className="fa-solid fa-circle-pause"></i>
              Tạm ngưng
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className={styles.loading}>
            <i className="fa-solid fa-spinner fa-spin"></i>
            <p>Đang tải dữ liệu...</p>
          </div>
        )}

        {/* Table */}
        {!loading && (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên dịch vụ/Phụ kiện</th>
                  <th>Danh mục</th>
                  <th>Giá</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles.emptyState}>
                      <i className="fa-solid fa-inbox"></i>
                      <p>Chưa có dịch vụ/phụ kiện nào</p>
                    </td>
                  </tr>
                ) : (
                  filteredServices.map((service) => (
                    <tr key={service.id}>
                      <td>#{service.id}</td>
                      <td>
                        <div className={styles.serviceInfo}>
                          <div 
                            className={styles.serviceIcon}
                            style={{ background: getCategoryColor(service.category) }}
                          >
                            <i className={`fa-solid ${service.icon}`}></i>
                          </div>
                          <div>
                            <div className={styles.serviceName}>{service.name}</div>
                            <div className={styles.serviceDesc}>{service.description}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span 
                          className={styles.categoryBadge}
                          style={{ background: getCategoryColor(service.category) }}
                        >
                          {getCategoryLabel(service.category)}
                        </span>
                      </td>
                      <td>
                        <span className={styles.price}>{formatPrice(service.price)}</span>
                      </td>
                      <td>
                        <button
                          className={`${styles.statusBadge} ${service.isActive ? styles.active : styles.inactive}`}
                          onClick={() => handleToggleStatus(service)}
                          title="Click để thay đổi trạng thái"
                        >
                          {service.isActive ? 'Hoạt động' : 'Tạm ngưng'}
                        </button>
                      </td>
                      <td>{formatDate(service.createdAt)}</td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button
                            className={styles.actionButton}
                            onClick={() => handleViewDetail(service)}
                            title="Xem chi tiết"
                          >
                            <i className="fa-solid fa-eye"></i>
                          </button>
                          <button
                            className={styles.actionButton}
                            onClick={() => handleEdit(service)}
                            title="Chỉnh sửa"
                          >
                            <i className="fa-solid fa-pen"></i>
                          </button>
                          <button
                            className={`${styles.actionButton} ${styles.delete}`}
                            onClick={() => handleDelete(service)}
                            title="Xóa"
                          >
                            <i className="fa-solid fa-trash"></i>
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

        {/* Form Modal */}
        {showFormModal && (
          <div className={styles.modal} onClick={() => setShowFormModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>
                  {isEditing ? 'Chỉnh sửa dịch vụ/phụ kiện' : 'Thêm dịch vụ/phụ kiện mới'}
                </h2>
                <button className={styles.closeButton} onClick={() => setShowFormModal(false)}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              
              <form className={styles.form} onSubmit={handleSubmit}>
                {/* Service Name */}
                <div className={styles.formGroup}>
                  <label>
                    <i className="fa-solid fa-tag"></i>
                    Tên dịch vụ/Phụ kiện <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Nhập tên dịch vụ hoặc phụ kiện (VD: Dán phim cách nhiệt 3M)"
                    className={styles.input}
                  />
                  <small className={styles.helpText}>
                    <i className="fa-solid fa-circle-info"></i>
                    Tên sẽ hiển thị trong danh sách lựa chọn khi tạo báo giá
                  </small>
                </div>

                {/* Price */}
                <div className={styles.formGroup}>
                  <label>
                    <i className="fa-solid fa-money-bill-wave"></i>
                    Giá <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.priceInputWrapper}>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      required
                      min="0"
                      step="1000"
                      placeholder="0"
                      className={styles.input}
                    />
                    <span className={styles.currency}>VNĐ</span>
                  </div>
                  {formData.price > 0 && (
                    <small className={styles.priceDisplay}>
                      {formData.price.toLocaleString('vi-VN')} đồng
                    </small>
                  )}
                </div>

                {/* Description */}
                <div className={styles.formGroup}>
                  <label>
                    <i className="fa-solid fa-align-left"></i>
                    Mô tả chi tiết
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    placeholder="Nhập mô tả chi tiết về dịch vụ/phụ kiện này...&#10;&#10;VD: Phim cách nhiệt cao cấp 3M, chống nóng hiệu quả, chống tia UV 99%, bảo vệ nội thất xe"
                    className={styles.textarea}
                  />
                  <small className={styles.charCount}>
                    {formData.description.length} ký tự
                  </small>
                </div>

                {/* Active Status */}
                <div className={styles.statusToggle}>
                  <div className={styles.toggleGroup}>
                    <label className={styles.toggleLabel}>
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className={styles.toggleInput}
                      />
                      <span className={styles.toggleSwitch}>
                        <span className={styles.toggleSlider}></span>
                      </span>
                      <span className={styles.toggleText}>
                        <i className={`fa-solid ${formData.isActive ? 'fa-circle-check' : 'fa-circle-xmark'}`}></i>
                        {formData.isActive ? 'Hoạt động ngay khi tạo' : 'Tạm ngừng hoạt động'}
                      </span>
                    </label>
                  </div>
                  <small className={styles.helpText}>
                    {formData.isActive 
                      ? 'Dịch vụ sẽ xuất hiện trong danh sách lựa chọn ngay lập tức'
                      : 'Dịch vụ sẽ được lưu nhưng chưa hiển thị cho khách hàng'}
                  </small>
                </div>

                {/* Form Actions */}
                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelButton} onClick={() => setShowFormModal(false)}>
                    <i className="fa-solid fa-xmark"></i>
                    Hủy bỏ
                  </button>
                  <button type="submit" className={styles.submitButton}>
                    <i className={`fa-solid ${isEditing ? 'fa-check' : 'fa-plus'}`}></i>
                    {isEditing ? 'Cập nhật' : 'Tạo mới'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedService && (
          <div className={styles.modal} onClick={() => setShowDetailModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Chi tiết dịch vụ/phụ kiện</h2>
                <button className={styles.closeButton} onClick={() => setShowDetailModal(false)}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              
              <div className={styles.detailContent}>
                <div className={styles.detailRow}>
                  <div className={styles.detailLabel}>ID:</div>
                  <div className={styles.detailValue}>#{selectedService.id}</div>
                </div>
                
                <div className={styles.detailRow}>
                  <div className={styles.detailLabel}>Tên:</div>
                  <div className={styles.detailValue}>{selectedService.name}</div>
                </div>
                
                <div className={styles.detailRow}>
                  <div className={styles.detailLabel}>Danh mục:</div>
                  <div className={styles.detailValue}>
                    <span 
                      className={styles.categoryBadge}
                      style={{ background: getCategoryColor(selectedService.category) }}
                    >
                      <i className={`fa-solid ${selectedService.icon}`}></i>
                      {getCategoryLabel(selectedService.category)}
                    </span>
                  </div>
                </div>
                
                <div className={styles.detailRow}>
                  <div className={styles.detailLabel}>Giá:</div>
                  <div className={styles.detailValue}>
                    <strong>{formatPrice(selectedService.price)}</strong>
                  </div>
                </div>
                
                <div className={styles.detailRow}>
                  <div className={styles.detailLabel}>Mô tả:</div>
                  <div className={styles.detailValue}>{selectedService.description || 'Không có'}</div>
                </div>
                
                <div className={styles.detailRow}>
                  <div className={styles.detailLabel}>Trạng thái:</div>
                  <div className={styles.detailValue}>
                    <span className={`${styles.statusBadge} ${selectedService.isActive ? styles.active : styles.inactive}`}>
                      {selectedService.isActive ? 'Đang hoạt động' : 'Tạm ngưng'}
                    </span>
                  </div>
                </div>
                
                <div className={styles.detailRow}>
                  <div className={styles.detailLabel}>Ngày tạo:</div>
                  <div className={styles.detailValue}>{formatDate(selectedService.createdAt)}</div>
                </div>
                
                <div className={styles.detailRow}>
                  <div className={styles.detailLabel}>Cập nhật:</div>
                  <div className={styles.detailValue}>{formatDate(selectedService.updatedAt)}</div>
                </div>
              </div>
              
              <div className={styles.modalActions}>
                <button className={styles.cancelButton} onClick={() => setShowDetailModal(false)}>
                  Đóng
                </button>
                <button className={styles.submitButton} onClick={() => {
                  setShowDetailModal(false);
                  handleEdit(selectedService);
                }}>
                  <i className="fa-solid fa-pen"></i>
                  Chỉnh sửa
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceAccessoryManagementPage;
