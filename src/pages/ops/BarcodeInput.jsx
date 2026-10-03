import { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Stack, TextField } from "@mui/material";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";

/** 짧은 "삑" 소리로 읽힘을 알려 줍니다(지원하지 않으면 조용히 넘어감). */
function beep(ok = true) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = beep.ctx || (beep.ctx = new Ctx());
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = ok ? 1200 : 300;
    g.gain.value = 0.08;
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + (ok ? 0.08 : 0.25));
  } catch {
    /* 소리 없이 진행 */
  }
}

/**
 * 바코드 입력칸.
 * - 휴대폰·노트북 카메라로 찍기(시리얼 라벨, 택배 송장 바코드)
 * - 블루투스·USB 바코드 스캐너는 키보드처럼 입력되므로 칸에 커서만 두면 됨(Enter로 확정)
 */
export default function BarcodeInput({ label = "바코드", placeholder, onCode, disabled, autoFocus = true }) {
  const [text, setText] = useState("");
  const [camera, setCamera] = useState(false);
  const [error, setError] = useState("");
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const lastRef = useRef({ code: "", at: 0 });
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;

  function emit(raw) {
    const code = (raw || "").trim();
    if (!code) return;
    const now = Date.now();
    if (lastRef.current.code === code && now - lastRef.current.at < 2500) return; // 같은 바코드 연속 인식 방지
    lastRef.current = { code, at: now };
    const ok = onCodeRef.current?.(code);
    beep(ok !== false);
  }

  useEffect(() => {
    if (!camera) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } } },
          videoRef.current,
          (result) => {
            if (result) emit(result.getText());
          },
        );
        if (cancelled) controls.stop();
        else controlsRef.current = controls;
      } catch (err) {
        setError(
          err?.name === "NotAllowedError"
            ? "카메라 사용이 허용되지 않았습니다. 브라우저 주소창의 권한 설정에서 카메라를 허용해 주세요."
            : "카메라를 켜지 못했습니다. 바코드 스캐너나 직접 입력을 이용해 주세요.",
        );
        setCamera(false);
      }
    })();
    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera]);

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <TextField
          label={label}
          placeholder={placeholder}
          value={text}
          disabled={disabled}
          autoFocus={autoFocus}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              emit(text);
              setText("");
            }
          }}
          size="small"
          fullWidth
          slotProps={{ htmlInput: { autoCapitalize: "characters", autoComplete: "off", spellCheck: false } }}
        />
        <Button
          variant={camera ? "contained" : "outlined"}
          startIcon={<PhotoCameraIcon />}
          onClick={() => {
            setError("");
            setCamera((v) => !v);
          }}
          disabled={disabled}
          sx={{ whiteSpace: "nowrap" }}
        >
          {camera ? "카메라 끄기" : "카메라"}
        </Button>
        <Button
          onClick={() => {
            emit(text);
            setText("");
          }}
          disabled={disabled || !text.trim()}
        >
          입력
        </Button>
      </Stack>
      {camera && (
        <Box sx={{ position: "relative", borderRadius: 1, overflow: "hidden", bgcolor: "#000", maxWidth: 480 }}>
          <video ref={videoRef} style={{ width: "100%", display: "block" }} muted playsInline />
          <Box
            sx={{
              position: "absolute",
              left: "10%",
              right: "10%",
              top: "42%",
              height: "16%",
              border: "2px solid rgba(255,255,255,.8)",
              borderRadius: 1,
              pointerEvents: "none",
            }}
          />
        </Box>
      )}
      {error && <Alert severity="warning">{error}</Alert>}
    </Stack>
  );
}
