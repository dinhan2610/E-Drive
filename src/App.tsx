import Home from "./Pages/Home";
import Contact from "./Pages/Contact";
import Navbar from "../src/components/Navbar";
import ChatBox from "../src/components/ChatBox";
import { Route, Routes } from "react-router-dom";



function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route index path="/" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
      <ChatBox />
    </>
  );
}

export default App;
