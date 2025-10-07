import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Product, ProductFilters } from '../types/product';
import { CAR_DATA, type CarType } from '../constants/CarDatas';
import ProductCard from '../components/Products/ProductCard';
import SortBar from '../components/Products/SortBar';
import Pagination from '../components/Products/Pagination';
import EmptyState from '../components/Products/EmptyState';
import Footer from '../components/Footer';

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

  // Convert CarData to Product format
  const convertCarToProduct = (car: CarType, index: number): Product => ({
    id: `car-${index}`,
    name: car.name,
    variant: `${car.model} ${car.year}`,
    slug: car.name.toLowerCase().replace(/\s+/g, '-'),
    price: car.price * 1000000, // Convert to VND (assuming price is in million)
    image: car.img,
    images: [car.img],
    rangeKm: car.fuel === 'Hybrid' ? 800 : car.fuel === 'Gasoline' ? 600 : 700,
    battery: car.fuel === 'Hybrid' ? '2.0L + Electric' : car.fuel === 'Diesel' ? 'Diesel Engine' : 'Gasoline Engine',
    motor: `${car.transmission} - ${car.fuel}`,
    fastCharge: car.fuel === 'Hybrid' ? '30 minutes' : 'N/A',
    warranty: '3 years / 100,000 km',
    driveType: 'FWD' as const,
    inStock: true,
    isPopular: index < 2,
    hasDiscount: car.price < 35,
    tags: [car.mark, car.fuel, car.transmission],
    description: `${car.mark} ${car.model} ${car.year} - ${car.transmission} transmission with ${car.fuel} engine. Features ${car.doors} doors and ${car.air === 'Yes' ? 'air conditioning' : 'no air conditioning'}.`,
    features: [
      `${car.doors} doors`,
      car.air === 'Yes' ? 'Air Conditioning' : 'No AC',
      `${car.transmission} transmission`,
      `${car.fuel} engine`,
      'Safety features',
      'Modern interior'
    ],
    createdAt: new Date().toISOString()
  });

  // Get all cars from CAR_DATA (flatten the nested arrays)
  const allCars: CarType[] = CAR_DATA.flat();
  const allProducts: Product[] = allCars.map(convertCarToProduct);

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
    const loadProducts = () => {
      setIsLoading(true);
      console.log('🔄 Loading products with:', { currentFilters, currentSort, currentPage, currentPageSize });
      
      // Start with all products
      let filteredProducts = [...allProducts];
      
      // Apply search filter
      if (currentFilters.q) {
        const searchTerm = currentFilters.q.toLowerCase();
        filteredProducts = filteredProducts.filter(product =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.description.toLowerCase().includes(searchTerm) ||
          product.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }
      
      // Apply price filters
      if (currentFilters.priceMin) {
        filteredProducts = filteredProducts.filter(product => product.price >= currentFilters.priceMin!);
      }
      if (currentFilters.priceMax) {
        filteredProducts = filteredProducts.filter(product => product.price <= currentFilters.priceMax!);
      }
      
      // Apply sorting
      const [sortField, sortOrder] = currentSort.split('-');
      filteredProducts.sort((a, b) => {
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
          default:
            aValue = a.createdAt;
            bValue = b.createdAt;
        }
        
        if (sortOrder === 'desc') {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        } else {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        }
      });
      
      // Calculate pagination
      const total = filteredProducts.length;
      const calculatedTotalPages = Math.ceil(total / currentPageSize);
      const startIndex = (currentPage - 1) * currentPageSize;
      const endIndex = startIndex + currentPageSize;
      const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
      
      console.log('✅ Products loaded:', { total, paginatedProducts: paginatedProducts.length });
      setProducts(paginatedProducts);
      setTotalProducts(total);
      setTotalPages(calculatedTotalPages);
      setIsLoading(false);
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
    <Footer />
    </>
  );
};

export default ProductsPage;