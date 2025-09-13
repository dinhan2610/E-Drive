import React from "react";
import "../styles/DownloadStyles/_download.scss";

interface ButtonProps {
  className: string;
  text: string;
}

const DownloadButton: React.FC<ButtonProps> = ({ className, text }) => (
  <button className={`download-btn ${className}`}>{text}</button>
);

const Download: React.FC = () => {
  const buttons: ButtonProps[] = [
    { className: "primary", text: "Đăng ký làm đại lý ngay" },
    { className: "secondary", text: "Liên hệ hợp tác" },
    { className: "outline", text: "Tìm hiểu chính sách đại lý" }
  ];

  return (
    <>
      <section className="download-section">
        <div className="container">
          <div className="download-text">
            <h2>Trở thành đối tác E-Drive</h2>
            <p>
              E-Drive đang tìm kiếm những đối tác uy tín để mở rộng hệ thống đại lý xe điện trên toàn quốc. 
              Chúng tôi mang đến chính sách chiết khấu hấp dẫn, hỗ trợ truyền thông – đào tạo toàn diện 
              và sản phẩm chất lượng cao để cùng nhau phát triển bền vững.
            </p>
            <div className="download-buttons">
              {buttons.map((button, index) => (
                <DownloadButton
                  key={index}
                  className={button.className}
                  text={button.text}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Download;
