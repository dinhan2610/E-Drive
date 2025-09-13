import React from 'react';
import MainImg from "../images/chooseUs/main.png";
import Box1 from "../images/chooseUs/icon1.png";
import Box2 from "../images/chooseUs/icon2.png";
import Box3 from "../images/chooseUs/icon3.png";
import "../styles/ChooseStyles/_choose.scss";

interface InfoBox {
  img: string;
  title: string;
  description: string;
}

const ChooseUs: React.FC = () => {
  const infoBoxes: InfoBox[] = [
    {
      img: Box1,
      title: "Trải nghiệm tương lai",
      description: "Xe điện E-Drive mang đến hành trình xanh và an toàn."
    },
    {
      img: Box2,
      title: "Giá trị toàn diện",
      description: "Hỗ trợ toàn diện từ tư vấn, lái thử đến bảo hành."
    },
    {
      img: Box3,
      title: "Uy tín tuyệt đối",
      description: "Không ẩn phí, không phát sinh – cam kết minh bạch và tin cậy."
    }
  ];
  return (
    <>
      <section className="choose-section">
        <div className="container">
          <div className="choose-container">
            <img
              className="choose-container__img"
              src={MainImg}
              alt="car_img"
            />
            <div className="text-container">
              <div className="text-container__left">
                <h4>E-Drive – Lựa chọn thông minh</h4>
                <h2>Lái xe xanh, tiết kiệm, an toàn với hệ thống hỗ trợ và bảo hành toàn diện.</h2>
                <p>
                  E-Drive không chỉ mang đến những mẫu xe điện hiện đại với công nghệ pin tiên tiến, mà còn là hệ thống đại lý chính hãng phủ rộng toàn quốc, luôn sẵn sàng hỗ trợ bạn từ tư vấn, lái thử đến bảo hành. Chúng tôi cam kết đem lại trải nghiệm minh bạch, dịch vụ tận tâm và giải pháp di chuyển thân thiện với môi trường.
                </p>
                <a href="#home">
                  Xem chi tiết &nbsp;
                  <i className="fa-solid fa-angle-right"></i>
                </a>
              </div>
              <div className="text-container__right">
                {infoBoxes.map((box, index) => (
                  <div key={index} className="text-container__right__box">
                    <img src={box.img} alt={`icon-${index + 1}`} />
                    <div className="text-container__right__box__text">
                      <h4>{box.title}</h4>
                      <p>{box.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default ChooseUs;
