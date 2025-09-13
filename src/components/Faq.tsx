import React, { useState } from "react";
import "../styles/FaqStyles/_faq.scss";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    id: "q1",
    question: "1. Xe điện E-Drive có gì đặc biệt so với các dòng xe truyền thống?",
    answer: "Xe điện E-Drive mang lại trải nghiệm lái êm ái, tăng tốc mượt mà và thân thiện với môi trường nhờ công nghệ pin hiện đại. So với xe xăng truyền thống, bạn tiết kiệm chi phí nhiên liệu, giảm phát thải và có nhiều tiện ích thông minh tích hợp sẵn. Ngoài ra, hệ thống đại lý chính hãng E-Drive còn cung cấp dịch vụ bảo hành, bảo dưỡng và hỗ trợ tận nơi, giúp khách hàng an tâm trong suốt quá trình sử dụng."
  },
  {
    id: "q2",
    question: "2. Tôi có thể đăng ký lái thử xe điện E-Drive bằng cách nào?",
    answer: "Bạn có thể đăng ký lái thử trực tuyến ngay trên website chính thức của E-Drive, chỉ với vài thao tác đơn giản để chọn mẫu xe, địa điểm và thời gian mong muốn. Ngoài ra, các đại lý chính hãng trên toàn quốc luôn sẵn sàng hỗ trợ khách hàng đăng ký trực tiếp tại showroom. Để không bỏ lỡ trải nghiệm mới, hãy theo dõi E-Drive trên mạng xã hội hoặc đăng ký nhận bản tin qua email để cập nhật các sự kiện lái thử và chương trình khuyến mãi."
  },
  {
    id: "q3",
    question: "3. Chính sách bảo hành của E-Drive như thế nào?",
    answer: "Tất cả các mẫu xe E-Drive đều được áp dụng chính sách bảo hành chính hãng, bao gồm cả hệ thống pin và động cơ điện. Trong thời gian bảo hành, khách hàng được miễn phí kiểm tra, sửa chữa các lỗi kỹ thuật từ nhà sản xuất. Ngoài ra, E-Drive còn có dịch vụ bảo dưỡng định kỳ và hỗ trợ tận nơi, giúp khách hàng yên tâm sử dụng xe trong suốt quá trình vận hành."
  },
  {
    id: "q4",
    question: "4. Chi phí sạc pin xe điện E-Drive có tốn kém không?",
    answer: "Chi phí sạc pin xe điện thường thấp hơn nhiều so với việc sử dụng nhiên liệu xăng. Bạn có thể sạc xe tại nhà thông qua bộ sạc tiêu chuẩn hoặc tại các trạm sạc nhanh được E-Drive liên kết trên toàn quốc. Trung bình, chi phí sạc cho quãng đường 100km chỉ bằng 1/3 so với chi phí nhiên liệu của xe xăng, giúp tiết kiệm đáng kể cho khách hàng."
  },
  {
    id: "q5",
    question: "5. Tôi có thể đặt mua xe điện E-Drive trực tuyến không?",
    answer: "Có. Website chính thức của E-Drive cho phép bạn đặt cọc và lựa chọn mẫu xe, màu sắc, phiên bản mong muốn. Sau khi đặt, đại lý gần nhất sẽ liên hệ để xác nhận đơn hàng, hoàn tất thủ tục và lên lịch bàn giao xe. Ngoài ra, bạn cũng có thể đến trực tiếp đại lý để được tư vấn chi tiết và trải nghiệm xe trước khi quyết định."
  }
];

const Faq: React.FC = () => {
  const [activeQ, setActiveQ] = useState<string>("");

  const openQ = (id: string): void => {
    setActiveQ(activeQ === id ? "" : id);
  };

  const getClassAnswer = (id: string): string => {
    return activeQ === id ? "active-answer" : "";
  };

  const getClassQuestion = (id: string): string => {
    return activeQ === id ? "active-question" : "";
  };

  return (
    <>
      <section className="faq-section">
        <div className="container">
          <div className="faq-content">
            <div className="faq-content__title">
              <h2>FAQ – Câu hỏi thường gặp</h2>
              <p>
                Chúng tôi tổng hợp và giải đáp mọi câu hỏi liên quan đến sản phẩm, chính sách và dịch vụ của E-Drive. 
                Bạn có thể dễ dàng tìm thấy thông tin về xe điện, khuyến mãi, dịch vụ lái thử, cũng như bảo hành và hậu mãi, 
                để tự tin hơn khi lựa chọn đồng hành cùng E-Drive.
              </p>
            </div>

            <div className="all-questions">
              {FAQ_DATA.map((faq) => (
                <div key={faq.id} className="faq-box">
                  <div
                    onClick={() => openQ(faq.id)}
                    className={`faq-box__question ${getClassQuestion(faq.id)}`}
                  >
                    <p>{faq.question}</p>
                    <i className="fa-solid fa-angle-down"></i>
                  </div>
                  <div
                    className={`faq-box__answer ${getClassAnswer(faq.id)}`}
                  >
                    {faq.answer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Faq;
