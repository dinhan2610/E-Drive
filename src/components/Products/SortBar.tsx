import React, { useState, useCallback } from 'react';
import { debounce } from '../../utils/productUtils';
import styles from '../../styles/ProductsStyles/SortBar.module.scss';

// Simple sort options - chỉ cơ bản
const SORT_OPTIONS = [
  { value: 'price-asc', label: 'Giá: Thấp đến cao' },
  { value: 'price-desc', label: 'Giá: Cao đến thấp' },
  { value: 'name-asc', label: 'Tên: A-Z' },
  { value: 'name-desc', label: 'Tên: Z-A' },
];

interface SortBarProps {
  sortValue: string;
  onSortChange: (sortValue: string) => void;
  pageSize: number;
  onPageSizeChange: (pageSize: number) => void;
  totalResults: number;
  currentPage: number;
  searchValue?: string;
  onSearchChange?: (searchValue: string) => void;
  isLoading?: boolean;
}

const SortBar: React.FC<SortBarProps> = ({
  sortValue,
  onSortChange,
  pageSize,
  onPageSizeChange,
  totalResults,
  currentPage,
  searchValue = '',
  onSearchChange,
  isLoading = false
}) => {
  const [localSearchValue, setLocalSearchValue] = useState(searchValue);

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((searchTerm: string) => {
      if (onSearchChange) {
        onSearchChange(searchTerm);
      }
    }, 500),
    [onSearchChange]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchValue(value);
    debouncedSearch(value);
  };

  const handleClearSearch = () => {
    setLocalSearchValue('');
    if (onSearchChange) {
      onSearchChange('');
    }
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSortChange(e.target.value);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onPageSizeChange(parseInt(e.target.value));
  };

  return (
    <div className={styles.sortBar}>
      <div className={styles.searchSection}>
       
        <div className={styles.searchContainer}>
          <div className={styles.searchInputWrapper}>
            <i className="fas fa-search" aria-hidden="true"></i>
            <input
              id="search-input"
              type="text"
              className={styles.searchInput}
              placeholder="Tìm kiếm theo tên, mô tả, thương hiệu..."
              value={localSearchValue}
              onChange={handleSearchChange}
              disabled={isLoading}
            />
            {localSearchValue && (
              <button
                type="button"
                className={styles.clearButton}
                onClick={handleClearSearch}
                aria-label="Xóa tìm kiếm"
              >
                <i className="fas fa-times" aria-hidden="true"></i>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={styles.sortSection}>
        <label htmlFor="sort-select" className={styles.sortLabel}>
          Sắp xếp:
        </label>
        <select
          id="sort-select"
          className={styles.sortSelect}
          value={sortValue}
          onChange={handleSortChange}
          disabled={isLoading}
        >
          {SORT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.resultsSection}>
       
        
        <div className={styles.pageSizeSection}>
          <label htmlFor="pagesize-select" className={styles.pageSizeLabel}>
            Hiển thị theo:
          </label>
          <select
            id="pagesize-select"
            className={styles.pageSizeSelect}
            value={pageSize}
            onChange={handlePageSizeChange}
            disabled={isLoading}
          >
            <option value={12}>12</option>
            <option value={24}>24</option>
            <option value={36}>36</option>
            <option value={48}>48</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default SortBar;