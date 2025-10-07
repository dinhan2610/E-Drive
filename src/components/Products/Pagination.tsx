import React from 'react';
import styles from '../../styles/ProductsStyles/Pagination.module.scss';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
  isLoading?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  page,
  pageSize,
  total,
  onChange,
  isLoading = false
}) => {
  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) {
    return null;
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page && !isLoading) {
      onChange(newPage);
    }
  };

  const handlePrevious = () => {
    handlePageChange(page - 1);
  };

  const handleNext = () => {
    handlePageChange(page + 1);
  };

  // Generate page numbers to display
  const getPageNumbers = (): (number | string)[] => {
    const delta = 2; // Number of pages to show on each side of current page
    const pages: (number | string)[] = [];
    
    // Always show first page
    pages.push(1);
    
    // Calculate range around current page
    const rangeStart = Math.max(2, page - delta);
    const rangeEnd = Math.min(totalPages - 1, page + delta);
    
    // Add ellipsis after first page if needed
    if (rangeStart > 2) {
      pages.push('...');
    }
    
    // Add pages in range
    for (let i = rangeStart; i <= rangeEnd; i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i);
      }
    }
    
    // Add ellipsis before last page if needed
    if (rangeEnd < totalPages - 1) {
      pages.push('...');
    }
    
    // Always show last page (if more than 1 page)
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav className={styles.pagination} role="navigation" aria-label="Phân trang sản phẩm">
      <button
        type="button"
        className={`${styles.pageButton} ${styles.navButton}`}
        onClick={handlePrevious}
        disabled={page <= 1 || isLoading}
        aria-label="Trang trước"
      >
        <i className={`fas fa-chevron-left ${styles.icon}`} aria-hidden="true"></i>
        Trước
      </button>

      {pageNumbers.map((pageNum, index) => (
        pageNum === '...' ? (
          <span key={`ellipsis-${index}`} className={styles.ellipsis}>
            ...
          </span>
        ) : (
          <button
            key={pageNum}
            type="button"
            className={`${styles.pageButton} ${pageNum === page ? styles.active : ''}`}
            onClick={() => handlePageChange(pageNum as number)}
            disabled={isLoading}
            aria-label={`Trang ${pageNum}`}
            aria-current={pageNum === page ? 'page' : undefined}
          >
            {pageNum}
          </button>
        )
      ))}

      <button
        type="button"
        className={`${styles.pageButton} ${styles.navButton}`}
        onClick={handleNext}
        disabled={page >= totalPages || isLoading}
        aria-label="Trang tiếp"
      >
        Tiếp
        <i className={`fas fa-chevron-right ${styles.icon}`} aria-hidden="true"></i>
      </button>
    </nav>
  );
};

export default Pagination;