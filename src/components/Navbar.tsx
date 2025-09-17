import React from 'react';
import { Link } from "react-router-dom";
import Logo from "../images/logo/logo.png";
import "../styles/NavbarStyles/_navbar.scss";

interface NavLink {
  to: string;
  label: string;
  className: string;
}

const Navbar: React.FC = () => {
  const handleSectionScroll = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navLinks: NavLink[] = [
    { to: "/", label: "Trang chủ", className: "home-link" },
    { to: "#vehicles", label: "Mẫu xe", className: "vehicle-link" },
    { to: "#dealer", label: "Trở thành đại lý", className: "dealer-link" },
    { to: "#services", label: "Dịch vụ", className: "services-link" },
    { to: "#contact", label: "Liên hệ", className: "contact-link" }
  ];

  return (
    <nav className="nav-wrapper">
      <div className="navbar">
        <div className="navbar__brand">
          <Link to="/" onClick={() => window.scrollTo(0, 0)} className="logo-link">
            <img src={Logo} alt="E-Drive Logo" />
          </Link>
          <span className="brand-tagline">Future Electric</span>
        </div>

        <ul className="navbar__links">
          {navLinks.map((link, index) => (
            <li key={index} className="nav-item">
              {link.to.startsWith('#') ? (
                <button 
                  className={`nav-link ${link.className}`} 
                  onClick={() => handleSectionScroll(link.to.substring(1))}
                >
                  <span>{link.label}</span>
                  <div className="nav-underline"></div>
                </button>
              ) : (
                <Link className={`nav-link ${link.className}`} to={link.to}>
                  <span>{link.label}</span>
                  <div className="nav-underline"></div>
                </Link>
              )}
            </li>
          ))}
        </ul>

        <div className="navbar__actions">
          <button 
            className="navbar__actions__signin"
            onClick={() => handleSectionScroll('contact')}
          >
            <i className="fas fa-user"></i>
            <span>Đăng nhập</span>
          </button>
          <button 
            className="navbar__actions__register"
            onClick={() => handleSectionScroll('dealer')}
          >
            <i className="fas fa-handshake"></i>
            <span>Làm đại lý</span>
            <div className="btn-shimmer"></div>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
