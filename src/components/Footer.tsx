import React from 'react';
import "../styles/FooterStyles/_footer.scss";

interface MenuItem {
  text: string;
  link?: string;
  icon?: string;
}

interface ContactInfo {
  label: string;
  value: string;
  link?: string;
  icon: string;
}

const QUICK_LINKS: MenuItem[] = [
  { text: "Về E-Drive", link: "#about" },
  { text: "Mẫu xe điện", link: "#models" },
  { text: "Đăng ký lái thử", link: "#test-drive" },
  { text: "Tìm đại lý", link: "#dealers" },
  { text: "Hỗ trợ khách hàng", link: "#support" }
];

const SERVICES: MenuItem[] = [
  { text: "Bảo hành & Bảo dưỡng", link: "#warranty" },
  { text: "Trạm sạc", link: "#charging" },
  { text: "Phụ kiện chính hãng", link: "#accessories" },
  { text: "Tài chính & Bảo hiểm", link: "#finance" },
  { text: "Dịch vụ cứu hộ 24/7", link: "#rescue" }
];

const CONTACT_INFO: ContactInfo[] = [
  {
    label: "Hotline",
    value: "(0123) 456 789",
    link: "tel:0123456789",
    icon: "fa-solid fa-phone"
  },
  {
    label: "Email",
    value: "contact@e-drive.vn",
    link: "mailto:contact@e-drive.vn", 
    icon: "fa-solid fa-envelope"
  },
  {
    label: "Địa chỉ",
    value: "123 Đường Xe Điện, Quận 1, TP.HCM",
    icon: "fa-solid fa-location-dot"
  }
];

const SOCIAL_LINKS: MenuItem[] = [
  { text: "Facebook", link: "https://facebook.com/edrive", icon: "fa-brands fa-facebook" },
  { text: "Instagram", link: "https://instagram.com/edrive", icon: "fa-brands fa-instagram" },
  { text: "TikTok", link: "https://tiktok.com/@edrive", icon: "fa-brands fa-tiktok" }
];

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-section">
      <div className="container">
        <div className="footer-content">
          {/* Company Info */}
          <div className="footer-column company-info">
            <div className="logo">
              <h3>E-Drive</h3>
              <span className="tagline">Tương lai xanh bắt đầu từ hôm nay</span>
            </div>
            <p className="company-description">
              Tiên phong trong lĩnh vực xe điện tại Việt Nam với công nghệ hiện đại, 
              dịch vụ chính hãng toàn diện và cam kết phát triển bền vững.
            </p>
            
            <div className="contact-info">
              {CONTACT_INFO.map((contact, index) => (
                <div key={index} className="contact-item">
                  <i className={contact.icon}></i>
                  {contact.link ? (
                    <a href={contact.link}>{contact.value}</a>
                  ) : (
                    <span>{contact.value}</span>
                  )}
                </div>
              ))}
            </div>

            <div className="social-links">
              {SOCIAL_LINKS.map((social, index) => (
                <a key={index} href={social.link} className="social-link" aria-label={social.text}>
                  <i className={social.icon}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-column">
            <h4 className="column-title">Liên kết nhanh</h4>
            <ul className="footer-links">
              {QUICK_LINKS.map((link, index) => (
                <li key={index}>
                  <a href={link.link}>{link.text}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="footer-column">
            <h4 className="column-title">Dịch vụ</h4>
            <ul className="footer-links">
              {SERVICES.map((service, index) => (
                <li key={index}>
                  <a href={service.link}>{service.text}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Working Hours */}
          <div className="footer-column">
            <h4 className="column-title">Giờ làm việc</h4>
            <div className="working-hours">
              <div className="hours-item">
                <span className="day">Thứ 2 - Thứ 6</span>
                <span className="time">8:00 - 18:00</span>
              </div>
              <div className="hours-item">
                <span className="day">Thứ 7</span>
                <span className="time">8:00 - 17:00</span>
              </div>
              <div className="hours-item">
                <span className="day">Chủ nhật</span>
                <span className="time">9:00 - 16:00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="copyright">
            <p>&copy; {currentYear} E-Drive Vietnam. All rights reserved.</p>
          </div>
          <div className="footer-legal">
            <a href="#privacy">Chính sách bảo mật</a>
            <a href="#terms">Điều khoản sử dụng</a>
            <a href="#cookies">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
