import { useState, useCallback, useMemo, useEffect } from "react";
import "../styles/BookStyles/_book.scss";
import { CAR_MODELS, VARIANTS, DEALERS } from "../constants/carData";
import { SuccessModal } from "./SuccessModal";

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
  confirmInfo: boolean;
}

interface ValidationErrors {
  name?: string;
  phone?: string;
  email?: string;
  model?: string;
  variant?: string;
  dealer?: string;
  date?: string;
  time?: string;
  confirmInfo?: string;
}

interface BookCarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

function BookCar({ isOpen = false, onClose }: BookCarProps) {
  const [isModalOpen, setIsModalOpen] = useState(isOpen);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isInContinueFlow, setIsInContinueFlow] = useState(false); // Track continue flow
  
  // Sync internal state with prop, but don't override when in continue flow
  useEffect(() => {
    if (!isInContinueFlow) {
      setIsModalOpen(isOpen);
    }
  }, [isOpen, isInContinueFlow]);
  
  // Separate hour and minute states for sliders
  const [selectedHour, setSelectedHour] = useState<number>(9);
  const [selectedMinute, setSelectedMinute] = useState<number>(0);

  const [formData, setFormData] = useState<BookingFormData>({
    name: "",
    phone: "",
    email: "",
    model: "",
    variant: "",
    dealer: "",
    date: "",
    time: "",
    note: "",
    confirmInfo: false
  });

  const [errors, setErrors] = useState<ValidationErrors>({});

  // Sync hour/minute with formData.time
  useEffect(() => {
    const timeString = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
    setFormData(prev => ({
      ...prev,
      time: timeString
    }));
  }, [selectedHour, selectedMinute]);

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSelectedHour(Number(e.target.value));
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSelectedMinute(Number(e.target.value));
  };

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setIsInContinueFlow(false); // Reset continue flow when closing
    if (onClose) {
      onClose();
    }
    // Reset form when closing
    setFormData({
      name: "",
      phone: "",
      email: "",
      model: "",
      variant: "",
      dealer: "",
      date: "",
      time: "",
      note: "",
      confirmInfo: false
    });
    setErrors({});
  }, [onClose]);

  // Consolidated validation functions
  const validators = useMemo(() => ({
    name: (value: string): string => {
      if (!value) return "Họ tên là bắt buộc";
      if (value.length < 2) return "Họ tên phải có ít nhất 2 ký tự";
      if (!/^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s]+$/.test(value)) {
        return "Họ tên chỉ được chứa chữ cái và khoảng trắng";
      }
      return "";
    },
    phone: (value: string): string => {
      if (!value) return "Số điện thoại là bắt buộc";
      const cleanPhone = value.replace(/[\s\-]/g, '');
      if (!/^(\+84|0)(3[2-9]|5[689]|7[06-9]|8[1-689]|9[0-46-9])[0-9]{7}$/.test(cleanPhone)) {
        return "Số điện thoại Việt Nam không hợp lệ (VD: 0901234567)";
      }
      return "";
    },
    email: (value: string): string => {
      if (!value) return "Email là bắt buộc";
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) return "Email không hợp lệ";
      return "";
    },
    model: (value: string): string => !value ? "Vui lòng chọn mẫu xe" : "",
    variant: (value: string): string => !value ? "Vui lòng chọn phiên bản" : "",
    dealer: (value: string): string => !value ? "Vui lòng chọn đại lý" : "",
    date: (value: string): string => {
      if (!value) return "Ngày hẹn là bắt buộc";
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) return "Ngày hẹn không thể là ngày trong quá khứ";
      
      // Kiểm tra thứ trong tuần (0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7)
      const dayOfWeek = selectedDate.getDay();
      if (dayOfWeek === 0) return "Chúng tôi chỉ làm việc từ Thứ 2 đến Thứ 7";
      
      return "";
    },
    time: (value: string, dateValue?: string): string => {
      if (!value) return "Giờ hẹn là bắt buộc";
      
      // Kiểm tra ngày có hợp lệ không trước
      if (!dateValue) return "Vui lòng chọn ngày trước";
      
      const selectedDate = new Date(dateValue);
      const dayOfWeek = selectedDate.getDay();
      if (dayOfWeek === 0) return "Chúng tôi chỉ làm việc từ Thứ 2 đến Thứ 7";
      
      const [hours, minutes] = value.split(':').map(Number);
      if (hours < 8 || hours > 17 || (hours === 17 && minutes > 0)) {
        return "Giờ làm việc: 08:00 - 17:00 (Thứ 2 - Thứ 7)";
      }
      return "";
    },
    confirmInfo: (value: boolean): string => !value ? "Vui lòng xác nhận thông tin trước khi đặt lịch" : ""
  }), []);

  const validateField = useCallback((name: string, value: string | boolean) => {
    let error = "";
    
    if (name === "confirmInfo") {
      error = validators.confirmInfo(value as boolean);
    } else if (name === "time") {
      // Special handling for time validator that needs date parameter
      error = validators.time(value as string, formData.date);
    } else {
      const validator = validators[name as keyof typeof validators];
      error = validator ? (validator as (value: string) => string)(value as string) : "";
    }
    
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  }, [validators, formData.date]);

  // Re-validate time when date changes (to check weekday)
  useEffect(() => {
    if (formData.date && formData.time) {
      validateField('time', formData.time);
    }
  }, [formData.date, formData.time, validateField]);

  const validateAllFields = useCallback(() => {
    const newErrors: ValidationErrors = {};
    
    (Object.keys(formData) as Array<keyof BookingFormData>).forEach(key => {
      if (key !== "note") {
        let error = "";
        if (key === "confirmInfo") {
          error = validators.confirmInfo(formData[key] as boolean);
        } else if (key === "time") {
          // Special handling for time validator that needs date parameter
          error = validators.time(formData[key] as string, formData.date);
        } else if (validators[key as keyof typeof validators]) {
          error = (validators[key as keyof typeof validators] as (value: string) => string)(formData[key] as string);
        }
        
        if (error) {
          newErrors[key] = error;
        }
      }
    });
    
    return newErrors;
  }, [formData, validators]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors = validateAllFields();
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // Xử lý submit form thành công
      setIsSuccessModalOpen(true);
    }
  }, [formData, validateAllFields]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Validate ngay lập tức khi user nhập
    validateField(name, newValue);
  }, [validateField]);

  const handleSuccessModalClose = useCallback(() => {
    setIsSuccessModalOpen(false);
    // Đóng main modal và reset form khi đóng success modal
    handleCloseModal();
  }, [handleCloseModal]);

  const handleContinueRegistration = useCallback(() => {
    // Mark that we're in continue flow to prevent prop override
    setIsInContinueFlow(true);
    
    // Reset form data
    setFormData({
      name: "",
      phone: "",
      email: "",
      model: "",
      variant: "",
      dealer: "",
      date: "",
      time: "",
      note: "",
      confirmInfo: false
    });
    setErrors({});
    
    // Close success modal and open main modal
    setIsSuccessModalOpen(false);
    setIsModalOpen(true);
  }, []);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        handleCloseModal();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isModalOpen, handleCloseModal]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  // If neither modal should be open, don't render anything
  const shouldRender = isModalOpen || isSuccessModalOpen;
  if (!shouldRender) {
    return null;
  }

  return (
    <>
    <div className="book-modal-overlay" onClick={handleCloseModal} style={{
      display: isSuccessModalOpen ? 'none' : 'flex'
    }}>
      <div className="book-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={handleCloseModal}>
          ✕
        </button>
        
        <div className="book-section">
          <div className="container">
            <div className="book-content">
              <div className="book-content__box">
                <div className="form-header">
                  <h2>Đặt lịch lái thử</h2>
                  <p>Vui lòng điền đầy đủ thông tin để chúng tôi hỗ trợ bạn tốt nhất</p>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                  <div className="book-form">
                    <div className="form-section">
                      <h3>Thông tin cá nhân</h3>
                      
                      <div className="form-row">
                        <div className="form-group">
                          <label className="required">Họ và tên</label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Nhập họ và tên của bạn"
                          />
                          {errors.name && (
                            <span className="field-error">
                              <i className="fa-solid fa-exclamation-circle"></i>
                              {errors.name}
                            </span>
                          )}
                        </div>

                        <div className="form-group">
                          <label className="required">Số điện thoại</label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="Ví dụ: 0912345678"
                          />
                          {errors.phone && (
                            <span className="field-error">
                              <i className="fa-solid fa-exclamation-circle"></i>
                              {errors.phone}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="form-group full-width">
                        <label>Email</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="example@gmail.com"
                        />
                        {errors.email && (
                          <span className="field-error">
                            <i className="fa-solid fa-exclamation-circle"></i>
                            {errors.email}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="form-section">
                      <h3>Thông tin xe</h3>
                      
                      <div className="form-row">
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
                          {errors.model && (
                            <span className="field-error">
                              <i className="fa-solid fa-exclamation-circle"></i>
                              {errors.model}
                            </span>
                          )}
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
                          {errors.variant && (
                            <span className="field-error">
                              <i className="fa-solid fa-exclamation-circle"></i>
                              {errors.variant}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="form-group full-width">
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
                        {errors.dealer && (
                          <span className="field-error">
                            <i className="fa-solid fa-exclamation-circle"></i>
                            {errors.dealer}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="form-section">
                      <h3>Thời gian hẹn</h3>
                      
                      <div className="form-row">
                        <div className="form-group">
                          <label className="required">Ngày hẹn</label>
                          <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleInputChange}
                            min={new Date().toISOString().split('T')[0]}
                          />
                          {errors.date && (
                            <span className="field-error">
                              <i className="fa-solid fa-exclamation-circle"></i>
                              {errors.date}
                            </span>
                          )}
                        </div>

                        <div className="form-group">
                          <label className="required">Giờ hẹn</label>
                          <div className="time-picker-container">
                            <div className="time-picker-row">
                              <div className="time-select-group">
                                <label>Giờ</label>
                                <select
                                  value={selectedHour}
                                  onChange={handleHourChange}
                                  className="time-select hour-select"
                                >
                                  {Array.from({ length: 10 }, (_, i) => i + 8).map(hour => (
                                    <option key={hour} value={hour}>
                                      {hour.toString().padStart(2, '0')}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              
                              <div className="time-separator">
                                <span>:</span>
                              </div>
                              
                              <div className="time-select-group">
                                <label>Phút</label>
                                <select
                                  value={selectedMinute}
                                  onChange={handleMinuteChange}
                                  className="time-select minute-select"
                                >
                                  <option value={0}>00</option>
                                  <option value={15}>15</option>
                                  <option value={30}>30</option>
                                  <option value={45}>45</option>
                                </select>
                              </div>
                            </div>
                            
                            <div className="time-slots">
                              <span className="time-slots-label">Khung giờ phổ biến:</span>
                              <div className="quick-time-buttons">
                                <button 
                                  type="button" 
                                  className={`quick-time-btn ${selectedHour === 8 && selectedMinute === 0 ? 'active' : ''}`}
                                  onClick={() => {setSelectedHour(8); setSelectedMinute(0);}}
                                >
                                  08:00
                                </button>
                                <button 
                                  type="button" 
                                  className={`quick-time-btn ${selectedHour === 9 && selectedMinute === 30 ? 'active' : ''}`}
                                  onClick={() => {setSelectedHour(9); setSelectedMinute(30);}}
                                >
                                  09:30
                                </button>
                                <button 
                                  type="button"
                                  className={`quick-time-btn ${selectedHour === 13 && selectedMinute === 0 ? 'active' : ''}`}
                                  onClick={() => {setSelectedHour(13); setSelectedMinute(0);}}
                                >
                                  13:00
                                </button>
                                <button 
                                  type="button"
                                  className={`quick-time-btn ${selectedHour === 14 && selectedMinute === 30 ? 'active' : ''}`}
                                  onClick={() => {setSelectedHour(14); setSelectedMinute(30);}}
                                >
                                  14:30
                                </button>
                                <button 
                                  type="button"
                                  className={`quick-time-btn ${selectedHour === 16 && selectedMinute === 0 ? 'active' : ''}`}
                                  onClick={() => {setSelectedHour(16); setSelectedMinute(0);}}
                                >
                                  16:00
                                </button>
                                
                              </div>
                            </div>
                          </div>
                          {errors.time && (
                            <span className="field-error">
                              <i className="fa-solid fa-exclamation-circle"></i>
                              {errors.time}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="form-section">
                      <div className="form-group full-width">
                        <label>Ghi chú</label>
                        <textarea
                          name="note"
                          value={formData.note}
                          onChange={handleInputChange}
                          placeholder="Nhập ghi chú nếu cần"
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className="form-footer">
                      <div className="form-group checkbox">
                        <div className="checkbox-row">
                          <input
                            type="checkbox"
                            id="confirmInfo"
                            name="confirmInfo"
                            checked={formData.confirmInfo}
                            onChange={handleInputChange}
                          />
                          <label htmlFor="confirmInfo">
                            Tôi đã đọc và đồng ý với các quy định và chính sách của E-Drive Việt Nam. <span style={{ color: '#ef4444', fontWeight: '600' }}>*</span>
                          </label>
                        </div>
                        
                        {/* Validation message on separate line */}
                        <div className="validation-message-container">
                          {errors.confirmInfo && (
                            <span className="field-error">
                              <i className="fa-solid fa-exclamation-circle"></i>
                              {errors.confirmInfo}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="submit-btn-center">
                        <button type="submit">
                          Đặt lịch ngay
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    {/* Success Modal */}
    {isSuccessModalOpen && (
      <SuccessModal 
        isOpen={isSuccessModalOpen}
        onClose={handleSuccessModalClose}
        onContinue={handleContinueRegistration}
        title="Đặt lịch thành công!"
        message="Chúng tôi sẽ liên hệ với bạn để xác nhận lịch hẹn trong thời gian sớm nhất. Bạn có muốn tiếp tục đăng ký lịch hẹn khác không?"
      />
    )}
    </>
  );
}

// Named exports for different use cases  
export const BookCarModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <BookCar isOpen={isOpen} onClose={onClose} />
);

export default BookCar;
