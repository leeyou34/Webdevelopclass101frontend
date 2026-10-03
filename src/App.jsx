import { useEffect } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router";
import { Box, Typography } from "@mui/material";
import { getToken, setUnauthorizedHandler } from "./api.js";
import LoginPage from "./pages/LoginPage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import TodoPage from "./pages/TodoPage.jsx";
import OpsLayout from "./pages/ops/OpsLayout.jsx";
import DashboardPage from "./pages/ops/DashboardPage.jsx";
import OrdersPage from "./pages/ops/OrdersPage.jsx";
import DevicesPage from "./pages/ops/DevicesPage.jsx";
import ReportPage from "./pages/ops/ReportPage.jsx";
import ShopsPage from "./pages/ops/ShopsPage.jsx";
import ActivityPage from "./pages/ops/ActivityPage.jsx";
import ScanPage from "./pages/ops/ScanPage.jsx";
import DepositsPage from "./pages/ops/DepositsPage.jsx";
import DocumentsPage from "./pages/ops/DocumentsPage.jsx";

function RequireLogin({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const navigate = useNavigate();

  useEffect(() => {
    setUnauthorizedHandler(() => navigate("/login", { replace: true }));
  }, [navigate]);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Box sx={{ flex: 1 }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route
            path="/"
            element={
              <RequireLogin>
                <TodoPage />
              </RequireLogin>
            }
          />
          <Route
            path="/ops"
            element={
              <RequireLogin>
                <OpsLayout />
              </RequireLogin>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="devices" element={<DevicesPage />} />
            <Route path="report" element={<ReportPage />} />
            <Route path="shops" element={<ShopsPage />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route path="scan" element={<ScanPage />} />
            <Route path="deposits" element={<DepositsPage />} />
            <Route path="documents" element={<DocumentsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
      <Typography component="footer" variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
        © {new Date().getFullYear()} Thomas Lee (leeyou34)
      </Typography>
    </Box>
  );
}
