import Home from "./Pages/Home";
import Contact from "./Pages/Contact";
import Compare from "./Pages/Compare";
import ProductsPage from "./Pages/ProductsPage";
import ProductDetailPage from "./Pages/ProductDetailPage";
import QuoteListPage from "./Pages/QuoteListPage";
import DealerOrderPage from "./Pages/DealerOrderPage";
import DealerInventoryPage from "./Pages/DealerInventoryPage";
import SelectCarPage from "./Pages/SelectCarPage";
import ProfilePage from "./Pages/ProfilePage";
import AdminPage from "./Pages/AdminPage";
import CustomersPage from "./Pages/CustomersPage";
import StaffPage from "./Pages/StaffPage";
import TestDrivePage from "./Pages/TestDrivePage";
import TestDriveManagementPage from "./Pages/TestDriveManagementPage";
import OrderManagementPage from "./Pages/OrderManagementPage";
import PromotionsPage from "./Pages/PromotionsPage";
import PromotionDetailPage from "./Pages/PromotionDetailPage";
import PromotionFormPage from "./Pages/PromotionFormPage";
import ServiceAccessoryManagementPage from "./Pages/ServiceAccessoryManagementPage";
import FinancingPage from "./Pages/FinancingPage";
import FeedbackPage from "./Pages/FeedbackPage";
import ContractCreatePageNew from "./Pages/ContractCreatePage_new";
import ContractSignPage from "./Pages/ContractSignPage";
import CreateQuotePage from "./Pages/CreateQuotePage";
import Navbar from "../src/components/Navbar";
import Footer from "../src/components/Footer";
import ChatBox from "../src/components/ChatBox";
import ProtectedRoute from "../src/components/ProtectedRoute";
import { Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";



function App() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  const isCreateQuotePage = location.pathname === '/quotes/create';
  const isPromotionDetailPage = location.pathname.match(/^\/promotions\/\d+$/);
  const isPromotionFormPage = location.pathname.match(/^\/promotions\/(new|\d+\/edit)$/);

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Add/remove admin-page class to body
  useEffect(() => {
    if (isAdminPage) {
      document.body.classList.add('admin-page');
    } else {
      document.body.classList.remove('admin-page');
    }
    
    // Add/remove class for create quote page, promotion detail page, and promotion form page
    if (isCreateQuotePage || isPromotionDetailPage || isPromotionFormPage) {
      document.body.classList.add('no-navbar-page');
    } else {
      document.body.classList.remove('no-navbar-page');
    }
    
    // Cleanup
    return () => {
      document.body.classList.remove('admin-page');
      document.body.classList.remove('no-navbar-page');
    };
  }, [isAdminPage, isCreateQuotePage, isPromotionDetailPage, isPromotionFormPage]);

  return (
    <>
      {!isAdminPage && !isCreateQuotePage && !isPromotionDetailPage && !isPromotionFormPage && <Navbar />}
      <Routes>
        {/* Public Routes */}
        <Route index path="/" element={<Home />} />
        
        {/* Dealer Protected Routes - All routes except /admin */}
        <Route path="/products" element={
          <ProtectedRoute requiredRole="dealer">
            <ProductsPage />
          </ProtectedRoute>
        } />
        <Route path="/products/:id" element={
          <ProtectedRoute requiredRole="dealer">
            <ProductDetailPage />
          </ProtectedRoute>
        } />
        <Route path="/contact" element={
          <ProtectedRoute requiredRole="dealer">
            <Contact />
          </ProtectedRoute>
        } />
        <Route path="/compare-slots" element={
          <ProtectedRoute requiredRole="dealer">
            <Compare />
          </ProtectedRoute>
        } />
        <Route path="/promotions" element={
          <ProtectedRoute requiredRole="dealer">
            <PromotionsPage />
          </ProtectedRoute>
        } />
        <Route path="/promotions/new" element={
          <ProtectedRoute requiredRole="dealer">
            <PromotionFormPage />
          </ProtectedRoute>
        } />
        <Route path="/promotions/:id" element={
          <ProtectedRoute requiredRole="dealer">
            <PromotionDetailPage />
          </ProtectedRoute>
        } />
        <Route path="/promotions/:id/edit" element={
          <ProtectedRoute requiredRole="dealer">
            <PromotionFormPage />
          </ProtectedRoute>
        } />
        <Route path="/services-accessories" element={
          <ProtectedRoute requiredRole="dealer">
            <ServiceAccessoryManagementPage />
          </ProtectedRoute>
        } />
        <Route path="/installment" element={
          <ProtectedRoute requiredRole="dealer">
            <FinancingPage />
          </ProtectedRoute>
        } />
        <Route path="/quotes" element={
          <ProtectedRoute requiredRole="dealer">
            <QuoteListPage />
          </ProtectedRoute>
        } />
        <Route path="/quotes/create" element={
          <ProtectedRoute requiredRole="dealer">
            <CreateQuotePage />
          </ProtectedRoute>
        } />
        <Route path="/dealer-order" element={
          <ProtectedRoute requiredRole="dealer">
            <DealerOrderPage />
          </ProtectedRoute>
        } />
        <Route path="/dealer-inventory" element={
          <ProtectedRoute requiredRole="dealer">
            <DealerInventoryPage />
          </ProtectedRoute>
        } />
        <Route path="/select-car" element={
          <ProtectedRoute requiredRole="dealer">
            <SelectCarPage />
          </ProtectedRoute>
        } />
        <Route path="/test-drive" element={
          <ProtectedRoute requiredRole="dealer">
            <TestDrivePage />
          </ProtectedRoute>
        } />
        <Route path="/drive" element={
          <ProtectedRoute requiredRole="dealer">
            <TestDriveManagementPage />
          </ProtectedRoute>
        } />
        <Route path="/delivery-status" element={
          <ProtectedRoute requiredRole="dealer">
            <OrderManagementPage />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute requiredRole="dealer">
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/feedback" element={
          <ProtectedRoute requiredRole="dealer">
            <FeedbackPage />
          </ProtectedRoute>
        } />
        <Route path="/customers" element={
          <ProtectedRoute requiredRole="dealer">
            <CustomersPage />
          </ProtectedRoute>
        } />
        <Route path="/staff" element={
          <ProtectedRoute requiredRole="dealer">
            <StaffPage />
          </ProtectedRoute>
        } />
        
        {/* Admin Protected Routes - Only /admin */}
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="admin">
            <AdminPage />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/contracts/new" element={
          <ProtectedRoute requiredRole="admin">
            <ContractCreatePageNew />
          </ProtectedRoute>
        } />
        
        {/* Contract signing - accessible by both admin and dealer */}
        <Route path="/admin/contracts/sign/:contractId" element={
          <ProtectedRoute requiredRole="admin">
            <ContractSignPage />
          </ProtectedRoute>
        } />
        
        <Route path="/contracts/sign/:contractId" element={
          <ProtectedRoute>
            <ContractSignPage />
          </ProtectedRoute>
        } />
      </Routes>
      {!isAdminPage && !isCreateQuotePage && !isPromotionDetailPage && !isPromotionFormPage && <Footer />}
      {!isAdminPage && !isCreateQuotePage && !isPromotionDetailPage && !isPromotionFormPage && <ChatBox />}
    </>
  );
}

export default App;
