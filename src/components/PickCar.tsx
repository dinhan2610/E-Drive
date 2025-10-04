import { useState } from "react";
import { type FC } from "react";
import CarBox from "./CarBox";
import { CAR_DATA } from "../constants/CarDatas";
import '../styles/PickStyles/_pick.scss';

type CarSelector = 'FirstCar' | 'SecondCar' | 'ThirdCar' | 'FourthCar' | 'FifthCar' | 'SixthCar';
type ButtonType = 'btn1' | 'btn2' | 'btn3' | 'btn4' | 'btn5' | 'btn6' | '';

interface CarButton {
  id: ButtonType;
  carKey: CarSelector;
  label: string;
}

const PickCar: FC = () => {
  const [active, setActive] = useState<CarSelector>("SecondCar");
  const [colorBtn, setColorBtn] = useState<ButtonType>("btn1");

  const carButtons: CarButton[] = [
    { id: "btn1", carKey: "SecondCar", label: "Audi A1 S-Line" },
    { id: "btn2", carKey: "FirstCar", label: "VW Golf 6" },
    { id: "btn3", carKey: "ThirdCar", label: "Toyota Camry" },
    { id: "btn4", carKey: "FourthCar", label: "BMW 320 ModernLine" },
    { id: "btn5", carKey: "FifthCar", label: "Mercedes-Benz GLK" },
    { id: "btn6", carKey: "SixthCar", label: "VW Passat CC" }
  ];

  const handleCarSelect = (carKey: CarSelector, btnId: ButtonType) => {
    setActive(carKey);
    setColorBtn(btnId);
  };

  const getCarIndex = (): number => {
    const carMapping: Record<CarSelector, number> = {
      FirstCar: 0,
      SecondCar: 1,
      ThirdCar: 2,
      FourthCar: 3,
      FifthCar: 4,
      SixthCar: 5
    };
    return carMapping[active];
  };

  return (
    <section className="pick-section">
      <div className="container">
        <div className="pick-container">
          <div className="pick-container__title">
            <div className="title-badge">
              <i className="fa-solid fa-car"></i>
              <span>Đa dạng lựa chọn</span>
            </div>
            <h2>Bộ sưu tập xe điện E-Drive</h2>
            <div className="title-divider">
              <div className="divider-line"></div>
              <i className="fa-solid fa-bolt"></i>
              <div className="divider-line"></div>
            </div>
            <p className="section-subtitle">
              Khám phá dòng xe điện cao cấp với công nghệ tiên tiến, thiết kế hiện đại 
              và hiệu suất vượt trội cho mọi hành trình của bạn.
            </p>
          </div>

          <div className="pick-container__car-content">
            <div className="pick-box">
              {carButtons.map((button) => (
                <button
                  key={button.id}
                  className={`car-select-btn ${colorBtn === button.id ? "colored-button" : ""}`}
                  onClick={() => handleCarSelect(button.carKey, button.id)}
                  aria-label={`Chọn xe ${button.label}`}
                >
                  <span>{button.label}</span>
                  <i className="fa-solid fa-chevron-right"></i>
                </button>
              ))}
            </div>
            
            <div className="car-display">
              <CarBox data={CAR_DATA} carID={getCarIndex()} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PickCar;
