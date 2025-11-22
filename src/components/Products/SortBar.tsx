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
       
        
        
      </div>
    </div>
  );
};

export default SortBar;