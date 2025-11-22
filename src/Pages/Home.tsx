import type { FC } from 'react';
import Hero from "../components/Hero";
import PlanTrip from "../components/PlanTrip";
import Banner from "../components/Banner";
import ChooseUs from "../components/ChooseUs";
import Testimonials from "../components/feedback";
import Faq from "../components/Faq";
import Download from "../components/Download";

interface HomeProps {}

const Home: FC<HomeProps> = () => {
  return (
    <>
      <Hero />
      <PlanTrip />
      <Download />
      
      <ChooseUs />
     
      <Testimonials />
      <Banner />
      <Faq />
    </>
  );
}

export default Home;
