import React from 'react';
import '../styles/BannerStyles/_banner.scss';

const Banner: React.FC = () => {
  return (
    <>
      <section className="banner-section">
        <div className="container">
          <div className="banner-content">
            <div className="banner-content__text">
              <h2>E-Drive – Xe điện cho mọi hành trình!</h2>
              <p>
                Đại lý chính hãng toàn quốc. Dịch vụ nhanh chóng, tin cậy. Hỗ trợ tận tâm <span>24/7.</span> 
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Banner;
