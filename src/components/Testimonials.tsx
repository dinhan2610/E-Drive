import { FC } from 'react';
import Img2 from "../images/testimonials/pfp1.jpg";
import Img3 from "../images/testimonials/pfp2.jpg";

interface TestimonialProps {}

const Testimonials: FC<TestimonialProps> = () => {
  return (
    <>
      <section className="testimonials-section">
        <div className="container">
          <div className="testimonials-content">
            <div className="testimonials-content__title">
              <h4>Khách hàng nói gì về E-Drive</h4>
              <h2>Niềm tin tạo nên hành trình</h2>
              <p>
                Lắng nghe những chia sẻ chân thực từ khách hàng đã đồng hành cùng E-Drive. Họ không chỉ trải nghiệm công nghệ xe điện hiện đại mà còn tin tưởng vào dịch vụ tận tâm từ hệ thống đại lý chính hãng.
              </p>
            </div>

            <div className="all-testimonials">
              <div className="all-testimonials__box">
                <span className="quotes-icon">
                  <i className="fa-solid fa-quote-right"></i>
                </span>
                <p>
                  “Lần đầu tiên tôi lái thử xe điện E-Drive, cảm giác cực kỳ êm và mạnh mẽ. Đặc biệt là khả năng tăng tốc rất mượt, không tiếng ồn. Đây chắc chắn sẽ là chiếc xe tiếp theo của tôi.”
                </p>
                <div className="all-testimonials__box__name">
                  <div className="all-testimonials__box__name__profile">
                    <img src={Img2} alt="user_img" />
                    <span>
                      <h4>Anh Minh</h4>
                      <p>TP. Hồ Chí Minh</p>
                    </span>
                  </div>
                </div>
              </div>

              <div className="all-testimonials__box box-2">
                <span className="quotes-icon">
                  <i className="fa-solid fa-quote-right"></i>
                </span>
                <p>
                  “Nhân viên đại lý tư vấn nhiệt tình, quy trình đặt xe nhanh chóng và minh bạch. Tôi rất hài lòng vì không có chi phí phát sinh ngoài báo giá ban đầu.”
                </p>
                <div className="all-testimonials__box__name">
                  <div className="all-testimonials__box__name__profile">
                    <img src={Img3} alt="user_img" />
                    <span>
                      <h4>Chị Lan</h4>
                      <p>Hà Nội</p>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Testimonials;
