import React, { useState } from 'react';
import type { CarType } from '../../constants/CarDatas';
import styles from '../../styles/CompareStyle/_compare.module.scss';

interface SpecTableProps {
  selectedCars: CarType[];
}

interface SpecGroup {
  title: string;
  icon: string;
  specs: Array<{
    label: string;
    key: keyof CarType;
  }>;
}

const SpecTable: React.FC<SpecTableProps> = ({ selectedCars }) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(['basic', 'price', 'dimension', 'performance'])
  );

  const specGroups: SpecGroup[] = [
    {
      title: 'Thông tin cơ bản',
      icon: 'fas fa-info-circle',
      specs: [
        { label: 'Tên xe', key: 'name' },
        { label: 'Hãng sản xuất', key: 'mark' },
        { label: 'Dòng xe', key: 'model' },
        { label: 'Năm sản xuất', key: 'year' },
        { label: 'Loại nhiên liệu', key: 'fuel' },
      ]
    },
    {
      title: 'Giá bán & Chi phí',
      icon: 'fas fa-tag',
      specs: [
        { label: 'Giá niêm yết', key: 'price' },
      ]
    },
    {
      title: 'Kích thước & Trọng lượng',
      icon: 'fas fa-ruler-combined',
      specs: [
        { label: 'Số cửa', key: 'doors' },
        { label: 'Số chỗ ngồi', key: 'doors' },
      ]
    },
    {
      title: 'Động cơ & Hiệu suất',
      icon: 'fas fa-tachometer-alt',
      specs: [
        { label: 'Loại động cơ', key: 'fuel' },
        { label: 'Hộp số', key: 'transmission' },
      ]
    },
    {
      title: 'Tiện nghi & Công nghệ',
      icon: 'fas fa-cog',
      specs: [
        { label: 'Hệ thống điều hòa', key: 'air' },
      ]
    },
    {
      title: 'An toàn & Bảo hành',
      icon: 'fas fa-shield-alt',
      specs: [
        { label: 'Chất lượng sản xuất', key: 'mark' },
      ]
    }
  ];

  const toggleGroup = (groupTitle: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupTitle)) {
      newExpanded.delete(groupTitle);
    } else {
      newExpanded.add(groupTitle);
    }
    setExpandedGroups(newExpanded);
  };

  const formatValue = (value: any, key: keyof CarType): string => {
    if (value === null || value === undefined || value === '') {
      return '—';
    }

    switch (key) {
      case 'price':
        // Format price in millions with proper VND currency
        const priceInMillions = typeof value === 'number' ? value : parseFloat(value);
        return new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(priceInMillions * 1000000);
      case 'doors':
        return `${value} cửa`;
      case 'year':
        return `${value}`;
      case 'air':
        return value === 'Yes' || value === 'yes' ? 'Có' : value === 'No' || value === 'no' ? 'Không' : String(value);
      case 'transmission':
        return String(value);
      case 'fuel':
        return String(value);
      case 'mark':
      case 'model':
      case 'name':
        return String(value);
      default:
        return String(value);
    }
  };

  // Helper function to determine if values are different (for highlighting)
  const hasVariance = (key: keyof CarType): boolean => {
    if (selectedCars.length < 2) return false;
    const firstValue = selectedCars[0][key];
    return selectedCars.some(car => car[key] !== firstValue);
  };

  return (
    <div className={styles.specTable}>
      <div className={styles.tableHeader}>
        <h2 className={styles.tableTitle}>
          <i className="fas fa-chart-bar" />
          Bảng so sánh chi tiết
        </h2>
        <p className={styles.tableSubtitle}>
          So sánh {selectedCars.length} xe đã chọn - Xem tất cả thông số kỹ thuật và tính năng
        </p>
      </div>

     

      <div className={styles.tableContent}>
        {specGroups.map((group, groupIndex) => {
          const isExpanded = expandedGroups.has(group.title);
          
          return (
            <div key={groupIndex} className={styles.specGroup}>
              <button
                className={styles.groupHeader}
                onClick={() => toggleGroup(group.title)}
                aria-expanded={isExpanded}
                aria-controls={`group-${groupIndex}`}
              >
                <div className={styles.groupTitle}>
                  <i className={group.icon} />
                  <span>{group.title}</span>
                </div>
                <i className={`fas fa-chevron-down ${isExpanded ? styles.expanded : ''}`} />
              </button>

              {isExpanded && (
                <div 
                  id={`group-${groupIndex}`}
                  className={styles.groupContent}
                >
                  {group.specs.map((spec, specIndex) => {
                    const hasDifference = hasVariance(spec.key);
                    
                    return (
                      <div 
                        key={specIndex} 
                        className={`${styles.specRow} ${hasDifference ? styles.specRowVariant : ''}`}
                      >
                        <div className={styles.specLabel}>
                          {spec.label}
                          {hasDifference && (
                            <span className={styles.varianceIndicator} title="Giá trị khác nhau">
                              <i className="fas fa-exclamation-circle" />
                            </span>
                          )}
                        </div>
                        {selectedCars.map((car, carIndex) => {
                          const value = car[spec.key];
                          const isEmpty = value === null || value === undefined || value === '';
                          const formattedValue = formatValue(value, spec.key);
                          
                          // Highlight best value for price (lowest)
                          let isBest = false;
                          if (spec.key === 'price' && !isEmpty && selectedCars.length > 1) {
                            const prices = selectedCars.map(c => c.price).filter(p => p != null);
                            const minPrice = Math.min(...prices);
                            isBest = car.price === minPrice;
                          }
                          
                          return (
                            <div 
                              key={carIndex} 
                              className={`${styles.specValue} ${
                                isEmpty ? styles.empty : ''
                              } ${isBest ? styles.bestValue : ''}`}
                            >
                              {formattedValue}
                              {isBest && spec.key === 'price' && (
                                <span className={styles.bestBadge}>
                                  <i className="fas fa-star" /> Tốt nhất
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.tableFooter}>
        <div className={styles.footerNote}>
          <i className="fas fa-info-circle" />
          <span>Thông tin có thể thay đổi theo từng phiên bản xe. Giá chưa bao gồm thuế, phí đăng ký.</span>
        </div>
        <div className={styles.footerActions}>
          <button className={styles.printButton} onClick={() => window.print()}>
            <i className="fas fa-print" />
            In bảng so sánh
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpecTable;