import React, { useState, useEffect, useCallback } from 'react';
import type { Customer, CustomerFormData, ListCustomersParams } from '../types/customer';
import { 
  listCustomers, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer 
} from '../services/customersApi';
import { getProfile } from '../services/profileApi';
import CustomerTable from '../components/customers/CustomerTable';
import CustomerForm from '../components/customers/CustomerForm';
import CustomerDetail from '../components/customers/CustomerDetail';
import ConfirmDialog from '../components/customers/ConfirmDialog';
import styles from '../styles/CustomersStyles/CustomersPage.module.scss';

// Helper function để remove dấu tiếng Việt cho tìm kiếm
const removeVietnameseTones = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
};

const CustomersPage: React.FC = () => {
  // Dealer info state
  const [dealerInfo, setDealerInfo] = useState<{ id: number; name?: string } | null>(null);
  
  // Customer data state
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]); // Tất cả customers từ API
  const [customers, setCustomers] = useState<Customer[]>([]); // Customers sau khi filter
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState(''); // Separate state for input value
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name_asc' | 'name_desc'>('newest');
  
  // Modal and UI state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch dealer info from Profile API on mount
  useEffect(() => {
    const fetchDealerInfo = async () => {
      try {
        console.log('🔍 Fetching dealer info from /api/profile/me...');
        const profile = await getProfile();
        console.log('✅ Profile data:', profile);
        console.log('🏢 Dealer ID from profile:', profile.dealerId);
        
        setDealerInfo({
          id: profile.dealerId,
          name: profile.agencyName
        });
      } catch (error) {
        console.error('❌ Failed to fetch dealer info:', error);
        // Fallback to default dealer ID
        setDealerInfo({ id: 1 });
      }
    };

    fetchDealerInfo();
  }, []);

  // Load customers data
  const loadCustomers = useCallback(async () => {
    if (!dealerInfo) {
      console.log('⏳ Waiting for dealer info...');
      return;
    }

    setLoading(true);
    try {
      console.log('📋 Loading customers for dealer:', dealerInfo.id);
      
      // Load tất cả customers không filter backend (vì backend search không chính xác)
      const params: ListCustomersParams = {
        page,
        pageSize: 1000, // Load nhiều để filter client-side
        sort: sortBy
      };

      const response = await listCustomers(dealerInfo.id, params);
      
      console.log(`✅ Loaded ${response.data?.length || 0} customers for dealer ${dealerInfo.id}`);
      
      setAllCustomers(response.data || []);
    } catch (error) {
      console.error('Failed to load customers:', error);
      console.error('Error details:', error);
    } finally {
      setLoading(false);
    }
  }, [dealerInfo, page, sortBy]);

  // Debounce search input - chỉ search sau 500ms user ngừng gõ
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchInput !== searchQuery) {
        setSearchQuery(searchInput);
        setPage(1); // Reset về trang 1 khi search
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchInput, searchQuery]);

  // Filter customers client-side khi searchQuery thay đổi
  useEffect(() => {
    if (!searchQuery.trim()) {
      setCustomers(allCustomers);
      setTotal(allCustomers.length);
      return;
    }

    const searchLower = removeVietnameseTones(searchQuery.trim());
    
    const filtered = allCustomers.filter(customer => {
      const fullName = removeVietnameseTones(customer.fullName || '');
      const email = removeVietnameseTones(customer.email || '');
      const phone = removeVietnameseTones(customer.phone || '');
      const address = removeVietnameseTones(customer.address || '');
      
      return fullName.includes(searchLower) ||
             email.includes(searchLower) ||
             phone.includes(searchLower) ||
             address.includes(searchLower);
    });

    console.log(`🔍 Filtered ${filtered.length}/${allCustomers.length} customers for query: "${searchQuery}"`);
    
    setCustomers(filtered);
    setTotal(filtered.length);
  }, [searchQuery, allCustomers]);

  // Load data when dealer info is ready and when dependencies change
  useEffect(() => {
    if (dealerInfo) {
      loadCustomers();
    }
  }, [dealerInfo, loadCustomers]);

  // Reset page when sort changes
  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  // Handlers for CRUD operations
  const handleCreateCustomer = () => {
    setEditingCustomer(null);
    setIsFormOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailOpen(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (data: CustomerFormData) => {
    if (!dealerInfo) {
      console.error('❌ No dealer info available');
      return;
    }

    setFormLoading(true);
    try {
      if (editingCustomer) {
        // Update existing customer
        console.log(`📝 Updating customer ${editingCustomer.customerId} for dealer ${dealerInfo.id}`);
        await updateCustomer(dealerInfo.id, editingCustomer.customerId, data);
      } else {
        // Create new customer
        console.log(`➕ Creating new customer for dealer ${dealerInfo.id}`);
        await createCustomer(dealerInfo.id, data);
      }
      await loadCustomers();
      setIsFormOpen(false);
      setEditingCustomer(null);
    } catch (error) {
      console.error('Failed to save customer:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!customerToDelete || !dealerInfo) return;
    
    setDeleteLoading(true);
    try {
      console.log(`🗑️ Deleting customer ${customerToDelete.customerId} from dealer ${dealerInfo.id}`);
      await deleteCustomer(dealerInfo.id, customerToDelete.customerId);
      await loadCustomers();
      setIsDeleteDialogOpen(false);
      setCustomerToDelete(null);
      
      // Close detail view if the deleted customer was being viewed
      if (selectedCustomer && selectedCustomer.customerId === customerToDelete.customerId) {
        setIsDetailOpen(false);
        setSelectedCustomer(null);
      }
      
      // Show success message
      alert(`✅ Đã xóa khách hàng ID ${customerToDelete.customerId} thành công!`);
    } catch (error: any) {
      console.error('Failed to delete customer:', error);
      
      // Show error message to user
      const errorMessage = error.message || 'Không thể xóa khách hàng. Vui lòng thử lại.';
      alert(`❌ Lỗi: ${errorMessage}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handler for search input (with debounce)
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
  };

  // Handler for sorting
  const handleSortChange = (sort: typeof sortBy) => {
    setSortBy(sort);
  };

  // Handler for pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchInput('');
    setSearchQuery('');
    setSortBy('newest');
  };

  // Check if any filters are active
  const hasActiveFilters = searchInput !== '' || searchQuery !== '';

  return (
    <div className={styles.customersPage}>
      {/* Hero Header */}
      <div className={styles.heroHeader}>
        <div className={styles.heroContent}>
          <div className={styles.heroTop}>
            <div className={styles.heroLeft}>
              {/* Dealer Badge */}
              {dealerInfo && (
                <div className={styles.dealerBadge}>
                  <i className="fas fa-store" style={{ marginRight: '8px' }} />
                  <span>Đại lý #{dealerInfo.id}</span>
                  {dealerInfo.name && <span> - {dealerInfo.name}</span>}
                </div>
              )}
             
              <div className={styles.statsDisplay}>
                <div className={styles.statItem}>
                  <i className="fas fa-database" />
                  <div className={styles.statContent}>
                    <span className={styles.statNumber}>{(total || 0).toLocaleString()}</span>
                    <span className={styles.statLabel}>Khách hàng</span>
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
              placeholder="Tìm kiếm khách hàng (tên, email, số điện thoại)..."
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
           
          {/* Add Customer Button */}
            <button 
              className={styles.createButton}
              onClick={handleCreateCustomer}
            >
              <i className="fas fa-plus" />
              Thêm khách hàng
            </button>
          </div>
        </div>
        </div>

        {/* Table */}
        <div className={styles.tableSection}>
        <CustomerTable
          customers={customers}
          loading={loading}
          onView={handleViewCustomer}
          onRowClick={handleViewCustomer}
          onEdit={handleEditCustomer}
          onDelete={handleDeleteCustomer}
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.paginationSection}>
          <div className={styles.paginationInfo}>
            Hiển thị {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, total)} 
            trong tổng số {total} khách hàng
          </div>
          
          <div className={styles.pagination}>
            <button
              className={styles.paginationButton}
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
            >
              <i className="fas fa-chevron-left" />
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
              if (pageNum > totalPages) return null;
              
              return (
                <button
                  key={pageNum}
                  className={`${styles.paginationButton} ${page === pageNum ? styles.active : ''}`}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              className={styles.paginationButton}
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
            >
              <i className="fas fa-chevron-right" />
            </button>
          </div>
          
          <div className={styles.pageSize}>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className={styles.pageSizeSelect}
            >
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
            </select>
          </div>
        </div>
      )}

      {/* Customer Form Modal */}
      <CustomerForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCustomer(null);
        }}
        onSubmit={handleFormSubmit}
        customer={editingCustomer}
        isLoading={formLoading}
      />

      {/* Customer Detail Drawer */}
      <CustomerDetail
        customer={selectedCustomer}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedCustomer(null);
        }}
        onEdit={(customer) => {
          setIsDetailOpen(false);
          handleEditCustomer(customer);
        }}
        onDelete={(customer) => {
          setIsDetailOpen(false);
          handleDeleteCustomer(customer);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onCancel={() => {
          setIsDeleteDialogOpen(false);
          setCustomerToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Xóa khách hàng"
        message={customerToDelete ? `Bạn có chắc chắn muốn xóa khách hàng "${customerToDelete.fullName}"? Hành động này không thể hoàn tác.` : ''}
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
        loading={deleteLoading}
      />
      </div>
    </div>
  );
};

export default CustomersPage;