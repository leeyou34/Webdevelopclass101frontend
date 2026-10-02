import { useEffect } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router";
import { Box, Typography } from "@mui/material";
import { getToken, setUnauthorizedHandler } from "./api.js";
import LoginPage from "./pages/LoginPage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import TodoPage from "./pages/TodoPage.jsx";

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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
      <Typography component="footer" variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
        © {new Date().getFullYear()} Thomas Lee (leeyou34)
      </Typography>
    </Box>
  );
}
