import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/authUtils';
import type { Product, ProductFilters } from '../types/product';
import { fetchVehiclesFromApi, groupVehiclesByModel } from '../services/vehicleApi';
import ProductCard from '../components/Products/ProductCard';
import SortBar from '../components/Products/SortBar';
import Pagination from '../components/Products/Pagination';
import EmptyState from '../components/Products/EmptyState';

import styles from '../styles/ProductsStyles/ProductsPage.module.scss';

const ProductsPage: React.FC = () => {
  
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get current state from URL
  const currentPage = parseInt(searchParams.get('page') || '1');
  const currentPageSize = parseInt(searchParams.get('pageSize') || '12');
  const currentSort = searchParams.get('sort') || 'createdAt-desc';
  const currentSearchValue = searchParams.get('q') || '';
  
  const currentFilters: ProductFilters = {
    q: searchParams.get('q') || undefined,
    priceMin: searchParams.get('priceMin') ? parseInt(searchParams.get('priceMin')!) : undefined,
    priceMax: searchParams.get('priceMax') ? parseInt(searchParams.get('priceMax')!) : undefined,
  };

  const updateURL = useCallback((updates: Record<string, string | number | undefined>) => {
    const newParams = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        newParams.set(key, value.toString());
      } else {
        newParams.delete(key);
      }
    });
    
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  // Load products from API when dependencies change
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      
      try {
        // Fetch from API với pagination
        const { vehicles, total } = await fetchVehiclesFromApi({
          page: currentPage - 1, // API uses 0-based index
          size: currentPageSize,
          search: currentFilters.q,
          minPrice: currentFilters.priceMin,
          maxPrice: currentFilters.priceMax,
        });
        
        // Group vehicles theo model+version với color variants
        let productList = groupVehiclesByModel(vehicles);
        
        // Client-side sorting (vì API chưa hỗ trợ sort params)
        const [sortField, sortOrder] = currentSort.split('-');
        productList.sort((a, b) => {
          let aValue: any, bValue: any;
          
          switch (sortField) {
            case 'price':
              aValue = a.price;
              bValue = b.price;
              break;
            case 'name':
              aValue = a.name;
              bValue = b.name;
              break;
            default: // createdAt
              aValue = a.createdAt;
              bValue = b.createdAt;
          }
          
          if (sortOrder === 'desc') {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
          } else {
            return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
          }
        });
        
        const calculatedTotalPages = Math.ceil(total / currentPageSize);
        
        setProducts(productList);
        setTotalProducts(total);
        setTotalPages(calculatedTotalPages);
        setIsLoading(false);
        
      } catch (error) {
        console.error('❌ Error loading products:', error);
        setProducts([]);
        setTotalProducts(0);
        setTotalPages(0);
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [
    currentFilters.q,
    currentFilters.priceMin,
    currentFilters.priceMax,
    currentSort,
    currentPage,
    currentPageSize
  ]);

  // Handlers
  const handleSearchChange = (searchValue: string) => {
    updateURL({ q: searchValue || undefined, page: '1' });
  };

  const handleSortChange = (sortValue: string) => {
    updateURL({ sort: sortValue, page: '1' });
  };

  const handlePageSizeChange = (pageSize: number) => {
    updateURL({ pageSize: pageSize.toString(), page: '1' });
  };

  const handlePageChange = (page: number) => {
    updateURL({ page: page.toString() });
    
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewDetails = (product: Product) => {
    // Navigate to product detail page
    navigate(`/products/${product.id}`);
  };

  const handleContactDealer = (product: Product) => {
    // Check user role to determine navigation
    const user = getCurrentUser();
    let userRole = 'dealer'; // Default
    
    if (user) {
      userRole = user.role ? user.role.toLowerCase().replace('role_', '') : 'dealer';
    }
    
    // Staff → Navigate to quote creation (Báo giá)
    // Dealer → Navigate to dealer order (Đặt hàng)
    // Admin → Should not reach here (has separate interface at /admin)
    if (userRole === 'staff') {
      navigate('/quotes/create', { state: { product } });
    } else if (userRole === 'dealer') {
      navigate('/dealer-order', { state: { product } });
    } else {
      // Admin fallback (shouldn't happen normally)
      console.warn('Admin should use /admin interface');
      navigate('/dealer-order', { state: { product } });
    }
  };

  return (
    <>
      <div className={styles.wrap}>
        <div className={styles.layout}>
          <main className={styles.content}>
          <div className={styles.sortBarContainer}>
            <SortBar
              searchValue={currentSearchValue}
              onSearchChange={handleSearchChange}
              sortValue={currentSort}
              onSortChange={handleSortChange}
              pageSize={currentPageSize}
              onPageSizeChange={handlePageSizeChange}
              totalResults={totalProducts}
              currentPage={currentPage}
              isLoading={isLoading}
            />
          </div>

          {isLoading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Đang tải sản phẩm...</p>
            </div>
          ) : products.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className={styles.grid} role="list">
                {products.map(product => (
                  <ProductCard
                    key={product.id}
                    item={product}
                    onViewDetails={handleViewDetails}
                    onContactDealer={handleContactDealer}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className={styles.paginationContainer}>
                  <Pagination
                    page={currentPage}
                    pageSize={currentPageSize}
                    total={totalProducts}
                    onChange={handlePageChange}
                    isLoading={isLoading}
                  />
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
    </>
  );
};

export default ProductsPage;