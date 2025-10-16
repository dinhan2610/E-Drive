import React, { useState, useEffect, useCallback } from 'react';
import type { Customer, CustomerFormData, CustomerStatus, ListCustomersParams } from '../types/customer';
import { CUSTOMER_STATUS_CONFIG } from '../types/customer';
import { 
  listCustomers, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer 
} from '../services/customersApi';
import CustomerTable from '../components/customers/CustomerTable';
import CustomerForm from '../components/customers/CustomerForm';
import CustomerDetail from '../components/customers/CustomerDetail';
import ConfirmDialog from '../components/customers/ConfirmDialog';
import styles from '../styles/CustomersStyles/CustomersPage.module.scss';

const CustomersPage: React.FC = () => {
  // Customer data state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CustomerStatus[]>([]);
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

  // Load customers data
  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params: ListCustomersParams = {
        q: searchQuery || undefined,
        page,
        pageSize,
        status: statusFilter.length > 0 ? statusFilter : undefined,
        sort: sortBy
      };

      const response = await listCustomers(params);
      setCustomers(response.items);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, page, pageSize, statusFilter, sortBy]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Reset page when filters change
  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
  }, [searchQuery, statusFilter, sortBy]);

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
    setFormLoading(true);
    try {
      if (editingCustomer) {
        // Update existing customer
        const payload = {
          fullName: data.fullName,
          phone: data.phoneNumber,
          email: data.email || undefined,
          status: data.status,
          interestedModel: data.interestedModel || undefined,
          notes: data.notes || undefined
        };
        if (editingCustomer.id) {
          await updateCustomer(editingCustomer.id, payload);
        }
      } else {
        // Create new customer
        const payload = {
          fullName: data.fullName,
          phone: data.phoneNumber,
          email: data.email || undefined,
          status: data.status,
          interestedModel: data.interestedModel || undefined,
          notes: data.notes || undefined
        };
        await createCustomer(payload);
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
    if (!customerToDelete) return;
    
    setDeleteLoading(true);
    try {
      if (customerToDelete.id) {
        await deleteCustomer(customerToDelete.id);
      }
      await loadCustomers();
      setIsDeleteDialogOpen(false);
      setCustomerToDelete(null);
      
      // Close detail view if the deleted customer was being viewed
      if (selectedCustomer && selectedCustomer.id === customerToDelete.id) {
        setIsDetailOpen(false);
        setSelectedCustomer(null);
      }
    } catch (error) {
      console.error('Failed to delete customer:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handler for search
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  // Handler for filters
  const handleStatusFilterChange = (statuses: CustomerStatus[]) => {
    setStatusFilter(statuses);
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
    setSearchQuery('');
    setStatusFilter([]);
    setSortBy('newest');
  };

  // Check if any filters are active
  const hasActiveFilters = searchQuery || statusFilter.length > 0;

  return (
    <div className={styles.customersPage}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>
              <i className="fas fa-users" />
              Quản lý khách hàng
            </h1>
            <div className={styles.breadcrumb}>
              <span className={styles.breadcrumbItem}>Trang chủ</span>
              <i className="fas fa-chevron-right" />
              <span className={styles.breadcrumbItem}>Khách hàng</span>
            </div>
          </div>
          
          <div className={styles.headerRight}>
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

      {/* Search and Filters */}
      <div className={styles.filtersSection}>
        <div className={styles.filtersContainer}>
          {/* Search */}
          <div className={styles.searchBox}>
            <i className="fas fa-search" />
            <input
              type="text"
              placeholder="Tìm kiếm khách hàng..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                type="button"
                className={styles.clearSearch}
                onClick={() => handleSearchChange('')}
              >
                <i className="fas fa-times" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className={styles.filters}>
            {/* Status Filter */}
            <div className={styles.statusFilterGroup}>
              <div className={styles.statusButtons}>
                <button
                  type="button"
                  className={`${styles.statusButton} ${statusFilter.length === 0 ? styles.active : ''}`}
                  onClick={() => handleStatusFilterChange([])}
                >
                  <i className="fas fa-list" />
                  Tất cả
                </button>
                {Object.entries(CUSTOMER_STATUS_CONFIG).map(([status, config]) => (
                  <button
                    key={status}
                    type="button"
                    className={`${styles.statusButton} ${statusFilter.includes(status as CustomerStatus) ? styles.active : ''}`}
                    style={{
                      '--status-color': config.color,
                      '--status-bg': config.bgColor,
                      '--status-border': config.borderColor
                    } as React.CSSProperties}
                    onClick={() => {
                      const currentStatus = status as CustomerStatus;
                      if (statusFilter.includes(currentStatus)) {
                        handleStatusFilterChange(statusFilter.filter(s => s !== currentStatus));
                      } else {
                        handleStatusFilterChange([...statusFilter, currentStatus]);
                      }
                    }}
                  >
                    <span className={styles.statusDot}></span>
                    {config.label}
                    {statusFilter.includes(status as CustomerStatus) && (
                      <i className="fas fa-check" />
                    )}
                  </button>
                ))}
              </div>
            </div>



            {/* Sort */}
            <div className={styles.filterGroup}>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as typeof sortBy)}
                className={styles.sortSelect}
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="name_asc">Tên A-Z</option>
                <option value="name_desc">Tên Z-A</option>
              </select>
            </div>

            {/* Add Customer Button */}
            <button 
              className={styles.addCustomerButton}
              onClick={handleCreateCustomer}
            >
              <i className="fas fa-plus" />
              Thêm khách hàng
              <div className={styles.btnShimmer}></div>
            </button>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                type="button"
                className={styles.clearFilters}
                onClick={handleClearFilters}
              >
                <i className="fas fa-times" />
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statsContainer}>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{total.toLocaleString()}</div>
            <div className={styles.statLabel}>Tổng khách hàng</div>
          </div>
          
          <div className={styles.statItem}>
            <div className={styles.statValue}>
              {customers.filter(c => c.status === 'POTENTIAL').length}
            </div>
            <div className={styles.statLabel}>Tiềm năng</div>
          </div>
          
          <div className={styles.statItem}>
            <div className={styles.statValue}>
              {customers.filter(c => c.status === 'TEST_DRIVE').length}
            </div>
            <div className={styles.statLabel}>Lái thử</div>
          </div>
          
          <div className={styles.statItem}>
            <div className={styles.statValue}>
              {customers.filter(c => c.status === 'NEED_CONSULTING').length}
            </div>
            <div className={styles.statLabel}>Cần tư vấn</div>
          </div>
          
          <div className={styles.statItem}>
            <div className={styles.statValue}>
              {customers.filter(c => c.status === 'PURCHASED').length}
            </div>
            <div className={styles.statLabel}>Đã mua</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableSection}>
        <CustomerTable
          customers={customers}
          loading={loading}
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
  );
};

export default CustomersPage;