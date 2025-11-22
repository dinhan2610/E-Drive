import type { FC } from 'react';
import SelectCar from "../images/plan/icon1.png";
import Contact from "../images/plan/icon2.png";
import Drive from "../images/plan/icon3.png";
import '../styles/PlanTripStyles/_plan.scss';

interface FeatureItem {
  id: string;
  image: string;
  icon: string;
  title: string;
  description: string;
  highlight?: string;
}

const PlanTrip: FC = () => {
  const features: FeatureItem[] = [
    {
      id: 'technology',
      image: SelectCar,
      icon: 'fa-solid fa-microchip',
      title: 'Công nghệ hiện đại',
      description: 'Xe điện E-Drive được thiết kế với công nghệ pin tiên tiến, khả năng sạc nhanh và tầm hoạt động xa, mang lại trải nghiệm lái mượt mà và an toàn.',
      highlight: 'Pin tiên tiến'
    },
    {
      id: 'network',
      image: Contact,
      icon: 'fa-solid fa-network-wired',
      title: 'Mạng lưới đại lý toàn quốc',
      description: 'Hệ thống đại lý chính hãng phủ khắp các tỉnh thành, sẵn sàng hỗ trợ tư vấn, bảo hành và chăm sóc khách hàng mọi lúc, mọi nơi.',
      highlight: '50+ đại lý'
    },
    {
      id: 'sustainability',
      image: Drive,
      icon: 'fa-solid fa-leaf',
      title: 'Hướng đến tương lai xanh',
      description: 'E-Drive cam kết mang đến giải pháp di chuyển thân thiện với môi trường, giảm phát thải và đồng hành cùng cộng đồng xây dựng lối sống bền vững.',
      highlight: '0% phát thải'
    }
  ];

  return (
    <section className="plan-section">
      <div className="container">
        <div className="plan-container">
          <div className="plan-container__title">
            <div className="title-badge">
              <i className="fa-solid fa-bolt"></i>
              <span>Khởi động hành trình xanh</span>
            </div>
            <h2>Xe điện thông minh – hiện đại – bền vững</h2>
            <div className="title-divider">
              <div className="divider-line"></div>
              <i className="fa-solid fa-car-battery"></i>
              <div className="divider-line"></div>
            </div>
            <p className="section-subtitle">
              Trải nghiệm công nghệ tiên tiến cùng dịch vụ chuyên nghiệp, 
              tạo nên hành trình di chuyển hoàn hảo cho tương lai xanh.
            </p>
          </div>

          <div className="plan-container__boxes">
            {features.map((feature) => (
              <div 
                key={feature.id} 
                className="plan-container__boxes__box"
              >
                <div className="feature-icon-wrapper">
                  <div className="feature-icon-bg">
                    <i className={feature.icon}></i>
                  </div>
                  <img 
                    src={feature.image} 
                    alt={`${feature.title} - E-Drive feature illustration`}
                    loading="lazy"
                  />
                </div>
                
                <div className="feature-content">
                  {feature.highlight && (
                    <div className="feature-highlight">
                      <i className="fa-solid fa-star"></i>
                      <span>{feature.highlight}</span>
                    </div>
                  )}
                  
                  <h3>{feature.title}</h3>
                  
                  <p>{feature.description}</p>
                  
                  <div className="feature-cta">
                    <button 
                      className="learn-more-btn"
                      onClick={() => window.scrollTo({ top: window.innerHeight * 2, behavior: 'smooth' })}
                      aria-label={`Tìm hiểu thêm về ${feature.title}`}
                    >
                      <span>Tìm hiểu thêm</span>
                      <i className="fa-solid fa-arrow-right"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="plan-stats">
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-number">50+</div>
                <div className="stat-label">Đại lý</div>
                <div className="stat-description">Đối tác trên toàn quốc</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">1000+</div>
                <div className="stat-label">Khách hàng</div>
                <div className="stat-description">Tin tưởng sử dụng</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">24/7</div>
                <div className="stat-label">Hỗ trợ</div>
                <div className="stat-description">Tư vấn không ngừng nghỉ</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">100%</div>
                <div className="stat-label">Hài lòng</div>
                <div className="stat-description">Cam kết chất lượng</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PlanTrip;
