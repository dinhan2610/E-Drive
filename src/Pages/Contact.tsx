import React, { useState } from "react";
import HeroPages from "../components/HeroPages";
import "../styles/ContactStyles/_contact.scss";

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

interface ValidationErrors {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
}

const Contact: React.FC = () => {
  const [formData, setFormData] = useState<ContactForm>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Validation function
  const validateForm = (): ValidationErrors => {
    const errors: ValidationErrors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Vui lòng nhập họ và tên';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Họ và tên phải có ít nhất 2 ký tự';
    } else if (!/^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s]+$/.test(formData.name)) {
      errors.name = 'Họ và tên chỉ được chứa chữ cái và khoảng trắng';
    }
    
    if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email không hợp lệ';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^(\+84|0)(3[2-9]|5[689]|7[06-9]|8[1-689]|9[0-46-9])[0-9]{7}$/.test(formData.phone.replace(/[\s\-]/g, ''))) {
      errors.phone = 'Số điện thoại Việt Nam không hợp lệ (VD: 0901234567 hoặc +84901234567)';
    }
    
    if (!formData.subject) {
      errors.subject = 'Vui lòng chọn chủ đề quan tâm';
    }
    
    // Message is now optional - no validation needed
    
    return errors;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Real-time validation for each field
    const fieldErrors: ValidationErrors = {};
    
    if (name === 'name') {
      if (value.trim() && value.trim().length < 2) {
        fieldErrors.name = 'Họ và tên phải có ít nhất 2 ký tự';
      } else if (value.trim() && !/^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s]+$/.test(value)) {
        fieldErrors.name = 'Họ và tên chỉ được chứa chữ cái và khoảng trắng';
      } else {
        fieldErrors.name = undefined;
      }
    }
    
    if (name === 'email') {
      if (value.trim() && !/\S+@\S+\.\S+/.test(value)) {
        fieldErrors.email = 'Email không hợp lệ';
      } else {
        fieldErrors.email = undefined;
      }
    }
    
    if (name === 'phone') {
      const cleanPhone = value.replace(/[\s\-]/g, '');
      if (value.trim() && !/^(\+84|0)(3[2-9]|5[689]|7[06-9]|8[1-689]|9[0-46-9])[0-9]{7}$/.test(cleanPhone)) {
        fieldErrors.phone = 'Số điện thoại không hợp lệ ';
      } else {
        fieldErrors.phone = undefined;
      }
    }
    
    // No real-time validation for message since it's now optional
    if (name === 'message') {
      fieldErrors.message = undefined;
    }
    
    // Update validation errors
    setValidationErrors(prev => ({
      ...prev,
      [name]: fieldErrors[name as keyof ValidationErrors]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm();
    setValidationErrors(errors);
    
    // If there are validation errors, don't submit
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSubmitStatus('success');
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: ""
      });
      setValidationErrors({});
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
      // Reset status after 5 seconds
      setTimeout(() => setSubmitStatus('idle'), 5000);
    }
  };

  return (
    <>
      <section className="contact-page">
        <HeroPages name="Liên hệ với E-Drive" showBreadcrumb={false} />
        
        {/* Contact Hero Section */}
        <div className="contact-hero">
          <div className="container">
            <div className="contact-hero-content">
              <div className="hero-text">
                <h1>Kết nối với chúng tôi</h1>
                <p>Tương lai xanh bắt đầu từ hôm nay. Hãy để E-Drive đồng hành cùng bạn trên hành trình xe điện.</p>
                <div className="hero-stats">
                  <div className="stat-item">
                    <div className="stat-number">24/7</div>
                    <div className="stat-label">Hỗ trợ khách hàng</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">500+</div>
                    <div className="stat-label">Điểm sạc toàn quốc</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">10.000+</div>
                    <div className="stat-label">Khách hàng tin tưởng</div>
                  </div>
                </div>
              </div>
              <div className="hero-image">
                <div className="floating-card">
                  <i className="fa-solid fa-bolt"></i>
                  <span>Tương lai xanh</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Content */}
        <div className="contact-content">
          <div className="container">
            
            {/* Contact Info Cards */}
            <div className="contact-info-section">
              <div className="section-header">
                <span className="section-badge">Liên hệ trực tiếp</span>
                <h2 className="section-title">Chúng tôi luôn sẵn sàng hỗ trợ bạn</h2>
                <p className="section-subtitle">
                  Đội ngũ chuyên viên tư vấn E-Drive sẽ giải đáp mọi thắc mắc về sản phẩm và dịch vụ
                </p>
              </div>

              <div className="contact-info-grid">
                <div className="contact-info-card">
                  <div className="card-icon">
                    <i className="fa-solid fa-phone"></i>
                  </div>
                  <div className="card-content">
                    <h3>Hotline hỗ trợ</h3>
                    <p className="main-contact">(0123) 456 789</p>
                    <p className="sub-contact">Miễn phí từ 8:00 - 17:00</p>
                    <a href="tel:0123456789" className="contact-action">
                      <i className="fa-solid fa-phone"></i>
                      Gọi ngay
                    </a>
                  </div>
                </div>

                <div className="contact-info-card">
                  <div className="card-icon">
                    <i className="fa-solid fa-envelope"></i>
                  </div>
                  <div className="card-content">
                    <h3>Email hỗ trợ</h3>
                    <p className="main-contact">contact@e-drive.vn</p>
                    <p className="sub-contact">Phản hồi trong 24h</p>
                    <a href="mailto:contact@e-drive.vn" className="contact-action">
                      <i className="fa-solid fa-paper-plane"></i>
                      Gửi email
                    </a>
                  </div>
                </div>

                <div className="contact-info-card">
                  <div className="card-icon">
                    <i className="fa-solid fa-location-dot"></i>
                  </div>
                  <div className="card-content">
                    <h3>Showroom chính</h3>
                    <p className="main-contact">123 Đường Xe Điện</p>
                    <p className="sub-contact">Quận 1, TP.HCM</p>
                    <a href="#map" className="contact-action">
                      <i className="fa-solid fa-directions"></i>
                      Xem bản đồ
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Section */}
            <div className="contact-main-section">
              
              {/* Contact Form */}
              <div className="contact-form-section">
                <div className="form-header">
                  <span className="form-badge">Liên hệ ngay</span>
                  <h3>Gửi yêu cầu hỗ trợ</h3>
                  <p>Điền thông tin chi tiết để chúng tôi có thể hỗ trợ bạn một cách tốt nhất</p>
                </div>

                <form className="modern-contact-form" onSubmit={handleSubmit} noValidate>
                  <div className="form-grid">
                    <div className="form-field">
                      <label htmlFor="name" className="field-label">
                        <i className="fa-solid fa-user"></i>
                        Họ và tên
                        <span className="required">*</span>
                      </label>
                      <input
                        id="name"
                        type="text"
                        name="name"
                        placeholder="Nhập họ và tên của bạn"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`field-input ${validationErrors.name ? 'error' : ''}`}
                      />
                      {validationErrors.name && (
                        <div className="field-error">
                          <i className="fa-solid fa-exclamation-circle"></i>
                          {validationErrors.name}
                        </div>
                      )}
                    </div>

                    <div className="form-field">
                      <label htmlFor="email" className="field-label">
                        <i className="fa-solid fa-envelope"></i>
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        name="email"
                        placeholder="email@example.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`field-input ${validationErrors.email ? 'error' : ''}`}
                      />
                      {validationErrors.email && (
                        <div className="field-error">
                          <i className="fa-solid fa-exclamation-circle"></i>
                          {validationErrors.email}
                        </div>
                      )}
                    </div>

                    <div className="form-field">
                      <label htmlFor="phone" className="field-label">
                        <i className="fa-solid fa-phone"></i>
                        Số điện thoại
                        <span className="required">*</span>
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        name="phone"
                        placeholder="0123 456 789"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`field-input ${validationErrors.phone ? 'error' : ''}`}
                      />
                      {validationErrors.phone && (
                        <div className="field-error">
                          <i className="fa-solid fa-exclamation-circle"></i>
                          {validationErrors.phone}
                        </div>
                      )}
                    </div>

                    <div className="form-field">
                      <label htmlFor="subject" className="field-label">
                        <i className="fa-solid fa-tag"></i>
                        Chủ đề quan tâm
                        <span className="required">*</span>
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        className={`field-select ${validationErrors.subject ? 'error' : ''}`}
                      >
                        <option value="">Chọn chủ đề</option>
                        <option value="test-drive">Đăng ký lái thử</option>
                        <option value="purchase">Mua xe điện</option>
                        <option value="dealer">Trở thành đại lý</option>
                        <option value="warranty">Bảo hành & Bảo dưỡng</option>
                        <option value="charging">Trạm sạc</option>
                        <option value="finance">Tài chính & Bảo hiểm</option>
                        <option value="support">Hỗ trợ kỹ thuật</option>
                        <option value="other">Khác</option>
                      </select>
                      {validationErrors.subject && (
                        <div className="field-error">
                          <i className="fa-solid fa-exclamation-circle"></i>
                          {validationErrors.subject}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-field full-width">
                    <label htmlFor="message" className="field-label">
                      <i className="fa-solid fa-message"></i>
                      Nội dung tin nhắn
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      placeholder="Mô tả chi tiết yêu cầu của bạn..."
                      value={formData.message}
                      onChange={handleInputChange}
                      className={`field-textarea ${validationErrors.message ? 'error' : ''}`}
                      rows={6}
                    ></textarea>
                    {validationErrors.message && (
                      <div className="field-error">
                        <i className="fa-solid fa-exclamation-circle"></i>
                        {validationErrors.message}
                      </div>
                    )}
                  </div>

                  <div className="form-submit">
                    <button 
                      type="submit" 
                      className="submit-button"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin"></i>
                          <span>Đang gửi...</span>
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-paper-plane"></i>
                          <span>Gửi yêu cầu hỗ trợ</span>
                        </>
                      )}
                    </button>

                    {submitStatus === 'success' && (
                      <div className="submit-status success">
                        <i className="fa-solid fa-check-circle"></i>
                        <div className="status-content">
                          <h4>Gửi thành công!</h4>
                          <p>Chúng tôi sẽ phản hồi trong vòng 24 giờ</p>
                        </div>
                      </div>
                    )}

                    {submitStatus === 'error' && (
                      <div className="submit-status error">
                        <i className="fa-solid fa-exclamation-triangle"></i>
                        <div className="status-content">
                          <h4>Có lỗi xảy ra</h4>
                          <p>Vui lòng thử lại hoặc liên hệ hotline</p>
                        </div>
                      </div>
                    )}
                  </div>
                </form>
              </div>

              {/* Map & Location */}
              <div className="location-section">
                <div className="location-header">
                  <span className="location-badge">Showroom</span>
                  <h3>Đến thăm chúng tôi</h3>
                  <p>Trải nghiệm trực tiếp các mẫu xe điện hiện đại tại showroom E-Drive</p>
                </div>
                
                <div className="map-container" id="map">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4326002742313!2d106.69829341533415!3d10.77610359232597!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f1c06f4e1dd%3A0x43900f1d4539427f!2zVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBCw6FjaCBraG9hIC0gxJDhuqFpIGjhu41jIFF14buRYyBnaWEgVFAuSENNIC0gQ8ahIHPhu58gTmfGsMOibiBNw60!5e0!3m2!1svi!2s!4v1633593234567!5m2!1svi!2s"
                    width="100%"
                    height="450"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="E-Drive Showroom Location"
                  ></iframe>
                  
                  <div className="location-overlay">
                    <div className="location-info">
                      <div className="location-icon">
                        <i className="fa-solid fa-location-dot"></i>
                      </div>
                      <div className="location-details">
                        <h4>E-Drive Showroom</h4>
                        <p>123 Đường Xe Điện, Quận 1, TP.HCM</p>
                        <div className="location-actions">
                          <a href="tel:0123456789" className="location-btn">
                            <i className="fa-solid fa-phone"></i>
                            Gọi ngay
                          </a>
                          <a href="https://maps.google.com" className="location-btn">
                            <i className="fa-solid fa-directions"></i>
                            Chỉ đường
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Contact Methods */}
            <div className="quick-contact-section">
              <div className="section-header">
                <span className="section-badge">Kết nối nhanh</span>
                <h2 className="section-title">Liên hệ qua kênh yêu thích</h2>
              </div>

              <div className="quick-contact-grid">
                <a href="https://wa.me/84123456789" className="quick-contact-card whatsapp">
                  <div className="quick-icon">
                    <i className="fa-brands fa-whatsapp"></i>
                  </div>
                  <div className="quick-content">
                    <h4>WhatsApp</h4>
                    <p>Chat trực tiếp với tư vấn viên</p>
                    <span className="quick-status">Trực tuyến</span>
                  </div>
                  <div className="quick-arrow">
                    <i className="fa-solid fa-arrow-right"></i>
                  </div>
                </a>

                <a href="https://m.me/edrive" className="quick-contact-card messenger">
                  <div className="quick-icon">
                    <i className="fa-brands fa-facebook-messenger"></i>
                  </div>
                  <div className="quick-content">
                    <h4>Messenger</h4>
                    <p>Nhắn tin qua Facebook</p>
                    <span className="quick-status">Phản hồi nhanh</span>
                  </div>
                  <div className="quick-arrow">
                    <i className="fa-solid fa-arrow-right"></i>
                  </div>
                </a>

                <a href="https://zalo.me/84123456789" className="quick-contact-card zalo">
                  <div className="quick-icon">
                    <i className="fa-brands fa-square-facebook"></i>
                  </div>
                  <div className="quick-content">
                    <h4>Zalo</h4>
                    <p>Tư vấn qua ứng dụng Zalo</p>
                    <span className="quick-status">24/7</span>
                  </div>
                  <div className="quick-arrow">
                    <i className="fa-solid fa-arrow-right"></i>
                  </div>
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
};

export default Contact;
