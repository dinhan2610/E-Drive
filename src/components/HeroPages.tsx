import { Link } from "react-router-dom";
import { FC } from "react";
import '../styles/HeroStyles/_index.scss';

interface HeroPagesProps {
  name: string;
}

const HeroPages: FC<HeroPagesProps> = ({ name }) => {
  return (
    <>
      <section className="hero-pages">
        <div className="hero-pages__overlay"></div>
        <div className="container">
          <div className="hero-pages__text">
            <h3>{name}</h3>
            <p>
              <Link to="/">Home</Link> / {name}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

export default HeroPages;
