import React from 'react';
import MainImg from "../images/chooseUs/main.png";
import "../styles/ChooseStyles/_choose.scss";

interface InfoBox {
  title: string;
  description: string;
  icon: string;
}

const ChooseUs: React.FC = () => {
  const infoBoxes: InfoBox[] = [
    {
      icon: "fa-solid fa-bolt",
      title: "Trải nghiệm tương lai",
      description: "Xe điện E-Drive mang đến hành trình xanh, thông minh với công nghệ AI tiên tiến."
    },
    {
      icon: "fa-solid fa-shield-check",
      title: "Giá trị toàn diện",
      description: "Hỗ trợ chuyên nghiệp từ tư vấn, lái thử đến bảo hành và dịch vụ hậu mãi."
    },
    {
      icon: "fa-solid fa-star",
      title: "Uy tín tuyệt đối",
      description: "Minh bạch 100%, không phí ẩn – cam kết chất lượng và độ tin cậy hàng đầu."
    }
  ];

  return (
    <section className="choose-section">
      <div className="container">
        <div className="choose-container">
          {/* Hero Section */}
          <div className="choose-hero">
            <div className="choose-hero__badge">
              <i className="fa-solid fa-trophy"></i>
              <span>Tại sao chọn E-Drive?</span>
            </div>
            <h2 className="choose-hero__title">
              E-Drive – Lựa chọn <span className="highlight">thông minh</span>
            </h2>
            <p className="choose-hero__subtitle">
              Hệ sinh thái xe điện hoàn chỉnh với công nghệ tiên tiến, dịch vụ tận tâm và cam kết bền vững
            </p>
          </div>

          <div className="choose-content">
            {/* Left Content */}
            <div className="choose-content__left">
              <div className="main-image">
                <img src={MainImg} alt="E-Drive Electric Car" />
                <div className="image-overlay">
                  <div className="feature-badge eco">
                    <i className="fa-solid fa-leaf"></i>
                    <span>100% Xanh</span>
                  </div>
                  <div className="feature-badge tech">
                    <i className="fa-solid fa-microchip"></i>
                    <span>AI Smart</span>
                  </div>
                </div>
              </div>

              <div className="main-content">
                <h3>Lái xe xanh, tiết kiệm, an toàn</h3>
                <p>
                  E-Drive mang đến những mẫu xe điện hiện đại với công nghệ pin tiên tiến, 
                  hệ thống đại lý chính hãng phủ rộng toàn quốc. Chúng tôi cam kết trải nghiệm 
                  minh bạch, dịch vụ tận tâm và giải pháp di chuyển thân thiện môi trường.
                </p>
                
                <div className="benefits-grid">
                  <div className="benefit-card">
                    <div className="benefit-icon">
                      <i className="fa-solid fa-dollar-sign"></i>
                    </div>
                    <div className="benefit-content">
                      <h4>Chi phí tiết kiệm - Chỉ bằng 1/3 chi phí nhiên liệu xăng.</h4>
                      <p>
                        Tiết kiệm đáng kể chi phí vận hành hàng tháng, giúp bạn vừa bảo vệ môi trường vừa bảo vệ túi tiền.
                      </p>
                    </div>
                  </div>
                  <div className="benefit-card">
                    <div className="benefit-icon">
                      <i className="fa-solid fa-shield-halved"></i>
                    </div>
                    <div className="benefit-content">
                      <h4>Bảo hành toàn diện - 8 năm an tâm sử dụng.</h4>
                      <p> Chính sách bảo hành dài hạn cho cả pin và động cơ, mang đến sự yên tâm tuyệt đối khi lựa chọn xe điện.</p>
                    </div>
                  </div>
                  <div className="benefit-card">
                    <div className="benefit-icon">
                      <i className="fa-solid fa-charging-station"></i>
                    </div>
                    <div className="benefit-content">
                      <h4>Mạng lưới trạm sạc - 500+ địa điểm trên toàn quốc.</h4>
                      <p> Hệ thống trạm sạc phủ rộng, dễ dàng tiếp cận để bạn an tâm trên mọi hành trình dài.</p>
                    </div>
                  </div>
                  <div className="benefit-card">
                    <div className="benefit-icon">
                      <i className="fa-solid fa-headset"></i>
                    </div>
                    <div className="benefit-content">
                      <h4>Hỗ trợ khách hàng - Dịch vụ 24/7 mọi lúc, mọi nơi.</h4>
                      <p> Đội ngũ chăm sóc khách hàng luôn sẵn sàng tư vấn, hỗ trợ kỹ thuật và xử lý sự cố bất kỳ khi nào bạn cần.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="choose-content__right">
              <div className="info-boxes">
                {infoBoxes.map((box, index) => (
                  <div key={index} className="info-box">
                    <div className="info-box__icon">
                      <i className={box.icon}></i>
                    </div>
                    <div className="info-box__content">
                      <h4>{box.title}</h4>
                      <p>{box.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-number">99%</div>
                  <div className="stat-label">Hài lòng</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">5★</div>
                  <div className="stat-label">Đánh giá</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChooseUs;
