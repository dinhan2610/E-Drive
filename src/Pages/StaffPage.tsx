import React, { useState, useEffect, useCallback } from 'react';
import type { Staff, CreateStaffPayload, UpdateStaffPayload } from '../types/staff';
import { 
  listStaff, 
  createStaff, 
  updateStaff, 
  deleteStaff
} from '../services/staffApi';
import StaffTable from '../components/staff/StaffTable';
import StaffForm from '../components/staff/StaffForm';
import StaffDetail from '../components/staff/StaffDetail';
import ConfirmDialog from '../components/staff/ConfirmDialog';
import styles from '../styles/StaffStyles/StaffPage.module.scss';

// Helper function to remove Vietnamese tones for searching
const removeVietnameseTones = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
};

const StaffPage: React.FC = () => {
  // Staff data state
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  
  // Modal and UI state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load staff data
  const loadStaff = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listStaff();
      setAllStaff(data);
      setStaff(data);
    } catch (error) {
      console.error('Failed to load staff:', error);
      setAllStaff([]);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchInput.trim() !== searchQuery) {
        setSearchQuery(searchInput);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchInput, searchQuery]);

  // Filter staff client-side when searchQuery changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setStaff(allStaff);
      return;
    }

    const searchLower = removeVietnameseTones(searchQuery.trim());
    
    const filtered = allStaff.filter(s => {
      const username = removeVietnameseTones(s.username || '');
      const fullName = removeVietnameseTones(s.fullName || '');
      const email = removeVietnameseTones(s.email || '');
      const phone = removeVietnameseTones(s.phone || '');
      
      return username.includes(searchLower) ||
             fullName.includes(searchLower) ||
             email.includes(searchLower) ||
             phone.includes(searchLower);
    });
    
    setStaff(filtered);
  }, [searchQuery, allStaff]);

  // Load data on mount
  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  // Handlers for CRUD operations
  const handleCreateStaff = () => {
    setEditingStaff(null);
    setIsFormOpen(true);
  };

  const handleEditStaff = (staff: Staff) => {
    setEditingStaff(staff);
    setIsFormOpen(true);
  };

  const handleViewStaff = (staff: Staff) => {
    setSelectedStaff(staff);
    setIsDetailOpen(true);
  };

  const handleDeleteStaff = (staff: Staff) => {
    setStaffToDelete(staff);
    setIsDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (data: CreateStaffPayload | UpdateStaffPayload) => {
    setFormLoading(true);
    try {
      if (editingStaff) {
        await updateStaff(editingStaff.userId, data as UpdateStaffPayload);
      } else {
        await createStaff(data as CreateStaffPayload);
      }
      await loadStaff();
      setIsFormOpen(false);
      setEditingStaff(null);
    } catch (error) {
      console.error('Failed to save staff:', error);
      alert('Không thể lưu nhân viên. Vui lòng thử lại.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!staffToDelete) return;
    
    setDeleteLoading(true);
    try {
      await deleteStaff(staffToDelete.userId);
      await loadStaff();
      setIsDeleteDialogOpen(false);
      setStaffToDelete(null);
      
      // Close detail view if the deleted staff was being viewed
      if (selectedStaff && selectedStaff.userId === staffToDelete.userId) {
        setIsDetailOpen(false);
        setSelectedStaff(null);
      }
      
      alert(`✅ Đã xóa nhân viên ${staffToDelete.fullName} thành công!`);
    } catch (error: any) {
      console.error('Failed to delete staff:', error);
      alert(`❌ Lỗi: ${error.message || 'Không thể xóa nhân viên.'}`);
    } finally {
      setDeleteLoading(false);
    }
  };



  // Handler for search input
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
  };

  return (
    <div className={styles.staffPage}>
      {/* Hero Header */}
      <div className={styles.heroHeader}>
        <div className={styles.heroContent}>
          <div className={styles.heroTop}>
            <div className={styles.heroLeft}>
              <div className={styles.statsDisplay}>
                <div className={styles.statItem}>
                  <i className="fas fa-users-cog" />
                  <div className={styles.statContent}>
                    <span className={styles.statNumber}>{allStaff.length.toLocaleString()}</span>
                    <span className={styles.statLabel}>Nhân viên</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Search and Filters */}
        <div className={styles.filtersSection}>
          <div className={styles.filtersContainer}>
            {/* Search */}
            <div className={styles.searchBox}>
              <i className="fas fa-search" />
              <input
                type="text"
                placeholder="Tìm kiếm nhân viên "
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className={styles.searchInput}
              />
              {searchInput && searchInput !== searchQuery && (
                <div className={styles.searchLoading}>
                  <i className="fas fa-spinner fa-spin" />
                </div>
              )}
              {searchInput && (
                <button
                  type="button"
                  className={styles.clearSearch}
                  onClick={() => handleSearchChange('')}
                  title="Xóa tìm kiếm"
                >
                  <i className="fas fa-times" />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className={styles.filters}>
              {/* Add Staff Button */}
              <button 
                className={styles.createButton}
                onClick={handleCreateStaff}
              >
                <i className="fas fa-plus" />
                Thêm nhân viên
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableSection}>
          <StaffTable
            staff={staff}
            loading={loading}
            onView={handleViewStaff}
            onRowClick={handleViewStaff}
            onEdit={handleEditStaff}
            onDelete={handleDeleteStaff}
          />
        </div>
      </div>

      {/* Staff Form Modal */}
      <StaffForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingStaff(null);
        }}
        onSubmit={handleFormSubmit}
        staff={editingStaff}
        isLoading={formLoading}
      />

      {/* Staff Detail Drawer */}
      <StaffDetail
        staff={selectedStaff}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedStaff(null);
        }}
        onEdit={(staff) => {
          setIsDetailOpen(false);
          handleEditStaff(staff);
        }}
        onDelete={(staff) => {
          setIsDetailOpen(false);
          handleDeleteStaff(staff);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onCancel={() => {
          setIsDeleteDialogOpen(false);
          setStaffToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Xóa nhân viên"
        message={staffToDelete ? `Bạn có chắc chắn muốn xóa nhân viên "${staffToDelete.fullName}"? Hành động này không thể hoàn tác.` : ''}
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
        loading={deleteLoading}
      />

    </div>
  );
};

export default StaffPage;
