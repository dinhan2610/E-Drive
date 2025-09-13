import { useState } from "react";
import "../styles/BookStyles/_book.scss";
import { CAR_MODELS, VARIANTS, DEALERS } from "../constants/carData";

interface BookingFormData {
  name: string;
  phone: string;
  email: string;
  model: string;
  variant: string;
  dealer: string;
  date: string;
  time: string;
  note: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  model?: string;
  variant?: string;
  dealer?: string;
  date?: string;
  time?: string;
}

export default function BookCar() {
  const [formData, setFormData] = useState<BookingFormData>({
    name: "",
    phone: "",
    email: "",
    model: "",
    variant: "",
    dealer: "",
    date: "",
    time: "",
    note: ""
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Vui lòng nhập họ và tên";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Họ và tên phải có ít nhất 2 ký tự";
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = "Vui lòng nhập số điện thoại";
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = "Số điện thoại không hợp lệ";
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }
    
    if (!formData.model) {
      newErrors.model = "Vui lòng chọn xe";
    }
    
    if (!formData.variant) {
      newErrors.variant = "Vui lòng chọn phiên bản";
    }
    
    if (!formData.dealer) {
      newErrors.dealer = "Vui lòng chọn đại lý";
    }
    
    if (!formData.date) {
      newErrors.date = "Vui lòng chọn ngày hẹn";
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.date = "Ngày hẹn không thể là ngày trong quá khứ";
      }
    }
    
    if (!formData.time) {
      newErrors.time = "Vui lòng chọn giờ hẹn";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert("Đặt lịch thành công!");
      // Reset form
      setFormData({
        name: "",
        phone: "",
        email: "",
        model: "",
        variant: "",
        dealer: "",
        date: "",
        time: "",
        note: ""
      });
      setErrors({});
    } catch {
      // Handle any errors that might occur
      alert("Có lỗi xảy ra. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  return (
    <div className="book-section">
      <div className="container">
        <div className="book-content">
          <div className="book-content__box">
            <h2>Đặt lịch lái thử</h2>

            <form onSubmit={handleSubmit}>
              <div className="book-form">
                <div className="form-group">
                  <label className="required">Họ và tên</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Nhập họ và tên của bạn"
                    className={errors.name ? 'error' : ''}
                  />
                  <div className="error-message">{errors.name || ''}</div>
                </div>

                <div className="form-group">
                  <label className="required">Số điện thoại</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: 0912345678"
                    className={errors.phone ? 'error' : ''}
                  />
                  <div className="error-message">{errors.phone || ''}</div>
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    className={errors.email ? 'error' : ''}
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="example@gmail.com"
                  />
                </div>

                <div className="form-group">
                  <label className="required">Chọn xe</label>
                  <select
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                  >
                    <option value="">Chọn mẫu xe</option>
                    {CAR_MODELS.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="required">Phiên bản</label>
                  <select
                    name="variant"
                    value={formData.variant}
                    onChange={handleInputChange}
                  >
                    <option value="">Chọn phiên bản</option>
                    {VARIANTS.map((variant) => (
                      <option key={variant} value={variant}>
                        {variant}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="required">Đại lý</label>
                  <select
                    name="dealer"
                    value={formData.dealer}
                    onChange={handleInputChange}
                  >
                    <option value="">Chọn đại lý</option>
                    {DEALERS.map((dealer) => (
                      <option key={dealer} value={dealer}>
                        {dealer}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="required">Ngày hẹn</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className="required">Giờ hẹn</label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Ghi chú</label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    placeholder="Nhập ghi chú nếu cần"
                    rows={3}
                  />
                </div>

                <div className="submit-btn">
                  <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Đang xử lý..." : "Đặt lịch ngay"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
