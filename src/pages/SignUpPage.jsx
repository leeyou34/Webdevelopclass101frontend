import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router";
import { Button, Link, TextField, Typography } from "@mui/material";
import { signup } from "../api.js";
import AuthCard from "../components/AuthCard.jsx";

const EMPTY = { username: "", email: "", password: "", inviteCode: "" };

export default function SignUpPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.username.trim() || !form.email.trim() || !form.password) {
      setError("이름, 이메일, 비밀번호를 모두 입력해 주세요.");
      return;
    }
    if (form.password.length < 8) {
      setError("비밀번호는 8자 이상으로 입력해 주세요.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await signup({ ...form, email: form.email.trim() });
      navigate("/login", { state: { signedUp: true, email: form.email.trim() } });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title="회원가입"
      subtitle="가입하면 나만 볼 수 있는 할 일 목록이 생깁니다."
      error={error}
      onSubmit={handleSubmit}
      footer={
        <Typography variant="body2" align="center">
          이미 계정이 있나요?{" "}
          <Link component={RouterLink} to="/login">
            로그인
          </Link>
        </Typography>
      }
    >
      <TextField label="이름" autoComplete="name" value={form.username} onChange={update("username")} autoFocus fullWidth />
      <TextField label="이메일" type="email" autoComplete="email" value={form.email} onChange={update("email")} fullWidth />
      <TextField
        label="비밀번호"
        type="password"
        autoComplete="new-password"
        helperText="8자 이상"
        value={form.password}
        onChange={update("password")}
        fullWidth
      />
      <TextField
        label="초대 코드"
        helperText="체험판처럼 초대 코드가 필요한 경우에만 입력합니다."
        value={form.inviteCode}
        onChange={update("inviteCode")}
        fullWidth
      />
      <Button type="submit" variant="contained" size="large" disabled={busy} fullWidth>
        {busy ? "가입 중…" : "가입하기"}
      </Button>
    </AuthCard>
  );
}
