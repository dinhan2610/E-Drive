import { Link } from "react-router-dom";
import type { FC } from "react";
import '../styles/HeroStyles/_hero.scss';

interface HeroPagesProps {
  name: string;
  showBreadcrumb?: boolean;
}

const HeroPages: FC<HeroPagesProps> = ({ name, showBreadcrumb = true }) => {
  return (
    <section className="hero-pages">
      <div className="hero-pages__overlay"></div>
      <div className="container">
        <div className="hero-pages__text">
          <h3>{name}</h3>
          {showBreadcrumb && (
            <p>
              <Link to="/">Home</Link> / {name}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default HeroPages;
