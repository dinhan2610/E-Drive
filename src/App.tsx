import "../src/dist/styles.css";

import Home from "./Pages/Home";
import Navbar from "../src/components/Navbar";
import { Route, Routes } from "react-router-dom";



function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route index path="/" element={<Home />} />
        
        
        
        
      </Routes>
    </>
  );
}

export default App;
