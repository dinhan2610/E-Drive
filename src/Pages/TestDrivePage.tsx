import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SuccessModal } from "../components/SuccessModal";
import { fetchVehiclesFromApi } from "../services/vehicleApi";
import { createTestDrive, TestDriveApiError } from "../services/testDriveApi";
import { listCustomers } from "../services/customersApi";
import { getProfile } from "../services/profileApi";
import type { VehicleApiResponse } from "../types/product";
import type { Customer } from "../types/customer";
import styles from "../styles/TestDriveStyles/TestDrivePage.module.scss";

interface GroupedModel {
  modelName: string;
  version: string;
  colors: Array<{
    vehicleId: number;
    color: string;
    imageUrl?: string;
    inStock: boolean;
  }>;
}

interface BookingFormData {
  customerId: string; // ID của khách hàng được chọn từ dropdown
  model: string; // modelName + version
  variant: string; // vehicleId của màu được chọn
  date: string;
  time: string;
  note: string;
  confirmInfo: boolean;
}

interface ValidationErrors {
  customerId?: string;
  model?: string;
  variant?: string;
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
  const [groupedModels, setGroupedModels] = useState<GroupedModel[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [vehicleError, setVehicleError] = useState<string | null>(null);
  
  // Customers data from API
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customersError, setCustomersError] = useState<string | null>(null);
  
  // Current logged-in dealer ID and name
  const [currentDealerId, setCurrentDealerId] = useState<number | null>(null);
  const [currentDealerName, setCurrentDealerName] = useState<string>('');
  
  // Fetch vehicles and dealers on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          const profile = await getProfile();
          if (profile.dealerId) {
            setCurrentDealerId(profile.dealerId);
            setCurrentDealerName(profile.agencyName || 'Đại lý');
          }
        }
      } catch (error) {
      }
    };
    
    const loadVehicles = async () => {
      setLoadingVehicles(true);
      setVehicleError(null);
      try {
        const result = await fetchVehiclesFromApi({ status: 'AVAILABLE' });
        
        // Group vehicles theo modelName + version
        const grouped = new Map<string, VehicleApiResponse[]>();
        result.vehicles.forEach(vehicle => {
          const key = `${vehicle.modelName}|||${vehicle.version}`;
          if (!grouped.has(key)) {
            grouped.set(key, []);
          }
          grouped.get(key)!.push(vehicle);
        });
        
        // Convert sang GroupedModel array
        const models: GroupedModel[] = [];
        grouped.forEach((vehicleGroup, key) => {
          const [modelName, version] = key.split('|||');
          models.push({
            modelName,
            version,
            colors: vehicleGroup.map(v => ({
              vehicleId: v.vehicleId,
              color: v.color,
              imageUrl: v.imageUrl,
              inStock: v.status === 'AVAILABLE'
            }))
          });
        });
        
        setGroupedModels(models);
      } catch (error) {
        console.error('Error loading vehicles:', error);
        setVehicleError('Không thể tải danh sách xe. Vui lòng thử lại.');
      } finally {
        setLoadingVehicles(false);
      }
    };
    
    loadProfile();
    loadVehicles();
  }, []);
  
  // Load customers when dealerId is available
  useEffect(() => {
    if (currentDealerId) {
      const loadCustomers = async () => {
        setLoadingCustomers(true);
        setCustomersError(null);
        try {
          const result = await listCustomers(currentDealerId, {});
          setCustomers(result.data || []);
        } catch (error) {
          console.error('Error loading customers:', error);
          setCustomersError('Không thể tải danh sách khách hàng.');
        } finally {
          setLoadingCustomers(false);
        }
      };
      loadCustomers();
    }
  }, [currentDealerId]);
  
  const [selectedHour, setSelectedHour] = useState<number>(9);
  const [selectedMinute, setSelectedMinute] = useState<number>(0);

  const [formData, setFormData] = useState<BookingFormData>({
    customerId: "",
    model: "",
    variant: "",
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
    customerId: (value: string): string => !value ? "Vui lòng chọn khách hàng" : "",
    model: (value: string): string => !value ? "Vui lòng chọn mẫu xe" : "",
    variant: (value: string): string => !value ? "Vui lòng chọn màu sắc" : "",
    date: (value: string): string => {
      if (!value) return "Ngày hẹn là bắt buộc";
      
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Kiểm tra ngày trong quá khứ
      if (selectedDate < today) return "Ngày hẹn không thể là ngày trong quá khứ";
      
      // Kiểm tra ngày trong tuần (0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7)
      const dayOfWeek = selectedDate.getDay();
      if (dayOfWeek === 0) {
        return "Chỉ được đăng ký từ Thứ 2 đến Thứ 7 (không làm việc Chủ nhật)";
      }
      
      return "";
    },
    time: (value: string, dateValue?: string): string => {
      if (!value) return "Giờ hẹn là bắt buộc";
      
      if (!dateValue) return "Vui lòng chọn ngày trước";
      
      // Kiểm tra lại ngày có hợp lệ không
      const selectedDate = new Date(dateValue);
      const dayOfWeek = selectedDate.getDay();
      if (dayOfWeek === 0) {
        return "Chỉ được đăng ký từ Thứ 2 đến Thứ 7";
      }
      
      // Kiểm tra giờ trong khoảng 08:00 - 17:00
      const [hours, minutes] = value.split(':').map(Number);
      if (hours < 8 || hours >= 17) {
        return "Giờ làm việc: 08:00 - 17:00 (Thứ 2 - Thứ 7)";
      }
      
      // Kiểm tra nếu chọn ngày hôm nay, giờ phải sau giờ hiện tại
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate.getTime() === today.getTime()) {
        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        
        if (hours < currentHours || (hours === currentHours && minutes <= currentMinutes)) {
          return "Giờ hẹn phải sau giờ hiện tại";
        }
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
      [name]: type === 'checkbox' ? checked : value,
      // Reset màu khi chọn model mới
      ...(name === 'model' ? { variant: '' } : {})
    }));

    setErrors(prev => ({ ...prev, [name]: undefined }));
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    validate(e.target.name);
  }, [validate]);

  const modelVariants = useMemo(() => {
    if (!formData.model) return [];
    const selectedModel = groupedModels.find(m => `${m.modelName}|||${m.version}` === formData.model);
    if (!selectedModel) return [];
    return selectedModel.colors;
  }, [formData.model, groupedModels]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if dealer is logged in
    if (!currentDealerId) {
      setSubmitError('⚠️ Vui lòng đăng nhập với tài khoản đại lý để đăng ký lái thử!');
      return;
    }
    
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      
      const scheduleDatetime = `${formData.date}T${formData.time}:00`;
      const vehicleId = parseInt(formData.variant);
      
      // Lấy thông tin khách hàng đã chọn
      const selectedCustomer = customers.find(c => c.customerId.toString() === formData.customerId);
      
      // Tạo note với thông tin khách hàng
      const customerNote = selectedCustomer ? `
=== THÔNG TIN KHÁCH HÀNG ===
Mã KH: ${selectedCustomer.customerId}
Họ tên: ${selectedCustomer.fullName}
Số điện thoại: ${selectedCustomer.phone}
Email: ${selectedCustomer.email || 'Không cung cấp'}
CCCD: ${selectedCustomer.idCardNo || 'Không cung cấp'}
${formData.note ? `\nGhi chú thêm: ${formData.note}` : ''}
      `.trim() : formData.note;
      
      const testDrivePayload = {
        customerId: parseInt(formData.customerId),
        dealerId: currentDealerId,
        vehicleId: vehicleId,
        scheduleDatetime,
        status: 'PENDING' as const,
        note: customerNote
      };
      
      await createTestDrive(testDrivePayload);

      // Trigger notification reload
      window.dispatchEvent(new Event('testDriveCreated'));

      setIsSuccessModalOpen(true);
      
      // Reset form
      setFormData({
        customerId: "",
        model: "",
        variant: "",
        date: "",
        time: "",
        note: "",
        confirmInfo: false
      });
      setErrors({});
      
    } catch (error) {
      console.error('❌ Error during test drive booking:', error);
      
      if (error instanceof TestDriveApiError) {
        setSubmitError(`Lỗi đăng ký lái thử: ${error.message}`);
      } else {
        setSubmitError('Đã xảy ra lỗi. Vui lòng kiểm tra thông tin và thử lại.');
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
            {!currentDealerId && (
              <div style={{
                background: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '8px',
                padding: '12px 16px',
                marginTop: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#856404'
              }}>
                <i className="fas fa-exclamation-triangle" style={{ fontSize: '20px' }}></i>
                <span>⚠️ Bạn cần đăng nhập với tài khoản đại lý để có thể đăng ký lái thử!</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              {submitError && (
                <div className={styles.errorBanner}>
                  <i className="fas fa-exclamation-circle"></i>
                  <span>{submitError}</span>
                </div>
              )}

              {/* Customer Selection */}
              <div className={styles.formGroup}>
                <h3 className={styles.sectionTitle}>
                  <i className="fas fa-user"></i>
                  Chọn khách hàng
                  {customers.length > 0 && (
                    <span className={styles.countBadge}>
                      {customers.length} khách hàng
                    </span>
                  )}
                </h3>
                
                {customersError && (
                  <div className={styles.warningBanner}>
                    <i className="fas fa-exclamation-triangle"></i>
                    <span>{customersError}</span>
                  </div>
                )}
                
                <div className={styles.formRow}>
                  <div className={styles.formField} style={{ width: '100%' }}>
                    <label htmlFor="customerId">
                      Khách hàng <span className={styles.required}>*</span>
                      {loadingCustomers && (
                        <span style={{ 
                          marginLeft: '0.5rem', 
                          fontSize: '0.875rem', 
                          color: '#64748b',
                          fontWeight: 'normal'
                        }}>
                          <i className="fas fa-spinner fa-spin"></i> Đang tải...
                        </span>
                      )}
                    </label>
                    <div className={styles.customerSelectWrapper}>
                      <div className={styles.inputWrapper}>
                        <i className={`fas fa-user-circle ${styles.inputIcon}`}></i>
                        <select
                          id="customerId"
                          name="customerId"
                          value={formData.customerId}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className={errors.customerId ? styles.error : ''}
                          disabled={loadingCustomers || !customers.length}
                          style={{ paddingLeft: '2.75rem' }}
                        >
                          <option value="">
                            {loadingCustomers ? 'Đang tải khách hàng...' : 
                             !customers.length ? 'Không có khách hàng nào' : 
                             'Chọn khách hàng'}
                          </option>
                          {customers.map((customer) => (
                            <option key={customer.customerId} value={customer.customerId}>
                              {customer.fullName} - {customer.phone} {customer.email ? `(${customer.email})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {errors.customerId && <span className={styles.errorText}>{errors.customerId}</span>}
                    
                    {/* Customer Info Preview */}
                    {formData.customerId && (() => {
                      const selected = customers.find(c => c.customerId.toString() === formData.customerId);
                      return selected ? (
                        <div className={styles.customerInfoPreview}>
                          <div className={styles.previewHeader}>
                            <i className="fas fa-info-circle"></i>
                            <span>Thông tin khách hàng</span>
                          </div>
                          <div className={styles.previewBody}>
                            <div className={styles.infoRow}>
                              <div className={styles.infoItem}>
                                <i className="fas fa-user"></i>
                                <div className={styles.infoContent}>
                                  <span className={styles.infoLabel}>Họ tên:</span>
                                  <span className={styles.infoValue}>{selected.fullName}</span>
                                </div>
                              </div>
                              <div className={styles.infoItem}>
                                <i className="fas fa-phone"></i>
                                <div className={styles.infoContent}>
                                  <span className={styles.infoLabel}>SĐT:</span>
                                  <span className={styles.infoValue}>{selected.phone}</span>
                                </div>
                              </div>
                            </div>
                            {(selected.email || selected.idCardNo) && (
                              <div className={styles.infoRow}>
                                {selected.email && (
                                  <div className={styles.infoItem}>
                                    <i className="fas fa-envelope"></i>
                                    <div className={styles.infoContent}>
                                      <span className={styles.infoLabel}>Email:</span>
                                      <span className={styles.infoValue}>{selected.email}</span>
                                    </div>
                                  </div>
                                )}
                                {selected.idCardNo && (
                                  <div className={styles.infoItem}>
                                    <i className="fas fa-id-card"></i>
                                    <div className={styles.infoContent}>
                                      <span className={styles.infoLabel}>CCCD:</span>
                                      <span className={styles.infoValue}>{selected.idCardNo}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            {selected.address && (
                              <div className={styles.infoRow}>
                                <div className={styles.infoItem} style={{ flex: 1 }}>
                                  <i className="fas fa-map-marker-alt"></i>
                                  <div className={styles.infoContent}>
                                    <span className={styles.infoLabel}>Địa chỉ:</span>
                                    <span className={styles.infoValue}>{selected.address}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null;
                    })()}
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
                      {groupedModels.map((model, index) => (
                        <option key={index} value={`${model.modelName}|||${model.version}`}>
                          {model.modelName} {model.version}
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
                      <option value="">
                        {!formData.model ? 'Chọn mẫu xe trước' : 'Chọn màu sắc'}
                      </option>
                      {modelVariants.map((variant) => (
                        <option key={variant.vehicleId} value={variant.vehicleId.toString()}>
                          {variant.color} {variant.inStock ? '' : '(Hết hàng)'}
                        </option>
                      ))}
                    </select>
                    {errors.variant && <span className={styles.errorText}>{errors.variant}</span>}
                  </div>
                </div>
              </div>

              {/* Appointment Details */}
              <div className={`${styles.formGroup} ${styles.appointmentGroup}`}>
                <h3 className={styles.sectionTitle}>
                  <i className="fas fa-calendar-alt"></i>
                  Thông tin lịch hẹn
                </h3>

                <div className={styles.formField}>
                  <label htmlFor="dealer">
                    Đại lý <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.inputWrapper}>
                    <i className={`fas fa-store ${styles.inputIcon}`}></i>
                    <input
                      type="text"
                      id="dealer"
                      name="dealer"
                      value={currentDealerName || 'Chưa đăng nhập'}
                      readOnly
                      className={!currentDealerId ? styles.error : ''}
                      placeholder="Vui lòng đăng nhập"
                      style={{ 
                        paddingLeft: '2.75rem',
                        backgroundColor: '#f5f5f5',
                        cursor: 'not-allowed'
                      }}
                    />
                  </div>
                  {!currentDealerId && (
                    <span className={styles.errorText}>
                      Vui lòng đăng nhập với tài khoản đại lý
                    </span>
                  )}
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

      {/* Success Modal */}
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={handleCloseSuccess}
        type="success"
        title="Đặt lịch lái thử thành công!"
        message="Cảm ơn bạn đã đăng ký lái thử xe điện E-Drive. Chúng tôi sẽ liên hệ với bạn để xác nhận lịch hẹn trong thời gian sớm nhất!"
      />
      
      
    </>
  );
};

export default TestDrivePage;
