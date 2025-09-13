import React from 'react';
import "../styles/FooterStyles/_footer.scss";

interface MenuItem {
  text: string;
  link?: string;
}

interface WorkingHours {
  day: string;
  hours: string;
}

const COMPANY_MENU: MenuItem[] = [
  { text: "Về E-Drive", link: "#home" },
  { text: "Mẫu xe", link: "#home" },
  { text: "Lái thử", link: "#home" },
  { text: "Tin tức và sự kiện", link: "#home" },
  { text: "Hỗ trợ", link: "#home" }
];

const WORKING_HOURS: WorkingHours[] = [
  { day: "Thứ hai - Thứ sáu", hours: "9:00AM - 9:00PM" },
  { day: "Thứ bảy", hours: "9:00AM - 19:00PM" },
  { day: "Chủ nhật", hours: "Đóng cửa" }
];

const Footer: React.FC = () => {
  return (
    <>
      <footer>
        <div className="container">
          <div className="footer-content">
            <ul className="footer-content__1">
              <li>
                Xe điện <span>E-Drive</span>
              </li>
              <li>
                Chúng tôi mang đến giải pháp xe điện hiện đại, thân thiện với môi trường 
                và dịch vụ chính hãng toàn diện. Với công nghệ tiên tiến và mạng lưới đại lý 
                rộng khắp, E-Drive cam kết đồng hành cùng bạn trên mọi hành trình xanh bền vững.
              </li>
              <li>
                <a href="tel:0123456789">
                  <i className="fa-solid fa-phone"></i> &nbsp; 📞 Hotline: (0123) 456 789
                </a>
              </li>
              <li>
                <a href="mailto:contact@e-drive.com">
                  <i className="fa-solid fa-envelope"></i>
                  &nbsp; ✉️ contact@e-drive.com
                </a>
              </li>
            </ul>

            <ul className="footer-content__2">
              <li>Company</li>
              {COMPANY_MENU.map((item, index) => (
                <li key={index}>
                  <a href={item.link}>{item.text}</a>
                </li>
              ))}
            </ul>

            <ul className="footer-content__2">
              <li>Giờ làm việc:</li>
              {WORKING_HOURS.map((schedule, index) => (
                <li key={index}>
                  {schedule.day}: {schedule.hours}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Footer;
