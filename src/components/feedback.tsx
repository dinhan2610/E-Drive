import type { FC } from 'react';
import Img2 from "../images/testimonials/pfp1.jpg";
import Img3 from "../images/testimonials/pfp2.jpg";
import UserImg from "../images/testimonials/user.png";
import "../styles/TestimonialsStyles/_testimonials.scss";

interface TestimonialItem {
  id: number;
  content: string;
  rating: number;
  author: {
    name: string;
    location: string;
    avatar: string;
  };
}

interface StatItem {
  number: string;
  label: string;
  icon: string;
}

const Testimonials: FC = () => {
  const testimonials: TestimonialItem[] = [
    {
      id: 1,
      content: "Lần đầu tiên lái thử xe điện E-Drive, cảm giác cực kỳ êm và mạnh mẽ. Khả năng tăng tốc mượt mà, không tiếng ồn. Đây chắc chắn sẽ là chiếc xe tiếp theo của tôi!",
      rating: 5,
      author: {
        name: "Nguyễn Văn Minh",
        location: "TP. Hồ Chí Minh",
        avatar: Img2
      }
    },
    {
      id: 2,
      content: "Nhân viên tư vấn nhiệt tình, quy trình đặt xe nhanh chóng và minh bạch. Không có chi phí phát sinh, dịch vụ hậu mãi tuyệt vời.",
      rating: 5,
      author: {
        name: "Trần Thị Lan",
        location: "Hà Nội",
        avatar: Img3
      }
    },
    {
      id: 3,
      content: "Chi phí vận hành chỉ bằng 1/3 xe xăng, tiết kiệm được rất nhiều. Lại thân thiện môi trường, đầu tư rất đáng giá cho tương lai!",
      rating: 5,
      author: {
        name: "Lê Văn Tuấn",
        location: "Đà Nẵng",
        avatar: UserImg
      }
    }
  ];

  const stats: StatItem[] = [
    {
      number: "10,000+",
      label: "Khách hàng tin tưởng",
      icon: "fa-solid fa-users"
    },
    {
      number: "99%",
      label: "Hài lòng với dịch vụ",
      icon: "fa-solid fa-heart"
    },
    {
      number: "5★",
      label: "Đánh giá trung bình",
      icon: "fa-solid fa-star"
    },
    {
      number: "24/7",
      label: "Hỗ trợ khách hàng",
      icon: "fa-solid fa-headset"
    }
  ];

  return (
    <section className="testimonials-section">
      <div className="container">
        {/* Hero Section */}
        <div className="testimonials-hero">
          <div className="hero-badge">
            <i className="fa-solid fa-comments"></i>
            <span>Khách hàng nói gì về E-Drive</span>
          </div>
          <h2 className="hero-title">
            Niềm tin tạo nên <span className="highlight">hành trình</span>
          </h2>
          <p className="hero-description">
            Hàng nghìn khách hàng đã tin tưởng lựa chọn xe điện E-Drive. 
            Họ không chỉ trải nghiệm công nghệ hiện đại mà còn cảm nhận được sự tận tâm trong từng dịch vụ.
          </p>
        </div>

        {/* Stats Section */}
        <div className="stats-section">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-content">
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="testimonials-grid" role="list" aria-label="Customer testimonials">
          {testimonials.map((testimonial) => (
            <article key={testimonial.id} className="testimonial-card" role="listitem">
              <div className="card-header">
                <div className="rating">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <i key={i} className="fa-solid fa-star"></i>
                  ))}
                </div>
              </div>
              
              <blockquote className="testimonial-content">
                {testimonial.content}
              </blockquote>
              
              <div className="testimonial-author">
                <img 
                  src={testimonial.author.avatar} 
                  alt={`Avatar của ${testimonial.author.name}, khách hàng E-Drive tại ${testimonial.author.location}`}
                  className="author-avatar"
                  loading="lazy"
                  width="50"
                  height="50"
                />
                <div className="author-info">
                  <h4 className="author-name">{testimonial.author.name}</h4>
                  <p className="author-location">{testimonial.author.location}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
