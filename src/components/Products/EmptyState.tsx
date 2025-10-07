import React from 'react';
import styles from '../../styles/ProductsStyles/EmptyState.module.scss';

interface EmptyStateProps {
  title?: string;
  message?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Không tìm thấy sản phẩm',
  message = 'Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm để xem thêm kết quả.'
}) => {
  return (
    <div className={styles.emptyState}>
      <div className={styles.icon}>
        <i className="fas fa-search" aria-hidden="true"></i>
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.message}>{message}</p>
    </div>
  );
};

export default EmptyState;