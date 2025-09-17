import React from 'react';
import '../styles/BannerStyles/_banner.scss';

const Banner: React.FC = () => {
  return (
    <section className="banner-section">
      <div className="container">
        <div className="banner-content">
          {/* Main Banner Content */}
          <div className="banner-hero">
            <div className="banner-hero__badge">
              <i className="fa-solid fa-bolt"></i>
              <span>Đại lý xe điện hàng đầu Việt Nam</span>
            </div>
            
            <h2 className="banner-hero__title">
              E-Drive – Xe điện cho 
              <span className="highlight"> mọi hành trình!</span>
            </h2>
            
            <p className="banner-hero__subtitle">
              Trải nghiệm tương lai di chuyển với công nghệ xe điện tiên tiến nhất. 
              Dịch vụ chuyên nghiệp, bảo hành toàn diện, hỗ trợ <span className="highlight-text">24/7</span>.
            </p>

            <div className="banner-stats">
              <div className="stat-item">
                <div className="stat-number">5000+</div>
                <div className="stat-label">Khách hàng tin tưởng</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">50+</div>
                <div className="stat-label">Dòng xe điện</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">24/7</div>
                <div className="stat-label">Hỗ trợ khách hàng</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animated Background Elements */}
      <div className="banner-decoration">
        <div className="decoration-circle decoration-1"></div>
        <div className="decoration-circle decoration-2"></div>
        <div className="decoration-circle decoration-3"></div>
      </div>
    </section>
  );
};

export default Banner;
