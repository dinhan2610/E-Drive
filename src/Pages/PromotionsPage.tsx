// src/Pages/PromotionsPage.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listPromotions } from '../services/promotionsApi';
import { getProfile } from '../services/profileApi';
import type { Promotion } from '../types/promotion';
import PromoTable from '../components/promotions/PromoTable';
// @ts-ignore
import PromoForm from '../components/promotions/PromoForm';
import PromoDetail from '../components/promotions/PromoDetail';
import styles from '../styles/PromotionsStyles/PromotionsPage.module.scss';

const PromotionsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [viewingPromo, setViewingPromo] = useState<Promotion | null>(null);
  const [dealerInfo, setDealerInfo] = useState<{ id: number; name?: string } | null>(null);

  // Filters from URL
  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';

  // Get dealer info from profile API
  useEffect(() => {
    const fetchDealerInfo = async () => {
      try {
        const profile = await getProfile();
        setDealerInfo({
          id: profile.dealerId,
          name: profile.agencyName || `Đại lý #${profile.dealerId}`
        });
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        // Fallback to token if profile fails
        const token = localStorage.getItem('accessToken');
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const dealerId = payload.dealerId || payload.dealer_id || 1;
            setDealerInfo({ id: dealerId, name: `Đại lý #${dealerId}` });
          } catch {
            setDealerInfo({ id: 1, name: 'Đại lý #1' });
          }
        } else {
          setDealerInfo({ id: 1, name: 'Đại lý #1' });
        }
      }
    };
    
    fetchDealerInfo();
  }, []);

  useEffect(() => {
    if (dealerInfo?.id) {
      loadPromotions();
    }
  }, [searchParams, dealerInfo?.id]);

  const loadPromotions = async () => {
    if (!dealerInfo?.id) return;
    
    setLoading(true);
    try {
      const result = await listPromotions(dealerInfo.id, {
        search,
        page,
        limit: 10
      });
      setPromotions(result.items || []);
      setTotal(result.total || 0);
    } catch (error) {
      console.error('Failed to load promotions:', error);
      setPromotions([]);
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

  const handleView = (promo: Promotion) => {
    setViewingPromo(promo);
    setShowDetail(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingPromo(null);
  };

  const handleDetailClose = () => {
    setShowDetail(false);
    setViewingPromo(null);
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
            <p>
              Quản lý chương trình khuyến mãi áp dụng tại đại lý
              {dealerInfo && (
                <span className={styles.dealerBadge}>
                  <i className="fas fa-store"></i>
                  Đại lý #{dealerInfo.id}
                  {dealerInfo.name && ` - ${dealerInfo.name}`}
                </span>
              )}
            </p>
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
          dealerId={dealerInfo?.id || 1}
          onEdit={handleEdit}
          onView={handleView}
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
      {showForm && dealerInfo && (
        <PromoForm
          promotion={editingPromo}
          dealerId={dealerInfo.id}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Detail Modal */}
      {showDetail && viewingPromo && (
        <PromoDetail
          promotion={viewingPromo}
          onClose={handleDetailClose}
        />
      )}
    </div>
  );
};

export default PromotionsPage;
