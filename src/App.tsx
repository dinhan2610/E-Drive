import Home from "./Pages/Home";
import Contact from "./Pages/Contact";
import Compare from "./Pages/Compare";
import ProductsPage from "./Pages/ProductsPage";
import ProductDetailPage from "./Pages/ProductDetailPage";
import QuotePage from "./Pages/QuotePage";
import QuoteListPage from "./Pages/QuoteListPage";
import DealerOrderPage from "./Pages/DealerOrderPage";
import ProfilePage from "./Pages/ProfilePage";
import AdminPage from "./Pages/AdminPage";
import CustomersPage from "./Pages/CustomersPage";
import TestDrivePage from "./Pages/TestDrivePage";
import TestDriveManagementPage from "./Pages/TestDriveManagementPage";
import PromotionsPage from "./Pages/PromotionsPage";
import FinancingPage from "./Pages/FinancingPage";
import PaymentPage from "./Pages/payment/PaymentPage";
import PaymentReturnPage from "./Pages/payment/PaymentReturnPage";
import Navbar from "../src/components/Navbar";
import ChatBox from "../src/components/ChatBox";
import { Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";



function App() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  // Add/remove admin-page class to body
  useEffect(() => {
    if (isAdminPage) {
      document.body.classList.add('admin-page');
    } else {
      document.body.classList.remove('admin-page');
    }
    
    // Cleanup
    return () => {
      document.body.classList.remove('admin-page');
    };
  }, [isAdminPage]);

  return (
    <>
      {!isAdminPage && <Navbar />}
      <Routes>
        <Route index path="/" element={<Home />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/quote" element={<QuotePage />} />
        <Route path="/quotes" element={<QuoteListPage />} />
        <Route path="/dealer-order" element={<DealerOrderPage />} />
        <Route path="/test-drive" element={<TestDrivePage />} />
        <Route path="/drive" element={<TestDriveManagementPage />} />
        <Route path="/promotions" element={<PromotionsPage />} />
        <Route path="/installment" element={<FinancingPage />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/compare-slots" element={<Compare />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/orders/:orderId/payment" element={<PaymentPage />} />
        <Route path="/payment/vnpay-return" element={<PaymentReturnPage />} />
        <Route path="/payments/vnpay-return" element={<PaymentReturnPage />} />
      </Routes>
      {!isAdminPage && <ChatBox />}
    </>
  );
}

export default App;
