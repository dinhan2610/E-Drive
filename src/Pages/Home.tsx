import type { FC } from 'react';
import Hero from "../components/Hero";
import PlanTrip from "../components/PlanTrip";
import PickCar from "../components/PickCar";
import Banner from "../components/Banner";
import ChooseUs from "../components/ChooseUs";
import Testimonials from "../components/feedback";
import Faq from "../components/Faq";
import Download from "../components/Download";
import Footer from "../components/Footer";

interface HomeProps {}

const Home: FC<HomeProps> = () => {
  return (
    <>
      <Hero />
      <PlanTrip />
      <PickCar />
       <Download />
      
      <ChooseUs />
     
      <Testimonials />
      <Banner />
      <Faq />
      <Footer />
    </>
  );
}

export default Home;
