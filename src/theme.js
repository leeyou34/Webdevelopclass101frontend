import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: { main: "#1f3a5f" },
    background: { default: "#f5f6f8" },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily:
      '"Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, -apple-system, sans-serif',
  },
});

export default theme;
