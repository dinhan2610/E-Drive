import { FC } from 'react';
import SelectCar from "../images/plan/icon1.png";
import Contact from "../images/plan/icon2.png";
import Drive from "../images/plan/icon3.png";
import '../styles/PlanTripStyles/_index.scss';

const PlanTrip: FC = () => {
  return (
    <>
      <section className="plan-section">
        <div className="container">
          <div className="plan-container">
            <div className="plan-container__title">
              <h3>Khởi động hành trình xanh</h3>
              <h2>Xe điện thông minh – hiện đại – bền vững</h2>
            </div>

            <div className="plan-container__boxes">
              <div className="plan-container__boxes__box">
                <img src={SelectCar} alt="icon_img" />
                <h3>Công nghệ hiện đại</h3>
                <p>
                  Xe điện E-Drive được thiết kế với công nghệ pin tiên tiến, khả năng sạc nhanh và tầm hoạt động xa, mang lại trải nghiệm lái mượt mà và an toàn.
                </p>
              </div>

              <div className="plan-container__boxes__box">
                <img src={Contact} alt="icon_img" />
                <h3>Mạng lưới đại lý toàn quốc</h3>
                <p>
                  Hệ thống đại lý chính hãng phủ khắp các tỉnh thành, sẵn sàng hỗ trợ tư vấn, bảo hành và chăm sóc khách hàng mọi lúc, mọi nơi.
                </p>
              </div>

              <div className="plan-container__boxes__box">
                <img src={Drive} alt="icon_img" />
                <h3>Hướng đến tương lai xanh</h3>
                <p>
                  E-Drive cam kết mang đến giải pháp di chuyển thân thiện với môi trường, giảm phát thải và đồng hành cùng cộng đồng xây dựng lối sống bền vững.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default PlanTrip;
