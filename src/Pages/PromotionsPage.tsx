// src/Pages/PromotionsPage.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listPromotions } from '../services/promotionsApi';
import type { Promotion } from '../types/promotion';
import PromoTable from '../components/promotions/PromoTable';
// @ts-ignore
import PromoForm from '../components/promotions/PromoForm';
import styles from '../styles/PromotionsStyles/PromotionsPage.module.scss';

const PromotionsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);

  // Filters from URL
  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';

  useEffect(() => {
    loadPromotions();
  }, [searchParams]);

  const loadPromotions = async () => {
    setLoading(true);
    try {
      const result = await listPromotions({
        search,
        page,
        limit: 10
      });
      console.log('API result:', result); // Debug log
      setPromotions(result.items || []);
      setTotal(result.total || 0);
    } catch (error) {
      console.error('Failed to load promotions:', error);
      setPromotions([]); // Reset to empty array on error
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const updateParams = (updates: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) newParams.set(key, value);
      else newParams.delete(key);
    });
    setSearchParams(newParams);
  };

  const handleSearch = (value: string) => {
    updateParams({ search: value, page: '1' });
  };

  const handlePageChange = (newPage: number) => {
    updateParams({ page: newPage.toString() });
  };

  const handleCreate = () => {
    setEditingPromo(null);
    setShowForm(true);
  };

  const handleEdit = (promo: Promotion) => {
    setEditingPromo(promo);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingPromo(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingPromo(null);
    loadPromotions();
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1>
              <i className="fas fa-tags"></i>
              Quản lý khuyến mãi
            </h1>
            <p>Quản lý chương trình khuyến mãi áp dụng tại đại lý</p>
          </div>
          <button className={styles.createBtn} onClick={handleCreate}>
            <i className="fas fa-plus"></i>
            Tạo khuyến mãi
          </button>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <PromoTable
          promotions={promotions}
          loading={loading}
          onEdit={handleEdit}
          onRefresh={loadPromotions}
        />

        {/* Pagination */}
        {total > 10 && (
          <div className={styles.pagination}>
            <button
              disabled={page === 1}
              onClick={() => handlePageChange(page - 1)}
            >
              <i className="fas fa-chevron-left"></i>
              Trước
            </button>
            <span>Trang {page} / {Math.ceil(total / 10)}</span>
            <button
              disabled={page >= Math.ceil(total / 10)}
              onClick={() => handlePageChange(page + 1)}
            >
              Sau
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <PromoForm
          promotion={editingPromo}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
};

export default PromotionsPage;
