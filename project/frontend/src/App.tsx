import 'leaflet/dist/leaflet.css';
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LoginForm from "./components/Shared/LoginForm";
import RegisterForm from "./components/Shared/RegisterForm";
import MainLayout from "./components/Layout/MainLayout";
import Loader from "./components/Shared/Loader";
import { useAuth } from "./contexts/AuthContext";
import { DonorLocationPage } from "./components/Hospital/DonorLocationPage";
import { DonorTokenResponse } from "./components/Donor/DonorTokenResponse";

const GoodbyeLoader = ({ name }: { name: string }) => (
  <div>
    <Loader />
    <div
      style={{
        position: "fixed",
        top: "60%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 10000,
        color: "#ff4d4f",
        fontSize: "1.5rem",
        fontWeight: "bold",
        textAlign: "center",
        width: "100vw",
      }}
    >
      Goodbye, {name}!
    </div>
  </div>
);

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  // Show loading while authentication is being checked
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div>Checking authentication...</div>
      </div>
    );
  }
  
  // Only redirect if we're done loading and there's no user
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

const App: React.FC = () => {
  const { loadingLogout, userName, user } = useAuth();

  if (loadingLogout && userName) {
    return <GoodbyeLoader name={userName} />;
  }

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <Routes>
        {/* Public route for donors to share location from an SMS link */}
        <Route path="/donor-location/:requestId/:donorId" element={<DonorLocationPage />} />
        
        {/* Public route for donors to respond to SMS tokens */}
        <Route path="/r/:token" element={<DonorTokenResponse />} />

        <Route 
          path="/login" 
          element={
            user ? (
              <Navigate
                to={
                  user.role === "admin"
                    ? "/admin-dashboard"
                    : "/hospital-dashboard"
                }
                replace
              />
            ) : (
              <LoginForm />
            )
          } 
        />
        <Route
          path="/register"
          element={
            user ? (
              <Navigate
                to={
                  user.role === "admin"
                    ? "/admin-dashboard"
                    : "/hospital-dashboard"
                }
                replace
              />
            ) : (
              <RegisterForm />
            )
          }
        />
        <Route
          path="/hospital-dashboard"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        />
        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        {/* Optionally, handle 404 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
};

export default App;
