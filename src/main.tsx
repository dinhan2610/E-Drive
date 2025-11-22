import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
// FontAwesome is loaded via CDN in index.html - no need to import here

// Helper function for testing - accessible via browser console
(window as any).clearAllData = () => {
  localStorage.clear();
  sessionStorage.clear();
  console.log('✅ All data cleared! Reloading...');
  setTimeout(() => window.location.reload(), 500);
};

// Log helper message in console
console.log('%c🔧 Dev Helper Commands', 'color: #ff4d30; font-size: 16px; font-weight: bold');
console.log('%cclearAllData()', 'color: #10B981; font-size: 14px', '- Clear all localStorage & sessionStorage');
console.log('%cExample: clearAllData()', 'color: #6c757d; font-size: 12px');

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
