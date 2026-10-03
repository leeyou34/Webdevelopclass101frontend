import { Outlet, useLocation, useNavigate } from "react-router";
import { AppBar, Box, Button, Container, Tab, Tabs, Toolbar, Typography } from "@mui/material";
import { HOME_LABEL, HOME_URL } from "../../homeLink.js";
import { signout } from "../../api.js";
import ChatWidget from "./ChatWidget.jsx";

const TABS = [
  ["/ops", "대시보드"],
  ["/ops/orders", "신청·발주·계산서"],
  ["/ops/deposits", "입금 대조"],
  ["/ops/scan", "바코드 스캔"],
  ["/ops/devices", "기기·사후 처리"],
  ["/ops/documents", "문서 출력"],
  ["/ops/report", "월 마감"],
  ["/ops/shops", "영업장"],
  ["/ops/activity", "작업 기록"],
];

export default function OpsLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const current = TABS.map(([p]) => p).filter((p) => pathname === p || pathname.startsWith(p + "/")).pop() || "/ops";

  return (
    <>
      <AppBar position="static" elevation={0}>
        <Toolbar sx={{ gap: 1 }}>
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1, fontWeight: 700 }}>
            모바일 프린터 운영관리
          </Typography>
          {HOME_URL && (
            <Button color="inherit" href={HOME_URL}>
              {HOME_LABEL}
            </Button>
          )}
          <Button color="inherit" onClick={() => navigate("/")}>
            할 일
          </Button>
          <Button
            color="inherit"
            onClick={() => {
              signout();
              navigate("/login", { replace: true });
            }}
          >
            로그아웃
          </Button>
        </Toolbar>
        <Tabs
          value={current}
          onChange={(_, v) => navigate(v)}
          variant="scrollable"
          scrollButtons="auto"
          textColor="inherit"
          slotProps={{ indicator: { style: { backgroundColor: "#fff" } } }}
          sx={{ px: 1 }}
        >
          {TABS.map(([path, label]) => (
            <Tab key={path} value={path} label={label} />
          ))}
        </Tabs>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Box>
          <Outlet />
        </Box>
      </Container>
      <ChatWidget />
    </>
  );
}
