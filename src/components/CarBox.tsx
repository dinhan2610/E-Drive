import React, { useState } from "react";
import "../styles/PickStyles/_pick.scss";

interface Car {
  img: string;
  price: number;
  model: string;
  mark: string;
  year: number;
  doors: string;
  air: string;
  transmission: string;
  fuel: string;
  batteryCapacity?: number;
  range?: number;
  chargingTime?: string;
  warranty?: string;
  motorPower?: number;
  maxSpeed?: number;
  torque?: number;
  chargingNetwork?: string;
}

interface CarBoxProps {
  data: Car[][];
  carID: number;
}

const CarBox: React.FC<CarBoxProps> = ({ data, carID }) => {
  const [carLoad, setCarLoad] = useState<boolean>(true);
  
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  return (
    <>
      {data[carID].map((car, id) => (
        <div key={id} className="car-showcase">
          <div className="car-showcase__content">
            {/* Car Image Section */}
            <div className="car-image-container">
              {carLoad && (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                  <p>Đang tải hình ảnh...</p>
                </div>
              )}
              <img
                className={`car-image ${!carLoad ? 'loaded' : ''}`}
                src={car.img}
                alt={`${car.mark} ${car.model}`}
                onLoad={() => setCarLoad(false)}
              />
              <div className="car-badge">
                <i className="fa-solid fa-bolt"></i>
                <span>100% điện</span>
              </div>
            </div>

            {/* Car Details Section */}
            <div className="car-details">
              <div className="car-header">
                <div className="car-title">
                  <h3>{car.mark} {car.model}</h3>
                  <div className="car-subtitle">Năm sản xuất {car.year}</div>
                </div>
                <div className="car-price">
                  <span className="price-amount">{formatPrice(car.price)}₫</span>
                  <span className="price-period">Giá bán</span>
                </div>
              </div>

              {/* Thông số pin & quãng đường */}
              <div className="spec-section">
                <h4 className="spec-title">
                  <i className="fa-solid fa-battery-full"></i>
                  Thông số pin & quãng đường
                </h4>
                <div className="spec-grid">
                  <div className="spec-item">
                    <span className="spec-label">Dung lượng pin</span>
                    <span className="spec-value">{car.batteryCapacity || '75'} kWh</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Quãng đường tối đa</span>
                    <span className="spec-value">{car.range || '450'} km</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Thời gian sạc</span>
                    <span className="spec-value">{car.chargingTime || '30 phút (DC)'}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Bảo hành pin</span>
                    <span className="spec-value">{car.warranty || '8 năm/160.000km'}</span>
                  </div>
                </div>
              </div>

              {/* Hiệu suất vận hành */}
              <div className="spec-section">
                <h4 className="spec-title">
                  <i className="fa-solid fa-tachometer-alt"></i>
                  Hiệu suất vận hành
                </h4>
                <div className="spec-grid">
                  <div className="spec-item">
                    <span className="spec-label">Công suất động cơ</span>
                    <span className="spec-value">{car.motorPower || '280'} kW / {Math.round((car.motorPower || 280) * 1.34)} HP</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Tốc độ tối đa</span>
                    <span className="spec-value">{car.maxSpeed || '200'} km/h</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Mô-men xoắn</span>
                    <span className="spec-value">{car.torque || '640'} Nm</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Tăng tốc 0-100km/h</span>
                    <span className="spec-value">3.7 giây</span>
                  </div>
                </div>
              </div>

              {/* Trang bị & tiện ích */}
              <div className="spec-section">
                <h4 className="spec-title">
                  <i className="fa-solid fa-microchip"></i>
                  Trang bị & tiện ích
                </h4>
                <div className="spec-grid">
                  <div className="spec-item">
                    <span className="spec-label">Màn hình trung tâm</span>
                    <span className="spec-value">15" cảm ứng HD</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Kết nối thông minh</span>
                    <span className="spec-value">App điều khiển, OTA</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Hệ thống an toàn</span>
                    <span className="spec-value">ADAS, Camera 360°</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Không gian</span>
                    <span className="spec-value">{car.doors} cửa, cốp 400L</span>
                  </div>
                </div>
              </div>

              {/* Hạ tầng & dịch vụ */}
              <div className="spec-section">
                <h4 className="spec-title">
                  <i className="fa-solid fa-charging-station"></i>
                  Hạ tầng & dịch vụ
                </h4>
                <div className="spec-grid">
                  <div className="spec-item">
                    <span className="spec-label">Mạng lưới sạc</span>
                    <span className="spec-value">{car.chargingNetwork || '500+ trạm toàn quốc'}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Bảo hành toàn diện</span>
                    <span className="spec-value">5 năm + hỗ trợ 24/7</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Thương hiệu</span>
                    <span className="spec-value">{car.mark}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Độ tin cậy</span>
                    <span className="spec-value">★★★★★ 5.0/5</span>
                  </div>
                </div>
              </div>

              <div className="car-actions">
                <a className="hero-btn drive-btn" href="#booking-section">
                  <span>Đặt xe ngay</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </a>
                <button className="hero-btn learn-btn">
                  <span>Xem chi tiết</span>
                </button>
              </div>

              <div className="car-features">
                <div className="feature-badge electric">
                  <i className="fa-solid fa-leaf"></i>
                  <span>Thân thiện môi trường</span>
                </div>
                <div className="feature-badge comfort">
                  <i className="fa-solid fa-shield-check"></i>
                  <span>An toàn tuyệt đối</span>
                </div>
                <div className="feature-badge tech">
                  <i className="fa-solid fa-wifi"></i>
                  <span>Công nghệ AI</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default CarBox;
