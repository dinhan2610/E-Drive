import Home from "./Pages/Home";
import Contact from "./Pages/Contact";
import Compare from "./Pages/Compare";
import ProductsPage from "./Pages/ProductsPage";
import ProfilePage from "./Pages/ProfilePage";
import Navbar from "../src/components/Navbar";
import ChatBox from "../src/components/ChatBox";
import { Route, Routes } from "react-router-dom";



function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route index path="/" element={<Home />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/compare-slots" element={<Compare />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
      <ChatBox />
    </>
  );
}

export default App;
