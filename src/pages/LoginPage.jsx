import { useState } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router";
import { Button, Link, TextField, Typography } from "@mui/material";
import { signin } from "../api.js";
import AuthCard from "../components/AuthCard.jsx";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const justSignedUp = Boolean(location.state?.signedUp);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("이메일과 비밀번호를 입력해 주세요.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await signin({ email: email.trim(), password });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title="로그인"
      subtitle={justSignedUp ? "가입이 끝났습니다. 로그인해 주세요." : "내 할 일 목록을 보려면 로그인하세요."}
      error={error}
      onSubmit={handleSubmit}
      footer={
        <Typography variant="body2" align="center">
          계정이 없나요?{" "}
          <Link component={RouterLink} to="/signup">
            회원가입
          </Link>
        </Typography>
      }
    >
      <TextField
        label="이메일"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoFocus
        fullWidth
      />
      <TextField
        label="비밀번호"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        fullWidth
      />
      <Button type="submit" variant="contained" size="large" disabled={busy} fullWidth>
        {busy ? "확인 중…" : "로그인"}
      </Button>
    </AuthCard>
  );
}
