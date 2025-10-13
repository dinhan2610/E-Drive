import { useState, useCallback, useMemo, useEffect } from "react";
import "../styles/BookStyles/_book.scss";
import { CAR_MODELS, VARIANTS, DEALERS } from "../constants/carData";
import { SuccessModal } from "./SuccessModal";
import { fetchVehiclesFromApi } from "../services/vehicleApi";
import { bookTestDrive, convertFormDataToApiRequest, TestDriveApiError } from "../services/testDriveApi";
import type { VehicleApiResponse } from "../types/product";

interface BookingFormData {
  name: string;
  phone: string;
  email: string;
  citizenId: string;
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
  citizenId?: string;
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
  const [isInContinueFlow, setIsInContinueFlow] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Vehicle data from API
  const [vehicles, setVehicles] = useState<VehicleApiResponse[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [vehicleError, setVehicleError] = useState<string | null>(null);
  
  // Sync internal state with prop
  useEffect(() => {
    if (!isInContinueFlow) {
      setIsModalOpen(isOpen);
    }
  }, [isOpen, isInContinueFlow]);
  
  // Fetch vehicles when modal opens
  useEffect(() => {
    if (isModalOpen && vehicles.length === 0 && !loadingVehicles) {
      const loadVehicles = async () => {
        setLoadingVehicles(true);
        setVehicleError(null);
        try {
          const result = await fetchVehiclesFromApi({ status: 'AVAILABLE' });
          setVehicles(result.vehicles);
        } catch (error) {
          console.error('Error loading vehicles:', error);
          setVehicleError('Không thể tải danh sách xe. Vui lòng thử lại.');
        } finally {
          setLoadingVehicles(false);
        }
      };
      loadVehicles();
    }
  }, [isModalOpen, vehicles.length, loadingVehicles]);
  
  const [selectedHour, setSelectedHour] = useState<number>(9);
  const [selectedMinute, setSelectedMinute] = useState<number>(0);

  const [formData, setFormData] = useState<BookingFormData>({
    name: "",
    phone: "",
    email: "",
    citizenId: "",
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
    setIsInContinueFlow(false);
    if (onClose) {
      onClose();
    }
    // Reset form
    setFormData({
      name: "",
      phone: "",
      email: "",
      citizenId: "",
      model: "",
      variant: "",
      dealer: "",
      date: "",
      time: "",
      note: "",
      confirmInfo: false
    });
    setErrors({});
    setSubmitError(null);
  }, [onClose]);

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
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return "Email không hợp lệ";
      }
      return "";
    },
    citizenId: (value: string): string => {
      if (!value) return "Căn Cước Công Dân là bắt buộc";
      const cleanId = value.replace(/[\s\-\.]/g, '');
      if (!/^[0-9]{9}$|^[0-9]{12}$/.test(cleanId)) {
        return "Căn Cước Công Dân phải có 9 hoặc 12 số";
      }
      return "";
    },
    model: (value: string): string => !value ? "Vui lòng chọn mẫu xe" : "",
    variant: (value: string): string => !value ? "Vui lòng chọn màu sắc" : "",
    dealer: (value: string): string => !value ? "Vui lòng chọn đại lý" : "",
    date: (value: string): string => {
      if (!value) return "Ngày hẹn là bắt buộc";
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) return "Ngày hẹn không thể là ngày trong quá khứ";
      
      const dayOfWeek = selectedDate.getDay();
      if (dayOfWeek === 0) return "Chúng tôi chỉ làm việc từ Thứ 2 đến Thứ 7";
      
      return "";
    },
    time: (value: string, dateValue?: string): string => {
      if (!value) return "Giờ hẹn là bắt buộc";
      
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
    
    // Reset previous errors
    setSubmitError(null);
    
    // Validate all fields
    const newErrors = validateAllFields();
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      
      try {
        // Convert form data to API format
        const apiRequest = convertFormDataToApiRequest(formData);
        
        // Get selected vehicle to extract IDs
        const selectedVehicle = vehicles.find(v => 
          `${v.modelName} ${v.version}` === formData.model && 
          v.color === formData.variant
        );

        // Get dealer ID (you need to implement this mapping)
        // For now, using a placeholder
        const dealerId = DEALERS.indexOf(formData.dealer) + 1;

        if (!selectedVehicle) {
          throw new Error('Không tìm thấy thông tin xe được chọn');
        }

        // Make API call
        const response = await bookTestDrive({
          ...apiRequest,
          dealerId,
          vehicleId: selectedVehicle.vehicleId,
        } as any);

        console.log('Booking successful:', response);
        
        // Show success modal
        setIsSuccessModalOpen(true);
        
      } catch (error) {
        console.error('Booking error:', error);
        
        if (error instanceof TestDriveApiError) {
          setSubmitError(error.message);
        } else {
          setSubmitError('Đã xảy ra lỗi khi đặt lịch. Vui lòng thử lại sau.');
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [formData, validateAllFields, vehicles]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [name]: newValue
      };
      
      if (name === 'model') {
        newFormData.variant = '';
      }
      
      return newFormData;
    });

    validateField(name, newValue);
    
    if (name === 'model') {
      setErrors(prev => ({
        ...prev,
        variant: undefined
      }));
    }
  }, [validateField]);

  const handleSuccessModalClose = useCallback(() => {
    setIsSuccessModalOpen(false);
    handleCloseModal();
  }, [handleCloseModal]);

  const handleContinueRegistration = useCallback(() => {
    setIsInContinueFlow(true);
    
    setFormData({
      name: "",
      phone: "",
      email: "",
      citizenId: "",
      model: "",
      variant: "",
      dealer: "",
      date: "",
      time: "",
      note: "",
      confirmInfo: false
    });
    setErrors({});
    setSubmitError(null);
    
    setIsSuccessModalOpen(false);
    setIsModalOpen(true);
  }, []);

  // Handle ESC key
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        handleCloseModal();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isModalOpen, handleCloseModal]);

  // Prevent body scroll
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

                {submitError && (
                  <div className="alert alert-error" style={{
                    padding: '12px 16px',
                    marginBottom: '20px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    color: '#991b1b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <i className="fa-solid fa-exclamation-triangle"></i>
                    <span>{submitError}</span>
                  </div>
                )}

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
                            disabled={isSubmitting}
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
                            disabled={isSubmitting}
                          />
                          {errors.phone && (
                            <span className="field-error">
                              <i className="fa-solid fa-exclamation-circle"></i>
                              {errors.phone}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Email</label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="example@gmail.com"
                            disabled={isSubmitting}
                          />
                          {errors.email && (
                            <span className="field-error">
                              <i className="fa-solid fa-exclamation-circle"></i>
                              {errors.email}
                            </span>
                          )}
                        </div>

                        <div className="form-group">
                          <label className="required">Căn Cước Công Dân</label>
                          <input
                            type="text"
                            name="citizenId"
                            value={formData.citizenId}
                            onChange={handleInputChange}
                            placeholder="Ví dụ: 123456789 hoặc 123456789012"
                            maxLength={12}
                            disabled={isSubmitting}
                          />
                          {errors.citizenId && (
                            <span className="field-error">
                              <i className="fa-solid fa-exclamation-circle"></i>
                              {errors.citizenId}
                            </span>
                          )}
                        </div>
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
                            disabled={loadingVehicles || isSubmitting}
                          >
                            <option value="">
                              {loadingVehicles ? 'Đang tải danh sách xe...' : 'Chọn mẫu xe'}
                            </option>
                            {vehicleError ? (
                              <option value="" disabled>Lỗi tải dữ liệu</option>
                            ) : (
                              vehicles.map((vehicle) => (
                                <option key={vehicle.vehicleId} value={`${vehicle.modelName} ${vehicle.version}`}>
                                  {vehicle.modelName} {vehicle.version}
                                </option>
                              ))
                            )}
                          </select>
                          {vehicleError && (
                            <span className="field-error">
                              <i className="fa-solid fa-exclamation-triangle"></i>
                              {vehicleError}
                            </span>
                          )}
                          {errors.model && (
                            <span className="field-error">
                              <i className="fa-solid fa-exclamation-circle"></i>
                              {errors.model}
                            </span>
                          )}
                        </div>

                        <div className="form-group">
                          <label className="required">Màu sắc</label>
                          <select
                            name="variant"
                            value={formData.variant}
                            onChange={handleInputChange}
                            disabled={loadingVehicles || !formData.model || isSubmitting}
                          >
                            <option value="">Chọn màu sắc</option>
                            {formData.model && vehicles
                              .filter(v => `${v.modelName} ${v.version}` === formData.model)
                              .map((vehicle) => (
                                <option key={`${vehicle.vehicleId}-${vehicle.color}`} value={vehicle.color}>
                                  {vehicle.color}
                                </option>
                              ))
                            }
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
                          disabled={isSubmitting}
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
                            disabled={isSubmitting}
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
                                  disabled={isSubmitting}
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
                                  disabled={isSubmitting}
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
                                  disabled={isSubmitting}
                                >
                                  08:00
                                </button>
                                <button 
                                  type="button" 
                                  className={`quick-time-btn ${selectedHour === 9 && selectedMinute === 30 ? 'active' : ''}`}
                                  onClick={() => {setSelectedHour(9); setSelectedMinute(30);}}
                                  disabled={isSubmitting}
                                >
                                  09:30
                                </button>
                                <button 
                                  type="button"
                                  className={`quick-time-btn ${selectedHour === 13 && selectedMinute === 0 ? 'active' : ''}`}
                                  onClick={() => {setSelectedHour(13); setSelectedMinute(0);}}
                                  disabled={isSubmitting}
                                >
                                  13:00
                                </button>
                                <button 
                                  type="button"
                                  className={`quick-time-btn ${selectedHour === 14 && selectedMinute === 30 ? 'active' : ''}`}
                                  onClick={() => {setSelectedHour(14); setSelectedMinute(30);}}
                                  disabled={isSubmitting}
                                >
                                  14:30
                                </button>
                                <button 
                                  type="button"
                                  className={`quick-time-btn ${selectedHour === 16 && selectedMinute === 0 ? 'active' : ''}`}
                                  onClick={() => {setSelectedHour(16); setSelectedMinute(0);}}
                                  disabled={isSubmitting}
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
                          disabled={isSubmitting}
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
                            disabled={isSubmitting}
                          />
                          <label htmlFor="confirmInfo">
                            Tôi đã đọc và đồng ý với các quy định và chính sách của E-Drive Việt Nam. <span style={{ color: '#ef4444', fontWeight: '600' }}>*</span>
                          </label>
                        </div>
                        
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
                        <button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? (
                            <>
                              <i className="fa-solid fa-spinner fa-spin"></i>
                              Đang xử lý...
                            </>
                          ) : (
                            'Đặt lịch ngay'
                          )}
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

export const BookCarModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <BookCar isOpen={isOpen} onClose={onClose} />
);

export default BookCar;