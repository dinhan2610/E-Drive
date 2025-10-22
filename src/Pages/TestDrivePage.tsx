import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { DEALERS } from "../constants/carData";
import { SuccessModal } from "../components/SuccessModal";
import { fetchVehiclesFromApi } from "../services/vehicleApi";
import { bookTestDrive, TestDriveApiError } from "../services/testDriveApi";
import type { VehicleApiResponse } from "../types/product";
import Footer from "../components/Footer";
import styles from "../styles/TestDriveStyles/TestDrivePage.module.scss";

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

const TestDrivePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Vehicle data from API
  const [vehicles, setVehicles] = useState<VehicleApiResponse[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [vehicleError, setVehicleError] = useState<string | null>(null);
  
  // Fetch vehicles on mount
  useEffect(() => {
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
  }, []);
  
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

  // Pre-fill from navigation state if available
  useEffect(() => {
    if (location.state && location.state.product) {
      const product = location.state.product;
      setFormData(prev => ({
        ...prev,
        model: product.id,
        variant: product.name
      }));
    }
  }, [location.state]);

  // Sync hour/minute with formData.time
  useEffect(() => {
    const timeString = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
    setFormData(prev => ({
      ...prev,
      time: timeString
    }));
  }, [selectedHour, selectedMinute]);

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedHour(Number(e.target.value));
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMinute(Number(e.target.value));
  };

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
    confirmInfo: (value: boolean): string => !value ? "Vui lòng xác nhận thông tin" : ""
  }), []);

  const validate = useCallback((field?: string): boolean => {
    const newErrors: ValidationErrors = {};
    const fieldsToValidate = field ? [field] : Object.keys(formData) as Array<keyof BookingFormData>;

    fieldsToValidate.forEach((key) => {
      if (key === 'time') {
        const error = validators.time(formData.time, formData.date);
        if (error) newErrors.time = error;
      } else if (key === 'confirmInfo') {
        const error = validators.confirmInfo(formData.confirmInfo);
        if (error) newErrors.confirmInfo = error;
      } else if (key in validators) {
        const validator = validators[key as keyof typeof validators] as (value: string) => string;
        const error = validator(formData[key as keyof BookingFormData] as string);
        if (error) newErrors[key as keyof ValidationErrors] = error;
      }
    });

    if (field) {
      setErrors(prev => ({ ...prev, ...newErrors }));
    } else {
      setErrors(newErrors);
    }

    return Object.keys(newErrors).length === 0;
  }, [formData, validators]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    setErrors(prev => ({ ...prev, [name]: undefined }));
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    validate(e.target.name);
  }, [validate]);

  const modelVariants = useMemo(() => {
    if (!formData.model) return [];
    const selectedVehicle = vehicles.find(v => v.vehicleId.toString() === formData.model);
    if (!selectedVehicle) return [];
    return [{ color: selectedVehicle.color, version: selectedVehicle.version }];
  }, [formData.model, vehicles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      console.log('Validation failed:', errors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Parse time to hour and minute
      const [hours, minutes] = formData.time.split(':').map(Number);
      
      await bookTestDrive({
        fullName: formData.name,
        phone: formData.phone.replace(/[\s\-]/g, ''),
        email: formData.email || '',
        idCardNo: formData.citizenId.replace(/[\s\-\.]/g, ''),
        dealerId: 1, // Using default dealer ID, TODO: map dealer string to ID
        vehicleId: parseInt(formData.model),
        date: formData.date,
        hour: hours,
        minute: minutes,
        note: formData.note || '',
        agreePolicy: formData.confirmInfo
      });

      setIsSuccessModalOpen(true);
      
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
      
    } catch (error) {
      console.error('Error booking test drive:', error);
      if (error instanceof TestDriveApiError) {
        setSubmitError(error.message);
      } else {
        setSubmitError('Đã xảy ra lỗi. Vui lòng thử lại sau.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSuccess = () => {
    setIsSuccessModalOpen(false);
    navigate('/');
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <>
      <div className={styles.wrap}>
        <div className={styles.container}>
          {/* Hero Section */}
          <div className={styles.hero}>
            <div className={styles.heroContent}>
              <div className={styles.badge}>
                <i className="fas fa-car"></i>
                <span>Trải nghiệm lái thử miễn phí</span>
              </div>
              <h1 className={styles.heroTitle}>
                Đăng ký <span className={styles.highlight}>Lái thử</span> E-Drive
              </h1>
              <p className={styles.heroSubtitle}>
                Trải nghiệm cảm giác lái xe điện thế hệ mới. Đặt lịch ngay hôm nay và khám phá sức mạnh của công nghệ xanh!
              </p>
              
              <div className={styles.features}>
                <div className={styles.feature}>
                  <div className={styles.featureIcon}>
                    <i className="fas fa-clock"></i>
                  </div>
                  <div className={styles.featureContent}>
                    <h3>Thời gian linh hoạt</h3>
                    <p>Chọn lịch phù hợp</p>
                  </div>
                </div>
                <div className={styles.feature}>
                  <div className={styles.featureIcon}>
                    <i className="fas fa-user-tie"></i>
                  </div>
                  <div className={styles.featureContent}>
                    <h3>Hỗ trợ chuyên nghiệp</h3>
                    <p>Tư vấn nhiệt tình</p>
                  </div>
                </div>
                <div className={styles.feature}>
                  <div className={styles.featureIcon}>
                    <i className="fas fa-shield-alt"></i>
                  </div>
                  <div className={styles.featureContent}>
                    <h3>An toàn tuyệt đối</h3>
                    <p>Bảo hiểm toàn diện</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className={styles.formSection}>
            <div className={styles.formHeader}>
              <h2>Thông tin đặt lịch</h2>
              <p>Vui lòng điền đầy đủ thông tin để chúng tôi phục vụ bạn tốt nhất</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              {submitError && (
                <div className={styles.errorBanner}>
                  <i className="fas fa-exclamation-circle"></i>
                  <span>{submitError}</span>
                </div>
              )}

              {/* Personal Information */}
              <div className={styles.formGroup}>
                <h3 className={styles.sectionTitle}>
                  <i className="fas fa-user"></i>
                  Thông tin cá nhân
                </h3>
                
                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label htmlFor="name">
                      Họ và tên <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.inputWrapper}>
                      <i className={`fas fa-user ${styles.inputIcon}`}></i>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={errors.name ? styles.error : ''}
                        placeholder="Nguyễn Văn A"
                        style={{ paddingLeft: '2.75rem' }}
                      />
                    </div>
                    {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                  </div>

                  <div className={styles.formField}>
                    <label htmlFor="phone">
                      Số điện thoại <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.inputWrapper}>
                      <i className={`fas fa-phone ${styles.inputIcon}`}></i>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={errors.phone ? styles.error : ''}
                        placeholder="0901234567"
                        style={{ paddingLeft: '2.75rem' }}
                      />
                    </div>
                    {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label htmlFor="email">Email</label>
                    <div className={styles.inputWrapper}>
                      <i className={`fas fa-envelope ${styles.inputIcon}`}></i>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={errors.email ? styles.error : ''}
                        placeholder="email@example.com"
                        style={{ paddingLeft: '2.75rem' }}
                      />
                    </div>
                    {errors.email && <span className={styles.errorText}>{errors.email}</span>}
                  </div>

                  <div className={styles.formField}>
                    <label htmlFor="citizenId">
                      Căn cước công dân <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.inputWrapper}>
                      <i className={`fas fa-id-card ${styles.inputIcon}`}></i>
                      <input
                        type="text"
                        id="citizenId"
                        name="citizenId"
                        value={formData.citizenId}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={errors.citizenId ? styles.error : ''}
                        placeholder="001234567890"
                        style={{ paddingLeft: '2.75rem' }}
                      />
                    </div>
                    {errors.citizenId && <span className={styles.errorText}>{errors.citizenId}</span>}
                  </div>
                </div>
              </div>

              {/* Vehicle Selection */}
              <div className={styles.formGroup}>
                <h3 className={styles.sectionTitle}>
                  <i className="fas fa-car"></i>
                  Chọn xe
                </h3>

                {vehicleError && (
                  <div className={styles.warningBanner}>
                    <i className="fas fa-exclamation-triangle"></i>
                    <span>{vehicleError}</span>
                  </div>
                )}

                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label htmlFor="model">
                      Mẫu xe <span className={styles.required}>*</span>
                    </label>
                    <select
                      id="model"
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={errors.model ? styles.error : ''}
                      disabled={loadingVehicles}
                    >
                      <option value="">
                        {loadingVehicles ? 'Đang tải...' : 'Chọn mẫu xe'}
                      </option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle.vehicleId} value={vehicle.vehicleId}>
                          {vehicle.modelName} {vehicle.version}
                        </option>
                      ))}
                    </select>
                    {errors.model && <span className={styles.errorText}>{errors.model}</span>}
                  </div>

                  <div className={styles.formField}>
                    <label htmlFor="variant">
                      Màu sắc <span className={styles.required}>*</span>
                    </label>
                    <select
                      id="variant"
                      name="variant"
                      value={formData.variant}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={errors.variant ? styles.error : ''}
                      disabled={!formData.model || modelVariants.length === 0}
                    >
                      <option value="">Chọn màu sắc</option>
                      {modelVariants.map((variant, index) => (
                        <option key={index} value={variant.color}>
                          {variant.color}
                        </option>
                      ))}
                    </select>
                    {errors.variant && <span className={styles.errorText}>{errors.variant}</span>}
                  </div>
                </div>
              </div>

              {/* Appointment Details */}
              <div className={styles.formGroup}>
                <h3 className={styles.sectionTitle}>
                  <i className="fas fa-calendar-alt"></i>
                  Thông tin lịch hẹn
                </h3>

                <div className={styles.formField}>
                  <label htmlFor="dealer">
                    Đại lý <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="dealer"
                    name="dealer"
                    value={formData.dealer}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={errors.dealer ? styles.error : ''}
                  >
                    <option value="">Chọn đại lý</option>
                    {DEALERS.map((dealer, index) => (
                      <option key={index} value={dealer}>
                        {dealer}
                      </option>
                    ))}
                  </select>
                  {errors.dealer && <span className={styles.errorText}>{errors.dealer}</span>}
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label htmlFor="date">
                      Ngày hẹn <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={errors.date ? styles.error : ''}
                      min={getTodayDate()}
                    />
                    {errors.date && <span className={styles.errorText}>{errors.date}</span>}
                  </div>

                  <div className={styles.formField}>
                    <label htmlFor="time">
                      Giờ hẹn <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.timeSelector}>
                      <select
                        id="hour"
                        value={selectedHour}
                        onChange={handleHourChange}
                        className={styles.timeInput}
                      >
                        {Array.from({ length: 10 }, (_, i) => i + 8).map(hour => (
                          <option key={hour} value={hour}>
                            {hour.toString().padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                      <span className={styles.timeSeparator}>:</span>
                      <select
                        id="minute"
                        value={selectedMinute}
                        onChange={handleMinuteChange}
                        className={styles.timeInput}
                      >
                        {[0, 15, 30, 45].map(minute => (
                          <option key={minute} value={minute}>
                            {minute.toString().padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.time && <span className={styles.errorText}>{errors.time}</span>}
                    <p className={styles.helpText}>
                      <i className="fas fa-info-circle"></i>
                      Giờ làm việc: 08:00 - 17:00 (Thứ 2 - Thứ 7)
                    </p>
                  </div>
                </div>

                <div className={styles.formField}>
                  <label htmlFor="note">Ghi chú</label>
                  <textarea
                    id="note"
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Thông tin thêm về yêu cầu của bạn..."
                  />
                </div>
              </div>

              {/* Confirmation */}
              <div className={styles.formGroup}>
                <div className={styles.checkbox}>
                  <input
                    type="checkbox"
                    id="confirmInfo"
                    name="confirmInfo"
                    checked={formData.confirmInfo}
                    onChange={handleChange}
                  />
                  <label htmlFor="confirmInfo">
                    Tôi xác nhận rằng tất cả thông tin trên là chính xác và đồng ý với{' '}
                    <a href="/terms" target="_blank" rel="noopener noreferrer">
                      điều khoản sử dụng
                    </a>
                  </label>
                </div>
                {errors.confirmInfo && <span className={styles.errorText}>{errors.confirmInfo}</span>}
              </div>

              {/* Submit Buttons */}
              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => navigate(-1)}
                  disabled={isSubmitting}
                >
                  <i className="fas fa-arrow-left"></i>
                  Quay lại
                </button>
                <button
                  type="submit"
                  className={styles.primaryButton}
                  disabled={isSubmitting || loadingVehicles}
                >
                  {isSubmitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane"></i>
                      Đặt lịch ngay
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={handleCloseSuccess}
        title="Đặt lịch thành công!"
        message="Chúng tôi đã nhận được yêu cầu lái thử của bạn. Đội ngũ của chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất."
      />
      
      <Footer />
    </>
  );
};

export default TestDrivePage;
