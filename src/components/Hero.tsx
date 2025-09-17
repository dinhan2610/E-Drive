import BgShape from "../images/hero/hero-bg.png";
import HeroCar from "../images/hero/main-car.png";
import { useEffect, useState, type FC } from "react";
import '../styles/HeroStyles/_index.scss';
import { BookCarModal } from "./BookCar";

const Hero: FC = () => {
  const [goUp, setGoUp] = useState<boolean>(false);
  const [isTestDriveModalOpen, setIsTestDriveModalOpen] = useState<boolean>(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTestDriveClick = () => {
    setIsTestDriveModalOpen(true);
  };

  const handleCloseTestDriveModal = () => {
    setIsTestDriveModalOpen(false);
  };

  useEffect(() => {
    const onPageScroll = () => {
      if (window.pageYOffset > 600) {
        setGoUp(true);
      } else {
        setGoUp(false);
      }
    };
    window.addEventListener("scroll", onPageScroll);

    return () => {
      window.removeEventListener("scroll", onPageScroll);
    };
  }, []);
  return (
    <section id="home" className="hero-section">
      <div className="container">
        <img className="bg-shape" src={BgShape} alt="bg-shape" />
        <div className="hero-content">
          <div className="hero-content__text">
            <h4> Đơn giản để bắt đầu hành trình xanh</h4>
            <h1>
              Đặt xe <span>nhanh chóng,</span>chăm sóc <span>tận tâm</span>
            </h1>
            <p>
              Hãy để E-Drive đồng hành cùng bạn lăn bánh về tương lai xanh, nơi công nghệ và sự bền vững gặp nhau.
              </p>
              <div className="hero-content__text__btns">
                <button
                  onClick={handleTestDriveClick}
                  className="hero-content__text__btns__book-ride"
                >
                  <i className="fa-solid fa-car"></i>
                  <span>Lái thử ngay </span>
                  <i className="fa-solid fa-arrow-right"></i>
                </button>
                <button 
                  className="hero-content__text__btns__learn-more"
                  onClick={() => window.scrollTo({ top: window.innerHeight, behavior: "smooth" })}
                >
                  <span>Tìm hiểu thêm</span>
                  <i className="fa-solid fa-play-circle"></i>
                </button>
              </div>
            </div>

            {/* img */}
            <img
              src={HeroCar}
              alt="car-img"
              className="hero-content__car-img"
            />
          </div>
        </div>

        {/* Test Drive Modal */}
        <BookCarModal 
          isOpen={isTestDriveModalOpen} 
          onClose={handleCloseTestDriveModal} 
        />

        {/* page up */}
        <div
          onClick={scrollToTop}
          className={`scroll-up ${goUp ? "show-scroll" : ""}`}
        >
          <i className="fa-solid fa-arrow-up"></i>
        </div>
      </section>
  );
}

export default Hero;
