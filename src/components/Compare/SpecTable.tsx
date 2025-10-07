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
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['basic']));

  const specGroups: SpecGroup[] = [
    {
      title: 'Thông tin cơ bản',
      icon: 'fas fa-info-circle',
      specs: [
        { label: 'Tên xe', key: 'name' },
        { label: 'Hãng sản xuất', key: 'mark' },
        { label: 'Dòng xe', key: 'model' },
        { label: 'Năm sản xuất', key: 'year' },
        { label: 'Giá bán', key: 'price' },
      ]
    },
    {
      title: 'Kích thước & Cấu hình',
      icon: 'fas fa-ruler-combined',
      specs: [
        { label: 'Số cửa', key: 'doors' },
        { label: 'Hệ thống điều hòa', key: 'air' },
        { label: 'Hộp số', key: 'transmission' },
        { label: 'Loại nhiên liệu', key: 'fuel' },
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
        return new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
          minimumFractionDigits: 0,
        }).format(value);
      case 'doors':
        return `${value} cửa`;
      case 'year':
        return `${value}`;
      default:
        return String(value);
    }
  };

  return (
    <div className={styles.specTable}>
      <div className={styles.tableHeader}>
        <h2 className={styles.tableTitle}>
          <i className="fas fa-chart-bar" />
          Bảng so sánh chi tiết
        </h2>
        <p className={styles.tableSubtitle}>
          So sánh {selectedCars.length} xe đã chọn
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
                  {group.specs.map((spec, specIndex) => (
                    <div key={specIndex} className={styles.specRow}>
                      <div className={styles.specLabel}>
                        {spec.label}
                      </div>
                      {selectedCars.map((car, carIndex) => (
                        <div 
                          key={carIndex} 
                          className={`${styles.specValue} ${
                            car[spec.key] === null || car[spec.key] === undefined || car[spec.key] === '' 
                              ? styles.empty 
                              : ''
                          }`}
                        >
                          {formatValue(car[spec.key], spec.key)}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.tableFooter}>
        <div className={styles.footerNote}>
          <i className="fas fa-info-circle" />
          <span>Thông tin có thể thay đổi theo từng phiên bản xe</span>
        </div>
      </div>
    </div>
  );
};

export default SpecTable;