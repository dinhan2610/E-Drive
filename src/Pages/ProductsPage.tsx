import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Product, ProductFilters } from '../types/product';
import { getProductsFromApi } from '../services/vehicleApi';
import ProductCard from '../components/Products/ProductCard';
import SortBar from '../components/Products/SortBar';
import Pagination from '../components/Products/Pagination';
import EmptyState from '../components/Products/EmptyState';

import styles from '../styles/ProductsStyles/ProductsPage.module.scss';

const ProductsPage: React.FC = () => {
  console.log('🌟 ProductsPage: Component initializing');
  
  const [searchParams, setSearchParams] = useSearchParams();
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

  console.log('🚀 ProductsPage render:', { 
    isLoading, 
    productsLength: products.length, 
    totalProducts,
    currentPage,
    currentFilters 
  });

  // Update URL with new parameters
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

  // Load products when dependencies change
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      console.log('🔄 Loading products with:', { currentFilters, currentSort, currentPage, currentPageSize });
      try {
        // Convert filters to API params
        const minPrice = currentFilters.priceMin;
        const maxPrice = currentFilters.priceMax;
        const search = currentFilters.q;
        
        const response = await getProductsFromApi(
          currentPage,
          currentPageSize,
          search,
          minPrice,
          maxPrice,
          status
        );
        
        console.log('✅ Products loaded:', response);
        setProducts(response.products);
        setTotalProducts(response.total);
        setTotalPages(response.totalPages);
      } catch (error) {
        console.error('❌ Failed to load products:', error);
        setProducts([]);
        setTotalProducts(0);
        setTotalPages(0);
      } finally {
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
    // TODO: Navigate to product detail page or open modal
    console.log('View details for:', product);
  };

  const handleContactDealer = (product: Product) => {
    // TODO: Open contact form or navigate to dealer contact
    console.log('Contact dealer for:', product);
  };

  return (
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
  );
};

export default ProductsPage;