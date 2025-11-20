import React, { useState } from 'react';
import type { VehicleApiResponse } from '../types/product';
import { calc0Percent, type FinancingTerm } from '../utils/financing';
import CarPicker from '../components/financing/CarPicker';
import TermSelector from '../components/financing/TermSelector';
import DownPaymentInput from '../components/financing/DownPaymentInput';
import SummaryCard from '../components/financing/SummaryCard';
import ScheduleTable from '../components/financing/ScheduleTable';
import ExportButtons from '../components/financing/ExportButtons';
import styles from './FinancingPage.module.scss';

const FinancingPage: React.FC = () => {
  const [selectedCar, setSelectedCar] = useState<VehicleApiResponse | null>(null);
  const [downPayment, setDownPayment] = useState(30);
  const [selectedTerm, setSelectedTerm] = useState<FinancingTerm>(12);
  const [calculationResult, setCalculationResult] = useState<ReturnType<typeof calc0Percent> | null>(null);

  const handleCalculate = () => {
    if (!selectedCar) {
      alert('⚠️ Vui lòng chọn mẫu xe trước khi tính toán');
      return;
    }

    const carPriceVND = selectedCar.priceRetail;

    const result = calc0Percent({
      price: carPriceVND,
      downIsPercent: true,
      downPercent: downPayment,
      fees: 0,
      months: selectedTerm,
    });

    setCalculationResult(result);
  };

  const handleConsult = () => {
    if (!selectedCar) {
      alert('⚠️ Vui lòng chọn mẫu xe trước khi gửi yêu cầu tư vấn');
      return;
    }

    const monthlyPayment = calculationResult ? `\n- Trả hàng tháng: ${calculationResult.monthly.toLocaleString('vi-VN')} VND` : '';
    const message = `Yêu cầu tư vấn trả góp cho xe ${selectedCar.modelName} ${selectedCar.version}\n` +
      `- Kỳ hạn: ${selectedTerm} tháng\n` +
      `- Trả trước: ${downPayment}%` +
      monthlyPayment;
      monthlyPayment;

    console.log('Consultation request:', message);
    alert('✅ Yêu cầu tư vấn đã được gửi!\n\nĐội ngũ tư vấn sẽ liên hệ với bạn trong thời gian sớm nhất.');
  };

  const isFormValid = selectedCar !== null;

  return (
    <div className={styles.financingPage}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>
              Trả góp 0% lãi suất
            </h1>
            <p className={styles.heroSubtitle}>
              Chọn mẫu xe yêu thích, kỳ hạn phù hợp và xem ngay số tiền trả hằng tháng
            </p>
            <div className={styles.heroFeatures}>
              <div className={styles.feature}>
                <i className="fas fa-check-circle"></i>
                <span>Lãi suất 0%</span>
              </div>
              <div className={styles.feature}>
                <i className="fas fa-check-circle"></i>
                <span>Thủ tục đơn giản</span>
              </div>
              <div className={styles.feature}>
                <i className="fas fa-check-circle"></i>
                <span>Duyệt nhanh 24h</span>
              </div>
            </div>
            
            {/* Disclaimer */}
            <div className={styles.disclaimer}>
              <div className={styles.disclaimerIcon}>
                <i className="fas fa-info-circle"></i>
              </div>
              <div className={styles.disclaimerContent}>
                <p className={styles.disclaimerTitle}>
                  <strong>Lưu ý quan trọng:</strong>
                </p>
                <p className={styles.disclaimerText}>
                  Đây là công cụ tính toán dự kiến nhằm mục đích tham khảo. 
                  Giá xe hiển thị là <strong>giá niêm yết chưa bao gồm thuế, phí trước bạ, phí đăng ký, bảo hiểm và các chi phí phát sinh khác</strong>.
                  Số tiền thực tế có thể thay đổi tùy thuộc vào chương trình khuyến mãi, chính sách của ngân hàng và điều kiện cá nhân. 
                  Vui lòng liên hệ showroom để được tư vấn chi tiết và chính xác nhất.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className={styles.container}>
        <div className={styles.grid}>
          {/* Left Column - Form */}
          <div className={styles.formColumn}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>
                <i className="fas fa-edit"></i>
                Thông tin trả góp
              </h2>

              <CarPicker
                value={selectedCar || undefined}
                onChange={setSelectedCar}
              />

              {selectedCar && (
                <>
                  {/* Price Info Notice */}
                  <div className={styles.priceNotice}>
                    <div className={styles.noticeHeader}>
                      <i className="fas fa-tag"></i>
                      <span>Thông tin giá xe</span>
                    </div>
                    <div className={styles.noticeBody}>
                      <div className={styles.priceRow}>
                        <span>Giá niêm yết:</span>
                        <strong>{selectedCar.priceRetail.toLocaleString('vi-VN')} VND</strong>
                      </div>
                      <div className={styles.noticeFooter}>
                        <i className="fas fa-exclamation-triangle"></i>
                        <small>
                          Giá chưa bao gồm: Thuế GTGT (10%),  
                          Bảo hiểm TNDS, Phí dịch vụ đăng kiểm và các chi phí phát sinh khác
                        </small>
                      </div>
                    </div>
                  </div>

                  <DownPaymentInput
                    carPrice={selectedCar.priceRetail}
                    value={downPayment}
                    onValueChange={setDownPayment}
                  />

                  <TermSelector
                    value={selectedTerm}
                    onChange={setSelectedTerm}
                  />
                </>
              )}

              <button
                type="button"
                className={styles.calculateButton}
                onClick={handleCalculate}
                disabled={!isFormValid}
              >
                <i className="fas fa-calculator"></i>
                Tính toán ngay
              </button>

              {/* Calculation Disclaimer */}
              {!calculationResult && isFormValid && (
                <div className={styles.calculationNote}>
                  <i className="fas fa-lightbulb"></i>
                  <p>
                    Kết quả tính toán mang tính chất tham khảo. 
                    Để được tư vấn chi tiết về gói trả góp phù hợp, vui lòng nhấn "Tư vấn ngay" sau khi tính toán.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Results */}
          <div className={styles.resultColumn}>
            {calculationResult && selectedCar ? (
              <div>
                <SummaryCard
                  carName={`${selectedCar.modelName} ${selectedCar.version}`}
                  result={calculationResult}
                  months={selectedTerm}
                />

                <ScheduleTable schedule={calculationResult.schedule} />

                <ExportButtons
                  carName={`${selectedCar.modelName} ${selectedCar.version}`}
                  carData={{
                    modelName: selectedCar.modelName,
                    version: selectedCar.version,
                    priceRetail: selectedCar.priceRetail
                  }}
                  calculationData={{
                    downPayment: calculationResult.dp,
                    loanAmount: calculationResult.loanAmount,
                    monthlyPayment: calculationResult.monthly,
                    term: selectedTerm,
                    totalPayment: calculationResult.totalPayable,
                    schedule: calculationResult.schedule.map(item => ({
                      month: item.period,
                      payment: item.monthly,
                      principal: item.monthly,
                      interest: 0,
                      balance: item.remaining
                    }))
                  }}
                  onConsult={handleConsult}
                />

                {/* Important Notice After Calculation */}
                <div className={styles.importantNotice}>
                  <div className={styles.noticeIcon}>
                    <i className="fas fa-shield-alt"></i>
                  </div>
                  <div className={styles.noticeContent}>
                    <h4>Lưu ý quan trọng</h4>
                    <ul>
                      <li>
                        <i className="fas fa-check"></i>
                        Kết quả tính toán trên dựa trên <strong>giá niêm yết chưa bao gồm thuế, phí</strong>
                      </li>
                      <li>
                        <i className="fas fa-check"></i>
                        Chi phí thực tế sẽ cao hơn do: Thuế GTGT 10%, Phí trước bạ ~10%, Phí đăng ký, Bảo hiểm
                      </li>
                      <li>
                        <i className="fas fa-check"></i>
                        Lãi suất 0% áp dụng theo chương trình và điều kiện của ngân hàng đối tác
                      </li>
                      <li>
                        <i className="fas fa-check"></i>
                        Số tiền trả góp hàng tháng có thể thay đổi tùy hồ sơ tín dụng và chính sách ngân hàng
                      </li>
                      <li>
                        <i className="fas fa-check"></i>
                        Vui lòng liên hệ showroom để được tư vấn chi tiết và báo giá chính xác nhất
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <i className="fas fa-calculator"></i>
                </div>
                <h3>Chưa có kết quả tính toán</h3>
                <p>Vui lòng chọn mẫu xe và nhấn "Tính toán ngay" để xem kết quả</p>
                <div className={styles.emptySteps}>
                  <div className={styles.step}>
                    <div className={styles.stepNumber}>1</div>
                    <span>Chọn mẫu xe</span>
                  </div>
                  <div className={styles.stepArrow}>
                    <i className="fas fa-arrow-right"></i>
                  </div>
                  <div className={styles.step}>
                    <div className={styles.stepNumber}>2</div>
                    <span>Nhập trả trước</span>
                  </div>
                  <div className={styles.stepArrow}>
                    <i className="fas fa-arrow-right"></i>
                  </div>
                  <div className={styles.step}>
                    <div className={styles.stepNumber}>3</div>
                    <span>Chọn kỳ hạn</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default FinancingPage;
