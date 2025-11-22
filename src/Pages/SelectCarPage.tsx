import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import type { Product, ProductFilters } from '../types/product';
import { fetchVehiclesFromApi, groupVehiclesByModel } from '../services/vehicleApi';
import ProductCard from '../components/Products/ProductCard';
import SortBar from '../components/Products/SortBar';
import Pagination from '../components/Products/Pagination';
import EmptyState from '../components/Products/EmptyState';

import styles from '../styles/ProductsStyles/ProductsPage.module.scss';

const SelectCarPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // URL controlled state
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

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        const { vehicles, total } = await fetchVehiclesFromApi({
          page: currentPage - 1,
          size: currentPageSize,
          search: currentFilters.q,
          minPrice: currentFilters.priceMin,
          maxPrice: currentFilters.priceMax,
        });

        let productList = groupVehiclesByModel(vehicles);

        const [sortField, sortOrder] = currentSort.split('-');
        productList.sort((a, b) => {
          let aValue: any, bValue: any;
          switch (sortField) {
            case 'price':
              aValue = a.price; bValue = b.price; break;
            case 'name':
              aValue = a.name; bValue = b.name; break;
            default:
              aValue = a.createdAt; bValue = b.createdAt;
          }
          if (sortOrder === 'desc') return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        });

        const calculatedTotalPages = Math.ceil(total / currentPageSize);
        setProducts(productList);
        setTotalProducts(total);
        setTotalPages(calculatedTotalPages);
      } catch (error) {
        console.error('Error loading vehicles for select page', error);
        setProducts([]);
        setTotalProducts(0);
        setTotalPages(0);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [currentFilters.q, currentFilters.priceMin, currentFilters.priceMax, currentSort, currentPage, currentPageSize]);

  // Handlers
  const handleSearchChange = (searchValue: string) => updateURL({ q: searchValue || undefined, page: '1' });
  const handleSortChange = (sortValue: string) => updateURL({ sort: sortValue, page: '1' });
  const handlePageSizeChange = (pageSize: number) => updateURL({ pageSize: pageSize.toString(), page: '1' });
  const handlePageChange = (page: number) => { updateURL({ page: page.toString() }); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const handleViewDetails = (product: Product) => {
    navigate(`/products/${product.id}`);
  };

  // When user clicks "Đặt hàng" / "Báo giá" in this page, we want to ADD TO ORDER instead of ordering.
  const handleAddToOrder = (product: Product) => {
    // product already contains selectedColor and proper id from ProductCard
    navigate('/dealer-order', { state: { selectedVehicle: product } });
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
            <div className={styles.loading}><div className={styles.spinner}></div><p>Đang tải sản phẩm...</p></div>
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
                    onContactDealer={handleAddToOrder}
                    primaryActionLabel="Thêm"
                    primaryActionIcon="fas fa-plus"
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className={styles.paginationContainer}>
                  <Pagination page={currentPage} pageSize={currentPageSize} total={totalProducts} onChange={handlePageChange} isLoading={isLoading} />
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default SelectCarPage;
