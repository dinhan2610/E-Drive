// src/components/Navbar.tsx
import React from 'react';
import { Link } from "react-router-dom";
import Logo from "../images/logo/logo.png";
import "../styles/NavbarStyles/_navbar.scss";

const Navbar: React.FC = () => {
  // Nếu muốn dùng mobile menu, giữ lại nav và openNav
  // const [nav, setNav] = useState(false);
  // const openNav = () => setNav(!nav);

  return (
    <>
      <nav>
        <div className="navbar">
          <div className="navbar__img">
            <Link to="/" onClick={() => window.scrollTo(0, 0)}>
              <img src={Logo} alt="logo-img" />
            </Link>
          </div>
          <ul className="navbar__links">
            <li>
              <Link className="home-link" to="/">
                <span style={{ fontWeight: "bold" }}>Trang chủ</span>
              </Link>
            </li>
            <li>
              <Link className="about-link" to="/vehicle">
                <span style={{ fontWeight: "bold" }}>Mẫu xe</span>
              </Link>
            </li>
            <li>
              <Link className="models-link" to="/dealer">
                <span style={{ fontWeight: "bold" }}>Trở thành đại lý</span>
              </Link>
            </li>
            <li>
              <Link className="testi-link" to="/dashboard">
                <span style={{ fontWeight: "bold" }}>Báo cáo &amp; Phân tích</span>
              </Link>
            </li>
            <li>
              <Link className="testi-link" to="/policy">
                <span style={{ fontWeight: "bold" }}>Khuyến mãi &amp; Chính sách</span>
              </Link>
            </li>
            <li>
              <Link className="team-link" to="/contact">
                <span style={{ fontWeight: "bold" }}>Hỗ trợ / Liên hệ</span>
              </Link>
            </li>
          </ul>
          <div className="navbar__buttons">
            <Link className="navbar__buttons__sign-in" to="/">
              <span style={{ fontWeight: "bold" }}>Đăng nhập</span>
            </Link>
            <Link className="navbar__buttons__register" to="/">
              <span style={{ fontWeight: "bold" }}>Đăng ký</span>
            </Link>
          </div>
          {/* Nếu muốn dùng mobile menu, mở comment bên dưới */}
          {/* <div className="mobile-hamb" onClick={openNav}>
            <i className="fa-solid fa-bars"></i>
          </div> */}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
