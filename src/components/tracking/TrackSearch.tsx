import { useState } from "react";
import styles from "../../styles/TrackingStyles/TrackSearch.module.scss";

interface TrackSearchProps {
  onSearchByCode: (code: string) => void;
  onSearchByPhone: (phone: string, otp: string) => void;
  onSendOtp: (phone: string) => Promise<void>;
  loading?: boolean;
}

export default function TrackSearch({ onSearchByCode, onSearchByPhone, onSendOtp, loading }: TrackSearchProps) {
  const [activeTab, setActiveTab] = useState<"code" | "phone">("code");
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  const phoneRegex = /(0|\+84)\d{9,10}/;

  const handleSearchByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      onSearchByCode(code.trim());
    }
  };

  const handleSendOtp = async () => {
    if (!phoneRegex.test(phone)) {
      alert("Vui lòng nhập đúng định dạng số điện thoại Việt Nam");
      return;
    }
    setSendingOtp(true);
    try {
      await onSendOtp(phone);
      setOtpSent(true);
    } catch (error) {
      console.error("Failed to send OTP:", error);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone && otp) {
      onSearchByPhone(phone, otp);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Tra cứu tình trạng giao xe</h2>
        <p className={styles.subtitle}>Nhập mã đơn hàng hoặc xác thực bằng số điện thoại</p>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "code" ? styles.active : ""}`}
          onClick={() => setActiveTab("code")}
          disabled={loading}
        >
          <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
          </svg>
          Mã đơn hàng
        </button>
        <button
          className={`${styles.tab} ${activeTab === "phone" ? styles.active : ""}`}
          onClick={() => {
            setActiveTab("phone");
            setOtpSent(false);
            setOtp("");
          }}
          disabled={loading}
        >
          <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Số điện thoại
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === "code" ? (
          <form onSubmit={handleSearchByCode} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="orderCode" className={styles.label}>
                Mã đơn hàng
              </label>
              <input
                id="orderCode"
                type="text"
                className={styles.input}
                placeholder="SO-202501-0001"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={loading}
                autoComplete="off"
              />
              <span className={styles.hint}>Định dạng: SO-YYYYMM-XXXX</span>
            </div>
            <button type="submit" className={styles.submitBtn} disabled={loading || !code.trim()}>
              {loading ? (
                <>
                  <span className={styles.spinner}></span>
                  Đang tra cứu...
                </>
              ) : (
                <>
                  <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Tra cứu
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="phone" className={styles.label}>
                Số điện thoại
              </label>
              <div className={styles.phoneInput}>
                <input
                  id="phone"
                  type="tel"
                  className={styles.input}
                  placeholder="0912345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading || otpSent}
                  autoComplete="tel"
                />
                <button
                  type="button"
                  className={styles.otpBtn}
                  onClick={handleSendOtp}
                  disabled={loading || sendingOtp || otpSent || !phoneRegex.test(phone)}
                >
                  {sendingOtp ? "Đang gửi..." : otpSent ? "Đã gửi" : "Gửi OTP"}
                </button>
              </div>
            </div>

            {otpSent && (
              <div className={styles.inputGroup}>
                <label htmlFor="otp" className={styles.label}>
                  Mã OTP
                </label>
                <input
                  id="otp"
                  type="text"
                  className={styles.input}
                  placeholder="Nhập mã 6 chữ số"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  disabled={loading}
                  autoComplete="one-time-code"
                  maxLength={6}
                />
                <span className={styles.warning}>
                  <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Không chia sẻ mã OTP cho bất kỳ ai
                </span>
              </div>
            )}

            {otpSent && (
              <button type="submit" className={styles.submitBtn} disabled={loading || !otp || otp.length < 6}>
                {loading ? (
                  <>
                    <span className={styles.spinner}></span>
                    Đang xác thực...
                  </>
                ) : (
                  <>
                    <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Xác thực
                  </>
                )}
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
