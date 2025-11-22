import React from "react";
import "../styles/DownloadStyles/_download.scss";

interface ButtonProps {
  className: string;
  text: string;
  icon?: string;
  onClick?: () => void;
}

const DownloadButton: React.FC<ButtonProps> = ({ className, text, icon, onClick }) => (
  <button 
    className={`download-btn ${className}`}
    onClick={onClick}
    type="button"
  >
    {icon && <i className={icon}></i>}
    <span>{text}</span>
  </button>
);

const Download: React.FC = () => {
  const buttons: ButtonProps[] = [
    { 
      className: "primary", 
      text: "Đăng ký làm đại lý ngay",
      icon: "fa-solid fa-handshake",
      onClick: () => console.log('Đăng ký đại lý được click')
    },
    { 
      className: "secondary", 
      text: "Liên hệ hợp tác",
      icon: "fa-solid fa-phone",
      onClick: () => console.log('Liên hệ hợp tác được click')
    },
    { 
      className: "outline", 
      text: "Tìm hiểu chính sách đại lý",
      icon: "fa-solid fa-file-contract",
      onClick: () => console.log('Tìm hiểu chính sách được click')
    }
  ];

  return (
    <section className="download-section">
      <div className="container">
        <div className="download-content">
          <div className="download-text">
            <div className="section-header">
              <h4>Cơ hội kinh doanh</h4>
              <h2>Trở thành đối tác E-Drive</h2>
              <div className="header-divider"></div>
            </div>
            <p>
              E-Drive đang tìm kiếm những đối tác uy tín để mở rộng hệ thống đại lý xe điện trên toàn quốc. 
              Chúng tôi mang đến chính sách chiết khấu hấp dẫn, hỗ trợ truyền thông – đào tạo toàn diện 
              và sản phẩm chất lượng cao để cùng nhau phát triển bền vững.
            </p>
            
            <div className="benefits-grid">
              <div className="benefit-item">
                <i className="fa-solid fa-chart-line"></i>
                <h5>Lợi nhuận cao</h5>
                <span>Chiết khấu hấp dẫn từ 15-25%</span>
              </div>
              <div className="benefit-item">
                <i className="fa-solid fa-graduation-cap"></i>
                <h5>Đào tạo miễn phí</h5>
                <span>Hỗ trợ đào tạo toàn diện</span>
              </div>
              <div className="benefit-item">
                <i className="fa-solid fa-bullhorn"></i>
                <h5>Marketing hỗ trợ</h5>
                <span>Chiến lược truyền thông chuyên nghiệp</span>
              </div>
            </div>

            <div className="download-buttons">
              {buttons.map((button, index) => (
                <DownloadButton
                  key={index}
                  className={button.className}
                  text={button.text}
                  icon={button.icon}
                  onClick={button.onClick}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Download;
