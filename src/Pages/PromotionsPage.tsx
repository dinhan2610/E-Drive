// src/Pages/PromotionsPage.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [allPromotions, setAllPromotions] = useState<Promotion[]>([]); // All from API
  const [promotions, setPromotions] = useState<Promotion[]>([]); // Filtered
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [viewingPromo, setViewingPromo] = useState<Promotion | null>(null);
  const [dealerInfo, setDealerInfo] = useState<{ id: number; name?: string } | null>(null);
  
  // Search debounce state
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

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

  // Sync searchInput with URL search param
  useEffect(() => {
    setSearchInput(search);
    setSearchQuery(search);
  }, [search]);

  // Debounce search input (500ms)
  useEffect(() => {
    setSearchLoading(true);
    const timeoutId = setTimeout(() => {
      if (searchInput !== searchQuery) {
        setSearchQuery(searchInput);
        updateParams({ search: searchInput, page: '1' });
      }
      setSearchLoading(false);
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      setSearchLoading(false);
    };
  }, [searchInput]);

  // Client-side filtering based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setPromotions(allPromotions);
      setTotal(allPromotions.length);
      return;
    }

    const searchLower = searchQuery.toLowerCase().trim();
    const filtered = allPromotions.filter(promo => {
      const title = (promo.title || '').toLowerCase();
      const description = (promo.description || '').toLowerCase();
      return title.includes(searchLower) || description.includes(searchLower);
    });

    setPromotions(filtered);
    setTotal(filtered.length);
  }, [searchQuery, allPromotions]);

  useEffect(() => {
    if (dealerInfo?.id) {
      loadPromotions();
    }
  }, [searchParams, dealerInfo?.id]);

  const loadPromotions = async () => {
    if (!dealerInfo?.id) return;
    
    setLoading(true);
    try {
      // Load all promotions without search filter (backend doesn't support it)
      const result = await listPromotions(dealerInfo.id, {
        page: 1,
        limit: 1000 // Load all
      });
      setAllPromotions(result.items || []);
      
      // Filter client-side if search query exists
      if (searchQuery.trim()) {
        const searchLower = searchQuery.toLowerCase().trim();
        const filtered = (result.items || []).filter((promo: Promotion) => {
          const title = (promo.title || '').toLowerCase();
          const description = (promo.description || '').toLowerCase();
          return title.includes(searchLower) || description.includes(searchLower);
        });
        setPromotions(filtered);
        setTotal(filtered.length);
      } else {
        setPromotions(result.items || []);
        setTotal(result.total || 0);
      }
    } catch (error) {
      console.error('Failed to load promotions:', error);
      setAllPromotions([]);
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

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    updateParams({ search: '', page: '1' });
  };

  const handlePageChange = (newPage: number) => {
    updateParams({ page: newPage.toString() });
  };

  const handleCreate = () => {
    navigate('/promotions/new');
  };

  const handleEdit = (promo: Promotion) => {
    navigate(`/promotions/${promo.promoId}/edit`);
  };

  const handleView = (promo: Promotion) => {
    // Navigate to detail page instead of modal
    navigate(`/promotions/${promo.promoId}`);
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
              placeholder="Tìm kiếm theo tên, mô tả..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchLoading && (
              <div className={styles.searchLoading}>
                <i className="fas fa-spinner fa-spin"></i>
              </div>
            )}
            {searchInput && (
              <button 
                className={styles.clearBtn}
                onClick={handleClearSearch}
                title="Xóa tìm kiếm"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
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
