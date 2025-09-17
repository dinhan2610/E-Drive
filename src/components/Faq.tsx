import React, { useState } from "react";
import "../styles/FaqStyles/_faq.scss";
import FaqBg from "../images/faq/bg.png";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    id: "q1",
    question: "Xe điện E-Drive có gì đặc biệt so với xe truyền thống?",
    answer: "E-Drive mang lại trải nghiệm lái êm ái, tăng tốc mượt mà và thân thiện môi trường. Tiết kiệm chi phí nhiên liệu, giảm phát thải và tích hợp nhiều tiện ích thông minh. Hệ thống đại lý chính hãng cung cấp dịch vụ bảo hành, bảo dưỡng tận nơi."
  },
  {
    id: "q2",
    question: "Làm thế nào để đăng ký lái thử xe điện E-Drive?",
    answer: "Đăng ký trực tuyến trên website chính thức hoặc tại các đại lý chính hãng. Chỉ cần chọn mẫu xe, địa điểm và thời gian mong muốn. Theo dõi E-Drive trên mạng xã hội để cập nhật sự kiện lái thử và khuyến mãi."
  },
  {
    id: "q3",
    question: "Chính sách bảo hành của E-Drive như thế nào?",
    answer: "Bảo hành chính hãng toàn diện cho hệ thống pin và động cơ điện. Miễn phí kiểm tra, sửa chữa lỗi kỹ thuật. Dịch vụ bảo dưỡng định kỳ và hỗ trợ tận nơi, đảm bảo khách hàng yên tâm sử dụng."
  },
  {
    id: "q4",
    question: "Chi phí sạc pin xe điện có tốn kém không?",
    answer: "Chi phí sạc chỉ bằng 1/3 so với nhiên liệu xăng. Sạc tại nhà hoặc trạm sạc nhanh trên toàn quốc. Trung bình 100km chỉ tốn khoảng 30,000 VNĐ, tiết kiệm đáng kể cho khách hàng."
  },
  {
    id: "q5",
    question: "Có thể đặt mua xe điện E-Drive trực tuyến không?",
    answer: "Có thể đặt cọc và chọn mẫu xe trực tuyến. Đại lý sẽ liên hệ xác nhận đơn hàng và lên lịch bàn giao. Hoặc đến trực tiếp showroom để tư vấn chi tiết và trải nghiệm trước khi quyết định."
  },
  {
    id: "q6",
    question: "Mạng lưới trạm sạc có đủ rộng khắp không?",
    answer: "Hệ thống 500+ trạm sạc phủ sóng toàn quốc, tập trung tại các thành phố lớn, trung tâm thương mại, và tuyến cao tốc. Ứng dụng E-Drive giúp tìm trạm sạc gần nhất và theo dõi tình trạng sạc real-time."
  }
];

const Faq: React.FC = () => {
  const [activeQ, setActiveQ] = useState<string>("");

  const toggleQuestion = (id: string): void => {
    setActiveQ(activeQ === id ? "" : id);
  };

  return (
    <section className="faq-section" style={{ backgroundImage: `url(${FaqBg})` }}>
      <div className="container">
        {/* Hero Section */}
        <div className="faq-hero">
          <div className="hero-badge">
            <i className="fa-solid fa-circle-question"></i>
            <span>Câu hỏi thường gặp</span>
          </div>
          <h2 className="hero-title">
            Mọi thắc mắc về <span className="highlight">E-Drive</span>
          </h2>
          <p className="hero-description">
            Tìm câu trả lời cho những thắc mắc phổ biến về xe điện, dịch vụ và chính sách của E-Drive. 
            Chúng tôi cam kết mang đến thông tin minh bạch và hỗ trợ tận tình nhất.
          </p>
        </div>

        {/* FAQ Content */}
        <div className="faq-content">
          {FAQ_DATA.map((faq) => (
            <article 
              key={faq.id} 
              className={`faq-item ${activeQ === faq.id ? 'active' : ''}`}
            >
              <button
                className="faq-question"
                onClick={() => toggleQuestion(faq.id)}
                aria-expanded={activeQ === faq.id}
                aria-controls={`answer-${faq.id}`}
              >
                <span className="question-text">{faq.question}</span>
                <i className="fa-solid fa-chevron-down"></i>
              </button>
              
              <div 
                className="faq-answer"
                id={`answer-${faq.id}`}
                role="region"
                aria-labelledby={`question-${faq.id}`}
              >
                <div className="answer-content">
                  {faq.answer}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Faq;
