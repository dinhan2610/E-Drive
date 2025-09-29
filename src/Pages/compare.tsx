import React, { useState, useEffect } from 'react';
import { CAR_DATA } from '../constants/CarDatas';
import type { CarType } from '../constants/CarDatas';
import HeroPages from '../components/HeroPages';
import Footer from '../components/Footer';
import '../styles/CompareStyles/compare.scss';

interface CompareState {
  selectedCars: CarType[];
  showComparison: boolean;
  filterBrand: string;
  sortBy: 'name' | 'price' | 'year';
}

const Compare: React.FC = () => {
  const allCars = CAR_DATA.flat();
  
  const [state, setState] = useState<CompareState>({
    selectedCars: [],
    showComparison: false,
    filterBrand: 'all',
    sortBy: 'name'
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 800);
  }, []);

  // Get unique brands
  const brands = Array.from(new Set(allCars.map(car => car.mark)));

  // Filter and sort cars
  const filteredCars = allCars.filter(car => {
    const matchesSearch = car.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         car.mark.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = state.filterBrand === 'all' || car.mark === state.filterBrand;
    return matchesSearch && matchesBrand;
  }).sort((a, b) => {
    switch (state.sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'price':
        return parseFloat(String(a.price).replace(/[^\d]/g, '')) - parseFloat(String(b.price).replace(/[^\d]/g, ''));
      case 'year':
        return Number(b.year) - Number(a.year);
      default:
        return 0;
    }
  });

  const handleSelectCar = (car: CarType) => {
    setState(prev => {
      const isSelected = prev.selectedCars.find(c => c.name === car.name);
      if (isSelected) {
        return {
          ...prev,
          selectedCars: prev.selectedCars.filter(c => c.name !== car.name)
        };
      } else if (prev.selectedCars.length < 4) {
        return {
          ...prev,
          selectedCars: [...prev.selectedCars, car]
        };
      }
      return prev;
    });
  };

  const toggleComparison = () => {
    setState(prev => ({ ...prev, showComparison: !prev.showComparison }));
  };

  const clearSelection = () => {
    setState(prev => ({ ...prev, selectedCars: [], showComparison: false }));
  };

  if (isLoading) {
    return (
      <div className="compare-loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h3>Đang tải dữ liệu xe điện...</h3>
          <p>Vui lòng đợi trong giây lát</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="compare-section">
        <HeroPages name="So Sánh Xe Điện" />
        
        <div className="container">
          <div className="compare-stats">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fas fa-car-alt"></i>
                </div>
                <div className="stat-content">
                  <h3>{allCars.length}</h3>
                  <p>Mẫu xe có sẵn</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fas fa-check-circle"></i>
                </div>
                <div className="stat-content">
                  <h3>{state.selectedCars.length}/4</h3>
                  <p>Xe đã chọn</p>
                </div>
              </div>
            </div>
          </div>

          <div className="compare-controls">
            <div className="controls-left">
              <div className="search-container">
                <div className="search-box">
                  <i className="fas fa-search"></i>
                  <input
                    type="text"
                    placeholder="Tìm kiếm xe theo tên, hãng..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="filter-container">
                <select 
                  value={state.filterBrand} 
                  onChange={(e) => setState(prev => ({ ...prev, filterBrand: e.target.value }))}
                  className="brand-filter"
                >
                  <option value="all">Tất cả hãng xe</option>
                  {brands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>

                <select 
                  value={state.sortBy} 
                  onChange={(e) => setState(prev => ({ ...prev, sortBy: e.target.value as 'name' | 'price' | 'year' }))}
                  className="sort-select"
                >
                  <option value="name">Sắp xếp: Tên A-Z</option>
                  <option value="price">Sắp xếp: Giá thấp đến cao</option>
                  <option value="year">Sắp xếp: Năm mới nhất</option>
                </select>
              </div>
            </div>

            <div className="controls-right">
              {state.selectedCars.length > 0 && (
                <div className="selected-actions">
                  <button 
                    className="btn-compare-toggle"
                    onClick={toggleComparison}
                  >
                    <i className="fas fa-balance-scale"></i>
                    {state.showComparison ? 'Ẩn so sánh' : `So sánh (${state.selectedCars.length})`}
                  </button>
                  <button 
                    className="btn-clear-all"
                    onClick={clearSelection}
                  >
                    <i className="fas fa-trash"></i>
                    Xóa tất cả
                  </button>
                </div>
              )}
            </div>
          </div>

          {state.showComparison && state.selectedCars.length > 0 && (
            <div className="comparison-panel">
              <div className="comparison-header">
                <h3>
                  <i className="fas fa-balance-scale"></i>
                  So sánh chi tiết ({state.selectedCars.length} xe)
                </h3>
                <button 
                  className="close-comparison"
                  onClick={toggleComparison}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="comparison-table-wrapper">
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th className="spec-header">Thông số</th>
                      {state.selectedCars.map((car: CarType) => (
                        <th key={car.name} className="car-header">
                          <div className="car-header-content">
                            <img src={car.img} alt={car.name} />
                            <div className="car-header-info">
                              <h4>{car.name}</h4>
                              <span className="car-brand">{car.mark}</span>
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="spec-label">
                        <i className="fas fa-tag"></i>
                        Giá bán
                      </td>
                      {state.selectedCars.map((car: CarType) => (
                        <td key={`${car.name}-price`} className="spec-value price">
                          {car.price}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="spec-label">
                        <i className="fas fa-calendar"></i>
                        Năm sản xuất
                      </td>
                      {state.selectedCars.map((car: CarType) => (
                        <td key={`${car.name}-year`} className="spec-value">
                          {car.year}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="spec-label">
                        <i className="fas fa-industry"></i>
                        Hãng xe
                      </td>
                      {state.selectedCars.map((car: CarType) => (
                        <td key={`${car.name}-mark`} className="spec-value">
                          {car.mark}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="spec-label">
                        <i className="fas fa-car"></i>
                        Model
                      </td>
                      {state.selectedCars.map((car: CarType) => (
                        <td key={`${car.name}-model`} className="spec-value">
                          {car.model}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="results-info">
            <p>
              Hiển thị <strong>{filteredCars.length}</strong> trong số <strong>{allCars.length}</strong> xe điện
            </p>
          </div>

          <div className="compare-grid">
            {filteredCars.map((car: CarType) => {
              const isSelected = state.selectedCars.find(c => c.name === car.name);
              const canSelect = !isSelected && state.selectedCars.length < 4;
              
              return (
                <div 
                  key={car.name} 
                  className={`car-card ${isSelected ? 'selected' : ''} ${!canSelect && !isSelected ? 'disabled' : ''}`}
                >
                  <div className="car-image-container">
                    <img 
                      src={car.img} 
                      alt={car.name}
                      className="car-image"
                    />
                    
                    <div className="car-overlay">
                      <button 
                        className={`select-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelectCar(car)}
                        disabled={!canSelect && !isSelected}
                      >
                        <i className={`fas ${isSelected ? 'fa-check' : 'fa-plus'}`}></i>
                      </button>
                    </div>
                  </div>

                  <div className="car-content">
                    <div className="car-header-info">
                      <h3 className="car-title">{car.name}</h3>
                      <div className="car-meta">
                        <span className="car-brand">{car.mark}</span>
                        <span className="car-year">{car.year}</span>
                      </div>
                    </div>

                    <div className="car-price-section">
                      <div className="price-info">
                        <span className="price-label">Giá từ</span>
                        <span className="price-value">{car.price}</span>
                      </div>
                    </div>

                    <div className="car-actions">
                      <button className="btn-primary">
                        <i className="fas fa-info-circle"></i>
                        Xem chi tiết
                      </button>
                      <button className="btn-secondary">
                        <i className="fas fa-car"></i>
                        Đặt lái thử
                      </button>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="selection-indicator">
                      <div className="selection-badge">
                        <i className="fas fa-check"></i>
                        <span>Đã chọn</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredCars.length === 0 && (
            <div className="no-results">
              <div className="no-results-content">
                <i className="fas fa-search"></i>
                <h3>Không tìm thấy xe nào</h3>
                <p>Hãy thử thay đổi từ khóa hoặc bộ lọc.</p>
              </div>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
};

export default Compare;